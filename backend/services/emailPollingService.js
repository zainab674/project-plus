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
            return;
        }

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

            for (const user of connectedUsers) {
                try {
                    await this.fetchEmailsForUser(user);
                } catch (error) {
                }
            }

        } catch (error) {
        }
    }

    async fetchEmailsForUser(user) {
        try {
            // Decrypt Gmail credentials
            const decryptData = decrypt(user.connect_mail_hash, user.encryption_key, user.encryption_vi);
            const [gmailAddress, gmailPassword] = decryptData.split('|');

            if (!gmailAddress || !gmailPassword) {
                return;
            }

            // Fetch latest emails (last 10 emails)
            const fetchedEmails = await fetchMail(gmailAddress, gmailPassword, 10);

            if (!fetchedEmails || fetchedEmails.length === 0) {
                return;
            }

            // Process and store emails
            const newEmails = await this.processAndStoreEmails(user, fetchedEmails);

            if (newEmails.length > 0) {
                
                // Notify user of new emails in real-time
                this.notifyUserOfNewEmails(user.user_id, newEmails);
                
                // Update email count
                await this.updateUserEmailCount(user.user_id);
                
            } else {
            }

        } catch (error) {
            
            // Log additional error details for debugging
            if (error.statusCode) {
            }
            if (error.stack) {
            }
            
            // Log user context for debugging
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

            } catch (error) {
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
                
            } else {
            }
        } catch (error) {
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

        } catch (error) {
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

        } catch (error) {
        }
    }

    // Method to manually trigger email polling (for testing)
    async manualPoll() {
        await this.pollEmails();
    }

    // Method to change polling interval
    setPollingInterval(minutes) {
        this.pollingInterval = minutes * 60 * 1000;
        
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
            return 0;
        }
    }

    // Set up WebSocket event handlers
    setupWebSocketHandlers(ioInstance) {
        if (!ioInstance) {
            return;
        }

        // Handle user joining their personal room
        ioInstance.on('connection', (socket) => {
            const userId = socket.handshake.query.user_id;
            
            if (userId) {
                // Convert userId to integer
                const userIdInt = parseInt(userId, 10);
                if (isNaN(userIdInt)) {
                    return;
                }
                
                // Join user's personal room for email notifications
                socket.join(`user_${userIdInt}`);
                
                // Send initial email count
                this.getUserUnreadCount(userIdInt).then(count => {
                    socket.emit('email_count_update', {
                        user_id: userIdInt,
                        unread_count: count,
                        timestamp: new Date()
                    });
                });
            }

            // Handle email operations
            socket.on('mark_email_read', (data) => {
                // Convert user_id to integer
                if (data.user_id) {
                    data.user_id = parseInt(data.user_id, 10);
                }
                this.handleEmailOperation('mark_email_read', data);
            });

            socket.on('mark_email_unread', (data) => {
                // Convert user_id to integer
                if (data.user_id) {
                    data.user_id = parseInt(data.user_id, 10);
                }
                this.handleEmailOperation('mark_email_unread', data);
            });

            socket.on('delete_email', (data) => {
                // Convert user_id to integer
                if (data.user_id) {
                    data.user_id = parseInt(data.user_id, 10);
                }
                this.handleEmailOperation('delete_email', data);
            });

            socket.on('archive_email', (data) => {
                // Convert user_id to integer
                if (data.user_id) {
                    data.user_id = parseInt(data.user_id, 10);
                }
                this.handleEmailOperation('archive_email', data);
            });

            socket.on('request_email_count', (data) => {
                // Convert user_id to integer
                const userIdInt = parseInt(data.user_id, 10);
                if (isNaN(userIdInt)) {
                    return;
                }
                this.getUserUnreadCount(userIdInt).then(count => {
                    socket.emit('email_count_update', {
                        user_id: userIdInt,
                        unread_count: count,
                        timestamp: new Date()
                    });
                });
            });

            socket.on('disconnect', () => {
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