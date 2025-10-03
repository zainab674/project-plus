import { ON_CALL, ON_CALL_ANSWER, ON_CALL_END, ON_CALL_NO_RESPONSE, ON_MESSAGE, ON_PRIVATE_MESSAGE, ON_SIGNAL, REDIS_CHANNEL, ON_JOIN_PROJECT_ROOM, ON_LEAVE_PROJECT_ROOM, ON_PROJECT_MESSAGE } from "../constants/chatEventConstant.js";
import { userSocketMap } from "../constants/userSocketMapConstant.js";
// import { produceChat } from "./kafkaService.js";
import { prisma } from "../prisma/index.js";
import { RedisEvent } from "../constants/redisEventConstant.js"
import chatNotificationService from "./chatNotificationService.js";

export const handleDisconnect = (config) => {
    //delete user id user socket is map
    const user_id = config.user_id;
    userSocketMap.delete(user_id);

    updateActiveStatus("Offline", user_id);
}

// Broadcast group chat message to all connected users
export const broadcastGroupChatMessage = (messageData, io) => {

    // Emit to all connected users
    io.emit(ON_MESSAGE, messageData);
};

export const handleMessage = async (data, redis, io) => {

    // Validate required fields
    if (!data.conversation_id || !data.sender_id || !data.content) {
        console.error('❌ Missing required fields in message data:', {
            conversation_id: data.conversation_id,
            sender_id: data.sender_id,
            content: data.content
        });
        return;
    }

    // Save message to database first (for group chat messages)
    try {
        const messageData = {
            conversation_id: data.conversation_id,
            sender_id: parseInt(data.sender_id),
            reciever_id: data.reciever_id ? parseInt(data.reciever_id) : null, // Handle group chat
            content: data.content,
            content_type: data.content_type || "PLAIN_TEXT",
            createdAt: new Date(),
            project_id: data.project_id ? parseInt(data.project_id) : null,
            task_id: data.task_id ? parseInt(data.task_id) : null,
            is_group_chat: data.is_group_chat || false
        };


        // Use prisma.message.create instead of addChatMessage for better error handling
        const savedMessage = await prisma.message.create({
            data: messageData
        });


        // Add the saved message data to the broadcast
        const broadcastData = {
            ...data,
            message_id: savedMessage.message_id,
            createdAt: savedMessage.createdAt,
            // Ensure all fields from the original data are preserved
            sender_name: data.sender_name,
            task_name: data.task_name,
            task_id: data.task_id
        };


        if (redis) {
            const redisPublishData = {
                ...broadcastData,
                event: RedisEvent.onMessage
            }
            redis.publish(REDIS_CHANNEL, JSON.stringify(redisPublishData));
        } else {
            // If Redis is not available, emit directly to all team members
            if (data.is_group_chat && data.project_id) {
                // Emit to all connected users (in a real app, you'd filter by project members)
                io.emit(ON_MESSAGE, broadcastData);

                // Send real-time notification for group message
                chatNotificationService.notifyGroupMessage(broadcastData);
            } else if (data.reciever_id) {
                // Individual message
                let receiverSocketId = userSocketMap.get(data.reciever_id.toString());
                if (!receiverSocketId) {
                    receiverSocketId = userSocketMap.get(parseInt(data.reciever_id));
                }

                if (receiverSocketId && io) {
                    io.to(receiverSocketId).emit(ON_MESSAGE, broadcastData);

                    // Send real-time notification for private message
                    chatNotificationService.notifyPrivateMessage(broadcastData);
                } else {

                }
            } else {
                // Public message - broadcast to all users
                io.emit(ON_MESSAGE, broadcastData);

                // Send real-time notification for public message
                chatNotificationService.notifyPublicMessage(broadcastData);
            }
        }

    } catch (error) {
        console.error('❌ Error saving message to database:', error);
        console.error('❌ Error details:', error.message);
        // Still try to send the message even if database save fails
        if (redis) {
            const redisPublishData = {
                ...data,
                event: RedisEvent.onMessage
            }
            redis.publish(REDIS_CHANNEL, JSON.stringify(redisPublishData));
        } else {
            if (data.is_group_chat && data.project_id) {
                io.emit(ON_MESSAGE, data);
            } else if (data.reciever_id) {
                const receiverSocketId = userSocketMap.get(data.reciever_id.toString());
                if (!receiverSocketId) {
                    receiverSocketId = userSocketMap.get(parseInt(data.reciever_id));
                }
                if (receiverSocketId && io) {
                    io.to(receiverSocketId).emit(ON_MESSAGE, data);
                }
            }
        }
    }
}

