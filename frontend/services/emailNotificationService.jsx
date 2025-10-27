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
         
            // Connect to the main chat namespace which handles email notifications
            this.io = io(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
                query: { user_id: this.userId }
            });

            this.setupEventListeners();
        } catch (error) {
            console.error('❌ EmailNotificationService: Error connecting:', error);
        }
    }

    setupEventListeners() {
        if (!this.io) return;

        this.io.on('connect', () => {
        });

        this.io.on('disconnect', () => {
        });

        // Listen for new email notifications
        this.io.on('new_emails', (data) => {
            
            if (this.onNewEmailCallback) {
                this.onNewEmailCallback(data);
            } else {
            }
        });

        // Listen for email count updates
        this.io.on('email_count_update', (data) => {
            
            if (this.onEmailCountUpdateCallback) {
                this.onEmailCountUpdateCallback(data);
            }
        });

        // Listen for email status updates
        this.io.on('email_status_update', (data) => {
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
    }

    // Check connection status
    isConnected() {
        return this.io && this.io.connected;
    }

    // Reconnect if disconnected
    reconnect() {
        if (!this.isConnected()) {
            this.connect();
        }
    }
}

export default EmailNotificationService;
