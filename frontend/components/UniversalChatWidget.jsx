"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, 
  StickyNote, 
  X, 
  Send, 
  Paperclip, 
  Users, 
  Briefcase, 
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  FileText,
  Image,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useContextDetection } from '@/hooks/useContextDetection';
import { useUser } from '@/providers/UserProvider';
import useChatHook from '@/hooks/useChatHook';
import { useProjectState } from '@/hooks/useProjectState';
import { createNoteRequest } from '@/lib/http/notes';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ChatModal from '@/components/modals/chatModal';
import TaskComments from '@/components/TaskComments';

const UniversalChatWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'notes'
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatWidgetPosition');
      return saved ? JSON.parse(saved) : { x: 'calc(100% - 200px)', y: '16px' };
    }
    return { x: 'calc(100% - 200px)', y: '16px' };
  });
  
  const router = useRouter();
  const fileInputRef = useRef(null);
  const widgetRef = useRef(null);
  const dragRef = useRef(null);
  
  const { user, loadUserWithProjects } = useUser();
  const { 
    context, 
    getProjectDetails, 
    getTaskDetails, 
    getAvailableTasks, 
    getProjectMembers,
    hasProject,
    hasTask,
    hasHighConfidence
  } = useContextDetection();
  
  const { handleSendMessage } = useChatHook();
  const { projects, fetchProjects, projectsLoading } = useProjectState(user, loadUserWithProjects);

  

  // Fetch projects on component mount
  useEffect(() => {
    if (!projects) {
      fetchProjects();
    }
  }, [projects, fetchProjects]);

  // Set initial selected project based on context or first available project
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      // If we have context with a project, try to find it in the projects list
      if (context?.project_id) {
        const contextProject = projects.find(p => p.project_id === context.project_id);
        if (contextProject) {
          setSelectedProject(contextProject);
          return;
        }
      }
      // Otherwise, select the first project
      setSelectedProject(projects[0]);
    }
  }, [projects, context, selectedProject]);

  // Auto-expansion removed - widget will only expand when manually clicked

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        // Don't close if a Select dropdown is open
        if (!isSelectOpen) {
          setShowContextMenu(false);
        } else {
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSelectOpen]);

  // Drag functionality
  const handleDragStart = (e) => {
    if (dragRef.current && dragRef.current.contains(e.target)) {
      setIsDragging(true);
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      e.preventDefault();
    }
  };

  const handleDragMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep widget within viewport bounds
      const maxX = window.innerWidth - (isExpanded ? 384 : 80); // widget width
      const maxY = window.innerHeight - (isExpanded ? 500 : 80); // widget height
      
      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({ x: boundedX, y: boundedY });
    }
  };

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem('chatWidgetPosition', JSON.stringify(position));
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset, position]);

  // Use selected project or fall back to context
  const currentProject = selectedProject || getProjectDetails();
  const task = getTaskDetails();
  const availableTasks = selectedProject?.Tasks || getAvailableTasks();
  const projectMembers = selectedProject?.Members || getProjectMembers();

  // Get project for chat modal (prefer selectedProject, fallback to currentProject)
  const projectForChat = selectedProject || currentProject;

  const handleSendChat = useCallback(async () => {
    const projectId = selectedProject?.project_id || context?.project_id;
    if (!message.trim() || !projectId || isSending) return;


    setIsSending(true);
    try {
      const messageData = {
        sender_id: user.user_id,
        receiver_id: selectedMember?.user_id || null,
        content: message.trim(),
        conversation_id: `project-${projectId}-${selectedTask?.task_id || 0}`,
        content_type: "PLAIN_TEXT",
        createdAt: new Date(),
        sender_name: user?.name,
        task_name: selectedTask?.name || task?.name || "General",
        task_id: selectedTask?.task_id || task?.task_id || 0, // Use 0 for general project chat
        project_id: projectId,
        is_group_chat: !selectedMember, // Group chat if no specific member selected
        attachment_url: selectedFile ? 'uploading...' : null,
        attachment_name: selectedFile?.name,
        attachment_size: selectedFile?.size,
        attachment_mime_type: selectedFile?.type
      };

      
      // Use handleSendMessage for project messages (same as ProjectChat)
      await handleSendMessage(messageData);
      
      
      setMessage('');
      setSelectedFile(null);
      setSelectedMember(null);
      
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('❌ UniversalChatWidget: Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [message, selectedProject, context, user, selectedMember, selectedTask, task, handleSendMessage, selectedFile, isSending]);

  const handleSaveNote = useCallback(async () => {
    const projectId = selectedProject?.project_id || context?.project_id;
    if (!note.trim() || !projectId || isSending) return;

    setIsSending(true);
    try {
      const noteData = {
        project_id: projectId,
        task_id: selectedTask?.task_id || context.task_id || null,
        content: note.trim(),
        note_type: 'general'
      };

      await createNoteRequest(noteData);
      setNote('');
      
      toast.success('Note saved successfully!');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSending(false);
    }
  }, [note, selectedProject, context, selectedTask, isSending]);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const getContextDisplay = () => {
    if (selectedProject) {
      return selectedProject.name || `Project ${selectedProject.project_id}`;
    }
    
    if (!context) return 'No Context';
    
    const parts = [];
    if (context.project_name || context.project_id) {
      parts.push(context.project_name || `Project ${context.project_id}`);
    }
    if (context.task_name || context.task_id) {
      parts.push(context.task_name || `Task ${context.task_id}`);
    }
    
    return parts.join(' - ') || 'General';
  };

  const getConfidenceColor = () => {
    switch (context?.confidence) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!hasProject && !selectedProject) {
    return null; // Don't show widget if no project context or selected project
  }

  return (
    <div 
      ref={widgetRef}
      className={`fixed z-50 transition-all duration-300 ${
        isExpanded ? 'w-96' : 'w-20'
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{
        left: typeof position.x === 'number' ? `${position.x}px` : position.x,
        top: typeof position.y === 'number' ? `${position.y}px` : position.y
      }}
      onMouseDown={handleDragStart}
    >
      {/* Context Indicator */}
      {context && (
        <div className="absolute -top-12 left-10 bg-gray-800 text-white text-xs px-3 py-1 rounded-lg shadow-lg max-w-64">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getConfidenceColor()}`}></div>
            <span className="truncate">{getContextDisplay()}</span>
          </div>
        </div>
      )}

      {/* Main Widget */}
      <div className={`bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-300 ${
        isExpanded ? 'h-[500px]' : 'h-20'
      }`}>
        {!isExpanded ? (
          /* Collapsed State */
          <div className="flex items-center justify-center h-full relative">
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageCircle className="w-8 h-8" />
            </button>
            {/* Drag Handle */}
            <div
              ref={dragRef}
              className="absolute top-1 right-1 w-6 h-6 bg-blue-500 rounded cursor-grab hover:bg-blue-600 flex items-center justify-center text-white text-xs font-bold"
              title="Drag to move widget"
            >
              ⋮⋮
            </div>
          </div>
        ) : (
          /* Expanded State */
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 relative">
              {/* Drag Handle for expanded state */}
              <div
                ref={dragRef}
                className="absolute top-1 left-1 w-6 h-6 bg-gray-500 rounded cursor-grab hover:bg-gray-600 flex items-center justify-center text-white text-xs font-bold"
                title="Drag to move widget"
              >
                ⋮⋮
              </div>
              <div className="flex items-center gap-2 ml-8">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      activeTab === 'chat' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      activeTab === 'notes' 
                        ? 'bg-green-100 text-green-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <StickyNote className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowContextMenu(!showContextMenu);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Context Menu */}
            {showContextMenu && (
              <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-48">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-600 px-2">Project</div>
                  <Select 
                    value={selectedProject?.project_id?.toString() || ''} 
                    onValueChange={(value) => {
                     
                      const project = projects?.find(p => p.project_id.toString() === value);
                      setSelectedProject(project || null);
                      // Reset task and member when project changes
                      setSelectedTask(null);
                      setSelectedMember(null);
                    }}
                    onOpenChange={(open) => setIsSelectOpen(open)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsLoading ? (
                        <SelectItem value="loading" disabled>Loading projects...</SelectItem>
                      ) : projects && projects.length > 0 ? (
                        projects.map(project => (
                          <SelectItem key={project.project_id} value={project.project_id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-projects" disabled>No projects available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {availableTasks && availableTasks.length > 0 && (
                    <>
                      <div className="text-xs font-medium text-gray-600 px-2">Task</div>
                      <Select 
                        value={selectedTask?.task_id?.toString() || 'general'} 
                        onValueChange={(value) => {
                          if (value === 'general') {
                            setSelectedTask(null);
                          } else {
                            const task = availableTasks.find(t => t.task_id.toString() === value);
                            setSelectedTask(task || null);
                          }
                        }}
                        onOpenChange={(open) => setIsSelectOpen(open)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select task" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          {availableTasks
                            .filter(task => task.task_id != null)
                            .map(task => (
                              <SelectItem key={task.task_id} value={task.task_id.toString()}>
                                {task.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}

                  {projectMembers && projectMembers.length > 0 && (
                    <>
                      <Select 
                        value={selectedMember?.user_id?.toString() || 'everyone'} 
                        onValueChange={(value) => {
                          if (value === 'everyone') {
                            setSelectedMember(null);
                          } else {
                            const member = projectMembers.find(m => m.user_id.toString() === value);
                            setSelectedMember(member || null);
                          }
                        }}
                        onOpenChange={(open) => setIsSelectOpen(open)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Everyone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="everyone">Everyone</SelectItem>
                          {projectMembers
                            .filter(member => member.user_id != null)
                            .map(member => (
                              <SelectItem key={member.user_id} value={member.user_id.toString()}>
                                {member.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 p-3 space-y-3">
              {activeTab === 'chat' ? (
                /* Chat Tab */
                <div className="space-y-3">
                  {/* View Chat Button */}
                  {projectForChat && (
                    <Button
                      onClick={() => {
                        if (projectForChat?.project_id) {
                          router.push(`/dashboard/project/${projectForChat.project_id}/chat`);
                        }
                      }}
                      variant="outline"
                      className="w-full flex items-center gap-2 h-8 text-xs"
                    >
                      <Eye className="w-4 h-4" />
                      View Group Chat
                    </Button>
                  )}
                  
                  <div className="text-xs text-gray-600">
                    {selectedMember ? `Sending to ${selectedMember.name}` : 'Group chat'}
                    {selectedTask && ` • ${selectedTask.name}`}
                    {selectedProject && ` • ${selectedProject.name}`}
                  </div>
                  
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="min-h-20 text-sm resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                  />

                  {/* File Attachment */}
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    />
                    
                    {selectedFile ? (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="flex-1 truncate">{selectedFile.name}</span>
                        <button onClick={removeFile} className="text-red-600 hover:text-red-800">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800"
                      >
                        <Paperclip className="w-4 h-4" />
                        Attach file
                      </button>
                    )}
                  </div>

                  <Button
                    onClick={handleSendChat}
                    disabled={!message.trim() || isSending}
                    className="w-full h-8 text-xs"
                  >
                    {isSending ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              ) : (
                /* Notes Tab */
                <div className="space-y-3">
                  {/* View Notes Button */}
                  {projectForChat && (
                    <Button
                      onClick={() => setIsNotesModalOpen(true)}
                      variant="outline"
                      className="w-full flex items-center gap-2 h-8 text-xs"
                    >
                      <Eye className="w-4 h-4" />
                      View All Notes
                    </Button>
                  )}
                  
                  <div className="text-xs text-gray-600">
                    {selectedTask ? `Note for ${selectedTask.name}` : 'Project note'}
                    {selectedProject && ` • ${selectedProject.name}`}
                  </div>
                  
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note..."
                    className="min-h-20 text-sm resize-none"
                  />

                  <Button
                    onClick={handleSaveNote}
                    disabled={!note.trim() || isSending}
                    className="w-full h-8 text-xs bg-green-600 hover:bg-green-700"
                  >
                    {isSending ? 'Saving...' : 'Save Note'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {projectForChat && (
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          project={projectForChat}
        />
      )}

      {/* Notes Modal - TaskComments */}
      {projectForChat && (
        <TaskComments
          open={isNotesModalOpen}
          onClose={() => setIsNotesModalOpen(false)}
          project_id={projectForChat.project_id}
          project={projectForChat}
        />
      )}
    </div>
  );
};

export default UniversalChatWidget;