// Project Group Chat Handlers
export const handleJoinProjectRoom = async (data, socket, io) => {
    const { project_id, user_id } = data;

    // Verify user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
        where: {
            project_id: parseInt(project_id),
            user_id: parseInt(user_id)
        }
    });

    if (!projectMember) {
        socket.emit('error', { message: 'You are not a member of this project' });
        return;
    }

    // Join the project room
    const roomName = `project-${project_id}`;
    socket.join(roomName);


    // Notify other members in the room
    socket.to(roomName).emit('user-joined-project', {
        user_id: parseInt(user_id),
        project_id: parseInt(project_id),
        timestamp: new Date()
    });
}

export const handleLeaveProjectRoom = async (data, socket, io) => {
    const { project_id, user_id } = data;
    const roomName = `project-${project_id}`;

    socket.leave(roomName);


    // Notify other members in the room
    socket.to(roomName).emit('user-left-project', {
        user_id: parseInt(user_id),
        project_id: parseInt(project_id),
        timestamp: new Date()
    });
}

export const handleProjectMessage = async (data, redis, io) => {
    const { project_id, sender_id, content, content_type = "PLAIN_TEXT" } = data;

    // Verify user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
        where: {
            project_id: parseInt(project_id),
            user_id: parseInt(sender_id)
        },
        include: {
            user: {
                select: {
                    name: true
                }
            }
        }
    });

    if (!projectMember) {
        return;
    }

    // Get or create project group conversation
    let conversation = await prisma.conversation.findFirst({
        where: {
            project_id: parseInt(project_id),
            isGroup: true
        }
    });

    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                project_id: parseInt(project_id),
                isGroup: true,
                name: `Project ${project_id} Chat`,
                participants: {
                    create: await prisma.projectMember.findMany({
                        where: { project_id: parseInt(project_id) },
                        select: { user_id: true }
                    }).then(members =>
                        members.map(member => ({ user_id: member.user_id }))
                    )
                }
            }
        });
    }

    // Save message to database
    const message = await prisma.message.create({
        data: {
            conversation_id: conversation.conversation_id,
            sender_id: parseInt(sender_id),
            reciever_id: parseInt(project_id), // Using project_id as receiver for group chat
            content: content,
            content_type: content_type
        }
    });

    // Prepare message data for broadcasting
    const messageData = {
        message_id: message.message_id,
        project_id: parseInt(project_id),
        sender_id: parseInt(sender_id),
        sender_name: projectMember.user.name,
        content: content,
        content_type: content_type,
        createdAt: message.createdAt,
        event: RedisEvent.onProjectMessage
    };

    // Broadcast to all members in the project room
    const roomName = `project-${project_id}`;
    io.to(roomName).emit(ON_PROJECT_MESSAGE_RECEIVED, messageData);

    // Send real-time notification for project message
    chatNotificationService.notifyProjectMessage(messageData);

    // Also publish to Redis for cross-server communication
    redis.publish(REDIS_CHANNEL, JSON.stringify(messageData));
}

