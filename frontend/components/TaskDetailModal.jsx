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
    Eye
} from 'lucide-react'
import { useUser } from '@/providers/UserProvider'
import { toast } from 'react-toastify'
import Timer from './Timer'
import BigDialog from './Dialogs/BigDialog'
import AddWorkDescription from './AddWorkDescription'
import TaskComments from './TaskComments'
import UpdateTask from './Dialogs/UpdateTask'
import moment from 'moment'

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

export const TaskDetailModal = ({ task, project, isOpen, onClose, getProjectDetails }) => {
    const [isEditMode, setIsEditMode] = useState(false)

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

                                {/* Comments */}
                                <InfoCard
                                    icon={MessageSquare}
                                    title="Comments"
                                    gradient="from-pink-50 to-rose-50"
                                >
                                    <TaskComments taskId={task.task_id} />
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
        </>
    )
}