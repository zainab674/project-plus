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
        });

        // Listen for new email notifications
        socketRef.current.on('new_emails', (data) => {
            toast.info(`You have ${data.count} new email${data.count > 1 ? 's' : ''}!`);
        });

        return () => {
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

       

        if (socketRef.current && socketRef.current.connected) {
          
            
            // Use private chat event for new system, regular message event for old system
            const eventName = data.private_conversation_id ? ON_PRIVATE_MESSAGE : ON_MESSAGE;
         
            socketRef.current.emit(eventName, data);
        } else {
            console.error('❌ Socket not connected, cannot send message');
            toast.error("Connection lost. Trying to reconnect...");
            // Try to reconnect and send the message
            if (socketRef.current) {
                socketRef.current.connect();

                // Wait for connection and then send
                socketRef.current.once('connect', () => {
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
        } else {
            console.error('❌ useChatHook: Socket not connected, cannot send project message');
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