export const handlePrivateMessage = async (data, redis, io) => {
    console.log('🔍 Handling private message:', data);

    // Validate required fields for private messages
    if (!data.private_conversation_id || !data.sender_id || !data.receiver_id || !data.content) {
        console.error('❌ Missing required fields in private message data:', {
            private_conversation_id: data.private_conversation_id,
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            content: data.content
        });
        return;
    }

    try {
        // Save private message to database
        const privateMessageData = {
            private_conversation_id: data.private_conversation_id,
            sender_id: parseInt(data.sender_id),
            receiver_id: parseInt(data.receiver_id),
            content: data.content,
            content_type: data.content_type || "PLAIN_TEXT",
            created_at: new Date()
        };

        const savedPrivateMessage = await prisma.privateMessage.create({
            data: privateMessageData,
            include: {
                sender: {
                    select: {
                        user_id: true,
                        name: true,
                        email: true
                    }
                },
                receiver: {
                    select: {
                        user_id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        console.log('✅ Private message saved to database:', savedPrivateMessage.private_message_id);

        // Prepare broadcast data
        const broadcastData = {
            private_message_id: savedPrivateMessage.private_message_id,
            private_conversation_id: data.private_conversation_id,
            sender_id: parseInt(data.sender_id),
            receiver_id: parseInt(data.receiver_id),
            content: data.content,
            content_type: data.content_type || "PLAIN_TEXT",
            created_at: savedPrivateMessage.created_at,
            sender: savedPrivateMessage.sender,
            receiver: savedPrivateMessage.receiver,
            attachment_url: data.attachment_url || null,
            attachment_name: data.attachment_name || null,
            attachment_size: data.attachment_size || null,
            attachment_mime_type: data.attachment_mime_type || null
        };


        if (redis) {
            const redisPublishData = {
                ...broadcastData,
                event: RedisEvent.onPrivateMessage
            };
            redis.publish(REDIS_CHANNEL, JSON.stringify(redisPublishData));
            console.log('✅ Private message published to Redis');
        } else {
            // If Redis is not available, emit directly to the receiver



            // Get receiver's socket ID
            let receiverSocketId = userSocketMap.get(data.receiver_id.toString());
            if (!receiverSocketId) {
                receiverSocketId = userSocketMap.get(parseInt(data.receiver_id));
            }




            // Emit to receiver
            if (receiverSocketId) {
                console.log('✅ Broadcasting to receiver socket:', receiverSocketId);
                io.to(receiverSocketId).emit(ON_PRIVATE_MESSAGE, broadcastData);

                // Send real-time notification for private message
                chatNotificationService.notifyPrivateMessage(broadcastData);
            } else {
                console.warn('⚠️ Receiver not online, message saved but not delivered');

            }

            // Also emit back to sender for confirmation
            let senderSocketId = userSocketMap.get(data.sender_id.toString());
            if (!senderSocketId) {
                senderSocketId = userSocketMap.get(parseInt(data.sender_id));
            }

            if (senderSocketId) {
                console.log('✅ Broadcasting to sender socket:', senderSocketId);
                io.to(senderSocketId).emit(ON_PRIVATE_MESSAGE, broadcastData);
            } else {
                console.log('⚠️ Sender socket not found for ID:', data.sender_id);
            }
        }

    } catch (error) {
        console.error('❌ Error saving private message:', error);
        throw error;
    }
};

export const initRedisSubcriber = (redis, io) => {
    redis.subscribe(REDIS_CHANNEL, (err, count) => {
        if (err) {
            console.error('Failed to subscribe:', err.message);
        } else {
        }
    });

    redis.on('message', (channel, message) => {
        if (channel == REDIS_CHANNEL) {
            const parseMessage = JSON.parse(message);
            const reciever_id = parseMessage.reciever_id;



            //handle text message
            if (parseMessage.event == RedisEvent.onMessage) {


                if (parseMessage.is_group_chat && parseMessage.project_id) {
                    // Group chat message - broadcast to all connected users
                    io.emit(ON_MESSAGE, parseMessage);

                    // Send notification for group message
                    chatNotificationService.notifyGroupMessage(parseMessage);
                } else if (reciever_id) {
                    // Individual message
                    let recieverSocketId = userSocketMap.get(reciever_id.toString());
                    if (!recieverSocketId) {
                        recieverSocketId = userSocketMap.get(parseInt(reciever_id));
                    }



                    if (recieverSocketId) {
                        io.to(recieverSocketId).emit(ON_MESSAGE, parseMessage);

                        // Send notification for private message
                        chatNotificationService.notifyPrivateMessage(parseMessage);
                    } else {

                    }
                } else {
                    // Public message - broadcast to all users
                    io.emit(ON_MESSAGE, parseMessage);

                    // Send notification for public message
                    chatNotificationService.notifyPublicMessage(parseMessage);
                }
            }

            //handle project message
            if (parseMessage.event == RedisEvent.onProjectMessage) {
                const roomName = `project-${parseMessage.project_id}`;
                io.to(roomName).emit(ON_PROJECT_MESSAGE_RECEIVED, parseMessage);

                // Send notification for project message
                chatNotificationService.notifyProjectMessage(parseMessage);
            }

            //handle private message
            if (parseMessage.event == RedisEvent.onPrivateMessage) {


                // Send to receiver
                let receiverSocketId = userSocketMap.get(parseMessage.receiver_id.toString());
                if (!receiverSocketId) {
                    receiverSocketId = userSocketMap.get(parseInt(parseMessage.receiver_id));
                }



                if (receiverSocketId) {
                    io.to(receiverSocketId).emit(ON_PRIVATE_MESSAGE, parseMessage);

                    // Send notification for private message
                    chatNotificationService.notifyPrivateMessage(parseMessage);
                } else {

                }

                // Also send confirmation to sender
                let senderSocketId = userSocketMap.get(parseMessage.sender_id.toString());
                if (!senderSocketId) {
                    senderSocketId = userSocketMap.get(parseInt(parseMessage.sender_id));
                }

                if (senderSocketId) {
                    io.to(senderSocketId).emit(ON_PRIVATE_MESSAGE, parseMessage);
                }
            }

            //hanle audio chat
            if (parseMessage.event == RedisEvent.onCall) {
                let recieverSocketId = userSocketMap.get(reciever_id.toString());
                if (!recieverSocketId) {
                    recieverSocketId = userSocketMap.get(parseInt(reciever_id));
                }
                if (recieverSocketId) {
                    io.to(recieverSocketId).emit(ON_CALL, parseMessage);
                }
            }

            //hanle call answer 
            if (parseMessage.event == RedisEvent.onCallAnswer) {
                let recieverSocketId = userSocketMap.get(reciever_id.toString());
                if (!recieverSocketId) {
                    recieverSocketId = userSocketMap.get(parseInt(reciever_id));
                }
                if (recieverSocketId) {
                    io.to(recieverSocketId).emit(ON_CALL_ANSWER, parseMessage);
                }
            }

            //hanle call signal 
            if (parseMessage.event == RedisEvent.onSignal) {
                let recieverSocketId = userSocketMap.get(reciever_id.toString());
                if (!recieverSocketId) {
                    recieverSocketId = userSocketMap.get(parseInt(reciever_id));
                }
                if (recieverSocketId) {
                    io.to(recieverSocketId).emit(ON_SIGNAL, parseMessage);
                }
            }

            //hanle call end 
            if (parseMessage.event == RedisEvent.onCallEnd) {
                let recieverSocketId = userSocketMap.get(reciever_id.toString());
                if (!recieverSocketId) {
                    recieverSocketId = userSocketMap.get(parseInt(reciever_id));
                }
                if (recieverSocketId) {
                    io.to(recieverSocketId).emit(ON_CALL_END, parseMessage);
                }
            }

            //hanle call no response 
            if (parseMessage.event == RedisEvent.onCallNoResponse) {
                let recieverSocketId = userSocketMap.get(reciever_id.toString());
                if (!recieverSocketId) {
                    recieverSocketId = userSocketMap.get(parseInt(reciever_id));
                }
                if (recieverSocketId) {
                    io.to(recieverSocketId).emit(ON_CALL_NO_RESPONSE, parseMessage);
                }
            }
        }
    });
}






export const handleCall = async (data, redis) => {
    const publishData = { ...data, sender_name: undefined, task_name: undefined };
    addChatMessage([publishData]);

    const redisPublishData = {
        ...data,
        event: RedisEvent.onCall
    }
    redis.publish(REDIS_CHANNEL, JSON.stringify(redisPublishData));
}


export const handleCallAnswer = async (data, redis) => {

    const updateMessage = { call_status: data.picked_up ? 'PROCESSING' : 'REJECTED' };
    handleUpdateMessage(data.message_id, updateMessage);

    const redisPublishData = {
        ...data,
        event: RedisEvent.onCallAnswer
    }
    redis.publish(REDIS_CHANNEL, JSON.stringify(redisPublishData));
}



export const handleCallSignal = async (data, redis) => {
    const redisPublishData = {
        ...data,
        event: RedisEvent.onSignal
    }
    redis.publish(REDIS_CHANNEL, JSON.stringify(redisPublishData));
}


export const handleCallEnd = async (data, redis) => {
    const updateMessage = { duration: data.duration, call_status: 'ENDED' };
    handleUpdateMessage(data.message_id, updateMessage);

    const redisPublishData = {
        ...data,
        event: RedisEvent.onCallEnd
    }

    redis.publish(REDIS_CHANNEL, JSON.stringify(redisPublishData));
}



export const handelNoResponse = async (data, redis) => {
    const updateMessage = { call_status: 'NO_RESPONSE' };
    handleUpdateMessage(data.message_id, updateMessage);

    const redisPublishData = {
        ...data,
        event: RedisEvent.onCallNoResponse
    }
    redis.publish(REDIS_CHANNEL, JSON.stringify(redisPublishData));
}


export const handleUpdateMessage = async (message_id, data) => {
    try {
        await prisma.message.update({
            where: {
                message_id: message_id
            },
            data: data
        });
    } catch (error) {
    }
}

export const addChatMessage = async (messages) => {
    try {
        await prisma.message.createMany({
            data: messages
        });
    } catch (error) {
    }
}



export const updateActiveStatus = async (status, user_id) => {
    try {
        await prisma.user.update({
            where: {
                user_id: Number(user_id)
            },
            data: {
                active_status: status
            }
        });
    } catch (error) {
    }
}