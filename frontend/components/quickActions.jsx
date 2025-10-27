"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useUser } from '../providers/UserProvider';
import { toast } from 'sonner';
import { getOrCreatePrivateConversationRequest } from '@/lib/http/chat';
import useChatHook from '@/hooks/useChatHook';
import { Send, ArrowLeft,  Paperclip } from 'lucide-react';
import moment from 'moment';
import AvatarCompoment from './AvatarCompoment';
import { ON_PRIVATE_MESSAGE, ON_MESSAGE } from '@/contstant/chatEventConstant';

// Import custom hooks
import { useModalState } from '../hooks/useModalState';
import { useMailState } from '../hooks/useMailState';
import { useTimelineState } from '../hooks/useTimelineState';
import { useChatState } from '../hooks/useChatState';
import { useProjectState } from '../hooks/useProjectState';
import { useSendMailState } from '../hooks/useSendMailState';
import { useNotificationState } from '../hooks/useNotificationState';

// Import components
import { QuickActionsContent } from './QuickActionsContent';
import { TimelineCasesModal } from './modals/TimelineCasesModal';
import { LawFirmTimelineModal } from './modals/LawFirmTimelineModal';
import { EnhancedMailModal } from './modals/EnhancedMailModal';
import TimerModal from './modals/TimerModal';
import CaseModal from './modals/caseModal';
import AddTaskModal from './modals/AddTaskModal';
import MeetingModal from './modals/meetingModel';
import BillerModal from './modals/BillerModal';
import CaseAssignmentModal from './modals/CaseAssignmentModal';
import FlowchartModal from './modals/FlowchartModal';

// Import icons
import {
  Calendar,
  Mail,
  MessageCircle,
  Users,
  Clock,
  BarChart3,
  Briefcase,
  CheckCircle,
  Plus,
  FileText,
  GitCompare,
  GitBranch,
  Phone,
  FileSignature,
  DollarSign,
  X,
  Building,
  User,
} from 'lucide-react';

