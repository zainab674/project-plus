import React, { useEffect, useState, useMemo } from 'react';
import { Clock, BarChart3, TrendingUp, Calendar, FileText, Users, Gavel, DollarSign, ChevronRight, Activity, Mail, MessageSquare, Video, FileText as FileTextIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { getAllProjectWithTasksRequest } from '@/lib/http/project';
import { getAllTaskProgressRequest } from '@/lib/http/task';
import Loader from '../Loader';
import Link from 'next/link';
import CaseDetail from '../modals/TimelineCase';
import { useUser } from '@/providers/UserProvider';
import { getHourMinDiff } from '@/utils/calculateTIme';
import dayjs from 'dayjs';
import { TaskDetailModal } from '../TaskDetailModal';

// Test dayjs functionality
console.log('Dayjs test:', {
    now: dayjs().format('DD-MM-YYYY'),
    parsed: dayjs('15-07-2025', 'DD-MM-YYYY').isValid(),
    testDate: dayjs('15-07-2025', 'DD-MM-YYYY').format('DD-MM-YYYY')
});

// Utility function to download files with proper filename
const downloadFile = async (url, filename) => {
  try {
    console.log('Downloading file:', { url, filename });
    
    // Always prioritize the provided filename over URL extraction
    let finalFilename = filename;
    
    // Only extract from URL if no filename is provided at all
    if (!finalFilename && url) {
      const urlParts = url.split('/');
      finalFilename = urlParts[urlParts.length - 1];
      // Remove query parameters if any
      finalFilename = finalFilename.split('?')[0];
    }
    
    console.log('Final filename:', finalFilename);
    
    // First try the blob approach
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
    });
    
    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      // Fallback to direct link approach
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename || 'document';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    
  } catch (error) {
    console.error('Download error:', error);
    // Fallback to direct link approach
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError);
      // Last resort - open in new tab
      window.open(url, '_blank');
    }
  }
};

