import { ON_CALL, ON_CALL_ANSWER, ON_CALL_END, ON_CALL_NO_RESPONSE, ON_MESSAGE, ON_PRIVATE_MESSAGE, ON_SIGNAL, ON_JOIN_PROJECT_ROOM, ON_LEAVE_PROJECT_ROOM, ON_PROJECT_MESSAGE, ON_PROJECT_MESSAGE_RECEIVED } from '@/contstant/chatEventConstant';
import { useUser } from '@/providers/UserProvider';
import { useCallback, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const useChatHook = () => {
    const socketRef = useRef(null);
    const { user } = useUser();

    useEffect(() => {
        if (!user || socketRef.current?.connected) return;

        console.log('Initializing socket connection for user:', user.user_id);

        // Clean up previous socket if still around
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8978';
        socketRef.current = io(`${API_URL}/chat`, {
            query: { user_id: user.user_id },
            transports: ['websocket'],
            forceNew: true,
        });

        socketRef.current.on('connect', () => {
            console.log('✅ Socket connected successfully');
            console.log('🔌 Socket ID:', socketRef.current.id);
            console.log('🌐 Connected to:', `${API_URL}/chat`);
            
            // Test the connection by emitting a test event
            socketRef.current.emit('test', { message: 'Connection test', user_id: user.user_id });
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            console.error('❌ Error details:', error.message);
        });

        socketRef.current.on('disconnect', (reason) => {
            console.warn('Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                socketRef.current.connect();
            }
        });

        socketRef.current.on('test-response', (data) => {
            console.log('🧪 Test response received:', data);
        });

        // Listen for new email notifications
        socketRef.current.on('new_emails', (data) => {
            console.log('📧 New emails received:', data);
            toast.info(`You have ${data.count} new email${data.count > 1 ? 's' : ''}!`);
        });

        return () => {
            console.log("Cleaning up socket listeners");
            socketRef.current?.disconnect();
        };
    }, [user?.user_id]);

    const handleSendMessage = useCallback((data) => {
        // Check for either conversation_id (old system) or private_conversation_id (new system)
        if (!data.conversation_id && !data.private_conversation_id) {
            console.error('Conversation ID is missing');
            toast.error("Failed to send: Conversation not initialized");
            throw new Error('Conversation ID is missing');
        }

        // sender_id,reciever_id,content,conversation_id,content_type
        console.log('🚀 handleSendMessage called with data:', data);
        console.log('🔌 Socket connected:', socketRef.current?.connected);
        console.log('🔌 Socket ID:', socketRef.current?.id);

        if (socketRef.current && socketRef.current.connected) {
            console.log('📤 Emitting message through socket');
            console.log('📤 Message data being sent:', data);
            console.log('🔌 Socket connection status:', {
                connected: socketRef.current.connected,
                id: socketRef.current.id,
                readyState: socketRef.current.io.readyState
            });
            
            // Use private chat event for new system, regular message event for old system
            const eventName = data.private_conversation_id ? ON_PRIVATE_MESSAGE : ON_MESSAGE;
            console.log('📤 About to emit message with event:', eventName);
            console.log('📤 Message data being emitted:', data);
            socketRef.current.emit(eventName, data);
            console.log('✅ Message emitted successfully with event:', eventName);
        } else {
            console.error('❌ Socket not connected, cannot send message');
            toast.error("Connection lost. Trying to reconnect...");
            // Try to reconnect and send the message
            if (socketRef.current) {
                console.log('🔄 Attempting to reconnect and send message...');
                socketRef.current.connect();

                // Wait for connection and then send
                socketRef.current.once('connect', () => {
                    console.log('✅ Reconnected, sending message...');
                    const eventName = data.private_conversation_id ? ON_PRIVATE_MESSAGE : ON_MESSAGE;
                    socketRef.current.emit(eventName, data);
                });
            } else {
                console.error('❌ No socket reference available');
                toast.error("Connection failed. Please refresh the page.");
                throw new Error('Socket not available');
            }
        }
    }, []);

    const handleCall = useCallback((data) => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit(ON_CALL, data);
        }
    }, []);

    const handleCallAnswer = useCallback((data) => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit(ON_CALL_ANSWER, data);
        }
    }, []);

    const handleSendSignal = useCallback((data) => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit(ON_SIGNAL, data);
        }
    }, []);

    const handleCallEnd = useCallback((data) => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit(ON_CALL_END, data);
        }
    }, []);

    const handelNoResponse = useCallback((data) => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit(ON_CALL_NO_RESPONSE, data);
        }
    }, []);

    // Project Group Chat Functions
    const handleJoinProjectRoom = useCallback((project_id) => {
        if (socketRef.current && socketRef.current.connected && user) {
            socketRef.current.emit(ON_JOIN_PROJECT_ROOM, {
                project_id: project_id,
                user_id: user.user_id
            });
        }
    }, [user]);

    const handleLeaveProjectRoom = useCallback((project_id) => {
        if (socketRef.current && socketRef.current.connected && user) {
            socketRef.current.emit(ON_LEAVE_PROJECT_ROOM, {
                project_id: project_id,
                user_id: user.user_id
            });
        }
    }, [user]);

    const handleSendProjectMessage = useCallback((data) => {
        // project_id, sender_id, content, content_type
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit(ON_PROJECT_MESSAGE, data);
        }
    }, []);

    return {
        handleSendMessage,
        handleCall,
        handleCallAnswer,
        handleSendSignal,
        handleCallEnd,
        handelNoResponse,
        socketRef,
        // Project Group Chat
        handleJoinProjectRoom,
        handleLeaveProjectRoom,
        handleSendProjectMessage
    };
};

export default useChatHook;