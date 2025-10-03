"use client";

import React, { useCallback, useState, useEffect, useRef } from 'react';

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
import { useRouter } from 'next/navigation';
import {
    Calendar,
    Mail,
    MessageCircle,
    Users,
    Clock,
    BarChart3,
    Briefcase,
    CheckCircle,
    X,
    Search,
    Plus,
    Send,
    Inbox,
    Archive,
    Trash2,
    User,
    Building,
    DollarSign,
    PhoneCall,
    Phone,
    FileSignature,
    FileText,
    Bell,
    BellOff,
    GitBranch
} from 'lucide-react';
import DOMPurify from 'dompurify';

import CaseModal from './modals/caseModal';
import ChatModal from './modals/chatModal';
import MailModal from './modals/mailModel';
import EnhancedMailModal from './EnhancedMailModal';
import MeetingModal from './modals/meetingModel';
import TemplateModal from './modals/templatesModel';
import TimelineModal from './modals/timelineModel';
// import CaseTimelineManagement from './modals/CaseTimelineManagement';

import BillerModal from './modals/BillerModal';
import CaseAssignmentModal from './modals/CaseAssignmentModal';
import ConnectMailBox from './mail/ConnectMailBox';
import FlowchartModal from './modals/FlowchartModal';
import { useUser } from '@/providers/UserProvider';
import { getAllProjectComprehensiveRequest } from '@/lib/http/project';
import { getTaskEmailRequest, sendTaskEmailRequest, sendEmailToClientRequest, checkMeetingEmailsRequest, getConnectMailsRequest, getAllTaskProgressRequest } from '@/lib/http/task';
import { getOrCreatePrivateConversationRequest, getPrivateConversationMessagesRequest, savePrivateMessageRequest } from '@/lib/http/chat';
import useChatHook from '@/hooks/useChatHook';
import { ON_PRIVATE_MESSAGE } from '@/contstant/chatEventConstant';
import LawFirmTimeline from './dashboards/timeLine';
import { toast } from 'react-toastify';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import moment from 'moment';
import { formatEmailBody } from './formatEmail';


