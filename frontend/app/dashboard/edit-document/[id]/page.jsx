'use client'
import React, { useState, useEffect, useRef, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, X, RefreshCw, User, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import dynamic from 'next/dynamic';
import Loader from '@/components/Loader';
import mammoth from 'mammoth';
import { updateFileRequest, sendToLawyerRequest, getTemplateFileRequest } from '@/lib/http/project';
import { getMySubmissionsRequest } from '@/lib/http/review';
import { toast } from 'react-toastify';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

import { resubmitDocumentRequest } from '@/lib/http/review';

const EditDocumentPage = ({ params, searchParams }) => {
    const { id } = use(params);
    const { file, filename, media_id, file_id, t_document_id, status, rejection_reason, mimeType } = use(searchParams);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [documentInfo, setDocumentInfo] = useState({
        filename: filename || 'Untitled',
        isDocx: false
    });
    const editor = useRef(null);
    const router = useRouter();
    const [documentData, setDocumentData] = useState(null);
    const [lastEditedBy, setLastEditedBy] = useState(null);
    const [lastEditedAt, setLastEditedAt] = useState(null);
    const [documentOwner, setDocumentOwner] = useState(null);
    const [hasNewChanges, setHasNewChanges] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const config = useMemo(() => ({
        readonly: false,
        height: '75vh',
        width: '100%',
        enableDragAndDropFileToEditor: true,
        buttons: [
            'source', '|',
            'bold', 'strikethrough', 'underline', 'italic', '|',
            'ul', 'ol', '|',
            'outdent', 'indent', '|',
            'font', 'fontsize', 'brush', 'paragraph', '|',
            'image', 'table', 'link', '|',
            'align', 'undo', 'redo', '|',
            'hr', 'eraser', 'copyformat', '|',
            'fullsize', 'print', 'about'
        ],
        uploader: {
            insertImageAsBase64URI: true
        },
        removeButtons: ['file'],
        showXPathInStatusbar: false,
        showCharsCounter: true,
        showWordsCounter: true,
        toolbarAdaptive: false,
        placeholder: 'Start typing...'
    }), []);

    useEffect(() => {
        const fetchContent = async () => {
            // Always fetch the latest document data from server if we have t_document_id
            // This ensures we get the most up-to-date file_url even if lawyer made changes
            const docId = t_document_id || id;
            let fileUrl = null; // Start with null to force fresh fetch
            let fileName = filename;
            let fileMimeType = mimeType;

            // Check if id is a UUID (t_document_id format)
            const isTDocumentId = docId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId);

            if (isTDocumentId) {
                try {
                    // ALWAYS fetch fresh data from server to get latest file_url
                    // This is critical - we never use the file param for t_documents
                    // because the lawyer might have updated it
                    const response = await getMySubmissionsRequest();
                    if (response.data.success && response.data.documents) {
                        const doc = response.data.documents.find(d => d.t_document_id === docId);
                        if (doc && doc.file_url) {
                            // ALWAYS use the fresh data from server (this will have the latest file_url)
                            fileUrl = doc.file_url;
                            fileName = doc.filename || fileName;
                            fileMimeType = doc.mimeType || fileMimeType;
                            setDocumentData(doc);
                            
                            // Track who last edited the document
                            if (doc.reviewer && doc.reviewed_at) {
                                // Lawyer edited it
                                setLastEditedBy(doc.reviewer.name || 'Lawyer');
                                setLastEditedAt(doc.reviewed_at);
                            } else if (doc.user) {
                                // User created/edited it
                                setLastEditedBy(doc.user.name || 'You');
                                setLastEditedAt(doc.created_at);
                            }
                            
                            // Set document owner
                            if (doc.user) {
                                setDocumentOwner(doc.user.name || 'Unknown');
                            }
                            
                            // Check if document was updated since last load
                            const storedLastEdit = localStorage.getItem(`doc_last_edit_${docId}`);
                            const currentEditTime = doc.reviewed_at || doc.created_at;
                            if (storedLastEdit) {
                                const storedTime = new Date(storedLastEdit);
                                const currentTime = new Date(currentEditTime);
                                if (currentTime > storedTime) {
                                    setHasNewChanges(true);
                                }
                            }
                            
                            // Store current edit time
                            localStorage.setItem(`doc_last_edit_${docId}`, 
                                new Date(currentEditTime).toISOString()
                            );
                            
                            console.log('✅ Fetched fresh document data from server:', { 
                                fileUrl, 
                                fileName, 
                                fileMimeType,
                                docId,
                                lastEditedBy: doc.reviewer?.name || doc.user?.name,
                                lastEditedAt: doc.reviewed_at || doc.created_at
                            });
                        } else {
                            console.warn('⚠️ Document not found or missing file_url:', docId);
                            // If document found but no file_url, try URL params as last resort
                            if (file) {
                                fileUrl = file;
                                console.log('⚠️ Using file from URL params as fallback');
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Error fetching document data:', error);
                    // Fall back to URL params only if fetch completely fails
                    if (file) {
                        fileUrl = file;
                        console.log('⚠️ Using file from URL params due to fetch error');
                    }
                }
            } else {
                // This is a File record (file_id), not a TDocument
                // But we should check if there's a corresponding TDocument that was updated more recently
                // This handles the case where lawyer edited a TDocument that was originally a File
                try {
                    const response = await getMySubmissionsRequest();
                    if (response.data.success && response.data.documents) {
                        // Try to find a TDocument with matching filename
                        // If found and it was reviewed/updated, use its file_url instead
                        const matchingTDoc = response.data.documents.find(d => 
                            d.filename === fileName && 
                            d.file_url && 
                            (d.reviewed_at || d.created_at) // Has been reviewed or created
                        );
                        
                        if (matchingTDoc && matchingTDoc.file_url) {
                            // Use the TDocument's file_url as it's likely more recent
                            fileUrl = matchingTDoc.file_url;
                            fileMimeType = matchingTDoc.mimeType || fileMimeType;
                            console.log('✅ Found corresponding TDocument, using its file_url:', {
                                fileUrl,
                                fileName: matchingTDoc.filename,
                                reviewedAt: matchingTDoc.reviewed_at
                            });
                        } else {
                            // No matching TDocument, use the File's path
                            fileUrl = file;
                            console.log('ℹ️ No matching TDocument found, using File path');
                        }
                    } else {
                        // Fallback to file param if fetch fails
                        fileUrl = file;
                    }
                } catch (error) {
                    console.error('❌ Error checking for TDocument:', error);
                    // Fallback to file param
                    fileUrl = file;
                }
            }

            if (fileUrl) {
                try {
                    const isDocx = fileName?.toLowerCase().endsWith('.docx') ||
                        fileName?.includes('wordprocessingml') ||
                        fileMimeType?.includes('wordprocessingml');

                    setDocumentInfo({
                        filename: fileName || 'Untitled',
                        isDocx
                    });

                    if (isDocx) {
                        // Add cache-busting parameter and use no-cache headers
                        const urlWithCache = fileUrl + (fileUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
                        const response = await fetch(urlWithCache, {
                            cache: 'no-store',
                            headers: {
                                'Cache-Control': 'no-cache, no-store, must-revalidate',
                                'Pragma': 'no-cache'
                            }
                        });
                        const arrayBuffer = await response.arrayBuffer();
                        const result = await mammoth.convertToHtml({ arrayBuffer });
                        setContent(result.value);
                    } else {
                        // Assume text/html - add cache-busting parameter and use no-cache headers
                        const urlWithCache = fileUrl + (fileUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
                        const response = await fetch(urlWithCache, {
                            cache: 'no-store',
                            headers: {
                                'Cache-Control': 'no-cache, no-store, must-revalidate',
                                'Pragma': 'no-cache'
                            }
                        });
                        const text = await response.text();
                        setContent(text);
                    }
                } catch (error) {
                    console.error('Error fetching document content:', error);
                    toast.error('Error loading content. Please check if the file is accessible.');
                    setContent('Error loading content. Please check if the file is accessible.');
                }
            } else {
                toast.error('Document file URL not found. Please try again.');
                setContent('Document file URL not found.');
            }
            setIsLoading(false);
        };

        fetchContent();
    }, [file, filename, t_document_id, id, mimeType, refreshKey]);
    
    // Auto-refresh to check for updates from other users
    useEffect(() => {
        const docId = t_document_id || id;
        if (!docId) return;
        
        const isTDocumentId = docId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId);
        
        if (isTDocumentId) {
            // Check for updates every 10 seconds
            const interval = setInterval(async () => {
                try {
                    const response = await getMySubmissionsRequest();
                    if (response.data.success && response.data.documents) {
                        const doc = response.data.documents.find(d => d.t_document_id === docId);
                        if (doc) {
                            const storedLastEdit = localStorage.getItem(`doc_last_edit_${docId}`);
                            const currentEditTime = doc.reviewed_at || doc.created_at;
                            if (storedLastEdit) {
                                const storedTime = new Date(storedLastEdit);
                                const currentTime = new Date(currentEditTime);
                                if (currentTime > storedTime) {
                                    // Document was updated by someone else
                                    setHasNewChanges(true);
                                    // Update last edited info
                                    if (doc.reviewer && doc.reviewed_at) {
                                        setLastEditedBy(doc.reviewer.name || 'Lawyer');
                                        setLastEditedAt(doc.reviewed_at);
                                    } else if (doc.user) {
                                        setLastEditedBy(doc.user.name || 'User');
                                        setLastEditedAt(doc.created_at);
                                    }
                                    toast.info('📄 Document has been updated. Refreshing...', {
                                        autoClose: 3000
                                    });
                                    // Refresh the content
                                    setRefreshKey(prev => prev + 1);
                                }
                            }
                            // Update stored time
                            localStorage.setItem(`doc_last_edit_${docId}`, 
                                new Date(currentEditTime).toISOString()
                            );
                        }
                    }
                } catch (error) {
                    console.error('Error checking for document updates:', error);
                }
            }, 10000); // Check every 10 seconds
            
            return () => clearInterval(interval);
        }
    }, [t_document_id, id]);

    const handleSave = async (silent = false) => {
        setIsSaving(true);
        try {
            // Get current content from editor instance to ensure we have the latest content
            // Wait a bit to ensure editor has synced
            let currentContent = content;
            if (editor.current) {
                // Try to get content from editor, with fallback to state
                const editorContent = editor.current.value;
                if (editorContent && editorContent.trim() !== '') {
                    currentContent = editorContent;
                } else {
                    currentContent = content;
                }
            }

            // Validate content is not empty
            if (!currentContent || (typeof currentContent === 'string' && currentContent.trim() === '')) {
                toast.error('❌ Document content is empty. Please add some content before saving.');
                setIsSaving(false);
                return false;
            }

            const formData = new FormData();

            // For DOCX files, send HTML content to backend for conversion
            if (documentInfo.isDocx) {
                formData.append('htmlContent', currentContent);
                formData.append('isDocx', 'true');
                formData.append('filename', documentInfo.filename || 'document.docx');
            } else {
                // For HTML files, create a file from the content
                const fname = documentInfo.filename || 'document.html';
                const fileToUpload = new File([currentContent], fname, { type: 'text/html' });
                formData.append('file', fileToUpload);
            }

            // Add ID based on type (TDocument, Media, or File)
            // Priority: t_document_id > media_id > file_id > id (with UUID check)
            let hasId = false;
            if (t_document_id && t_document_id !== 'undefined' && t_document_id !== 'null') {
                formData.append('t_document_id', t_document_id);
                hasId = true;
                console.log('📝 Saving with t_document_id:', t_document_id);
            } else if (media_id && media_id !== 'undefined' && media_id !== 'null') {
                formData.append('media_id', media_id);
                hasId = true;
                console.log('📝 Saving with media_id:', media_id);
            } else if (file_id && file_id !== 'undefined' && file_id !== 'null') {
                formData.append('file_id', file_id);
                hasId = true;
                console.log('📝 Saving with file_id:', file_id);
            } else if (id) {
                // If id is a t_document_id (UUID format), use it as t_document_id
                // Otherwise, assume it's a file_id
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                if (isUUID) {
                    formData.append('t_document_id', id);
                    hasId = true;
                    console.log('📝 Saving with id as t_document_id:', id);
                } else {
                    formData.append('file_id', id);
                    hasId = true;
                    console.log('📝 Saving with id as file_id:', id);
                }
            }

            if (!hasId) {
                toast.error('❌ Cannot save: Document ID not found. Please try refreshing the page.');
                setIsSaving(false);
                return false;
            }

            console.log('📤 Sending save request with:', {
                hasHtmlContent: documentInfo.isDocx,
                hasFile: !documentInfo.isDocx,
                contentLength: currentContent?.length || 0
            });

            const response = await updateFileRequest(formData);

            if (response.data.success) {
                if (!silent) {
                    toast.success('✅ Document saved successfully');
                }
                // Update last edited time in localStorage
                const docId = t_document_id || id;
                if (docId) {
                    localStorage.setItem(`doc_last_edit_${docId}`, new Date().toISOString());
                }
                // Update content state to reflect saved version
                if (editor.current) {
                    setContent(editor.current.value);
                }
                // Don't immediately refresh - let user continue editing
                // Only refresh if there are new changes detected
                console.log('✅ Document saved successfully');
                return true;
            } else {
                console.error('❌ Save failed:', response.data);
                toast.error(response.data?.message || 'Failed to save document');
                return false;
            }
        } catch (error) {
            console.error('Error saving document:', error);
            toast.error(error?.response?.data?.message || 'Failed to save document');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendToLawyer = async () => {
        const description = window.prompt("Please enter a description for this file:");
        if (!description) {
            toast.error('❌ Description is required');
            return;
        }

        setIsSaving(true);
        try {
            // Get current content from editor instance to ensure we have the latest content
            let currentContent = content;
            if (editor.current) {
                currentContent = editor.current.value || content;
            }

            // Validate content is not empty
            if (!currentContent || currentContent.trim() === '') {
                toast.error('❌ Document content is empty. Please add some content before sending.');
                setIsSaving(false);
                return;
            }

            const formData = new FormData();

            // For DOCX files, send HTML content to backend for conversion
            if (documentInfo.isDocx) {
                formData.append('htmlContent', currentContent);
                formData.append('isDocx', 'true');
                formData.append('filename', documentInfo.filename || 'document.docx');
            } else {
                // For HTML files, create a file from the content
                const fname = documentInfo.filename || 'document.html';
                const fileToUpload = new File([currentContent], fname, { type: 'text/html' });
                formData.append('file', fileToUpload);
            }

            formData.append('description', description);

            const response = await sendToLawyerRequest(formData);

            if (response.data.success) {
                toast.success('✅ Document sent to lawyer successfully');
                router.push('/dashboard/template-documents');
            }
        } catch (error) {
            console.error('Error sending document to lawyer:', error);
            toast.error(error?.response?.data?.message || 'Failed to send document to lawyer');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResubmit = async () => {
        if (window.confirm('Are you sure you want to resubmit this document?')) {
            setIsSaving(true);
            try {
                // Save first
                const saved = await handleSave(true);
                if (!saved) return;

                await resubmitDocumentRequest(file_id || id);
                toast.success('✅ Document resubmitted successfully');
                router.push('/dashboard/template-documents');
            } catch (error) {
                console.error('Error resubmitting document:', error);
                toast.error(error?.response?.data?.message || 'Failed to resubmit document');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <main className="flex-1 overflow-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleBack}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Go back"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-800">
                                    Edit Document
                                </h1>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <p>{documentInfo.filename}</p>
                                    {lastEditedBy && (
                                        <>
                                            <span className="text-gray-300">•</span>
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                <span>Last edited by {lastEditedBy}</span>
                                            </div>
                                        </>
                                    )}
                                    {lastEditedAt && (
                                        <>
                                            <span className="text-gray-300">•</span>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{new Date(lastEditedAt).toLocaleString()}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button
                                onClick={() => handleSave(false)}
                                disabled={isSaving || isLoading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save
                                    </>
                                )}
                            </Button>

                            {status === 'REJECTED' ? (
                                <Button
                                    onClick={handleResubmit}
                                    disabled={isSaving || isLoading}
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Resubmit
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleSendToLawyer}
                                        disabled={isSaving || isLoading}
                                        className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Send to Lawyer
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* New Changes Banner */}
            {hasNewChanges && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Document Updated</h3>
                                <p className="text-sm text-blue-700">
                                    This document has been updated by {lastEditedBy || 'someone'}. The latest version is now loaded.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setHasNewChanges(false);
                                setRefreshKey(prev => prev + 1);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            )}

            {/* Rejection Banner */}
            {status === 'REJECTED' && rejection_reason && (
                <div className="bg-red-50 border-b border-red-200 px-4 py-3">
                    <div className="max-w-7xl mx-auto flex items-start">
                        <div className="flex-shrink-0">
                            <X className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Document Rejected</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>Reason: {rejection_reason}</p>
                                {lastEditedBy && (
                                    <p className="mt-1 text-xs text-red-600">
                                        Last edited by {lastEditedBy} - You can see their changes and edit again.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-96">
                            <Loader />
                        </div>
                    ) : (
                        <div className="overflow-y-auto">
                            <JoditEditor
                                ref={editor}
                                value={content}
                                config={config}
                                onBlur={newContent => setContent(newContent)}
                                onChange={newContent => setContent(newContent)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default EditDocumentPage;

