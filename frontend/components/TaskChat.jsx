'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, X, FileText, Users } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MultiSelect from "@/components/ui/multi-select"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useUser } from "@/providers/UserProvider"
import useChatHook from "@/hooks/useChatHook"
import { toast } from "react-toastify"
import { ON_MESSAGE, ON_PROJECT_MESSAGE_RECEIVED } from "@/contstant/chatEventConstant"
import { Card } from "@/components/ui/card"
import AvatarCompoment from "@/components/AvatarCompoment"
import moment from 'moment'
import { getGroupChatMessages, markGroupChatMessagesAsReadRequest } from "@/lib/http/chat"
import InternalDocumentSelector from "./InternalDocumentSelector"

export default function TaskChat({ task, project }) {
  const [messages, setMessages] = useState([]);
  const [messageValue, setMessageValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]); // State for selected members (array of user_ids)
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedInternalDoc, setSelectedInternalDoc] = useState(null);
  const [showInternalDocSelector, setShowInternalDocSelector] = useState(false);
  const { user } = useUser();
  const { handleSendProjectMessage, handleJoinProjectRoom, handleLeaveProjectRoom, socketRef } = useChatHook();
  const containerRef = useRef(null);
  const audioRef = useRef();

  // Get all project team members including current user
  const projectTeamMembers = useMemo(() => {
    if (!project) return [];

    const teamMembers = project.Members?.filter(member => member.role !== "CLIENT").map(member => ({
      ...member.user,
      role: member.role,
      memberType: 'MEMBER'
    })) || [];

    return teamMembers;
  }, [project]);

  // Prepare member options for MultiSelect
  const memberOptions = useMemo(() => {
    return projectTeamMembers.map(member => ({
      value: member.user_id.toString(),
      label: member.name || member.email || `User ${member.user_id}`
    }));
  }, [projectTeamMembers]);

  // Load existing messages from database
  const loadExistingMessages = useCallback(async () => {
    if (!project || !task) return;

    setLoading(true);
    try {
      const res = await getGroupChatMessages(project.project_id, task.task_id);
      const existingMessages = res.data.messages || [];
      setMessages(existingMessages);
      
      // Mark messages as read when conversation is loaded
      try {
        await markGroupChatMessagesAsReadRequest(project.project_id, task.task_id);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [project, task]);

  // Load messages when component mounts or task changes
  useEffect(() => {
    loadExistingMessages();
  }, [loadExistingMessages]);

  // Join project room when component mounts (and when socket connects)
  useEffect(() => {
    if (!project?.project_id || !user || !socketRef?.current) return;

    const socket = socketRef.current;
    const joinRoom = () => {
      handleJoinProjectRoom(project.project_id);
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
      if (!socket.connecting) {
        socket.connect();
      }
    }

    return () => {
      if (socket.connected) {
        handleLeaveProjectRoom(project.project_id);
      } else {
        socket.off('connect', joinRoom);
      }
    };
  }, [project?.project_id, user, socketRef?.current, handleJoinProjectRoom, handleLeaveProjectRoom]);

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
      setSelectedInternalDoc(null); // Clear internal doc when PC file is selected
    }
  };

  const handleInternalDocSelect = (doc) => {
    setSelectedInternalDoc(doc);
    setSelectedFile(null); // Clear PC file when internal doc is selected
  };

  // Handle sending messages
  const handleSend = useCallback(async () => {
    if (!messageValue.trim() || !user || !project || !task || sending) return;

    setSending(true);
    try {
      // Store file reference before clearing
      const fileToUpload = selectedFile;
      const internalDocToUpload = selectedInternalDoc;
      
      // Create message data for socket with attachment info
      const socketData = {
        sender_id: user.user_id,
        reciever_id: null, // Group chat, no specific receiver
        content: messageValue.trim(),
        conversation_id: `project-${project.project_id}-${task.task_id}`,
        content_type: "PLAIN_TEXT",
        createdAt: new Date(Date.now()),
        sender_name: user?.name,
        task_name: task?.name,
        task_id: task?.task_id,
        project_id: project.project_id,
        is_group_chat: true,
        // Include recipient_ids if members are selected, otherwise send to all project members
        recipient_ids: selectedMembers.length > 0 ? selectedMembers.map(id => parseInt(id)) : null,
        // Include attachment info in socket data
        attachment_url: (fileToUpload || internalDocToUpload) ? 'uploading...' : null,
        attachment_name: fileToUpload?.name || internalDocToUpload?.name,
        attachment_size: fileToUpload?.size || internalDocToUpload?.size,
        attachment_mime_type: fileToUpload?.type || 'application/pdf'
      };

      // Send via socket immediately
      try {
        if (socketRef?.current?.connected) {
          handleSendProjectMessage(socketData);
        } else {
          console.error('❌ Socket not connected');
          toast.error("Connection lost. Please wait for reconnection...");
          // Try to reconnect
          if (socketRef?.current) {
            socketRef.current.connect();
            socketRef.current.once('connect', () => {
              handleSendProjectMessage(socketData);
            });
          }
        }
      } catch (error) {
        console.error('❌ Socket send failed:', error);
        toast.error("Failed to send message");
      }
      
      // Add message to local state immediately
      const tempMessageId = `temp-${Date.now()}`;
      const messageWithTempId = { 
        ...socketData, 
        message_id: tempMessageId,
        attachment_url: (fileToUpload || internalDocToUpload) ? 'uploading...' : null,
        attachment_name: fileToUpload?.name || internalDocToUpload?.name,
        attachment_size: fileToUpload?.size || internalDocToUpload?.size,
        attachment_mime_type: fileToUpload?.type || 'application/pdf'
      };
      setMessages(prev => [...prev, messageWithTempId]);
      setMessageValue('');
      
      // Clear selected files immediately after adding to messages
      setSelectedFile(null);
      setSelectedInternalDoc(null);
      
      // Clear the file input
      const fileInput = document.getElementById(`file-upload-${task.task_id}`);
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      console.error('Error in handleSend:', error);
      toast.error("Failed to send message. Please try again.");
      
      // Remove the temporary message if there was an error
      setMessages(prev => prev.filter(msg => !msg.message_id?.startsWith('temp-')));
    } finally {
      setSending(false);
    }
  }, [messageValue, user, project, task, selectedMembers, handleSendProjectMessage, selectedFile, sending, selectedInternalDoc]);

  // Handle receiving messages
  const handleMessageReceive = useCallback((data) => {
    // Only handle messages for this project and task
    if (data.project_id === project?.project_id && data.task_id === task?.task_id) {
      // If message was sent to specific recipients, only show if current user is a recipient or sender
      // Otherwise, show all messages for this task
      if (data.recipient_ids && Array.isArray(data.recipient_ids) && data.recipient_ids.length > 0) {
        const isRecipient = data.recipient_ids.includes(user?.user_id);
        const isSender = data.sender_id === user?.user_id;
        if (!isRecipient && !isSender) {
          return; // Don't show this message if user is not a recipient or sender
        }
      }
      // Check if message already exists in state to prevent duplicates
      setMessages(prev => {
        // More robust duplicate detection
        const messageExists = prev.some(msg => {
          // Check by message_id first (most reliable)
          if (data.message_id && msg.message_id === data.message_id) {
            return true;
          }

          // Check by content, sender, and time (fallback)
          if (msg.content === data.content &&
            msg.sender_id === data.sender_id) {
            const timeDiff = Math.abs(new Date(msg.createdAt) - new Date(data.createdAt));
            if (timeDiff < 5000) { // Within 5 seconds
              return true;
            }
          }

          // Check for temporary messages with same content
          if (msg.message_id?.startsWith('temp-') && 
              msg.content === data.content &&
              msg.sender_id === data.sender_id) {
            return true;
          }

          return false;
        });

        if (messageExists) {
          return prev;
        }

        return [...prev, {
          ...data,
          attachment_url: data.attachment_url,
          attachment_name: data.attachment_name,
          attachment_size: data.attachment_size,
          attachment_mime_type: data.attachment_mime_type,
          is_read: false // New messages are unread by default
        }];
      });
      
      // Mark messages as read when new message is received and user is viewing the conversation
      if (project?.project_id && task?.task_id) {
        markGroupChatMessagesAsReadRequest(project.project_id, task.task_id).catch(err => {
          console.error('Error marking messages as read:', err);
        });
      }

      // Play notification sound only if message is not from current user
      if (data.sender_id !== user?.user_id) {
        audioRef.current?.play();
      }
    }
  }, [project?.project_id, task?.task_id, user?.user_id]);

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  useEffect(() => {
    if (!socketRef?.current || !project || !task || !user) return;

    const socket = socketRef.current;
    
    const setupListeners = () => {
      if (!socket.connected) {
        console.warn('Socket not connected, waiting for connection...');
        return;
      }
      
      console.log('Setting up socket listeners for task chat');
      socket.on(ON_MESSAGE, handleMessageReceive);
      socket.on(ON_PROJECT_MESSAGE_RECEIVED, handleMessageReceive);
    };

    // Setup listeners based on connection status
    if (socket.connected) {
      setupListeners();
    } else {
      // Wait for connection
      const onConnect = () => {
        console.log('Socket connected, setting up listeners');
        setupListeners();
      };
      socket.on('connect', onConnect);
      
      // Try to connect if not already connecting
      if (!socket.connecting) {
        socket.connect();
      }

      return () => {
        socket.off('connect', onConnect);
        socket.off(ON_MESSAGE, handleMessageReceive);
        socket.off(ON_PROJECT_MESSAGE_RECEIVED, handleMessageReceive);
      };
    }

    return () => {
      socket.off(ON_MESSAGE, handleMessageReceive);
      socket.off(ON_PROJECT_MESSAGE_RECEIVED, handleMessageReceive);
    };
  }, [socketRef, project?.project_id, task?.task_id, user?.user_id, handleMessageReceive]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  if (!project || !task) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Member Selection */}
      <div className="px-4 pt-2 pb-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <MultiSelect
            options={memberOptions}
            onValueChange={setSelectedMembers}
            defaultValue={[]}
            placeholder={selectedMembers.length > 0 ? `${selectedMembers.length} selected` : "All members"}
            variant="default"
            animation={0}
            maxCount={2}
            className="w-full text-sm border-gray-300"
          />
        </div>
        {selectedMembers.length > 0 && (
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Messages will be sent only to selected members
          </p>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={containerRef}>
        {loading && (
          <div className="text-center text-gray-500">Loading messages...</div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((message, index) => {
          const isFromCurrentUser = message.sender_id === user?.user_id;
          const isRead = message.is_read || false;
          return (
            <div key={message.message_id || index} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <Card className={`p-3 max-w-md ${isFromCurrentUser ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-start space-x-2">
                  <AvatarCompoment
                    name={message.sender_name || 'Unknown'}
                    className="w-6 h-6 text-xs flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium opacity-80">
                        {message.sender_name || 'Unknown'}
                      </span>
                      <span className="text-xs opacity-60">
                        {moment(message.createdAt).format("LT")}
                      </span>
                      {/* Show read status for messages sent by current user */}
                      {isFromCurrentUser && (
                        <span className="text-xs opacity-70" title={isRead ? 'Read' : 'Sent'}>
                          {isRead ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                    <p className="break-words text-sm">{message.content}</p>
                    
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
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                window.open(message.attachment_url, '_blank');
                              }}
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                              title="View file"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(message.attachment_url, '_blank')}
                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                              title="Download file"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <div className="bg-white p-4 border-t border-gray-200">
        {/* File Attachment Preview */}
        {selectedFile && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm font-medium text-blue-900">{selectedFile.name}</span>
                <span className="text-xs text-blue-700">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Input
            value={messageValue}
            onChange={(e) => setMessageValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 border border-gray-600"
          />
          
          {/* File Upload Buttons */}
          <input
            id={`file-upload-${task.task_id}`}
            type="file"
            onChange={handleFileSelect}
            accept="*/*"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="px-3"
            disabled={sending}
            onClick={() => document.getElementById(`file-upload-${task.task_id}`).click()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="px-3"
            disabled={sending}
            onClick={() => setShowInternalDocSelector(true)}
          >
            <FileText className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={!messageValue.trim() || sending}
            className="px-4"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
        {(selectedFile || selectedInternalDoc) && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  {selectedFile ? selectedFile.name : selectedInternalDoc?.name}
                </span>
                {selectedFile && (
                  <span className="text-xs text-blue-600">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedInternalDoc(null);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Internal Document Selector */}
      <InternalDocumentSelector
        isOpen={showInternalDocSelector}
        onClose={() => setShowInternalDocSelector(false)}
        onSelect={handleInternalDocSelect}
        selectedFile={selectedInternalDoc}
      />

      {/* Audio element for notifications */}
      <audio ref={audioRef} src="/ding.mp3" preload="auto" />
    </div>
  );
}

