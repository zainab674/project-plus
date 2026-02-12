"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import RenderMembers from '@/components/RenderMembers'
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
    FileIcon,
    Folder,
    ArrowLeft,
    Inbox,
    Mail,
    Video
} from 'lucide-react'
import { useUser } from '@/providers/UserProvider'
import { useTimer } from '@/providers/TimerProvider'
import { toast } from 'react-toastify'
import Timer from '@/components/Timer'
import BigDialog from '@/components/Dialogs/BigDialog'
import AddWorkDescription from '@/components/AddWorkDescription'
import TaskComments from '@/components/TaskComments'
import UpdateTask from '@/components/Dialogs/UpdateTask'
import TaskUpdateModal from '@/components/Dialogs/TaskUpdateModal'
import TaskChat from '@/components/TaskChat'
import moment from 'moment'
import { getMediaByTaskIdRequest } from '@/lib/http/media'
import { getTemplatesByTaskIdRequest } from '@/lib/http/caseTemplate'
import { getTaskByIdRequest, addTaskNoteRequest, getTaskNotesRequest, getTaskUpdatesByTaskRequest } from '@/lib/http/task'
import { getProjectRequest } from '@/lib/http/project'
import Loader from '@/components/Loader'
import AvatarCompoment from '@/components/AvatarCompoment'
import { Send, StickyNote } from 'lucide-react'
import { viewFile, downloadFile } from '@/utils/fileUtils'

// Import utility components from TaskDetailModal
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

const AttachmentsCard = ({ task, media, loadingMedia, onEditDocument, projectId, project }) => {
    const [showAttachments, setShowAttachments] = useState(false)
    const router = useRouter()
    
    const getAttachments = (task, media) => {
        if (media) {
            if (media.media) {
                if (Array.isArray(media.media)) {
                    return media.media
                } else if (media.media && typeof media.media === 'object') {
                    return [media.media]
                }
            }
            if (Array.isArray(media)) {
                return media
            } else if (media && typeof media === 'object') {
                return [media]
            }
        }
        if (task.media) {
            if (Array.isArray(task.media)) {
                return task.media
            } else if (task.media && typeof task.media === 'object') {
                return [task.media]
            }
        }
        return task.Media || []
    }

    const attachments = getAttachments(task, media)

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

    const handleView = (attachment) => {
        try {
            // Navigate to create documents page and show the attachment
            // Use projectId from params, or get it from task/project
            const targetProjectId = projectId || task?.project_id || project?.project_id || 1;
            const mediaId = attachment.media_id || attachment.id;
            
            if (!mediaId) {
                console.error('Attachment missing media_id or id:', attachment);
                toast.error('Cannot navigate: Attachment ID not found');
                return;
            }
            
            console.log('Navigating to create-document page:', {
                projectId: targetProjectId,
                mediaId: mediaId,
                attachment: attachment
            });
            
            router.push(`/dashboard/create-document/${targetProjectId}?highlightMediaId=${mediaId}`);
        } catch (error) {
            console.error('Error navigating to create-document page:', error);
            toast.error('Failed to navigate to documents page');
        }
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
                                            onClick={() => handleView(attachment)}
                                            className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                                        >
                                            <Eye className="w-3 h-3" />
                                            View
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
        window.open(template.path, '_blank')
    }

    const handleEditTemplate = (template) => {
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
                        {templates.map((template, index) => (
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
                        ))}
                    </div>
                )}
            </div>
        </InfoCard>
    )
}

