'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, MessageCircle, Moon, PenSquare, Search, Users, ListTodo, Send, Calendar, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useUser } from "@/providers/UserProvider"
import useChatHook from "@/hooks/useChatHook"
import { toast } from "react-toastify"
import { ON_MESSAGE } from "@/contstant/chatEventConstant"
import { Card } from "@/components/ui/card"
import AvatarCompoment from "@/components/AvatarCompoment"
import moment from 'moment'
import { getGroupChatMessages, createGroupChatMessage, getProjectGroupChatInfo } from "@/lib/http/chat"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function ProjectChat({ project }) {
  const [messages, setMessages] = useState([]);
  const [messageValue, setMessageValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [saveStatus, setSaveStatus] = useState({}); // Track save status for each message
  const [selectedTask, setSelectedTask] = useState(null); // State for selected task
  const [searchDate, setSearchDate] = useState(null); // State for date search
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false); // State for date picker popover
  const [selectedFile, setSelectedFile] = useState(null); // State for file attachment
  const { user } = useUser();
  const { handleSendMessage, socketRef } = useChatHook();
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


    // Include current user as well
    return teamMembers;
  }, [project]);

  // Get project tasks for task-based chat
  const projectTasks = useMemo(() => {
    if (!project) return [];
    return project.Tasks || [];
  }, [project]);

  // Get default task for Project Chat
  const getDefaultTask = useCallback(() => {
    if (projectTasks.length > 0) {
      return projectTasks[0];
    }
    return { task_id: 0, name: "Project Chat" };
  }, [projectTasks]);

  // Initialize selected task when project or tasks change
  useEffect(() => {
    const defaultTask = getDefaultTask();
    setSelectedTask(defaultTask);
  }, [getDefaultTask]);

  // Load existing messages from database
  const loadExistingMessages = useCallback(async () => {
    if (!project || !selectedTask) return;

    setLoading(true);
    try {
      const res = await getGroupChatMessages(project.project_id, selectedTask.task_id);
      const existingMessages = res.data.messages || [];
      setMessages(existingMessages);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      console.error('❌ Error response:', error.response?.data);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [project, selectedTask]);

  // Load messages when component mounts or selected task changes
  useEffect(() => {
    loadExistingMessages();
  }, [loadExistingMessages]);

  // Filter messages by date
  const filteredMessages = useMemo(() => {
    if (!searchDate) return messages;
    
    const searchDateStart = new Date(searchDate);
    searchDateStart.setHours(0, 0, 0, 0);
    
    const searchDateEnd = new Date(searchDate);
    searchDateEnd.setHours(23, 59, 59, 999);
    
    return messages.filter(message => {
      const messageDate = new Date(message.createdAt);
      return messageDate >= searchDateStart && messageDate <= searchDateEnd;
    });
  }, [messages, searchDate]);

  // Clear date search
  const clearDateSearch = useCallback(() => {
    setSearchDate(null);
    setIsDatePickerOpen(false);
  }, []);

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

  // Handle task selection change
  const handleTaskChange = useCallback((taskId) => {
    const task = projectTasks.find(t => t.task_id.toString() === taskId) ||
      { task_id: 0, name: "Project Chat" };
    setSelectedTask(task);
  }, [projectTasks]);

  // Handle sending messages
  const handleSend = useCallback(async () => {
    if (!messageValue.trim() || !user || !project || sending) return;

    setSending(true);
    try {
      // Store file reference before clearing
      const fileToUpload = selectedFile;
      
      // Create message data for socket with attachment info
      const socketData = {
        sender_id: user.user_id,
        reciever_id: null, // Group chat, no specific receiver
        content: messageValue.trim(),
        conversation_id: `project-${project.project_id}-${selectedTask.task_id}`,
        content_type: "PLAIN_TEXT",
        createdAt: new Date(Date.now()),
        sender_name: user?.name,
        task_name: selectedTask?.name,
        task_id: selectedTask?.task_id,
        project_id: project.project_id,
        is_group_chat: true,
        // Include attachment info in socket data
        attachment_url: fileToUpload ? 'uploading...' : null,
        attachment_name: fileToUpload?.name,
        attachment_size: fileToUpload?.size,
        attachment_mime_type: fileToUpload?.type
      };

      // Send via socket immediately - don't wait for it
      try {
        handleSendMessage(socketData);
      } catch (error) {
        console.error('❌ Socket send failed:', error);
        toast.error("Failed to send message");
      }
      
      // Add message to local state immediately
      const tempMessageId = `temp-${Date.now()}`;
      const messageWithTempId = { 
        ...socketData, 
        message_id: tempMessageId,
        attachment_url: fileToUpload ? 'uploading...' : null,
        attachment_name: fileToUpload?.name,
        attachment_size: fileToUpload?.size,
        attachment_mime_type: fileToUpload?.type
      };
      setMessages(prev => [...prev, messageWithTempId]);
      setMessageValue('');
      
      // Clear selected file immediately after adding to messages
      setSelectedFile(null);
      
      // Clear the file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) {
        fileInput.value = '';
      }

      // Track save status
      setSaveStatus(prev => ({ ...prev, [tempMessageId]: 'saving' }));

      // Prepare form data for file upload
      const formData = new FormData();
      formData.append('content', messageValue.trim());
      formData.append('content_type', 'PLAIN_TEXT');
      
      if (fileToUpload) {
        formData.append('file', fileToUpload);
      }

      // Save to database in background (completely independent)
      createGroupChatMessage(project.project_id, selectedTask.task_id, formData).then(res => {
        // Update save status to success
        setSaveStatus(prev => ({ ...prev, [tempMessageId]: 'saved' }));

        // Update message with real message_id from database and attachment info
        setMessages(prev => prev.map(msg =>
          msg.message_id === tempMessageId
            ? { 
                ...msg, 
                message_id: res.data.message.message_id,
                attachment_url: res.data.message.attachment_url,
                attachment_name: res.data.message.attachment_name,
                attachment_size: res.data.message.attachment_size,
                attachment_mime_type: res.data.message.attachment_mime_type
              }
            : msg
        ));

        // Update the local message with real attachment URL (no broadcast needed)
        // Other users will get the complete message with attachment on their next load
        if (res.data.message.attachment_url) {
          // Just update the local message, don't broadcast to others
          setMessages(prev => prev.map(msg =>
            msg.message_id === tempMessageId
              ? { 
                  ...msg, 
                  message_id: res.data.message.message_id,
                  attachment_url: res.data.message.attachment_url,
                  attachment_name: res.data.message.attachment_name,
                  attachment_size: res.data.message.attachment_size,
                  attachment_mime_type: res.data.message.attachment_mime_type
                }
              : msg
          ));
        }
      }).catch(error => {
        console.error('❌ Failed to save message to database:', error);
        // Update save status to failed
        setSaveStatus(prev => ({ ...prev, [tempMessageId]: 'failed' }));

        // Show subtle notification
        toast.warning("Message sent but failed to save to database");
      });

    } catch (error) {
      console.error('Error in handleSend:', error);
      toast.error("Failed to send message. Please try again.");
      
      // Remove the temporary message if there was an error
      setMessages(prev => prev.filter(msg => !msg.message_id?.startsWith('temp-')));
    } finally {
      setSending(false);
    }
  }, [messageValue, user, project, selectedTask, handleSendMessage, selectedFile, sending]);

  // Handle receiving messages
  const handleMessageReceive = useCallback((data) => {

    // Only handle messages for this project and task
    if (data.project_id === project?.project_id &&
      data.task_id === selectedTask?.task_id &&
      data.sender_id !== user?.user_id) {

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
            if (timeDiff < 5000) { // Within 5 seconds to be more lenient
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
          attachment_mime_type: data.attachment_mime_type
        }];
      });

      // Play notification sound
      audioRef.current?.play();
    } else {

    }
  }, [project?.project_id, selectedTask?.task_id, user?.user_id]);

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);




  useEffect(() => {
    if (!socketRef?.current || !project || !selectedTask || !user) return;

    const socket = socketRef.current;
    const setupListeners = () => {
      socket.on(ON_MESSAGE, handleMessageReceive);
    };

    if (socket.connected) {
      setupListeners();
    } else {
      socket.on('connect', setupListeners);
    }

    return () => {
      socket.off(ON_MESSAGE, handleMessageReceive);
      socket.off('connect', setupListeners);
    };
  }, [socketRef, project?.project_id, selectedTask?.task_id, user?.user_id, handleMessageReceive]);


  // Scroll to bottom when messages update
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-600">Please select a project to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-md relative border border-gray-200">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2">
            {projectTeamMembers.slice(0, 3).map((member, index) => (
              <AvatarCompoment key={member.user_id} name={member.name} className="w-8 h-8 text-xs" />
            ))}
            {projectTeamMembers.length > 3 && (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                +{projectTeamMembers.length - 3}
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-gray-900">{project.name}</p>
            <div className="flex items-center space-x-2">
              <ListTodo className="w-4 h-4 text-gray-500" />
              <Select value={selectedTask?.task_id?.toString() || "0"} onValueChange={handleTaskChange}>
                <SelectTrigger className="w-48 h-8 text-sm">
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Project Chat</SelectItem>
                  {projectTasks.map((task) => (
                    <SelectItem key={task.task_id} value={task.task_id.toString()}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-600">{projectTeamMembers.length} team members</p>
          </div>
        </div>
        
        {/* Date Search */}
        <div className="flex items-center space-x-2">
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 px-3 text-sm border-gray-300 hover:bg-gray-50"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {searchDate ? moment(searchDate).format('MMM DD, YYYY') : 'Search by date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={searchDate}
                onSelect={(date) => {
                  setSearchDate(date);
                  setIsDatePickerOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {searchDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateSearch}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={containerRef}>
        {loading && (
          <div className="text-center text-gray-500">Loading messages...</div>
        )}

        {/* Search Results Indicator */}
        {searchDate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Showing messages from {moment(searchDate).format('MMM DD, YYYY')}
                </span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateSearch}
                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {searchDate && filteredMessages.length === 0 && messages.length > 0 && (
          <div className="text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No messages found for {moment(searchDate).format('MMM DD, YYYY')}</p>
            <p className="text-sm">Try selecting a different date</p>
          </div>
        )}

        {filteredMessages.map((message, index) => (
          <div key={message.message_id || index} className={`flex ${message.sender_id === user?.user_id ? 'justify-end' : 'justify-start'}`}>
            <Card className={`p-3 max-w-md ${message.sender_id === user?.user_id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
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
                        {/* Save status indicator for own messages */}
                        {message.sender_id === user?.user_id && (
                          <span className="text-xs opacity-60">
                            {saveStatus[message.message_id] === 'saving' && '💾'}
                            {saveStatus[message.message_id] === 'saved' && '✅'}
                            {saveStatus[message.message_id] === 'failed' && '⚠️'}
                          </span>
                        )}
                      </div>
                      <p className="break-words">{message.content}</p>
                      
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
                    </div>
                  </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="bg-white mb-2 p-4 border-t border-gray-200">
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
          
          {/* File Upload Button */}
          <input
            id="file-upload"
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
            onClick={() => document.getElementById('file-upload').click()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
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
      </div>

      {/* Audio element for notifications */}
      <audio ref={audioRef} src="/ding.mp3" preload="auto" />
    </div>
  );
} 