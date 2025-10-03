# Real-Time Email Notifications with Toast

This document describes the real-time email notification system implemented in the application using toast notifications.

## Overview

The real-time email notification system provides instant toast notifications when new emails arrive, updates email counts in real-time, and allows users to perform email operations (mark as read, delete, archive) through WebSocket connections.

## Features

- **Real-time toast notifications**: Instant popup notifications when new emails arrive
- **Live email count**: Real-time updates of unread email count
- **Email operations**: Mark as read/unread, delete, archive emails in real-time
- **Connection status**: Monitor WebSocket connection status
- **Priority levels**: Visual indicators for different email volumes
- **Auto-dismiss**: Toast notifications automatically disappear after 8 seconds
- **Interactive toasts**: Click to view emails or dismiss notifications

## Architecture

### Backend Components

1. **EmailPollingService** (`backend/services/emailPollingService.js`)
   - Polls Gmail accounts every 5 minutes
   - Emits WebSocket events for new emails
   - Handles email operations (read, unread, delete, archive)
   - Manages user email counts

2. **WebSocket Integration** (`backend/config/chatServerConfig.js`)
   - Handles WebSocket connections
   - Manages user rooms for targeted notifications
   - Routes email-related events

### Frontend Components

1. **EmailNotificationService** (`frontend/services/emailNotificationService.jsx`)
   - Manages WebSocket connections
   - Handles real-time events
   - Provides email operation methods

2. **EmailNotificationProvider** (`frontend/providers/EmailNotificationProvider.jsx`)
   - Global context for email notifications
   - Manages notification state across the app
   - Automatically shows toast notifications

3. **EmailNotificationToast** (`frontend/components/mail/EmailNotificationToast.jsx`)
   - Toast notification functions
   - Custom toast content component
   - Toast management utilities

4. **EmailBadge** (`frontend/components/mail/EmailBadge.jsx`)
   - Visual indicator for unread email count
   - Multiple variants (minimal, badge, floating)
   - Priority-based styling with CSS animations

5. **EmailNotificationNav** (`frontend/components/navigation/EmailNotificationNav.jsx`)
   - Navigation component with email indicators
   - Connection status display
   - Quick actions for email management

## Toast Notifications

The system uses `react-toastify` for toast notifications, providing:

- **Automatic appearance**: Toast notifications appear instantly when new emails arrive
- **Rich content**: Shows email preview, sender, subject, and actions
- **Interactive elements**: View and dismiss buttons
- **Auto-dismiss**: Automatically disappears after 8 seconds
- **Progress bar**: Visual countdown to auto-dismiss
- **Custom styling**: Blue accent border and professional appearance

## Usage

### Basic Implementation

```jsx
import { useEmailNotifications } from '@/providers/EmailNotificationProvider';

function MyComponent() {
    const { 
        unreadCount, 
        hasUnreadEmails, 
        markEmailAsRead 
    } = useEmailNotifications();

    return (
        <div>
            <p>Unread emails: {unreadCount}</p>
            {hasUnreadEmails && (
                <p>You have unread emails!</p>
            )}
        </div>
    );
}
```

### Using the Hook

```jsx
import useEmailNotifications from '@/hooks/useEmailNotifications';

function MyComponent() {
    const {
        unreadCount,
        isConnected,
        markEmailAsRead,
        deleteEmail,
        reconnect
    } = useEmailNotifications();

    // Your component logic here
}
```

### Adding Email Badge to Navigation

```jsx
import EmailNotificationNav from '@/components/navigation/EmailNotificationNav';

function Header() {
    return (
        <header>
            <nav>
                <EmailNotificationNav variant="badge" />
            </nav>
        </header>
    );
}
```

### Custom Toast Notifications

```jsx
import { showEmailNotificationToast } from '@/components/mail/EmailNotificationToast';

function CustomNotification() {
    const notification = {
        count: 1,
        emails: [{
            email_id: '123',
            from: 'sender@example.com',
            subject: 'Test Email',
            body: 'This is a test email...'
        }],
        timestamp: new Date().toISOString()
    };

    const handleViewEmail = (notification) => {
        console.log('View email:', notification);
        // Navigate to email or perform action
    };

    const showNotification = () => {
        showEmailNotificationToast(notification, handleViewEmail);
    };

    return (
        <button onClick={showNotification}>
            Show Email Notification
        </button>
    );
}
```

## Configuration

### Backend Configuration

The email polling service is automatically configured when the server starts. Key settings:

- **Polling interval**: 5 minutes (configurable)
- **WebSocket namespace**: `/chat`
- **User rooms**: `user_{userId}` for targeted notifications

