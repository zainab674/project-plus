import React from 'react';
import { Mail, Bell, Settings } from 'lucide-react';
import { useEmailNotifications } from '@/providers/EmailNotificationProvider';
import EmailBadge, { EmailNotificationBadge } from '@/components/mail/EmailBadge';
import { Button } from '@/components/ui/button';

const EmailNotificationNav = ({ variant = 'default', showSettings = true, className = '' }) => {
    const { 
        unreadCount, 
        isConnected, 
        hasUnreadEmails, 
        getPriorityLevel,
        getPriorityColor,
        reconnect 
    } = useEmailNotifications();

    const priorityLevel = getPriorityLevel();
    const priorityColor = getPriorityColor();

    const handleMailClick = () => {
        // Navigate to mail page
        if (typeof window !== 'undefined') {
            window.location.href = '/dashboard/mail';
        }
    };

    const handleReconnect = () => {
        reconnect();
    };

    if (variant === 'minimal') {
        return (
            <div className={`flex items-center space-x-2 ${className}`}>
                <EmailBadge 
                    count={unreadCount} 
                    variant="minimal"
                    onClick={handleMailClick}
                />
                {showSettings && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReconnect}
                        className="p-2"
                        title={isConnected ? 'Email service connected' : 'Reconnect email service'}
                    >
                        <Settings className={`w-4 h-4 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                )}
            </div>
        );
    }

    if (variant === 'badge') {
        return (
            <div className={`flex items-center space-x-2 ${className}`}>
                <EmailNotificationBadge 
                    count={unreadCount} 
                    onClick={handleMailClick}
                />
                {showSettings && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReconnect}
                        className="p-2"
                        title={isConnected ? 'Email service connected' : 'Reconnect email service'}
                    >
                        <Settings className={`w-4 h-4 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                )}
            </div>
        );
    }

    // Default variant - full featured
    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            {/* Email count display */}
            <div className="flex items-center space-x-2">
                <Mail className={`w-5 h-5 ${priorityColor}`} />
                <div className="text-sm">
                    <span className="font-medium text-gray-900">
                        {unreadCount === 0 ? 'No' : unreadCount} unread email{unreadCount !== 1 ? 's' : ''}
                    </span>
                    {hasUnreadEmails && (
                        <span className={`ml-2 text-xs px-2 py-1 rounded-full ${getPriorityBadgeColor(priorityLevel)}`}>
                            {priorityLevel} priority
                        </span>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMailClick}
                    className="flex items-center space-x-2"
                >
                    <Mail className="w-4 h-4" />
                    <span>View Mail</span>
                </Button>

                {showSettings && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReconnect}
                        className="p-2"
                        title={isConnected ? 'Email service connected' : 'Reconnect email service'}
                    >
                        <Settings className={`w-4 h-4 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                )}
            </div>

            {/* Connection status indicator */}
            {!isConnected && (
                <div className="flex items-center space-x-1 transition-all duration-200">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-600">Disconnected</span>
                </div>
            )}
        </div>
    );
};

// Helper function for priority badge colors
const getPriorityBadgeColor = (priority) => {
    switch (priority) {
        case 'low': return 'bg-blue-100 text-blue-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'high': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default EmailNotificationNav;
