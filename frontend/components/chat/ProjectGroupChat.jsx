import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Users, MessageCircle, X } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import useChatHook from '@/hooks/useChatHook';
import { ON_PROJECT_MESSAGE_RECEIVED } from '@/contstant/chatEventConstant';
import { toast } from 'react-toastify';
import moment from 'moment';
import AvatarCompoment from '../AvatarCompoment';
import { getProjectChatMessagesRequest } from '@/lib/http/chat';

const ProjectGroupChat = ({ project, isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [messageValue, setMessageValue] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useUser();
    const { handleJoinProjectRoom, handleLeaveProjectRoom, handleSendProjectMessage, socketRef } = useChatHook();
    const containerRef = useRef(null);
    const audioRef = useRef();

    // Initialize audio for notifications
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new window.Audio('/ding.mp3');
        }
    }, []);

    // Load existing messages when component mounts
    const loadMessages = useCallback(async () => {
        if (!project || !user) return;
        
        setLoading(true);
        try {
            const response = await getProjectChatMessagesRequest(project.project_id);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Failed to load messages:', error);
            toast.error('Failed to load chat messages');
        } finally {
            setLoading(false);
        }
    }, [project, user]);

    // Join project room and load messages when component mounts
    useEffect(() => {
        if (isOpen && project && user) {
            handleJoinProjectRoom(project.project_id);
            loadMessages();
        }

        return () => {
            if (project && user) {
                handleLeaveProjectRoom(project.project_id);
            }
        };
    }, [isOpen, project, user, handleJoinProjectRoom, handleLeaveProjectRoom, loadMessages]);

    // Handle incoming project messages
    const handleProjectMessageReceived = useCallback((data) => {
        if (data.project_id === project?.project_id) {
            setMessages(prev => [...prev, data]);
            
            // Play notification sound if message is from another user
            if (data.sender_id !== user?.user_id) {
                audioRef.current?.play();
                toast.info(`${data.sender_name}: ${data.content}`);
            }
        }
    }, [project?.project_id, user?.user_id]);

    // Subscribe to project message events
    useEffect(() => {
        if (socketRef?.current) {
            socketRef.current.on(ON_PROJECT_MESSAGE_RECEIVED, handleProjectMessageReceived);
            socketRef.current.on('user-joined-project', (data) => {
                if (data.project_id === project?.project_id) {
                    toast.info('A team member joined the chat');
                }
            });
            socketRef.current.on('user-left-project', (data) => {
                if (data.project_id === project?.project_id) {
                    toast.info('A team member left the chat');
                }
            });
        }

        return () => {
            if (socketRef?.current) {
                socketRef.current.off(ON_PROJECT_MESSAGE_RECEIVED, handleProjectMessageReceived);
                socketRef.current.off('user-joined-project');
                socketRef.current.off('user-left-project');
            }
        };
    }, [socketRef?.current, handleProjectMessageReceived, project?.project_id]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = useCallback(() => {
        if (!messageValue.trim() || !project || !user) return;

        const messageData = {
            project_id: project.project_id,
            sender_id: user.user_id,
            content: messageValue.trim(),
            content_type: "PLAIN_TEXT"
        };

        handleSendProjectMessage(messageData);
        setMessageValue('');
    }, [messageValue, project, user, handleSendProjectMessage]);

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    if (!isOpen || !project) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
                <CardHeader className="flex-shrink-0 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <MessageCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{project.name} - Team Chat</CardTitle>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    Project Group Chat
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                    {/* Messages Area */}
                    <div 
                        ref={containerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4"
                    >
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p>Loading messages...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((message, index) => (
                                <div
                                    key={message.message_id || index}
                                    className={`flex gap-3 ${
                                        message.sender_id === user?.user_id ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    {message.sender_id !== user?.user_id && (
                                        <AvatarCompoment name={message.sender_name} />
                                    )}
                                    <div
                                        className={`max-w-[70%] ${
                                            message.sender_id === user?.user_id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                        } rounded-lg px-4 py-2`}
                                    >
                                        {message.sender_id !== user?.user_id && (
                                            <p className="text-xs font-medium mb-1 opacity-80">
                                                {message.sender_name}
                                            </p>
                                        )}
                                        <p className="text-sm">{message.content}</p>
                                        <p className={`text-xs mt-1 ${
                                            message.sender_id === user?.user_id 
                                                ? 'text-blue-100' 
                                                : 'text-gray-500'
                                        }`}>
                                            {moment(message.createdAt).format('HH:mm')}
                                        </p>
                                    </div>
                                    {message.sender_id === user?.user_id && (
                                        <AvatarCompoment name={user.name} />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Message Input */}
                    <div className="border-t p-4 flex-shrink-0">
                        <div className="flex gap-2">
                            <Input
                                value={messageValue}
                                onChange={(e) => setMessageValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1"
                                disabled={loading}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!messageValue.trim() || loading}
                                size="sm"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProjectGroupChat; 