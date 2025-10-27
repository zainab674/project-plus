import { prisma } from "../prisma/index.js";
import { userSocketMap } from "../constants/userSocketMapConstant.js";

class ChatNotificationService {
    constructor() {
        this.io = null;
        this.notificationTypes = {
            PRIVATE_MESSAGE: 'private_message',
            GROUP_MESSAGE: 'group_message',
            PROJECT_MESSAGE: 'project_message',
            PUBLIC_MESSAGE: 'public_message',
            MENTION: 'mention',
            SYSTEM_MESSAGE: 'system_message'
        };
    }

    // Set the io instance for WebSocket communication
    setIO(ioInstance) {
        this.io = ioInstance;
    }

    // Send real-time notification for new private message
    async notifyPrivateMessage(messageData) {
        if (!this.io) {
            return;
        }

        try {
            const { sender_id, reciever_id, content, sender_name } = messageData;
            
            // Get receiver's socket ID
            const receiverSocketId = userSocketMap.get(reciever_id.toString());
            
            if (receiverSocketId) {
                // Send notification to specific user
                this.io.to(receiverSocketId).emit('chat_notification', {
                    type: this.notificationTypes.PRIVATE_MESSAGE,
                    message: {
                        sender_id: parseInt(sender_id),
                        sender_name: sender_name || 'Unknown User',
                        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                        timestamp: new Date(),
                        is_private: true,
                        conversation_type: 'private'
                    },
                    notification: {
                        title: `💬 New message from ${sender_name || 'Unknown User'}`,
                        body: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                        icon: '💬',
                        badge: 'chat',
                        priority: 'high'
                    }
                });

            } else {
            }
        } catch (error) {
        }
    }

    // Send real-time notification for new group/project message
    async notifyGroupMessage(messageData) {
        if (!this.io) {
            return;
        }

        try {
            const { sender_id, content, sender_name, project_id, task_id, conversation_id } = messageData;
            
            // Get all connected users (in a real app, you'd filter by project members)
            const connectedUsers = Array.from(userSocketMap.keys());
            
            // Send notification to all connected users except sender
            connectedUsers.forEach(userId => {
                if (parseInt(userId) !== parseInt(sender_id)) {
                    const userSocketId = userSocketMap.get(userId.toString());
                    
                    if (userSocketId) {
                        this.io.to(userSocketId).emit('chat_notification', {
                            type: this.notificationTypes.GROUP_MESSAGE,
                            message: {
                                sender_id: parseInt(sender_id),
                                sender_name: sender_name || 'Unknown User',
                                content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                                timestamp: new Date(),
                                project_id: project_id ? parseInt(project_id) : null,
                                task_id: task_id ? parseInt(task_id) : null,
                                conversation_id: conversation_id,
                                is_group_chat: true,
                                conversation_type: 'group'
                            },
                            notification: {
                                title: `👥 New group message from ${sender_name || 'Unknown User'}`,
                                body: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                                icon: '👥',
                                badge: 'group_chat',
                                priority: 'medium'
                            }
                        });
                    }
                }
            });

        } catch (error) {
        }
    }

    // Send real-time notification for project-specific messages
    async notifyProjectMessage(messageData) {
        if (!this.io) {
            return;
        }

        try {
            const { sender_id, content, sender_name, project_id, task_id } = messageData;
            
            // Get project members from database
            const projectMembers = await prisma.projectMember.findMany({
                where: { project_id: parseInt(project_id) },
                select: { user_id: true }
            });

            // Send notification to all project members except sender
            projectMembers.forEach(member => {
                if (member.user_id !== parseInt(sender_id)) {
                    const userSocketId = userSocketMap.get(member.user_id.toString());
                    
                    if (userSocketId) {
                        this.io.to(userSocketId).emit('chat_notification', {
                            type: this.notificationTypes.PROJECT_MESSAGE,
                            message: {
                                sender_id: parseInt(sender_id),
                                sender_name: sender_name || 'Unknown User',
                                content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                                timestamp: new Date(),
                                project_id: parseInt(project_id),
                                task_id: task_id ? parseInt(task_id) : null,
                                is_project_chat: true,
                                conversation_type: 'project'
                            },
                            notification: {
                                title: `🏢 New project message from ${sender_name || 'Unknown User'}`,
                                body: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                                icon: '🏢',
                                badge: 'project_chat',
                                priority: 'medium'
                            }
                        });
                    }
                }
            });

        } catch (error) {
        }
    }

