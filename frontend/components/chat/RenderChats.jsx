import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AvatarCompoment from '../AvatarCompoment';
import { Button } from '../Button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { useUser } from '@/providers/UserProvider';
import { Bell, ListTodo, PanelsTopLeft, Send, Video, Text, PhoneCall, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { getConversationIdRequest, getConversationRequest, getOrCreatePrivateConversationRequest, getPrivateConversationMessagesRequest } from '@/lib/http/chat';
import moment from 'moment';
import { Skeleton } from "@/components/ui/skeleton"
import CallDialog from '../Dialogs/CallDialog';
import { toast } from 'react-toastify';

const RenderChats = ({ selectedChat, setSelectTask, selectedTask, messages, setMessages, conversationId, setConversationId, handleSendMessage, socketRef, handleCall }) => {
    const [messageValue, setMessageValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const { user } = useUser();
    const containerRef = useRef(null);
    const conversationIdRef = useRef(conversationId);

    // Update ref when conversationId changes
    useEffect(() => {
        conversationIdRef.current = conversationId;
    }, [conversationId]);

    const getConversation = useCallback(async (user_id, task_id) => {
        if (!user_id || !task_id) {
            console.error('Missing user_id or task_id for conversation');
            return;
        }

        setLoading(true);
        try {


            let res = await getOrCreatePrivateConversationRequest({ task_id, user_id });
            const conversation = res.data.conversation;
            const conversation_id = conversation.private_conversation_id;

            if (!conversation_id) {
                throw new Error('No conversation ID received from server');
            }


            setConversationId(conversation_id);
            // Update ref immediately
            conversationIdRef.current = conversation_id;

            setMessages(conversation.messages || []);

            return conversation_id; // Return the conversation ID
        } catch (error) {
            console.error('Error getting private chat conversation:', error.response?.data?.message || error.message);
            setMessages([]);
            setConversationId('');
            conversationIdRef.current = '';
            throw error; // Re-throw to be handled by caller
        } finally {
            setLoading(false);
        }
    }, [setConversationId, setMessages]);

    const handleSend = useCallback(async () => {
        if (!messageValue.trim() || !selectedChat || !user) return;

        // Prevent double sending
        if (sending) {
            return;
        }

        setSending(true);

        try {
            // Check if conversation ID is available
            if (!conversationIdRef.current) {
                const newConversationId = await getConversation(selectedChat.user_id, selectedTask.task_id);

                // Check if conversation ID was set
                if (!newConversationId) {
                    toast.error("Failed to initialize conversation. Please try again.");
                    return;
                }
            }

            const data = {
                private_conversation_id: conversationIdRef.current,
                sender_id: user.user_id,
                receiver_id: selectedChat.user_id,
                content: messageValue.trim(),
                content_type: "PLAIN_TEXT",
                sender_name: user?.name,
                task_name: selectedTask?.name,
                task_id: selectedTask?.task_id
            };

            await handleSendMessage(data);
            setMessageValue('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setSending(false);
        }
    }, [messageValue, selectedChat, user, selectedTask, handleSendMessage, sending]);

    // Debug messages state changes
    useEffect(() => {

    }, [messages]);

    useEffect(() => {
        if (selectedChat && selectedTask) {

            getConversation(selectedChat.user_id, selectedTask.task_id)
        }
    }, [selectedChat, selectedTask, getConversation]);

    // Scroll to the bottom when messages are updated
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    if (!selectedChat) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <img src="/assets/Internet-Chat-Rooms.svg" alt="Chat illustration" className="w-64 h-64 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a chat</h3>
                    <p className="text-gray-600">Choose a user to start messaging</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex-1 flex flex-col relative">
                <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <AvatarCompoment name={selectedChat.name} />
                        <div>
                            <p className="font-medium text-gray-900">{selectedChat.name} - {selectedTask?.name}</p>
                            <p className="text-sm text-gray-600">{selectedChat.active_status || 'Online'}</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCall(selectedChat)}
                            disabled={!conversationId}
                            className="text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                        >
                            <PhoneCall className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
                <div className="h-[72vh] overflow-y-auto p-2 space-y-4 overflow-x-hidden bg-gray-50" ref={containerRef}>
                    {console.log('🎨 RenderChats rendering with:', { loading, messagesLength: messages.length, messages })}
                    {
                        loading &&
                        Array(8).fill(0).map((_, index) => (
                            <Skeleton key={index} className={`h-12 ${index & 1 ? 'ml-auto' : ''}`} style={{ width: `${200 + (index * 10)}px` }} />
                        ))
                    }
                    {
                        !loading && messages.length > 0 &&
                        messages.map((message, index) => {
                            console.log('🎨 Rendering message:', message, 'at index:', index);
                            return (
                                <React.Fragment key={index}>
                                    {
                                        (message.sender_id == user?.user_id || message.sender?.user_id == user?.user_id)
                                            ?
                                            (
                                                <Card className="p-3 w-fit bg-blue-600 ml-auto text-white px-7 flex-row mr-1 mb-2 !flex gap-2 items-center">
                                                    {
                                                        message.content_type == "CALL" &&
                                                        <div className='flex items-center gap-5'>
                                                            <PhoneOutgoing />
                                                            <div>
                                                                <p className='break-words max-w-md text-xs text-white/80 uppercase'>Voice Call</p>
                                                                <p className='break-words max-w-md text-xs text-white/70 mt-1'>{message.call_status !== 'ENDED' ? message.call_status : message.duration}</p>
                                                            </div>
                                                        </div>
                                                    }

                                                    {
                                                        message.content_type == "PLAIN_TEXT" &&
                                                        <>
                                                            <p className='break-words max-w-md'>{message.content}</p>
                                                            <time className='text-white/70 text-xs font-normal'>{moment(message.createdAt).format("LT")}</time>
                                                        </>
                                                    }
                                                </Card>
                                            )
                                            :
                                            (
                                                <Card className="p-3 w-fit px-7 flex-row mr-1 mb-2 !flex gap-2 items-center bg-white border border-gray-200">
                                                    {
                                                        message.content_type == "CALL" &&
                                                        <>
                                                            {
                                                                message.call_status != "NO_RESPONSE" &&
                                                                <div className='flex items-center gap-5'>
                                                                    <PhoneIncoming className="text-gray-700" />
                                                                    <div>
                                                                        <p className='break-words max-w-md text-xs text-gray-600 uppercase'>Voice Call</p>
                                                                        <p className='break-words max-w-md text-xs text-gray-600 mt-1'>{message.call_status !== 'ENDED' ? message.call_status : message.duration}</p>
                                                                    </div>
                                                                </div>
                                                            }

                                                            {
                                                                message.call_status == "NO_RESPONSE" &&
                                                                <div className='flex items-center gap-5 text-red-500 cursor-pointer hover:text-red-600' onClick={() => handleCall(selectedChat)}>
                                                                    <PhoneIncoming />
                                                                    <div>
                                                                        <p className='break-words max-w-md text-xs uppercase'>Voice Call</p>
                                                                        <p className='break-words max-w-md text-xs mt-1'>You Missed Call Click To Callback</p>
                                                                    </div>
                                                                </div>
                                                            }
                                                        </>
                                                    }

                                                    {
                                                        message.content_type == "PLAIN_TEXT" &&
                                                        <>
                                                            <time className='text-gray-500 text-xs font-normal'>{moment(message.createdAt).format("LT")}</time>
                                                            <p className='break-words max-w-md text-gray-900'>{message.content}</p>
                                                        </>
                                                    }
                                                </Card>
                                            )
                                    }
                                </React.Fragment>
                            );
                        })
                    }

                    {
                        !loading && messages.length == 0 &&
                        <div className='h-full w-full flex items-center justify-center'>
                            <img src='/assets/no-message.png' alt="No messages" />
                        </div>
                    }
                </div>
                <div className="bg-white p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="icon"
                                    className="bg-blue-600 text-white hover:bg-blue-700 transition-all"
                                >
                                    <Text className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-white border-gray-200">
                                <DropdownMenuLabel className="text-gray-900">Projects</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    {
                                        user && user?.Projects?.map(project => (
                                            <DropdownMenuSub key={project.project_id}>
                                                <DropdownMenuSubTrigger className="text-gray-700 hover:!bg-blue-50 hover:!text-blue-600">
                                                    <PanelsTopLeft className="mr-2 h-4 w-4" />
                                                    <span>{project.name}</span>
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent className="bg-white border-gray-200">
                                                        {/* Project Chat Option */}
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                const firstTask = project?.Tasks?.[0];
                                                                if (firstTask) setSelectTask(firstTask);
                                                            }}
                                                            className="text-gray-700 hover:!bg-blue-50 hover:!text-blue-600"
                                                        >
                                                            <ListTodo className="mr-2 h-4 w-4" />
                                                            <span>Project Chat</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {
                                                            project?.Tasks?.map((task) => (
                                                                <DropdownMenuItem
                                                                    key={task.task_id}
                                                                    onClick={() => setSelectTask(task)}
                                                                    className="text-gray-700 hover:!bg-blue-50 hover:!text-blue-600"
                                                                >
                                                                    <ListTodo className="mr-2 h-4 w-4" />
                                                                    <span>{task.name}</span>
                                                                </DropdownMenuItem>
                                                            ))
                                                        }
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                        ))
                                    }
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Input
                            className="flex-1 bg-white text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Type a message here"
                            value={messageValue}
                            onChange={(e) => setMessageValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={sending}
                        />
                        <Button
                            size="icon"
                            className="bg-blue-600 text-white hover:bg-blue-700 transition-all"
                            onClick={handleSend}
                            disabled={sending || !messageValue.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default RenderChats