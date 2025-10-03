import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Clock, Users, Calendar, X, CheckCircle, AlertCircle, Target, MessageSquare, User, Loader2, Briefcase } from 'lucide-react';
import { getTimeEfficiencyDataRequest } from '@/lib/http/task';
import { useUser } from '@/providers/UserProvider';
import moment from 'moment';

const TimeEfficiency = ({ projectId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [timeData, setTimeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useUser();

    // Fetch real-time efficiency data
    const fetchEfficiencyData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getTimeEfficiencyDataRequest(projectId);
            setTimeData(response.data.efficiencyData || []);
        } catch (err) {
            console.error('Error fetching efficiency data:', err);
            setError(err?.response?.data?.message || 'Failed to load efficiency data');
            setTimeData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEfficiencyData();
    }, [projectId]);

    // Refresh data every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            fetchEfficiencyData();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [projectId]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-800">{label}</p>
                    <p className="text-sm text-gray-600 mb-2">{data.title}</p>
                    <div className="space-y-1 text-sm">
                        <p className="flex justify-between">
                            <span className="text-blue-600">Tasks:</span>
                            <span className="font-medium">{data.taskHours}h</span>
                        </p>

                        <div className="border-t pt-2 mt-2">

                            <p className="flex justify-between">
                                <span>Efficiency:</span>
                                <span className={`font-medium ${data.efficiency >= 90 ? 'text-green-600' : data.efficiency >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {data.efficiency}%
                                </span>
                            </p>
                            <p className="flex justify-between">
                                <span>Rejections:</span>
                                <span className="font-medium text-red-600">{data.reviewStats?.rejected || 0}</span>
                            </p>
                            <p className="flex justify-between">
                                <span>Accepted:</span>
                                <span className="font-medium text-green-600">{data.reviewStats?.approved || 0}</span>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const totalHours = timeData.reduce((sum, lawyer) => sum + lawyer.totalHours, 0);
    const avgEfficiency = timeData.length > 0 ? Math.round(timeData.reduce((sum, lawyer) => sum + lawyer.efficiency, 0) / timeData.length) : 0;
    const topPerformer = timeData.length > 0 ? timeData.reduce((max, lawyer) => lawyer.efficiency > max.efficiency ? lawyer : max) : null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'done': return 'text-green-600 bg-green-100';
            case 'in_progress': return 'text-blue-600 bg-blue-100';
            case 'to_do': return 'text-yellow-600 bg-yellow-100';
            case 'stuck': return 'text-red-600 bg-red-100';
            case 'over_due': return 'text-orange-600 bg-orange-100';
            case 'in_review': return 'text-purple-600 bg-purple-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getAccuracyColor = (accuracy) => {
        if (accuracy >= 95) return 'text-green-600';
        if (accuracy >= 90) return 'text-yellow-600';
        return 'text-red-600';
    };

    const formatTimeAgo = (date) => {
        return moment(date).fromNow();
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-lg border-2 border-zinc-200">
                <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">Time Efficiency Analysis</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="text-zinc-500" size={24} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-gray-600">Loading efficiency data...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-lg border-2 border-zinc-200">
                <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">Time Efficiency Analysis</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="text-zinc-500" size={24} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">{error}</p>
                        <button
                            onClick={fetchEfficiencyData}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (timeData.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-lg border-2 border-zinc-200">
                <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">Time Efficiency Analysis</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="text-zinc-500" size={24} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No team members found for this project</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg border-2 border-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-300">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Time Efficiency Analysis</h2>
                        <p className="text-sm text-gray-600">Real-time data from the last 30 days</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="text-zinc-500" size={24} />
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4 p-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Total Hours</p>
                            <p className="text-2xl font-bold text-blue-800">{Math.round(totalHours)}</p>
                        </div>
                        <Clock className="text-blue-500" size={20} />
                    </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Avg Efficiency</p>
                            <p className="text-2xl font-bold text-green-800">{avgEfficiency}%</p>
                        </div>
                        <TrendingUp className="text-green-500" size={20} />
                    </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Top Performer</p>
                            <p className="text-lg font-bold text-purple-800">
                                {topPerformer ? topPerformer.lawyer.split(' ')[0] : 'N/A'}
                            </p>
                        </div>
                        <Users className="text-purple-500" size={20} />
                    </div>
                </div>
            </div>

            {/* Time Distribution Chart */}
            <div className="h-64 mb-2 px-6 cursor-pointer"
                onClick={() => setIsModalOpen(true)}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={timeData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="lawyer"
                            stroke="#666"
                            fontSize={12}
                            tick={{ fill: '#666' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={12}
                            tick={{ fill: '#666' }}
                            label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="taskHours"
                            stackId="a"
                            fill="#3b83f65b"
                            name="Task Hours"
                            radius={[0, 0, 0, 0]}
                        />
                        <Bar
                            dataKey="meetingHours"
                            stackId="a"
                            fill="#8a5cf66a"
                            name="Meeting Hours"
                            radius={[0, 0, 0, 0]}
                        />
                        <Bar
                            dataKey="clientHours"
                            stackId="a"
                            fill="#10b98163"
                            name="Client Hours"
                            radius={[0, 0, 0, 0]}
                        />
                        <Bar
                            dataKey="researchHours"
                            stackId="a"
                            fill="#f59f0b5c"
                            name="Research Hours"
                            radius={[2, 2, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {selectedEmployee ? `${selectedEmployee.lawyer} - Task Details` : 'Team Efficiency Report'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setSelectedEmployee(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                            {selectedEmployee ? (
                                // Individual Employee Task Details
                                <div className="p-6">
                                    <div className="mb-6">
                                        <button
                                            onClick={() => setSelectedEmployee(null)}
                                            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center space-x-2"
                                        >
                                            <span>← Back to All Team Members</span>
                                        </button>

                                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600">Efficiency</p>
                                                    <p className={`text-2xl font-bold ${getAccuracyColor(selectedEmployee.efficiency)}`}>
                                                        {selectedEmployee.efficiency}%
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600">Tasks Completed</p>
                                                    <p className="text-2xl font-bold text-blue-600">{selectedEmployee.tasksCompleted}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600">Accepted</p>
                                                    <p className="text-2xl font-bold text-green-600">{selectedEmployee.reviewStats?.approved || 0}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600">Task Accuracy</p>
                                                    <p className={`text-2xl font-bold ${getAccuracyColor(selectedEmployee.tasksAccuracy)}`}>
                                                        {selectedEmployee.tasksAccuracy}%
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Review Statistics */}
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Review Statistics</h4>
                                                <div className="grid grid-cols-4 gap-4 text-center">
                                                    <div>
                                                        <p className="text-xs text-gray-600">Total Reviews</p>
                                                        <p className="text-lg font-bold text-gray-800">{selectedEmployee.reviewStats?.total || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600">Approved</p>
                                                        <p className="text-lg font-bold text-green-600">{selectedEmployee.reviewStats?.approved || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600">Rejected</p>
                                                        <p className="text-lg font-bold text-red-600">{selectedEmployee.reviewStats?.rejected || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600">Pending</p>
                                                        <p className="text-lg font-bold text-yellow-600">{selectedEmployee.reviewStats?.pending || 0}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Recent Tasks</h4>
                                        {selectedEmployee.tasks.length > 0 ? (
                                            selectedEmployee.tasks.map((task) => (
                                            <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <h5 className="font-medium text-gray-800">{task.name}</h5>
                                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                                                                    {task.status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                            <span className="flex items-center space-x-1">
                                                                <Calendar size={14} />
                                                                    <span>{moment(task.deadline).format('MMM DD, YYYY')}</span>
                                                            </span>
                                                            <span className="flex items-center space-x-1">
                                                                <Target size={14} />
                                                                <span>{task.type}</span>
                                                            </span>
                                                                {task.projectName && (
                                                                    <span className="flex items-center space-x-1">
                                                                        <Briefcase size={14} />
                                                                        <span>{task.projectName}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-600">Accuracy</p>
                                                        <p className={`text-lg font-bold ${getAccuracyColor(task.accuracy)}`}>
                                                            {task.accuracy}%
                                                        </p>
                                                    </div>
                                                </div>
                                                {task.comments && task.comments.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <div className="flex items-center space-x-2 mb-3">
                                                            <MessageSquare size={16} className="text-gray-500" />
                                                                <h6 className="font-medium text-gray-700">Latest Activity</h6>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {task.comments.map((comment) => (
                                                                <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-300">
                                                                    <div className="flex items-start space-x-3">
                                                                        <div className="flex-shrink-0">
                                                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                                <User size={14} className="text-blue-600" />
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center space-x-2 mb-1">
                                                                                <span className="font-medium text-gray-800 text-sm">{comment.author}</span>
                                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                                                    {comment.role}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
                                                                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                                                <Clock size={12} />
                                                                                    <span>{formatTimeAgo(comment.time)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                </div>
                                                        </div>
                                                    )}
                                                    </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-600">No recent tasks found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // All Employees Overview
                                <div className="p-6">
                                    <div className="grid gap-4">
                                        {timeData.map((employee, index) => (
                                            <div
                                                key={index}
                                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => setSelectedEmployee(employee)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <h4 className="font-semibold text-gray-800">{employee.lawyer}</h4>
                                                            <span className="text-sm text-gray-600">{employee.title}</span>
                                                            {employee.projectsCount > 1 && (
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                                    {employee.projectsCount} projects
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-4 text-center">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Efficiency</p>
                                                            <p className={`text-lg font-bold ${getAccuracyColor(employee.efficiency)}`}>
                                                                {employee.efficiency}%
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Tasks</p>
                                                            <p className="text-lg font-bold text-blue-600">{employee.tasksCompleted}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Accepted</p>
                                                            <p className="text-lg font-bold text-green-600">{employee.reviewStats?.approved || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Rejections</p>
                                                            <p className="text-lg font-bold text-red-600">{employee.reviewStats?.rejected || 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeEfficiency;