import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/providers/UserProvider';
import EmailNotificationService from '@/services/emailNotificationService';

export const useEmailNotifications = () => {
    const { user } = useUser();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const emailServiceRef = useRef(null);
    const notificationTimeoutRef = useRef(null);

    // Initialize email notification service
    useEffect(() => {
        if (user?.user_id) {
            const service = new EmailNotificationService(user.user_id);
            emailServiceRef.current = service;

            // Set up connection status
            const checkConnection = () => {
                setIsConnected(service.isConnected());
            };

            // Check connection status periodically
            const connectionInterval = setInterval(checkConnection, 5000);

            // Set up notification callbacks
            service.onNewEmail((notification) => {
                console.log('📧 New email notification received:', notification);
                
                // Add to notifications list
                setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
                
                // Auto-remove notification after 10 seconds
                const timeoutId = setTimeout(() => {
                    setNotifications(prev => prev.filter(n => n !== notification));
                }, 10000);
                
                // Store timeout reference for cleanup
                notificationTimeoutRef.current = timeoutId;
            });

            service.onEmailCountUpdate((data) => {
                console.log('📊 Email count updated:', data);
                setUnreadCount(data.unread_count || 0);
            });

            // Request initial email count
            service.requestEmailCount();

            // Set initial connection status
            checkConnection();

            return () => {
                clearInterval(connectionInterval);
                if (notificationTimeoutRef.current) {
                    clearTimeout(notificationTimeoutRef.current);
                }
                service.disconnect();
            };
        }
    }, [user?.user_id]);

    // Reconnect if disconnected
    const reconnect = useCallback(() => {
        if (emailServiceRef.current && !emailServiceRef.current.isConnected()) {
            emailServiceRef.current.reconnect();
        }
    }, []);

    // Mark email as read
    const markEmailAsRead = useCallback((emailId) => {
        if (emailServiceRef.current) {
            emailServiceRef.current.markEmailAsRead(emailId);
        }
    }, []);

    // Mark email as unread
    const markEmailAsUnread = useCallback((emailId) => {
        if (emailServiceRef.current) {
            emailServiceRef.current.markEmailAsUnread(emailId);
        }
    }, []);

    // Delete email
    const deleteEmail = useCallback((emailId) => {
        if (emailServiceRef.current) {
            emailServiceRef.current.deleteEmail(emailId);
        }
    }, []);

    // Archive email
    const archiveEmail = useCallback((emailId) => {
        if (emailServiceRef.current) {
            emailServiceRef.current.archiveEmail(emailId);
        }
    }, []);

    // Request email count update
    const requestEmailCount = useCallback(() => {
        if (emailServiceRef.current) {
            emailServiceRef.current.requestEmailCount();
        }
    }, []);

    // Remove notification
    const removeNotification = useCallback((notification) => {
        setNotifications(prev => prev.filter(n => n !== notification));
    }, []);

    // Clear all notifications
    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Get notification by ID
    const getNotification = useCallback((id) => {
        return notifications.find(n => n.id === id);
    }, [notifications]);

    // Check if user has unread emails
    const hasUnreadEmails = unreadCount > 0;

    // Get priority level based on unread count
    const getPriorityLevel = useCallback(() => {
        if (unreadCount === 0) return 'none';
        if (unreadCount < 5) return 'low';
        if (unreadCount < 10) return 'medium';
        return 'high';
    }, [unreadCount]);

    // Get priority color
    const getPriorityColor = useCallback(() => {
        const level = getPriorityLevel();
        switch (level) {
            case 'low': return 'text-blue-600';
            case 'medium': return 'text-yellow-600';
            case 'high': return 'text-red-600';
            default: return 'text-gray-400';
        }
    }, [getPriorityLevel]);

    return {
        // State
        unreadCount,
        notifications,
        isConnected,
        hasUnreadEmails,
        
        // Actions
        markEmailAsRead,
        markEmailAsUnread,
        deleteEmail,
        archiveEmail,
        requestEmailCount,
        reconnect,
        removeNotification,
        clearNotifications,
        getNotification,
        
        // Computed values
        getPriorityLevel,
        getPriorityColor,
        
        // Service reference (for advanced usage)
        emailService: emailServiceRef.current
    };
};

export default useEmailNotifications;
