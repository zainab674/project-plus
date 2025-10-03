

import React, { useMemo, useState } from 'react';
import {
    Calendar,
    MapPin,
    Users,
    Circle,
    AlertTriangle,
    FileText,
    Paperclip,
    CheckCircle,
} from 'lucide-react';

export default function CaseDetail({ selectedCase, onClose }) {

    const caseData = selectedCase || mockCase;

    const {
        name,
        client_name,
        client_address,
        opposing,
        filingDate,
        status,
        priority,
        phases = [],
        Members = [],
        Tasks = [],
    } = caseData;

    const tasksByPhase = useMemo(() => {
        return Tasks.reduce((map, task) => {
            if (phases.includes(task.phase)) {
                (map[task.phase] = map[task.phase] || []).push(task);
            }
            return map;
        }, {});
    }, [Tasks, phases]);

    // 2) Everything else is “Unassigned”
    const tasksWithoutPhases = useMemo(() => {
        return Tasks.filter(task => !phases.includes(task.phase));
    }, [Tasks, phases]);

    // Calculate rejection count for each task
    const getRejectionCount = (task) => {
        // our selector puts reviews into task.inReview
        const reviews = task.inReview || [];
        return reviews.filter(r => r.action === 'REJECTED').length;
    };

    // Get approved reviews for DONE tasks
    const getApprovedReviews = (task) => {
        const reviews = task.inReview || [];
        return reviews.filter(r => r.action === 'APPROVED');
    };

    // Get approved attachments from reviews
    const getApprovedAttachments = (task) => {
        const approvedReviews = getApprovedReviews(task);
        const attachments = [];
        approvedReviews.forEach(review => {
            // Check if the review itself has attachment data
            if (review.file_url && review.filename) {
                attachments.push({
                    url: review.file_url,
                    name: review.filename,
                    mimeType: review.mimeType,
                    size: review.size,
                    key: review.key
                });
            }
            // Also check for attachments array (backward compatibility)
            if (review.attachments && Array.isArray(review.attachments)) {
                attachments.push(...review.attachments);
            }
        });
        return attachments;
    };

    // Get approved descriptions from reviews
    const getApprovedDescriptions = (task) => {
        const approvedReviews = getApprovedReviews(task);
        return approvedReviews
            .filter(review => review.submissionDesc)
            .map(review => ({
                description: review.submissionDesc,
                createdAt: review.created_at,
                reviewer: review.reviewer?.name || 'Unknown'
            }));
    };

    // Get approved count for each task
    const getApprovedCount = (task) => {
        const reviews = task.inReview || [];
        return reviews.filter(r => r.action === 'APPROVED').length;
    };

    // Show approved content dropdown
    const showApprovedContent = (task) => {
        setSelectedTaskForApproved(task);
        setApprovedDropdownOpen(true);
    };

    // modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalReviews, setModalReviews] = useState([]);

    // approved content dropdown state
    const [approvedDropdownOpen, setApprovedDropdownOpen] = useState(false);
    const [selectedTaskForApproved, setSelectedTaskForApproved] = useState(null);

    const showRejections = (task) => {
        const rejected = (task.inReview || []).filter(r => r.action === 'REJECTED');
        setModalReviews(rejected);
        setModalOpen(true);
    };

    // helpers for badge colors with pastel colors
    const getStatusColor = stat => {
        switch (stat) {
            case 'DONE':
            case 'IN_REVIEW':
                return 'border-green-300 text-green-700 bg-green-50';
            case 'IN_PROGRESS':
            case 'TO_DO':
                return 'border-yellow-300 text-yellow-700 bg-yellow-50';
            case 'OVER_DUE':
            case 'STUCK':
                return 'border-red-300 text-red-700 bg-red-50';
            default:
                return 'border-gray-300 text-gray-700 bg-gray-50';
        }
    };
    const getPriorityColor = prio => {
        switch (prio) {
            case 'CRITICAL':
            case 'High':
                return 'border-pink-300 text-pink-700 bg-pink-50';
            case 'MEDIUM':
            case 'Medium':
                return 'border-orange-300 text-orange-700 bg-orange-50';
            case 'LOW':
            case 'Low':
                return 'border-green-300 text-green-700 bg-green-50';
            default:
                return 'border-gray-300 text-gray-700 bg-gray-50';
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 rounded-lg border border-blue-200 shadow-lg space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                <div>
                    <h5 className="text-2xl font-semibold text-indigo-900">{name}</h5>
                    <p className="text-indigo-600">Client: {client_name}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-rose-400 hover:text-rose-600 text-2xl leading-none bg-rose-50 hover:bg-rose-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                    ×
                </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <p className="text-purple-600 font-medium">Opposing Party</p>
                    <p className="font-semibold text-purple-800">{opposing || 'Not specified'}</p>
                </div>
                <div className="flex items-center space-x-2 bg-teal-50 p-3 rounded-lg border border-teal-100">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    <div>
                        <p className="text-teal-600 font-medium">Start Date</p>
                        <p className="font-semibold text-teal-800">{filingDate?.split('T')[0] || 'Not set'}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <div>
                        <p className="text-blue-600 font-medium">Client Address</p>
                        <p className="font-semibold text-blue-800">{client_address || 'Not provided'}</p>
                    </div>
                </div>
                <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                    <p className="text-rose-600 font-medium">Status</p>
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            status
                        )}`}
                    >
                        {status || 'Not set'}
                    </span>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                    <p className="text-yellow-600 font-medium">Priority</p>
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                            priority
                        )}`}
                    >
                        {priority || 'Not set'}
                    </span>
                </div>

                <div className="md:col-span-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <p className="text-indigo-600 font-medium">Phases</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {phases.length
                            ? phases.map((phase, index) => (
                                <span
                                    key={phase}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${index % 2 === 0
                                        ? 'bg-violet-100 text-violet-700 border-violet-200'
                                        : 'bg-cyan-100 text-cyan-700 border-cyan-200'
                                        }`}
                                >
                                    {phase}
                                </span>
                            ))
                            : <span className="text-indigo-500">No phases defined</span>}
                    </div>
                </div>
            </div>

            {/* Members */}
            <div className="bg-white p-4 rounded-lg border border-pink-100 shadow-sm">
                <p className="text-pink-700 font-medium mb-3">Team Members</p>
                {Members.length ? (
                    <div className="flex flex-wrap gap-3">
                        {Members.map(({ user }, index) => (
                            <div
                                key={user.user_id}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${index % 3 === 0 ? 'bg-blue-100 border-blue-200' :
                                    index % 3 === 1 ? 'bg-green-100 border-green-200' :
                                        'bg-purple-100 border-purple-200'
                                    }`}
                            >
                                <Users className={`w-5 h-5 ${index % 3 === 0 ? 'text-blue-500' :
                                    index % 3 === 1 ? 'text-green-500' :
                                        'text-purple-500'
                                    }`} />
                                <span className={`font-medium ${index % 3 === 0 ? 'text-blue-800' :
                                    index % 3 === 1 ? 'text-green-800' :
                                        'text-purple-800'
                                    }`}>{user.name}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-pink-500">No members</p>
                )}
            </div>

            {/* Tasks grouped by Phase */}
            <div className="space-y-8">
                {phases.map((phase, phaseIndex) => {
                    const tasks = tasksByPhase[phase] || [];
                    const phaseColors = [
                        'bg-purple-50 border-purple-200',
                        'bg-blue-50 border-blue-200',
                        'bg-teal-50 border-teal-200',
                        'bg-indigo-50 border-indigo-200',
                        'bg-violet-50 border-violet-200',
                        'bg-cyan-50 border-cyan-200'
                    ];
                    return (
                        <div key={phase} className={`p-4 rounded-lg border ${phaseColors[phaseIndex % phaseColors.length]}`}>
                            <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${phaseIndex % 6 === 0 ? 'bg-purple-400' :
                                    phaseIndex % 6 === 1 ? 'bg-blue-400' :
                                        phaseIndex % 6 === 2 ? 'bg-teal-400' :
                                            phaseIndex % 6 === 3 ? 'bg-indigo-400' :
                                                phaseIndex % 6 === 4 ? 'bg-violet-400' :
                                                    'bg-cyan-400'
                                    }`}></div>
                                {phase}
                            </h4>

                            {tasks.length ? (
                                tasks.map((task, taskIndex) => {
                                    const dueIso = task.last_date?.split('T')[0];
                                    return (
                                        <div
                                            key={task.task_id}
                                            className="flex items-start space-x-4 mb-6"
                                        >
                                            <div className="mt-1">
                                                <Circle className={`w-4 h-4 ${taskIndex % 4 === 0 ? 'text-rose-400' :
                                                    taskIndex % 4 === 1 ? 'text-yellow-400' :
                                                        taskIndex % 4 === 2 ? 'text-green-400' :
                                                            'text-blue-400'
                                                    }`} />
                                            </div>

                                            <div className={`flex-1 rounded-xl border shadow-sm p-4 ${taskIndex % 4 === 0 ? 'bg-rose-50 border-rose-200' :
                                                taskIndex % 4 === 1 ? 'bg-yellow-50 border-yellow-200' :
                                                    taskIndex % 4 === 2 ? 'bg-green-50 border-green-200' :
                                                        'bg-blue-50 border-blue-200'
                                                }`}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <h5 className={`text-lg font-medium ${taskIndex % 4 === 0 ? 'text-rose-800' :
                                                        taskIndex % 4 === 1 ? 'text-yellow-800' :
                                                            taskIndex % 4 === 2 ? 'text-green-800' :
                                                                'text-blue-800'
                                                        }`}>
                                                        {task.name}
                                                    </h5>
                                                    <div className="flex space-x-2">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                                task.status
                                                            )}`}
                                                        >
                                                            {task.status}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                                                                task.priority
                                                            )}`}
                                                        >
                                                            {task.priority}
                                                        </span>
                                                        {getRejectionCount(task) > 0 && (
                                                            <span
                                                                onClick={() => showRejections(task)}
                                                                className="px-2 py-1 rounded-full text-xs font-medium border border-red-300 text-red-700 bg-red-50 flex items-center gap-1 cursor-pointer hover:bg-red-100">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                {getRejectionCount(task)} {getRejectionCount(task) === 1 ? 'rejection' : 'rejections'}
                                                            </span>
                                                        )}
                                                        {task.status === 'DONE' && getApprovedCount(task) > 0 && (
                                                            <span
                                                                onClick={() => showApprovedContent(task)}
                                                                className="px-2 py-1 rounded-full text-xs font-medium border border-green-300 text-green-700 bg-green-50 flex items-center gap-1 cursor-pointer hover:bg-green-100">
                                                                <CheckCircle className="w-3 h-3" />
                                                                {getApprovedCount(task)} {getApprovedCount(task) === 1 ? 'approval' : 'approvals'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className={`text-sm mb-2 ${taskIndex % 4 === 0 ? 'text-rose-700' :
                                                    taskIndex % 4 === 1 ? 'text-yellow-700' :
                                                        taskIndex % 4 === 2 ? 'text-green-700' :
                                                            'text-blue-700'
                                                    }`}>
                                                    {task.description || 'No description'}
                                                </p>

                                                <div className={`flex items-center gap-4 text-sm ${taskIndex % 4 === 0 ? 'text-rose-600' :
                                                    taskIndex % 4 === 1 ? 'text-yellow-600' :
                                                        taskIndex % 4 === 2 ? 'text-green-600' :
                                                            'text-blue-600'
                                                    }`}>
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{dueIso || '—'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-gray-500 italic">
                                    No tasks in this phase.
                                </p>
                            )}
                        </div>
                    );
                })}

                {tasksWithoutPhases.length > 0 && (
                    <div className="p-4 rounded-lg border bg-white shadow-sm">
                        <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            Unassigned Tasks
                        </h4>
                        {tasksWithoutPhases.map((task, taskIndex) => {
                            const dueIso = task.last_date?.split('T')[0];
                            return (
                                <div
                                    key={task.task_id}
                                    className="flex items-start space-x-4 mb-6"
                                >
                                    <div className="mt-1">
                                        <Circle className={`w-4 h-4 ${taskIndex % 4 === 0 ? 'text-rose-400' :
                                            taskIndex % 4 === 1 ? 'text-yellow-400' :
                                                taskIndex % 4 === 2 ? 'text-green-400' :
                                                    'text-blue-400'
                                            }`} />
                                    </div>

                                    <div className={`flex-1 rounded-xl border shadow-sm p-4 bg-gray-50 border-gray-200`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h5 className={`text-lg font-medium text-gray-800`}>
                                                {task.name}
                                            </h5>
                                            <div className="flex space-x-2">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                        task.status
                                                    )}`}
                                                >
                                                    {task.status}
                                                </span>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                                                        task.priority
                                                    )}`}
                                                >
                                                    {task.priority}
                                                </span>
                                                {getRejectionCount(task) > 0 && (
                                                    <span
                                                        onClick={() => showRejections(task)}
                                                        className="px-2 py-1 rounded-full text-xs font-medium border border-red-300 text-red-700 bg-red-50 flex items-center gap-1 cursor-pointer hover:bg-red-100">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {getRejectionCount(task)} {getRejectionCount(task) === 1 ? 'rejection' : 'rejections'}
                                                    </span>
                                                )}
                                                {task.status === 'DONE' && getApprovedCount(task) > 0 && (
                                                    <span
                                                        onClick={() => showApprovedContent(task)}
                                                        className="px-2 py-1 rounded-full text-xs font-medium border border-green-300 text-green-700 bg-green-50 flex items-center gap-1 cursor-pointer hover:bg-green-100">
                                                        <CheckCircle className="w-3 h-3" />
                                                        {getApprovedCount(task)} {getApprovedCount(task) === 1 ? 'approval' : 'approvals'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className={`text-sm mb-2 text-gray-700`}>
                                            {task.description || 'No description'}
                                        </p>

                                        <div className={`flex items-center gap-4 text-sm text-gray-600`}>
                                            <Calendar className="w-4 h-4" />
                                            <span>{dueIso || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}




            </div>



            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Rejection Reasons</h3>
                        <ul className="space-y-3 max-h-64 overflow-y-auto">
                            {modalReviews.map((r, i) => (
                                <li key={i} className="border-b pb-2">
                                    <p className="text-sm font-medium">Submitted at: {r.created_at.split('T')[0]}</p>
                                    <p className="text-sm">Desc: {r.submissionDesc}</p>
                                    {r.rejectedReason && (
                                        <p className="text-sm text-red-600">Reason: {r.rejectedReason}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 text-right">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approved Content Dropdown Modal */}
            {approvedDropdownOpen && selectedTaskForApproved && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Approved Content - {selectedTaskForApproved.name}
                            </h3>
                            <button
                                onClick={() => {
                                    setApprovedDropdownOpen(false);
                                    setSelectedTaskForApproved(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Approved Descriptions */}
                            {getApprovedDescriptions(selectedTaskForApproved).length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="text-md font-medium text-green-800 mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Approved Descriptions
                                    </h4>
                                    <div className="space-y-3">
                                        {getApprovedDescriptions(selectedTaskForApproved).map((desc, idx) => (
                                            <div key={idx} className="bg-white rounded-lg p-3 border border-green-100">
                                                <p className="text-sm text-green-700 mb-2">{desc.description}</p>
                                                <div className="flex justify-between items-center text-xs text-green-600">
                                                    <span>Approved by: {desc.reviewer}</span>
                                                    <span>Date: {desc.createdAt.split('T')[0]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Approved Attachments */}
                            {getApprovedAttachments(selectedTaskForApproved).length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="text-md font-medium text-blue-800 mb-3 flex items-center gap-2">
                                        <Paperclip className="w-4 h-4" />
                                        Approved Attachments
                                    </h4>
                                    <div className="space-y-3">
                                        {getApprovedAttachments(selectedTaskForApproved).map((attachment, idx) => (
                                            <div key={idx} className="bg-white rounded-lg p-3 border border-blue-100">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-blue-700 mb-1">
                                                            {attachment.name || 'Attachment'}
                                                        </p>
                                                        {attachment.mimeType && (
                                                            <p className="text-xs text-blue-600 mb-2">
                                                                Type: {attachment.mimeType}
                                                            </p>
                                                        )}
                                                        {attachment.size && (
                                                            <p className="text-xs text-blue-600">
                                                                Size: {(attachment.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        )}
                                                    </div>
                                                    {attachment.url && (
                                                        <a
                                                            href={attachment.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs hover:bg-blue-200 transition-colors"
                                                        >
                                                            View File
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {getApprovedDescriptions(selectedTaskForApproved).length === 0 &&
                                getApprovedAttachments(selectedTaskForApproved).length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No approved content found for this task.</p>
                                    </div>
                                )}
                        </div>

                        <div className="mt-6 text-right">
                            <button
                                onClick={() => {
                                    setApprovedDropdownOpen(false);
                                    setSelectedTaskForApproved(null);
                                }}
                                className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}