import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../Button';
import dynamic from 'next/dynamic';
import Loader from '../Loader';
import mammoth from 'mammoth';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const DocumentEditorModal = ({ document, onClose, onSave }) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const editor = useRef(null);

    const config = useMemo(() => ({
        readonly: false,
        height: '65vh',
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
        showCharsCounter: false,
        showWordsCounter: false,
        toolbarAdaptive: false,
        placeholder: 'Start typing...'
    }), []);

    useEffect(() => {
        const fetchContent = async () => {
            if (document?.file_url) {
                try {
                    const isDocx = document.filename?.toLowerCase().endsWith('.docx') ||
                        document.mimeType?.includes('wordprocessingml');

                    if (isDocx) {
                        const response = await fetch(document.file_url);
                        const arrayBuffer = await response.arrayBuffer();
                        const result = await mammoth.convertToHtml({ arrayBuffer });
                        setContent(result.value);
                    } else {
                        // Assume text/html
                        const response = await fetch(document.file_url);
                        const text = await response.text();
                        setContent(text);
                    }
                } catch (error) {
                    console.error('Error fetching document content:', error);
                    setContent('Error loading content. Please check if the file is accessible.');
                }
            }
            setIsLoading(false);
        };

        fetchContent();
    }, [document]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const isDocx = document.filename?.toLowerCase().endsWith('.docx') ||
                document.mimeType?.includes('wordprocessingml');

            // Get current content from editor instance to ensure we have the latest content
            let currentContent = content;
            if (editor.current) {
                currentContent = editor.current.value || content;
            }

            // Validate content is not empty
            if (!currentContent || currentContent.trim() === '') {
                alert('❌ Document content is empty. Please add some content before saving.');
                setIsSaving(false);
                return;
            }

            let contentToSave = currentContent;

            if (isDocx) {
                // For DOCX files, send HTML content to backend for conversion
                // Backend will handle the conversion using the reliable docx library
                contentToSave = currentContent; // Keep as HTML, backend will convert
            }

            await onSave(contentToSave, isDocx);
        } catch (error) {
            console.error('Error saving document:', error);
            alert('❌ Error saving document: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-7xl w-full mx-4 h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                            Edit Document: {document?.filename || 'Untitled'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {document?.description || 'No description'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto">
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

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                    <Button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
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
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DocumentEditorModal;