export default function TaskDetailPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id
    const taskId = params.taskId

    const [task, setTask] = useState(null)
    const [project, setProject] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditMode, setIsEditMode] = useState(false)
    const [taskMedia, setTaskMedia] = useState(null)
    const [loadingMedia, setLoadingMedia] = useState(false)
    const [taskTemplates, setTaskTemplates] = useState(null)
    const [loadingTemplates, setLoadingTemplates] = useState(false)
    const [stopTimeOpen, setStopTimeOpen] = useState(null)
    const [notes, setNotes] = useState([])
    const [loadingNotes, setLoadingNotes] = useState(false)
    const [noteContent, setNoteContent] = useState('')
    const [isAddingNote, setIsAddingNote] = useState(false)
    const [updates, setUpdates] = useState([])
    const [loadingUpdates, setLoadingUpdates] = useState(false)
    const [selectedOverviewType, setSelectedOverviewType] = useState('mail')

    const overviewBuckets = useMemo(() => ({
        mail: {
            label: 'Mails',
            icon: Mail,
            unread: 3,
            description: 'Threads still waiting for a reply',
            items: [
                {
                    name: 'Avery Ross',
                    summary: `Needs the latest draft for "${task?.name || 'this task'}"`,
                    time: '2h ago',
                    note: 'Marked as unread'
                },
                {
                    name: 'Client Success',
                    summary: 'Shared updated billing questions',
                    time: 'Yesterday',
                    note: 'Waiting for internal review'
                },
                {
                    name: 'Alex Patel',
                    summary: 'Forwarded reference documents',
                    time: 'Mon 9:14 AM',
                    note: 'Pending attachment check'
                }
            ]
        },
        meetings: {
            label: 'Meetings',
            icon: Video,
            unread: 2,
            description: 'Upcoming or unreviewed sessions',
            items: [
                {
                    name: 'Kick-off recap',
                    summary: 'Notes from yesterday’s huddle',
                    time: 'Today 11:00',
                    note: 'Minutes need confirmation'
                },
                {
                    name: 'Client check-in',
                    summary: 'Scheduling follow-up with legal team',
                    time: 'Tomorrow 15:30',
                    note: 'Waiting for invite acceptance'
                }
            ]
        }
    }), [task?.name])

    const activeOverviewBucket = overviewBuckets[selectedOverviewType] || overviewBuckets.mail
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
    
    const { activeTimer, startTimer, stopTimer, loadingStart, loadingStop } = useTimer()
    const { user } = useUser()

    // Fetch task and project data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Fetch task
                const taskResponse = await getTaskByIdRequest(taskId)
                setTask(taskResponse.data.task)

                // Fetch project
                if (projectId) {
                    const projectResponse = await getProjectRequest(projectId)
                    setProject(projectResponse.data.project)
                }
            } catch (error) {
                toast.error('Failed to load task details')
                console.error('Error fetching task:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (taskId) {
            fetchData()
        }
    }, [taskId, projectId])

    // Fetch notes
    const fetchNotes = useCallback(async () => {
        if (!task?.task_id) return
        
        setLoadingNotes(true)
        try {
            const res = await getTaskNotesRequest(task.task_id)
            setNotes(res?.data?.notes || [])
        } catch (error) {
            console.error('Error fetching notes:', error)
            setNotes([])
        } finally {
            setLoadingNotes(false)
        }
    }, [task?.task_id])

    // Fetch updates
    const fetchUpdates = useCallback(async () => {
        if (!task?.task_id) return
        
        setLoadingUpdates(true)
        try {
            const res = await getTaskUpdatesByTaskRequest(task.task_id)
            setUpdates(res?.data?.updates || [])
        } catch (error) {
            console.error('Error fetching updates:', error)
            setUpdates([])
        } finally {
            setLoadingUpdates(false)
        }
    }, [task?.task_id])

    // Fetch media, templates, and notes when task is loaded
    useEffect(() => {
        if (task && task.task_id) {
            // Fetch media
            setLoadingMedia(true)
            getMediaByTaskIdRequest(task.task_id)
                .then(response => {
                    setTaskMedia(response.data)
                })
                .catch(error => {
                    setTaskMedia(null)
                })
                .finally(() => {
                    setLoadingMedia(false)
                })
            
            // Fetch templates
            setLoadingTemplates(true)
            getTemplatesByTaskIdRequest(task.task_id)
                .then(response => {
                    setTaskTemplates(response.data.templates || [])
                })
                .catch(error => {
                    setTaskTemplates([])
                })
                .finally(() => {
                    setLoadingTemplates(false)
                })

            // Fetch notes
            fetchNotes()
            
            // Fetch updates
            fetchUpdates()
        }
    }, [task?.task_id, fetchNotes, fetchUpdates])

    const handleAddNote = useCallback(async () => {
        if (!noteContent.trim()) {
            toast.error('Please enter a note')
            return
        }
        
        setIsAddingNote(true)
        try {
            const formdata = {
                content: noteContent,
                task_id: task.task_id
            }
            const res = await addTaskNoteRequest(formdata)
            setNoteContent('')
            await fetchNotes()
            toast.success(res?.data?.message || 'Note added successfully')
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || 'Failed to add note')
        } finally {
            setIsAddingNote(false)
        }
    }, [noteContent, task?.task_id, fetchNotes])

    const handleNoteKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && noteContent.trim()) {
            e.preventDefault()
            handleAddNote()
        }
    }

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

    const handleEditClick = () => {
        setIsEditMode(true)
    }

    const handleEditClose = () => {
        setIsEditMode(false)
        // Refresh task data
        if (taskId) {
            getTaskByIdRequest(taskId)
                .then(response => {
                    setTask(response.data.task)
                })
                .catch(error => {
                    console.error('Error refreshing task:', error)
                })
        }
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
        const editUrl = `/dashboard/edit-file/${attachment.media_id || attachment.id}?file=${encodeURIComponent(attachment.file_url)}&media_id=${attachment.media_id || attachment.id}&task_id=${task.task_id}&project_name=${encodeURIComponent(project?.name || 'Unknown Project')}&filename=${encodeURIComponent(attachment.filename)}`
        window.open(editUrl, '_blank')
    }

    const handleBack = () => {
        router.push(`/dashboard/project/${projectId}`)
    }

    if (isLoading) {
        return (
            <div className="h-screen bg-white m-2 rounded-md flex items-center justify-center">
                <Loader />
            </div>
        )
    }

    if (!task) {
        return (
            <div className="h-screen bg-white m-2 rounded-md flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Task not found</p>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="min-h-screen bg-slate-100 p-6">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200/60">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <button
                                        onClick={handleBack}
                                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                                        title="Go back to project"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <div className="flex items-center gap-2">
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
                                </div>

                                <div className="flex items-center gap-3 text-sm text-gray-600 ml-10">
                                    <button
                                        onClick={handleCopyTaskId}
                                        className="flex items-center gap-1 hover:text-gray-800 transition-colors group"
                                    >
                                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs group-hover:bg-gray-200 transition-colors">
                                            #{task.task_id}
                                        </span>
                                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>

                                    {(project?.name || task.project?.name) && (
                                        <div className="flex items-center gap-1">
                                            <Folder className="w-3 h-3" />
                                            <span className="text-gray-700 font-medium">
                                                {project?.name || task.project?.name}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {moment(task.created_at).format("MMM DD, YYYY")}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => router.push(`/dashboard/create-document/${projectId}`)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    <Folder className="w-3 h-3" />
                                    Documents
                                </button>
                                <button
                                    onClick={() => setIsUpdateModalOpen(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    <MessageSquare className="w-3 h-3" />
                                    Updates
                                </button>
                                <button
                                    onClick={handleEditClick}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    <PenIcon className="w-3 h-3" />
                                    Edit
                                </button>
                            </div>
                        </div>

                        {/* Status and Priority Row */}
                        <div className="flex items-center gap-3 ml-10">
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

                                {/* Activity Overview */}
                                <InfoCard
                                    icon={Inbox}
                                    title="Unchecked Overview"
                                    gradient="from-indigo-50 to-slate-50"
                                >
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="md:w-1/3 space-y-2">
                                            {Object.entries(overviewBuckets).map(([key, bucket]) => {
                                                const BucketIcon = bucket.icon
                                                const isActive = key === selectedOverviewType
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => setSelectedOverviewType(key)}
                                                        className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${isActive ? 'border-indigo-400 bg-white shadow-sm' : 'border-gray-200 bg-white/60 hover:bg-white'}`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`p-1.5 rounded ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                    <BucketIcon className="w-3.5 h-3.5" />
                                                                </div>
                                                                <span className="font-semibold text-sm text-gray-800">{bucket.label}</span>
                                                            </div>
                                                            <Badge variant="secondary" className="text-[11px]">
                                                                {bucket.unread} unread
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {bucket.description}
                                                        </p>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <div className="flex-1 border border-gray-200 rounded-lg bg-white/80 p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm text-gray-800">
                                                        {activeOverviewBucket.label}
                                                    </span>
                                                    <Badge variant="outline" className="text-[11px]">
                                                        {activeOverviewBucket.unread} pending
                                                    </Badge>
                                                </div>
                                                <span className="text-[10px] uppercase tracking-wide text-gray-400">
                                                    Dummy preview
                                                </span>
                                            </div>
                                            {activeOverviewBucket.items.length > 0 ? (
                                                <div className="space-y-2 max-h-56 overflow-y-auto">
                                                    {activeOverviewBucket.items.map((item, index) => (
                                                        <div key={index} className="border border-gray-200 rounded-md p-3 bg-white">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                                                    <p className="text-xs text-gray-500">{item.summary}</p>
                                                                </div>
                                                                <span className="text-xs text-gray-400">{item.time}</span>
                                                            </div>
                                                            <p className="text-xs text-indigo-600 mt-1">{item.note}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center text-sm text-gray-500 py-6 border border-dashed border-gray-200 rounded-md">
                                                    Everything is up to date
                                                </div>
                                            )}
                                        </div>
                                    </div>
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

                                {/* Updates */}
                                <InfoCard
                                    icon={MessageSquare}
                                    title="Updates"
                                    gradient="from-green-50 to-emerald-50"
                                >
                                    <div className="space-y-4">
                                        {/* Updates List */}
                                        {loadingUpdates ? (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                                            </div>
                                        ) : updates.length > 0 ? (
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {updates.map((update) => (
                                                    <div key={update.update_id} className="bg-white border border-gray-200 rounded-lg p-3">
                                                        <div className="flex items-start gap-2">
                                                            <AvatarCompoment
                                                                name={update?.user?.name}
                                                                className="!w-7 !h-7 border-2 border-gray-100 flex-shrink-0"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="font-semibold text-gray-900 text-xs">
                                                                        {update?.user?.name}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {moment(update?.created_at).format('MMM DD, YYYY HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                                                    {update?.content}
                                                                </p>
                                                                {update.Media && update.Media.length > 0 && (
                                                                    <div className="mt-2 space-y-2">
                                                                        {update.Media.map((media, idx) => (
                                                                            <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                                                                <div className="flex items-start justify-between">
                                                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                                        <Paperclip className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-xs font-medium text-blue-700 truncate">
                                                                                                {media.filename}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                                                                        <button
                                                                                            onClick={() => viewFile(media.file_url, media.filename)}
                                                                                            className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                                                                                            title="View file"
                                                                                        >
                                                                                            <Eye className="w-3 h-3" />
                                                                                            View
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => downloadFile(media.file_url, media.filename)}
                                                                                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                                                                                            title="Download file"
                                                                                        >
                                                                                            <Download className="w-3 h-3" />
                                                                                            Download
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-gray-500 text-sm">
                                                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                <p>No updates yet</p>
                                            </div>
                                        )}
                                    </div>
                                </InfoCard>

                                {/* Notes */}
                                <InfoCard
                                    icon={StickyNote}
                                    title="Notes"
                                    gradient="from-purple-50 to-indigo-50"
                                >
                                    <div className="space-y-4">
                                        {/* Notes List */}
                                        {loadingNotes ? (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                                            </div>
                                        ) : notes.length > 0 ? (
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {notes.map((note) => (
                                                    <div key={note.comment_id} className="bg-white border border-gray-200 rounded-lg p-3">
                                                        <div className="flex items-start gap-2">
                                                            <AvatarCompoment
                                                                name={note?.user?.name}
                                                                className="!w-7 !h-7 border-2 border-gray-100 flex-shrink-0"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="font-semibold text-gray-900 text-xs">
                                                                        {note?.user?.name}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {moment(note?.created_at).format('MMM DD, YYYY HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                                                    {note?.content}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-gray-500 text-sm">
                                                <StickyNote className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                <p>No notes yet</p>
                                            </div>
                                        )}

                                        {/* Add Note Form */}
                                        <div className="border-t border-gray-200 pt-3">
                                            <div className="flex items-start gap-2">
                                                <AvatarCompoment
                                                    name={user?.name}
                                                    className="!w-7 !h-7 border-2 border-gray-100 flex-shrink-0"
                                                />
                                                <div className="flex-1">
                                                    <textarea
                                                        className="w-full text-gray-900 placeholder:text-gray-500 outline-none border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-colors resize-none"
                                                        placeholder="Add a note..."
                                                        value={noteContent}
                                                        onChange={(e) => setNoteContent(e.target.value)}
                                                        onKeyDown={handleNoteKeyDown}
                                                        rows={2}
                                                    />
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p className="text-xs text-gray-500">
                                                            Press Enter to send, Shift + Enter for new line
                                                        </p>
                                                        <button
                                                            onClick={handleAddNote}
                                                            disabled={isAddingNote || !noteContent.trim()}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Send className="w-3 h-3" />
                                                            {isAddingNote ? 'Adding...' : 'Add Note'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
                                <AttachmentsCard task={task} media={taskMedia} loadingMedia={loadingMedia} onEditDocument={handleEditDocument} projectId={projectId} project={project} />

                                {/* Edited Templates */}
                                <EditedTemplatesCard task={task} templates={taskTemplates} loadingTemplates={loadingTemplates} />

                                {/* Task Chat */}
                                <InfoCard
                                    icon={MessageSquare}
                                    title="Task Chat"
                                    gradient="from-blue-50 to-indigo-50"
                                    className="h-fit"
                                >
                                    <div className="h-[450px] -mx-3 -mb-3">
                                        <TaskChat task={task} project={project} />
                                    </div>
                                </InfoCard>

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
            </div>

            {/* Separate UpdateTask Modal - Only shown when in edit mode */}
            <UpdateTask
                project={project}
                task={task}
                onClose={handleEditClose}
                isOpen={isEditMode}
                getProjectDetails={() => {
                    // Refresh task data
                    if (taskId) {
                        getTaskByIdRequest(taskId)
                            .then(response => {
                                setTask(response.data.task)
                            })
                            .catch(error => {
                                console.error('Error refreshing task:', error)
                            })
                    }
                }}
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

            {/* Task Update Modal */}
            <TaskUpdateModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                task={task}
                onUpdateCreated={() => {
                    fetchUpdates()
                    // Refresh task data
                    if (taskId) {
                        getTaskByIdRequest(taskId)
                            .then(response => {
                                setTask(response.data.task)
                            })
                            .catch(error => {
                                console.error('Error refreshing task:', error)
                            })
                    }
                }}
            />

        </>
    )
}

