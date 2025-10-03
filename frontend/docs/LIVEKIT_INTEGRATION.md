# LiveKit Meeting Integration

This document describes the LiveKit integration for video meetings in the project-plus application.

## Overview

The LiveKit integration provides real-time video conferencing capabilities for meetings. It includes:

- **Backend**: Token generation and meeting management
- **Frontend**: React components for video conferencing
- **Authentication**: Secure token-based access control

## Backend Implementation

### 1. Dependencies

The LiveKit server SDK is already installed in `backend/package.json`:
```json
"livekit-server-sdk": "^2.13.3"
```

### 2. Environment Variables

Ensure these environment variables are set in your `.env` file:
```bash
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
LIVEKIT_HOST=https://your-livekit-server.com
```

### 3. API Endpoints

#### Generate Meeting Token
- **Endpoint**: `GET /api/v1/meeting/token/:meeting_id`
- **Authentication**: Required (Bearer token)
- **Response**: 
```json
{
  "success": true,
  "token": "jwt-token",
  "roomName": "meeting-{meeting_id}",
  "serverUrl": "wss://your-livekit-server.com",
  "meeting": {
    "meeting_id": "123",
    "heading": "Meeting Title",
    "description": "Meeting Description",
    "status": "PROCESSING"
  }
}
```

### 4. Controller Functions

- `generateLiveKitToken()`: Creates JWT tokens for meeting access
- Validates user permissions (meeting creator or participant)
- Sets appropriate room permissions (publish, subscribe, etc.)

## Frontend Implementation

### 1. Dependencies

Install LiveKit React components:
```bash
npm install @livekit/components-react @livekit/components-styles livekit-client --save
```

### 2. Components

#### LiveKitMeeting Component
- **Location**: `frontend/components/LiveKitMeeting.jsx`
- **Purpose**: Main video conferencing interface
- **Features**:
  - Automatic connection to LiveKit room
  - Video/audio controls
  - Participant management
  - Error handling and reconnection

#### JoinMeetingButton Component
- **Location**: `frontend/components/JoinMeetingButton.jsx`
- **Purpose**: Reusable button for joining meetings
- **Variants**:
  - `JoinMeetingButton`: Main component
  - `QuickJoinMeeting`: For cards and lists
  - `MeetingStatusBadge`: Status indicator
  - `MeetingCard`: Complete meeting card

### 3. Services

#### LiveKitMeetingService
- **Location**: `frontend/lib/services/liveKitMeetingService.js`
- **Purpose**: API communication for meeting operations
- **Methods**:
  - `generateMeetingToken(meetingId)`
  - `getMeetingDetails(meetingId)`
  - `updateMeetingStatus(meetingId, status)`
  - `validateMeetingAccess(meetingId)`

### 4. Hooks

#### useLiveKitMeeting
- **Location**: `frontend/hooks/useLiveKitMeeting.js`
- **Purpose**: React hook for managing meeting state
- **Returns**:
  - `room`: LiveKit room instance
  - `isConnected`: Connection status
  - `isConnecting`: Loading state
  - `error`: Error messages
  - `meetingData`: Meeting information
  - `connect()`: Connect function
  - `disconnect()`: Disconnect function

### 5. Routes

#### Meeting Page
- **Location**: `frontend/app/meeting/[id]/page.jsx`
- **Purpose**: Main meeting interface
- **Features**:
  - Dynamic meeting ID routing
  - Loading states
  - Error handling
  - Automatic connection

## Usage Examples

### 1. Basic Meeting Join

```jsx
import JoinMeetingButton from '@/components/JoinMeetingButton';

<JoinMeetingButton
  meetingId="123"
  meetingTitle="Team Meeting"
  status="PROCESSING"
  isScheduled={false}
/>
```

### 2. Meeting Card

```jsx
import { MeetingCard } from '@/components/JoinMeetingButton';

<MeetingCard meeting={meetingData} />
```

### 3. Custom Hook Usage

```jsx
import { useLiveKitMeeting } from '@/hooks/useLiveKitMeeting';

const MyComponent = ({ meetingId }) => {
  const { room, isConnected, connect, disconnect } = useLiveKitMeeting(meetingId);
  
  return (
    <div>
      {isConnected ? (
        <button onClick={disconnect}>Leave Meeting</button>
      ) : (
        <button onClick={connect}>Join Meeting</button>
      )}
    </div>
  );
};
```

## Integration Points

### 1. Meeting Dashboard
- **Location**: `frontend/components/dashboards/meetings.jsx`
- **Integration**: Updated to use `JoinMeetingButton` and `MeetingStatusBadge`
- **Features**: Status indicators and quick join buttons

### 2. Meeting Creation
- Existing meeting creation flow remains unchanged
- LiveKit integration is automatically available for all meetings

### 3. Authentication
- Uses existing JWT authentication system
- Meeting access is validated based on user permissions

## Security Features

1. **Token-based Authentication**: JWT tokens with expiration
2. **Permission Validation**: Users can only join meetings they're invited to
3. **Room Isolation**: Each meeting has a unique room name
4. **Secure Token Generation**: Tokens are generated server-side

## Error Handling

### Backend Errors
- Invalid meeting ID
- Unauthorized access
- Token generation failures

### Frontend Errors
- Connection failures
- Authentication errors
- Network issues
- Room access denied

## Testing

### 1. Backend Testing
Test the token generation endpoint:
```bash
curl -X GET "http://localhost:3000/api/v1/meeting/token/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Frontend Testing
1. Navigate to `/meeting/{meeting_id}`
2. Verify connection to LiveKit room
3. Test video/audio controls
4. Verify participant management

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check LiveKit server URL
   - Verify API keys
   - Check network connectivity

2. **Token Generation Error**
   - Verify user authentication
   - Check meeting permissions
   - Validate meeting ID

3. **Video/Audio Issues**
   - Check browser permissions
   - Verify device access
   - Test with different browsers

### Debug Mode

Enable debug logging by setting:
```javascript
room.setLogLevel('debug');
```

## Future Enhancements

1. **Recording**: Add meeting recording capabilities
2. **Screen Sharing**: Enhanced screen sharing features
3. **Chat**: Real-time chat during meetings
4. **Breakout Rooms**: Sub-meeting functionality
5. **Analytics**: Meeting analytics and insights

## Support

For LiveKit-specific issues, refer to:
- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit GitHub](https://github.com/livekit)
- [LiveKit Community](https://github.com/livekit/livekit/discussions)
