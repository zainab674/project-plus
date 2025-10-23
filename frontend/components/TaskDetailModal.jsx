import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from './ui/badge'
import RenderMembers from './RenderMembers'
import {
    Pause,
    Play,
    X,
    Calendar,
    User,
    Flag,
    FileText,
    Clock,
    AlertCircle,
    PenIcon,
    Trash,
    MoreVertical,
    Copy,
    ExternalLink,
    MessageSquare,
    History,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Timer as TimerIcon,
    Users,
    Target,
    Eye,
    Paperclip,
    Download,
    FileIcon
} from 'lucide-react'
import { useUser } from '@/providers/UserProvider'
import { useTimer } from '@/providers/TimerProvider'
import { toast } from 'react-toastify'
import Timer from './Timer'
import BigDialog from './Dialogs/BigDialog'
import AddWorkDescription from './AddWorkDescription'
import TaskComments from './TaskComments'
import UpdateTask from './Dialogs/UpdateTask'
import moment from 'moment'
import { getMediaByTaskIdRequest } from '@/lib/http/media'
import { getTemplatesByTaskIdRequest } from '@/lib/http/caseTemplate'

// Utility function to view files in new tab with proper filename
const viewFile = async (url, filename) => {
  try {
    console.log('Viewing file:', { url, filename });
    
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
};

const statuses = [
    ["TO_DO", "TO DO"],
    ["IN_PROGRESS", "IN PROGRESS"],
    ["STUCK", "STUCK"],
    ["DONE", "DONE"],
    ["OVER_DUE", "OVER DUE"]
]

const statusConfig = {
    "TO_DO": {
        color: "bg-slate-100 text-slate-700 border-slate-200",
        icon: Clock,
        label: "To Do"
    },
    "IN_PROGRESS": {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: TimerIcon,
        label: "In Progress"
    },
    "STUCK": {
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: AlertTriangle,
        label: "Stuck"
    },
    "DONE": {
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
        label: "Done"
    },
    "OVER_DUE": {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: XCircle,
        label: "Overdue"
    }
}

const priorityConfig = {
    "LOW": {
        color: "bg-green-50 text-green-700 border-green-200",
        gradient: "from-green-50 to-emerald-50"
    },
    "MEDIUM": {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        gradient: "from-amber-50 to-yellow-50"
    },
    "HIGH": {
        color: "bg-orange-50 text-orange-700 border-orange-200",
        gradient: "from-orange-50 to-red-50"
    },
    "CRITICAL": {
        color: "bg-red-50 text-red-700 border-red-200",
        gradient: "from-red-50 to-rose-50"
    }
}

const StatusBadge = ({ status }) => {
    const config = statusConfig[status]
    const StatusIcon = config?.icon || Clock

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border ${config?.color || 'bg-gray-100'} font-medium text-xs`}>
            <StatusIcon className="w-3 h-3" />
            {config?.label || status}
        </div>
    )
}

const PriorityBadge = ({ priority }) => {
    const config = priorityConfig[priority]

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border ${config?.color || 'bg-gray-50'} font-medium text-xs`}>
            <Flag className="w-3 h-3" />
            {priority}
        </div>
    )
}

const InfoCard = ({ icon: Icon, title, children, className = "", gradient = "from-slate-50 to-gray-50" }) => (
    <div className={`bg-gradient-to-br ${gradient} border border-gray-200/60 rounded-lg p-3 transition-all duration-200 hover:shadow-sm ${className}`}>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-white/80 rounded">
                <Icon className="w-3 h-3 text-gray-600" />
            </div>
            <h4 className="font-semibold text-gray-800 text-xs">{title}</h4>
        </div>
        {children}
    </div>
)

const ReasonCard = ({ type, reason }) => {
    if (!reason) return null

    const isStuck = type === 'stuck'
    const config = {
        stuck: {
            title: 'Blocked Reason',
            icon: AlertTriangle,
            gradient: 'from-amber-50 to-yellow-50',
            iconColor: 'text-amber-600',
            bgColor: 'bg-amber-50/50'
        },
        overdue: {
            title: 'Overdue Reason',
            icon: XCircle,
            gradient: 'from-red-50 to-rose-50',
            iconColor: 'text-red-600',
            bgColor: 'bg-red-50/50'
        }
    }

    const currentConfig = config[type]
    const Icon = currentConfig.icon

    return (
        <div className={`bg-gradient-to-br ${currentConfig.gradient} border border-gray-200/60 rounded-lg p-3`}>
            <div className="flex items-start gap-2">
                <div className={`p-1 ${currentConfig.bgColor} rounded`}>
                    <Icon className={`w-3 h-3 ${currentConfig.iconColor}`} />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-xs mb-1">{currentConfig.title}</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{reason}</p>
                </div>
            </div>
        </div>
    )
}

