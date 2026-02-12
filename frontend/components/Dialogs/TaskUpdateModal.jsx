import React, { useState, useCallback, useRef } from 'react'
import { X, Paperclip, Upload, FileText, Send, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { createTaskUpdateRequest } from '@/lib/http/task'
import BigDialog from './BigDialog'
import InternalDocumentSelector from '../InternalDocumentSelector'
import moment from 'moment'

const TaskUpdateModal = ({ isOpen, onClose, task, onUpdateCreated }) => {
    const [content, setContent] = useState('')
    const [selectedFiles, setSelectedFiles] = useState([])
    const [selectedInternalDocs, setSelectedInternalDocs] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showInternalDocSelector, setShowInternalDocSelector] = useState(false)
    const fileInputRef = useRef(null)

    const handleFileSelect = useCallback((e) => {
        const files = Array.from(e.target.files || [])
        const validFiles = files.filter(file => {
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`)
                return false
            }
            return true
        })
        setSelectedFiles(prev => [...prev, ...validFiles])
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [])

    const handleRemoveFile = useCallback((index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }, [])

    const handleRemoveInternalDoc = useCallback((index) => {
        setSelectedInternalDocs(prev => prev.filter((_, i) => i !== index))
    }, [])

    const handleInternalDocSelect = useCallback((doc) => {
        setSelectedInternalDocs(prev => [...prev, doc])
        setShowInternalDocSelector(false)
    }, [])

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleSubmit = useCallback(async () => {
        if (!content.trim()) {
            toast.error('Please enter update content')
            return
        }

        if (!task?.task_id) {
            toast.error('Task information is missing')
            return
        }

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('task_id', task.task_id)
            formData.append('content', content.trim())

            // Add files (optional - only if files are selected)
            if (selectedFiles.length > 0) {
                selectedFiles.forEach((file, index) => {
                    formData.append('files', file)
                })
            }

            // Add internal documents (optional - only if documents are selected)
            if (selectedInternalDocs.length > 0) {
                for (const doc of selectedInternalDocs) {
                    try {
                        const fileResponse = await fetch(doc.path)
                        const fileData = await fileResponse.arrayBuffer()
                        const blob = new Blob([fileData], { type: 'application/pdf' })
                        formData.append('files', blob, doc.name)
                    } catch (error) {
                        console.error('Error fetching internal document:', error)
                        toast.error(`Failed to attach ${doc.name}`)
                    }
                }
            }

            const response = await createTaskUpdateRequest(formData)
            toast.success(response?.data?.message || 'Update created successfully')
            
            // Reset form
            setContent('')
            setSelectedFiles([])
            setSelectedInternalDocs([])
            
            // Callback to refresh updates
            if (onUpdateCreated) {
                onUpdateCreated()
            }
            
            onClose()
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || 'Failed to create update')
        } finally {
            setIsSubmitting(false)
        }
    }, [content, task, selectedFiles, selectedInternalDocs, onUpdateCreated, onClose])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <>
            <BigDialog open={isOpen} onClose={onClose} width={50}>
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Post Update</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Share progress and updates for task: <span className="font-semibold">{task?.name}</span>
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {/* Content Textarea */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Update Content <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                className="w-full text-gray-900 placeholder:text-gray-500 outline-none border border-gray-300 rounded-lg bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                                placeholder="Enter your update (you can use lists, paragraphs, etc.)..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={8}
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Press Ctrl+Enter (Cmd+Enter on Mac) to submit
                            </p>
                        </div>

                        {/* File Attachments */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Attachments (Optional)
                            </label>
                            <div className="flex items-center gap-2 flex-wrap">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload Files
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowInternalDocSelector(true)}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-3 py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FileText className="w-4 h-4" />
                                    Internal Documents
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum file size: 10MB per file
                            </p>
                        </div>

                        {/* Selected Files Preview */}
                        {(selectedFiles.length > 0 || selectedInternalDocs.length > 0) && (
                            <div className="space-y-2">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <Paperclip className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-blue-900 truncate">{file.name}</p>
                                                <p className="text-xs text-blue-600">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(index)}
                                            disabled={isSubmitting}
                                            className="p-1 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                ))}
                                {selectedInternalDocs.map((doc, index) => (
                                    <div key={`internal-${index}`} className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded-lg">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-purple-900 truncate">{doc.name}</p>
                                                <p className="text-xs text-purple-600">Internal Document</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveInternalDoc(index)}
                                            disabled={isSubmitting}
                                            className="p-1 hover:bg-purple-100 rounded transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !content.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Send Update</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </BigDialog>

            {/* Internal Document Selector */}
            {showInternalDocSelector && task?.project_id && (
                <InternalDocumentSelector
                    isOpen={showInternalDocSelector}
                    onClose={() => setShowInternalDocSelector(false)}
                    onSelect={handleInternalDocSelect}
                    projectId={task.project_id}
                    phase={task.phase}
                />
            )}
        </>
    )
}

export default TaskUpdateModal

