import { prisma } from "../prisma/index.js";
import { fetchMail } from "./googleService.js";
import { decrypt } from "./encryptionService.js";

// We'll set the io instance later
let io = null;

class EmailPollingService {
    constructor() {
        this.pollingInterval = 5 * 1000; // 5 seconds - ultra-fast real-time polling
        this.isRunning = false;
        this.pollingTimer = null;
        this.userEmailCounts = new Map(); // Track email counts per user
    }

    start() {
        if (this.isRunning) {
            console.log('Email polling service is already running');
            return;
        }

        console.log('🚀 Starting email polling service...');
        this.isRunning = true;
        this.pollEmails();
        this.scheduleNextPoll();
    }

    stop() {
        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }
        this.isRunning = false;
        console.log('🛑 Email polling service stopped');
    }

    scheduleNextPoll() {
        if (!this.isRunning) return;
        
        this.pollingTimer = setTimeout(() => {
            this.pollEmails();
            this.scheduleNextPoll();
        }, this.pollingInterval);
    }

    async pollEmails() {
        try {
            console.log('📧 Polling emails for connected users...');
            
            // Get all users with connected Gmail accounts
            const connectedUsers = await prisma.user.findMany({
                where: {
                    connect_mail_hash: { not: null },
                    encryption_key: { not: null },
                    encryption_vi: { not: null }
                },
                select: {
                    user_id: true,
                    name: true,
                    email: true,
                    connect_mail_hash: true,
                    encryption_key: true,
                    encryption_vi: true
                }
            });

            console.log(`Found ${connectedUsers.length} users with connected Gmail accounts`);

            for (const user of connectedUsers) {
                try {
                    await this.fetchEmailsForUser(user);
                } catch (error) {
                    console.error(`Error fetching emails for user ${user.user_id} (${user.email}):`, error.message);
                }
            }

            console.log('✅ Email polling completed');
        } catch (error) {
            console.error('❌ Error in email polling service:', error);
        }
    }

    async fetchEmailsForUser(user) {
        try {
            // Decrypt Gmail credentials
            const decryptData = decrypt(user.connect_mail_hash, user.encryption_key, user.encryption_vi);
            const [gmailAddress, gmailPassword] = decryptData.split('|');

            if (!gmailAddress || !gmailPassword) {
                console.error(`Invalid Gmail credentials for user ${user.user_id}`);
                return;
            }

            // Fetch latest emails (last 10 emails)
            const fetchedEmails = await fetchMail(gmailAddress, gmailPassword, 10);

            if (!fetchedEmails || fetchedEmails.length === 0) {
                console.log(`No new emails found for user ${user.user_id}`);
                return;
            }

            console.log(`Found ${fetchedEmails.length} emails for user ${user.user_id}`);

            // Process and store emails
            const newEmails = await this.processAndStoreEmails(user, fetchedEmails);

            if (newEmails.length > 0) {
                console.log(`📧 Processing ${newEmails.length} new emails for user ${user.user_id}`);
                
                // Notify user of new emails in real-time
                this.notifyUserOfNewEmails(user.user_id, newEmails);
                
                // Update email count
                await this.updateUserEmailCount(user.user_id);
                
                console.log(`✅ Completed processing for user ${user.user_id}`);
            } else {
                console.log(`No new emails to process for user ${user.user_id}`);
            }

        } catch (error) {
            console.error(`Error fetching emails for user ${user.user_id}:`, error.message);
            
            // Log additional error details for debugging
            if (error.statusCode) {
                console.error(`  Status Code: ${error.statusCode}`);
            }
            if (error.stack) {
                console.error(`  Stack: ${error.stack}`);
            }
            
            // Log user context for debugging
            console.error(`  User Email: ${user.email}`);
            console.error(`  Has Credentials: ${!!user.connect_mail_hash && !!user.encryption_key && !!user.encryption_vi}`);
        }
    }

    async processAndStoreEmails(user, fetchedEmails) {
        const newEmails = [];

        for (const emailData of fetchedEmails) {
            try {
                // Check if email already exists in database
                const existingEmail = await prisma.email.findFirst({
                    where: {
                        user_id: user.user_id,
                        subject: emailData.subject,
                        content: {
                            contains: emailData.body.substring(0, 100) // Check first 100 chars of content
                        },
                        created_at: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
                        }
                    }
                });

                if (existingEmail) {
                    continue; // Email already exists, skip
                }

                // Create new email record
                const newEmail = await prisma.email.create({
                    data: {
                        user_id: user.user_id,
                        subject: emailData.subject || '(No Subject)',
                        content: emailData.body || '(No Content)',
                        to_user: user.user_id, // Since this is incoming email
                        from_user: emailData.from || 'Unknown Sender',
                        is_read: false, // Mark as unread by default
                        // Store attachment info if present
                        attachment_name: emailData.attachments?.[0]?.filename || null,
                        attachment_size: emailData.attachments?.[0]?.base64Content ? 
                            Buffer.from(emailData.attachments[0].base64Content, 'base64').length : null,
                        attachment_mime_type: emailData.attachments?.[0]?.contentType || null
                    }
                });

                newEmails.push({
                    email_id: newEmail.email_id,
                    subject: newEmail.subject,
                    from: emailData.from,
                    date: emailData.date,
                    body: newEmail.content,
                    is_read: false
                });

                console.log(`Stored new email: ${newEmail.subject} for user ${user.user_id}`);

            } catch (error) {
                console.error(`Error storing email for user ${user.user_id}:`, error.message);
            }
        }

        return newEmails;
    }

    notifyUserOfNewEmails(userId, newEmails) {
        try {
            if (io) {
                // Emit to specific user room in the main namespace
                io.to(`user_${userId}`).emit('new_emails', {
                    count: newEmails.length,
                    emails: newEmails,
                    timestamp: new Date()
                });
                
                // Also emit to chat namespace (this is what the frontend connects to)
                if (io.of('/chat')) {
                    io.of('/chat').to(`user_${userId}`).emit('new_emails', {
                        count: newEmails.length,
                        emails: newEmails,
                        timestamp: new Date()
                    });
                }
                
                console.log(`Sent real-time notification for ${newEmails.length} new emails to user ${userId}`);
                console.log(`Notification sent to room: user_${userId}`);
            } else {
                console.log('⚠️ No io instance available for sending notifications');
            }
        } catch (error) {
            console.error(`Error sending real-time notification to user ${userId}:`, error.message);
        }
    }

    // Update user's email count and notify
    async updateUserEmailCount(userId) {
        try {
            const unreadCount = await prisma.email.count({
                where: {
                    user_id: userId,
                    is_read: false
                }
            });

            // Update the count in memory
            this.userEmailCounts.set(userId, unreadCount);

            // Notify user of count update
            if (io) {
                // Main namespace
                io.to(`user_${userId}`).emit('email_count_update', {
                    user_id: userId,
                    unread_count: unreadCount,
                    timestamp: new Date()
                });
                
                // Chat namespace
                if (io.of('/chat')) {
                    io.of('/chat').to(`user_${userId}`).emit('email_count_update', {
                        user_id: userId,
                        unread_count: unreadCount,
                        timestamp: new Date()
                    });
                }
            }

            console.log(`Updated email count for user ${userId}: ${unreadCount} unread emails`);
        } catch (error) {
            console.error(`Error updating email count for user ${userId}:`, error.message);
        }
    }

    // Handle email operations from WebSocket events
    async handleEmailOperation(operation, data) {
        try {
            const { user_id, email_id } = data;

            switch (operation) {
                case 'mark_email_read':
                    await prisma.email.update({
                        where: { email_id: parseInt(email_id) },
                        data: { is_read: true }
                    });
                    break;

                case 'mark_email_unread':
                    await prisma.email.update({
                        where: { email_id: parseInt(email_id) },
                        data: { is_read: false }
                    });
                    break;

                case 'delete_email':
                    await prisma.email.delete({
                        where: { email_id: parseInt(email_id) }
                    });
                    break;

                case 'archive_email':
                    await prisma.email.update({
                        where: { email_id: parseInt(email_id) },
                        data: { is_archived: true }
                    });
                    break;

                default:
                    console.log(`Unknown email operation: ${operation}`);
                    return;
            }

            // Update email count after operation
            await this.updateUserEmailCount(user_id);

            // Notify user of the update
            if (io) {
                io.to(`user_${user_id}`).emit('email_status_update', {
                    operation,
                    email_id,
                    user_id,
                    timestamp: new Date()
                });
            }

            console.log(`Successfully handled email operation: ${operation} for email ${email_id}`);

        } catch (error) {
            console.error(`Error handling email operation ${operation}:`, error.message);
        }
    }

    // Method to manually trigger email polling (for testing)
    async manualPoll() {
        console.log('🔄 Manual email polling triggered');
        await this.pollEmails();
    }

    // Method to change polling interval
    setPollingInterval(minutes) {
        this.pollingInterval = minutes * 60 * 1000;
        console.log(`📅 Email polling interval set to ${minutes} minutes`);
        
        // Restart polling with new interval
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }

    // Get user's unread email count
    async getUserUnreadCount(userId) {
        try {
            // Convert userId to integer if it's a string
            const userIdInt = parseInt(userId, 10);
            if (isNaN(userIdInt)) {
                console.error(`Invalid userId: ${userId}`);
                return 0;
            }
            
            const count = await prisma.email.count({
                where: {
                    user_id: userIdInt,
                    is_read: false
                }
            });
            return count;
        } catch (error) {
            console.error(`Error getting unread count for user ${userId}:`, error.message);
            return 0;
        }
    }

    // Set up WebSocket event handlers
    setupWebSocketHandlers(ioInstance) {
        if (!ioInstance) {
            console.log('⚠️ No ioInstance provided to setupWebSocketHandlers');
            return;
        }

        console.log('🔌 Setting up WebSocket handlers for email polling service');

        // Handle user joining their personal room
        ioInstance.on('connection', (socket) => {
            const userId = socket.handshake.query.user_id;
            console.log(`🔌 New socket connection: ${socket.id} for user: ${userId}`);
            
            if (userId) {
                // Convert userId to integer
                const userIdInt = parseInt(userId, 10);
                if (isNaN(userIdInt)) {
                    console.error(`Invalid userId from socket: ${userId}`);
                    return;
                }
                
                // Join user's personal room for email notifications
                socket.join(`user_${userIdInt}`);
                console.log(`User ${userIdInt} joined email notification room: user_${userIdInt}`);
                
                // Send initial email count
                this.getUserUnreadCount(userIdInt).then(count => {
                    socket.emit('email_count_update', {
                        user_id: userIdInt,
                        unread_count: count,
                        timestamp: new Date()
                    });
                    console.log(`Sent initial email count ${count} to user ${userIdInt}`);
                });
            }

            // Handle email operations
            socket.on('mark_email_read', (data) => {
                console.log(`📧 Received mark_email_read for user ${data.user_id}, email ${data.email_id}`);
                // Convert user_id to integer
                if (data.user_id) {
                    data.user_id = parseInt(data.user_id, 10);
                }
                this.handleEmailOperation('mark_email_read', data);
            });

            socket.on('mark_email_unread', (data) => {
                console.log(`📧 Received mark_email_unread for user ${data.user_id}, email ${data.email_id}`);
                // Convert user_id to integer
                if (data.user_id) {
                    data.user_id = parseInt(data.user_id, 10);
                }
                this.handleEmailOperation('mark_email_unread', data);
            });

            socket.on('delete_email', (data) => {
                console.log(`📧 Received delete_email for user ${data.user_id}, email ${data.email_id}`);
                // Convert user_id to integer
                if (data.user_id) {
                    data.user_id = parseInt(data.user_id, 10);
                }
                this.handleEmailOperation('delete_email', data);
            });

            socket.on('archive_email', (data) => {
                console.log(`📧 Received archive_email for user ${data.user_id}, email ${data.email_id}`);
                // Convert user_id to integer
                if (data.user_id) {
                    data.user_id = parseInt(data.user_id, 10);
                }
                this.handleEmailOperation('archive_email', data);
            });

            socket.on('request_email_count', (data) => {
                console.log(`📊 Received request_email_count for user ${data.user_id}`);
                // Convert user_id to integer
                const userIdInt = parseInt(data.user_id, 10);
                if (isNaN(userIdInt)) {
                    console.error(`Invalid userId in request_email_count: ${data.user_id}`);
                    return;
                }
                this.getUserUnreadCount(userIdInt).then(count => {
                    socket.emit('email_count_update', {
                        user_id: userIdInt,
                        unread_count: count,
                        timestamp: new Date()
                    });
                    console.log(`Sent email count ${count} to user ${userIdInt}`);
                });
            });

            socket.on('disconnect', () => {
                console.log(`🔌 Socket disconnected: ${socket.id} for user: ${userId}`);
            });
        });
    }
}

// Create singleton instance
const emailPollingService = new EmailPollingService();

// Method to set the io instance
emailPollingService.setIO = (ioInstance) => {
    io = ioInstance;
    // Set up WebSocket handlers when io is set
    emailPollingService.setupWebSocketHandlers(ioInstance);
};

export default emailPollingService; 