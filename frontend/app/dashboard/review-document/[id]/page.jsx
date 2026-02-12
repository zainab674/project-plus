'use client'
import React, { useState, useEffect, useRef, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Save } from 'lucide-react';
import { Button } from '@/components/Button';
import dynamic from 'next/dynamic';
import Loader from '@/components/Loader';
import mammoth from 'mammoth';
import { updateFileRequest } from '@/lib/http/project';
import { acceptDocumentRequest, rejectDocumentRequest } from '@/lib/http/review';
import { toast } from 'react-toastify';
import BigDialog from '@/components/Dialogs/BigDialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const ReviewDocumentPage = ({ params, searchParams }) => {
    const { id } = use(params);
    const { file, filename } = use(searchParams);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [documentInfo, setDocumentInfo] = useState({
        filename: filename || 'Untitled',
        isDocx: false
    });
    const editor = useRef(null);
    const router = useRouter();

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
            if (file) {
                try {
                    const isDocx = filename?.toLowerCase().endsWith('.docx') ||
                        filename?.includes('wordprocessingml');

                    setDocumentInfo({
                        filename: filename || 'Untitled',
                        isDocx
                    });

                    if (isDocx) {
                        const response = await fetch(file);
                        const arrayBuffer = await response.arrayBuffer();
                        const result = await mammoth.convertToHtml({ arrayBuffer });
                        setContent(result.value);
                    } else {
                        // Assume text/html
                        const response = await fetch(file);
                        const text = await response.text();
                        setContent(text);
                    }
                } catch (error) {
                    console.error('Error fetching document content:', error);
                    toast.error('Error loading content. Please check if the file is accessible.');
                    setContent('Error loading content. Please check if the file is accessible.');
                }
            }
            setIsLoading(false);
        };

        fetchContent();
    }, [file, filename]);

    const handleSave = async (silent = false) => {
        setIsSaving(true);
        try {
            let currentContent = content;
            if (editor.current) {
                currentContent = editor.current.value || content;
            }

            if (!currentContent || currentContent.trim() === '') {
                toast.error('❌ Document content is empty.');
                setIsSaving(false);
                return false;
            }

            const formData = new FormData();

            if (documentInfo.isDocx) {
                formData.append('htmlContent', currentContent);
                formData.append('isDocx', 'true');
                formData.append('filename', documentInfo.filename || 'document.docx');
            } else {
                const fname = documentInfo.filename || 'document.html';
                const fileToUpload = new File([currentContent], fname, { type: 'text/html' });
                formData.append('file', fileToUpload);
            }

            // Use t_document_id for update
            formData.append('t_document_id', id);

            const response = await updateFileRequest(formData);

            if (response.data.success) {
                if (!silent) toast.success('✅ Document saved successfully');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error saving document:', error);
            toast.error(error?.response?.data?.message || 'Failed to save document');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleAccept = async () => {
        if (window.confirm('Are you sure you want to accept this document?')) {
            setIsSaving(true);
            try {
                // Save first
                const saved = await handleSave(true);
                if (!saved) return;

                await acceptDocumentRequest(id);
                toast.success('✅ Document approved successfully');
                router.push('/dashboard/lawyer-documents');
            } catch (error) {
                toast.error(error?.response?.data?.message || 'Failed to approve document');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleRejectClick = () => {
        setShowRejectDialog(true);
    };

    const handleConfirmReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setIsSaving(true);
        try {
            // Save first
            const saved = await handleSave(true);
            if (!saved) return;

            await rejectDocumentRequest(id, rejectionReason);
            toast.success('❌ Document rejected');
            setShowRejectDialog(false);
            router.push('/dashboard/lawyer-documents');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to reject document');
        } finally {
            setIsSaving(false);
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
                                    Review Document
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {documentInfo.filename}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button
                                onClick={() => handleSave(false)}
                                disabled={isSaving || isLoading}
                                variant="outline"
                                className="px-4 py-2 flex items-center"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Draft
                            </Button>
                            <Button
                                onClick={handleRejectClick}
                                disabled={isSaving || isLoading}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                            <Button
                                onClick={handleAccept}
                                disabled={isSaving || isLoading}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Accept
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

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

            {/* Reject Dialog */}
            <BigDialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4 text-black">Reject Document</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason" className="text-black">Reason for Rejection</Label>
                            <Textarea
                                id="reason"
                                placeholder="Please explain what needs to be changed..."
                                className="w-full text-black min-h-[100px]"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmReject}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Rejecting...' : 'Confirm Rejection'}
                            </Button>
                        </div>
                    </div>
                </div>
            </BigDialog>
        </main>
    );
};

export default ReviewDocumentPage;