### Frontend Configuration

The system automatically connects when a user is authenticated. No additional configuration is required.

### Toast Styling

Custom CSS classes are available for styling toast notifications:

```css
.email-notification-toast {
  @apply border-l-4 border-l-blue-500 shadow-lg;
}

.email-notification-toast .Toastify__toast-body {
  @apply p-0;
}

.email-notification-toast .Toastify__progress-bar {
  @apply bg-blue-500;
}
```

## WebSocket Events

### Incoming Events

- `new_emails`: New email notifications (triggers toast)
- `email_count_update`: Updated unread email count
- `email_status_update`: Email operation confirmations

### Outgoing Events

- `request_email_count`: Request current email count
- `mark_email_read`: Mark email as read
- `mark_email_unread`: Mark email as unread
- `delete_email`: Delete email
- `archive_email`: Archive email

## Email Operations

### Mark as Read/Unread

```jsx
const { markEmailAsRead, markEmailAsUnread } = useEmailNotifications();

// Mark email as read
markEmailAsRead(emailId);

// Mark email as unread
markEmailAsUnread(emailId);
```

### Delete Email

```jsx
const { deleteEmail } = useEmailNotifications();

// Delete email
deleteEmail(emailId);
```

### Archive Email

```jsx
const { archiveEmail } = useEmailNotifications();

// Archive email
archiveEmail(emailId);
```

## Toast Management

### Show Toast

```jsx
import { showEmailNotificationToast } from '@/components/mail/EmailNotificationToast';

const toastId = showEmailNotificationToast(notification, onViewEmail);
```

### Dismiss Toast

```jsx
import { dismissEmailNotificationToast } from '@/components/mail/EmailNotificationToast';

dismissEmailNotificationToast(toastId);
```

### Update Toast

```jsx
import { updateEmailNotificationToast } from '@/components/mail/EmailNotificationToast';

updateEmailNotificationToast(toastId, updatedNotification, onViewEmail);
```

## Notification Types

### Toast Notifications

- **Auto-dismiss**: 8 seconds
- **Click to view**: Navigate to email
- **Manual dismiss**: Close button
- **Progress bar**: Visual countdown
- **Rich content**: Email preview with sender and subject

### Badge Indicators

- **Minimal**: Icon with count
- **Badge**: Bell icon with count
- **Floating**: Mobile-friendly floating action button

## Priority Levels

The system automatically categorizes email volume:

- **None**: 0 unread emails
- **Low**: 1-4 unread emails (blue)
- **Medium**: 5-9 unread emails (yellow)
- **High**: 10+ unread emails (red)

## Error Handling

### Connection Issues

- Automatic reconnection attempts
- Visual connection status indicators
- Manual reconnect button
- Graceful degradation when disconnected

### Email Operation Failures

- Operations are queued when disconnected
- Automatic retry on reconnection
- User feedback for failed operations

## Performance Considerations

### Backend

- Email polling limited to 5-minute intervals
- WebSocket connections are lightweight
- Database operations are optimized
- Connection pooling for multiple users

### Frontend

- Toast notifications are lightweight
- Auto-cleanup prevents memory leaks
- Efficient state management
- Minimal re-renders

## Security

- User-specific WebSocket rooms
- Authentication required for connections
- Email operations validated by user ID
- No cross-user data exposure

## Troubleshooting

### Common Issues

1. **Toast notifications not appearing**
   - Check WebSocket connection status
   - Verify user authentication
   - Check browser console for errors
   - Ensure react-toastify is properly configured

2. **Email count not updating**
   - Refresh the page
   - Check connection status
   - Verify Gmail connection

3. **WebSocket connection issues**
   - Check network connectivity
   - Verify backend server status
   - Check CORS configuration

### Debug Mode

Enable debug logging by setting:

```javascript
localStorage.setItem('emailNotificationsDebug', 'true');
```

## Example Component

A complete example component is available at:

```jsx
import EmailNotificationExample from '@/components/examples/EmailNotificationExample';

// Use in your app to test the notification system
<EmailNotificationExample />
```

## Future Enhancements

- **Push notifications**: Browser push notifications
- **Sound alerts**: Audio notifications for new emails
- **Email filtering**: Smart notification rules
- **Batch operations**: Bulk email management
- **Mobile optimization**: Better mobile experience
- **Offline support**: Queue operations when offline
- **Custom toast themes**: Multiple toast appearance options

## Support

For technical support or questions about the email notification system, please refer to the development team or create an issue in the project repository.