const LawFirmTimeline = ({ selectedProjectForTimeline: externalSelectedProject, onClose, timelineData: externalTimelineData, timelineLoading: externalTimelineLoading }) => {
    const [activeModal, setActiveModal] = useState(null);
    const [timelineView, setTimelineView] = useState('daily');
    const [selectedCase, setSelectedCase] = useState(null);
    const [projects, setProjects] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showNewCaseForm, setShowNewCaseForm] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [internalTimeData, setInternalTimeData] = useState(null);
    const [internalProgressData, setInternalProgressData] = useState(null);
    const [internalDocumentsData, setInternalDocumentsData] = useState(null);
    const [internalTimelineLoading, setInternalTimelineLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [timelineMode, setTimelineMode] = useState('all'); // 'all', 'time', 'progress', 'documents'
    const [internalSelectedProjectForTimeline, setInternalSelectedProjectForTimeline] = useState(null);
    const [customDateRange, setCustomDateRange] = useState({
        startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD')
    });
    const [useCustomDateRange, setUseCustomDateRange] = useState(false);
    const { user } = useUser();

    // Use external selected project if provided, otherwise use internal state
    const selectedProjectForTimeline = externalSelectedProject || internalSelectedProjectForTimeline;
    const setSelectedProjectForTimeline = externalSelectedProject ?
        (() => { }) : // No-op if external project is provided
        setInternalSelectedProjectForTimeline;

    // Use external timeline data if provided, otherwise use internal state
    const timeData = externalTimelineData?.times || internalTimeData;
    const progressData = externalTimelineData?.progress || internalProgressData;
    const documentsData = externalTimelineData?.documents || internalDocumentsData;
    const timelineLoading = externalTimelineLoading !== undefined ? externalTimelineLoading : internalTimelineLoading;

    // Get date ranges for different views
    const getDateRange = (view) => {
        // If custom date range is enabled, use it
        if (useCustomDateRange) {
            return {
                start: customDateRange.startDate,
                end: customDateRange.endDate
            };
        }

        // Otherwise use the default ranges
        const now = dayjs();
        switch (view) {
            case 'daily':
                return {
                    start: now.subtract(6, 'day').format('YYYY-MM-DD'),
                    end: now.format('YYYY-MM-DD')
                };
            case 'weekly':
                return {
                    start: now.subtract(3, 'week').format('YYYY-MM-DD'),
                    end: now.format('YYYY-MM-DD')
                };
            case 'monthly':
                return {
                    start: now.subtract(5, 'month').format('YYYY-MM-DD'),
                    end: now.format('YYYY-MM-DD')
                };
            default:
                return {
                    start: now.subtract(6, 'day').format('YYYY-MM-DD'),
                    end: now.format('YYYY-MM-DD')
                };
        }
    };

    // ─── flatten every Time entry into a row with projectName  taskName ───
    const detailedRows = useMemo(() => {
        if (!Array.isArray(timeData)) return [];
        return timeData.flatMap(project => {
            return (project.Time || []).map(entry => {
                const start = entry.start;
                const end = entry.end;
                const hours = ((new Date(end) - new Date(start)) / 36e5).toFixed(2);
                return {
                    projectName: project.name,
                    taskName: entry.task?.name || '—',
                    start,
                    end,
                    hours,
                    description: entry.work_description || '—',
                    task: entry.task, // Include full task object for modal
                    project: project // Include project object for modal
                };
            });
        });
    }, [timeData]);

    // Create comprehensive timeline data from progress API
    const comprehensiveTimeline = useMemo(() => {
        const timeline = [];

        // Add time tracking entries
        if (Array.isArray(timeData)) {
            timeData.forEach(project => {
                (project.Time || []).forEach(entry => {
                    timeline.push({
                        id: `time-${entry.time_id}`,
                        type: 'time',
                        project: project.name,
                        task: entry.task?.name || '—',
                        message: entry.work_description || 'Time tracked',
                        user: entry.user?.name || 'Unknown',
                        timestamp: entry.created_at,
                        start: entry.start,
                        end: entry.end,
                        hours: ((new Date(entry.end) - new Date(entry.start)) / 36e5).toFixed(2),
                        icon: Clock,
                        color: 'blue',
                        taskData: entry.task,
                        projectData: project
                    });
                });
            });
        }

        // Add progress entries (mails, meetings, chat, etc.)
        if (Array.isArray(progressData)) {
            progressData.forEach(project => {
                (project.Tasks || []).forEach(task => {
                    (task.Progress || []).forEach(progress => {
                        let icon = Activity;
                        let color = 'gray';

                        switch (progress.type) {
                            case 'MAIL':
                                icon = Mail;
                                color = 'green';
                                break;
                            case 'MEETING':
                                icon = Video;
                                color = 'purple';
                                break;
                            case 'CHAT':
                                icon = MessageSquare;
                                color = 'blue';
                                break;
                            default:
                                icon = Activity;
                                color = 'gray';
                        }

                        timeline.push({
                            id: `progress-${progress.progress_id}`,
                            type: 'progress',
                            progressType: progress.type,
                            project: project.name,
                            task: task.name || '—',
                            message: progress.message,
                            user: progress.user?.name || 'Unknown',
                            timestamp: progress.created_at,
                            icon,
                            color,
                            taskData: task,
                            projectData: project
                        });
                    });
                });
            });
        }

        // Add document entries
        if (Array.isArray(documentsData)) {
            documentsData.forEach(project => {
                (project.Clients || []).forEach(client => {
                    (client.Documents || []).forEach(doc => {
                        // Debug: Log the document data to see available fields
                        console.log('Document data:', doc);
                        
                        timeline.push({
                            id: `doc-${doc.document_id}`,
                            type: 'document',
                            project: project.name,
                            task: 'Document',
                            message: `Document: ${doc.filename || doc.name || 'Document uploaded'}`,
                            user: 'Client',
                            timestamp: doc.created_at,
                            icon: FileTextIcon,
                            color: 'orange',
                            documentData: doc,
                            projectData: project,
                            hasAttachment: !!doc.file_url,
                            attachmentUrl: doc.file_url,
                            attachmentName: doc.filename || doc.name || 'document'
                        });
                    });
                });
            });
        }

        // Sort by timestamp (newest first)
        return timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [timeData, progressData, documentsData]);

    // Filter timeline based on mode
    const filteredTimeline = useMemo(() => {
        // Always show all timeline data - no filtering by mode
        return comprehensiveTimeline;
    }, [comprehensiveTimeline]);

    // Filtered timeline for a specific project
    const projectTimeline = useMemo(() => {
        if (!selectedProjectForTimeline) return [];
        return comprehensiveTimeline.filter(item => item.project === selectedProjectForTimeline.name);
    }, [comprehensiveTimeline, selectedProjectForTimeline]);

    // Handle task click to show task details
    const handleTaskClick = (task, project) => {
        if (task && task.task_id) {
            setSelectedTask({ ...task, project });
            setIsTaskModalOpen(true);
        }
    };

    const getProjectAllProject = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [res] = await Promise.all([getAllProjectWithTasksRequest()]);
            const { projects, collaboratedProjects } = res.data;
            const allProjects = [...projects, ...collaboratedProjects];
            setProjects(allProjects);
        } catch (error) {
            setProjects(null);
            console.log(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchTimeData = React.useCallback(async (view) => {
        setInternalTimelineLoading(true);
        try {
            const dateRange = getDateRange(view);
            console.log('Fetching time data with date range:', dateRange);

            // If external project is selected, use it for the API call
            const projectId = selectedProjectForTimeline?.project_id;

            // Make the API call directly - the backend will handle date validation
            const res = await getAllTaskProgressRequest(dateRange.start, dateRange.end, null, projectId);
            console.log('Time data response:', res.data);

            // Safely set the data with fallbacks
            setInternalTimeData(Array.isArray(res.data?.times) ? res.data.times : []);
            setInternalProgressData(Array.isArray(res.data?.progress) ? res.data.progress : []);
            setInternalDocumentsData(Array.isArray(res.data?.documents) ? res.data.documents : []);
        } catch (error) {
            console.error('Error fetching time data:', error);
            console.log(error?.response?.data?.message || error?.message);
            // Set empty arrays on error
            setInternalTimeData([]);
            setInternalProgressData([]);
            setInternalDocumentsData([]);
        } finally {
            setInternalTimelineLoading(false);
        }
    }, [selectedProjectForTimeline, useCustomDateRange, customDateRange]);

    // Handle custom date range changes
    const handleDateRangeChange = (field, value) => {
        setCustomDateRange(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Apply custom date range and refresh data
    const applyCustomDateRange = () => {
        setUseCustomDateRange(true);
        fetchTimeData(timelineView);
    };

    // Reset to default date ranges
    const resetToDefaultDateRange = () => {
        setUseCustomDateRange(false);
        setCustomDateRange({
            startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
            endDate: dayjs().format('YYYY-MM-DD')
        });
        fetchTimeData(timelineView);
    };

    useEffect(() => {
        getProjectAllProject();
    }, []);

    useEffect(() => {
        if (activeModal === 'timeline') {
            fetchTimeData(timelineView);
        }
    }, [activeModal, timelineView, fetchTimeData]);

    // Fetch data when external project changes
    useEffect(() => {
        if (externalSelectedProject) {
            fetchTimeData(timelineView);
        }
    }, [externalSelectedProject, timelineView, fetchTimeData]);

    // Process real-time data for charts
    const processedTimeData = useMemo(() => {
        if (!Array.isArray(timeData) || timeData.length === 0) return [];

        const timeMap = {};

        timeData.forEach(project => {
            project.Time?.forEach(({ start, end }) => {
                if (!start || !end) return;
                const key = timelineView === 'daily'
                    ? dayjs(start).format('ddd')
                    : timelineView === 'weekly'
                        ? dayjs(start).format('MMM DD')
                        : dayjs(start).format('MMM');
                const dur = (new Date(end) - new Date(start)) / 36e5; // hours

                if (!timeMap[key]) {
                    timeMap[key] = {
                        period: key,
                        total: 0
                    };
                }
                timeMap[key].total = dur;
            });
        });

        return Object.values(timeMap).sort((a, b) =>
            dayjs(a.period, timelineView === 'daily' ? 'ddd' : timelineView === 'weekly' ? 'MMM DD' : 'MMM')
                .isBefore(dayjs(b.period, timelineView === 'daily' ? 'ddd' : timelineView === 'weekly' ? 'MMM DD' : 'MMM')) ? -1 : 1
        );
    }, [timeData, timelineView]);

    // Calculate activity summary from real data
    const activitySummary = useMemo(() => {
        if (!timeData || !Array.isArray(timeData) || !projects) {
            return { totalHours: 0, activeCases: 0, completedCases: 0, totalActivities: 0 };
        }

        let totalHours = 0;
        timeData.forEach(project => {
            if (project && project.Time && Array.isArray(project.Time)) {
                project.Time.forEach(timeEntry => {
                    if (timeEntry && timeEntry.end && timeEntry.start) {
                        totalHours += (new Date(timeEntry.end).getTime() - new Date(timeEntry.start).getTime()) / (1000 * 60 * 60);
                    }
                });
            }
        });

        const activeCases = Array.isArray(projects) ? projects.filter(p => p.status === 'Active').length : 0;
        const completedCases = Array.isArray(projects) ? projects.filter(p => p.status === 'Completed').length : 0;
        const totalActivities = comprehensiveTimeline.length;

        return {
            totalHours: Math.round(totalHours * 10) / 10,
            activeCases,
            completedCases,
            totalActivities
        };
    }, [timeData, projects, comprehensiveTimeline]);

    // Calculate pie chart data from real data
    const pieChartData = useMemo(() => {
        if (!Array.isArray(processedTimeData) || processedTimeData.length === 0) {
            return [];
        }

        const total = processedTimeData.reduce((acc, item) => acc + item.total, 0);

        if (total === 0) return [];

        return [{
            name: 'Total Time',
            value: total,
            color: '#3B82F6'
        }];
    }, [processedTimeData]);

    // Activity type breakdown for pie chart
    const activityTypeData = useMemo(() => {
        const typeCount = {};
        comprehensiveTimeline.forEach(item => {
            const type = item.type;
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        const colors = {
            time: '#3B82F6',
            progress: '#10B981',
            document: '#F59E0B'
        };

        return Object.entries(typeCount).map(([type, count]) => ({
            name: type.charAt(0).toUpperCase() + type.slice(1),
            value: count,
            color: colors[type] || '#6B7280'
        }));
    }, [comprehensiveTimeline]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    const filteredProjects = projects?.filter(project => {
        // Always show active projects
        if (project.status !== "Active") return false;

        // If user is TEAM role, only show projects they're assigned to
        if (user?.Role === 'TEAM') {
            // Check if user is a member of this project
            const isMember = project.Members?.some(member => member.user?.user_id === user.user_id);
            return isMember;
        }

        // For other roles (PROVIDER, CLIENT, BILLER), show all active projects
        return true;
    });

    const Modal = ({ title, onClose, children }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );

    const TimelineModal = () => (
        <Modal title={selectedProjectForTimeline ? `Timeline: ${selectedProjectForTimeline.name}` : "Comprehensive Timeline Analytics"} onClose={() => { setActiveModal(null); setSelectedProjectForTimeline(null); }}>
            <div className="space-y-6">


                {/* Timeline Mode Toggle - REMOVED TABS */}
                {!selectedProjectForTimeline && (
                    <div className="space-y-4 mb-6">
                        {/* Custom Date Range Picker */}
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-gray-700">Date Range Selection</h4>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={resetToDefaultDateRange}
                                        className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                    >
                                        Reset to Default
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={customDateRange.startDate}
                                        onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={customDateRange.endDate}
                                        onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <button
                                        onClick={applyCustomDateRange}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Apply Date Range
                                    </button>
                                </div>
                            </div>
                            
                            {useCustomDateRange && (
                                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                    <strong>Custom Range Active:</strong> {customDateRange.startDate} to {customDateRange.endDate}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {timelineLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        {!selectedProjectForTimeline && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium">Total Hours</p>
                                            <p className="text-2xl font-bold text-blue-800">{activitySummary.totalHours}</p>
                                        </div>
                                        <Clock className="text-blue-500" size={24} />
                                    </div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-green-600 font-medium">Active Cases</p>
                                            <p className="text-2xl font-bold text-green-800">{activitySummary.activeCases}</p>
                                        </div>
                                        <FileText className="text-green-500" size={24} />
                                    </div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium">Total Activities</p>
                                            <p className="text-2xl font-bold text-purple-800">{activitySummary.totalActivities}</p>
                                        </div>
                                        <Activity className="text-purple-500" size={24} />
                                    </div>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-orange-600 font-medium">Completed Cases</p>
                                            <p className="text-2xl font-bold text-orange-800">{activitySummary.completedCases}</p>
                                        </div>
                                        <TrendingUp className="text-orange-500" size={24} />
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Charts Section */}
                        {!selectedProjectForTimeline && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Time Tracking Chart */}
                                <div className="bg-white p-6 rounded-lg border shadow-sm">
                                    <h4 className="text-lg font-semibold mb-4">
                                        Time Distribution ({timelineView})
                                        {useCustomDateRange && (
                                            <span className="text-sm font-normal text-gray-600 ml-2">
                                                ({customDateRange.startDate} to {customDateRange.endDate})
                                            </span>
                                        )}
                                    </h4>
                                    {processedTimeData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={processedTimeData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="period" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="total"
                                                    stroke="#3B82F6"
                                                    strokeWidth={2}
                                                    name="Total Hours"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No time data available for the selected period
                                        </div>
                                    )}
                                </div>
                                {/* Activity Type Distribution Pie Chart */}
                                <div className="bg-white p-6 rounded-lg border shadow-sm">
                                    <h4 className="text-lg font-semibold mb-4">Activity Type Distribution</h4>
                                    {activityTypeData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={activityTypeData}
                                                    cx="50%"
                                                    cy="50%"
                                                    dataKey="value"
                                                    outerRadius={80}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {activityTypeData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                                            No activity data available
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Comprehensive Timeline (all or project-specific) */}
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                            <h4 className="text-lg font-semibold mb-4">{selectedProjectForTimeline ? `Timeline for ${selectedProjectForTimeline.name}` : 'Comprehensive Timeline'}</h4>
                            {(selectedProjectForTimeline ? projectTimeline : filteredTimeline).length > 0 ? (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {(selectedProjectForTimeline ? projectTimeline : filteredTimeline).map((item) => {
                                        const IconComponent = item.icon;
                                        return (
                                            <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                                <div className={`p-2 rounded-full bg-${item.color}-100`}>
                                                    <IconComponent className={`text-${item.color}-600`} size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="font-medium text-gray-900 truncate">
                                                            {item.project} - {item.task}
                                                        </h5>
                                                        <span className="text-sm text-gray-500">
                                                            {dayjs(item.timestamp).format('MMM DD, YYYY HH:mm')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-gray-500">By: {item.user}</span>
                                                        <div className="flex items-center gap-2">
                                                            {item.type === 'time' && (
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                    {item.hours}h
                                                                </span>
                                                            )}
                                                            {item.type === 'progress' && (
                                                                <span className={`text-xs px-2 py-1 rounded ${item.progressType === 'MAIL' ? 'bg-green-100 text-green-800' :
                                                                    item.progressType === 'MEETING' ? 'bg-purple-100 text-purple-800' :
                                                                        'bg-blue-100 text-blue-800'
                                                                    }`}>
                                                                    {item.progressType}
                                                                </span>
                                                            )}
                                                            {item.hasAttachment && item.attachmentUrl && (
                                                                <button
                                                                    onClick={() => {
                                                                        console.log('Download button clicked:', {
                                                                            url: item.attachmentUrl,
                                                                            filename: item.attachmentName,
                                                                            item: item
                                                                        });
                                                                        downloadFile(item.attachmentUrl, item.attachmentName);
                                                                    }}
                                                                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                                                                >
                                                                    Download
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No timeline data available for the selected period and mode
                                </div>
                            )}
                        </div>
                        {/* Detailed Time Breakdown (only for all projects view) */}
                        {!selectedProjectForTimeline && (
                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <h4 className="text-lg font-semibold mb-4">Detailed Time Breakdown</h4>
                                {detailedRows.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-gray-100">
                                                    <th className="text-left py-2 px-3">Project</th>
                                                    <th className="text-left py-2 px-3">Task</th>
                                                    <th className="text-left py-2 px-3">Start</th>
                                                    <th className="text-left py-2 px-3">End</th>
                                                    <th className="text-right py-2 px-3">Hours</th>
                                                    <th className="text-left py-2 px-3">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailedRows.map((row, i) => (
                                                    <tr key={i} className="border-b hover:bg-gray-50">
                                                        <td className="py-2 px-3">{row.projectName}</td>
                                                        <td className="py-2 px-3">
                                                            {row.task && row.task.task_id ? (
                                                                <button
                                                                    onClick={() => handleTaskClick(row.task, row.project)}
                                                                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                                                                >
                                                                    {row.taskName}
                                                                </button>
                                                            ) : (
                                                                <span>{row.taskName}</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            {row.start ? row.start.replace('T', ' ').split('.')[0] : 'N/A'}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            {row.end ? row.end.replace('T', ' ').split('.')[0] : 'N/A'}
                                                        </td>
                                                        <td className="py-2 px-3 text-right">{row.hours}h</td>
                                                        <td className="py-2 px-3">{row.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No detailed time entries available
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );

    const CaseTimelineModal = () => (
        <Modal title="Case Timeline Management" onClose={() => setActiveModal(null)}>
            <div className="space-y-6">
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Active Cases Overview</h4>
                    {user?.Role === 'TEAM' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-700">
                                <Users className="w-4 h-4 inline mr-1" />
                                You are viewing only the cases you are assigned to as a team member.
                            </p>
                        </div>
                    )}
                    <div className="grid gap-4">
                        {projects?.length === 0 ? (
                            <div className="bg-blue-200 rounded-lg border border-blue-200 p-12 text-center">
                                <div className="text-gray-400 mb-4">
                                    <FileText className="w-16 h-16 mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`}>
                                {filteredProjects?.map(project => (
                                    <div
                                        key={project.project_id}
                                        onClick={() => setSelectedCase(project)}
                                    >
                                        <div className={`bg-blue-100 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-gray-300 p-6`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-blue-600 truncate">
                                                        {project.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {project.client_name}
                                                        {project.priority}
                                                    </p>
                                                </div>
                                                {project.priority === 'High' && (
                                                    <p className="text-sm text-red-600">
                                                        {project.priority}
                                                    </p>
                                                )}
                                                {project.priority === 'Medium' && (
                                                    <p className="text-sm text-green-600">
                                                        {project.priority}
                                                    </p>)}
                                                {project.priority === 'Low' && (
                                                    <p className="text-sm text-yellow-600">
                                                        {project.priority}
                                                    </p>)}
                                            </div>

                                            {project.status && (
                                                <div className="mb-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                        ${project.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                            project.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                project.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-gray-100 text-gray-800'}`}>
                                                        {project.status}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="text-xs text-gray-500">
                                                Case ID: {project.project_id}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {selectedCase && (
                    <CaseDetail selectedCase={selectedCase} onClose={() => setSelectedCase(null)} />
                )}
            </div>
        </Modal>
    );



    // If external project is provided, render timeline content directly
    if (externalSelectedProject) {
        return (
            <div className="p-6">
                {timelineLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Timeline Mode Toggle */}
                        {/* <div className="flex space-x-2 mb-6">
                            {[
                                { key: 'all', label: 'All Activities', icon: Activity },
                                { key: 'time', label: 'Time Tracking', icon: Clock },
                                { key: 'progress', label: 'Progress & Mails', icon: Mail },
                                { key: 'documents', label: 'Documents', icon: FileTextIcon }
                            ].map((mode) => {
                                const IconComponent = mode.icon;
                                return (
                                    <button
                                        key={mode.key}
                                        onClick={() => setTimelineMode(mode.key)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${timelineMode === mode.key
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        <IconComponent size={16} />
                                        <span>{mode.label}</span>
                                    </button>
                                );
                            })}
                        </div> */}

                        {/* Comprehensive Timeline */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Timeline Activities</h3>
                            {(selectedProjectForTimeline ? projectTimeline : filteredTimeline).length > 0 ? (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {(selectedProjectForTimeline ? projectTimeline : filteredTimeline).map((item) => {
                                        const IconComponent = item.icon;
                                        return (
                                            <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                                <div className={`p-2 rounded-full ${item.color === 'blue' ? 'bg-blue-100' : item.color === 'green' ? 'bg-green-100' : 'bg-orange-100'}`}>
                                                    <IconComponent className={`w-4 h-4 ${item.color === 'blue' ? 'text-blue-600' : item.color === 'green' ? 'text-green-600' : 'text-orange-600'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-gray-800">{item.message}</span>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                            ${item.type === 'time' ? 'bg-blue-100 text-blue-800' :
                                                                item.type === 'progress' ? 'bg-green-100 text-green-800' :
                                                                    'bg-orange-100 text-orange-800'}`}>
                                                            {item.type}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">{item.user}</span> • {item.project} • {item.task}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {dayjs(item.timestamp).format('MMM DD, YYYY HH:mm')}
                                                    </div>
                                                    {item.hasAttachment && item.attachmentUrl && (
                                                        <button
                                                            onClick={() => {
                                                                console.log('External timeline download clicked:', {
                                                                    url: item.attachmentUrl,
                                                                    filename: item.attachmentName,
                                                                    item: item
                                                                });
                                                                downloadFile(item.attachmentUrl, item.attachmentName);
                                                            }}
                                                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                                                        >
                                                            Download
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No timeline activities found for this case.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isTaskModalOpen && selectedTask && (
                    <TaskDetailModal
                        task={selectedTask}
                        project={selectedTask.project}
                        isOpen={isTaskModalOpen}
                        onClose={() => {
                            setIsTaskModalOpen(false);
                            setSelectedTask(null);
                        }}
                    />
                )}
            </div>
        );
    }

    // Original return for standalone component
    return (
        <div className="bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="gap-6">
                    {/* Time Tracking Section */}
                    <div className="bg-pink-200 p-6 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Time Analytics</h2>
                            <BarChart3 className="text-blue-500" size={24} />
                        </div>
                        <div
                            className="bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setActiveModal('timeline')}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">View Time Tracking</span>
                                <Activity className="text-blue-500" size={20} />
                            </div>
                            <div className="space-y-2 text-sm">

                            </div>
                        </div>
                    </div>

                    {/* Case Timeline Section */}
                    <div className="bg-yellow-200 p-6 mt-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Case Timeline</h2>
                            <Calendar className="text-yellow-400" size={24} />
                        </div>
                        <div
                            className="bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setActiveModal('cases')}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">View Case Timelines</span>
                                <Clock className="text-yellow-400" size={20} />
                            </div>

                        </div>
                    </div>


                </div>
            </div>

            {/* Modals */}
            {activeModal === 'timeline' && <TimelineModal />}
            {activeModal === 'cases' && <CaseTimelineModal />}
            {activeModal === 'billing' && <BillingModal />}
            {isTaskModalOpen && selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    project={selectedTask.project}
                    isOpen={isTaskModalOpen}
                    onClose={() => {
                        setIsTaskModalOpen(false);
                        setSelectedTask(null);
                    }}
                />
            )}
        </div>
    );
};

export default LawFirmTimeline;









