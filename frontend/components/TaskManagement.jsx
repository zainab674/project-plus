import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import moment from 'moment';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/Button"
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar'
import { AvatarImage } from "@/components/ui/avatar"
import { formatDate } from "@/utils/formatDate"
import { getColorByFirstLetter } from "@/utils/getColorByFirstLetter"
import { createTimeRequest, stopTimeRequest, updateTaskRequest, deleteTaskRequest } from "@/lib/http/task"
import { createReviewRequest, updateReviewRequest, getTaskReviewsRequest } from "@/lib/http/review"
import RenderMembers from "./RenderMembers"
import Timer from "./Timer"
import BigDialog from "./Dialogs/BigDialog"
import AddWorkDescription from "./AddWorkDescription"
import InternalDocumentSelector from "./InternalDocumentSelector"
import { usePhaseFolders } from '@/hooks/usePhaseFolders'
import {
    Pause,
    Play,
    Calendar,
    User,
    Flag,
    FileText,
    Clock,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Grid3X3,
    Table as TableIcon,
    Filter,
    Search,
    SortAsc,
    SortDesc,
    MoreVertical,
    Settings,
    Pen,
    Trash,
    X,
    Upload,
    CheckCircle,
    XCircle,
    Eye,
    Download
} from 'lucide-react'
import { useUser } from '@/providers/UserProvider'
import { useTimer } from '@/providers/TimerProvider'
import { toast } from 'react-toastify'
import Link from "next/link"
import UpdateTask from "./Dialogs/UpdateTask";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PhaseTasksModal from './modals/PhaseTasksModal';

