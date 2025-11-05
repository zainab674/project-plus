'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useUser } from '@/providers/UserProvider';
import { toast } from 'sonner';
import { getOrCreatePrivateConversationRequest, createCustomGroup, getCustomGroups, getCustomGroupMessages, sendCustomGroupMessage } from '@/lib/http/chat';
import useChatHook from '@/hooks/useChatHook';
import { Send, ArrowLeft, Paperclip, MessageCircle, Users, Building, User, X, FileText, UserPlus, Plus } from 'lucide-react';
import moment from 'moment';
import AvatarCompoment from '@/components/AvatarCompoment';
import { ON_PRIVATE_MESSAGE, ON_MESSAGE } from '@/contstant/chatEventConstant';
import { useProjectState } from '@/hooks/useProjectState';

export default function PrivateChatPage() {
  const { user, loadUserWithProjects } = useUser();
  const projectState = useProjectState(user, loadUserWithProjects || (() => Promise.resolve()));

  // Enhanced chat state
  const [selectedChatType, setSelectedChatType] = useState('');
  const [selectedChatRecipient, setSelectedChatRecipient] = useState(null);
  
  // Custom Groups state
  const [customGroups, setCustomGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsersForGroup, setSelectedUsersForGroup] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatConversationId, setChatConversationId] = useState('');
  const [chatMessageValue, setChatMessageValue] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatSelectedFile, setChatSelectedFile] = useState(null);
  const [chatSelectedInternalDoc, setChatSelectedInternalDoc] = useState(null);
  const chatContainerRef = useRef(null);
  
  // Get chat hook functions
  const { handleSendMessage: sendChatMessage, socketRef } = useChatHook();

  // Prevent page scrolling when chat page is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Load user projects on mount
  useEffect(() => {
    if (user && !user.Projects) {
      loadUserWithProjects?.();
    }
    if (user) {
      projectState.fetchProjects();
    }
  }, [user, loadUserWithProjects, projectState]);

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
      const currentConversationId = chatConversationId;
      console.log('🔍 Received message:', data);
      console.log('🔍 Current recipient ID:', currentRecipientId);
      console.log('🔍 Current conversation ID:', currentConversationId);
      console.log('🔍 Current user:', user?.user_id);
      
      // Check if this is a custom group message
      const isCustomGroupMessage = data.is_group_chat && 
                                    data.conversation_id && 
                                    !data.project_id &&
                                    currentConversationId &&
                                    data.conversation_id === currentConversationId;
      
      // Check if this message is for the current chat
      const isForCurrentChat = isCustomGroupMessage || (
        currentRecipientId && (
          // Private message check
          ((parseInt(data.sender_id) === currentRecipientId && parseInt(data.receiver_id) === user?.user_id) ||
           (parseInt(data.receiver_id) === currentRecipientId && parseInt(data.sender_id) === user?.user_id)) ||
          // Project message check (if conversation_id matches)
          (data.conversation_id && chatConversationId && data.conversation_id === chatConversationId)
        )
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
                  message_id: data.message_id || msg.message_id,
                  private_message_id: data.private_message_id || msg.private_message_id,
                  temp_message_id: undefined,
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
          
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(msg => {
            if (data.message_id && msg.message_id === data.message_id) {
              return true;
            }
            if (data.private_message_id && msg.private_message_id === data.private_message_id) {
              return true;
            }
            if (data.temp_message_id && msg.temp_message_id === data.temp_message_id) {
              return true;
            }
            if (msg.content === data.content &&
                parseInt(msg.sender_id) === parseInt(data.sender_id)) {
              const timeDiff = Math.abs(new Date(msg.createdAt || msg.created_at) - new Date(data.createdAt || data.created_at));
              if (timeDiff < 5000) {
                return true;
              }
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
    const userProjects = user?.Projects || [];
    const userCollaboration = user?.Collaboration || [];
    const userServices = user?.Services || [];

    if (!userProjects.length && !userCollaboration.length && !userServices.length) {
      return [];
    }

    const teamMembers = new Map();

    // Process Projects
    userProjects.forEach((project) => {
      if (project.Members && Array.isArray(project.Members)) {
        project.Members.forEach((member) => {
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
    userCollaboration.forEach((collab) => {
      if (collab.project?.Members && Array.isArray(collab.project.Members)) {
        collab.project.Members.forEach((member) => {
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
    userServices.forEach((service) => {
      if (service.project?.Members && Array.isArray(service.project.Members)) {
        service.project.Members.forEach((member) => {
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

    return Array.from(teamMembers.values());
  }, [user]);

  // Get all clients from projects
  const getAllClients = useCallback(() => {
    const userProjects = user?.Projects || [];
    const userCollaboration = user?.Collaboration || [];
    const userServices = user?.Services || [];

    if (!userProjects.length && !userCollaboration.length && !userServices.length) {
      return [];
    }

    const clients = new Map();

    // Process Projects
    userProjects.forEach((project) => {
      if (project.Clients && Array.isArray(project.Clients)) {
        project.Clients.forEach((client) => {
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
    userCollaboration.forEach((collab) => {
      if (collab.project?.Clients && Array.isArray(collab.project.Clients)) {
        collab.project.Clients.forEach((client) => {
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
    userServices.forEach((service) => {
      if (service.project?.Clients && Array.isArray(service.project.Clients)) {
        service.project.Clients.forEach((client) => {
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

    return Array.from(clients.values());
  }, [user]);

  // Get all providers from projects
  const getAllProviders = useCallback(() => {
    const userProjects = user?.Projects || [];
    const userCollaboration = user?.Collaboration || [];
    const userServices = user?.Services || [];

    if (!userProjects.length && !userCollaboration.length && !userServices.length) {
      return [];
    }

    const providers = new Map();

    // Process Projects
    userProjects.forEach((project) => {
      if (project.Members && Array.isArray(project.Members)) {
        project.Members.forEach((member) => {
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
    userCollaboration.forEach((collab) => {
      if (collab.project?.Members && Array.isArray(collab.project.Members)) {
        collab.project.Members.forEach((member) => {
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
    userServices.forEach((service) => {
      if (service.project?.Members && Array.isArray(service.project.Members)) {
        service.project.Members.forEach((member) => {
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

    return Array.from(providers.values());
  }, [user]);

  // WhatsApp connection handler
  const connectWhatsapp = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('https://web.whatsapp.com', '_blank', 'width=800,height=600');
    }
  }, []);

  // Reset state when recipient is cleared
  const handleBackToSelection = useCallback(() => {
    setSelectedChatRecipient(null);
    setSelectedGroup(null);
    setChatMessages([]);
    setChatConversationId('');
    setChatMessageValue('');
  }, []);

  // Load custom groups
  const loadCustomGroups = useCallback(async () => {
    if (!user) return;
    setGroupsLoading(true);
    try {
      const res = await getCustomGroups();
      setCustomGroups(res.data.groups || []);
    } catch (error) {
      console.error('Error loading custom groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setGroupsLoading(false);
    }
  }, [user]);

  // Load groups on mount
  useEffect(() => {
    loadCustomGroups();
  }, [loadCustomGroups]);

  // Handle group selection
  const handleGroupSelect = useCallback(async (group) => {
    setSelectedGroup(group);
    setSelectedChatRecipient(null);
    setSelectedChatType('group');
    setChatLoading(true);
    try {
      const res = await getCustomGroupMessages(group.conversation_id);
      setChatConversationId(group.conversation_id);
      setChatMessages(res.data.messages || []);
    } catch (error) {
      console.error('Error loading group messages:', error);
      toast.error('Failed to load group messages');
    } finally {
      setChatLoading(false);
    }
  }, []);

  // Handle creating a group
  const handleCreateGroup = useCallback(async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedUsersForGroup.length === 0) {
      toast.error('Please select at least one member');
      return;
    }
    try {
      const res = await createCustomGroup({
        name: groupName.trim(),
        user_ids: selectedUsersForGroup.map(u => u.id)
      });
      toast.success('Group created successfully!');
      setShowCreateGroup(false);
      setGroupName('');
      setSelectedUsersForGroup([]);
      await loadCustomGroups();
      // Auto-select the newly created group
      handleGroupSelect(res.data.group);
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error(error.response?.data?.message || 'Failed to create group');
    }
  }, [groupName, selectedUsersForGroup, loadCustomGroups, handleGroupSelect]);

  // Toggle user selection for group creation
  const toggleUserForGroup = useCallback((user) => {
    setSelectedUsersForGroup(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  }, []);

  // Handle sending group message
  const handleGroupMessageSend = useCallback(async () => {
    if ((!chatMessageValue.trim() && !chatSelectedFile) || !selectedGroup || !chatConversationId || chatSending) return;
    
    setChatSending(true);
    try {
      const formData = new FormData();
      formData.append('content', chatMessageValue.trim());
      formData.append('content_type', 'PLAIN_TEXT');
      if (chatSelectedFile) {
        formData.append('file', chatSelectedFile);
      }

      const res = await sendCustomGroupMessage(chatConversationId, formData);
      
      // Add message to UI immediately
      setChatMessages(prev => [...prev, res.data.message]);
      setChatMessageValue('');
      setChatSelectedFile(null);
      
      // Clear file input
      const fileInput = document.getElementById('chat-file-upload');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error sending group message:', error);
      toast.error('Failed to send message');
    } finally {
      setChatSending(false);
    }
  }, [chatMessageValue, chatSelectedFile, selectedGroup, chatConversationId, chatSending]);

  return (
    <div className="fixed inset-0 flex bg-gray-50 overflow-hidden" style={{ top: '9rem', bottom: '0' }}>
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-xl border-r border-gray-200 flex-shrink-0 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Chat Options</h2>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
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
                onClick={() => {
                  setSelectedChatType('whatsapp');
                  connectWhatsapp();
                }}
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

              {/* Custom Groups Option */}
              <button
                onClick={() => {
                  setSelectedChatType('groups');
                  setSelectedChatRecipient(null);
                  setSelectedGroup(null);
                }}
                className={`w-full p-3 rounded-lg border-2 transition-all ${selectedChatType === 'groups'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Groups</div>
                    <div className="text-sm text-gray-500">Create and join groups</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Groups Section */}
          {selectedChatType === 'groups' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Your Groups</h3>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Create new group"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {groupsLoading ? (
                <div className="text-center py-4 text-gray-500">Loading groups...</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customGroups.map((group) => (
                    <button
                      key={group.conversation_id}
                      onClick={() => handleGroupSelect(group)}
                      className={`w-full p-3 rounded-lg border-2 transition-all ${selectedGroup?.conversation_id === group.conversation_id
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-medium">{group.name}</div>
                          <div className="text-sm text-gray-500">{group.participants.length} member(s)</div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {customGroups.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No groups yet</p>
                      <button
                        onClick={() => setShowCreateGroup(true)}
                        className="text-purple-600 hover:underline text-sm mt-2"
                      >
                        Create your first group
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Create Group Modal */}
          {showCreateGroup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Create New Group</h3>
                  <button
                    onClick={() => {
                      setShowCreateGroup(false);
                      setGroupName('');
                      setSelectedUsersForGroup([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter group name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Members</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                      {/* Show all available users (team, clients, providers) */}
                      {getAllTeamMembers().concat(getAllClients()).concat(getAllProviders()).map((user) => (
                        <button
                          key={user.id}
                          onClick={() => toggleUserForGroup(user)}
                          className={`w-full p-2 rounded-lg text-left transition-all ${
                            selectedUsersForGroup.some(u => u.id === user.id)
                              ? 'bg-purple-100 border-2 border-purple-500'
                              : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              selectedUsersForGroup.some(u => u.id === user.id) ? 'bg-purple-500' : 'bg-gray-300'
                            }`}>
                              {selectedUsersForGroup.some(u => u.id === user.id) && (
                                <X className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedUsersForGroup.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {selectedUsersForGroup.length} member(s) selected
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateGroup}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create Group
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateGroup(false);
                        setGroupName('');
                        setSelectedUsersForGroup([]);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
      <div className="flex-1 bg-gray-50 flex flex-col min-w-0 overflow-hidden">
        {(selectedChatRecipient || selectedGroup || chatMessages.length > 0) ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0 z-[60] sticky top-[5rem] shadow-sm">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBackToSelection}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                {selectedGroup ? (
                  <>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedGroup.name}</p>
                      <p className="text-sm text-gray-600">{selectedGroup.participants?.length || 0} member(s)</p>
                    </div>
                  </>
                ) : selectedChatRecipient ? (
                  <>
                    <AvatarCompoment name={selectedChatRecipient.name} className="w-10 h-10" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedChatRecipient.name}</p>
                      <p className="text-sm text-gray-600">{selectedChatRecipient.projectName || 'Private Chat'}</p>
                    </div>
                  </>
                ) : chatMessages.length > 0 ? (
                  <>
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Chat</p>
                      <p className="text-sm text-gray-600">Active conversation</p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0" ref={chatContainerRef} style={{ overflowAnchor: 'none' }}>
              {chatLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading conversation...</div>
                </div>
              )}
              
              {!chatLoading && chatMessages.length > 0 && chatMessages.map((message, index) => {
                const isFromCurrentUser = parseInt(message.sender_id) === user?.user_id;
                return (
                  <div key={message.private_message_id || message.message_id || message.temp_message_id || index} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isFromCurrentUser ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      {/* Show sender name in group chats */}
                      {selectedGroup && !isFromCurrentUser && (
                        <p className="text-xs font-medium mb-1 opacity-70">{message.sender_name || 'Unknown'}</p>
                      )}
                      <p className="break-words">{message.content}</p>
                      {message.attachment_url && message.attachment_url !== 'uploading...' && (
                        <a
                          href={message.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-sm mt-1 block"
                        >
                          <FileText className="w-4 h-4 inline mr-1" />
                          {message.attachment_name}
                        </a>
                      )}
                      {message.attachment_url === 'uploading...' && (
                        <p className="text-xs italic mt-1">Uploading attachment...</p>
                      )}
                      <p className={`text-xs mt-1 ${isFromCurrentUser ? 'text-white/70' : 'text-gray-500'}`}>
                        {moment(message.createdAt || message.created_at).format("LT")}
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
                      selectedGroup ? handleGroupMessageSend() : handleChatSend();
                    }
                  }}
                  disabled={chatSending || !chatConversationId}
                />
                
                {/* File Upload Button */}
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
                  onClick={selectedGroup ? handleGroupMessageSend : handleChatSend}
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
  );
}


