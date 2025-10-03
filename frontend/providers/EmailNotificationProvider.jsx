"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@/providers/UserProvider';
import EmailNotificationService from '@/services/emailNotificationService';
import ChatNotificationService from '@/services/chatNotificationService';
import { showEmailNotificationToast, dismissEmailNotificationToast } from '@/components/mail/EmailNotificationToast';

const EmailNotificationContext = createContext();

export const useEmailNotifications = () => {
    const context = useContext(EmailNotificationContext);
    if (!context) {
        throw new Error('useEmailNotifications must be used within an EmailNotificationProvider');
    }
    return context;
};

export const EmailNotificationProvider = ({ children }) => {
    const { user } = useUser();
    const [emailService, setEmailService] = useState(null);
    const [chatNotificationService, setChatNotificationService] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [chatUnreadCount, setChatUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [activeToasts, setActiveToasts] = useState(new Map());

    // Initialize email notification service
    useEffect(() => {

        if (user?.user_id) {
            const service = new EmailNotificationService(user.user_id);
            setEmailService(service);

            // Initialize chat notification service
            const chatService = new ChatNotificationService();
            setChatNotificationService(chatService);
            console.log('🔌 Chat notification service created for user:', user.user_id);

            // Initialize chat notification service with the same io instance
            if (emailService && emailService.io) {
                chatService.init(emailService.io, user.user_id);
                console.log('🔌 Chat notification service initialized with io instance');
            }

            // Set up email notification callbacks
            service.onNewEmail((notification) => {
                console.log('📧 Global email notification received:', notification);

                // Show toast notification
                const toastId = showEmailNotificationToast(notification, handleViewEmailFromNotification);
                console.log('🔍 EmailNotificationProvider: Toast notification shown with ID:', toastId);

                // Store toast reference for management
                setActiveToasts(prev => new Map(prev).set(notification.timestamp, toastId));

                // Auto-remove toast reference after 8 seconds
                setTimeout(() => {
                    setActiveToasts(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(notification.timestamp);
                        return newMap;
                    });
                }, 8000);
            });

            service.onEmailCountUpdate((data) => {
                console.log('📊 Global email count updated:', data);
                setUnreadCount(data.unread_count || 0);
            });

            // Request initial email count
            service.requestEmailCount();

            // Check connection status periodically
            const connectionInterval = setInterval(() => {
                const connected = service.isConnected();
                console.log('🔍 EmailNotificationProvider: Connection status check:', connected);
                setIsConnected(connected);
            }, 5000);

            return () => {
                clearInterval(connectionInterval);
                // Dismiss all active toasts
                activeToasts.forEach(toastId => {
                    dismissEmailNotificationToast(toastId);
                });
                service.disconnect();
            };
        } else {
            console.log('⚠️ EmailNotificationProvider: No user ID available');
        }
    }, [user?.user_id]);

    // Handle viewing email from notification
    const handleViewEmailFromNotification = (notification) => {
        // Navigate to mail page or open email
        if (typeof window !== 'undefined') {
            // You can implement navigation logic here
            // For now, just log the action
            console.log('Navigate to email:', notification);

            // Navigate to mail page
            window.location.href = '/dashboard/mail';
        }
    };

    // Dismiss specific notification toast
    const dismissEmailNotification = (timestamp) => {
        const toastId = activeToasts.get(timestamp);
        if (toastId) {
            dismissEmailNotificationToast(toastId);
            setActiveToasts(prev => {
                const newMap = new Map(prev);
                newMap.delete(timestamp);
                return newMap;
            });
        }
    };

    // Dismiss all notification toasts
    const dismissAllNotifications = () => {
        activeToasts.forEach(toastId => {
            dismissEmailNotificationToast(toastId);
        });
        setActiveToasts(new Map());
    };

    // Email operations
    const markEmailAsRead = (emailId) => {
        if (emailService) {
            emailService.markEmailAsRead(emailId);
        }
    };

    const markEmailAsUnread = (emailId) => {
        if (emailService) {
            emailService.markEmailAsUnread(emailId);
        }
    };

    const deleteEmail = (emailId) => {
        if (emailService) {
            emailService.deleteEmail(emailId);
        }
    };

    const archiveEmail = (emailId) => {
        if (emailService) {
            emailService.archiveEmail(emailId);
        }
    };

    const requestEmailCount = () => {
        if (emailService) {
            emailService.requestEmailCount();
        }
    };

    const reconnect = () => {
        if (emailService && !emailService.isConnected()) {
            emailService.reconnect();
        }
    };

    const value = {
        // State
        unreadCount,
        chatUnreadCount,
        isConnected,
        hasUnreadEmails: unreadCount > 0,
        activeNotificationsCount: activeToasts.size,

        // Actions
        markEmailAsRead,
        markEmailAsUnread,
        deleteEmail,
        archiveEmail,
        requestEmailCount,
        reconnect,
        dismissEmailNotification,
        dismissAllNotifications,

        // Service references
        emailService,
        chatNotificationService,
        getActiveToasts: () => Array.from(activeToasts.values())
    };

    return (
        <EmailNotificationContext.Provider value={value}>
            {children}
        </EmailNotificationContext.Provider>
    );
};

export default EmailNotificationProvider;