// Portal Dropdown Component
const PortalDropdown = ({ isOpen, anchorRef, children, className = "" }) => {
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        if (isOpen && anchorRef) {
            // Handle both ref objects and DOM elements
            const element = anchorRef.current || anchorRef;
            if (element) {
                const rect = element.getBoundingClientRect();
                setPosition({
                    top: rect.top - 8, // Position above the button
                    left: rect.left,
                    width: rect.width
                });
            } else {
            }
        }
    }, [isOpen, anchorRef]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className={`fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] min-w-48 portal-dropdown-content ${className}`}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${position.width}px`,
                transform: 'translateY(-100%)'
            }}
        >
            {children}
        </div>,
        document.body
    );
};

const statusColors = {
    "TO_DO": "bg-gray-200",
    "IN_PROGRESS": "bg-blue-200",
    "IN_REVIEW": "bg-purple-200",
    "STUCK": "bg-yellow-200",
    "DONE": "bg-green-200",
    "OVER_DUE": "bg-red-200"
}

const statusLabels = {
    "TO_DO": "TO DO",
    "IN_PROGRESS": "IN PROGRESS",
    "IN_REVIEW": "IN REVIEW",
    "STUCK": "STUCK",
    "DONE": "DONE",
    "OVER_DUE": "OVER DUE"
}

const priorityColors = {
    "CRITICAL": "bg-red-200 text-white",
    "HIGH": "bg-orange-200 text-white",
    "MEDIUM": "bg-yellow-200 text-white",
    "LOW": "bg-green-200 text-white",
    "NONE": "bg-gray-200 text-gray-700"
}

const priorityBadgeColors = {
    "CRITICAL": "bg-red-100 text-red-800 border-red-200",
    "HIGH": "bg-orange-100 text-orange-800 border-orange-200",
    "MEDIUM": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "LOW": "bg-green-100 text-green-800 border-green-200",
    "NONE": "bg-gray-100 text-gray-800 border-gray-200"
}

const statuses = [
    ["TO_DO", "TO DO"],
    ["IN_PROGRESS", "IN PROGRESS"],
    ["IN_REVIEW", "IN REVIEW"],
    ["STUCK", "STUCK"],
    ["DONE", "DONE"],
    ["OVER_DUE", "OVER DUE"]
]

// Review Submission Modal Component
const ReviewSubmissionModal = ({ isOpen, onClose, onSubmit, isLoading, task, project }) => {
    const [description, setDescription] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [selectedInternalDoc, setSelectedInternalDoc] = useState(null)
    const [showInternalDocSelector, setShowInternalDocSelector] = useState(false)
    const fileInputRef = useRef(null)

    // Check if the task's phase has associated folders
    const { hasFolders: phaseHasFolders, isLoading: checkingPhaseFolders } = usePhaseFolders(
        project?.project_id,
        task?.phase
    );

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
            setSelectedInternalDoc(null) // Clear internal doc when PC file is selected
        }
    }

    const handleInternalDocSelect = (doc) => {
        setSelectedInternalDoc(doc)
        setSelectedFile(null) // Clear PC file when internal doc is selected
    }

    const handleClose = () => {
        setDescription('')
        setSelectedFile(null)
        setSelectedInternalDoc(null)
        setShowInternalDocSelector(false)
        onClose()
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (description.trim()) {
            onSubmit(description.trim(), selectedFile, selectedInternalDoc)
            setDescription('')
            setSelectedFile(null)
            setSelectedInternalDoc(null)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Submit for Review</h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what you've completed and what needs to be reviewed..."
                            required
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Attachment (Optional)
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Choose File
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowInternalDocSelector(true)}
                                className="flex items-center gap-2 px-3 py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-blue-700"
                            >
                                <FileText className="w-4 h-4" />
                                {task?.phase && phaseHasFolders ? `Phase Documents (${task.phase})` : 'Internal Document'}
                            </button>
                            {(selectedFile || selectedInternalDoc) && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 truncate">
                                        {selectedFile ? selectedFile.name : selectedInternalDoc?.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFile(null)
                                            setSelectedInternalDoc(null)
                                        }}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!description.trim() || isLoading}
                            isLoading={isLoading}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            Submit for Review
                        </Button>
                    </div>
                </form>
            </div>
            
            {/* Internal Document Selector */}
            <InternalDocumentSelector
                isOpen={showInternalDocSelector}
                onClose={() => setShowInternalDocSelector(false)}
                onSelect={handleInternalDocSelect}
                selectedFile={selectedInternalDoc}
                phase={task?.phase}
                projectId={project?.project_id}
            />
        </div>
    )
}


// Review Actions Modal Component - Updated version
const ReviewActionsModal = ({ isOpen, onClose, task, onApprove, onReject, isLoading }) => {
    const [rejectReason, setRejectReason] = useState('')
    const [showRejectForm, setShowRejectForm] = useState(false)
    const [reviewData, setReviewData] = useState(null)

    useEffect(() => {
        if (isOpen && task) {
            // Get review data from API
            const fetchReviewData = async () => {
                try {
                    const response = await getTaskReviewsRequest(task.task_id)
                    if (response.data.reviews && response.data.reviews.length > 0) {
                        // Get the latest review (most recent)
                        const latestReview = response.data.reviews[0]
                        setReviewData({
                            description: latestReview.submissionDesc,
                            fileName: latestReview.filename,
                            fileSize: latestReview.size,
                            submittedAt: latestReview.created_at,
                            reviewId: latestReview.review_id,
                            fileUrl: latestReview.file_url // Use the correct property name from API
                        })
                    }
                } catch (error) {
                    console.error('Failed to fetch review data:', error)
                }
            }
            fetchReviewData()
        }
    }, [isOpen, task])

    const handleApprove = () => {
        onApprove(task, reviewData?.reviewId)
    }

    const handleReject = (e) => {
        e.preventDefault()
        if (rejectReason.trim()) {
            onReject(task, rejectReason.trim(), reviewData?.reviewId)
            setRejectReason('')
            setShowRejectForm(false)
        }
    }

    const handleClose = () => {
        setRejectReason('')
        setShowRejectForm(false)
        setReviewData(null)
        onClose()
    }

    // Handle file download
    const handleDownload = async () => {
        if (!reviewData?.fileName || !reviewData?.fileUrl) return

        try {
            const response = await fetch(reviewData.fileUrl)

            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`)
            }

            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = reviewData.fileName
            document.body.appendChild(link)
            link.click()

            // Clean up
            document.body.removeChild(link)
            URL.revokeObjectURL(blobUrl)

            toast.success('File downloaded successfully')
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Failed to download file')
        }
    }

    // Handle file view
    const viewFile = async (url, filename) => {
        try {
            
            // Check if it's a Cloudinary URL that might force download
            const isCloudinaryUrl = url.includes('cloudinary.com') && url.includes('raw/upload');
            
            if (isCloudinaryUrl) {
                // For Cloudinary URLs, fetch the content and display it inline
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error('Failed to fetch file');
                    }
                    
                    const contentType = response.headers.get('content-type') || '';
                    const fileContent = await response.text();
                    
                    // Create a new window and display the content inline
                    const newWindow = window.open('', '_blank');
                    
                    if (newWindow) {
                        // Create a simpler approach using data attributes
                        const escapedContent = fileContent.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                        const escapedContentType = contentType.replace(/"/g, '&quot;');
                        const escapedUrl = url.replace(/"/g, '&quot;');
                        const escapedFilename = (filename || 'document').replace(/"/g, '&quot;');
                        
                        newWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <title>${filename || 'Document Viewer'}</title>
                              <style>
                                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
                                .viewer-container { 
                                  max-width: 1200px; 
                                  margin: 0 auto; 
                                  background: white; 
                                  border-radius: 8px; 
                                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                  overflow: hidden;
                                }
                                .header { 
                                  background: #f8f9fa; 
                                  padding: 15px 20px; 
                                  border-bottom: 1px solid #dee2e6;
                                  display: flex;
                                  justify-content: space-between;
                                  align-items: center;
                                }
                                .content { 
                                  padding: 20px; 
                                  min-height: 400px;
                                  overflow: auto;
                                }
                                .fallback { 
                                  text-align: center; 
                                  padding: 50px; 
                                  color: #6c757d;
                                }
                                .fallback a { 
                                  color: #0066cc; 
                                  text-decoration: none; 
                                  margin: 0 10px;
                                }
                                .fallback a:hover { 
                                  text-decoration: underline; 
                                }
                                .btn {
                                  padding: 8px 16px;
                                  border: none;
                                  border-radius: 4px;
                                  cursor: pointer;
                                  text-decoration: none;
                                  display: inline-block;
                                  font-size: 14px;
                                }
                                .btn-primary {
                                  background: #007bff;
                                  color: white;
                                }
                                .btn-secondary {
                                  background: #6c757d;
                                  color: white;
                                }
                                .btn:hover {
                                  opacity: 0.9;
                                }
                                pre {
                                  white-space: pre-wrap;
                                  word-wrap: break-word;
                                  font-family: 'Courier New', monospace;
                                  background: #f8f9fa;
                                  padding: 15px;
                                  border-radius: 4px;
                                  border: 1px solid #e9ecef;
                                }
                              </style>
                            </head>
                            <body>
                              <div class="viewer-container">
                                <div class="header">
                                  <h3 style="margin: 0; color: #495057;">${filename || 'Document Viewer'}</h3>
                                  <div>
                                    <a href="${url}" download="${filename || 'document'}" class="btn btn-secondary">Download</a>
                                    <button onclick="window.close()" class="btn btn-primary">Close</button>
                                  </div>
                                </div>
                                <div class="content" id="content" 
                                     data-content="${escapedContent}" 
                                     data-content-type="${escapedContentType}" 
                                     data-url="${escapedUrl}" 
                                     data-filename="${escapedFilename}">
                                  <!-- Content will be loaded here -->
                                </div>
                              </div>
                              <script>
                                function getContentDisplay(content, contentType, url, filename) {
                                  if (contentType.includes('text/plain') || contentType.includes('text/csv')) {
                                    return '<pre>' + escapeHtml(content) + '</pre>';
                                  } else if (contentType.includes('text/html')) {
                                    return content;
                                  } else if (contentType.includes('application/json')) {
                                    try {
                                      const json = JSON.parse(content);
                                      return '<pre>' + escapeHtml(JSON.stringify(json, null, 2)) + '</pre>';
                                    } catch (e) {
                                      return '<pre>' + escapeHtml(content) + '</pre>';
                                    }
                                  } else if (contentType.includes('image/')) {
                                    return '<img src="' + url + '" style="max-width: 100%; height: auto;" alt="Image preview" />';
                                  } else if (contentType.includes('pdf')) {
                                    return '<iframe src="' + url + '" style="width: 100%; height: 600px; border: none;"></iframe>';
                                  } else {
                                    return '<div class="fallback"><h4>Preview not available</h4><p>This file type cannot be previewed in the browser.</p><a href="' + url + '" download="' + filename + '">Download File</a></div>';
                                  }
                                }
                                
                                function escapeHtml(text) {
                                  const div = document.createElement('div');
                                  div.textContent = text;
                                  return div.innerHTML;
                                }
                                
                                // Load content after page is ready
                                document.addEventListener('DOMContentLoaded', function() {
                                  const contentDiv = document.getElementById('content');
                                  const content = contentDiv.getAttribute('data-content');
                                  const contentType = contentDiv.getAttribute('data-content-type');
                                  const url = contentDiv.getAttribute('data-url');
                                  const filename = contentDiv.getAttribute('data-filename');
                                  
                                  const displayContent = getContentDisplay(content, contentType, url, filename);
                                  contentDiv.innerHTML = displayContent;
                                });
                              </script>
                            </body>
                            </html>
                        `);
                        newWindow.document.close();
                    } else {
                        // Fallback if popup is blocked
                        window.open(url, '_blank');
                    }
                } catch (fetchError) {
                    console.error('Fetch error:', fetchError);
                    // Fallback to direct link approach
                    window.open(url, '_blank');
                }
            } else {
                // For non-Cloudinary URLs, use the original iframe approach
                const newWindow = window.open('', '_blank');
                
                if (newWindow) {
                    newWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>${filename || 'Document Viewer'}</title>
                          <style>
                            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                            .viewer-container { width: 100%; height: 100vh; }
                            iframe { width: 100%; height: 100%; border: none; }
                            .fallback { text-align: center; padding: 50px; }
                            .fallback a { color: #0066cc; text-decoration: none; }
                            .fallback a:hover { text-decoration: underline; }
                          </style>
                        </head>
                        <body>
                          <div class="viewer-container">
                            <iframe src="${url}" onerror="showFallback()"></iframe>
                          </div>
                          <div class="fallback" id="fallback" style="display: none;">
                            <h3>File Preview Not Available</h3>
                            <p>This file cannot be previewed in the browser.</p>
                            <a href="${url}" download="${filename || 'document'}">Download File</a>
                          </div>
                          <script>
                            function showFallback() {
                              document.getElementById('fallback').style.display = 'block';
                              document.querySelector('.viewer-container').style.display = 'none';
                            }
                          </script>
                        </body>
                        </html>
                    `);
                    newWindow.document.close();
                } else {
                    // Fallback if popup is blocked
                    window.open(url, '_blank');
                }
            }
            
        } catch (error) {
            console.error('View error:', error);
            // Fallback to direct link approach
            window.open(url, '_blank');
        }
    }

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return ''
        const units = ['B', 'KB', 'MB', 'GB']
        let size = bytes
        let unitIndex = 0

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024
            unitIndex++
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`
    }

    if (!isOpen || !task) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Review Task</h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">{task.name}</h4>
                        {reviewData && (
                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <p className="text-sm text-gray-700 mb-2">
                                    <strong>Submission Description:</strong>
                                </p>
                                <p className="text-sm text-gray-600 mb-2">{reviewData.description}</p>

                                {reviewData.fileName && (
                                    <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {reviewData.fileName}
                                                    </p>
                                                    {reviewData.fileSize && (
                                                        <p className="text-xs text-gray-500">
                                                            {formatFileSize(reviewData.fileSize)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => viewFile(reviewData.fileUrl, reviewData.fileName)}
                                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                                    title="View file"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    View
                                                </button>
                                                <button
                                                    onClick={handleDownload}
                                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                                    title="Download file"
                                                >
                                                    <Download className="w-3 h-3" />
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-gray-500 mt-2">
                                    Submitted: {moment(reviewData.submittedAt).format('MMM DD, YYYY HH:mm')}
                                </p>
                            </div>
                        )}
                    </div>

                    {!showRejectForm ? (
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => setShowRejectForm(true)}
                                variant="outline"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                disabled={isLoading}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                            <Button
                                onClick={handleApprove}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={isLoading}
                                isLoading={isLoading}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleReject}>
                            <div className="mb-4">
                                <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Rejection <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="rejectReason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Please explain what needs to be changed or improved..."
                                    required
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowRejectForm(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={!rejectReason.trim() || isLoading}
                                    isLoading={isLoading}
                                >
                                    Reject Task
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

// Reason Modal Component
const ReasonModal = ({ isOpen, onClose, onSubmit, title, placeholder, isLoading }) => {
    const [reason, setReason] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (reason.trim()) {
            onSubmit(reason.trim())
            setReason('')
        }
    }

    const handleClose = () => {
        setReason('')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-4">
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                            Reason
                        </label>
                        <textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={placeholder}
                            required
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!reason.trim() || isLoading}
                            isLoading={isLoading}
                        >
                            Update Status
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const TaskManagementView = ({ ccproject, reloadProject, getProjectDetails }) => {
    const router = useRouter()
    const [project, setProject] = useState(null)
    const [viewMode, setViewMode] = useState(() => {
        // Get view mode from localStorage, default to 'kanban'
        if (typeof window !== 'undefined') {
            return localStorage.getItem('taskManagementViewMode') || 'kanban'
        }
        return 'kanban'
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterPriority, setFilterPriority] = useState('')
    const [sortBy, setSortBy] = useState('created_at')
    const [sortOrder, setSortOrder] = useState('asc')

    // Table view states
    const [statusClickPosition, setStatusClickPosition] = useState(null)
    const [selectedStatusTask, setSelectedStatusTask] = useState(null)
    const [showStatusBox, setShowStatusBox] = useState(false)
    const statusBoxRef = useRef(null)

    // Kanban view states
    const [showPhaseDropdown, setShowPhaseDropdown] = useState({})
    const [phases, setPhases] = useState([])
    const [stopTimeOpen, setStopTimeOpen] = useState(null)
    const [selectedTask, setSelectedTask] = useState(null)
    
    // Phase modal states
    const [phaseModalOpen, setPhaseModalOpen] = useState(false)
    const [selectedPhaseName, setSelectedPhaseName] = useState('')
    const [selectedPhaseTasks, setSelectedPhaseTasks] = useState([])
    
    // Phase dropdown refs for portal positioning
    const phaseButtonRefs = useRef({})
    
    // Click outside handler for phase dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isPhaseButton = Object.values(phaseButtonRefs.current).some(ref => ref?.contains(event.target));
            const isDropdownContent = event.target.closest('.portal-dropdown-content');
            
          
            
            if (!isPhaseButton && !isDropdownContent) {
                setShowPhaseDropdown({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    const { user, loadUser } = useUser()
    const { activeTimer, startTimer, stopTimer, loadingStart, loadingStop } = useTimer()

    const isTeamLeader = user?.user_id === project?.created_by

    // Reason modal states
    const [reasonModal, setReasonModal] = useState({
        isOpen: false,
        task: null,
        targetStatus: null,
        isLoading: false
    })

    // Review modal states
    const [reviewSubmissionModal, setReviewSubmissionModal] = useState({
        isOpen: false,
        task: null,
        isLoading: false
    })

    const [reviewActionsModal, setReviewActionsModal] = useState({
        isOpen: false,
        task: null,
        isLoading: false
    })

    // Delete confirmation modal state
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({
        isOpen: false,
        task: null,
        isLoading: false
    })


    // Check and update overdue tasks
    const checkAndUpdateOverdueTasks = useCallback(async (tasks) => {
        const today = moment().startOf('day')
        const overdueTasksToUpdate = []

        tasks.forEach(task => {
            const dueDate = moment(task.last_date).startOf('day')
            const isOverdue = dueDate.isBefore(today)
            const isNotDoneOrOverdue = task.status !== 'DONE' && task.status !== 'OVER_DUE'
            const isNotInReview = task.status !== 'IN_REVIEW' // Don't update tasks in review

            if (isOverdue && isNotDoneOrOverdue && isNotInReview) {
                overdueTasksToUpdate.push({
                    ...task,
                    status: 'OVER_DUE'
                })
            }
        })

        if (overdueTasksToUpdate.length > 0) {
            const updatePromises = overdueTasksToUpdate.map(task =>
                updateTaskRequest({ status: 'OVER_DUE' }, task.task_id)
                    .catch(error => {
                        console.error(`Failed to update task ${task.task_id} to overdue:`, error)
                        return null
                    })
            )

            await Promise.all(updatePromises)

            setProject(prev => {
                if (!prev) return prev

                const updatedTasks = prev.Tasks.map(task => {
                    const overdueTask = overdueTasksToUpdate.find(ot => ot.task_id === task.task_id)
                    return overdueTask ? { ...task, status: 'OVER_DUE' } : task
                })

                return { ...prev, Tasks: updatedTasks }
            })
        }

        return overdueTasksToUpdate.length
    }, [])

    useEffect(() => {
        if (ccproject) {
            setProject(ccproject)
            setPhases(ccproject.phases)

            if (ccproject.Tasks && ccproject.Tasks.length > 0) {
                checkAndUpdateOverdueTasks(ccproject.Tasks).then(updatedCount => {
                    if (updatedCount > 0) {
                    }
                })
            }
        }
    }, [ccproject, checkAndUpdateOverdueTasks])

    // Filter and sort tasks
    const filteredAndSortedTasks = useMemo(() => {
        if (!project?.Tasks) return []

        let tasks = [...project.Tasks]

        // Apply filters
        if (searchTerm) {
            tasks = tasks.filter(task =>
                task?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task?.assignees?.some(assignee =>
                    assignee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                )
            )
        }

        if (filterStatus) {
            tasks = tasks.filter(task => task.status === filterStatus)
        }

        if (filterPriority) {
            tasks = tasks.filter(task => task.priority === filterPriority)
        }

        // Apply sorting
        tasks.sort((a, b) => {
            let aValue = a[sortBy]
            let bValue = b[sortBy]

            if (sortBy === 'created_at' || sortBy === 'last_date') {
                aValue = moment(aValue)
                bValue = moment(bValue)
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
            return 0
        })

        return tasks
    }, [project?.Tasks, searchTerm, filterStatus, filterPriority, sortBy, sortOrder])

    // Helper function to check if task is overdue
    const isTaskOverdue = useCallback((task) => {
        if (task.status === 'DONE' || task.status === 'IN_REVIEW') return false
        const today = moment().startOf('day')
        const dueDate = moment(task.last_date).startOf('day')
        return dueDate.isBefore(today)
    }, [])

    // Status change handlers
    const handleStatusChange = useCallback((e, task) => {
        e.stopPropagation()
        const { clientX, clientY } = e
        setStatusClickPosition({
            x: e.pageX,
            y: e.pageY,
        })
        setSelectedStatusTask(task)
        setShowStatusBox(true)
    }, [])

    const handleOutClick = useCallback((e) => {
        if (statusBoxRef.current && !statusBoxRef.current.contains(e.target)) {
            setShowStatusBox(false)
        }
    }, [])

    // Updated status update handler with IN_REVIEW modal
    const handleStatusUpdate = useCallback(async (task, status) => {
        // Check if status requires a review submission
        if (status === 'IN_REVIEW') {
            setReviewSubmissionModal({
                isOpen: true,
                task,
                isLoading: false
            })
            setShowStatusBox(false)
            return
        }

        // Check if status requires a reason
        if (status === 'STUCK' || status === 'OVER_DUE') {
            setReasonModal({
                isOpen: true,
                task,
                targetStatus: status,
                isLoading: false
            })
            setShowStatusBox(false)
            return
        }

        // For other statuses, update directly
        try {
            await updateTaskRequest({ status }, task.task_id)
            if (reloadProject) await reloadProject()
            setShowStatusBox(false)
            toast.success("Status updated successfully")
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }, [reloadProject])

    // Handle review submission
    // Fixed handleReviewSubmission function
    const handleReviewSubmission = useCallback(async (description, file, internalDoc) => {
        const { task } = reviewSubmissionModal

        setReviewSubmissionModal(prev => ({ ...prev, isLoading: true }))

        try {
            // Create FormData for review submission
            const formData = new FormData()

            // Convert task_id to number before appending
            const numericTaskId = parseInt(task.task_id)
            formData.append('task_id', numericTaskId.toString()) // Ensure it's explicitly a string representation of the number
            formData.append('submissionDesc', description)

            // Handle file attachment (either PC file or internal document)
            if (file) {
                formData.append('file', file)
            } else if (internalDoc) {
                // For internal documents, we need to fetch the file data
                try {
                    const fileResponse = await fetch(internalDoc.path)
                    const fileData = await fileResponse.arrayBuffer()
                    const blob = new Blob([fileData], { type: 'application/pdf' })
                    formData.append('file', blob, internalDoc.name)
                } catch (error) {
                    console.error('Error fetching internal document:', error)
                    toast.error('Failed to attach internal document')
                    return
                }
            }

            // Debug: Check what we're sending

            // Submit review to API
            await createReviewRequest(formData)

            if (reloadProject) await reloadProject()

            setReviewSubmissionModal({ isOpen: false, task: null, isLoading: false })
            toast.success("Task submitted for review successfully")
        } catch (error) {
            console.error('Review submission error:', error)
            toast.error(error?.response?.data?.message || error.message)
            setReviewSubmissionModal(prev => ({ ...prev, isLoading: false }))
        }
    }, [reviewSubmissionModal, reloadProject])


    // Handle review submission modal close
    const handleReviewSubmissionClose = useCallback(() => {
        setReviewSubmissionModal({ isOpen: false, task: null, isLoading: false })
    }, [])

    // Handle review actions
    const handleReviewApprove = useCallback(async (task, reviewId) => {
        setReviewActionsModal(prev => ({ ...prev, isLoading: true }))

        try {
            // Update review status to APPROVED
            await updateReviewRequest(reviewId, { action: 'APPROVED' })

            if (reloadProject) await reloadProject()

            setReviewActionsModal({ isOpen: false, task: null, isLoading: false })
            toast.success("Task approved and marked as done")
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
            setReviewActionsModal(prev => ({ ...prev, isLoading: false }))
        }
    }, [reloadProject])

    const handleReviewReject = useCallback(async (task, reason, reviewId) => {
        setReviewActionsModal(prev => ({ ...prev, isLoading: true }))

        try {
            // Update review status to REJECTED with reason
            await updateReviewRequest(reviewId, {
                action: 'REJECTED',
                rejectedReason: reason
            })

            if (reloadProject) await reloadProject()

            setReviewActionsModal({ isOpen: false, task: null, isLoading: false })
            toast.success("Task rejected and sent back to in progress")
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
            setReviewActionsModal(prev => ({ ...prev, isLoading: false }))
        }
    }, [reloadProject])

    // Handle review actions modal close
    const handleReviewActionsClose = useCallback(() => {
        setReviewActionsModal({ isOpen: false, task: null, isLoading: false })
    }, [])

    // Handle reason submission
    const handleReasonSubmit = useCallback(async (reason) => {
        const { task, targetStatus } = reasonModal

        setReasonModal(prev => ({ ...prev, isLoading: true }))

        try {
            const updateData = { status: targetStatus }

            // Add appropriate reason field
            if (targetStatus === 'STUCK') {
                updateData.stuckReason = reason
            } else if (targetStatus === 'OVER_DUE') {
                updateData.overDueReason = reason
            }

            await updateTaskRequest(updateData, task.task_id)
            if (reloadProject) await reloadProject()

            setReasonModal({ isOpen: false, task: null, targetStatus: null, isLoading: false })
            toast.success("Status updated successfully")
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
            setReasonModal(prev => ({ ...prev, isLoading: false }))
        }
    }, [reasonModal, reloadProject])

    // Handle reason modal close
    const handleReasonModalClose = useCallback(() => {
        setReasonModal({ isOpen: false, task: null, targetStatus: null, isLoading: false })
    }, [])

    // Handle phase modal open
    const handlePhaseClick = useCallback((phaseName) => {
        const phaseTasks = filteredAndSortedTasks.filter(task => task.phase === phaseName)
        setSelectedPhaseName(phaseName)
        setSelectedPhaseTasks(phaseTasks)
        setPhaseModalOpen(true)
    }, [filteredAndSortedTasks])

    // Handle phase modal close
    const handlePhaseModalClose = useCallback(() => {
        setPhaseModalOpen(false)
        setSelectedPhaseName('')
        setSelectedPhaseTasks([])
    }, [])

    // Handle task click from phase modal
    const handleTaskClickFromPhase = useCallback((task) => {
        // Navigate to task detail page instead of opening modal
        setPhaseModalOpen(false) // Close phase modal when navigating
        if (project?.project_id) {
            router.push(`/dashboard/project/${project.project_id}/task/${task.task_id}`)
        }
    }, [project?.project_id, router])

    // Phase change handler
    const handlePhaseChange = useCallback(async (task_id, newPhase) => {
        
        // Ensure task_id is a number
        const numericTaskId = parseInt(task_id);
        if (isNaN(numericTaskId)) {
            console.error('❌ Invalid task_id:', task_id);
            toast.error('Invalid task ID');
            return;
        }
        
        setProject(prev => {
            if (!prev) return prev
            const updatedTasks = prev.Tasks.map(task => {
                if (task.task_id === task_id) {
                    return { ...task, phase: newPhase }
                }
                return task
            })
            return { ...prev, Tasks: updatedTasks }
        })

        setShowPhaseDropdown(prev => ({ ...prev, [task_id]: false }))

        try {
          
            
            const response = await updateTaskRequest({ phase: newPhase }, numericTaskId)
            toast.success('Phase updated successfully')
        } catch (error) {
            console.error('❌ Phase update failed:', error);
            console.error('❌ Error details:', {
                message: error?.message,
                response: error?.response?.data,
                status: error?.response?.status,
                statusText: error?.response?.statusText
            });
            toast.error('Failed to update phase')

            setProject(prev => {
                if (!prev) return prev
                const revertedTasks = prev.Tasks.map(task => {
                    if (task.task_id === task_id) {
                        const originalTask = ccproject?.Tasks?.find(t => t.task_id === task_id)
                        return { ...task, phase: originalTask?.phase || task.phase }
                    }
                    return task
                })
                return { ...prev, Tasks: revertedTasks }
            })
        }
    }, [ccproject])

    // Drag and drop handlers
    const onDragStart = useCallback((event, task_id) => {
        event.dataTransfer.setData("task_id", task_id)
    }, [])

    const handleDrop = useCallback(async (event, status) => {
        const task_id = event.dataTransfer.getData("task_id")
        const task = project?.Tasks?.find(t => t.task_id == task_id)

        if (!task) return

        // Check if status requires review submission
        if (status === 'IN_REVIEW') {
            setReviewSubmissionModal({
                isOpen: true,
                task,
                isLoading: false
            })
            return
        }

        // Check if status requires a reason
        if (status === 'STUCK' || status === 'OVER_DUE') {
            setReasonModal({
                isOpen: true,
                task,
                targetStatus: status,
                isLoading: false
            })
            return
        }

        // For other statuses, update directly
        setProject(prev => {
            let tasks = prev.Tasks.map(task => {
                if (task.task_id == task_id) {
                    task.status = status
                }
                return task
            })
            return { ...prev, Tasks: tasks }
        })

        try {
            await updateTaskRequest({ status }, task_id)
            toast.success("Task status updated")
        } catch (error) {
            toast.error("Failed to update task status")
        }
    }, [project])

    // Time tracking handlers
    const handleStartTime = useCallback(async (task_id, task_name) => {
        try {
            await startTimer(task_id, task_name, project.project_id, project.name)
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }, [startTimer, project])

    const handleStopTime = useCallback(async (task_id, description) => {
        try {
            await stopTimer(description)
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }, [stopTimer])

    const handleTaskClick = useCallback((task, event) => {
        if (event.target.closest('button')) {
            return
        }
        // Navigate to task detail page instead of opening modal
        if (project?.project_id) {
            router.push(`/dashboard/project/${project.project_id}/task/${task.task_id}`)
        }
    }, [project?.project_id, router])


    // Handle review actions button click
    const handleReviewActionsClick = useCallback((task, event) => {
        event.stopPropagation()
        setReviewActionsModal({
            isOpen: true,
            task,
            isLoading: false
        })
    }, [])

    useEffect(() => {
        if (showStatusBox) {
            document.addEventListener('click', handleOutClick)
        } else {
            document.removeEventListener('click', handleOutClick)
        }
        return () => {
            document.removeEventListener('click', handleOutClick)
        }
    }, [showStatusBox, handleOutClick])

    // Clear filters
    const clearFilters = () => {
        setSearchTerm('')
        setFilterStatus('')
        setFilterPriority('')
        setSortBy('created_at')
        setSortOrder('asc')
    }

    const [isEditMode, setIsEditMode] = useState(false);

    const handleEditClick = useCallback((task, event) => {
        event.stopPropagation(); // Prevent the row click event from firing
        setSelectedTask(task);
        setIsEditMode(true);
    }, []);

    const handleEditClose = useCallback(() => {
        setIsEditMode(false)
        setSelectedTask(null)
    }, [])

    // Handle delete task
    const handleDeleteTask = useCallback(async (task) => {
        setDeleteConfirmModal({
            isOpen: true,
            task,
            isLoading: false
        })
    }, [])

    const handleDeleteConfirm = useCallback(async () => {
        const { task } = deleteConfirmModal
        if (!task) return

        setDeleteConfirmModal(prev => ({ ...prev, isLoading: true }))

        try {
            await deleteTaskRequest(task.task_id)

            // Update local state by removing the deleted task
            setProject(prev => {
                if (!prev) return prev
                const updatedTasks = prev.Tasks.filter(t => t.task_id !== task.task_id)
                return { ...prev, Tasks: updatedTasks }
            })

            setDeleteConfirmModal({ isOpen: false, task: null, isLoading: false })
            toast.success("Task deleted successfully")
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete task')
            setDeleteConfirmModal(prev => ({ ...prev, isLoading: false }))
        }
    }, [deleteConfirmModal])

    const handleDeleteCancel = useCallback(() => {
        setDeleteConfirmModal({ isOpen: false, task: null, isLoading: false })
    }, [])

    return (
        <div className="h-full min-h-screen flex flex-col">
            {/* Header with controls */}
            <div className="flex flex-col gap-4 p-4 border-b bg-white">
                {/* View mode selector and main controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => {
                                    setViewMode('kanban')
                                    localStorage.setItem('taskManagementViewMode', 'kanban')
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                                Kanban
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode('table')
                                    localStorage.setItem('taskManagementViewMode', 'table')
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'table'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <TableIcon className="w-4 h-4" />
                                Table
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                            {filteredAndSortedTasks.length} tasks
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-gray-600"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>

                {/* Filters and search */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search tasks or assignees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            {Object.entries(statusLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>

                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Priority</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                            <option value="NONE">None</option>
                        </select>

                        <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split('-')
                                setSortBy(field)
                                setSortOrder(order)
                            }}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="created_at-asc">Created Date (Oldest)</option>
                            <option value="created_at-desc">Created Date (Newest)</option>
                            <option value="last_date-asc">Due Date (Earliest)</option>
                            <option value="last_date-desc">Due Date (Latest)</option>
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="priority-asc">Priority (Low-High)</option>
                            <option value="priority-desc">Priority (High-Low)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-auto h-full">
                {viewMode === 'kanban' ? (
                    /* Kanban View */
                    <div className="p-4 h-full overflow-auto">
                        <div className="grid gap-4 md:grid-cols-6 h-fit">
                            {statuses.map(([value, status]) => (
                                <Card key={status} className="bg-gray-50" onDrop={(e) => handleDrop(e, value)} onDragOver={(e) => e.preventDefault()}>
                                    <CardContent className="p-0">
                                        <div className="sticky top-0 z-10">
                                            <h3 className={`mb-4 font-semibold py-3 px-4 ${statusColors[value]} text-center text-black rounded-t-lg`}>
                                                {status}
                                                <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                                                    {filteredAndSortedTasks.filter(task => task.status === value).length}
                                                </span>
                                            </h3>
                                        </div>
                                        <div className="px-2 pb-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                                            {filteredAndSortedTasks.filter(task => task.status === value).map((task) => (
                                                <Card
                                                    key={task.task_id}
                                                    className={`bg-white hover:shadow-lg transition-all duration-200 cursor-pointer ${isTaskOverdue(task) && task.status !== 'OVER_DUE' ? 'border-red-300 border-2 shadow-red-100' : ''
                                                        }`}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, task.task_id)}
                                                >
                                                    <CardContent className="p-3" onClick={(e) => handleTaskClick(task, e)}>
                                                        <div className="flex items-start justify-between mb-2">
                                                            <span className="text-sm font-semibold text-gray-900 line-clamp-2">{task.name}</span>
                                                            <div className="flex items-center gap-1">
                                                                {isTaskOverdue(task) && task.status !== 'OVER_DUE' && (
                                                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                                                )}
                                                                {task.status === 'IN_REVIEW' && isTeamLeader && (
                                                                    <button
                                                                        onClick={(e) => handleReviewActionsClick(task, e)}
                                                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                                                                    >
                                                                        <Eye className="w-3 h-3" />
                                                                        Review
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 mb-3">
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <Calendar className="w-3 h-3 text-gray-500" />
                                                                <span className="text-gray-600">
                                                                    Created: {moment(task.created_at).format("MMM DD")}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <Clock className="w-3 h-3 text-gray-500" />
                                                                <span className={`${isTaskOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                                                    Due: {moment(task.last_date).format("MMM DD, YYYY")}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="relative">
                                                                <button
                                                                    ref={(el) => {
                                                                        if (el) {
                                                                            phaseButtonRefs.current[task.task_id] = el;
                                                                        }
                                                                    }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        e.preventDefault()
                                                                        setShowPhaseDropdown(prev => {
                                                                            const newState = {
                                                                                ...prev,
                                                                                [task.task_id]: !prev[task.task_id]
                                                                            };
                                                                            return newState;
                                                                        })
                                                                    }}
                                                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                                                                >
                                                                    <span className="truncate max-w-20">{task.phase}</span>
                                                                    {showPhaseDropdown[task.task_id] ? (
                                                                        <ChevronUp className="h-3 w-3 flex-shrink-0" />
                                                                    ) : (
                                                                        <ChevronDown className="h-3 w-3 flex-shrink-0" />
                                                                    )}
                                                                </button>
                                                            </div>

                                                            <Badge className={`text-xs border ${priorityBadgeColors[task.priority] || "bg-gray-100 text-gray-800"}`}>
                                                                {task.priority}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <RenderMembers members={task.assignees} className="max-w-[120px]" />

                                                            <div className="flex items-center gap-1">
                                                                {task.status === 'IN_REVIEW' && isTeamLeader ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="w-8 h-8 p-0 hover:bg-green-50"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                handleReviewApprove(task)
                                                                            }}
                                                                            title="Approve"
                                                                        >
                                                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="w-8 h-8 p-0 hover:bg-red-50"
                                                                            onClick={(e) => handleReviewActionsClick(task, e)}
                                                                            title="Reject"
                                                                        >
                                                                            <XCircle className="w-3 h-3 text-red-600" />
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        {activeTimer?.task_id === task.task_id ? (
                                                                            <>
                                                                                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md">
                                                                                    <Timer startTime={activeTimer.start_time} className="text-xs" />
                                                                                </div>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="w-8 h-8 p-0 hover:bg-red-50"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setStopTimeOpen(task.task_id)
                                                                                    }}
                                                                                    disabled={loadingStop === activeTimer.time_id}
                                                                                    isLoading={loadingStop === activeTimer.time_id}
                                                                                >
                                                                                    {loadingStop !== activeTimer.time_id && <Pause className="w-3 h-3" />}
                                                                                </Button>
                                                                            </>
                                                                        ) : (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="w-8 h-8 p-0 hover:bg-green-50"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    handleStartTime(task.task_id, task.name)
                                                                                }}
                                                                                disabled={loadingStart === task.task_id}
                                                                                isLoading={loadingStart === task.task_id}
                                                                            >
                                                                                {loadingStart !== task.task_id && <Play className="w-3 h-3" />}
                                                                            </Button>
                                                                        )}

                                                                        {/* Delete Button */}
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="w-8 h-8 p-0 hover:bg-red-50"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                handleDeleteTask(task)
                                                                            }}
                                                                            title="Delete Task"
                                                                        >
                                                                            <Trash className="w-3 h-3 text-red-600" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                            {filteredAndSortedTasks.filter(task => task.status === value).length === 0 && (
                                                <div className="text-center py-8 text-gray-500">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <FileText className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                    <p className="text-sm">No tasks</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Table View */
                    <div className="flex-1 overflow-auto p-4">
                        <div className="border rounded-lg bg-white">
                            <Table className="border border-separate border-spacing-y-2">
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="w-20 border-r text-center font-semibold">#</TableHead>
                                        <TableHead className="w-80 border-r font-semibold">Task Name</TableHead>
                                        <TableHead className="w-40 border-r text-center font-semibold">Assignees</TableHead>
                                        <TableHead className="w-32 border-r text-center font-semibold">Status</TableHead>
                                        <TableHead className="w-32 border-r text-center font-semibold">Priority</TableHead>
                                        <TableHead className="w-32 border-r text-center font-semibold">Phase</TableHead>
                                        <TableHead className="w-32 border-r text-center font-semibold">Created</TableHead>
                                        <TableHead className="w-32 border-r text-center font-semibold">Due Date</TableHead>
                                        <TableHead className="w-32 text-center font-semibold">Timer</TableHead>
                                        <TableHead className="w-32 text-center font-semibold">Edit</TableHead>
                                        <TableHead className="w-32 text-center font-semibold">Delete</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedTasks.map((task, index) => (
                                        <TableRow
                                            key={task.task_id}
                                            className={`hover:bg-gray-50  cursor-pointer transition-colors ${isTaskOverdue(task) && task.status !== 'OVER_DUE' ? 'bg-red-50 border-l-4 border-l-red-400' : ''
                                                }`}
                                            onClick={(e) => handleTaskClick(task, e)}
                                        >
                                            <TableCell className="border-r text-center">
                                                <Link
                                                    href={`/dashboard/projects/tasks/${task.task_id}`}
                                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    #{index + 1}
                                                </Link>
                                            </TableCell>

                                            <TableCell
                                                className="border-r p-0 text-black font-semibold relative group bg-yellow-200"
                                            >
                                                <div className="px-4 py-3 relative">
                                                    <span className="fold-paper-effect group-hover:block hidden transition-all"></span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate">{task.name?.toUpperCase()}</span>
                                                        {isTaskOverdue(task) && task.status !== 'OVER_DUE' && (
                                                            <AlertCircle className="w-4 h-4 text-white/80 flex-shrink-0" />
                                                        )}
                                                        {task.status === 'IN_REVIEW' && isTeamLeader && (
                                                            <button
                                                                onClick={(e) => handleReviewActionsClick(task, e)}
                                                                className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                                                            >
                                                                <Eye className="w-3 h-3" />
                                                                Review
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="border-r p-2 text-center">
                                                <RenderMembers members={task?.assignees} className="justify-center" />
                                            </TableCell>

                                            <TableCell
                                                className={`border-r p-0 text-center text-black cursor-pointer ${statusColors[task.status]} relative group`}
                                                onClick={(e) => handleStatusChange(e, task)}
                                            >
                                                <div className="px-2 py-3 relative">
                                                    <span className="fold-paper-effect group-hover:block transition-all hidden"></span>
                                                    <span className="font-medium">{statusLabels[task.status]}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell
                                                className={`border-r p-0 text-black text-center ${priorityColors[task.priority]} relative cursor-pointer group`}
                                            >
                                                <div className="px-2 py-3 relative">
                                                    <span className="fold-paper-effect group-hover:block hidden transition-all"></span>
                                                    <span className="font-medium text-black">{task.priority}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="border-r p-2 text-center">
                                                <div className="relative">
                                                    <button
                                                        ref={(el) => {
                                                            if (el) {
                                                                phaseButtonRefs.current[task.task_id] = el;
                                                            }
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            e.preventDefault()
                                                            setShowPhaseDropdown(prev => {
                                                                const newState = {
                                                                    ...prev,
                                                                    [task.task_id]: !prev[task.task_id]
                                                                };
                                                                return newState;
                                                            })
                                                        }}
                                                        className="flex items-center justify-center space-x-1 px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors w-full"
                                                    >
                                                        <span className="truncate max-w-[120px]" title={task.phase}>{task.phase}</span>
                                                        {showPhaseDropdown[task.task_id] ? (
                                                            <ChevronUp className="h-3 w-3 flex-shrink-0" />
                                                        ) : (
                                                            <ChevronDown className="h-3 w-3 flex-shrink-0" />
                                                        )}
                                                    </button>
                                                </div>
                                            </TableCell>

                                            <TableCell className={`border-r p-2 text-center text-sm ${task.status === "DONE" ? 'line-through text-gray-500' : ''}`}>
                                                {formatDate(task.created_at)}
                                            </TableCell>

                                            <TableCell className={`border-r p-2 text-center text-sm ${isTaskOverdue(task) && task.status !== 'DONE' ? 'text-red-600 font-medium' : ''
                                                } ${task.status === "DONE" ? 'line-through text-gray-500' : ''}`}>
                                                <div className="flex items-center justify-center gap-1">
                                                    {isTaskOverdue(task) && task.status !== 'DONE' && task.status !== 'OVER_DUE' && (
                                                        <AlertCircle className="w-3 h-3 text-red-500" />
                                                    )}
                                                    {formatDate(task.last_date)}
                                                </div>
                                            </TableCell>

                                            <TableCell className="border-r p-2 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {task.status === 'IN_REVIEW' && isTeamLeader ? (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="w-8 h-8 p-0 hover:bg-green-50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleReviewApprove(task)
                                                                }}
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="w-8 h-8 p-0 hover:bg-red-50"
                                                                onClick={(e) => handleReviewActionsClick(task, e)}
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-3 h-3 text-red-600" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {activeTimer?.task_id === task.task_id ? (
                                                                <>
                                                                    <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md">
                                                                        <Timer startTime={activeTimer.start_time} className="text-xs" />
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="w-8 h-8 p-0 hover:bg-red-50"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setStopTimeOpen(task.task_id)
                                                                        }}
                                                                        disabled={loadingStop === activeTimer.time_id}
                                                                        isLoading={loadingStop === activeTimer.time_id}
                                                                    >
                                                                        {loadingStop !== activeTimer.time_id && <Pause className="w-3 h-3" />}
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="w-8 h-8 p-0 hover:bg-green-50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleStartTime(task.task_id, task.name)
                                                                    }}
                                                                    disabled={loadingStart === task.task_id}
                                                                    isLoading={loadingStart === task.task_id}
                                                                >
                                                                    {loadingStart !== task.task_id && <Play className="w-3 h-3" />}
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell
                                                className="border-r p-1 text-center align-middle"
                                            >
                                                <button
                                                    onClick={(e) => handleEditClick(task, e)}
                                                    className="hover:bg-gray-100 p-2 rounded-md transition-colors"
                                                >
                                                    <Pen className="text-green-600 w-5 h-5 mx-auto" />
                                                </button>
                                            </TableCell>
                                            <TableCell
                                                className="p-1 text-center align-middle"
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteTask(task)
                                                    }}
                                                    className="hover:bg-red-100 p-2 rounded-md transition-colors"
                                                    title="Delete Task"
                                                >
                                                    <Trash className="text-red-600 w-5 h-5 mx-auto" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {filteredAndSortedTasks.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Portal Dropdowns for Table View */}
                {filteredAndSortedTasks.map((task) => (
                    <PortalDropdown
                        key={task.task_id}
                        isOpen={showPhaseDropdown[task.task_id]}
                        anchorRef={phaseButtonRefs.current[task.task_id]}
                    >
                        <div className="max-h-40 overflow-y-auto">
                            {phases.map((phaseOption) => (
                                <button
                                    key={phaseOption}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                        handlePhaseChange(task.task_id, phaseOption)
                                    }}
                                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${task.phase === phaseOption ? 'bg-blue-50 text-blue-700' : ''}`}
                                >
                                    {phaseOption}
                                </button>
                            ))}
                        </div>
                    </PortalDropdown>
                ))}
            </div>

            {/* Status Update Modal for Table View */}
            {showStatusBox && statusClickPosition && (
                <div
                    ref={statusBoxRef}
                    style={{
                        position: 'absolute',
                        left: Math.max(10, statusClickPosition.x - 80),
                        top: statusClickPosition.y + 10,
                    }}
                    className="w-40 rounded-lg shadow-xl bg-white border border-gray-200 overflow-hidden z-50"
                >
                    <div className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-transparent border-b-white"></div>
                    <div className="py-1">
                        {Object.entries(statusColors).map(([key, colorClass]) => (
                            <button
                                key={key}
                                className={`w-full flex items-center justify-center py-2 px-3 text-black cursor-pointer ${colorClass} hover:opacity-90 transition-opacity relative group`}
                                onClick={() => handleStatusUpdate(selectedStatusTask, key)}
                            >
                                <span className="fold-paper-effect group-hover:block transition-all hidden"></span>
                                <span className="font-medium">{statusLabels[key]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Review Submission Modal */}
            <ReviewSubmissionModal
                isOpen={reviewSubmissionModal.isOpen}
                onClose={handleReviewSubmissionClose}
                onSubmit={handleReviewSubmission}
                isLoading={reviewSubmissionModal.isLoading}
                task={reviewSubmissionModal.task}
                project={project}
            />

            {/* Review Actions Modal */}
            <ReviewActionsModal
                isOpen={reviewActionsModal.isOpen}
                onClose={handleReviewActionsClose}
                task={reviewActionsModal.task}
                onApprove={handleReviewApprove}
                onReject={handleReviewReject}
                isLoading={reviewActionsModal.isLoading}
            />

            {/* Reason Modal */}
            <ReasonModal
                isOpen={reasonModal.isOpen}
                onClose={handleReasonModalClose}
                onSubmit={handleReasonSubmit}
                title={reasonModal.targetStatus === 'STUCK' ? 'Why is this task stuck?' : 'Why is this task overdue?'}
                placeholder={reasonModal.targetStatus === 'STUCK'
                    ? 'Please explain what is blocking this task...'
                    : 'Please explain why this task is overdue...'
                }
                isLoading={reasonModal.isLoading}
            />


            {/* Phase Tasks Modal */}
            <PhaseTasksModal
                isOpen={phaseModalOpen}
                onClose={handlePhaseModalClose}
                phaseName={selectedPhaseName}
                tasks={selectedPhaseTasks}
                onTaskClick={handleTaskClickFromPhase}
            />

            <UpdateTask
                project={project}
                task={selectedTask}
                onClose={handleEditClose}
                isOpen={isEditMode}
                getProjectDetails={getProjectDetails}
            />

            {/* Stop Time Modal */}
            <BigDialog open={!!stopTimeOpen} onClose={() => setStopTimeOpen(null)} width={34}>
                <AddWorkDescription
                    task_id={activeTimer?.task_id}
                    handleStop={handleStopTime}
                    close={() => setStopTimeOpen(null)}
                />
            </BigDialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteConfirmModal.isOpen} onOpenChange={setDeleteConfirmModal.isOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash className="w-5 h-5" />
                            Delete Task
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Are you sure you want to delete "{deleteConfirmModal.task?.name}"? This action cannot be undone and will permanently remove the task and all associated data including time tracking, comments, and files.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDeleteCancel}
                            disabled={deleteConfirmModal.isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            disabled={deleteConfirmModal.isLoading}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleteConfirmModal.isLoading ? 'Deleting...' : 'Delete Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default TaskManagementView