import React, { useEffect, useState, useMemo } from 'react';
import { Clock, BarChart3, TrendingUp, Calendar, Users, Gavel, DollarSign, ChevronRight, Activity, Mail, MessageSquare, Video, FileText as FileTextIcon, Workflow, CheckCircle, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { getAllProjectWithTasksRequest } from '@/lib/http/project';
import Loader from '../Loader';
import Link from 'next/link';
import CaseWorkflowBox from '../CaseWorkflowBox';
import { useUser } from '@/providers/UserProvider';
import { getHourMinDiff } from '@/utils/calculateTIme';
import dayjs from 'dayjs';
import { TaskDetailModal } from '../TaskDetailModal';
import CaseDetail from '../modals/TimelineCase';
import { useTabNavigation } from '@/hooks/useTabNavigation';

// Utility function to highlight search terms in text
const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
        if (regex.test(part)) {
            return (
                <mark key={index} className="bg-yellow-200 px-1 rounded">
                    {part}
                </mark>
            );
        }
        return part;
    });
};



// Utility function to view files in new tab with proper filename
const viewFile = async (url, filename) => {
  try {
    
    // Check if it's a Cloudinary URL that might force download
    const isCloudinaryUrl = url.includes('cloudinary.com') && url.includes('raw/upload');
    
    if (isCloudinaryUrl) {
      // For Cloudinary URLs, fetch the content and display it inline
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }
        
        const contentType = response.headers.get('content-type') || '';
        const fileContent = await response.text();
        
        // Create a new window and display the content inline
        const newWindow = window.open('', '_blank');
        
        if (newWindow) {
          // Create a simpler approach using data attributes
          const escapedContent = fileContent.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          const escapedContentType = contentType.replace(/"/g, '&quot;');
          const escapedUrl = url.replace(/"/g, '&quot;');
          const escapedFilename = (filename || 'document').replace(/"/g, '&quot;');
          
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${filename || 'Document Viewer'}</title>
              <style>
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
                .viewer-container { 
                  max-width: 1200px; 
                  margin: 0 auto; 
                  background: white; 
                  border-radius: 8px; 
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  overflow: hidden;
                }
                .header { 
                  background: #f8f9fa; 
                  padding: 15px 20px; 
                  border-bottom: 1px solid #dee2e6;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                }
                .content { 
                  padding: 20px; 
                  min-height: 400px;
                  overflow: auto;
                }
                .fallback { 
                  text-align: center; 
                  padding: 50px; 
                  color: #6c757d;
                }
                .fallback a { 
                  color: #0066cc; 
                  text-decoration: none; 
                  margin: 0 10px;
                }
                .fallback a:hover { 
                  text-decoration: underline; 
                }
                .btn {
                  padding: 8px 16px;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  text-decoration: none;
                  display: inline-block;
                  font-size: 14px;
                }
                .btn-primary {
                  background: #007bff;
                  color: white;
                }
                .btn-secondary {
                  background: #6c757d;
                  color: white;
                }
                .btn:hover {
                  opacity: 0.9;
                }
                pre {
                  white-space: pre-wrap;
                  word-wrap: break-word;
                  font-family: 'Courier New', monospace;
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 4px;
                  border: 1px solid #e9ecef;
                }
              </style>
            </head>
            <body>
              <div class="viewer-container">
                <div class="header">
                  <h3 style="margin: 0; color: #495057;">${filename || 'Document Viewer'}</h3>
                  <div>
                    <a href="${url}" download="${filename || 'document'}" class="btn btn-secondary">Download</a>
                    <button onclick="window.close()" class="btn btn-primary">Close</button>
                  </div>
                </div>
                <div class="content" id="content" 
                     data-content="${escapedContent}" 
                     data-content-type="${escapedContentType}" 
                     data-url="${escapedUrl}" 
                     data-filename="${escapedFilename}">
                  <!-- Content will be loaded here -->
                </div>
              </div>
              <script>
                function getContentDisplay(content, contentType, url, filename) {
                  if (contentType.includes('text/plain') || contentType.includes('text/csv')) {
                    return '<pre>' + escapeHtml(content) + '</pre>';
                  } else if (contentType.includes('text/html')) {
                    return content;
                  } else if (contentType.includes('application/json')) {
                    try {
                      const json = JSON.parse(content);
                      return '<pre>' + escapeHtml(JSON.stringify(json, null, 2)) + '</pre>';
                    } catch (e) {
                      return '<pre>' + escapeHtml(content) + '</pre>';
                    }
                  } else if (contentType.includes('image/')) {
                    return '<img src="' + url + '" style="max-width: 100%; height: auto;" alt="Image preview" />';
                  } else if (contentType.includes('pdf')) {
                    return '<iframe src="' + url + '" style="width: 100%; height: 600px; border: none;"></iframe>';
                  } else {
                    return '<div class="fallback"><h4>Preview not available</h4><p>This file type cannot be previewed in the browser.</p><a href="' + url + '" download="' + filename + '">Download File</a></div>';
                  }
                }
                
                function escapeHtml(text) {
                  const div = document.createElement('div');
                  div.textContent = text;
                  return div.innerHTML;
                }
                
                // Load content after page is ready
                document.addEventListener('DOMContentLoaded', function() {
                  const contentDiv = document.getElementById('content');
                  const content = contentDiv.getAttribute('data-content');
                  const contentType = contentDiv.getAttribute('data-content-type');
                  const url = contentDiv.getAttribute('data-url');
                  const filename = contentDiv.getAttribute('data-filename');
                  
                  const displayContent = getContentDisplay(content, contentType, url, filename);
                  contentDiv.innerHTML = displayContent;
                });
              </script>
            </body>
            </html>
          `);
          newWindow.document.close();
        } else {
          // Fallback if popup is blocked
          window.open(url, '_blank');
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        // Fallback to direct link approach
        window.open(url, '_blank');
      }
    } else {
      // For non-Cloudinary URLs, use the original iframe approach
      const newWindow = window.open('', '_blank');
      
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${filename || 'Document Viewer'}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .viewer-container { width: 100%; height: 100vh; }
              iframe { width: 100%; height: 100%; border: none; }
              .fallback { text-align: center; padding: 50px; }
              .fallback a { color: #0066cc; text-decoration: none; }
              .fallback a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="viewer-container">
              <iframe src="${url}" onerror="showFallback()"></iframe>
            </div>
            <div class="fallback" id="fallback" style="display: none;">
              <h3>File Preview Not Available</h3>
              <p>This file cannot be previewed in the browser.</p>
              <a href="${url}" download="${filename || 'document'}">Download File</a>
            </div>
            <script>
              function showFallback() {
                document.getElementById('fallback').style.display = 'block';
                document.querySelector('.viewer-container').style.display = 'none';
              }
            </script>
          </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        // Fallback if popup is blocked
        window.open(url, '_blank');
      }
    }
    
  } catch (error) {
    console.error('View error:', error);
    // Fallback to direct link approach
    window.open(url, '_blank');
  }
};

// Utility function to download files with proper filename
const downloadFile = async (url, filename) => {
  try {
    
    // Always prioritize the provided filename over URL extraction
    let finalFilename = filename;
    
    // Only extract from URL if no filename is provided at all
    if (!finalFilename && url) {
      const urlParts = url.split('/');
      finalFilename = urlParts[urlParts.length - 1];
      // Remove query parameters if any
      finalFilename = finalFilename.split('?')[0];
    }
    
    
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
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    // For download mode, trigger download
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

const LawFirmTimeline = ({ selectedProjectForTimeline: externalSelectedProject, onClose, timelineData: externalTimelineData, timelineLoading: externalTimelineLoading, selectedUsers: externalSelectedUsers = [], selectedActivityTypes: externalSelectedActivityTypes = [] }) => {
    const [activeModal, setActiveModal] = useState(null);
    const [timelineView, setTimelineView] = useState('daily');
    const [selectedCase, setSelectedCase] = useState(null);
    const [projects, setProjects] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showNewCaseForm, setShowNewCaseForm] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
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
    const router = useTabNavigation();

    // Use external selected project if provided, otherwise use internal state
    const selectedProjectForTimeline = externalSelectedProject || internalSelectedProjectForTimeline;
    const setSelectedProjectForTimeline = externalSelectedProject ?
        (() => { }) : // No-op if external project is provided
        setInternalSelectedProjectForTimeline;

    // Use external timeline data if provided, otherwise use empty arrays
    const timeData = externalTimelineData?.times || [];
    const progressData = externalTimelineData?.progress || [];
    const documentsData = externalTimelineData?.documents || [];
    const caseCommentsData = externalTimelineData?.caseComments || [];
    const taskCommentsData = externalTimelineData?.taskComments || [];
    const reviewsData = externalTimelineData?.reviews || [];
    const timelineLoading = externalTimelineLoading !== undefined ? externalTimelineLoading : false;

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
                            case 'MEDIA':
                                icon = FileTextIcon;
                                color = 'orange';
                                break;
                            default:
                                icon = Activity;
                                color = 'gray';
                        }

                        // Check if this is a MEDIA type progress entry and has associated media
                        let hasAttachment = false;
                        let attachmentUrl = null;
                        let attachmentName = null;
                        
                        if (progress.type === 'MEDIA') {
                      
                            
                            if (progress.task?.Media && progress.task.Media.length > 0) {
                                
                                // Find the most recent media that matches the progress message
                                const recentMedia = progress.task.Media.find(media => 
                                    progress.message.includes(media.filename)
                                ) || progress.task.Media[0]; // Fallback to first media if no exact match
                                
                                if (recentMedia) {
                                    hasAttachment = true;
                                    attachmentUrl = recentMedia.file_url;
                                    attachmentName = recentMedia.filename;
                                  
                                } else {
                                }
                            } else {
                            }
                        }

                        timeline.push({
                            id: `progress-${progress.progress_id}`,
                            type: 'progress',
                            progressType: progress.type,
                            project: project.name,
                            task: progress.task?.name || '—',
                            message: progress.message,
                            user: progress.user?.name || 'Unknown',
                            timestamp: progress.created_at,
                            icon,
                            color,
                            taskData: progress.task,
                            projectData: project,
                            hasAttachment,
                            attachmentUrl,
                            attachmentName
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

        // Add case-level comments (case notes)
        if (Array.isArray(caseCommentsData)) {
            caseCommentsData.forEach(project => {
                (project.Comments || []).forEach(comment => {
                    timeline.push({
                        id: `case-comment-${comment.comment_id}`,
                        type: 'case_comment',
                        project: project.name,
                        task: 'Case Note',
                        message: comment.content || 'Case note added',
                        user: comment.user?.name || 'Unknown',
                        timestamp: comment.created_at,
                        icon: MessageSquare,
                        color: 'purple',
                        commentData: comment,
                        projectData: project
                    });
                });
            });
        }

        // Add task-level comments (task notes)
        if (Array.isArray(taskCommentsData)) {
            taskCommentsData.forEach(project => {
                (project.Tasks || []).forEach(task => {
                    (task.Comments || []).forEach(comment => {
                        timeline.push({
                            id: `task-comment-${comment.comment_id}`,
                            type: 'task_comment',
                            project: project.name,
                            task: task.name || 'Task',
                            message: comment.content || 'Task note added',
                            user: comment.user?.name || 'Unknown',
                            timestamp: comment.created_at,
                            icon: MessageSquare,
                            color: 'indigo',
                            commentData: comment,
                            taskData: task,
                            projectData: project
                        });
                    });
                });
            });
        }

        // Add reviews
        if (Array.isArray(reviewsData)) {
            reviewsData.forEach(project => {
                (project.Tasks || []).forEach(task => {
                    (task.inReview || []).forEach(review => {
                        let reviewMessage = review.submissionDesc || 'Review submitted';
                        if (review.action === 'APPROVED') {
                            reviewMessage = `Review approved: ${review.submissionDesc || 'Review completed'}`;
                        } else if (review.action === 'REJECTED') {
                            reviewMessage = `Review rejected: ${review.rejectedReason || review.submissionDesc || 'Review rejected'}`;
                        }
                        
                        timeline.push({
                            id: `review-${review.review_id}`,
                            type: 'review',
                            project: project.name,
                            task: task.name || 'Task',
                            message: reviewMessage,
                            user: review.submitted_by?.name || review.acted_by?.name || 'Unknown',
                            timestamp: review.created_at,
                            icon: review.action === 'APPROVED' ? CheckCircle : review.action === 'REJECTED' ? AlertTriangle : FileTextIcon,
                            color: review.action === 'APPROVED' ? 'green' : review.action === 'REJECTED' ? 'red' : 'purple',
                            reviewData: review,
                            taskData: task,
                            projectData: project,
                            hasAttachment: !!review.file_url,
                            attachmentUrl: review.file_url,
                            attachmentName: review.filename || 'review_file'
                        });
                    });
                });
            });
        }

        // Sort by timestamp (newest first)
        return timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [timeData, progressData, documentsData, caseCommentsData, taskCommentsData, reviewsData]);

    // Helper function to check if activity type matches
    const matchesActivityType = (item, activityType) => {
        if (activityType === 'case_comment') {
            return item.type === 'case_comment';
        } else if (activityType === 'task_comment') {
            return item.type === 'task_comment';
        } else if (activityType === 'progress') {
            return item.type === 'progress';
        } else if (activityType === 'meeting') {
            return item.type === 'progress' && item.progressType === 'MEETING';
        } else if (activityType === 'review') {
            return item.type === 'review';
        } else if (activityType === 'time') {
            return item.type === 'time';
        } else if (activityType === 'document') {
            return item.type === 'document';
        }
        return false;
    };

    // Filter timeline based on mode, search term, user, and activity type
    const filteredTimeline = useMemo(() => {
        let filtered = comprehensiveTimeline;
        
        // Apply user filter (from external props) - support multiple users
        if (externalSelectedUsers && externalSelectedUsers.length > 0) {
            filtered = filtered.filter(item => 
                externalSelectedUsers.some(user => 
                    item.user?.toLowerCase().trim() === user.toLowerCase().trim()
                )
            );
        }
        
        // Apply activity type filter (from external props) - support multiple activity types
        if (externalSelectedActivityTypes && externalSelectedActivityTypes.length > 0) {
            filtered = filtered.filter(item => 
                externalSelectedActivityTypes.some(activityType => 
                    matchesActivityType(item, activityType)
                )
            );
        }
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.type?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        return filtered;
    }, [comprehensiveTimeline, searchTerm, externalSelectedUsers, externalSelectedActivityTypes]);

    // Filtered timeline for a specific project
    const projectTimeline = useMemo(() => {
        if (!selectedProjectForTimeline) return [];
        
        let filtered = comprehensiveTimeline.filter(item => item.project === selectedProjectForTimeline.name);
        
        // Apply user filter (from external props) - support multiple users
        if (externalSelectedUsers && externalSelectedUsers.length > 0) {
            filtered = filtered.filter(item => 
                externalSelectedUsers.some(user => 
                    item.user?.toLowerCase().trim() === user.toLowerCase().trim()
                )
            );
        }
        
        // Apply activity type filter (from external props) - support multiple activity types
        if (externalSelectedActivityTypes && externalSelectedActivityTypes.length > 0) {
            filtered = filtered.filter(item => 
                externalSelectedActivityTypes.some(activityType => 
                    matchesActivityType(item, activityType)
                )
            );
        }
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.type?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        return filtered;
    }, [comprehensiveTimeline, selectedProjectForTimeline, searchTerm, externalSelectedUsers, externalSelectedActivityTypes]);

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
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Data fetching is now handled by the DashboardFilterProvider
    // No need for internal fetchTimeData function

    // Custom date range functionality is now handled by DashboardFilterProvider
    // These functions are no longer needed

    useEffect(() => {
        getProjectAllProject();
    }, []);

    // Data fetching is now handled by DashboardFilterProvider
    // No need for timeline data fetching effects

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

        // For all roles (PROVIDER, TEAM, CLIENT, BILLER), show all active projects
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


                {/* Date range filtering is now handled by DashboardFilterProvider */}
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
                                        <FileTextIcon className="text-green-500" size={24} />
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
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-semibold">{selectedProjectForTimeline ? `Timeline for ${selectedProjectForTimeline.name}` : 'Comprehensive Timeline'}</h4>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search timeline..."
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            {(selectedProjectForTimeline ? projectTimeline : filteredTimeline).length > 0 ? (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {(selectedProjectForTimeline ? projectTimeline : filteredTimeline).map((item) => {
                                        const IconComponent = item.icon;
                                        return (
                                            <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                                <div className={`p-2 rounded-full ${item.color === 'blue' ? 'bg-blue-100' : item.color === 'green' ? 'bg-green-100' : item.color === 'purple' ? 'bg-purple-100' : item.color === 'indigo' ? 'bg-indigo-100' : item.color === 'orange' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                                                    <IconComponent className={`${item.color === 'blue' ? 'text-blue-600' : item.color === 'green' ? 'text-green-600' : item.color === 'purple' ? 'text-purple-600' : item.color === 'indigo' ? 'text-indigo-600' : item.color === 'orange' ? 'text-orange-600' : 'text-gray-600'}`} size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="font-medium text-gray-900 truncate">
                                                            {highlightSearchTerm(item.project, searchTerm)} - {highlightSearchTerm(item.task, searchTerm)}
                                                        </h5>
                                                        <span className="text-sm text-gray-500">
                                                            {dayjs(item.timestamp).format('MMM DD, YYYY HH:mm')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{highlightSearchTerm(item.message, searchTerm)}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-gray-500">By: {highlightSearchTerm(item.user, searchTerm)}</span>
                                                        <div className="flex items-center gap-2">
                                                            {item.type === 'time' && (
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                    {item.hours}h
                                                                </span>
                                                            )}
                                                            {item.type === 'progress' && (
                                                                <span className={`text-xs px-2 py-1 rounded ${item.progressType === 'MAIL' ? 'bg-green-100 text-green-800' :
                                                                    item.progressType === 'MEETING' ? 'bg-purple-100 text-purple-800' :
                                                                        item.progressType === 'MEDIA' ? 'bg-orange-100 text-orange-800' :
                                                                            'bg-blue-100 text-blue-800'
                                                                    }`}>
                                                                    {item.progressType}
                                                                </span>
                                                            )}
                                                            {(item.type === 'case_comment' || item.type === 'task_comment') && (
                                                                <span className={`text-xs px-2 py-1 rounded ${item.type === 'case_comment' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                                                    {item.type === 'case_comment' ? 'Case Note' : 'Task Note'}
                                                                </span>
                                                            )}
                                                            {item.hasAttachment && item.attachmentUrl && (
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => {
                                                                          
                                                                            // Use viewFile to open in new tab with proper filename
                                                                            viewFile(item.attachmentUrl, item.attachmentName);
                                                                        }}
                                                                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                                                    >
                                                                        View
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                           
                                                                            downloadFile(item.attachmentUrl, item.attachmentName);
                                                                        }}
                                                                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                                                                    >
                                                                        Download
                                                                    </button>
                                                                </div>
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
                                                        <td className="py-2 px-3">{highlightSearchTerm(row.projectName, searchTerm)}</td>
                                                        <td className="py-2 px-3">
                                                            {row.task && row.task.task_id ? (
                                                                <button
                                                                    onClick={() => handleTaskClick(row.task, row.project)}
                                                                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                                                                >
                                                                    {highlightSearchTerm(row.taskName, searchTerm)}
                                                                </button>
                                                            ) : (
                                                                <span>{highlightSearchTerm(row.taskName, searchTerm)}</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            {row.start ? row.start.replace('T', ' ').split('.')[0] : 'N/A'}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            {row.end ? row.end.replace('T', ' ').split('.')[0] : 'N/A'}
                                                        </td>
                                                        <td className="py-2 px-3 text-right">{row.hours}h</td>
                                                        <td className="py-2 px-3">{highlightSearchTerm(row.description, searchTerm)}</td>
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
                                You have full access to all cases as a team member.
                            </p>
                        </div>
                    )}
                    <div className="grid gap-4">
                        {projects?.length === 0 ? (
                            <div className="bg-blue-200 rounded-lg border border-blue-200 p-12 text-center">
                                <div className="text-gray-400 mb-4">
                                    <FileTextIcon className="w-16 h-16 mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`}>
                                {projects?.map(project => (
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



    // If external timeline data is provided (from timeline page), render timeline content directly
    if (externalTimelineData !== undefined) {
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
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Timeline Activities</h3>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search timeline..."
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            {(selectedProjectForTimeline ? projectTimeline : filteredTimeline).length > 0 ? (
                                <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                                    {(selectedProjectForTimeline ? projectTimeline : filteredTimeline).map((item) => {
                                        const IconComponent = item.icon;
                                        return (
                                            <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                                <div className={`p-2 rounded-full ${item.color === 'blue' ? 'bg-blue-100' : item.color === 'green' ? 'bg-green-100' : item.color === 'purple' ? 'bg-purple-100' : item.color === 'indigo' ? 'bg-indigo-100' : 'bg-orange-100'}`}>
                                                    <IconComponent className={`w-4 h-4 ${item.color === 'blue' ? 'text-blue-600' : item.color === 'green' ? 'text-green-600' : item.color === 'purple' ? 'text-purple-600' : item.color === 'indigo' ? 'text-indigo-600' : 'text-orange-600'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-gray-800">{highlightSearchTerm(item.message, searchTerm)}</span>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                            ${item.type === 'time' ? 'bg-blue-100 text-blue-800' :
                                                                item.type === 'review' ? 'bg-orange-100 text-orange-800' :
                                                                item.type === 'progress' ? (item.progressType === 'MEETING' ? 'bg-purple-100 text-purple-800' :
                                                                    item.progressType === 'MAIL' ? 'bg-green-100 text-green-800' :
                                                                        item.progressType === 'MEDIA' ? 'bg-orange-100 text-orange-800' :
                                                                            item.progressType === 'CHAT' ? 'bg-blue-100 text-blue-800' :
                                                                                (item.progressType === 'OTHER' && (item.message?.includes('Review approved') || item.message?.includes('Review rejected') || item.message?.includes('Review submitted')) ? 'bg-orange-100 text-orange-800' :
                                                                                'bg-green-100 text-green-800')) :
                                                                    item.type === 'case_comment' ? 'bg-purple-100 text-purple-800' :
                                                                        item.type === 'task_comment' ? 'bg-indigo-100 text-indigo-800' :
                                                                            'bg-orange-100 text-orange-800'}`}>
                                                            {item.type === 'case_comment' ? 'Case Note' : 
                                                                item.type === 'task_comment' ? 'Task Note' : 
                                                                item.type === 'progress' && item.progressType ? 
                                                                    (item.progressType === 'MEDIA' ? 'document' :
                                                                     item.progressType === 'OTHER' && item.message?.includes('created an update for task') ? 'Updates' :
                                                                     item.progressType === 'OTHER' && (item.message?.includes('Review approved') || item.message?.includes('Review rejected') || item.message?.includes('Review submitted')) ? 'review' :
                                                                     item.progressType) : 
                                                                item.type}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">{highlightSearchTerm(item.user, searchTerm)}</span> • {highlightSearchTerm(item.project, searchTerm)} • {highlightSearchTerm(item.task, searchTerm)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {dayjs(item.timestamp).format('MMM DD, YYYY HH:mm')}
                                                    </div>
                                                    {(item.type === 'case_comment' || item.type === 'task_comment') && (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2
                                                            ${item.type === 'case_comment' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                                            {item.type === 'case_comment' ? 'Case Note' : 'Task Note'}
                                                        </span>
                                                    )}
                                                    {item.hasAttachment && item.attachmentUrl && (
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <button
                                                                onClick={() => {
                                                                
                                                                    // Use viewFile to open in new tab with proper filename
                                                                    viewFile(item.attachmentUrl, item.attachmentName);
                                                                }}
                                                                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                
                                                                    downloadFile(item.attachmentUrl, item.attachmentName);
                                                                }}
                                                                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                                                            >
                                                                Download
                                                            </button>
                                                        </div>
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

    // Original return for standalone component (not used when external timeline data is provided)
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

                    {/* Case Workflow Section */}
                    <div className="bg-indigo-200 p-6 mt-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Case Workflow</h2>
                            <Workflow className="text-indigo-500" size={24} />
                        </div>
                        <div
                            className="bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => router.push('/dashboard/case-workflow')}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">View Case Workflows</span>
                                <Workflow className="text-indigo-500" size={20} />
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









