import { toast } from 'react-toastify';

class ChatNotificationService {
    constructor() {
        this.io = null;
        this.userId = null;
        this.notificationCallbacks = new Map();
        this.isInitialized = false;
    }

    // Initialize the service with Socket.IO instance and user ID
    init(ioInstance, userId) {
        if (this.isInitialized) {
            console.log('🔌 Chat notification service already initialized');
            return;
        }

        this.io = ioInstance;
        this.userId = userId;
        this.isInitialized = true;

        console.log('🔌 Chat notification service initialized for user:', userId);
        this.setupEventListeners();
    }

    // Set up event listeners for chat notifications
    setupEventListeners() {
        if (!this.io) {
            console.log('⚠️ Chat notification service: No io instance available');
            return;
        }

        // Listen for chat notifications
        this.io.on('chat_notification', (data) => {
            console.log('📱 Chat notification received:', data);
            this.handleChatNotification(data);
        });

        // Listen for connection status
        this.io.on('connect', () => {
            console.log('🔌 Chat notification service: Connected to WebSocket');
        });

        this.io.on('disconnect', () => {
            console.log('🔌 Chat notification service: Disconnected from WebSocket');
        });

        this.io.on('error', (error) => {
            console.error('❌ Chat notification service: WebSocket error:', error);
        });
    }

    // Handle incoming chat notifications
    handleChatNotification(data) {
        const { type, message, notification } = data;

        // Don't show notifications for messages from the current user
        if (message.sender_id === parseInt(this.userId)) {
            return;
        }

        // Show toast notification based on type
        switch (type) {
            case 'private_message':
                this.showPrivateMessageNotification(notification, message);
                break;
            case 'group_message':
                this.showGroupMessageNotification(notification, message);
                break;
            case 'project_message':
                this.showProjectMessageNotification(notification, message);
                break;
            case 'public_message':
                this.showPublicMessageNotification(notification, message);
                break;
            case 'mention':
                this.showMentionNotification(notification, message);
                break;
            case 'system_message':
                this.showSystemMessageNotification(notification, message);
                break;
            default:
                this.showGenericChatNotification(notification, message);
        }

        // Call any registered callbacks
        if (this.notificationCallbacks.has(type)) {
            this.notificationCallbacks.get(type).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in chat notification callback:', error);
                }
            });
        }
    }

    // Show private message notification
    showPrivateMessageNotification(notification, message) {
        toast.info(
            <div>
                <div className="font-semibold">{notification.title}</div>
                <div className="text-sm text-gray-600">{notification.body}</div>
                <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                </div>
            </div>,
            {
                position: "top-right",
                autoClose: 5000,
                icon: notification.icon,
                toastId: `chat-${message.sender_id}-${Date.now()}`,
                onClick: () => {
                    // Navigate to chat or open chat modal
                    this.handleChatNotificationClick(message);
                }
            }
        );
    }

    // Show group message notification
    showGroupMessageNotification(notification, message) {
        toast.info(
            <div>
                <div className="font-semibold">{notification.title}</div>
                <div className="text-sm text-gray-600">{notification.body}</div>
                <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                </div>
            </div>,
            {
                position: "top-right",
                autoClose: 4000,
                icon: notification.icon,
                toastId: `group-${message.conversation_id}-${Date.now()}`,
                onClick: () => {
                    this.handleChatNotificationClick(message);
                }
            }
        );
    }

    // Show project message notification
    showProjectMessageNotification(notification, message) {
        toast.info(
            <div>
                <div className="font-semibold">{notification.title}</div>
                <div className="text-sm text-gray-600">{notification.body}</div>
                <div className="text-xs text-gray-500 mt-1">
                    Project: {message.project_id} • {new Date(message.timestamp).toLocaleTimeString()}
                </div>
            </div>,
            {
                position: "top-right",
                autoClose: 4000,
                icon: notification.icon,
                toastId: `project-${message.project_id}-${Date.now()}`,
                onClick: () => {
                    this.handleChatNotificationClick(message);
                }
            }
        );
    }

    // Show public message notification
    showPublicMessageNotification(notification, message) {
        toast.info(
            <div>
                <div className="font-semibold">{notification.title}</div>
                <div className="text-sm text-gray-600">{notification.body}</div>
                <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                </div>
            </div>,
            {
                position: "top-right",
                autoClose: 3000,
                icon: notification.icon,
                toastId: `public-${message.sender_id}-${Date.now()}`,
                onClick: () => {
                    this.handleChatNotificationClick(message);
                }
            }
        );
    }

    // Show system message notification
    showSystemMessageNotification(notification, message) {
        toast.warning(
            <div>
                <div className="font-semibold">{notification.title}</div>
                <div className="text-sm text-gray-600">{notification.body}</div>
                <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                </div>
            </div>,
            {
                position: "top-right",
                autoClose: 6000,
                icon: notification.icon,
                toastId: `system-${Date.now()}`,
                onClick: () => {
                    this.handleChatNotificationClick(message);
                }
            }
        );
    }

    // Show mention notification
    showMentionNotification(notification, message) {
        toast.warning(
            <div>
                <div className="font-semibold">{notification.title}</div>
                <div className="text-sm text-gray-600">{notification.body}</div>
                <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                </div>
            </div>,
            {
                position: "top-right",
                autoClose: 6000,
                icon: notification.icon,
                toastId: `mention-${message.sender_id}-${Date.now()}`,
                onClick: () => {
                    this.handleChatNotificationClick(message);
                }
            }
        );
    }

    // Show generic chat notification
    showGenericChatNotification(notification, message) {
        toast.info(
            <div>
                <div className="font-semibold">{notification.title}</div>
                <div className="text-sm text-gray-600">{notification.body}</div>
            </div>,
            {
                position: "top-right",
                autoClose: 3000,
                icon: notification.icon,
                toastId: `generic-${Date.now()}`
            }
        );
    }

    // Handle notification click (navigate to chat)
    handleChatNotificationClick(message) {
        console.log('📱 Chat notification clicked:', message);
        
        // You can implement navigation logic here
        // For example, open chat modal, navigate to chat page, etc.
        
        // Example: Emit event for parent components to handle
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('chatNotificationClicked', {
                detail: message
            }));
        }
    }

    // Register callback for specific notification types
    onNotification(type, callback) {
        if (!this.notificationCallbacks.has(type)) {
            this.notificationCallbacks.set(type, []);
        }
        this.notificationCallbacks.get(type).push(callback);
    }

    // Remove callback for specific notification types
    offNotification(type, callback) {
        if (this.notificationCallbacks.has(type)) {
            const callbacks = this.notificationCallbacks.get(type);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Get unread chat count
    async getUnreadChatCount() {
        try {
            const response = await fetch(`/api/chat/unread-count?user_id=${this.userId}`);
            const data = await response.json();
            return data.count || 0;
        } catch (error) {
            console.error('Error getting unread chat count:', error);
            return 0;
        }
    }

    // Mark chat messages as read
    async markChatAsRead(conversationId) {
        try {
            const response = await fetch('/api/chat/mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: this.userId,
                    conversation_id: conversationId
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error marking chat as read:', error);
            return false;
        }
    }

    // Clean up the service
    destroy() {
        if (this.io) {
            this.io.off('chat_notification');
            this.io.off('connect');
            this.io.off('disconnect');
            this.io.off('error');
        }
        
        this.notificationCallbacks.clear();
        this.isInitialized = false;
        console.log('🔌 Chat notification service destroyed');
    }
}

export default ChatNotificationService;
