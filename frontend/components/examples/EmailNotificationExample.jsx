import React from 'react';
import { Button } from '@/components/ui/button';
import { useEmailNotifications } from '@/providers/EmailNotificationProvider';
import { showEmailNotificationToast } from '@/components/mail/EmailNotificationToast';
import EmailBadge from '@/components/mail/EmailBadge';

const EmailNotificationExample = () => {
    const { 
        unreadCount, 
        isConnected, 
        hasUnreadEmails,
        markEmailAsRead,
        deleteEmail,
        reconnect 
    } = useEmailNotifications();

    // Example notification data
    const exampleNotification = {
        count: 2,
        emails: [
            {
                email_id: 'example-1',
                from: 'john.doe@example.com',
                subject: 'Project Update Meeting',
                body: 'Hi team, I wanted to schedule a meeting to discuss the latest project updates...',
                date: new Date().toISOString()
            },
            {
                email_id: 'example-2',
                from: 'jane.smith@example.com',
                subject: 'Client Feedback Received',
                body: 'Great news! We received positive feedback from our client...',
                date: new Date().toISOString()
            }
        ],
        timestamp: new Date().toISOString()
    };

    const handleShowExampleNotification = () => {
        showEmailNotificationToast(exampleNotification, (notification) => {
            console.log('Example notification clicked:', notification);
            alert('Example notification clicked! This would normally navigate to the email.');
        });
    };

    const handleTestEmailOperations = () => {
        // Simulate email operations
        if (hasUnreadEmails) {
            markEmailAsRead('example-1');
            alert('Email marked as read!');
        } else {
            alert('No unread emails to test with.');
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Notification System Demo</h2>
            
            {/* Status Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Connection Status</h3>
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={isConnected ? 'text-green-700' : 'text-red-700'}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Unread Count</h3>
                    <div className="flex items-center space-x-2">
                        <EmailBadge count={unreadCount} variant="minimal" />
                        <span className="text-green-700 font-medium">
                            {unreadCount} unread email{unreadCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-2">Email Status</h3>
                    <span className={`text-yellow-700 ${hasUnreadEmails ? 'font-semibold' : ''}`}>
                        {hasUnreadEmails ? 'Has unread emails' : 'All emails read'}
                    </span>
                </div>
            </div>

            {/* Demo Actions */}
            <div className="space-y-4">
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Actions</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            onClick={handleShowExampleNotification}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Show Example Notification Toast
                        </Button>
                        
                        <Button
                            onClick={handleTestEmailOperations}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={!hasUnreadEmails}
                        >
                            Test Email Operations
                        </Button>
                        
                        <Button
                            onClick={reconnect}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={isConnected}
                        >
                            Reconnect Service
                        </Button>
                        
                        <Button
                            onClick={() => window.location.href = '/dashboard/mail'}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            Go to Mail Page
                        </Button>
                    </div>
                </div>

                {/* Usage Instructions */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm text-gray-700">
                        <p><strong>1. Real-time Notifications:</strong> When new emails arrive, toast notifications will automatically appear.</p>
                        <p><strong>2. Email Badge:</strong> The badge shows unread email count and updates in real-time.</p>
                        <p><strong>3. Connection Status:</strong> Monitor WebSocket connection status for real-time updates.</p>
                        <p><strong>4. Email Operations:</strong> Mark as read, delete, or archive emails through the notification system.</p>
                    </div>
                </div>

                {/* Code Example */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Example</h3>
                    
                    <div className="bg-gray-900 p-4 rounded-lg">
                        <pre className="text-green-400 text-sm overflow-x-auto">
{`import { useEmailNotifications } from '@/providers/EmailNotificationProvider';
import { showEmailNotificationToast } from '@/components/mail/EmailNotificationToast';

function MyComponent() {
    const { unreadCount, isConnected, markEmailAsRead } = useEmailNotifications();
    
    const showNotification = () => {
        showEmailNotificationToast(notificationData, (notification) => {
            // Handle notification click
            console.log('Notification clicked:', notification);
        });
    };
    
    return (
        <div>
            <p>Unread emails: {unreadCount}</p>
            <button onClick={showNotification}>Show Notification</button>
        </div>
    );
}`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailNotificationExample;
