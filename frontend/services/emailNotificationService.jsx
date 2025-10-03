import { io } from "socket.io-client";

export class EmailNotificationService {
    io = null;
    socket = null;
    onNewEmailCallback = null;
    onEmailCountUpdateCallback = null;

    constructor(userId) {
        if (!userId) {
            console.error('EmailNotificationService: userId is required');
            return;
        }

        this.userId = userId;
        this.connect();
    }

    connect() {
        try {
            console.log('🔍 EmailNotificationService: Attempting to connect to:', `${process.env.NEXT_PUBLIC_API_URL}/chat`);
            console.log('🔍 EmailNotificationService: User ID:', this.userId);
            
            // Connect to the main chat namespace which handles email notifications
            this.io = io(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
                query: { user_id: this.userId }
            });

            this.setupEventListeners();
            console.log('📧 EmailNotificationService: Service initialized successfully');
        } catch (error) {
            console.error('❌ EmailNotificationService: Error connecting:', error);
        }
    }

    setupEventListeners() {
        if (!this.io) return;

        this.io.on('connect', () => {
            console.log('🔌 EmailNotificationService: Connected to WebSocket');
        });

        this.io.on('disconnect', () => {
            console.log('🔌 EmailNotificationService: Disconnected from WebSocket');
        });

        // Listen for new email notifications
        this.io.on('new_emails', (data) => {
            console.log('📧 EmailNotificationService: Received new_emails event:', data);
            
            if (this.onNewEmailCallback) {
                console.log('🔍 EmailNotificationService: Calling onNewEmail callback');
                this.onNewEmailCallback(data);
            } else {
                console.log('⚠️ EmailNotificationService: No onNewEmail callback set');
            }
        });

        // Listen for email count updates
        this.io.on('email_count_update', (data) => {
            console.log('📊 EmailNotificationService: Received email_count_update event:', data);
            
            if (this.onEmailCountUpdateCallback) {
                this.onEmailCountUpdateCallback(data);
            }
        });

        // Listen for email status updates
        this.io.on('email_status_update', (data) => {
            console.log('📧 EmailNotificationService: Received email_status_update event:', data);
        });

        this.io.on('error', (error) => {
            console.error('❌ EmailNotificationService: WebSocket error:', error);
        });
    }

    // Set callback for new email notifications
    onNewEmail(callback) {
        this.onNewEmailCallback = callback;
    }

    // Set callback for email count updates
    onEmailCountUpdate(callback) {
        this.onEmailCountUpdateCallback = callback;
    }

    // Request email count update
    requestEmailCount() {
        if (this.io && this.io.connected) {
            this.io.emit('request_email_count', { user_id: this.userId });
        }
    }

    // Mark email as read
    markEmailAsRead(emailId) {
        if (this.io && this.io.connected) {
            this.io.emit('mark_email_read', { 
                user_id: this.userId, 
                email_id: emailId 
            });
        }
    }

    // Mark email as unread
    markEmailAsUnread(emailId) {
        if (this.io && this.io.connected) {
            this.io.emit('mark_email_unread', { 
                user_id: this.userId, 
                email_id: emailId 
            });
        }
    }

    // Delete email
    deleteEmail(emailId) {
        if (this.io && this.io.connected) {
            this.io.emit('delete_email', { 
                user_id: this.userId, 
                email_id: emailId 
            });
        }
    }

    // Archive email
    archiveEmail(emailId) {
        if (this.io && this.io.connected) {
            this.io.emit('archive_email', { 
                user_id: this.userId, 
                email_id: emailId 
            });
        }
    }

    // Disconnect the service
    disconnect() {
        if (this.io) {
            this.io.disconnect();
            this.io = null;
        }
        console.log('🔌 Email notification service disconnected');
    }

    // Check connection status
    isConnected() {
        return this.io && this.io.connected;
    }

    // Reconnect if disconnected
    reconnect() {
        if (!this.isConnected()) {
            console.log('🔄 Reconnecting to email notification service...');
            this.connect();
        }
    }
}

export default EmailNotificationService;
