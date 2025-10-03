

import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, DollarSign, FileText, TrendingUp, PieChart, BarChart3, X, Plus, CheckCircle, AlertCircle, CheckCircle2, ChevronRight, ChevronDown, Search, Gavel, AlertTriangle } from 'lucide-react';

const Status = ({ todoData = {} }) => {
    const [selectedStatus, setSelectedStatus] = useState('pending');
    const [activeModal, setActiveModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterDay, setFilterDay] = useState('all');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    // Flatten all tasks and group by status
    const allTasks = Object.values(todoData).flatMap(day => day.tasks);

    const tasksByStatus = useMemo(() => {
        const grouped = {
            pending: [],
            inReview: [],
            outstanding: []
        };

        allTasks.forEach(task => {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            }
        });

        return grouped;
    }, []);

    const statusConfig = {
        inReview: {
            color: '#3bf6488e',
            bgColor: '#EFF6FF',
            label: 'In Review',
            count: tasksByStatus.inReview.length,
            icon: CheckCircle2
        },
        pending: {
            color: '#f59f0ba6',
            bgColor: '#FFFBEB',
            label: 'Pending',
            count: tasksByStatus.pending.length,
            icon: Clock
        },
        outstanding: {
            color: '#ef4444a2',
            bgColor: '#FEF2F2',
            label: 'Outstanding',
            count: tasksByStatus.outstanding.length,
            icon: AlertCircle
        }
    };

    const priorityConfig = {
        critical: { color: '#DC2626', icon: AlertTriangle, label: 'Critical' },
        high: { color: '#EA580C', icon: AlertCircle, label: 'High' },
        medium: { color: '#CA8A04', icon: Clock, label: 'Medium' },
        low: { color: '#059669', icon: CheckCircle2, label: 'Low' }
    };

    const totalTasks = allTasks.length;

    const filteredTasks = useMemo(() => {
        let tasks = tasksByStatus[selectedStatus] || [];

        if (searchTerm) {
            tasks = tasks.filter(task =>
                task.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.caseType.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterPriority !== 'all') {
            tasks = tasks.filter(task => task.priority === filterPriority);
        }

        if (filterDay !== 'all') {
            tasks = tasks.filter(task => task.day === filterDay);
        }

        return tasks;
    }, [selectedStatus, searchTerm, filterPriority, filterDay, tasksByStatus]);



    const Modal = ({ title, onClose, children }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );

    const TodoModal = () => {
        const config = statusConfig[selectedStatus];

        return (
            <Modal title={`${config.label} Tasks`} onClose={() => setActiveModal(null)}>
                {/* Search and Filter Controls */}
                <div className="mb-6 space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search tasks, clients, or case types..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={filterDay}
                                onChange={(e) => setFilterDay(e.target.value)}
                            >
                                <option value="all">All Days</option>
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                                <option value="Friday">Friday</option>
                            </select>
                            <select
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                            >
                                <option value="all">All Priority</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                    {filteredTasks.map((taskObj, index) => {
                        const StatusIcon = statusConfig[taskObj.status].icon;
                        const statusConf = statusConfig[taskObj.status];
                        const PriorityIcon = priorityConfig[taskObj.priority].icon;
                        const priorityColor = priorityConfig[taskObj.priority].color;

                        return (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex flex-col items-center space-y-1">
                                            <StatusIcon size={20} style={{ color: statusConf.color }} />
                                            <PriorityIcon size={16} style={{ color: priorityColor }} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 mb-1">{taskObj.task}</h4>
                                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                <span className="flex items-center space-x-1">
                                                    <Users size={14} />
                                                    <span>{taskObj.client}</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <Gavel size={14} />
                                                    <span>{taskObj.caseType}</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <Calendar size={14} />
                                                    <span>{taskObj.day}</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <Clock size={14} />
                                                    <span>{taskObj.deadline}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center space-x-2 text-sm">
                                            <span className="font-medium" style={{ color: priorityColor }}>
                                                {priorityConfig[taskObj.priority].label}
                                            </span>
                                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                                                backgroundColor: statusConf.bgColor,
                                                color: statusConf.color
                                            }}>
                                                {statusConf.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <Clock size={14} className="text-gray-400" />
                                        <span className="text-gray-600">Billable: {taskObj.billableHours}h</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <DollarSign size={14} className="text-gray-400" />
                                        <span className="text-gray-600">Fee: {taskObj.associatedFee}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <FileText size={14} className="text-gray-400" />
                                        <span className="text-gray-600">{taskObj.notes}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredTasks.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                            <p>No tasks found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </Modal>
        );
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-lg border border-blue-100 h-f">




                {Object.entries(statusConfig).map(([status, config]) => {
                    const StatusIcon = config.icon;

                    return (
                        <div
                            key={status}
                            className={`flex items-center  space-x-3 justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 border ${status === selectedStatus
                                ? 'border-blue-200'
                                : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            style={{
                                backgroundColor: status === selectedStatus ? config.bgColor : 'transparent'
                            }}
                            onClick={() => {
                                setSelectedStatus(status);
                                setActiveModal('todo');
                            }}
                        >
                            <div className="flex items-center space-x-2">
                                <StatusIcon
                                    size={20}
                                    style={{ color: config.color }}
                                />
                                <span className="text-sm font-medium text-gray-800">{config.label}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">{config.count} tasks</span>
                            </div>
                        </div>
                    );
                })}

            </div>

            {activeModal === 'todo' && <TodoModal />}
        </>
    );
};

export default Status;