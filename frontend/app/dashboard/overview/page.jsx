"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllUserTasksRequest, getTaskUpdatesRequest, markTaskUpdatesAsReadRequest } from '@/lib/http/task';
import { getsMeetingRequest } from '@/lib/http/meeting';
import { getPrivateConversationsListRequest, getUnreadGroupChatMessagesRequest } from '@/lib/http/chat';
import { getUncheckedMissedCalls, markMissedCallsAsChecked } from '@/lib/http/callContactApi';
import { getMySubmissionsRequest, getPendingDocumentsRequest } from '@/lib/http/review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Clock,
  AlertCircle,
  Calendar,
  ListTodo,
  Users,
  MessageCircle,
  ArrowRight,
  FileText,
  Mail,
  Phone
} from 'lucide-react';
import Loader from '@/components/Loader';
import dayjs from 'dayjs';
import { useUser } from '@/providers/UserProvider';
import AvatarCompoment from '@/components/AvatarCompoment';

export default function OverviewPage() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedView, setSelectedView] = useState('tasks'); // 'tasks', 'meetings', 'chat', 'project-chat', 'reviews', 'lawyer-docs'
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [projectChats, setProjectChats] = useState([]);
  const [unreadUpdates, setUnreadUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(true);
  const [markingUpdateIds, setMarkingUpdateIds] = useState([]);
  const [markingAllUpdates, setMarkingAllUpdates] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnreadMessagesModal, setShowUnreadMessagesModal] = useState(false);
  const [selectedProjectForModal, setSelectedProjectForModal] = useState(null);
  const [uncheckedMissedCalls, setUncheckedMissedCalls] = useState([]);
  const [loadingMissedCalls, setLoadingMissedCalls] = useState(false);
  const [markingCallIds, setMarkingCallIds] = useState([]);
  const [markingAllCalls, setMarkingAllCalls] = useState(false);
  const [reviewedDocuments, setReviewedDocuments] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [lastReviewCheck, setLastReviewCheck] = useState(null);
  const [seenDocumentReviews, setSeenDocumentReviews] = useState(new Set());
  const [documentsSentToLawyer, setDocumentsSentToLawyer] = useState([]);
  const [loadingPendingDocs, setLoadingPendingDocs] = useState(false);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await getAllUserTasksRequest();
        if (response.data.success) {
          setTasks(response.data.tasks || []);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, []);

  // Fetch meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await getsMeetingRequest();
        if (response.data.success) {
          setMeetings(response.data.meetings || []);
        }
      } catch (error) {
        console.error('Error fetching meetings:', error);
      }
    };

    fetchMeetings();
  }, []);

  // Fetch conversations with unread messages
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await getPrivateConversationsListRequest();
        if (response.data.success) {
          setConversations(response.data.conversations || []);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  // Fetch project chats with unread messages
  useEffect(() => {
    const fetchProjectChats = async () => {
      try {
        const response = await getUnreadGroupChatMessagesRequest();
        if (response.data.success) {
          setProjectChats(response.data.projects || []);
        }
      } catch (error) {
        console.error('Error fetching project chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectChats();
  }, []);

  useEffect(() => {
    const fetchUnreadUpdates = async () => {
      setLoadingUpdates(true);
      try {
        const response = await getTaskUpdatesRequest({ read_status: 'unread', limit: 25 });
        if (response.data.success) {
          setUnreadUpdates(response.data.updates || []);
        }
      } catch (error) {
        console.error('Error fetching unread task updates:', error);
      } finally {
        setLoadingUpdates(false);
      }
    };

    fetchUnreadUpdates();
  }, []);

  // Fetch unchecked missed calls
  useEffect(() => {
    const fetchUncheckedMissedCalls = async () => {
      setLoadingMissedCalls(true);
      try {
        const response = await getUncheckedMissedCalls({ limit: 50 });
        if (response.data.success) {
          setUncheckedMissedCalls(response.data.data.calls || []);
        }
      } catch (error) {
        console.error('Error fetching unchecked missed calls:', error);
      } finally {
        setLoadingMissedCalls(false);
      }
    };

    if (selectedView === 'calls') {
      fetchUncheckedMissedCalls();
    }
  }, [selectedView]);

  // Load seen document reviews from localStorage
  useEffect(() => {
    const storedSeen = localStorage.getItem('seenDocumentReviews');
    if (storedSeen) {
      try {
        const seenArray = JSON.parse(storedSeen);
        setSeenDocumentReviews(new Set(seenArray));
      } catch (error) {
        console.error('Error loading seen document reviews:', error);
      }
    }
  }, []);

  // Fetch reviewed documents
  useEffect(() => {
    const fetchReviewedDocuments = async () => {
      setLoadingReviews(true);
      try {
        const response = await getMySubmissionsRequest();
        if (response.data.success) {
          const documents = response.data.documents || [];
          setReviewedDocuments(documents);
          // Store timestamp of last check
          setLastReviewCheck(new Date().toISOString());
        }
      } catch (error) {
        console.error('Error fetching reviewed documents:', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    // Always fetch to show badge count, not just when view is selected
    fetchReviewedDocuments();
    
    // Set up polling to check for new status updates every 30 seconds
    const pollInterval = setInterval(() => {
      fetchReviewedDocuments();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  // Fetch documents sent to lawyer (for lawyers)
  useEffect(() => {
    const fetchPendingDocuments = async () => {
      setLoadingPendingDocs(true);
      try {
        const response = await getPendingDocumentsRequest();
        if (response.data.success) {
          setDocumentsSentToLawyer(response.data.documents || []);
        }
      } catch (error) {
        console.error('Error fetching pending documents:', error);
      } finally {
        setLoadingPendingDocs(false);
      }
    };

    // Fetch if user is a lawyer (you may need to check user role)
    fetchPendingDocuments();
    
    // Set up polling every 30 seconds
    const pollInterval = setInterval(() => {
      fetchPendingDocuments();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const today = dayjs().startOf('day');
    const now = dayjs();

    const todayTasks = tasks.filter(task => {
      if (!task.last_date) return false;
      const taskDate = dayjs(task.last_date).startOf('day');
      return taskDate.isSame(today) && task.status !== 'DONE' && task.status !== 'STUCK';
    });

    const overdueTasks = tasks.filter(task => {
      if (!task.last_date) return false;
      const taskDate = dayjs(task.last_date);
      return taskDate.isBefore(now, 'day') && task.status !== 'DONE';
    });

    const stuckTasks = tasks.filter(task => {
      return task.status === 'STUCK';
    });

    return {
      today: todayTasks,
      overdue: overdueTasks,
      stuck: stuckTasks
    };
  }, [tasks]);

  // Filter meetings for today
  const todayMeetings = useMemo(() => {
    const today = dayjs().startOf('day');
    const tomorrow = dayjs().add(1, 'day').startOf('day');

    return meetings.filter(meeting => {
      if (!meeting.date) return false;
      const meetingDate = dayjs(meeting.date).startOf('day');
      return meetingDate.isSame(today) || (meetingDate.isAfter(today) && meetingDate.isBefore(tomorrow));
    });
  }, [meetings]);

  const unreadUpdatesCount = unreadUpdates.length;

  // Filter conversations with unread messages
  const unreadConversations = useMemo(() => {
    return conversations.filter(conv => conv.unread_count > 0);
  }, [conversations]);

  // Total unread count for chat button badge
  const totalUnreadChatCount = useMemo(() => {
    const privateChatCount = unreadConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    const projectChatCount = projectChats.reduce((sum, proj) => sum + (proj.unread_count || 0), 0);
    return privateChatCount + projectChatCount;
  }, [unreadConversations, projectChats]);

  // Count reviewed documents (APPROVED or REJECTED)
  const reviewedDocumentsCount = useMemo(() => {
    return reviewedDocuments.filter(doc => 
      doc.status === 'APPROVED' || doc.status === 'REJECTED'
    ).length;
  }, [reviewedDocuments]);

  // Count unread document reviews (reviewed but not seen)
  const unreadDocumentReviewsCount = useMemo(() => {
    return reviewedDocuments.filter(doc => 
      (doc.status === 'APPROVED' || doc.status === 'REJECTED') &&
      !seenDocumentReviews.has(doc.t_document_id)
    ).length;
  }, [reviewedDocuments, seenDocumentReviews]);

  // Get unread document reviews
  const unreadDocumentReviews = useMemo(() => {
    return reviewedDocuments.filter(doc => 
      (doc.status === 'APPROVED' || doc.status === 'REJECTED') &&
      !seenDocumentReviews.has(doc.t_document_id)
    );
  }, [reviewedDocuments, seenDocumentReviews]);

  // Mark document review as seen
  const markDocumentReviewAsSeen = useCallback((docId) => {
    setSeenDocumentReviews(prev => {
      const newSet = new Set(prev);
      newSet.add(docId);
      // Persist to localStorage
      localStorage.setItem('seenDocumentReviews', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, []);

  // Count new status changes (reviewed in last 24 hours)
  const newStatusChangesCount = useMemo(() => {
    const oneDayAgo = dayjs().subtract(24, 'hours');
    return reviewedDocuments.filter(doc => 
      (doc.status === 'APPROVED' || doc.status === 'REJECTED') &&
      doc.reviewed_at &&
      dayjs(doc.reviewed_at).isAfter(oneDayAgo)
    ).length;
  }, [reviewedDocuments]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'DONE': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'OVER_DUE': return 'bg-red-100 text-red-800';
      case 'STUCK': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTaskClick = (task) => {
    if (task.project_id) {
      router.push(`/dashboard/project/${task.project_id}/task/${task.task_id}`);
    } else {
      router.push(`/dashboard/projects/tasks/${task.task_id}`);
    }
  };

  const handleMeetingClick = (meeting) => {
    router.push(`/meeting/${meeting.meeting_id}`);
  };

  const handleUnreadUpdateNavigate = useCallback((update) => {
    if (update?.task?.project_id && update?.task?.task_id) {
      router.push(`/dashboard/project/${update.task.project_id}/task/${update.task.task_id}`);
    }
  }, [router]);

  const handleChatClick = (conversation) => {
    // Navigate to private chat with user_id as query parameter
    const otherUserId = conversation.other_user?.user_id;
    if (otherUserId) {
      router.push(`/dashboard/private-chat?user_id=${otherUserId}`);
    } else {
      router.push(`/dashboard/private-chat`);
    }
  };

  const handleReviewClick = (doc) => {
    // Navigate to edit-document page which handles status display
    router.push(`/dashboard/edit-document/${doc.t_document_id}?status=${doc.status}&rejection_reason=${encodeURIComponent(doc.rejection_reason || '')}`);
  };

  const handleOverviewMarkUpdates = useCallback(async (updateIds = []) => {
    if (!Array.isArray(updateIds) || updateIds.length === 0) return;
    try {
      await markTaskUpdatesAsReadRequest(updateIds);
      setUnreadUpdates((prev) => prev.filter((update) => !updateIds.includes(update.update_id)));
    } catch (error) {
      console.error('Error marking updates as read:', error);
    }
  }, []);

  const handleOverviewMarkSingleUpdate = useCallback(async (updateId) => {
    if (!updateId) return;
    setMarkingUpdateIds((prev) => (prev.includes(updateId) ? prev : [...prev, updateId]));
    try {
      await handleOverviewMarkUpdates([updateId]);
    } catch (error) {
      // error already logged in handleOverviewMarkUpdates
    } finally {
      setMarkingUpdateIds((prev) => prev.filter((id) => id !== updateId));
    }
  }, [handleOverviewMarkUpdates]);

  const handleOverviewMarkAllUpdates = useCallback(async () => {
    if (unreadUpdates.length === 0) return;
    setMarkingAllUpdates(true);
    try {
      await handleOverviewMarkUpdates(unreadUpdates.map((update) => update.update_id));
    } catch (error) {
      // error already logged
    } finally {
      setMarkingAllUpdates(false);
    }
  }, [handleOverviewMarkUpdates, unreadUpdates]);

  // Group messages by task_id
  const groupMessagesByTask = useCallback((messages, projectId) => {
    const grouped = {};

    // Get task names from tasks array for this project
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const taskNameMap = new Map(projectTasks.map(t => [t.task_id, t.name]));

    messages?.forEach((message) => {
      const taskId = message?.task_id;
      // Use 'general' for general project chat (task_id is null, 0, or -1)
      const key = (Number.isInteger(taskId) && taskId > 0) ? taskId : 'general';

      if (!grouped[key]) {
        const taskName = key === 'general'
          ? 'Project Chat'
          : (taskNameMap.get(taskId) || `Task ${taskId}`);
        grouped[key] = {
          task_id: key === 'general' ? null : taskId,
          task_name: taskName,
          messages: []
        };
      }

      grouped[key].messages.push(message);
    });

    // Sort messages within each group by createdAt (newest first)
    Object.values(grouped).forEach(group => {
      group.messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    return grouped;
  }, [tasks]);

  const handleProjectChatClick = (project) => {
    if (!project?.project_id) return;

    const messages = project?.messages || [];

    // If no messages, go to project chat
    if (messages.length === 0) {
      router.push(`/dashboard/project/${project.project_id}/chat`);
      return;
    }

    // Group messages by task_id
    const groupedMessages = groupMessagesByTask(messages, project.project_id);
    const taskKeys = Object.keys(groupedMessages);

    // If only one task (or all messages are general chat), navigate directly
    if (taskKeys.length === 1) {
      const taskKey = taskKeys[0];
      const taskId = groupedMessages[taskKey].task_id;

      if (taskId) {
        router.push(`/dashboard/project/${project.project_id}/task/${taskId}`);
      } else {
        router.push(`/dashboard/project/${project.project_id}/chat`);
      }
      return;
    }

    // Multiple tasks - show modal
    setSelectedProjectForModal(project);
    setShowUnreadMessagesModal(true);
  };

  const handleMessageClick = (projectId, taskId) => {
    if (taskId) {
      router.push(`/dashboard/project/${projectId}/task/${taskId}`);
    } else {
      router.push(`/dashboard/project/${projectId}/chat`);
    }
    setShowUnreadMessagesModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6 h-[calc(100vh-6rem)]">
          {/* Left Side - Options */}
          <div className="w-64 flex-shrink-0">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick View</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedView === 'tasks' ? 'default' : 'outline'}
                  className={`w-full justify-start ${selectedView === 'tasks'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : ''
                    }`}
                  onClick={() => setSelectedView('tasks')}
                >
                  <ListTodo className="mr-2 h-4 w-4" />
                  Tasks
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => { }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Mails
                </Button>
                <Button
                  variant={selectedView === 'calls' ? 'default' : 'outline'}
                  className={`w-full justify-start relative ${selectedView === 'calls'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : ''
                    }`}
                  onClick={() => setSelectedView('calls')}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Calls
                  {uncheckedMissedCalls.length > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5">
                      {uncheckedMissedCalls.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={selectedView === 'updates' ? 'default' : 'outline'}
                  className={`w-full justify-start relative ${selectedView === 'updates'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : ''
                    }`}
                  onClick={() => setSelectedView('updates')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Updates
                  {unreadUpdatesCount > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5">
                      {unreadUpdatesCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={selectedView === 'meetings' ? 'default' : 'outline'}
                  className={`w-full justify-start ${selectedView === 'meetings'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : ''
                    }`}
                  onClick={() => setSelectedView('meetings')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Meetings
                </Button>
                <Button
                  variant={selectedView === 'chat' ? 'default' : 'outline'}
                  className={`w-full justify-start relative ${selectedView === 'chat'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : ''
                    }`}
                  onClick={() => setSelectedView('chat')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Private Chat
                  {unreadConversations.length > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5">
                      {unreadConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={selectedView === 'project-chat' ? 'default' : 'outline'}
                  className={`w-full justify-start relative ${selectedView === 'project-chat'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : ''
                    }`}
                  onClick={() => setSelectedView('project-chat')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Project Chat
                  {projectChats.length > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5">
                      {projectChats.reduce((sum, proj) => sum + (proj.unread_count || 0), 0)}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={selectedView === 'reviews' ? 'default' : 'outline'}
                  className={`w-full justify-start relative ${selectedView === 'reviews'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : ''
                    }`}
                  onClick={() => setSelectedView('reviews')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Documents Review
                  {unreadDocumentReviewsCount > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5">
                      {unreadDocumentReviewsCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={selectedView === 'lawyer-docs' ? 'default' : 'outline'}
                  className={`w-full justify-start relative ${selectedView === 'lawyer-docs'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : ''
                    }`}
                  onClick={() => setSelectedView('lawyer-docs')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Documents for Review
                  {documentsSentToLawyer.length > 0 && (
                    <Badge className="ml-auto bg-orange-500 text-white text-xs px-1.5 py-0.5">
                      {documentsSentToLawyer.length}
                    </Badge>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedView === 'tasks' ? (
              <div className="space-y-6">
                {/* Today's Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Tasks Due Today ({filteredTasks.today.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredTasks.today.length > 0 ? (
                      <div className="space-y-3">
                        {filteredTasks.today.map((task) => (
                          <div
                            key={task.task_id}
                            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                  {task.name}
                                </h3>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={getStatusColor(task.status)}>
                                    {task.status?.replace('_', ' ')}
                                  </Badge>
                                  {task.priority && (
                                    <Badge className={getPriorityColor(task.priority)}>
                                      {task.priority}
                                    </Badge>
                                  )}
                                  {task.project && (
                                    <span className="text-xs text-gray-500">
                                      {task.project.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No tasks due today
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Overdue Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Overdue Tasks ({filteredTasks.overdue.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredTasks.overdue.length > 0 ? (
                      <div className="space-y-3">
                        {filteredTasks.overdue.map((task) => (
                          <div
                            key={task.task_id}
                            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors bg-red-50 border-red-200"
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                  {task.name}
                                </h3>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={getStatusColor(task.status)}>
                                    {task.status?.replace('_', ' ')}
                                  </Badge>
                                  {task.priority && (
                                    <Badge className={getPriorityColor(task.priority)}>
                                      {task.priority}
                                    </Badge>
                                  )}
                                  {task.project && (
                                    <span className="text-xs text-gray-500">
                                      {task.project.name}
                                    </span>
                                  )}
                                  {task.last_date && (
                                    <span className="text-xs text-red-600 font-medium">
                                      Due: {dayjs(task.last_date).format('MMM D, YYYY')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 ml-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No overdue tasks
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Stuck Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      Stuck Tasks ({filteredTasks.stuck.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredTasks.stuck.length > 0 ? (
                      <div className="space-y-3">
                        {filteredTasks.stuck.map((task) => (
                          <div
                            key={task.task_id}
                            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors bg-orange-50 border-orange-200"
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                  {task.name}
                                </h3>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                                {task.stuckReason && (
                                  <p className="text-sm text-orange-700 mb-2 italic">
                                    Reason: {task.stuckReason}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={getStatusColor(task.status)}>
                                    {task.status?.replace('_', ' ')}
                                  </Badge>
                                  {task.priority && (
                                    <Badge className={getPriorityColor(task.priority)}>
                                      {task.priority}
                                    </Badge>
                                  )}
                                  {task.project && (
                                    <span className="text-xs text-gray-500">
                                      {task.project.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 ml-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No stuck tasks
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : selectedView === 'updates' ? (
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Unread Task Updates ({unreadUpdatesCount})
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Review updates you haven't opened yet
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={unreadUpdatesCount === 0 || markingAllUpdates}
                    onClick={handleOverviewMarkAllUpdates}
                  >
                    {markingAllUpdates ? 'Marking...' : 'Mark all as read'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingUpdates ? (
                    <div className="py-8 flex justify-center">
                      <Loader />
                    </div>
                  ) : unreadUpdatesCount > 0 ? (
                    <div className="space-y-3">
                      {unreadUpdates.map((update) => (
                        <div
                          key={update.update_id}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">
                                  {update.user?.name || 'Unknown'}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {dayjs(update.created_at).format('MMM D, h:mm A')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {update.content}
                              </p>
                              {update.task && (
                                <button
                                  onClick={() => handleUnreadUpdateNavigate(update)}
                                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                  Task: {update.task.name}
                                </button>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className="bg-red-100 text-red-700">Unread</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOverviewMarkSingleUpdate(update.update_id)}
                                disabled={markingUpdateIds.includes(update.update_id)}
                              >
                                {markingUpdateIds.includes(update.update_id) ? 'Marking...' : 'Mark read'}
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 px-0"
                              onClick={() => handleUnreadUpdateNavigate(update)}
                            >
                              View details
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      You're all caught up on updates
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : selectedView === 'meetings' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Meetings for Today ({todayMeetings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayMeetings.length > 0 ? (
                    <div className="space-y-3">
                      {todayMeetings.map((meeting) => (
                        <div
                          key={meeting.meeting_id}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleMeetingClick(meeting)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {meeting.heading}
                              </h3>
                              {meeting.description && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {meeting.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={
                                  meeting.status === 'COMPLETED'
                                    ? 'bg-green-100 text-green-800'
                                    : meeting.status === 'PROCESSING'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }>
                                  {meeting.status}
                                </Badge>
                                {meeting.date && (
                                  <span className="text-xs text-gray-600">
                                    {dayjs(meeting.date).format('MMM D, YYYY')}
                                  </span>
                                )}
                                {meeting.time && (
                                  <span className="text-xs text-gray-600">
                                    {dayjs(meeting.time).format('h:mm A')}
                                  </span>
                                )}
                                {meeting.task && (
                                  <span className="text-xs text-gray-500">
                                    Task: {meeting.task.name}
                                  </span>
                                )}
                              </div>
                              {meeting.participants && meeting.participants.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500">
                                    Participants: {meeting.participants.length}
                                  </p>
                                </div>
                              )}
                            </div>
                            <Users className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No meetings scheduled for today
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : selectedView === 'chat' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    Unread Private Messages ({unreadConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {unreadConversations.length > 0 ? (
                    <div className="space-y-3">
                      {unreadConversations.map((conversation) => (
                        <div
                          key={conversation.private_conversation_id}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors bg-blue-50 border-blue-200"
                          onClick={() => handleChatClick(conversation)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <AvatarCompoment
                                name={conversation.other_user?.name || 'User'}
                                className="w-10 h-10 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">
                                    {conversation.other_user?.name || 'Unknown User'}
                                  </h3>
                                  {conversation.unread_count > 0 && (
                                    <Badge className="bg-red-500 text-white text-xs">
                                      {conversation.unread_count} {conversation.unread_count === 1 ? 'message' : 'messages'}
                                    </Badge>
                                  )}
                                </div>
                                {conversation.last_message && (
                                  <>
                                    <p className="text-sm text-gray-600 mb-1 line-clamp-2">
                                      {conversation.last_message.content}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {dayjs(conversation.last_message.created_at).format('MMM D, h:mm A')}
                                    </p>
                                  </>
                                )}
                                {!conversation.last_message && (
                                  <p className="text-sm text-gray-400 italic">
                                    No messages yet
                                  </p>
                                )}
                              </div>
                            </div>
                            <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No unread messages
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : selectedView === 'calls' ? (
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-blue-600" />
                      Unchecked Missed Calls ({uncheckedMissedCalls.length})
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Review missed calls you haven't checked yet
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uncheckedMissedCalls.length === 0 || markingAllCalls}
                    onClick={async () => {
                      setMarkingAllCalls(true);
                      try {
                        await markMissedCallsAsChecked('all');
                        setUncheckedMissedCalls([]);
                      } catch (error) {
                        console.error('Error marking all calls as checked:', error);
                      } finally {
                        setMarkingAllCalls(false);
                      }
                    }}
                  >
                    {markingAllCalls ? 'Marking...' : 'Mark all as checked'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingMissedCalls ? (
                    <div className="py-8 flex justify-center">
                      <Loader />
                    </div>
                  ) : uncheckedMissedCalls.length > 0 ? (
                    <div className="space-y-3">
                      {uncheckedMissedCalls.map((call) => {
                        const phoneNumber = call.from_number || call.to_number;
                        const displayName = call.contact_name || phoneNumber;
                        return (
                          <div
                            key={call.call_id}
                            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors bg-orange-50 border-orange-200"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">
                                    {displayName}
                                  </h3>
                                  <span className="text-xs text-gray-500">
                                    {dayjs(call.start_time).format('MMM D, h:mm A')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {phoneNumber}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-orange-100 text-orange-800 font-semibold">
                                    Missed Call
                                  </Badge>
                                  {call.duration && (
                                    <span className="text-xs text-gray-500">
                                      Duration: {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge className="bg-red-100 text-red-700">Unchecked</Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    setMarkingCallIds((prev) => [...prev, call.call_id]);
                                    try {
                                      await markMissedCallsAsChecked([call.call_id]);
                                      setUncheckedMissedCalls((prev) =>
                                        prev.filter((c) => c.call_id !== call.call_id)
                                      );
                                    } catch (error) {
                                      console.error('Error marking call as checked:', error);
                                    } finally {
                                      setMarkingCallIds((prev) =>
                                        prev.filter((id) => id !== call.call_id)
                                      );
                                    }
                                  }}
                                  disabled={markingCallIds.includes(call.call_id)}
                                >
                                  {markingCallIds.includes(call.call_id) ? 'Marking...' : 'Mark checked'}
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 px-0"
                                onClick={() => router.push('/dashboard/phone')}
                              >
                                View in Phone
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No unchecked missed calls
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : selectedView === 'project-chat' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Unread Project Chat Messages ({projectChats.reduce((sum, proj) => sum + (proj.unread_count || 0), 0)})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projectChats.length > 0 ? (
                    <div className="space-y-3">
                      {projectChats.map((project) => (
                        <div
                          key={project.project_id}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors bg-blue-50 border-blue-200"
                          onClick={() => handleProjectChatClick(project)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">
                                    {project.project_name}
                                  </h3>
                                  {project.unread_count > 0 && (
                                    <Badge className="bg-red-500 text-white text-xs">
                                      {project.unread_count} {project.unread_count === 1 ? 'message' : 'messages'}
                                    </Badge>
                                  )}
                                </div>
                                {project.last_message && (
                                  <>
                                    <p className="text-sm text-gray-600 mb-1 line-clamp-2">
                                      <span className="font-medium">{project.last_message.sender?.name || 'Unknown'}: </span>
                                      {project.last_message.content}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {dayjs(project.last_message.createdAt).format('MMM D, h:mm A')}
                                    </p>
                                  </>
                                )}
                                {!project.last_message && (
                                  <p className="text-sm text-gray-400 italic">
                                    No messages yet
                                  </p>
                                )}
                              </div>
                            </div>
                            <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No unread project chat messages
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : selectedView === 'reviews' ? (
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Unread Document Reviews ({unreadDocumentReviewsCount})
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Documents that have been reviewed but you haven't seen yet
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingReviews ? (
                    <div className="py-8 flex justify-center">
                      <Loader />
                    </div>
                  ) : unreadDocumentReviews.length > 0 ? (
                    <div className="space-y-3">
                      {unreadDocumentReviews.map((doc) => {
                        const isNewStatus = doc.reviewed_at && dayjs(doc.reviewed_at).isAfter(dayjs().subtract(24, 'hours'));
                        return (
                          <div
                            key={doc.t_document_id}
                            className={`p-4 border-2 rounded-lg hover:shadow-md transition-all relative ${
                              doc.status === 'APPROVED' 
                                ? 'bg-green-50 border-green-200 hover:border-green-300' 
                                : doc.status === 'REJECTED'
                                  ? 'bg-red-50 border-red-200 hover:border-red-300'
                                  : 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
                            } ${isNewStatus ? 'ring-2 ring-blue-400' : ''}`}
                          >
                            <div
                              className="cursor-pointer"
                              onClick={() => {
                                markDocumentReviewAsSeen(doc.t_document_id);
                                handleReviewClick(doc);
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900">
                                      {doc.filename}
                                    </h3>
                                    {isNewStatus && (
                                      <Badge className="bg-blue-500 text-white text-xs animate-pulse">
                                        New
                                      </Badge>
                                    )}
                                    <Badge className="bg-red-100 text-red-700 text-xs">Unread</Badge>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={
                                      doc.status === 'APPROVED' ? 'bg-green-200 text-green-800 font-semibold' :
                                        doc.status === 'REJECTED' ? 'bg-red-200 text-red-800 font-semibold' :
                                          'bg-yellow-200 text-yellow-800'
                                    }>
                                      {doc.status?.replace('_', ' ')}
                                    </Badge>
                                    {doc.reviewed_at && (
                                      <span className="text-xs text-gray-500">
                                        Reviewed: {dayjs(doc.reviewed_at).format('MMM D, YYYY h:mm A')}
                                      </span>
                                    )}
                                  </div>
                                  {doc.rejection_reason && (
                                    <p className="text-sm text-red-600 mt-2 font-medium">
                                      Reason: {doc.rejection_reason}
                                    </p>
                                  )}
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      You're all caught up on document reviews
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : selectedView === 'lawyer-docs' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Documents Sent for Review ({documentsSentToLawyer.length})
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Documents that clients have sent to you for review
                  </p>
                </CardHeader>
                <CardContent>
                  {loadingPendingDocs ? (
                    <div className="py-8 flex justify-center">
                      <Loader />
                    </div>
                  ) : documentsSentToLawyer.length > 0 ? (
                    <div className="space-y-3">
                      {documentsSentToLawyer.map((doc) => (
                        <div
                          key={doc.t_document_id}
                          className="p-4 border-2 rounded-lg hover:shadow-md cursor-pointer transition-all bg-blue-50 border-blue-200 hover:border-blue-300"
                          onClick={() => router.push(`/dashboard/lawyer-documents`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">
                                  {doc.filename}
                                </h3>
                                <Badge className="bg-orange-200 text-orange-800 font-semibold">
                                  Pending Review
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {doc.description && (
                                  <p className="text-sm text-gray-600">
                                    {doc.description}
                                  </p>
                                )}
                                {doc.user && (
                                  <span className="text-xs text-gray-500">
                                    From: {doc.user.name}
                                  </span>
                                )}
                                {doc.created_at && (
                                  <span className="text-xs text-gray-500">
                                    Sent: {dayjs(doc.created_at).format('MMM D, YYYY h:mm A')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No documents pending review
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      {/* Unread Messages Modal */}
      <Dialog open={showUnreadMessagesModal} onOpenChange={setShowUnreadMessagesModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Unread Messages - {selectedProjectForModal?.project_name || 'Project'}
            </DialogTitle>
            <DialogDescription>
              Click on any message to navigate to its task detail page
            </DialogDescription>
          </DialogHeader>

          {selectedProjectForModal && (() => {
            const groupedMessages = groupMessagesByTask(selectedProjectForModal.messages || [], selectedProjectForModal.project_id);
            const taskKeys = Object.keys(groupedMessages).sort((a, b) => {
              // Sort: general chat last, then by task_id
              if (a === 'general') return 1;
              if (b === 'general') return -1;
              return parseInt(a) - parseInt(b);
            });

            return (
              <div className="space-y-4 mt-4">
                {taskKeys.map((taskKey) => {
                  const group = groupedMessages[taskKey];
                  const taskId = group.task_id;

                  return (
                    <div key={taskKey} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <ListTodo className="h-4 w-4" />
                          {group.task_name}
                        </h3>
                        <Badge className="bg-blue-100 text-blue-800">
                          {group.messages.length} {group.messages.length === 1 ? 'message' : 'messages'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {group.messages.map((message) => (
                          <div
                            key={message.message_id}
                            onClick={() => handleMessageClick(selectedProjectForModal.project_id, taskId)}
                            className="p-3 bg-white border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              <AvatarCompoment
                                name={message.sender?.name || 'Unknown'}
                                className="w-8 h-8 text-xs flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900 text-sm">
                                    {message.sender?.name || 'Unknown'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {dayjs(message.createdAt).format('MMM D, h:mm A')}
                                  </span>
                                </div>
                                {message.content && (
                                  <p className="text-sm text-gray-700 line-clamp-2">
                                    {message.content}
                                  </p>
                                )}
                                {message.attachment_name && (
                                  <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                                    <FileText className="h-3 w-3" />
                                    <span>{message.attachment_name}</span>
                                  </div>
                                )}
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
