



import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronDown, Maximize2, Clock, X, User, AlertCircle } from 'lucide-react';
import { getAllUserTasksRequest } from '@/lib/http/task';
import Link from 'next/link';

const Todo = () => {
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [customDate, setCustomDate] = useState('');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [showCustomDateInput, setShowCustomDateInput] = useState(false);
    const [showCustomRangeInput, setShowCustomRangeInput] = useState(false);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getAllUserTasksRequest();
            // Your existing data processing logic
            let tasks = [];
            if (response?.data?.tasks && Array.isArray(response.data.tasks)) {
                tasks = response.data.tasks;
            } else if (response?.tasks && Array.isArray(response.tasks)) {
                tasks = response.tasks;
            } else if (Array.isArray(response)) {
                tasks = response;
            }

            const validTasks = tasks.filter(task =>
                task &&
                typeof task === 'object' &&
                task.task_id
            );
            console.log("valid", validTasks)

            setAllTasks(validTasks);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setAllTasks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Generate task data grouped by weekdays
    const getTasksByWeekday = () => {
        const today = new Date();
        const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const tasksByDay = {};

        weekdays.forEach((weekday, index) => {
            const date = new Date(today);
            const mondayDate = new Date(today.setDate(today.getDate() - today.getDay() + 1));
            const targetDate = new Date(mondayDate);
            targetDate.setDate(mondayDate.getDate() + index);

            const iso = targetDate.toISOString().split('T')[0];

            const tasksForDay = allTasks.filter(task => {
                if (!task.last_date) return false;
                const taskIso = new Date(task.last_date).toISOString().split('T')[0];
                return taskIso === iso;
            });

            tasksByDay[weekday] = {
                count: tasksForDay.length,
                tasks: tasksForDay,
                date: targetDate
            };
        });

        return tasksByDay;
    };

    // Get tasks for custom date
    const getTasksForCustomDate = (date) => {
        if (!date) return [];
        const iso = new Date(date).toISOString().split('T')[0];
        return allTasks.filter(task => {
            if (!task.last_date) return false;
            const taskIso = new Date(task.last_date).toISOString().split('T')[0];
            return taskIso === iso;
        });
    };

    // Get tasks for custom date range
    const getTasksForDateRange = (startDate, endDate) => {
        if (!startDate || !endDate) return [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        return allTasks.filter(task => {
            if (!task.last_date) return false;
            const taskDate = new Date(task.last_date);
            return taskDate >= start && taskDate <= end;
        });
    };

    // Get current display data
    const getCurrentDisplayData = () => {
        if (selectedDay.startsWith('custom-date:')) {
            const date = selectedDay.replace('custom-date:', '');
            return {
                type: 'custom-date',
                name: `Custom Date (${new Date(date).toLocaleDateString()})`,
                tasks: getTasksForCustomDate(date),
                count: getTasksForCustomDate(date).length
            };
        } else if (selectedDay.startsWith('custom-range:')) {
            const range = selectedDay.replace('custom-range:', '');
            const [start, end] = range.split('|');
            return {
                type: 'custom-range',
                name: `Date Range (${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()})`,
                tasks: getTasksForDateRange(start, end),
                count: getTasksForDateRange(start, end).length
            };
        } else {
            const tasksByWeekday = getTasksByWeekday();
            return {
                type: 'weekday',
                name: selectedDay,
                tasks: tasksByWeekday[selectedDay]?.tasks || [],
                count: tasksByWeekday[selectedDay]?.count || 0
            };
        }
    };

    // Calculate task statistics for selected day
    const getTaskStats = (tasks) => {
        const stats = {
            inReview: 0,
            pending: 0,
            outstanding: 0
        };

        tasks.forEach(task => {
            switch (task.status) {
                case 'IN_REVIEW':
                case 'DONE':
                    stats.inReview++;
                    break;
                case 'TO_DO':
                case 'IN_PROGRESS':
                    stats.pending++;
                    break;
                case 'OVER_DUE':
                case 'STUCK':
                    stats.outstanding++;
                    break;
                default:
                    stats.pending++;
            }
        });

        return stats;
    };

    // Handle day click
    const handleDayClick = (day) => {
        setSelectedDay(day);
        setShowModal(true);
    };

    // Handle custom date selection
    const handleCustomDateSelect = () => {
        if (customDate) {
            const newSelectedDay = `custom-date:${customDate}`;
            setSelectedDay(newSelectedDay);
            setShowCustomDateInput(false);
            setShowDateDropdown(false);
            setCustomDate('');
        }
    };

    // Handle custom date range selection
    const handleCustomRangeSelect = () => {
        if (customDateRange.start && customDateRange.end) {
            const newSelectedDay = `custom-range:${customDateRange.start}|${customDateRange.end}`;
            setSelectedDay(newSelectedDay);
            setShowCustomRangeInput(false);
            setShowDateDropdown(false);
            setCustomDateRange({ start: '', end: '' });
        }
    };

    // Circular progress component
    const CircularProgress = ({ tasks }) => {
        const stats = getTaskStats(tasks);
        const total = stats.inReview + stats.pending + stats.outstanding;
        const displayData = getCurrentDisplayData();

        if (total === 0) {
            return (
                <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-500 text-center px-2">
                        {displayData.type === 'weekday' ? displayData.name : 'No Tasks'}
                    </span>
                </div>
            );
        }

        const inReviewPercentage = (stats.inReview / total) * 100;
        const pendingPercentage = (stats.pending / total) * 100;
        const outstandingPercentage = (stats.outstanding / total) * 100;

        const radius = 45;
        const circumference = 2 * Math.PI * radius;

        const inReviewStroke = (inReviewPercentage / 100) * circumference;
        const pendingStroke = (pendingPercentage / 100) * circumference;
        const outstandingStroke = (outstandingPercentage / 100) * circumference;

        return (
            <div className="relative w-32 h-32">
                <svg width="128" height="128" className="transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="#f3f4f6"
                        strokeWidth="12"
                        fill="transparent"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="#10b981"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={`${inReviewStroke} ${circumference}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="#f59e0b"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={`${pendingStroke} ${circumference}`}
                        strokeDashoffset={-inReviewStroke}
                        strokeLinecap="round"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="#ef4444"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={`${outstandingStroke} ${circumference}`}
                        strokeDashoffset={-(inReviewStroke + pendingStroke)}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 text-center px-2">
                        {displayData.type === 'weekday' ? displayData.name : 'Tasks'}
                    </span>
                </div>
            </div>
        );
    };

    // Status indicator component
    const StatusIndicator = ({ tasks }) => {
        const stats = getTaskStats(tasks);

        return (
            <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">In Review</span>
                    </div>
                    <span className="text-sm text-gray-600">{stats.inReview} tasks</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Pending</span>
                    </div>
                    <span className="text-sm text-gray-600">{stats.pending} tasks</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Outstanding</span>
                    </div>
                    <span className="text-sm text-gray-600">{stats.outstanding} tasks</span>
                </div>
            </div>
        );
    };

    // Day Tasks Modal
    const DayTasksModal = ({ displayData, isOpen, onClose }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-green-100 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {displayData.name} ({displayData.count} tasks)
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6">
                        {displayData.tasks.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No tasks for {displayData.name}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {displayData.tasks.map((task) => (
                                    <Link
                                        href={`/dashboard/project/${task.project_id}`}
                                        key={task.project_id}
                                        className="block"
                                    >
                                        <div key={task.task_id} className="bg-gray-50 rounded-lg border border-gray-400 p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-3">
                                                        <div className={`w-3 h-3 rounded-full ${task.status === 'DONE' ? 'bg-green-500' :
                                                            task.status === 'IN_PROGRESS' ? 'bg-yellow-500' :
                                                                task.status === 'OVER_DUE' ? 'bg-red-500' :
                                                                    task.status === 'IN_REVIEW' ? 'bg-purple-500' :
                                                                        'bg-blue-500'
                                                            }`}></div>
                                                        <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                        <div className="bg-white p-3 rounded-lg">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <User className="h-4 w-4 text-gray-500" />
                                                                <span className="text-sm font-medium text-gray-700">Project</span>
                                                            </div>
                                                            <p className="text-gray-900">{task.project?.name || 'N/A'}</p>
                                                        </div>

                                                        <div className="bg-white p-3 rounded-lg">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <AlertCircle className="h-4 w-4 text-gray-500" />
                                                                <span className="text-sm font-medium text-gray-700">Phase</span>
                                                            </div>
                                                            <p className="text-gray-900">{task.phase || 'N/A'}</p>
                                                        </div>

                                                        <div className="bg-white p-3 rounded-lg">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <Clock className="h-4 w-4 text-gray-500" />
                                                                <span className="text-sm font-medium text-gray-700">Due Date</span>
                                                            </div>
                                                            <p className="text-gray-900">{new Date(task.last_date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-3">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                                                            task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                                                task.status === 'OVER_DUE' ? 'bg-red-100 text-red-800' :
                                                                    task.status === 'IN_REVIEW' ? 'bg-purple-100 text-purple-800' :
                                                                        'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                                            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                            {task.priority} Priority
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 border-t border-gray-200">
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const tasksByWeekday = getTasksByWeekday();
    const currentDisplayData = getCurrentDisplayData();

    return (
        <div className="w-full px-2 py-0 ">
            {/* Main Todo Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-800">Todo</h2>
                        </div>
                        <Maximize2 className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-2">
                    <div className="flex justify-between items-start">
                        {/* Left side - Task list */}
                        <div className="flex-1  ">
                            {/* Dropdown */}
                            <div className="relative mb-4">
                                <button
                                    onClick={() => setShowDateDropdown(!showDateDropdown)}
                                    className="flex items-center justify-between  max-w-xs px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <span className="font-medium truncate">
                                        {currentDisplayData.type === 'weekday' ? 'To Do Tasks' : currentDisplayData.name}
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
                                </button>

                                {showDateDropdown && (
                                    <div className="absolute  top-full left-0 mt-1 w-full max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                        {/* Weekdays */}
                                        {Object.entries(tasksByWeekday).map(([day, data]) => (
                                            <button
                                                key={day}
                                                onClick={() => {
                                                    setSelectedDay(day);
                                                    setShowDateDropdown(false);
                                                }}
                                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                            >
                                                {day} ({data.count} tasks)
                                            </button>
                                        ))}

                                        <div className="border-t border-gray-200 my-1"></div>

                                        {/* Custom Date */}
                                        <button
                                            onClick={() => {
                                                setShowCustomDateInput(true);
                                                setShowCustomRangeInput(false);
                                            }}
                                            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-blue-600"
                                        >
                                            Custom Date
                                        </button>

                                        {/* Custom Date Range */}
                                        <button
                                            onClick={() => {
                                                setShowCustomRangeInput(true);
                                                setShowCustomDateInput(false);
                                            }}
                                            className="block w-full text-left px-3 py-2 text-sm  hover:bg-gray-50 text-blue-600 rounded-b-lg"
                                        >
                                            Custom Date Range
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Custom Date Input */}
                            {showCustomDateInput && (
                                <div className="mb-4 relative p-3 w-full bg-blue-50 border border-blue-200 rounded-lg z-50">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Custom Date
                                    </label>
                                    <div className="">
                                        <input
                                            type="date"
                                            value={customDate}
                                            onChange={(e) => setCustomDate(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <button
                                            onClick={handleCustomDateSelect}
                                            className="px-3 py-2 mx-0.5 my-0.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                        >
                                            Apply
                                        </button>
                                        <button
                                            onClick={() => setShowCustomDateInput(false)}
                                            className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Custom Date Range Input */}
                            {showCustomRangeInput && (
                                <div className="mb-4 p-3 relative w-full bg-blue-50 border border-blue-200 rounded-lg z-50">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Date Range
                                    </label>
                                    <div className="space-y-2">
                                        <div className="">
                                            <input
                                                type="date"
                                                placeholder="Start Date"
                                                value={customDateRange.start}
                                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                            <input
                                                type="date"
                                                placeholder="End Date"
                                                value={customDateRange.end}
                                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div className="">
                                            <button
                                                onClick={handleCustomRangeSelect}
                                                className="px-3 py-2 mx-0.5 my-0.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                            >
                                                Apply Range
                                            </button>
                                            <button
                                                onClick={() => setShowCustomRangeInput(false)}
                                                className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Task List */}
                            <div className="space-y-2">
                                {loading ? (
                                    <>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="animate-pulse">
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                                        <div className="h-4 bg-gray-300 rounded w-20"></div>
                                                    </div>
                                                    <div className="h-4 bg-gray-300 rounded w-12"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : currentDisplayData.type === 'weekday' ? (
                                    Object.entries(tasksByWeekday).map(([day, data]) => (
                                        <div
                                            key={day}
                                            onClick={() => setSelectedDay(day)}
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${day === selectedDay
                                                ? 'bg-blue-50 border border-blue-200'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                                }`}
                                        >
                                            <div
                                                className="flex items-center space-x-3"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDayClick(day);
                                                }}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${day === selectedDay ? 'bg-blue-500' : 'bg-blue-400'
                                                    }`}></div>
                                                <span className="font-medium text-gray-800">{day}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-600">{data.count} tasks</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg ">
                                        <div className="">
                                            <div className="flex items-center space-x-3">
                                                <Calendar className="h-4 w-4 text-blue-600" />
                                                <span className="font-medium text-gray-800 ">
                                                    {currentDisplayData.name}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-600">
                                                {currentDisplayData.count} tasks
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDayClick(selectedDay)}
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right side - Chart and Status */}
                        <div className="flex flex-col items-center">
                            <CircularProgress tasks={currentDisplayData.tasks} />
                            <StatusIndicator tasks={currentDisplayData.tasks} />
                        </div>
                    </div>
                </div>


                {/* Day Tasks Modal */}
                <DayTasksModal
                    displayData={currentDisplayData}
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                />
            </div>
        </div>
    );
};

export default Todo;