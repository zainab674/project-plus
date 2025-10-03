import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { createPortal } from 'react-dom'
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
import { TaskDetailModal } from "./TaskDetailModal"
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
import { toast } from 'react-toastify'
import Link from "next/link"
import UpdateTask from "./Dialogs/UpdateTask";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Portal Dropdown Component
const PortalDropdown = ({ isOpen, anchorRef, children, className = "" }) => {
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        if (isOpen && anchorRef) {
            // Handle both ref objects and DOM elements
            const element = anchorRef.current || anchorRef;
            if (element) {
                const rect = element.getBoundingClientRect();
                console.log('PortalDropdown positioning:', { rect, isOpen });
                setPosition({
                    top: rect.top - 8, // Position above the button
                    left: rect.left,
                    width: rect.width
                });
            } else {
                console.log('PortalDropdown: element not found', { anchorRef, isOpen });
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
const ReviewSubmissionModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [description, setDescription] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const fileInputRef = useRef(null)

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (description.trim()) {
            onSubmit(description.trim(), selectedFile)
            setDescription('')
            setSelectedFile(null)
        }
    }

    const handleClose = () => {
        setDescription('')
        setSelectedFile(null)
        onClose()
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
                        <div className="flex items-center gap-2">
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
                            {selectedFile && (
                                <span className="text-sm text-gray-600 truncate">
                                    {selectedFile.name}
                                </span>
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
    const [timesTasks, setTimesTasks] = useState({})
    const [loadingTask, setLoadingTask] = useState(null)
    const [loadingStopTask, setLoadingStopTask] = useState(null)
    const [stopTimeOpen, setStopTimeOpen] = useState(null)
    const [selectedTask, setSelectedTask] = useState(null)
    const [taskDetailOpen, setTaskDetailOpen] = useState(false)
    
    // Phase dropdown refs for portal positioning
    const phaseButtonRefs = useRef({})
    
    // Click outside handler for phase dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isPhaseButton = Object.values(phaseButtonRefs.current).some(ref => ref?.contains(event.target));
            const isDropdownContent = event.target.closest('.portal-dropdown-content');
            
            console.log('🔍 Click outside check:', {
                target: event.target,
                isPhaseButton,
                isDropdownContent,
                willClose: !isPhaseButton && !isDropdownContent
            });
            
            if (!isPhaseButton && !isDropdownContent) {
                console.log('🚪 Closing phase dropdowns');
                setShowPhaseDropdown({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    const { user, loadUser } = useUser()

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
                        console.log(`Updated ${updatedCount} overdue tasks`)
                    }
                })
            }
        }
    }, [ccproject, checkAndUpdateOverdueTasks])

    useEffect(() => {
        if (!user) return
        let timesTasks = {}
        // Add safety check for user.Time - it might be undefined after auth middleware optimization
        if (user.Time && Array.isArray(user.Time)) {
            user.Time.forEach(time =>
                timesTasks[time.task_id] = time.start
            )
        }
        setTimesTasks(timesTasks)
    }, [user])

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
    const handleReviewSubmission = useCallback(async (description, file) => {
        const { task } = reviewSubmissionModal

        setReviewSubmissionModal(prev => ({ ...prev, isLoading: true }))

        try {
            // Create FormData for review submission
            const formData = new FormData()

            // Convert task_id to number before appending
            const numericTaskId = parseInt(task.task_id)
            formData.append('task_id', numericTaskId.toString()) // Ensure it's explicitly a string representation of the number
            formData.append('submissionDesc', description)

            if (file) {
                formData.append('file', file)
            }

            // Debug: Check what we're sending
            console.log('Sending FormData with task_id:', numericTaskId, 'type:', typeof numericTaskId)

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

    // Phase change handler
    const handlePhaseChange = useCallback(async (task_id, newPhase) => {
        console.log('🔄 Phase change initiated:', { task_id, newPhase, taskIdType: typeof task_id });
        
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
            console.log('📡 Calling updateTaskRequest with:', { phase: newPhase, task_id: numericTaskId });
            console.log('📡 Request URL will be:', `/task/${numericTaskId}`);
            console.log('📡 Request data:', { phase: newPhase });
            
            const response = await updateTaskRequest({ phase: newPhase }, numericTaskId)
            console.log('✅ Phase update successful, response:', response);
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
            console.log(error?.response?.data?.message || error?.message)
            toast.error("Failed to update task status")
        }
    }, [project])

    // Time tracking handlers
    const handleStartTime = useCallback(async (task_id) => {
        try {
            setLoadingTask(task_id)
            const res = await createTimeRequest(task_id)
            await loadUser()
            toast.success(res.data.message)
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        } finally {
            setLoadingTask(null)
        }
    }, [loadUser])

    const handleStopTime = useCallback(async (task_id, description) => {
        try {
            setLoadingStopTask(task_id)
            // Add safety check for user.Time
            if (!user.Time || !Array.isArray(user.Time)) {
                toast.error('Time data not available');
                return;
            }
            const time = user.Time.find(time => time.task_id == task_id)
            if (!time) return

            const formdata = { description }
            const res = await stopTimeRequest(time.time_id, formdata)
            await loadUser()
            toast.success(res.data.message)
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        } finally {
            setLoadingStopTask(null)
        }
    }, [user, loadUser])

    const handleTaskClick = useCallback((task, event) => {
        if (event.target.closest('button')) {
            return
        }
        setSelectedTask(task)
        setTaskDetailOpen(true)
    }, [])

    const closeTaskDetail = useCallback(() => {
        setTaskDetailOpen(false)
        setSelectedTask(null)
    }, [])

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
                                                                        console.log('🎯 Kanban phase button clicked:', { taskId: task.task_id, currentState: showPhaseDropdown[task.task_id] });
                                                                        e.stopPropagation()
                                                                        e.preventDefault()
                                                                        setShowPhaseDropdown(prev => {
                                                                            const newState = {
                                                                                ...prev,
                                                                                [task.task_id]: !prev[task.task_id]
                                                                            };
                                                                            console.log('🔄 Phase dropdown state change:', { taskId: task.task_id, newState });
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
                                                                        {timesTasks.hasOwnProperty(task.task_id) ? (
                                                                            <>
                                                                                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md">
                                                                                    <Timer startTime={timesTasks[task.task_id]} className="text-xs" />
                                                                                </div>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="w-8 h-8 p-0 hover:bg-red-50"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setStopTimeOpen(task.task_id)
                                                                                    }}
                                                                                    disabled={loadingStopTask === task.task_id}
                                                                                    isLoading={loadingStopTask === task.task_id}
                                                                                >
                                                                                    {loadingStopTask !== task.task_id && <Pause className="w-3 h-3" />}
                                                                                </Button>
                                                                            </>
                                                                        ) : (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="w-8 h-8 p-0 hover:bg-green-50"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    handleStartTime(task.task_id)
                                                                                }}
                                                                                disabled={loadingTask === task.task_id}
                                                                                isLoading={loadingTask === task.task_id}
                                                                            >
                                                                                {loadingTask !== task.task_id && <Play className="w-3 h-3" />}
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
                                                                console.log('Phase dropdown state:', { taskId: task.task_id, newState });
                                                                return newState;
                                                            })
                                                        }}
                                                        className="flex items-center justify-center space-x-1 px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors w-full"
                                                    >
                                                        <span className="truncate">{task.phase}</span>
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
                                                            {timesTasks.hasOwnProperty(task.task_id) ? (
                                                                <>
                                                                    <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md">
                                                                        <Timer startTime={timesTasks[task.task_id]} className="text-xs" />
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="w-8 h-8 p-0 hover:bg-red-50"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setStopTimeOpen(task.task_id)
                                                                        }}
                                                                        disabled={loadingStopTask === task.task_id}
                                                                        isLoading={loadingStopTask === task.task_id}
                                                                    >
                                                                        {loadingStopTask !== task.task_id && <Pause className="w-3 h-3" />}
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="w-8 h-8 p-0 hover:bg-green-50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleStartTime(task.task_id)
                                                                    }}
                                                                    disabled={loadingTask === task.task_id}
                                                                    isLoading={loadingTask === task.task_id}
                                                                >
                                                                    {loadingTask !== task.task_id && <Play className="w-3 h-3" />}
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
                                        console.log('🎯 PortalDropdown Phase button clicked:', { taskId: task.task_id, phaseOption });
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

            {/* Task Detail Modal */}
            <TaskDetailModal
                project={project}
                getProjectDetails={getProjectDetails}
                task={selectedTask}
                isOpen={taskDetailOpen}
                onClose={closeTaskDetail}
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
                    task_id={stopTimeOpen}
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