const QuickActions = ({ children, isSidebarMode, setIsSidebarMode }) => {
  const { user, loadUserWithProjects } = useUser();
  
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Use custom hooks
  const modalState = useModalState();
  const mailState = useMailState();
  const timelineState = useTimelineState();
  const chatState = useChatState();
  const projectState = useProjectState(user, loadUserWithProjects || (() => Promise.resolve()));
  const sendMailState = useSendMailState();
  const notificationState = useNotificationState();

  // Filtered projects for timeline modal
  const filteredProjects = useMemo(() => {
    if (!projectState.projects || !searchTerm) return projectState.projects;
    return projectState.projects.filter(project =>
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projectState.projects, searchTerm]);

  // Optimized loading states
  const isAnyModalLoading = useMemo(() => {
    return projectState.projectsLoading || mailState.mailLoading || timelineState.timelineLoading || sendMailState.sendMailDataLoading || projectState.isLoadingUserData;
  }, [projectState.projectsLoading, mailState.mailLoading, timelineState.timelineLoading, sendMailState.sendMailDataLoading, projectState.isLoadingUserData]);

  // Enhanced modal handlers with loading states
  const openFlowchartModal = useCallback(() => {
    modalState.openFlowchartModal();
    projectState.fetchProjects();
  }, [modalState, projectState]);

  const openTimelineCasesModal = useCallback(() => {
    modalState.openTimelineCasesModal();
    projectState.fetchProjects();
  }, [modalState, projectState]);

  const openEnhancedMailModal = useCallback(async () => {
    modalState.openEnhancedMailModal();
    try {
      await mailState.fetchMails();
    } catch (error) {
      console.error('Error loading mail data:', error);
    }
  }, [modalState, mailState]);

  const openLawFirmTimelineModal = useCallback(async (project) => {
    const result = await timelineState.openLawFirmTimelineModal(project);
    if (result.success) {
      modalState.openLawFirmTimelineModal();
    } else {
      toast.error(result.error);
    }
  }, [timelineState, modalState]);

  const openTimerModal = useCallback(() => {
    modalState.openTimerModal();
    projectState.fetchProjects();
  }, [modalState, projectState]);

  // Close handlers with cleanup
  const closeFlowchartModal = useCallback(() => {
    modalState.closeFlowchartModal();
    setSearchTerm('');
    timelineState.setSelectedProjectForTimeline(null);
  }, [modalState, timelineState]);

  const closeTimelineCasesModal = useCallback(() => {
    modalState.closeTimelineCasesModal();
    setSearchTerm('');
    timelineState.setSelectedProjectForTimeline(null);
    timelineState.setTimelineData(null);
  }, [modalState, timelineState]);

  const closeLawFirmTimelineModal = useCallback(() => {
    modalState.closeLawFirmTimelineModal();
    timelineState.closeLawFirmTimelineModal();
  }, [modalState, timelineState]);

  const closeEnhancedMailModal = useCallback(() => {
    modalState.closeEnhancedMailModal();
    mailState.setSelectedMail(null);
  }, [modalState, mailState]);

  // Enhanced chat modal state
  const [isEnhancedChatModalOpen, setIsEnhancedChatModalOpen] = useState(false);
  const [selectedChatType, setSelectedChatType] = useState('');
  const [selectedChatRecipient, setSelectedChatRecipient] = useState(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatConversationId, setChatConversationId] = useState('');
  const [chatMessageValue, setChatMessageValue] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatSelectedFile, setChatSelectedFile] = useState(null);
  const [chatSelectedInternalDoc, setChatSelectedInternalDoc] = useState(null);
  const [showChatInternalDocSelector, setShowChatInternalDocSelector] = useState(false);
  const chatContainerRef = useRef(null);
  
  // Get chat hook functions
  const { handleSendMessage: sendChatMessage, socketRef } = useChatHook();
  
  // Handle file selection for chat
  const handleChatFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setChatSelectedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  }, []);
  
  // Get conversation when recipient is selected
  useEffect(() => {
    if (!selectedChatRecipient || !user) return;
    
    const getConversation = async () => {
      setChatLoading(true);
      try {
        // Use only user_id for private conversations (like the backup version)
        const res = await getOrCreatePrivateConversationRequest({ 
          user_id: selectedChatRecipient.id 
        });
        const conversation = res.data.conversation;
        const conversation_id = conversation.private_conversation_id;
        
        if (conversation_id) {
          setChatConversationId(conversation_id);
          setChatMessages(conversation.messages || []);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast.error('Failed to load conversation');
      } finally {
        setChatLoading(false);
      }
    };
    
    getConversation();
  }, [selectedChatRecipient, user]);
  
  // Handle sending chat messages
  const handleChatSend = useCallback(async () => {
    if ((!chatMessageValue.trim() && !chatSelectedFile && !chatSelectedInternalDoc) || !selectedChatRecipient || !chatConversationId || chatSending) return;
    
    setChatSending(true);
    let tempMessageId;
    try {
      const messageContent = chatMessageValue.trim();
      const fileToUpload = chatSelectedFile;
      const internalDocToUpload = chatSelectedInternalDoc;
      
      const data = {
        private_conversation_id: chatConversationId,
        sender_id: user.user_id,
        receiver_id: selectedChatRecipient.id,
        content: messageContent,
        content_type: "PLAIN_TEXT",
        sender_name: user?.name,
        attachment_url: (fileToUpload || internalDocToUpload) ? 'uploading...' : null,
        attachment_name: fileToUpload?.name || internalDocToUpload?.name,
        attachment_size: fileToUpload?.size || internalDocToUpload?.size,
        attachment_mime_type: fileToUpload?.type || 'application/pdf'
      };
      
      // Add optimistic message with temp ID
      tempMessageId = `temp-${Date.now()}`;
      const tempMessage = {
        ...data,
        temp_message_id: tempMessageId,
        private_message_id: undefined,
        createdAt: new Date().toISOString(),
        creator: {
          user_id: user.user_id,
          name: user?.name,
        }
      };
      
      // Add message to UI immediately
      setChatMessages(prev => [...prev, tempMessage]);
      setChatMessageValue('');
      
      // Clear selected files immediately
      setChatSelectedFile(null);
      setChatSelectedInternalDoc(null);
      
      // Clear the file input
      const fileInput = document.getElementById('chat-file-upload');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Add temp_message_id to data
      data.temp_message_id = tempMessageId;
      
      // Send via socket
      await sendChatMessage(data);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Remove the optimistic message on error
      if (tempMessageId) {
        setChatMessages(prev => prev.filter(msg => msg.temp_message_id !== tempMessageId));
      }
    } finally {
      setChatSending(false);
    }
  }, [chatMessageValue, selectedChatRecipient, chatConversationId, user, sendChatMessage, chatSending, chatSelectedFile, chatSelectedInternalDoc]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatMessages]);
  
  // Use ref to store latest recipient ID
  const selectedChatRecipientIdRef = useRef(null);
  
  useEffect(() => {
    selectedChatRecipientIdRef.current = selectedChatRecipient?.id;
  }, [selectedChatRecipient?.id]);
  
  // Listen for incoming private messages
  useEffect(() => {
    if (!socketRef?.current) {
      console.log('❌ No socket reference, skipping listener setup');
      return;
    }
    
    const socket = socketRef.current;
    console.log('🔌 Setting up private message listener...');
    
    const messageHandler = (data) => {
      const currentRecipientId = selectedChatRecipientIdRef.current;
      console.log('🔍 Received message:', data);
      console.log('🔍 Current recipient ID:', currentRecipientId);
      console.log('🔍 Current user:', user?.user_id);
      
      // Check if this message is for the current chat
      // For private messages: check sender/receiver relationship
      // For project messages: check conversation_id matches current chat
      const isForCurrentChat = currentRecipientId && (
        // Private message check
        ((parseInt(data.sender_id) === currentRecipientId && parseInt(data.receiver_id) === user?.user_id) ||
         (parseInt(data.receiver_id) === currentRecipientId && parseInt(data.sender_id) === user?.user_id)) ||
        // Project message check (if conversation_id matches)
        (data.conversation_id && chatConversationId && data.conversation_id === chatConversationId)
      );
      
      if (isForCurrentChat) {
        console.log('✅ Message matches current chat, processing...');
        
        // Handle sender's own message - update temp message with real ID
        if (parseInt(data.sender_id) === user?.user_id) {
          console.log('🔄 Updating sender\'s own message with real ID:', data.message_id || data.private_message_id);
          
          setChatMessages(prev => {
            return prev.map(msg => {
              // Update temp message with real message ID
              if (msg.temp_message_id && msg.content === data.content && parseInt(msg.sender_id) === parseInt(data.sender_id)) {
                console.log('✅ Updating temp message:', msg.temp_message_id, 'with real ID:', data.message_id || data.private_message_id);
                return {
                  ...msg,
                  // Update the appropriate ID field based on what we received
                  message_id: data.message_id || msg.message_id,
                  private_message_id: data.private_message_id || msg.private_message_id,
                  temp_message_id: undefined, // Remove temp ID
                  createdAt: data.createdAt || data.created_at || msg.createdAt
                };
              }
              return msg;
            });
          });
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
          
          // Check if message already exists to prevent duplicates (works for both private and group chat)
          const messageExists = prev.some(msg => {
            // Check by message_id (for group chat messages)
            if (data.message_id && msg.message_id === data.message_id) {
              console.log('🔍 Duplicate found by message_id:', data.message_id);
              return true;
            }
            
            // Check by private_message_id (for private chat messages)
            if (data.private_message_id && msg.private_message_id === data.private_message_id) {
              console.log('🔍 Duplicate found by private_message_id:', data.private_message_id);
              return true;
            }
            
            // Check by temp_message_id
            if (data.temp_message_id && msg.temp_message_id === data.temp_message_id) {
              console.log('🔍 Duplicate found by temp_message_id:', data.temp_message_id);
              return true;
            }
            
            // Check by content, sender, and time (fallback for both types)
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
            
            // Check for temporary messages with same content (both types)
            if ((msg.message_id?.startsWith('temp-') || msg.private_message_id?.startsWith('temp-')) &&
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
    
    // Also listen for general messages (for project chat)
    socket.on(ON_MESSAGE, messageHandler);
    
    console.log('✅ Socket listeners set up successfully');
    
    return () => {
      console.log('🔌 Cleaning up message listeners...');
      socket.off(ON_PRIVATE_MESSAGE, messageHandler);
      socket.off(ON_MESSAGE, messageHandler);
    };
  }, [socketRef, user?.user_id, chatConversationId]);

  // Get all team members from projects
  const getAllTeamMembers = useCallback(() => {
    // Use user's projects data instead of separate projects state
    const userProjects = user?.Projects || [];
    const userCollaboration = user?.Collaboration || [];
    const userServices = user?.Services || [];

    if (!userProjects.length && !userCollaboration.length && !userServices.length) {
      return [];
    }


    const teamMembers = new Map();

    // Process Projects
    userProjects.forEach((project, projectIndex) => {
     

      if (project.Members && Array.isArray(project.Members)) {
        project.Members.forEach((member, memberIndex) => {
         
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
          }
        });
      }
    });

    // Process Collaboration
    userCollaboration.forEach((collab, collabIndex) => {
     

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
          }
        });
      }
    });

    // Process Services
    userServices.forEach((service, serviceIndex) => {
     

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
          }
        });
      }
    });

    const result = Array.from(teamMembers.values());
    return result;
  }, [user]);

  // Get all clients from projects
  const getAllClients = useCallback(() => {
    // Use user's projects data instead of separate projects state
    const userProjects = user?.Projects || [];
    const userCollaboration = user?.Collaboration || [];
    const userServices = user?.Services || [];

    if (!userProjects.length && !userCollaboration.length && !userServices.length) {
      return [];
    }


    const clients = new Map();

    // Process Projects
    userProjects.forEach((project, projectIndex) => {
   

      if (project.Clients && Array.isArray(project.Clients)) {
        project.Clients.forEach((client, clientIndex) => {
          

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
          }
        });
      }
    });

    // Process Collaboration
    userCollaboration.forEach((collab, collabIndex) => {
    

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
          }
        });
      }
    });

    // Process Services
    userServices.forEach((service, serviceIndex) => {
    

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
          }
        });
      }
    });

    const result = Array.from(clients.values());
    return result;
  }, [user]);

  // Get all providers from projects
  const getAllProviders = useCallback(() => {
    // Use user's projects data instead of separate projects state
    const userProjects = user?.Projects || [];
    const userCollaboration = user?.Collaboration || [];
    const userServices = user?.Services || [];

    if (!userProjects.length && !userCollaboration.length && !userServices.length) {
      return [];
    }

    const providers = new Map();

    // Process Projects
    userProjects.forEach((project, projectIndex) => {
    

      if (project.Members && Array.isArray(project.Members)) {
        project.Members.forEach((member, memberIndex) => {
         
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
          }
        });
      }
    });

    // Process Collaboration
    userCollaboration.forEach((collab, collabIndex) => {
     

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
          }
        });
      }
    });

    // Process Services
    userServices.forEach((service, serviceIndex) => {
     

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
          }
        });
      }
    });

    const result = Array.from(providers.values());
    return result;
  }, [user]);

  // Enhanced chat modal handlers
  const openEnhancedChatModal = useCallback(async () => {
    
    setIsEnhancedChatModalOpen(true);
    
    // Load data in background without blocking modal opening
    try {
      await projectState.fetchProjects();
    } catch (error) {
      console.error('🔍 Error loading user projects for chat:', error);
    }
  }, [projectState, isEnhancedChatModalOpen]);

  const closeEnhancedChatModal = useCallback(() => {
    setIsEnhancedChatModalOpen(false);
    setSelectedChatType('');
    setSelectedChatRecipient(null);
    // Reset chat state
    setChatMessages([]);
    setChatConversationId('');
    setChatMessageValue('');
  }, []);

  // Define all available actions (after functions are defined)
  const allActions = [
    { name: 'Dashboard', icon: BarChart3, route: '/dashboard', color: 'bg-slate-200' },
    { name: 'Cases', icon: Briefcase, route: '/cases', color: 'bg-purple-200' },
    { name: 'Add Task', icon: Plus, route: '', color: 'bg-blue-200', action: modalState.openAddTaskModal },
    { name: 'Timer', icon: Clock, route: '', color: 'bg-green-200', action: openTimerModal },
    { name: 'TimeLine', icon: Clock, route: '/timeline', color: 'bg-orange-200' },
    { name: 'Meeting', icon: Calendar, route: '', color: 'bg-pink-200', action: modalState.openMeetingModal },
    { name: 'Mail', icon: Mail, route: '', color: 'bg-red-200', action: modalState.openEnhancedMailModal },
    { name: 'Chat', icon: MessageCircle, route: '', color: 'bg-yellow-200', action: openEnhancedChatModal },
    { name: 'Team', icon: Users, route: '/dashboard/team', color: 'bg-emerald-200' },
    { name: 'TemplateDocs', icon: FileText, route: '/dashboard/template-documents', color: 'bg-indigo-200' },
    { name: 'CompareDocs', icon: GitCompare, route: '/document-comparison', color: 'bg-violet-200' },
    { name: 'Flowchart', icon: GitBranch, route: '/dashboard/flowchart', color: 'bg-cyan-200' },
    { name: 'Phone', icon: Phone, route: '/dashboard/phone', color: 'bg-teal-200' },
    { name: 'InviteBiller', icon: DollarSign, route: '', color: 'bg-green-200', action: modalState.openBillerModal },
    { name: 'AssignToBiller', icon: Briefcase, route: '', color: 'bg-indigo-200', action: modalState.openCaseAssignmentModal },
  ];

  // Filter actions based on user role
  const quickActions = useMemo(() => {
    if (user?.Role === 'BILLER') {
      return allActions.filter(action =>
        ['Dashboard', 'Meeting', 'Mail', 'Chat'].includes(action.name)
      );
    } else if (user?.Role === 'CLIENT') {
      const clientActions = allActions.filter(action =>
        ['Dashboard', 'Meeting', 'Mail', 'Chat'].includes(action.name)
      );
      clientActions.push(
        { name: 'My Signatures', icon: FileSignature, route: '/dashboard/client-signatures-simple', color: 'bg-purple-200' }
      );
      return clientActions;
    } else if (user?.Role === 'TEAM' || user?.Role === 'PROVIDER') {
      return allActions;
    } else {
      return allActions.filter(action => action.name !== 'Phone System');
    }
  }, [user?.Role, allActions]);

  // Modal functions object to pass to QuickActionsContent
  const modalFunctions = {
    openCasesModal: modalState.openCasesModal,
    openAddTaskModal: modalState.openAddTaskModal,
    openTimerModal: openTimerModal,
    openEnhancedChatModal: openEnhancedChatModal,
    openTimelineCasesModal: openTimelineCasesModal,
    openFlowchartModal: openFlowchartModal,
    openMeetingModal: modalState.openMeetingModal,
    openEnhancedMailModal: openEnhancedMailModal,
    openBillerModal: modalState.openBillerModal,
    openCaseAssignmentModal: modalState.openCaseAssignmentModal,
  };

  // If sidebar mode, return sidebar layout with children
  if (isSidebarMode) {
    return (
      <>
        <div className="fixed top-16 left-0 right-0 bottom-0 flex bg-gray-50">
          {/* Left Sidebar */}
          <div className="w-56 bg-white shadow-lg border-r border-gray-200 flex-shrink-0 z-40">
            <QuickActionsContent 
              user={user}
              allActions={allActions}
              quickActions={quickActions}
              isSidebarMode={isSidebarMode}
              modalFunctions={modalFunctions}
            />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto bg-white relative">
            {children}
          </div>
        </div>

        {/* Timeline Cases Modal */}
        <TimelineCasesModal
          isOpen={modalState.isTimelineCasesModalOpen}
          onClose={closeTimelineCasesModal}
          projects={projectState.projects || []}
          projectsLoading={projectState.projectsLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredProjects={filteredProjects}
          onProjectSelect={openLawFirmTimelineModal}
        />

        {/* Law Firm Timeline Modal */}
        <LawFirmTimelineModal
          isOpen={modalState.isLawFirmTimelineModalOpen}
          onClose={closeLawFirmTimelineModal}
          selectedProject={timelineState.selectedProjectForTimeline}
          timelineData={timelineState.timelineData}
          timelineLoading={timelineState.timelineLoading}
          onRefresh={timelineState.fetchTimelineData}
        />

        {/* Enhanced Mail Modal */}
        <EnhancedMailModal
          isOpen={modalState.isEnhancedMailModalOpen}
          onClose={closeEnhancedMailModal}
          mails={mailState.mails}
          mailLoading={mailState.mailLoading}
          selectedMail={mailState.selectedMail}
          setSelectedMail={mailState.setSelectedMail}
          onNewMail={modalState.openSendMailModal}
          onLoadMore={mailState.loadMoreMails}
        />

        {/* Timer Modal */}
        <TimerModal
          isOpen={modalState.isTimerModalOpen}
          onClose={modalState.closeTimerModal}
          projects={projectState.projects || []}
        />

        {/* Case Modal */}
        <CaseModal
          isOpen={modalState.isCaseModalOpen}
          onClose={modalState.closeCasesModal}
        />

        {/* Add Task Modal */}
        <AddTaskModal
          open={modalState.isAddTaskModalOpen}
          onClose={modalState.closeAddTaskModal}
        />

        {/* Meeting Modal */}
        <MeetingModal
          isOpen={modalState.isMeetingModalOpen}
          onClose={modalState.closeMeetingModal}
        />

        {/* Biller Modal */}
        <BillerModal
          isOpen={modalState.isBillerModalOpen}
          onClose={modalState.closeBillerModal}
        />

        {/* Case Assignment Modal */}
        <CaseAssignmentModal
          isOpen={modalState.isCaseAssignmentModalOpen}
          onClose={modalState.closeCaseAssignmentModal}
        />

        {/* Flowchart Modal */}
        <FlowchartModal
          isOpen={modalState.isFlowchartModalOpen}
          onClose={modalState.closeFlowchartModal}
          projects={projectState.projects || []}
          projectsLoading={projectState.projectsLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedProjectForTimeline={timelineState.selectedProjectForTimeline}
          setSelectedProjectForTimeline={timelineState.setSelectedProjectForTimeline}
        />

        {/* Enhanced Chat Modal */}
        {isEnhancedChatModalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="fixed inset-0 bg-black bg-opacity-20 transition-opacity" onClick={closeEnhancedChatModal} />
            <div className="flex h-full relative z-10" onClick={(e) => e.stopPropagation()}>
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
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">{member.name.charAt(0)}</span>
                              </div>
                              <div className="text-left">
                                <div className="font-medium">{member.name}</div>
                                <div className="text-sm text-gray-500">{member.projectName}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                        {getAllTeamMembers().length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>No team members found</p>
                          </div>
                        )}
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
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-green-600">{client.name.charAt(0)}</span>
                              </div>
                              <div className="text-left">
                                <div className="font-medium">{client.name}</div>
                                <div className="text-sm text-gray-500">{client.projectName}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                        {getAllClients().length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            <Building className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>No clients found</p>
                          </div>
                        )}
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
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-purple-600">{provider.name.charAt(0)}</span>
                              </div>
                              <div className="text-left">
                                <div className="font-medium">{provider.name}</div>
                                <div className="text-sm text-gray-500">{provider.projectName}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                        {getAllProviders().length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>No providers found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 bg-gray-50 flex flex-col h-full">
                {selectedChatRecipient ? (
                  <>
                    {/* Chat Header */}
                    <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedChatRecipient(null)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
                        >
                          <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <AvatarCompoment name={selectedChatRecipient.name} className="w-10 h-10" />
                        <div>
                          <p className="font-medium text-gray-900">{selectedChatRecipient.name}</p>
                          <p className="text-sm text-gray-600">{selectedChatRecipient.projectName}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 flex-shrink" ref={chatContainerRef}>
                      {chatLoading && (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-gray-500">Loading conversation...</div>
                        </div>
                      )}
                      
                      {!chatLoading && chatMessages.length > 0 && chatMessages.map((message, index) => {
                        const isFromCurrentUser = message.sender_id === user?.user_id;
                        return (
                          <div key={index} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isFromCurrentUser ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200'
                            }`}>
                              <p className="break-words">{message.content}</p>
                              <p className={`text-xs mt-1 ${isFromCurrentUser ? 'text-white/70' : 'text-gray-500'}`}>
                                {moment(message.createdAt).format("LT")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      
                      {!chatLoading && chatMessages.length === 0 && (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          No messages yet. Start the conversation!
                        </div>
                      )}
                    </div>
                    
                    {/* Chat Input */}
                    <div className="bg-white p-4 border-t border-gray-200 flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <input
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Type a message..."
                          value={chatMessageValue}
                          onChange={(e) => setChatMessageValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleChatSend();
                            }
                          }}
                          disabled={chatSending || !chatConversationId}
                        />
                        
                        {/* File Upload Buttons */}
                        <input
                          id="chat-file-upload"
                          type="file"
                          onChange={handleChatFileSelect}
                          accept="*/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('chat-file-upload')?.click()}
                          disabled={chatSending}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                          title="Attach file"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={handleChatSend}
                          disabled={chatSending || (!chatMessageValue.trim() && !chatSelectedFile && !chatSelectedInternalDoc) || !chatConversationId}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      {chatSelectedFile && (
                        <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-600">{chatSelectedFile.name}</span>
                          </div>
                          <button
                            onClick={() => setChatSelectedFile(null)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Select a chat option</h3>
                      <p className="text-gray-500">Choose from the options on the left to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // If horizontal mode, return normal layout
  return (
    <>
      <div className="sticky top-16 z-[35] bg-white">
        <QuickActionsContent 
          user={user}
          allActions={allActions}
          quickActions={quickActions}
          isSidebarMode={isSidebarMode}
          modalFunctions={modalFunctions}
        />
      </div>
      {children}

      {/* Timeline Cases Modal */}
      <TimelineCasesModal
        isOpen={modalState.isTimelineCasesModalOpen}
        onClose={closeTimelineCasesModal}
        projects={projectState.projects || []}
        projectsLoading={projectState.projectsLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredProjects={filteredProjects}
        onProjectSelect={openLawFirmTimelineModal}
      />

      {/* Law Firm Timeline Modal */}
      <LawFirmTimelineModal
        isOpen={modalState.isLawFirmTimelineModalOpen}
        onClose={closeLawFirmTimelineModal}
        selectedProject={timelineState.selectedProjectForTimeline}
        timelineData={timelineState.timelineData}
        timelineLoading={timelineState.timelineLoading}
        onRefresh={timelineState.fetchTimelineData}
      />

      {/* Enhanced Mail Modal */}
      <EnhancedMailModal
        isOpen={modalState.isEnhancedMailModalOpen}
        onClose={closeEnhancedMailModal}
        mails={mailState.mails}
        mailLoading={mailState.mailLoading}
        selectedMail={mailState.selectedMail}
        setSelectedMail={mailState.setSelectedMail}
        onNewMail={modalState.openSendMailModal}
        onLoadMore={mailState.loadMoreMails}
      />

      {/* Timer Modal */}
      <TimerModal
        isOpen={modalState.isTimerModalOpen}
        onClose={modalState.closeTimerModal}
        projects={projectState.projects || []}
      />

      {/* Case Modal */}
      <CaseModal
        isOpen={modalState.isCaseModalOpen}
        onClose={modalState.closeCasesModal}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        open={modalState.isAddTaskModalOpen}
        onClose={modalState.closeAddTaskModal}
      />

      {/* Meeting Modal */}
      <MeetingModal
        isOpen={modalState.isMeetingModalOpen}
        onClose={modalState.closeMeetingModal}
      />

      {/* Biller Modal */}
      <BillerModal
        isOpen={modalState.isBillerModalOpen}
        onClose={modalState.closeBillerModal}
      />

      {/* Case Assignment Modal */}
      <CaseAssignmentModal
        isOpen={modalState.isCaseAssignmentModalOpen}
        onClose={modalState.closeCaseAssignmentModal}
      />

      {/* Flowchart Modal */}
      <FlowchartModal
        isOpen={modalState.isFlowchartModalOpen}
        onClose={modalState.closeFlowchartModal}
        projects={projectState.projects || []}
        projectsLoading={projectState.projectsLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedProjectForTimeline={timelineState.selectedProjectForTimeline}
        setSelectedProjectForTimeline={timelineState.setSelectedProjectForTimeline}
      />

      {/* Enhanced Chat Modal */}
      {isEnhancedChatModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="fixed inset-0 bg-black bg-opacity-20 transition-opacity" onClick={closeEnhancedChatModal} />
          <div className="flex h-full relative z-10" onClick={(e) => e.stopPropagation()}>
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
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{member.name.charAt(0)}</span>
                            </div>
                            <div className="text-left">
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.projectName}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                      {getAllTeamMembers().length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>No team members found</p>
                        </div>
                      )}
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
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600">{client.name.charAt(0)}</span>
                            </div>
                            <div className="text-left">
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-gray-500">{client.projectName}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                      {getAllClients().length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <Building className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>No clients found</p>
                        </div>
                      )}
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
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">{provider.name.charAt(0)}</span>
                            </div>
                            <div className="text-left">
                              <div className="font-medium">{provider.name}</div>
                              <div className="text-sm text-gray-500">{provider.projectName}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                      {getAllProviders().length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>No providers found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-gray-50 flex flex-col h-full">
              {selectedChatRecipient ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSelectedChatRecipient(null)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <AvatarCompoment name={selectedChatRecipient.name} className="w-10 h-10" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedChatRecipient.name}</p>
                        <p className="text-sm text-gray-600">{selectedChatRecipient.projectName}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 flex-shrink" ref={chatContainerRef}>
                    {chatLoading && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">Loading conversation...</div>
                      </div>
                    )}
                    
                    {!chatLoading && chatMessages.length > 0 && chatMessages.map((message, index) => {
                      const isFromCurrentUser = message.sender_id === user?.user_id;
                      return (
                        <div key={index} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isFromCurrentUser ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200'
                          }`}>
                            <p className="break-words">{message.content}</p>
                            <p className={`text-xs mt-1 ${isFromCurrentUser ? 'text-white/70' : 'text-gray-500'}`}>
                              {moment(message.createdAt).format("LT")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    
                    {!chatLoading && chatMessages.length === 0 && (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No messages yet. Start the conversation!
                      </div>
                    )}
                  </div>
                  
                  {/* Chat Input */}
                  <div className="bg-white p-4 border-t border-gray-200 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <input
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type a message..."
                        value={chatMessageValue}
                        onChange={(e) => setChatMessageValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleChatSend();
                          }
                        }}
                        disabled={chatSending || !chatConversationId}
                      />
                      
                      {/* File Upload Buttons */}
                      <input
                        id="chat-file-upload-2"
                        type="file"
                        onChange={handleChatFileSelect}
                        accept="*/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('chat-file-upload-2')?.click()}
                        disabled={chatSending}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        title="Attach file"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={handleChatSend}
                        disabled={chatSending || (!chatMessageValue.trim() && !chatSelectedFile && !chatSelectedInternalDoc) || !chatConversationId}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    {chatSelectedFile && (
                      <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-600">{chatSelectedFile.name}</span>
                        </div>
                        <button
                          onClick={() => setChatSelectedFile(null)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Select a chat option</h3>
                    <p className="text-gray-500">Choose from the options on the left to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickActions;
