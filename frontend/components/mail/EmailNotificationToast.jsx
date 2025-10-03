import React from 'react';
import { Mail, Clock, User, X } from 'lucide-react';
import { toast } from 'react-toastify';

// Custom toast content component
const EmailToastContent = ({ notification, onViewEmail }) => {
    const handleViewEmail = () => {
        if (onViewEmail) {
            onViewEmail(notification);
        }
    };

    const handleClose = () => {
        toast.dismiss();
    };

    return (
        <div className="p-4 max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">
                        New Email{notification.count > 1 ? `s (${notification.count})` : ''}
                    </span>
                </div>
                <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            {notification.emails && notification.emails.length > 0 ? (
                <div className="space-y-3">
                    {notification.emails.slice(0, 3).map((email, index) => (
                        <div key={email.email_id || index} className="border-l-4 border-blue-500 pl-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                            {email.from || 'Unknown Sender'}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">
                                        {email.subject || '(No Subject)'}
                                    </h4>
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                        {email.body ? email.body.slice(0, 100) + (email.body.length > 100 ? '...' : '') : 'No content'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {notification.emails.length > 3 && (
                        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                            +{notification.emails.length - 3} more email{notification.emails.length - 3 > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-4">
                    <Mail className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">New email received</p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>Just now</span>
                </div>
                
                <div className="flex space-x-2">
                    <button
                        onClick={handleClose}
                        className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={handleViewEmail}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        View
                    </button>
                </div>
            </div>
        </div>
    );
};

// Function to show email notification toast
export const showEmailNotificationToast = (notification, onViewEmail) => {
    const toastId = `email-${notification.timestamp}-${Date.now()}`;
    
    toast.info(
        <EmailToastContent 
            notification={notification} 
            onViewEmail={onViewEmail}
        />,
        {
            toastId,
            position: "top-right",
            autoClose: 8000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            className: "email-notification-toast",
            bodyClassName: "p-0",
            closeButton: false,
        }
    );

    return toastId;
};

// Function to dismiss email notification toast
export const dismissEmailNotificationToast = (toastId) => {
    toast.dismiss(toastId);
};

// Function to update email notification toast
export const updateEmailNotificationToast = (toastId, notification, onViewEmail) => {
    toast.update(toastId, {
        render: <EmailToastContent 
            notification={notification} 
            onViewEmail={onViewEmail}
        />,
        autoClose: 8000,
    });
};

// Default export for backward compatibility
const EmailNotificationToast = ({ notification, onClose, onViewEmail }) => {
    // This component is now just a wrapper that shows the toast
    React.useEffect(() => {
        if (notification) {
            const toastId = showEmailNotificationToast(notification, onViewEmail);
            
            // Auto-dismiss after 8 seconds
            const timer = setTimeout(() => {
                dismissEmailNotificationToast(toastId);
                if (onClose) onClose();
            }, 8000);

            return () => {
                clearTimeout(timer);
                dismissEmailNotificationToast(toastId);
            };
        }
    }, [notification, onClose, onViewEmail]);

    return null; // This component doesn't render anything
};

export default EmailNotificationToast;