const AttachmentsCard = ({ task, media, loadingMedia, onEditDocument }) => {
    const [showAttachments, setShowAttachments] = useState(false)
    
    // Debug logging to understand the data structure (remove in production)
    // console.log('AttachmentsCard - task:', task)
    // console.log('AttachmentsCard - media:', media)
    // console.log('AttachmentsCard - loadingMedia:', loadingMedia)
    
    // Get attachments from task media or separate media object
    const getAttachments = (task, media) => {
        // Check if media is passed as a separate prop (from API response)
        if (media) {
            // Handle API response structure where media might be an object with media data
            if (media.media) {
                // If media has a nested media property, use that
                if (Array.isArray(media.media)) {
                    return media.media
                } else if (media.media && typeof media.media === 'object') {
                    return [media.media]
                }
            }
            
            // Handle both single media object and array of media objects
            if (Array.isArray(media)) {
                return media
            } else if (media && typeof media === 'object') {
                // Single media object - wrap in array
                return [media]
            }
        }
        
        // Check if task has media data embedded (from API response structure)
        if (task.media) {
            if (Array.isArray(task.media)) {
                return task.media
            } else if (task.media && typeof task.media === 'object') {
                return [task.media]
            }
        }
        
        // Fallback to task.Media for backward compatibility
        return task.Media || []
    }

    const attachments = getAttachments(task, media)
    // console.log('AttachmentsCard - attachments:', attachments)

    // Show loading state
    if (loadingMedia) {
        return (
            <InfoCard
                icon={Paperclip}
                title="Attachments"
                gradient="from-blue-50 to-indigo-50"
            >
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Loading attachments...
                </div>
            </InfoCard>
        )
    }

    if (attachments.length === 0) return null

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getFileIcon = (mimeType) => {
        if (mimeType?.includes('pdf')) return '📄'
        if (mimeType?.includes('image')) return '🖼️'
        if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝'
        if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊'
        if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return '📽️'
        return '📎'
    }

    const handleDownload = (attachment) => {
        window.open(attachment.file_url, '_blank')
    }

    return (
        <InfoCard
            icon={Paperclip}
            title="Attachments"
            gradient="from-blue-50 to-indigo-50"
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {attachments.length} {attachments.length === 1 ? 'attachment' : 'attachments'}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowAttachments(!showAttachments)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                    >
                        <Eye className="w-3 h-3" />
                        {showAttachments ? 'Hide' : 'View'} Details
                    </button>
                </div>

                {showAttachments && (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                        {attachments.map((attachment, index) => (
                            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="text-lg">{getFileIcon(attachment.mimeType)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-blue-700 truncate">
                                                {attachment.filename}
                                            </p>
                                            <p className="text-xs text-blue-600">
                                                {formatFileSize(attachment.size)} • {moment(attachment.created_at).format('MMM DD, YYYY')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                // Use viewFile to open in new tab with proper filename
                                                viewFile(attachment.file_url, attachment.filename);
                                            }}
                                            className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                                        >
                                            <Eye className="w-3 h-3" />
                                            View
                                        </button>
                                        <button
                                            onClick={() => onEditDocument(attachment)}
                                            className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors"
                                        >
                                            <PenIcon className="w-3 h-3" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDownload(attachment)}
                                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                                        >
                                            <Download className="w-3 h-3" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                                
                                {attachment.user && (
                                    <div className="text-xs text-blue-600">
                                        Uploaded by {attachment.user.name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </InfoCard>
    )
}

const RejectionCard = ({ task }) => {
    const [showRejections, setShowRejections] = useState(false)
    
    // Get rejection count and data
    const getRejectionCount = (task) => {
        const reviews = task.inReview || []
        return reviews.filter(r => r.action === 'REJECTED').length
    }

    const getRejectedReviews = (task) => {
        const reviews = task.inReview || []
        return reviews.filter(r => r.action === 'REJECTED')
    }

    const rejectionCount = getRejectionCount(task)
    const rejectedReviews = getRejectedReviews(task)

    if (rejectionCount === 0) return null

    return (
        <InfoCard
            icon={AlertTriangle}
            title="Rejections"
            gradient="from-red-50 to-rose-50"
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            {rejectionCount} {rejectionCount === 1 ? 'rejection' : 'rejections'}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowRejections(!showRejections)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-medium transition-colors"
                    >
                        <Eye className="w-3 h-3" />
                        {showRejections ? 'Hide' : 'View'} Details
                    </button>
                </div>

                {showRejections && (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                        {rejectedReviews.map((review, index) => (
                            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <span className="text-xs font-medium text-red-700">
                                        Rejected on {moment(review.created_at).format('MMM DD, YYYY')}
                                    </span>
                                </div>
                                
                                {review.submissionDesc && (
                                    <div className="mb-2">
                                        <p className="text-xs font-medium text-red-600 mb-1">Submission:</p>
                                        <p className="text-xs text-red-700 bg-red-100 p-2 rounded">
                                            {review.submissionDesc}
                                        </p>
                                    </div>
                                )}

                                {review.rejectedReason && (
                                    <div>
                                        <p className="text-xs font-medium text-red-600 mb-1">Rejection Reason:</p>
                                        <p className="text-xs text-red-700 bg-red-100 p-2 rounded">
                                            {review.rejectedReason}
                                        </p>
                                    </div>
                                )}

                                {review.filename && (
                                    <div className="mt-2">
                                        <p className="text-xs font-medium text-red-600 mb-1">Attachment:</p>
                                        <p className="text-xs text-red-700">
                                            {review.filename}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </InfoCard>
    )
}

const EditedTemplatesCard = ({ task, templates, loadingTemplates }) => {
    const [showTemplates, setShowTemplates] = useState(false)
    
    // Show loading state
    if (loadingTemplates) {
        return (
            <InfoCard
                icon={FileText}
                title="Edited Templates"
                gradient="from-purple-50 to-indigo-50"
            >
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    Loading templates...
                </div>
            </InfoCard>
        )
    }

    if (!templates || templates.length === 0) return null

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getFileIcon = (mimeType) => {
        if (mimeType?.includes('pdf')) return '📄'
        if (mimeType?.includes('image')) return '🖼️'
        if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝'
        if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊'
        if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return '📽️'
        return '📎'
    }

    const handleViewTemplate = (template) => {
        viewFile(template.path, template.name)
    }

    const handleEditTemplate = (template) => {
        // Ensure we have the required data for editing
        if (!template.file_id) {
            console.error('Template file_id is missing:', template);
            return;
        }
        
        const editUrl = `/dashboard/edit-file/${template.file_id}?file=${encodeURIComponent(template.path)}&task_id=${task.task_id}&project_name=${encodeURIComponent(task.project?.name || 'Unknown Project')}&filename=${encodeURIComponent(template.name)}`
        window.open(editUrl, '_blank')
    }

    return (
        <InfoCard
            icon={FileText}
            title="Edited Templates"
            gradient="from-purple-50 to-indigo-50"
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {templates.length} {templates.length === 1 ? 'template' : 'templates'}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-xs font-medium transition-colors"
                    >
                        <Eye className="w-3 h-3" />
                        {showTemplates ? 'Hide' : 'View'} Details
                    </button>
                </div>

                {showTemplates && (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                        {templates.map((template, index) => {
                            // Debug logging to check template structure
                            console.log('Template data:', template);
                            
                            return (
                                <div key={template.file_id || index} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-lg">{getFileIcon(template.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-purple-700 truncate">
                                                    {template.name}
                                                </p>
                                                <p className="text-xs text-purple-600">
                                                    {formatFileSize(template.size)} • {moment(template.createdAt || template.created_at).format('MMM DD, YYYY')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleViewTemplate(template)}
                                                className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                                            >
                                                <Eye className="w-3 h-3" />
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEditTemplate(template)}
                                                className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors"
                                                title="Edit this template"
                                            >
                                                <PenIcon className="w-3 h-3" />
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </InfoCard>
    )
}

export const TaskDetailModal = ({ task, project, isOpen, onClose, getProjectDetails, media }) => {
    const [isEditMode, setIsEditMode] = useState(false)
    const [taskMedia, setTaskMedia] = useState(null)
    const [loadingMedia, setLoadingMedia] = useState(false)
    const [taskTemplates, setTaskTemplates] = useState(null)
    const [loadingTemplates, setLoadingTemplates] = useState(false)
    const [stopTimeOpen, setStopTimeOpen] = useState(null)
    
    const { activeTimer, startTimer, stopTimer, loadingStart, loadingStop } = useTimer()

    // Timer handlers - moved to top to avoid hook order issues
    const handleStartTime = useCallback(async () => {
        try {
            await startTimer(task.task_id, task.name, project?.project_id || 1, project?.name || 'Unknown Project')
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }, [startTimer, task, project])

    const handleStopTime = useCallback(async (description) => {
        try {
            await stopTimer(description)
            setStopTimeOpen(null)
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }, [stopTimer])

    const isOverdue = useMemo(() => {
        if (!task || task.status === 'DONE') return false
        return moment(task.last_date).isBefore(moment(), 'day')
    }, [task])

    const daysDifference = useMemo(() => {
        if (!task) return 0
        const now = moment()
        const dueDate = moment(task.last_date)
        return dueDate.diff(now, 'days')
    }, [task])

    // Fetch media data when modal opens
    useEffect(() => {
        if (isOpen && task && task.task_id) {
            // If media is already provided, use it
            if (media) {
                setTaskMedia(media)
            } else {
                // Otherwise, fetch media data
                setLoadingMedia(true)
                getMediaByTaskIdRequest(task.task_id)
                    .then(response => {
                        // console.log('Media data fetched:', response.data)
                        setTaskMedia(response.data)
                    })
                    .catch(error => {
                        // console.log('No media found for task:', error)
                        setTaskMedia(null)
                    })
                    .finally(() => {
                        setLoadingMedia(false)
                    })
            }
            
            // Fetch templates for this task
            setLoadingTemplates(true)
            getTemplatesByTaskIdRequest(task.task_id)
                .then(response => {
                    setTaskTemplates(response.data.templates || [])
                })
                .catch(error => {
                    // console.log('No templates found for task:', error)
                    setTaskTemplates([])
                })
                .finally(() => {
                    setLoadingTemplates(false)
                })
        }
    }, [isOpen, task, media])

    if (!isOpen || !task) return null

    const handleEditClick = () => {
        setIsEditMode(true)
    }

    const handleEditClose = () => {
        setIsEditMode(false)
        if (getProjectDetails) {
            getProjectDetails()
        }
    }

    const handleMainModalClose = () => {
        setIsEditMode(false)
        onClose()
    }

    const handleCopyTaskId = async () => {
        try {
            await navigator.clipboard.writeText(task.task_id)
            toast.success('Task ID copied to clipboard')
        } catch (err) {
            toast.error('Failed to copy task ID')
        }
    }

    const handleEditDocument = (attachment) => {
        // Open document editor with task and project context
        const editUrl = `/dashboard/edit-file/${attachment.media_id || attachment.id}?file=${encodeURIComponent(attachment.file_url)}&task_id=${task.task_id}&project_name=${encodeURIComponent(project?.name || 'Unknown Project')}&filename=${encodeURIComponent(attachment.filename)}`
        window.open(editUrl, '_blank')
    }

    return (
        <>
            {/* Main Task Detail Modal */}
            <BigDialog open={isOpen && !isEditMode} onClose={handleMainModalClose} width={60}>
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200/60">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h1 className="text-xl font-bold text-gray-900 leading-tight">
                                        {task.name}
                                    </h1>
                                    {isOverdue && task.status !== 'DONE' && (
                                        <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Overdue
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <button
                                        onClick={handleCopyTaskId}
                                        className="flex items-center gap-1 hover:text-gray-800 transition-colors group"
                                    >
                                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs group-hover:bg-gray-200 transition-colors">
                                            #{task.task_id}
                                        </span>
                                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {moment(task.created_at).format("MMM DD, YYYY")}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleEditClick}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    <PenIcon className="w-3 h-3" />
                                    Edit
                                </button>

                                <button
                                    onClick={handleMainModalClose}
                                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Status and Priority Row */}
                        <div className="flex items-center gap-3">
                            <StatusBadge status={task.status} />
                            <PriorityBadge priority={task.priority} />

                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Clock className="w-3 h-3" />
                                Due {moment(task.last_date).format("MMM DD")}
                                {daysDifference >= 0 ? (
                                    <span className="text-green-600 font-medium text-xs">
                                        ({daysDifference}d left)
                                    </span>
                                ) : (
                                    <span className="text-red-600 font-medium text-xs">
                                        ({Math.abs(daysDifference)}d overdue)
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-4">
                                {/* Description */}
                                <InfoCard
                                    icon={FileText}
                                    title="Description"
                                    className="h-fit"
                                >
                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                        {task.description || "No description provided for this task."}
                                    </p>
                                </InfoCard>

                                {/* Phase */}
                                <InfoCard
                                    icon={Target}
                                    title="Phase"
                                    gradient="from-purple-50 to-indigo-50"
                                >
                                    <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium inline-block">
                                        {task.phase || "No phase assigned"}
                                    </div>
                                </InfoCard>

                                {/* Reason Cards */}
                                {(task.stuckReason || task.overDueReason) && (
                                    <div className="space-y-3">
                                        <ReasonCard type="stuck" reason={task.stuckReason} />
                                        <ReasonCard type="overdue" reason={task.overDueReason} />
                                    </div>
                                )}

                                {/* Rejections */}
                                <RejectionCard task={task} />

                                {/* Attachments */}
                                <AttachmentsCard task={task} media={taskMedia} loadingMedia={loadingMedia} onEditDocument={handleEditDocument} />

                                {/* Edited Templates */}
                                <EditedTemplatesCard task={task} templates={taskTemplates} loadingTemplates={loadingTemplates} />

                            </div>

                            {/* Sidebar */}
                            <div className="space-y-4">
                                {/* Assigned Members */}
                                <InfoCard
                                    icon={Users}
                                    title="Assigned Members"
                                    gradient="from-green-50 to-emerald-50"
                                >
                                    <div>
                                        <RenderMembers members={task.assignees} />
                                        {(!task.assignees || task.assignees.length === 0) && (
                                            <p className="text-gray-500 text-sm italic">No members assigned</p>
                                        )}
                                    </div>
                                </InfoCard>

                                {/* Timeline */}
                                <InfoCard
                                    icon={History}
                                    title="Timeline"
                                    gradient="from-slate-50 to-gray-50"
                                >
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Created</span>
                                            <span className="font-medium text-gray-800 text-xs">
                                                {moment(task.created_at).format("MMM DD")}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Updated</span>
                                            <span className="font-medium text-gray-800 text-xs">
                                                {moment(task.updated_at).format("MMM DD")}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Due</span>
                                            <span className={`font-medium text-xs ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                                                {moment(task.last_date).format("MMM DD")}
                                            </span>
                                        </div>
                                    </div>
                                </InfoCard>

                                {/* Timer */}
                                <InfoCard
                                    icon={TimerIcon}
                                    title="Time Tracking"
                                    gradient="from-blue-50 to-indigo-50"
                                >
                                    <div className="space-y-3">
                                        {activeTimer?.task_id === task.task_id ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                        <span className="text-green-700 font-medium text-sm">Timer Running</span>
                                                    </div>
                                                    <Timer startTime={activeTimer.start_time} className="text-green-600 font-mono text-sm" />
                                                </div>
                                                <button
                                                    onClick={() => setStopTimeOpen(task.task_id)}
                                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                    disabled={loadingStop === activeTimer.time_id}
                                                >
                                                    <Pause className="w-4 h-4" />
                                                    {loadingStop === activeTimer.time_id ? 'Stopping...' : 'Stop Timer'}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleStartTime}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                disabled={loadingStart === task.task_id || !!activeTimer}
                                            >
                                                <Play className="w-4 h-4" />
                                                {loadingStart === task.task_id ? 'Starting...' : 'Start Timer'}
                                            </button>
                                        )}
                                        
                                        {activeTimer && activeTimer.task_id !== task.task_id && (
                                            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                                Another timer is currently running
                                            </div>
                                        )}
                                    </div>
                                </InfoCard>
                            </div>
                        </div>
                    </div>
                </div>
            </BigDialog>

            {/* Separate UpdateTask Modal - Only shown when in edit mode */}
            <UpdateTask
                project={project}
                task={task}
                onClose={handleEditClose}
                isOpen={isEditMode}
                getProjectDetails={getProjectDetails}
            />

            {/* Stop Time Modal */}
            <BigDialog open={!!stopTimeOpen} onClose={() => setStopTimeOpen(null)} width={34}>
                <AddWorkDescription
                    onSubmit={handleStopTime}
                    onClose={() => setStopTimeOpen(null)}
                    isLoading={loadingStop === activeTimer?.time_id}
                    title="Stop Timer"
                    description="Add a description for the work completed"
                />
            </BigDialog>
        </>
    )
}