    // Send real-time notification for public messages (general chat)
    async notifyPublicMessage(messageData) {
        if (!this.io) {
            return;
        }

        try {
            const { sender_id, content, sender_name, conversation_id } = messageData;
            
            // Get all connected users except sender
            const connectedUsers = Array.from(userSocketMap.keys());
            
            connectedUsers.forEach(userId => {
                if (parseInt(userId) !== parseInt(sender_id)) {
                    const userSocketId = userSocketMap.get(userId.toString());
                    
                    if (userSocketId) {
                        this.io.to(userSocketId).emit('chat_notification', {
                            type: this.notificationTypes.PUBLIC_MESSAGE,
                            message: {
                                sender_id: parseInt(sender_id),
                                sender_name: sender_name || 'Unknown User',
                                content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                                timestamp: new Date(),
                                conversation_id: conversation_id,
                                is_public_chat: true,
                                conversation_type: 'public'
                            },
                            notification: {
                                title: `🌐 New public message from ${sender_name || 'Unknown User'}`,
                                body: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                                icon: '🌐',
                                badge: 'public_chat',
                                priority: 'low'
                            }
                        });
                    }
                }
            });

        } catch (error) {
        }
    }

    // Send mention notification when user is mentioned in chat
    async notifyMention(messageData, mentionedUsers) {
        if (!this.io || !mentionedUsers || mentionedUsers.length === 0) {
            return;
        }

        try {
            const { sender_id, content, sender_name, project_id } = messageData;
            
            mentionedUsers.forEach(userId => {
                if (parseInt(userId) !== parseInt(sender_id)) {
                    const userSocketId = userSocketMap.get(userId.toString());
                    
                    if (userSocketId) {
                        this.io.to(userSocketId).emit('chat_notification', {
                            type: this.notificationTypes.MENTION,
                            message: {
                                sender_id: parseInt(sender_id),
                                sender_name: sender_name || 'Unknown User',
                                content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                                timestamp: new Date(),
                                project_id: project_id ? parseInt(project_id) : null,
                                is_mention: true,
                                conversation_type: 'mention'
                            },
                            notification: {
                                title: `👋 You were mentioned by ${sender_name || 'Unknown User'}`,
                                body: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                                icon: '👋',
                                badge: 'mention',
                                priority: 'high'
                            }
                        });
                    }
                }
            });

        } catch (error) {
        }
    }

    // Send system notification (for important updates, announcements, etc.)
    async notifySystemMessage(messageData, targetUsers = null) {
        if (!this.io) {
            return;
        }

        try {
            const { title, body, priority = 'medium', icon = '🔔' } = messageData;
            
            let usersToNotify = targetUsers;
            
            // If no specific users, notify all connected users
            if (!usersToNotify) {
                usersToNotify = Array.from(userSocketMap.keys());
            }
            
            usersToNotify.forEach(userId => {
                const userSocketId = userSocketMap.get(userId.toString());
                
                if (userSocketId) {
                    this.io.to(userSocketId).emit('chat_notification', {
                        type: this.notificationTypes.SYSTEM_MESSAGE,
                        message: {
                            sender_id: 0, // System user
                            sender_name: 'System',
                            content: body,
                            timestamp: new Date(),
                            is_system_message: true,
                            conversation_type: 'system'
                        },
                        notification: {
                            title: title,
                            body: body,
                            icon: icon,
                            badge: 'system',
                            priority: priority
                        }
                    });
                }
            });

        } catch (error) {
        }
    }

    // Get unread chat count for a user
    async getUnreadChatCount(userId) {
        try {
            const count = await prisma.message.count({
                where: {
                    reciever_id: parseInt(userId),
                    is_read: false
                }
            });
            return count;
        } catch (error) {
            return 0;
        }
    }

    // Update chat notification settings for a user
    async updateNotificationSettings(userId, settings) {
        try {
            // You can implement user-specific notification preferences here
            // For now, we'll just log the settings
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Create singleton instance
const chatNotificationService = new ChatNotificationService();

export default chatNotificationService;
