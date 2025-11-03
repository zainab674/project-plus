import React, { useState, useMemo } from 'react';
import { X, Calendar, User, AlertCircle, CheckCircle, Clock, Target, ExternalLink } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { useRouter } from 'next/navigation';

const PhaseTasksModal = ({ 
    isOpen, 
    onClose, 
    phaseName, 
    tasks = [], 
    onTaskClick,
    projectId
}) => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter tasks based on search term
    const filteredTasks = useMemo(() => {
        if (!searchTerm) return tasks;
        
        return tasks.filter(task => 
            task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.priority?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tasks, searchTerm]);

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const groups = {
            'TO_DO': [],
            'IN_PROGRESS': [],
            'IN_REVIEW': [],
            'DONE': [],
            'OVER_DUE': []
        };

        filteredTasks.forEach(task => {
            const status = task.status || 'TO_DO';
            if (groups[status]) {
                groups[status].push(task);
            } else {
                groups['TO_DO'].push(task);
            }
        });

        return groups;
    }, [filteredTasks]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'DONE': return 'bg-green-100 text-green-800';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
            case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800';
            case 'OVER_DUE': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'HIGH': return 'bg-red-100 text-red-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            case 'LOW': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const isTaskOverdue = (task) => {
        if (!task.last_date || task.status === 'DONE') return false;
        return new Date(task.last_date) < new Date();
    };

    const handleNavigateToCase = () => {
        if (projectId) {
            router.push(`/dashboard/project/${projectId}`);
            onClose(); // Close modal when navigating
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{phaseName}</h2>
                            <p className="text-sm text-gray-600">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {projectId && (
                            <button
                                onClick={handleNavigateToCase}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Navigate to Case
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-12">
                            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                            <p className="text-gray-500">
                                {searchTerm ? 'No tasks match your search criteria.' : 'This phase has no tasks yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
                                if (statusTasks.length === 0) return null;

                                return (
                                    <div key={status} className="space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                                                {status.replace('_', ' ')}
                                            </span>
                                            <span className="text-gray-500">({statusTasks.length})</span>
                                        </h3>
                                        
                                        <div className="grid gap-3">
                                            {statusTasks.map((task) => (
                                                <div
                                                    key={task.task_id}
                                                    onClick={() => onTaskClick(task)}
                                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                                                {task.name}
                                                            </h4>
                                                            {task.description && (
                                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                                    {task.description}
                                                                </p>
                                                            )}
                                                            
                                                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span>Due: {formatDate(task.last_date)}</span>
                                                                    {isTaskOverdue(task) && (
                                                                        <AlertCircle className="w-3 h-3 text-red-500 ml-1" />
                                                                    )}
                                                                </div>
                                                                
                                                                {task.priority && (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                                            {task.priority}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                
                                                                {task.assignees && task.assignees.length > 0 && (
                                                                    <div className="flex items-center gap-1">
                                                                        <User className="w-3 h-3" />
                                                                        <span>{task.assignees.length} assignee{task.assignees.length !== 1 ? 's' : ''}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-2 ml-4">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                                                                {task.status?.replace('_', ' ')}
                                                            </span>
                                                            
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhaseTasksModal;
