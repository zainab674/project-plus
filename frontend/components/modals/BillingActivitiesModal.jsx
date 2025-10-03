import React, { useState, useEffect } from 'react';
import { 
    X, DollarSign, Clock, FileText, Users, CheckCircle, AlertCircle, RefreshCw,
    Calendar, Phone, Mail, MessageSquare, Video, Paperclip, Eye, Calculator,
    TrendingUp, BarChart3, Filter, Search, Download, Receipt, Zap, Target,
    UserCheck, CalendarDays, Timer, Scale, Gavel, Building, BookOpen, Shield,
    Activity, MessageCircle, VideoIcon, FileVideo, Mic, Edit3, RotateCcw
} from 'lucide-react';
import { 
    getProjectBillingEntriesRequest,
    getProjectActivitiesRequest,
    generateTaskBillingEntryRequest,
    generateMeetingBillingEntryRequest,
    generateReviewBillingEntryRequest,
    generateProgressBillingEntryRequest
} from '@/lib/http/client';
import { toast } from 'react-toastify';
import moment from 'moment';

const BillingActivitiesModal = ({ isOpen, onClose, projectId, projectName }) => {
    const [activities, setActivities] = useState({});
    const [billingEntries, setBillingEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [summary, setSummary] = useState({
        total: 0,
        taskBased: 0,
        hourly: 0,
        review: 0,
        meeting: 0,
        progress: 0,
        other: 0
    });

    useEffect(() => {
        if (isOpen && projectId) {
            fetchBillingData();
        }
    }, [isOpen, projectId]);

    const fetchBillingData = async () => {
        setLoading(true);
        try {
            const [billingResponse, activitiesResponse] = await Promise.all([
                getProjectBillingEntriesRequest(projectId),
                getProjectActivitiesRequest(projectId)
            ]);
            
            setBillingEntries(billingResponse.data.billingEntries || []);
            setActivities(activitiesResponse.data || {});
            calculateSummary(billingResponse.data.billingEntries || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to fetch billing data');
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (entries) => {
        const summary = {
            total: 0,
            taskBased: 0,
            hourly: 0,
            review: 0,
            meeting: 0,
            progress: 0,
            other: 0
        };

        entries.forEach(entry => {
            summary.total += entry.total_amount || 0;
            switch (entry.item_type) {
                case 'TASK':
                    summary.taskBased += entry.total_amount || 0;
                    break;
                case 'TIME':
                    summary.hourly += entry.total_amount || 0;
                    break;
                case 'REVIEW':
                    summary.review += entry.total_amount || 0;
                    break;
                case 'MEETING':
                    summary.meeting += entry.total_amount || 0;
                    break;
                case 'MAIL':
                case 'CHAT':
                case 'CALL':
                case 'COMMENT':
                case 'TRANSCRIPTION':
                case 'STATUS_CHANGE':
                case 'MEDIA':
                case 'OTHER':
                    summary.progress += entry.total_amount || 0;
                    break;
                default:
                    summary.other += entry.total_amount || 0;
                    break;
            }
        });

        setSummary(summary);
    };

    const getActivityIcon = (itemType) => {
        switch (itemType) {
            case 'TASK':
                return <FileText className="h-5 w-5 text-blue-600" />;
            case 'TIME':
                return <Clock className="h-5 w-5 text-green-600" />;
            case 'REVIEW':
                return <CheckCircle className="h-5 w-5 text-purple-600" />;
            case 'MEETING':
                return <Users className="h-5 w-5 text-orange-600" />;
            case 'CALL':
                return <Phone className="h-5 w-5 text-red-600" />;
            case 'MAIL':
                return <Mail className="h-5 w-5 text-blue-600" />;
            case 'CHAT':
                return <MessageCircle className="h-5 w-5 text-green-600" />;
            case 'COMMENT':
                return <Edit3 className="h-5 w-5 text-purple-600" />;
            case 'TRANSCRIPTION':
                return <Mic className="h-5 w-5 text-orange-600" />;
            case 'STATUS_CHANGE':
                return <RotateCcw className="h-5 w-5 text-yellow-600" />;
            case 'MEDIA':
                return <FileVideo className="h-5 w-5 text-pink-600" />;
            case 'OTHER':
                return <Activity className="h-5 w-5 text-gray-600" />;
            default:
                return <DollarSign className="h-5 w-5 text-gray-600" />;
        }
    };

    const getActivityColor = (itemType) => {
        switch (itemType) {
            case 'TASK':
                return 'text-blue-700 bg-blue-100 border-blue-200';
            case 'TIME':
                return 'text-green-700 bg-green-100 border-green-200';
            case 'REVIEW':
                return 'text-purple-700 bg-purple-100 border-purple-200';
            case 'MEETING':
                return 'text-orange-700 bg-orange-100 border-orange-200';
            case 'CALL':
                return 'text-red-700 bg-red-100 border-red-200';
            case 'MAIL':
                return 'text-blue-700 bg-blue-100 border-blue-200';
            case 'CHAT':
                return 'text-green-700 bg-green-100 border-green-200';
            case 'COMMENT':
                return 'text-purple-700 bg-purple-100 border-purple-200';
            case 'TRANSCRIPTION':
                return 'text-orange-700 bg-orange-100 border-orange-200';
            case 'STATUS_CHANGE':
                return 'text-yellow-700 bg-yellow-100 border-yellow-200';
            case 'MEDIA':
                return 'text-pink-700 bg-pink-100 border-pink-200';
            case 'OTHER':
                return 'text-gray-700 bg-gray-100 border-gray-200';
            default:
                return 'text-gray-700 bg-gray-100 border-gray-200';
        }
    };

    const getActivityLabel = (itemType) => {
        switch (itemType) {
            case 'TASK':
                return 'Task-Based';
            case 'TIME':
                return 'Hourly';
            case 'REVIEW':
                return 'Review';
            case 'MEETING':
                return 'Meeting';
            case 'CALL':
                return 'Call';
            case 'MAIL':
                return 'Email';
            case 'CHAT':
                return 'Chat';
            case 'COMMENT':
                return 'Comment';
            case 'TRANSCRIPTION':
                return 'Transcription';
            case 'STATUS_CHANGE':
                return 'Status Change';
            case 'MEDIA':
                return 'Media';
            case 'OTHER':
                return 'Other Progress';
            default:
                return 'Other';
        }
    };

    const filteredEntries = billingEntries.filter(entry => {
        const matchesFilter = selectedFilter === 'all' || entry.item_type === selectedFilter;
        const matchesSearch = entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             entry.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleGenerateBilling = async (type, id) => {
        try {
            let response;
            switch (type) {
                case 'task':
                    response = await generateTaskBillingEntryRequest({ task_id: id });
                    break;
                case 'meeting':
                    response = await generateMeetingBillingEntryRequest({ meeting_id: id });
                    break;
                case 'review':
                    response = await generateReviewBillingEntryRequest({ review_id: id });
                    break;
                case 'progress':
                    response = await generateProgressBillingEntryRequest({ progress_id: id });
                    break;
                default:
                    return;
            }
            
            toast.success('Billing entry generated successfully');
            fetchBillingData(); // Refresh data
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to generate billing entry');
        }
    };

    const handleClose = () => {
        setActivities({});
        setBillingEntries([]);
        setSearchTerm('');
        setSelectedFilter('all');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                Billing Activities
                            </h3>
                            <p className="text-sm text-gray-500">
                                {projectName} - All billable activities and entries
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={fetchBillingData}
                            disabled={loading}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Billed</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        ${summary.total.toFixed(2)}
                                    </p>
                                </div>
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Task-Based</p>
                                    <p className="text-lg font-semibold text-blue-600">
                                        ${summary.taskBased.toFixed(2)}
                                    </p>
                                </div>
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Hourly</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        ${summary.hourly.toFixed(2)}
                                    </p>
                                </div>
                                <Clock className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Reviews</p>
                                    <p className="text-lg font-semibold text-purple-600">
                                        ${summary.review.toFixed(2)}
                                    </p>
                                </div>
                                <CheckCircle className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Meetings</p>
                                    <p className="text-lg font-semibold text-orange-600">
                                        ${summary.meeting.toFixed(2)}
                                    </p>
                                </div>
                                <Users className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Progress</p>
                                    <p className="text-lg font-semibold text-indigo-600">
                                        ${summary.progress.toFixed(2)}
                                    </p>
                                </div>
                                <Activity className="h-6 w-6 text-indigo-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Other</p>
                                    <p className="text-lg font-semibold text-gray-600">
                                        ${summary.other.toFixed(2)}
                                    </p>
                                </div>
                                <DollarSign className="h-6 w-6 text-gray-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="px-6 py-4 bg-white border-b border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search activities, users, or descriptions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="all">All Activities</option>
                                <option value="TASK">Task-Based</option>
                                <option value="TIME">Hourly</option>
                                <option value="REVIEW">Reviews</option>
                                <option value="MEETING">Meetings</option>
                                <option value="MAIL">Emails</option>
                                <option value="CHAT">Chats</option>
                                <option value="CALL">Calls</option>
                                <option value="COMMENT">Comments</option>
                                <option value="TRANSCRIPTION">Transcriptions</option>
                                <option value="STATUS_CHANGE">Status Changes</option>
                                <option value="MEDIA">Media</option>
                                <option value="OTHER">Other Progress</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Progress Activities Section */}
                {activities.progressEntries && activities.progressEntries.length > 0 && (
                    <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <Activity className="h-5 w-5 text-blue-600" />
                                <h4 className="text-lg font-semibold text-blue-900">Progress Activities</h4>
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    {activities.progressEntries.length} entries
                                </span>
                            </div>
                            <p className="text-sm text-blue-700">
                                These activities can be billed based on member rates
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activities.progressEntries.slice(0, 6).map((progress) => (
                                <div key={progress.progress_id} className="bg-white rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            {getActivityIcon(progress.type)}
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActivityColor(progress.type)}`}>
                                                {getActivityLabel(progress.type)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleGenerateBilling('progress', progress.progress_id)}
                                            className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 transition-colors"
                                        >
                                            Bill
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                                        {progress.message}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>By: {progress.user?.name}</span>
                                        <span>{moment(progress.created_at).format('MMM DD, HH:mm')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {activities.progressEntries.length > 6 && (
                            <div className="text-center mt-4">
                                <p className="text-sm text-blue-600">
                                    Showing 6 of {activities.progressEntries.length} progress entries
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Billing Activities List */}
                <div className="p-6 overflow-y-auto max-h-[calc(95vh-400px)]">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading billing activities...</p>
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="text-center py-8">
                            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No billing activities</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Billing entries will appear here when activities are completed and billed.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredEntries.map((entry) => (
                                <div
                                    key={entry.line_item_id}
                                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                {getActivityIcon(entry.item_type)}
                                                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getActivityColor(entry.item_type)}`}>
                                                    {getActivityLabel(entry.item_type)}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {moment(entry.created_at).format('MMM DD, YYYY HH:mm')}
                                                </span>
                                            </div>
                                            
                                            <h4 className="text-lg font-medium text-gray-900 mb-2">
                                                {entry.description}
                                            </h4>
                                            
                                            {entry.user && (
                                                <p className="text-sm text-gray-600 mb-3">
                                                    <UserCheck className="inline h-4 w-4 mr-1" />
                                                    By: {entry.user.name}
                                                </p>
                                            )}

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-xs text-gray-500 font-medium">Quantity</p>
                                                    <p className="text-sm font-semibold text-gray-900">{entry.quantity}</p>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-xs text-gray-500 font-medium">Rate</p>
                                                    <p className="text-sm font-semibold text-gray-900">${entry.unit_rate?.toFixed(2)}</p>
                                                </div>
                                                <div className="bg-green-50 p-3 rounded-lg">
                                                    <p className="text-xs text-green-600 font-medium">Total Amount</p>
                                                    <p className="text-sm font-semibold text-green-700">${entry.total_amount?.toFixed(2)}</p>
                                                </div>
                                                <div className="bg-blue-50 p-3 rounded-lg">
                                                    <p className="text-xs text-blue-600 font-medium">Status</p>
                                                    <p className="text-sm font-semibold text-blue-700">Billed</p>
                                                </div>
                                            </div>

                                            {/* Related item details */}
                                            {entry.task && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                        <span className="text-sm font-medium text-blue-800">Related Task</span>
                                                    </div>
                                                    <p className="text-sm text-blue-700">{entry.task.name}</p>
                                                    <p className="text-xs text-blue-600">Status: {entry.task.status}</p>
                                                </div>
                                            )}

                                            {entry.item_type === 'MEETING' && (
                                                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <Users className="h-4 w-4 text-orange-600" />
                                                        <span className="text-sm font-medium text-orange-800">Meeting Details</span>
                                                    </div>
                                                    <p className="text-sm text-orange-700">{entry.description.replace('Meeting: ', '')}</p>
                                                </div>
                                            )}

                                            {entry.item_type === 'REVIEW' && (
                                                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <CheckCircle className="h-4 w-4 text-purple-600" />
                                                        <span className="text-sm font-medium text-purple-800">Review Details</span>
                                                    </div>
                                                    <p className="text-sm text-purple-700">{entry.description.replace('Review: ', '')}</p>
                                                </div>
                                            )}

                                            {/* Progress activity details */}
                                            {(entry.item_type === 'MAIL' || entry.item_type === 'CHAT' || entry.item_type === 'CALL' || 
                                              entry.item_type === 'COMMENT' || entry.item_type === 'TRANSCRIPTION' || 
                                              entry.item_type === 'STATUS_CHANGE' || entry.item_type === 'MEDIA' || entry.item_type === 'OTHER') && (
                                                <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <Activity className="h-4 w-4 text-indigo-600" />
                                                        <span className="text-sm font-medium text-indigo-800">Progress Activity</span>
                                                    </div>
                                                    <p className="text-sm text-indigo-700">{entry.description.replace(/^(Email|Chat|Call|Comment|Transcription|Status Change|Media|Other) Progress: /, '')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillingActivitiesModal; 