const QuickActions = () => {
    const router = useRouter();
    const { user, loadUserWithProjects } = useUser();

    // Simple date formatting function to replace moment
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };



    const openBillerModal = () => setIsBillerModalOpen(true);
    const closeBillerModal = () => setIsBillerModalOpen(false);

    const openCaseAssignmentModal = () => setIsCaseAssignmentModalOpen(true);
    const closeCaseAssignmentModal = () => setIsCaseAssignmentModalOpen(false);



    const openSignatureModal = () => setIsSignatureModalOpen(true);
    const closeSignatureModal = () => setIsSignatureModalOpen(false);




    const allActions = [
        { name: 'Cases', icon: Briefcase, route: '/cases', color: 'bg-purple-200' },
        { name: 'TimeLine', icon: Clock, route: '/timeline', color: 'bg-orange-200' },
        // { name: 'Case Timeline', icon: Clock, route: '', color: 'bg-blue-200', action: openCaseTimelineManagement },
        { name: 'Meeting', icon: Calendar, route: '/dashboard/meeting', color: 'bg-pink-200' },
        { name: 'Schedule Meeting', icon: Calendar, route: '/dashboard/schedule-meet', color: 'bg-indigo-200' },
        { name: 'Mail', icon: Mail, route: '/mail', color: 'bg-red-200' },
        { name: 'Chat', icon: MessageCircle, route: '', color: 'bg-yellow-200' },
        { name: 'Team', icon: MessageCircle, route: '/dashboard/team', color: 'bg-emerald-200' },
        { name: 'TemplateDocs', icon: FileText, route: '/dashboard/template-documents', color: 'bg-indigo-200' },
        { name: 'Flowchart', icon: GitBranch, route: '/dashboard/flowchart', color: 'bg-cyan-200' },
        { name: 'Phone System', icon: Phone, route: '/dashboard/phone', color: 'bg-teal-200' },
        // { name: 'My Files', icon: FileText, route: `/dashboard/clients/${user?.user_id}`, color: 'bg-indigo-200' },
        // { name: 'Request Signature', icon: FileSignature, route: '', color: 'FileSignature', action: openSignatureModal },
        { name: 'InviteBiller', icon: DollarSign, route: '', color: 'bg-green-200', action: openBillerModal },
        { name: 'AssignToBiller', icon: Briefcase, route: '', color: 'bg-indigo-200', action: openCaseAssignmentModal },
    ];

    // Filter logic
    let quickActions = [];

    if (user?.Role === 'BILLER') {
        quickActions = allActions.filter(action =>
            ['Meeting', 'Schedule Meeting', 'Mail', 'Chat'].includes(action.name)
        );
    } else if (user?.Role === 'CLIENT') {
        quickActions = allActions.filter(action =>
            ['Meeting', 'Mail', 'Chat'].includes(action.name)
        );
        // Add client-specific actions
        quickActions.push(
            { name: 'My Signatures', icon: FileSignature, route: '/dashboard/client-signatures-simple', color: 'bg-purple-200' }
        );
    } else if (user?.Role === 'TEAM') {
        quickActions = allActions.filter(action =>
            ['Cases', 'Meeting', 'Mail', 'Chat'].includes(action.name)
        );
    } else if (user?.Role === 'PROVIDER') {
        // For PROVIDER, show all actions including Phone System
        quickActions = allActions;
    } else {
        // For others (ADMIN, etc.), show all actions except Phone System
        quickActions = allActions.filter(action => action.name !== 'Phone System');
    }

    // Modal states
    const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [isMailModalOpen, setIsMailModalOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

    const [isBillerModalOpen, setIsBillerModalOpen] = useState(false);
    const [isCaseAssignmentModalOpen, setIsCaseAssignmentModalOpen] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isFlowchartModalOpen, setIsFlowchartModalOpen] = useState(false);

    // New states for timeline functionality
    const [isTimelineCasesModalOpen, setIsTimelineCasesModalOpen] = useState(false);
    const [isLawFirmTimelineModalOpen, setIsLawFirmTimelineModalOpen] = useState(false);
    const [selectedProjectForTimeline, setSelectedProjectForTimeline] = useState(null);
    const [projects, setProjects] = useState(null);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [timelineData, setTimelineData] = useState(null);
    const [timelineLoading, setTimelineLoading] = useState(false);

    // New states for enhanced mail functionality
    const [isEnhancedMailModalOpen, setIsEnhancedMailModalOpen] = useState(false);
    const [mails, setMails] = useState([]);
    const [mailLoading, setMailLoading] = useState(false);
    const [selectedMail, setSelectedMail] = useState(null);
    const [currentCount, setCurrentCount] = useState(100);
    const [isConnectMailModalOpen, setIsConnectMailModalOpen] = useState(false);

    // Chat functionality states
    const [chatMessages, setChatMessages] = useState([]);
    const [chatConversationId, setChatConversationId] = useState('');
    const [chatMessageValue, setChatMessageValue] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatSending, setChatSending] = useState(false);
    const [chatSelectedFile, setChatSelectedFile] = useState(null);

    const chatContainerRef = useRef(null);
    const { handleSendMessage, socketRef } = useChatHook();
    const [isSendMailModalOpen, setIsSendMailModalOpen] = useState(false);
    const [sendMailLoading, setSendMailLoading] = useState(false);
    const [sendMailDataLoading, setSendMailDataLoading] = useState(false);
    const [sendMailForm, setSendMailForm] = useState({
        recipientType: '',
        recipientId: '',
        subject: '',
        content: '',
        taskId: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);

    // New states for enhanced chat functionality
    const [isEnhancedChatModalOpen, setIsEnhancedChatModalOpen] = useState(false);
    const [selectedChatType, setSelectedChatType] = useState('');
    const [selectedChatRecipient, setSelectedChatRecipient] = useState(null);

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [notificationSound, setNotificationSound] = useState(true);

    // Fetch all projects
    const fetchProjects = useCallback(async () => {
        setProjectsLoading(true);
        try {
            console.log('🔍 Fetching projects...');
            const res = await getAllProjectComprehensiveRequest();
            console.log('🔍 Projects API response:', res);

            const { projects, collaboratedProjects } = res.data;
            console.log('🔍 Projects from API:', projects);
            console.log('🔍 Collaborated projects from API:', collaboratedProjects);

            const allProjects = [...(projects || []), ...(collaboratedProjects || [])];
            console.log('🔍 Combined all projects:', allProjects);

            setProjects(allProjects);
        } catch (error) {
            console.error('❌ Error fetching projects:', error);
            setProjects(null);
        } finally {
            setProjectsLoading(false);
        }
    }, []);

    // Fetch timeline data for a specific project
    const fetchTimelineData = useCallback(async (projectId) => {
        if (!projectId) return;

        setTimelineLoading(true);
        try {
            console.log('🔍 Fetching timeline data for project:', projectId);

            // Get current date and format it properly for the API (DD-MM-YYYY)
            const now = new Date();
            const endDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

            // Calculate start date (30 days ago for better coverage)
            const startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

            console.log('🔍 Fetching timeline with dates:', { startDate, endDate });

            // Fetch timeline data using the task progress API
            const res = await getAllTaskProgressRequest(startDate, endDate, null, projectId);
            console.log('🔍 Timeline API response:', res.data);

            if (res.data && res.data.success) {
                const timelineData = {
                    progress: res.data.progress || [],
                    times: res.data.times || [],
                    documents: res.data.documents || []
                };
                console.log('✅ Timeline data fetched successfully:', timelineData);
                setTimelineData(timelineData);
            } else {
                console.warn('⚠️ Timeline API returned no data or error');
                setTimelineData({
                    progress: [],
                    times: [],
                    documents: []
                });
            }
        } catch (error) {
            console.error('❌ Error fetching timeline data:', error);
            setTimelineData({
                progress: [],
                times: [],
                documents: []
            });
        } finally {
            setTimelineLoading(false);
        }
    }, [getAllTaskProgressRequest]);




    const fetchMails = useCallback(async (count = 100) => {
        setMailLoading(true);
        try {
            const res = await getConnectMailsRequest(count);
            // Filter emails to only show those containing mananrajpout258@gmail.com
            const filteredMails = res.data.mails.filter(mail => {
                const searchTerm = 'mananrajpout258@gmail.com';
                const from = mail.from?.toLowerCase() || '';
                const to = mail.to?.toLowerCase() || '';
                const subject = mail.subject?.toLowerCase() || '';
                const body = mail.body?.toLowerCase() || '';

                return from.includes(searchTerm) ||
                    to.includes(searchTerm) ||
                    subject.includes(searchTerm) ||
                    body.includes(searchTerm);
            });
            setMails(filteredMails);
            setCurrentCount(count);
        } catch (error) {
            console.error('Error fetching connected mails:', error);
            setMails([]);
        } finally {
            setMailLoading(false);
        }
    }, []);

    const loadMoreMails = useCallback(async () => {
        setMailLoading(true);
        try {
            const newCount = currentCount + 100;
            const res = await getConnectMailsRequest(newCount);
            // Filter emails to only show those containing mananrajpout258@gmail.com
            const filteredMails = res.data.mails.filter(mail => {
                const searchTerm = 'mananrajpout258@gmail.com';
                const from = mail.from?.toLowerCase() || '';
                const to = mail.to?.toLowerCase() || '';
                const subject = mail.subject?.toLowerCase() || '';
                const body = mail.body?.toLowerCase() || '';

                return from.includes(searchTerm) ||
                    to.includes(searchTerm) ||
                    subject.includes(searchTerm) ||
                    body.includes(searchTerm);
            });
            setMails(filteredMails);
            setCurrentCount(newCount);
        } catch (error) {
            console.error('Error loading more mails:', error);
        } finally {
            setMailLoading(false);
        }
    }, [currentCount]);



    // Modal handlers
    const openCasesModal = () => setIsCaseModalOpen(true);
    const closeCasesModal = () => setIsCaseModalOpen(false);

    const openChatModal = () => setIsChatModalOpen(true);
    const closeChatModal = () => setIsChatModalOpen(false);

    const openMailModal = () => setIsMailModalOpen(true);
    const closeMailModal = () => setIsMailModalOpen(false);

    const openMeetingModal = () => setIsMeetingModalOpen(true);
    const closeMeetingModal = () => setIsMeetingModalOpen(false);

    const openTemplateModal = () => setIsTemplateModalOpen(true);
    const closeTemplateModal = () => setIsTemplateModalOpen(false);

    const openTimelineModal = () => setIsTimelineModalOpen(true);
    const closeTimelineModal = () => setIsTimelineModalOpen(false);

    const openFlowchartModal = () => {
        setIsFlowchartModalOpen(true);
        fetchProjects();
    };
    const closeFlowchartModal = () => {
        setIsFlowchartModalOpen(false);
        setSearchTerm('');
        setSelectedProjectForTimeline(null);
    };





    // New timeline modal handlers
    const openTimelineCasesModal = () => {
        setIsTimelineCasesModalOpen(true);
        fetchProjects();
    };
    const closeTimelineCasesModal = () => {
        setIsTimelineCasesModalOpen(false);
        setSearchTerm('');
        setSelectedProjectForTimeline(null);
        setTimelineData(null);
    };

    const openLawFirmTimelineModal = async (project) => {
        console.log('🔍 Opening timeline for project:', project);

        if (!project || !project.project_id) {
            console.error('❌ Invalid project data:', project);
            toast.error('Invalid project data. Please try again.');
            return;
        }

        setSelectedProjectForTimeline(project);
        setIsTimelineCasesModalOpen(false);
        setIsLawFirmTimelineModalOpen(true);

        // Fetch timeline data for this specific project
        try {
            await fetchTimelineData(project.project_id);
        } catch (error) {
            console.error('❌ Error in openLawFirmTimelineModal:', error);
            toast.error('Failed to load timeline data. Please try again.');
        }
    };

    const closeLawFirmTimelineModal = () => {
        setIsLawFirmTimelineModalOpen(false);
        setSelectedProjectForTimeline(null);
        setTimelineData(null);
    };

    // New enhanced mail modal handlers
    const openEnhancedMailModal = async () => {
        setIsEnhancedMailModalOpen(true);
        try {
            await fetchMails();
        } catch (error) {
            console.error('Error loading mail data:', error);
        }
    };
    const closeEnhancedMailModal = () => {
        setIsEnhancedMailModalOpen(false);
        setSelectedMail(null);
    };

    const openConnectMailModal = () => setIsConnectMailModalOpen(true);
    const closeConnectMailModal = () => setIsConnectMailModalOpen(false);

    const handleConnectMailSuccess = () => {
        // Refresh mails after successful connection
        fetchMails();
    };

    const openSendMailModal = async () => {
        setIsSendMailModalOpen(true);
        setSendMailForm({
            recipientType: '',
            recipientId: '',
            subject: '',
            content: '',
            taskId: ''
        });
        setSelectedFile(null);

        // Ensure user data is loaded with projects, members, and clients
        setSendMailDataLoading(true);
        try {
            if (!user?.Projects || user.Projects.length === 0) {
                console.log('🔍 No user projects data, loading fresh data for send mail...');
                await loadUserWithProjects();
                console.log('🔍 Loaded fresh user data for send mail');
            } else {
                console.log('🔍 User already has projects data, checking if it includes members/clients...');
                // Check if the projects data includes members and clients
                const hasFullData = user.Projects.some(project =>
                    project.Members && Array.isArray(project.Members) &&
                    project.Clients && Array.isArray(project.Clients)
                );

                if (!hasFullData) {
                    console.log('🔍 Projects data exists but missing members/clients, loading fresh data for send mail...');
                    await loadUserWithProjects();
                    console.log('🔍 Loaded fresh user data with full project details for send mail');
                }
            }
        } catch (error) {
            console.error('🔍 Error loading user projects for send mail:', error);
        } finally {
            setSendMailDataLoading(false);
        }
    };
    const closeSendMailModal = () => {
        setIsSendMailModalOpen(false);
        setSendMailForm({
            recipientType: '',
            recipientId: '',
            subject: '',
            content: '',
            taskId: ''
        });
        setSelectedFile(null);
    };

    // New enhanced chat modal handlers
    const openEnhancedChatModal = async () => {
        console.log('🔍 Opening enhanced chat modal...');
        console.log('🔍 Current user projects:', user?.Projects);
        setIsEnhancedChatModalOpen(true);

        // Check if user has full projects data, if not, load it
        if (!user?.Projects || user.Projects.length === 0) {
            console.log('🔍 No user projects data, attempting to load fresh data...');
            try {
                const fullUserData = await loadUserWithProjects();
                console.log('🔍 Loaded fresh user data:', fullUserData);
                console.log('🔍 Projects with full data:', fullUserData?.Projects);
            } catch (error) {
                console.error('🔍 Error loading user projects:', error);
            }
        } else {
            console.log('🔍 User already has projects data, checking if it includes members/clients...');
            // Check if the projects data includes members and clients
            const hasFullData = user.Projects.some(project =>
                project.Members && Array.isArray(project.Members) &&
                project.Clients && Array.isArray(project.Clients)
            );

            if (!hasFullData) {
                console.log('🔍 Projects data exists but missing members/clients, loading fresh data...');
                try {
                    const fullUserData = await loadUserWithProjects();
                    console.log('🔍 Loaded fresh user data with full project details:', fullUserData);
                } catch (error) {
                    console.error('🔍 Error loading fresh user projects:', error);
                }
            }
        }
    };
    const closeEnhancedChatModal = () => {
        setIsEnhancedChatModalOpen(false);
        setSelectedChatType('');
        setSelectedChatRecipient(null);
        setChatMessages([]);
        setChatConversationId('');
        setChatMessageValue('');
    };

    // Chat functionality
    const getChatConversation = useCallback(async (user_id) => {
        if (!user_id) {
            console.error('Missing user_id for conversation');
            return;
        }

        setChatLoading(true);
        try {

            let res = await getOrCreatePrivateConversationRequest({ user_id });
            const conversation = res.data.conversation;
            const conversation_id = conversation.private_conversation_id;

            if (!conversation_id) {
                throw new Error('No conversation ID received from server');
            }

            setChatConversationId(conversation_id);
            setChatMessages(conversation.messages || []);

            return conversation_id;
        } catch (error) {
            console.error('Error getting private chat conversation:', error.response?.data?.message || error.message);
            setChatMessages([]);
            setChatConversationId('');
            throw error;
        } finally {
            setChatLoading(false);
        }
    }, []);

    // Notification functions
    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: Date.now(),
            ...notification,
            timestamp: new Date(),
            isRead: false
        };

        setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50 notifications
        setUnreadNotificationCount(prev => prev + 1);

        // Play notification sound if enabled
        if (notificationSound) {
            try {
                const audio = new Audio('/ding.mp3');
                audio.play().catch(err => console.log('Could not play notification sound:', err));
            } catch (error) {
                console.log('Notification sound not available');
            }
        }

        console.log('📱 New notification added:', newNotification);
    }, [notificationSound]);

    const markNotificationAsRead = useCallback((notificationId) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId
                    ? { ...notif, isRead: true }
                    : notif
            )
        );
        setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllNotificationsAsRead = useCallback(() => {
        setNotifications(prev =>
            prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadNotificationCount(0);
    }, []);

    const clearNotification = useCallback((notificationId) => {
        setNotifications(prev => {
            const notification = prev.find(n => n.id === notificationId);
            if (notification && !notification.isRead) {
                setUnreadNotificationCount(prev => Math.max(0, prev - 1));
            }
            return prev.filter(n => n.id !== notificationId);
        });
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
        setUnreadNotificationCount(0);
    }, []);

    const toggleNotificationSound = useCallback(() => {
        setNotificationSound(prev => !prev);
    }, []);

    const handleChatSend = useCallback(async () => {
        if (!chatMessageValue.trim() || !selectedChatRecipient || !user) return;

        if (chatSending) {
            return;
        }

        setChatSending(true);

        try {
            let currentConversationId = chatConversationId;

            if (!currentConversationId) {
                currentConversationId = await getChatConversation(selectedChatRecipient.id);

                if (!currentConversationId) {
                    toast.error("Failed to initialize conversation. Please try again.");
                    return;
                }
            }

            // Store file reference and message content before clearing
            const fileToUpload = chatSelectedFile;
            const messageContent = chatMessageValue.trim();

            const data = {
                private_conversation_id: currentConversationId,
                sender_id: user.user_id,
                receiver_id: selectedChatRecipient.id,
                content: messageContent,
                content_type: "PLAIN_TEXT",
                sender_name: user?.name,
                // Include attachment info in socket data
                attachment_url: fileToUpload ? 'uploading...' : null,
                attachment_name: fileToUpload?.name,
                attachment_size: fileToUpload?.size,
                attachment_mime_type: fileToUpload?.type
            };



            // Send via socket immediately - don't wait for it
            try {
                console.log('📤 Sending message via socket:', data);
                handleSendMessage(data); // Remove await
                console.log('✅ Message sent via socket successfully');
            } catch (socketError) {
                console.error('Socket error:', socketError);
                // Continue with local message even if socket fails
                console.log('Continuing with local message despite socket error');
            }

            // Add message to local state immediately
            const tempMessageId = `temp-${Date.now()}`;
            const messageWithTempId = {
                ...data,
                private_message_id: tempMessageId,
                temp_message_id: tempMessageId, // Add temp_message_id for tracking
                attachment_url: fileToUpload ? 'uploading...' : null,
                attachment_name: fileToUpload?.name,
                attachment_size: fileToUpload?.size,
                attachment_mime_type: fileToUpload?.type
            };
            setChatMessages(prev => [...prev, messageWithTempId]);
            setChatMessageValue('');

            // Clear selected file immediately
            setChatSelectedFile(null);

            // Clear the file input
            const fileInput = document.getElementById('chat-file-upload');
            if (fileInput) {
                fileInput.value = '';
            }

            // Prepare form data for file upload
            const formData = new FormData();
            formData.append('private_conversation_id', currentConversationId);
            formData.append('content', messageContent);
            formData.append('receiver_id', selectedChatRecipient.id);
            formData.append('temp_message_id', tempMessageId); // Send temp_message_id to backend

            if (fileToUpload) {
                formData.append('file', fileToUpload);
            }

            // Save to database (for file attachments only)
            if (fileToUpload) {
                savePrivateMessageRequest(formData).then(res => {
                    // Update message with real message_id from database and attachment info
                    const updatedMessage = {
                        ...res.data.message,
                        private_message_id: res.data.message.private_message_id,
                        temp_message_id: res.data.message.temp_message_id, // Include temp_message_id from response
                        attachment_url: res.data.message.attachment_url,
                        attachment_name: res.data.message.attachment_name,
                        attachment_size: res.data.message.attachment_size,
                        attachment_mime_type: res.data.message.attachment_mime_type
                    };

                    setChatMessages(prev => prev.map(msg =>
                        msg.temp_message_id === tempMessageId
                            ? updatedMessage
                            : msg
                    ));

                    // Update the local message with real attachment URL (no broadcast needed)
                    // Other users will get the complete message with attachment via backend broadcast
                    console.log('✅ Local message updated with attachment URL');
                }).catch(error => {
                    console.error('❌ Failed to save message to database:', error);
                    toast.warning("Message sent but failed to save to database");
                });
            }

        } catch (error) {
            console.error('Error sending message:', error);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setChatSending(false);
        }
    }, [chatMessageValue, selectedChatRecipient, user, chatConversationId, handleSendMessage, getChatConversation, chatSending, chatSelectedFile]);

    const handleChatKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSend();
        }
    }, [handleChatSend]);

    // Initialize chat when recipient is selected
    useEffect(() => {
        if (selectedChatRecipient) {
            getChatConversation(selectedChatRecipient.id);
        }
    }, [selectedChatRecipient, getChatConversation]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [chatMessages]);

    // Listen for chat notifications
    useEffect(() => {
        const handleChatNotification = (event) => {
            const { type, message, notification } = event.detail;

            // Don't show notifications for messages from the current user
            if (message.sender_id === parseInt(user?.user_id)) {
                return;
            }

            // Add notification to the list
            addNotification({
                type,
                title: notification.title,
                body: notification.body,
                icon: notification.icon,
                priority: notification.priority,
                message: message,
                conversationType: message.conversation_type || 'unknown'
            });
        };

        // Listen for chat notification events
        window.addEventListener('chatNotificationClicked', handleChatNotification);

        // Also listen for custom chat notification events
        const customChatNotificationHandler = (event) => {
            const { type, message, notification } = event.detail;
            addNotification({
                type,
                title: notification.title,
                body: notification.body,
                icon: notification.icon,
                priority: notification.priority,
                message: message,
                conversationType: message.conversation_type || 'unknown'
            });
        };

        window.addEventListener('chatNotification', customChatNotificationHandler);

        return () => {
            window.removeEventListener('chatNotificationClicked', handleChatNotification);
            window.removeEventListener('chatNotification', customChatNotificationHandler);
        };
    }, [addNotification, user?.user_id]);

    // Set up socket listeners for chat
    useEffect(() => {


        if (!socketRef?.current) {
            console.log('❌ No socket reference, skipping listener setup');
            return;
        }

        const socket = socketRef.current;
        console.log('🔌 Setting up private message listener...');

        const messageHandler = (data) => {
            console.log('🔍 Received private message:', data);
            console.log('🔍 Current selectedChatRecipient:', selectedChatRecipient);
            console.log('🔍 Current user:', user?.user_id);

            // Check if this message is for the current chat
            if (selectedChatRecipient &&
                ((parseInt(data.sender_id) === selectedChatRecipient.id && parseInt(data.receiver_id) === user?.user_id) ||
                    (parseInt(data.receiver_id) === selectedChatRecipient.id && parseInt(data.sender_id) === user?.user_id))) {

                console.log('✅ Message matches current chat, processing...');

                // Skip if this is the sender's own message (they already have it in local state)
                if (parseInt(data.sender_id) === user?.user_id) {
                    console.log('⚠️ Skipping sender\'s own message from socket');
                    return;
                }

                // Play ding sound for incoming messages (only if not from current user)
                if (parseInt(data.sender_id) !== user?.user_id) {
                    const audio = new Audio('/ding.mp3');
                    audio.play().catch(err => console.log('Could not play ding sound:', err));
                }

                setChatMessages(prev => {
                    // Handle attachment updates
                    if (data.is_update) {
                        return prev.map(msg => {
                            // Update existing message with real attachment URL using temp_message_id
                            if (msg.temp_message_id === data.temp_message_id) {
                                return {
                                    ...msg,
                                    private_message_id: data.private_message_id,
                                    attachment_url: data.attachment_url,
                                    attachment_name: data.attachment_name,
                                    attachment_size: data.attachment_size,
                                    attachment_mime_type: data.attachment_mime_type
                                };
                            }
                            return msg;
                        });
                    }

                    // Check if message already exists to prevent duplicates (like ProjectChat)
                    const messageExists = prev.some(msg => {
                        // Check by private_message_id first (most reliable)
                        if (data.private_message_id && msg.private_message_id === data.private_message_id) {
                            console.log('🔍 Duplicate found by private_message_id:', data.private_message_id);
                            return true;
                        }

                        // Check by temp_message_id
                        if (data.temp_message_id && msg.temp_message_id === data.temp_message_id) {
                            console.log('🔍 Duplicate found by temp_message_id:', data.temp_message_id);
                            return true;
                        }

                        // Check by content, sender, and time (fallback)
                        if (msg.content === data.content &&
                            parseInt(msg.sender_id) === parseInt(data.sender_id)) {
                            const timeDiff = Math.abs(new Date(msg.createdAt || msg.created_at) - new Date(data.createdAt || data.created_at));
                            if (timeDiff < 5000) { // Within 5 seconds
                                console.log('🔍 Duplicate found by content + sender + time:', {
                                    content: data.content,
                                    sender: data.sender_id,
                                    timeDiff: timeDiff
                                });
                                return true;
                            }
                        }

                        // Check for temporary messages with same content
                        if (msg.private_message_id?.startsWith('temp-') &&
                            msg.content === data.content &&
                            parseInt(msg.sender_id) === parseInt(data.sender_id)) {
                            console.log('🔍 Duplicate found by temp message with same content:', data.content);
                            return true;
                        }

                        return false;
                    });

                    if (messageExists) {
                        console.log('⚠️ Message already exists, skipping...');
                        return prev;
                    }

                    console.log('✅ Adding new message to chat:', data.content);

                    return [...prev, data];
                });
            }
        };

        socket.on(ON_PRIVATE_MESSAGE, messageHandler);

        console.log('✅ Socket listeners set up successfully');

        return () => {
            console.log('🔌 Cleaning up private message listener...');
            socket.off(ON_PRIVATE_MESSAGE, messageHandler);
        };
    }, [socketRef, selectedChatRecipient, user?.user_id]);

    const handleActionClick = (action) => {
        if (action.action) {
            action.action();
        } else if (action.name === 'Cases') {
            openCasesModal();
        } else if (action.name === 'Chat') {
            openEnhancedChatModal();
        } else if (action.name === 'TimeLine') {
            openTimelineCasesModal();
        } else if (action.name === 'Flowchart') {
            openFlowchartModal();
        } else if (action.name === 'Meeting') {
            openMeetingModal();
        } else if (action.name === 'Templates') {
            openTemplateModal();
        } else if (action.name === 'Mail') {
            openEnhancedMailModal();
        } else if (action.name === 'Biller') {
            openBillerModal();
        } else if (action.name === 'Request Signature') {
            openSignatureModal();
        } else {
            router.push(action.route);
        }
    };




    const connectWhatsapp = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.open('https://web.whatsapp.com', '_blank', 'width=800,height=600');
        }
    }, []);

    // Filter projects based on search term
    const filteredProjects = projects?.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get all team members from projects
    const getAllTeamMembers = useCallback(() => {
        // Use user's projects data instead of separate projects state
        const userProjects = user?.Projects || [];
        const userCollaboration = user?.Collaboration || [];
        const userServices = user?.Services || [];

        if (!userProjects.length && !userCollaboration.length && !userServices.length) {
            console.log('🔍 getAllTeamMembers: No user projects, collaboration, or services available');
            return [];
        }

        console.log('🔍 getAllTeamMembers: User projects:', userProjects);
        console.log('�� getAllTeamMembers: User collaboration:', userCollaboration);
        console.log('🔍 getAllTeamMembers: User services:', userServices);

        const teamMembers = new Map();

        // Process Projects
        userProjects.forEach((project, projectIndex) => {
            console.log(`🔍 Processing project ${projectIndex}: ${project.name}`, {
                projectId: project.project_id,
                hasMembers: !!project.Members,
                membersType: typeof project.Members,
                isArray: Array.isArray(project.Members),
                membersLength: project.Members?.length || 0,
                membersData: project.Members
            });

            if (project.Members && Array.isArray(project.Members)) {
                project.Members.forEach((member, memberIndex) => {
                    console.log(`🔍 Processing project member ${memberIndex}:`, {
                        member,
                        hasUser: !!member.user,
                        userId: member.user?.user_id,
                        userName: member.user?.name,
                        userEmail: member.user?.email
                    });

                    const isCurrentUser = member.user?.user_id === user?.user_id;

                    if (!isCurrentUser && !teamMembers.has(member.user?.user_id)) {
                        const teamMember = {
                            id: member.user?.user_id,
                            name: member.user?.name,
                            email: member.user?.email,
                            type: 'team',
                            role: 'MEMBER',
                            projectName: project.name,
                            source: 'Projects'
                        };
                        teamMembers.set(member.user?.user_id, teamMember);
                        console.log(`🔍 Added project team member:`, teamMember);
                    }
                });
            }
        });

        // Process Collaboration
        userCollaboration.forEach((collab, collabIndex) => {
            console.log(`🔍 Processing collaboration ${collabIndex}:`, {
                projectName: collab.project?.name,
                hasMembers: !!collab.project?.Members,
                membersLength: collab.project?.Members?.length || 0
            });

            if (collab.project?.Members && Array.isArray(collab.project.Members)) {
                collab.project.Members.forEach((member, memberIndex) => {
                    const isCurrentUser = member.user?.user_id === user?.user_id;

                    if (!isCurrentUser && !teamMembers.has(member.user?.user_id)) {
                        const teamMember = {
                            id: member.user?.user_id,
                            name: member.user?.name,
                            email: member.user?.email,
                            type: 'team',
                            role: 'COLLABORATOR',
                            projectName: collab.project.name,
                            source: 'Collaboration'
                        };
                        teamMembers.set(member.user?.user_id, teamMember);
                        console.log(`🔍 Added collaboration team member:`, teamMember);
                    }
                });
            }
        });

        // Process Services
        userServices.forEach((service, serviceIndex) => {
            console.log(`🔍 Processing service ${serviceIndex}:`, {
                projectName: service.project?.name,
                hasMembers: !!service.project?.Members,
                membersLength: service.project?.Members?.length || 0
            });

            if (service.project?.Members && Array.isArray(service.project.Members)) {
                service.project.Members.forEach((member, memberIndex) => {
                    const isCurrentUser = member.user?.user_id === user?.user_id;

                    if (!isCurrentUser && !teamMembers.has(member.user?.user_id)) {
                        const teamMember = {
                            id: member.user?.user_id,
                            name: member.user?.name,
                            email: member.user?.email,
                            type: 'team',
                            role: 'SERVICE_PROVIDER',
                            projectName: service.project.name,
                            source: 'Services'
                        };
                        teamMembers.set(member.user?.user_id, teamMember);
                        console.log(`🔍 Added service team member:`, teamMember);
                    }
                });
            }
        });

        const result = Array.from(teamMembers.values());
        console.log('🔍 getAllTeamMembers final result:', result);
        return result;
    }, [user]);

    // Get all clients from projects
    const getAllClients = useCallback(() => {
        // Use user's projects data instead of separate projects state
        const userProjects = user?.Projects || [];
        const userCollaboration = user?.Collaboration || [];
        const userServices = user?.Services || [];

        if (!userProjects.length && !userCollaboration.length && !userServices.length) {
            console.log('🔍 getAllClients: No user projects, collaboration, or services available');
            return [];
        }

        console.log('🔍 getAllClients: User projects:', userProjects);
        console.log('🔍 getAllClients: User collaboration:', userCollaboration);
        console.log('🔍 getAllClients: User services:', userServices);

        const clients = new Map();

        // Process Projects
        userProjects.forEach((project, projectIndex) => {
            console.log(`🔍 Processing project ${projectIndex}: ${project.name}`, {
                projectId: project.project_id,
                hasClients: !!project.Clients,
                clientsType: typeof project.Clients,
                isArray: Array.isArray(project.Clients),
                clientsLength: project.Clients?.length || 0,
                clientsData: project.Clients
            });

            if (project.Clients && Array.isArray(project.Clients)) {
                project.Clients.forEach((client, clientIndex) => {
                    console.log(`🔍 Processing project client ${clientIndex}:`, {
                        client,
                        hasUser: !!client.user,
                        userId: client.user?.user_id,
                        userName: client.user?.name,
                        userEmail: client.user?.email
                    });

                    const isCurrentUser = client.user?.user_id === user?.user_id;

                    if (!isCurrentUser && !clients.has(client.user?.user_id)) {
                        const clientData = {
                            id: client.user?.user_id,
                            name: client.user?.name,
                            email: client.user?.email,
                            type: 'client',
                            role: 'CLIENT',
                            projectName: project.name,
                            source: 'Projects'
                        };
                        clients.set(client.user?.user_id, clientData);
                        console.log(`🔍 Added project client:`, clientData);
                    }
                });
            }
        });

        // Process Collaboration
        userCollaboration.forEach((collab, collabIndex) => {
            console.log(`🔍 Processing collaboration ${collabIndex}:`, {
                projectName: collab.project?.name,
                hasClients: !!collab.project?.Clients,
                clientsLength: collab.project?.Clients?.length || 0
            });

            if (collab.project?.Clients && Array.isArray(collab.project.Clients)) {
                collab.project.Clients.forEach((client, clientIndex) => {
                    const isCurrentUser = client.user?.user_id === user?.user_id;

                    if (!isCurrentUser && !clients.has(client.user?.user_id)) {
                        const clientData = {
                            id: client.user?.user_id,
                            name: client.user?.name,
                            email: client.user?.email,
                            type: 'client',
                            role: 'CLIENT',
                            projectName: collab.project.name,
                            source: 'Collaboration'
                        };
                        clients.set(client.user?.user_id, clientData);
                        console.log(`🔍 Added collaboration client:`, clientData);
                    }
                });
            }
        });

        // Process Services
        userServices.forEach((service, serviceIndex) => {
            console.log(`🔍 Processing service ${serviceIndex}:`, {
                projectName: service.project?.name,
                hasClients: !!service.project?.Clients,
                clientsLength: service.project?.Clients?.length || 0
            });

            if (service.project?.Clients && Array.isArray(service.project.Clients)) {
                service.project.Clients.forEach((client, clientIndex) => {
                    const isCurrentUser = client.user?.user_id === user?.user_id;

                    if (!isCurrentUser && !clients.has(client.user?.user_id)) {
                        const clientData = {
                            id: client.user?.user_id,
                            name: client.user?.name,
                            email: client.user?.email,
                            type: 'client',
                            role: 'CLIENT',
                            projectName: service.project.name,
                            source: 'Services'
                        };
                        clients.set(client.user?.user_id, clientData);
                        console.log(`🔍 Added service client:`, clientData);
                    }
                });
            }
        });

        const result = Array.from(clients.values());
        console.log('🔍 getAllClients final result:', result);
        return result;
    }, [user]);

    // Get all providers from projects
    const getAllProviders = useCallback(() => {
        // Use user's projects data instead of separate projects state
        const userProjects = user?.Projects || [];
        const userCollaboration = user?.Collaboration || [];
        const userServices = user?.Services || [];

        if (!userProjects.length && !userCollaboration.length && !userServices.length) {
            console.log('🔍 getAllProviders: No user projects, collaboration, or services available');
            return [];
        }

        console.log('🔍 getAllProviders: User projects:', userProjects);
        console.log('🔍 getAllProviders: User collaboration:', userCollaboration);
        console.log('🔍 getAllProviders: User services:', userServices);

        const providers = new Map();

        // Process Projects
        userProjects.forEach((project, projectIndex) => {
            console.log(`🔍 Processing project ${projectIndex}: ${project.name}`, {
                projectId: project.project_id,
                hasMembers: !!project.Members,
                membersLength: project.Members?.length || 0
            });

            if (project.Members && Array.isArray(project.Members)) {
                project.Members.forEach((member, memberIndex) => {
                    console.log(`🔍 Processing project member ${memberIndex}:`, {
                        member,
                        hasUser: !!member.user,
                        userId: member.user?.user_id,
                        userName: member.user?.name,
                        userEmail: member.user?.email
                    });

                    const isProvider = member.role === 'PROVIDER';
                    const isCurrentUser = member.user?.user_id === user?.user_id;

                    if (isProvider && !isCurrentUser && !providers.has(member.user?.user_id)) {
                        const provider = {
                            id: member.user?.user_id,
                            name: member.user?.name,
                            email: member.user?.email,
                            type: 'provider',
                            role: member.role,
                            projectName: project.name,
                            source: 'Projects'
                        };
                        providers.set(member.user?.user_id, provider);
                        console.log(`🔍 Added project provider:`, provider);
                    }
                });
            }
        });

        // Process Collaboration
        userCollaboration.forEach((collab, collabIndex) => {
            console.log(`🔍 Processing collaboration ${collabIndex}:`, {
                projectName: collab.project?.name,
                hasMembers: !!collab.project?.Members,
                membersLength: collab.project?.Members?.length || 0
            });

            if (collab.project?.Members && Array.isArray(collab.project.Members)) {
                collab.project.Members.forEach((member, memberIndex) => {
                    const isProvider = member.role === 'PROVIDER';
                    const isCurrentUser = member.user?.user_id === user?.user_id;

                    if (isProvider && !isCurrentUser && !providers.has(member.user?.user_id)) {
                        const provider = {
                            id: member.user?.user_id,
                            name: member.user?.name,
                            email: member.user?.email,
                            type: 'provider',
                            role: member.role,
                            projectName: collab.project.name,
                            source: 'Collaboration'
                        };
                        providers.set(member.user?.user_id, provider);
                        console.log(`🔍 Added collaboration provider:`, provider);
                    }
                });
            }
        });

        // Process Services
        userServices.forEach((service, serviceIndex) => {
            console.log(`🔍 Processing service ${serviceIndex}:`, {
                projectName: service.project?.name,
                hasMembers: !!service.project?.Members,
                membersLength: service.project?.Members?.length || 0
            });

            if (service.project?.Members && Array.isArray(service.project.Members)) {
                service.project.Members.forEach((member, memberIndex) => {
                    const isProvider = member.role === 'PROVIDER';
                    const isCurrentUser = member.user?.user_id === user?.user_id;

                    if (isProvider && !isCurrentUser && !providers.has(member.user?.user_id)) {
                        const provider = {
                            id: member.user?.user_id,
                            name: member.user?.name,
                            email: member.user?.email,
                            type: 'provider',
                            role: member.role,
                            projectName: service.project.name,
                            source: 'Services'
                        };
                        providers.set(member.user?.user_id, provider);
                        console.log(`🔍 Added service provider:`, provider);
                    }
                });
            }
        });

        const result = Array.from(providers.values());
        console.log('🔍 getAllProviders final result:', result);
        return result;
    }, [user]);

    // Get all tasks from projects
    const getAllTasks = useCallback(() => {
        // Use user's projects data instead of separate projects state
        const userProjects = user?.Projects || [];
        const userCollaboration = user?.Collaboration || [];
        const userServices = user?.Services || [];

        if (!userProjects.length && !userCollaboration.length && !userServices.length) {
            console.log('🔍 getAllTasks: No user projects, collaboration, or services available');
            return [];
        }

        console.log('🔍 getAllTasks: User projects:', userProjects);
        console.log('🔍 getAllTasks: User collaboration:', userCollaboration);
        console.log('🔍 getAllTasks: User services:', userServices);

        const tasks = [];

        // Process Projects
        userProjects.forEach((project, projectIndex) => {
            console.log(`🔍 Processing project ${projectIndex}: ${project.name}`, {
                projectId: project.project_id,
                hasTasks: !!project.Tasks,
                tasksLength: project.Tasks?.length || 0
            });

            if (project.Tasks && Array.isArray(project.Tasks)) {
                project.Tasks.forEach((task, taskIndex) => {
                    console.log(`🔍 Processing project task ${taskIndex}:`, {
                        task,
                        taskId: task.task_id,
                        taskName: task.name
                    });

                    tasks.push({
                        id: task.task_id,
                        name: task.name,
                        projectName: project.name,
                        projectId: project.project_id,
                        source: 'Projects'
                    });
                });
            }
        });

        // Process Collaboration
        userCollaboration.forEach((collab, collabIndex) => {
            console.log(`🔍 Processing collaboration ${collabIndex}:`, {
                projectName: collab.project?.name,
                hasTasks: !!collab.project?.Tasks,
                tasksLength: collab.project?.Tasks?.length || 0
            });

            if (collab.project?.Tasks && Array.isArray(collab.project.Tasks)) {
                collab.project.Tasks.forEach((task, taskIndex) => {
                    tasks.push({
                        id: task.task_id,
                        name: task.name,
                        projectName: collab.project.name,
                        projectId: collab.project.project_id,
                        source: 'Collaboration'
                    });
                });
            }
        });

        // Process Services
        userServices.forEach((service, serviceIndex) => {
            console.log(`🔍 Processing service ${serviceIndex}:`, {
                projectName: service.project?.name,
                hasTasks: !!service.project?.Tasks,
                tasksLength: service.project?.Tasks?.length || 0
            });

            if (service.project?.Tasks && Array.isArray(service.project.Tasks)) {
                service.project.Tasks.forEach((task, taskIndex) => {
                    tasks.push({
                        id: task.task_id,
                        name: task.name,
                        projectName: service.project.name,
                        projectId: service.project.project_id,
                        source: 'Services'
                    });
                });
            }
        });

        const result = tasks;
        console.log('🔍 getAllTasks final result:', result);
        return result;
    }, [user]);

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    // Handle file selection for private chat
    const handleChatFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }
            setChatSelectedFile(file);
        }
    };

    // Handle send mail
    const handleSendMail = useCallback(async (e) => {
        e.preventDefault();
        setSendMailLoading(true);

        try {
            const { recipientType, recipientId, subject, content, taskId } = sendMailForm;

            if (!recipientType || !recipientId || !subject || !content) {
                toast.error('Please fill in all required fields');
                return;
            }

            let formData = new FormData();

            // Add text fields
            formData.append('subject', subject);
            formData.append('content', content);

            // Only add task_id if a real task is selected (not "no-task" or empty)
            if (taskId && taskId !== 'no-task' && taskId.trim() !== '' && taskId !== 'undefined' && taskId !== 'null') {
                formData.append('task_id', taskId);
            }

            // Add file if selected
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            if (recipientType === 'client') {
                formData.append('client_id', recipientId);
                await sendEmailToClientRequest(formData);
            } else if (recipientType === 'provider') {
                formData.append('to_user', recipientId);
                await sendTaskEmailRequest(formData);
            } else {
                formData.append('to_user', recipientId);
                await sendTaskEmailRequest(formData);
            }

            toast.success('Email sent successfully');
            closeSendMailModal();
            fetchMails(); // Refresh mails
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setSendMailLoading(false);
        }
    }, [sendMailForm, selectedFile]);



    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 ">
                <div className="flex flex-wrap gap-4 items-center justify-center mx-auto">
                    {quickActions.map((action, index) => {
                        const Icon = action.icon;

                        return (
                            <div key={index} className="relative">
                                <button
                                    onClick={() => handleActionClick(action)}
                                    className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                                >
                                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200`}>
                                        <Icon className="w-6 h-6 text-gray-500" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 text-center">{action.name}</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modals */}
            <CaseModal isOpen={isCaseModalOpen} onClose={closeCasesModal} />
            <ChatModal isOpen={isChatModalOpen} onClose={closeChatModal} />
            <MailModal isOpen={isMailModalOpen} onClose={closeMailModal} />
            <MeetingModal isOpen={isMeetingModalOpen} onClose={closeMeetingModal} />
            <TemplateModal isOpen={isTemplateModalOpen} onClose={closeTemplateModal} />
            <TimelineModal isOpen={isTimelineModalOpen} onClose={closeTimelineModal} />

            <BillerModal isOpen={isBillerModalOpen} onClose={closeBillerModal} />

            {/* Timeline Cases Modal */}
            {isTimelineCasesModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={closeTimelineCasesModal} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-6 h-6 text-gray-600" />
                                        <h2 className="text-xl font-semibold text-gray-800">Select Case for Timeline</h2>
                                    </div>
                                    <button
                                        onClick={closeTimelineCasesModal}
                                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[85vh] overflow-y-auto p-6">
                                {/* Search Bar */}
                                <div className="mb-6">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search cases..."
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Projects List */}
                                {projectsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredProjects?.map((project) => (
                                            <button
                                                key={project.project_id}
                                                onClick={() => openLawFirmTimelineModal(project)}
                                                className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                                                        {project.name}
                                                    </h3>
                                                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${project.status === 'Active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-700'
                                                        }`}>

                                                        {project.status || 'Unknown'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    Client: {project.client_name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {project.description ?
                                                        (project.description.length > 100
                                                            ? `${project.description.substring(0, 100)}...`
                                                            : project.description
                                                        ) : 'No description available'
                                                    }
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!projectsLoading && filteredProjects?.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">No cases found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Law Firm Timeline Modal */}
            {isLawFirmTimelineModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={closeLawFirmTimelineModal} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-6 h-6 text-gray-600" />
                                        <h2 className="text-xl font-semibold text-gray-800">
                                            Case Details: {selectedProjectForTimeline?.name}
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => fetchTimelineData(selectedProjectForTimeline.project_id)}
                                            disabled={timelineLoading}
                                            variant="outline"
                                            size="sm"
                                            className="border-gray-300 hover:bg-gray-50"
                                        >
                                            {timelineLoading ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            )}
                                            Refresh
                                        </Button>
                                        <button
                                            onClick={closeLawFirmTimelineModal}
                                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="max-h-[85vh] overflow-y-auto p-6">
                                {/* Case Overview */}
                                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <h3 className="font-semibold text-gray-800 mb-2">Case Information</h3>
                                            <div className="space-y-2 text-sm">
                                                <p><span className="font-medium">Name:</span> {selectedProjectForTimeline?.name}</p>
                                                <p><span className="font-medium">Status:</span> 
                                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                                        selectedProjectForTimeline?.status === 'Active' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {selectedProjectForTimeline?.status || 'Unknown'}
                                                    </span>
                                                </p>
                                                <p><span className="font-medium">Client:</span> {selectedProjectForTimeline?.client_name || 'N/A'}</p>
                                                <p><span className="font-medium">Description:</span> {selectedProjectForTimeline?.description || 'No description available'}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <h3 className="font-semibold text-gray-800 mb-2">Team Members</h3>
                                            <div className="space-y-2">
                                                {selectedProjectForTimeline?.Members && selectedProjectForTimeline.Members.length > 0 ? (
                                                    selectedProjectForTimeline.Members.map((member, index) => (
                                                        <div key={index} className="flex items-center gap-2 text-sm">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                            <span>{member.user?.name || 'Unknown'}</span>
                                                            <span className="text-gray-500">({member.role})</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-500 text-sm">No team members assigned</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <h3 className="font-semibold text-gray-800 mb-2">Quick Stats</h3>
                                            <div className="space-y-2 text-sm">
                                                <p><span className="font-medium">Tasks:</span> {selectedProjectForTimeline?.Tasks?.length || 0}</p>
                                                <p><span className="font-medium">Documents:</span> {selectedProjectForTimeline?.Media?.length || 0}</p>
                                                <p><span className="font-medium">Time Entries:</span> {selectedProjectForTimeline?.Time?.length || 0}</p>
                                                <p><span className="font-medium">Comments:</span> {selectedProjectForTimeline?.Comments?.length || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs for different sections */}
                                <Tabs defaultValue="timeline" className="w-full">
                                    <TabsList className="grid w-full grid-cols-5">
                                        <TabsTrigger value="timeline" className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Timeline
                                        </TabsTrigger>
                                        <TabsTrigger value="tasks" className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Tasks
                                        </TabsTrigger>
                                        <TabsTrigger value="documents" className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Documents
                                        </TabsTrigger>
                                        <TabsTrigger value="meetings" className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Time Entries
                                        </TabsTrigger>
                                        <TabsTrigger value="reviews" className="flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4" />
                                            Comments
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="timeline" className="mt-6">
                                        {timelineLoading ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                    <p className="text-gray-500">Loading timeline data...</p>
                                                </div>
                                            </div>
                                        ) : timelineData && (timelineData.progress.length > 0 || timelineData.times.length > 0 || timelineData.documents.length > 0) ? (
                                            <LawFirmTimeline
                                                selectedProjectForTimeline={selectedProjectForTimeline}
                                                onClose={closeLawFirmTimelineModal}
                                                timelineData={timelineData}
                                                timelineLoading={timelineLoading}
                                            />
                                        ) : (
                                            <div className="text-center py-12">
                                                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-600 mb-2">No Timeline Data Available</h3>
                                                <p className="text-gray-500">
                                                    No timeline data found for this project in the selected date range.
                                                </p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="tasks" className="mt-6">
                                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Tasks</h3>
                                            {selectedProjectForTimeline?.Tasks && selectedProjectForTimeline.Tasks.length > 0 ? (
                                                <div className="space-y-4">
                                                    {selectedProjectForTimeline.Tasks.map((task, index) => (
                                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-gray-800">{task.name}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {task.status || 'pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{task.description || 'No description'}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                                                <span>Priority: {task.priority || 'Medium'}</span>
                                            </div>
                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-gray-500">No tasks found for this project</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="documents" className="mt-6">
                                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Documents</h3>
                                            {selectedProjectForTimeline?.Media && selectedProjectForTimeline.Media.length > 0 ? (
                                                <div className="space-y-4">
                                                    {selectedProjectForTimeline.Media.map((doc, index) => (
                                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-gray-800">{doc.filename || 'Unnamed Document'}</h4>
                                                <span className="text-xs text-gray-500">
                                                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown date'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs text-gray-500">{doc.mimeType || 'Unknown type'}</span>
                                                <span className="text-xs text-gray-500">
                                                    {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                                </span>
                                                {doc.file_url && (
                                                    <div className="flex gap-2 ml-auto">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => downloadFile(doc.file_url, doc.filename)}
                                                            className="h-6 px-2 text-xs"
                                                        >
                                                            Download
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-gray-500">No documents found for this project</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="meetings" className="mt-6">
                                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Time Entries</h3>
                                            {selectedProjectForTimeline?.Time && selectedProjectForTimeline.Time.length > 0 ? (
                                                <div className="space-y-4">
                                                    {selectedProjectForTimeline.Time.map((timeEntry, index) => (
                                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-gray-800">{timeEntry.task?.name || 'General Time Entry'}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    timeEntry.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                                                    timeEntry.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {timeEntry.status || 'unknown'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">Time entry by {timeEntry.user?.name || 'Unknown user'}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>Start: {timeEntry.start ? new Date(timeEntry.start).toLocaleString() : 'No start time'}</span>
                                                <span>End: {timeEntry.end ? new Date(timeEntry.end).toLocaleString() : 'Ongoing'}</span>
                                            </div>
                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-gray-500">No time entries found for this project</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="reviews" className="mt-6">
                                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Comments</h3>
                                            {selectedProjectForTimeline?.Comments && selectedProjectForTimeline.Comments.length > 0 ? (
                                                <div className="space-y-4">
                                                    {selectedProjectForTimeline.Comments.map((comment, index) => (
                                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-gray-800">Comment by {comment.user?.name || 'Unknown user'}</h4>
                                                <span className="text-xs text-gray-500">
                                                    {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{comment.content || 'No content'}</p>
                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-gray-500">No comments found for this project</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Mail Modal */}
            {isEnhancedMailModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={closeEnhancedMailModal} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-6 h-6 text-gray-600" />
                                        <h2 className="text-xl font-semibold text-gray-800">Mail Center</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={openSendMailModal}
                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            New Mail
                                        </Button>



                                        <button
                                            onClick={closeEnhancedMailModal}
                                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="max-h-[85vh] overflow-y-auto p-6">
                                {selectedMail ? (
                                    // Mail Detail View
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setSelectedMail(null)}
                                                className="flex items-center gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                                Back to Inbox
                                            </Button>
                                        </div>

                                        <div className="bg-gray-50 p-6 rounded-lg">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Avatar>
                                                    <AvatarFallback>{selectedMail.from?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-semibold">{selectedMail.from}</h3>
                                                    <p className="text-sm text-gray-600">{selectedMail.to}</p>
                                                </div>
                                                <div className="ml-auto text-sm text-gray-500">
                                                    {moment(selectedMail.date).format('MMM DD, YYYY HH:mm')}
                                                </div>
                                            </div>

                                            <h2 className="text-xl font-semibold mb-4">{selectedMail.subject}</h2>
                                            <div className="prose max-w-none">
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: DOMPurify.sanitize(formatEmailBody(selectedMail.body, selectedMail.subject), {
                                                            ADD_ATTR: ['target'],
                                                            ALLOWED_TAGS: ['div', 'p', 'h1', 'h2', 'h3', 'strong', 'a', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'br'],
                                                            ALLOWED_ATTR: ['class', 'href', 'target']
                                                        })
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Mail List View
                                    <div className="space-y-6">
                                        <Tabs defaultValue="all" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="all" className="flex items-center gap-2">
                                                    <Inbox className="w-4 h-4" />
                                                    All ({mails.length})
                                                </TabsTrigger>
                                                <TabsTrigger value="inbox" className="flex items-center gap-2">
                                                    <Inbox className="w-4 h-4" />
                                                    Inbox ({mails.filter(mail => mail.to?.includes('mananrajpout258@gmail.com')).length})
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="all" className="mt-6">
                                                {mailLoading ? (
                                                    <div className="flex items-center justify-center py-12">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                    </div>
                                                ) : mails.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {mails.map((mail) => (
                                                            <div
                                                                key={mail.id}
                                                                onClick={() => setSelectedMail(mail)}
                                                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <h4 className="text-lg font-medium">{mail.from}</h4>
                                                                    <time className="text-gray-400 text-sm">
                                                                        {moment(mail.date).format("DD MMM YYYY")}
                                                                    </time>
                                                                </div>
                                                                <h3 className="text-md text-gray-700 mt-2">{mail.subject}</h3>
                                                                <p className="text-sm text-gray-800 break-words mt-2">
                                                                    {mail.body?.slice(0, 150)}...
                                                                </p>
                                                            </div>
                                                        ))}

                                                        {/* Load More Button */}
                                                        <div className="mt-6 flex justify-center">
                                                            <Button
                                                                onClick={loadMoreMails}
                                                                disabled={mailLoading}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                                                            >
                                                                {mailLoading ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                        Loading More...
                                                                    </div>
                                                                ) : (
                                                                    `Load More Emails (Currently showing ${mails.length} filtered emails)`
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12">
                                                        <div className="text-gray-500 mb-4">
                                                            No emails found
                                                        </div>
                                                        <div className="text-sm text-gray-400 mb-6">
                                                            Connect your Gmail account to view emails
                                                        </div>
                                                        <Button
                                                            onClick={openConnectMailModal}
                                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                                        >
                                                            <Mail className="w-4 h-4 mr-2" />
                                                            Connect Gmail
                                                        </Button>
                                                    </div>
                                                )}
                                            </TabsContent>

                                            <TabsContent value="inbox" className="mt-6">
                                                {mailLoading ? (
                                                    <div className="flex items-center justify-center py-12">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                    </div>
                                                ) : mails.filter(mail => mail.to?.includes('mananrajpout258@gmail.com')).length > 0 ? (
                                                    <div className="space-y-4">
                                                        {mails.filter(mail => mail.to?.includes('mananrajpout258@gmail.com')).map((mail) => (
                                                            <div
                                                                key={mail.id}
                                                                onClick={() => setSelectedMail(mail)}
                                                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <h4 className="text-lg font-medium">{mail.from}</h4>
                                                                    <time className="text-gray-400 text-sm">
                                                                        {moment(mail.date).format("DD MMM YYYY")}
                                                                    </time>
                                                                </div>
                                                                <h3 className="text-md text-gray-700 mt-2">{mail.subject}</h3>
                                                                <p className="text-sm text-gray-800 break-words mt-2">
                                                                    {mail.body?.slice(0, 150)}...
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12">
                                                        <div className="text-gray-500 mb-4">
                                                            No incoming emails
                                                        </div>
                                                        <div className="text-sm text-gray-400 mb-6">
                                                            Connect your Gmail account to view incoming emails
                                                        </div>
                                                        <Button
                                                            onClick={openConnectMailModal}
                                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                                        >
                                                            <Mail className="w-4 h-4 mr-2" />
                                                            Connect Gmail
                                                        </Button>
                                                    </div>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Chat Modal with Sidebar */}
            {isEnhancedChatModalOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="fixed inset-0 bg-black bg-opacity-20 transition-opacity" onClick={closeEnhancedChatModal} />
                    <div className="flex min-h-full relative z-10" onClick={(e) => e.stopPropagation()}>
                        {/* Sidebar */}
                        <div className="w-80 bg-white shadow-xl border-r border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MessageCircle className="w-6 h-6 text-gray-600" />
                                        <h2 className="text-xl font-semibold text-gray-800">Chat Options</h2>
                                    </div>
                                    <button
                                        onClick={closeEnhancedChatModal}
                                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">


                                {/* Chat Type Selection */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-700">Select Chat Type</h3>
                                    <div className="space-y-2">
                                        {/* Show team option only for non-clients */}
                                        {user?.Role !== 'CLIENT' && (
                                            <button
                                                onClick={() => setSelectedChatType('team')}
                                                className={`w-full p-3 rounded-lg border-2 transition-all ${selectedChatType === 'team'
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Users className="w-5 h-5" />
                                                    <div className="text-left">
                                                        <div className="font-medium">Team Members</div>
                                                        <div className="text-sm text-gray-500">Chat with your team</div>
                                                    </div>
                                                </div>
                                            </button>
                                        )}

                                        {/* Show client option only for non-clients */}
                                        {user?.Role !== 'CLIENT' && (
                                            <button
                                                onClick={() => setSelectedChatType('client')}
                                                className={`w-full p-3 rounded-lg border-2 transition-all ${selectedChatType === 'client'
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Building className="w-5 h-5" />
                                                    <div className="text-left">
                                                        <div className="font-medium">Clients</div>
                                                        <div className="text-sm text-gray-500">Chat with clients</div>
                                                    </div>
                                                </div>
                                            </button>
                                        )}

                                        {/* Show provider option only for clients */}
                                        {user?.Role === 'CLIENT' && (
                                            <button
                                                onClick={() => setSelectedChatType('provider')}
                                                className={`w-full p-3 rounded-lg border-2 transition-all ${selectedChatType === 'provider'
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <User className="w-5 h-5" />
                                                    <div className="text-left">
                                                        <div className="font-medium">Providers</div>
                                                        <div className="text-sm text-gray-500">Chat with your providers</div>
                                                    </div>
                                                </div>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setSelectedChatType('whatsapp')}
                                            className={`w-full p-3 rounded-lg border-2 transition-all ${selectedChatType === 'whatsapp'
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <MessageCircle className="w-5 h-5" />
                                                <div className="text-left">
                                                    <div className="font-medium">WhatsApp</div>
                                                    <div className="text-sm text-gray-500">Connect to WhatsApp</div>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Recipient Selection */}
                                {selectedChatType === 'team' && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-gray-700">Select Team Member</h3>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {getAllTeamMembers().map((member) => (
                                                <button
                                                    key={member.id}
                                                    onClick={() => setSelectedChatRecipient(member)}
                                                    className={`w-full p-3 rounded-lg border-2 transition-all ${selectedChatRecipient?.id === member.id
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="text-left">
                                                            <div className="font-medium">{member.name}</div>
                                                            <div className="text-sm text-gray-500">{member.projectName}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}



                                {selectedChatType === 'client' && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-gray-700">Select Client</h3>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {getAllClients().map((client) => (
                                                <button
                                                    key={client.id}
                                                    onClick={() => setSelectedChatRecipient(client)}
                                                    className={`w-full p-3 rounded-lg border-2 transition-all ${selectedChatRecipient?.id === client.id
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="text-left">
                                                            <div className="font-medium">{client.name}</div>
                                                            <div className="text-sm text-gray-500">{client.projectName}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedChatType === 'provider' && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-gray-700">Select Provider</h3>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {getAllProviders().map((provider) => (
                                                <button
                                                    key={provider.id}
                                                    onClick={() => setSelectedChatRecipient(provider)}
                                                    className={`w-full p-3 rounded-lg border-2 transition-all ${selectedChatRecipient?.id === provider.id
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="text-left">
                                                            <div className="font-medium">{provider.name}</div>
                                                            <div className="text-sm text-gray-500">{provider.projectName}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}


                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 bg-gray-50 overflow-hidden">
                            <div className="h-screen flex flex-col">
                                {/* Header */}


                                {/* Content */}
                                <div className="flex flex-col h-full max-h-full">

                                    {!selectedChatType && (
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="text-center">
                                                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-600 mb-2">Select a chat type</h3>
                                                <p className="text-gray-500">Choose from the options in the sidebar to get started</p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedChatType === 'whatsapp' && (
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="text-center max-w-md">
                                                <MessageCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-800 mb-2">Connect to WhatsApp</h3>
                                                <p className="text-gray-600 mb-6">
                                                    Open WhatsApp Web to connect with clients and team members through WhatsApp.
                                                </p>
                                                <Button
                                                    onClick={() => {
                                                        connectWhatsapp();
                                                        closeEnhancedChatModal();
                                                    }}
                                                    className="bg-green-600 text-white hover:bg-green-700"
                                                >
                                                    <MessageCircle className="w-4 h-4 mr-2" />
                                                    Open WhatsApp Web
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {(selectedChatType === 'team' || selectedChatType === 'client' || selectedChatType === 'provider') && !selectedChatRecipient && (
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="text-center">
                                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-600 mb-2">
                                                    Select a {selectedChatType === 'team' ? 'team member' : selectedChatType === 'client' ? 'client' : 'provider'}
                                                </h3>
                                                <p className="text-gray-500">
                                                    Choose from the list in the sidebar to start chatting
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Chat Interface */}
                                    {(selectedChatType === 'team' || selectedChatType === 'client' || selectedChatType === 'provider') && selectedChatRecipient && (
                                        <div className="flex-1 flex flex-col h-full">
                                            {/* Chat Header */}
                                            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarFallback>{selectedChatRecipient.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{selectedChatRecipient.name}</h4>
                                                        <p className="text-sm text-gray-500">{selectedChatRecipient.projectName}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Messages Area - Scrollable in center */}
                                            <div className="flex-1 overflow-y-auto p-4 min-h-0" ref={chatContainerRef}>
                                                {chatLoading && (
                                                    <div className="flex items-center justify-center h-full">
                                                        <div className="text-center">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                            <p className="text-gray-500">Loading conversation...</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {!chatLoading && chatMessages.length === 0 && (
                                                    <div className="flex items-center justify-center h-full">
                                                        <div className="text-center">
                                                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                            <p className="text-gray-500">No messages yet. Start the conversation!</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {!chatLoading && chatMessages.length > 0 && (
                                                    <div className="space-y-3">
                                                        {chatMessages.map((message, index) => (
                                                            <div key={index} className={`flex ${message.sender_id === user?.user_id ? 'justify-end' : 'justify-start'}`}>
                                                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender_id === user?.user_id
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-gray-200 text-gray-900'
                                                                    }`}>
                                                                    <p className="text-sm">{message.content}</p>

                                                                    {/* Attachment Display */}
                                                                    {message.attachment_url && (
                                                                        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                                                                                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                                                    </svg>
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-xs font-medium text-blue-900 truncate">{message.attachment_name}</p>
                                                                                    <p className="text-xs text-blue-700">
                                                                                        {message.attachment_size ?
                                                                                            `${(message.attachment_size / 1024 / 1024).toFixed(2)} MB` :
                                                                                            'Unknown size'
                                                                                        }
                                                                                    </p>
                                                                                </div>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => window.open(message.attachment_url, '_blank')}
                                                                                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                                                                                >
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                                    </svg>
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <p className={`text-xs mt-1 ${message.sender_id === user?.user_id
                                                                        ? 'text-blue-100'
                                                                        : 'text-gray-500'
                                                                        }`}>
                                                                        {formatTime(message.createdAt || message.created_at)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Message Input - Fixed at bottom */}
                                            <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
                                                {/* File Attachment Preview */}
                                                {chatSelectedFile && (
                                                    <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                                </svg>
                                                                <span className="text-sm font-medium text-blue-900">{chatSelectedFile.name}</span>
                                                                <span className="text-xs text-blue-700">
                                                                    ({(chatSelectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setChatSelectedFile(null)}
                                                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        className="flex-1"
                                                        placeholder="Type a message..."
                                                        value={chatMessageValue}
                                                        onChange={(e) => setChatMessageValue(e.target.value)}
                                                        onKeyPress={handleChatKeyPress}
                                                        disabled={chatSending}
                                                    />

                                                    {/* File Upload Button */}
                                                    <input
                                                        id="chat-file-upload"
                                                        type="file"
                                                        onChange={handleChatFileSelect}
                                                        accept="*/*"
                                                        className="hidden"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="px-3"
                                                        disabled={chatSending}
                                                        onClick={() => document.getElementById('chat-file-upload').click()}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                        </svg>
                                                    </Button>

                                                    <Button
                                                        onClick={handleChatSend}
                                                        disabled={chatSending || !chatMessageValue.trim()}
                                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                                    >
                                                        {chatSending ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        ) : (
                                                            <Send className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Send Mail Modal */}
            {isSendMailModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={closeSendMailModal} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Send className="w-6 h-6 text-gray-600" />
                                        <h2 className="text-xl font-semibold text-gray-800">Send New Mail</h2>
                                    </div>
                                    <button
                                        onClick={closeSendMailModal}
                                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleSendMail} className="space-y-6">
                                    {/* Recipient Type */}
                                    <div className="space-y-2">
                                        <Label htmlFor="recipientType">Recipient Type</Label>
                                        <Select
                                            value={sendMailForm.recipientType}
                                            onValueChange={(value) => setSendMailForm(prev => ({ ...prev, recipientType: value, recipientId: '' }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select recipient type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {user?.Role !== 'CLIENT' && (
                                                    <>
                                                        <SelectItem value="team">Team Member</SelectItem>
                                                        <SelectItem value="client">Client</SelectItem>
                                                    </>
                                                )}
                                                {user?.Role === 'CLIENT' && (
                                                    <SelectItem value="provider">Provider</SelectItem>
                                                )}
                                                <SelectItem value="new">New Recipient</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Recipient Selection */}
                                    {sendMailForm.recipientType === 'team' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="recipient">Select Team Member</Label>
                                            {sendMailDataLoading ? (
                                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 flex items-center justify-center">
                                                    <div className="text-center py-4">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                        <p className="text-gray-500">Loading team members...</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                                    {getAllTeamMembers().map((member) => (
                                                        <button
                                                            key={member.id}
                                                            type="button"
                                                            onClick={() => setSendMailForm(prev => ({ ...prev, recipientId: member.id.toString() }))}
                                                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${sendMailForm.recipientId === member.id.toString()
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1">
                                                                    <div className="font-medium">{member.name}</div>
                                                                    <div className="text-sm text-gray-500">{member.email}</div>
                                                                    <div className="text-xs text-gray-400">{member.projectName}</div>
                                                                </div>
                                                                {sendMailForm.recipientId === member.id.toString() && (
                                                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {getAllTeamMembers().length === 0 && (
                                                        <div className="text-center py-4 text-gray-500">
                                                            No team members found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {sendMailForm.recipientType === 'client' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="recipient">Select Client</Label>
                                            {sendMailDataLoading ? (
                                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 flex items-center justify-center">
                                                    <div className="text-center py-4">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                        <p className="text-gray-500">Loading clients...</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                                    {getAllClients().map((client) => (
                                                        <button
                                                            key={client.id}
                                                            type="button"
                                                            onClick={() => setSendMailForm(prev => ({ ...prev, recipientId: client.id.toString() }))}
                                                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${sendMailForm.recipientId === client.id.toString()
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1">
                                                                    <div className="font-medium">{client.name}</div>
                                                                    <div className="text-sm text-gray-500">{client.email}</div>
                                                                    <div className="text-xs text-gray-400">{client.projectName}</div>
                                                                </div>
                                                                {sendMailForm.recipientId === client.id.toString() && (
                                                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {getAllClients().length === 0 && (
                                                        <div className="text-center py-4 text-gray-500">
                                                            No clients found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {sendMailForm.recipientType === 'provider' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="recipient">Select Provider</Label>
                                            {sendMailDataLoading ? (
                                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 flex items-center justify-center">
                                                    <div className="text-center py-4">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                        <p className="text-gray-500">Loading providers...</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                                    {getAllProviders().map((provider) => (
                                                        <button
                                                            key={provider.id}
                                                            type="button"
                                                            onClick={() => setSendMailForm(prev => ({ ...prev, recipientId: provider.id.toString() }))}
                                                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${sendMailForm.recipientId === provider.id.toString()
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1">
                                                                    <div className="font-medium">{provider.name}</div>
                                                                    <div className="text-sm text-gray-500">{provider.email}</div>
                                                                    <div className="text-xs text-gray-400">{provider.projectName}</div>
                                                                </div>
                                                                {sendMailForm.recipientId === provider.id.toString() && (
                                                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {getAllProviders().length === 0 && (
                                                        <div className="text-center py-4 text-gray-500">
                                                            No providers found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {sendMailForm.recipientType === 'new' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="recipient">Email Address</Label>
                                            <Input
                                                type="email"
                                                placeholder="Enter email address"
                                                value={sendMailForm.recipientId}
                                                onChange={(e) => setSendMailForm(prev => ({ ...prev, recipientId: e.target.value }))}
                                            />
                                        </div>
                                    )}

                                    {/* Task Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="task">Select Task (Optional)</Label>
                                        <Select
                                            value={sendMailForm.taskId}
                                            onValueChange={(value) => setSendMailForm(prev => ({ ...prev, taskId: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select task (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Tasks</SelectLabel>
                                                    <SelectItem value="no-task">No Task (General Email)</SelectItem>
                                                    {getAllTasks().map((task) => (
                                                        <SelectItem key={task.id} value={task.id.toString()}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{task.name}</span>
                                                                <span className="text-xs text-gray-500">({task.projectName})</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Subject */}
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            type="text"
                                            placeholder="Enter subject"
                                            value={sendMailForm.subject}
                                            onChange={(e) => setSendMailForm(prev => ({ ...prev, subject: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-2">
                                        <Label htmlFor="content">Message</Label>
                                        <Textarea
                                            id="content"
                                            placeholder="Enter your message"
                                            value={sendMailForm.content}
                                            onChange={(e) => setSendMailForm(prev => ({ ...prev, content: e.target.value }))}
                                            rows={6}
                                            required
                                        />
                                    </div>

                                    {/* File Attachment */}
                                    <div className="space-y-2">
                                        <Label htmlFor="attachment">Attachment (Optional)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="attachment"
                                                type="file"
                                                onChange={handleFileSelect}
                                                accept="*/*"
                                                className="flex-1"
                                            />
                                            {selectedFile && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedFile(null)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                        {selectedFile && (
                                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={closeSendMailModal}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={sendMailLoading}
                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            {sendMailLoading ? 'Sending...' : 'Send Mail'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Signature Request Modal */}
            {isSignatureModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={closeSignatureModal} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileSignature className="w-6 h-6 text-gray-600" />
                                        <h2 className="text-xl font-semibold text-gray-800">Request Signature</h2>
                                    </div>
                                    <button
                                        onClick={closeSignatureModal}
                                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[85vh] overflow-y-auto p-6">
                                <div className="space-y-4">
                                    <div className="text-center mb-6">
                                        <p className="text-gray-600">Select a client to request document signatures</p>
                                    </div>

                                    {projectsLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : getAllClients().length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {getAllClients().map((client) => (
                                                <button
                                                    key={client.id}
                                                    onClick={() => {
                                                        router.push(`/dashboard/sign/${client.id}`);
                                                        closeSignatureModal();
                                                    }}
                                                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                                                >

                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-12 h-12">
                                                            <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                                                {client.name}
                                                            </h3>
                                                            <p className="text-sm text-gray-600">{client.email}</p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Project: {client.projectName}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <FileSignature className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                            <span className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
                                                                Request Signature
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <FileSignature className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-600 mb-2">No Clients Found</h3>
                                            <p className="text-gray-500">
                                                No clients are available for signature requests. Make sure you have clients assigned to your projects.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Case Assignment Modal */}
            <CaseAssignmentModal
                isOpen={isCaseAssignmentModalOpen}
                onClose={closeCaseAssignmentModal}
            />

            {/* Connect Mail Modal */}
            <ConnectMailBox
                open={isConnectMailModalOpen}
                onClose={closeConnectMailModal}
                onConnectSuccess={handleConnectMailSuccess}
            />

            {/* Flowchart Modal */}
            <FlowchartModal
                isOpen={isFlowchartModalOpen}
                onClose={closeFlowchartModal}
                projects={projects}
                projectsLoading={projectsLoading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedProjectForTimeline={selectedProjectForTimeline}
                setSelectedProjectForTimeline={setSelectedProjectForTimeline}
            />
        </>
    );
};

export { QuickActions };
