'use client';

import { useEffect, useState, useCallback } from 'react';
import { Room, RoomEvent, Track, ConnectionState } from 'livekit-client';
import { useRouter } from 'next/navigation';
import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  RoomContext,
  useRoomContext,
  useParticipants,
  useLocalParticipant,
  useRemoteParticipants,
  useTrack,
  useDataChannel,
  useRoom,
  useTranscriptions,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { toast } from 'react-toastify';
import Loader from './Loader';
import LiveCaptions from './LiveCaptions';
import liveKitMeetingService from '@/lib/services/liveKitMeetingService';

const LiveKitMeeting = ({ meetingId }) => {
  const router = useRouter();
  const [room] = useState(() => new Room({
    // Optimize video quality for each participant's screen
    adaptiveStream: true,
    // Enable automatic audio/video quality optimization
    dynacast: true,
  }));

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [meetingData, setMeetingData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showTranscriptions, setShowTranscriptions] = useState(true);
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  // Fetch meeting token and connect to room
  const connectToRoom = useCallback(async () => {
    if (!meetingId || isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      // Fetch LiveKit token from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/meeting/token/${meetingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get meeting token');
      }

      const data = await response.json();
      setMeetingData(data.meeting);

      // Connect to LiveKit room
      await room.connect(data.serverUrl, data.token);
      setIsConnected(true);
      toast.success('Connected to meeting successfully!');

    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
      toast.error(`Connection failed: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  }, [meetingId, room, isConnecting, isConnected]);

  // Navigate to dashboard function
  const navigateToDashboard = useCallback(() => {
    if (hasNavigated) return;
    
    setHasNavigated(true);
    console.log('Navigating to dashboard');
    // Use window.location.href for more reliable navigation
    window.location.href = '/dashboard';
  }, [hasNavigated]);

  // Handle room events
  useEffect(() => {
    const handleConnectionStateChange = (state) => {
      console.log('Connection state changed:', state);
      if (state === ConnectionState.Disconnected) {
        setIsConnected(false);
        toast.info('Disconnected from meeting');
        
        // Navigate to dashboard when disconnected
        setTimeout(() => {
          navigateToDashboard();
        }, 1000);
      }
    };

    const handleParticipantConnected = (participant) => {
      console.log('Participant connected:', participant.identity);
      toast.info(`${participant.name || participant.identity} joined the meeting`);
    };

    const handleParticipantDisconnected = (participant) => {
      console.log('Participant disconnected:', participant.identity);
      toast.info(`${participant.name || participant.identity} left the meeting`);
    };

    const handleTrackSubscribed = (track, publication, participant) => {
      console.log('Track subscribed:', track.kind, participant.identity);
    };

    const handleTrackUnsubscribed = (track, publication, participant) => {
      console.log('Track unsubscribed:', track.kind, participant.identity);
    };

    const handleDataReceived = (payload, participant) => {
      console.log('Data received:', payload.topic, participant.identity);
      
      try {
        // Parse the received data
        const data = JSON.parse(new TextDecoder().decode(payload));
        
        // Handle end meeting command
        if (data.type === 'end_meeting' && data.meetingId === meetingId) {
          console.log('Received end meeting command from:', participant.identity);
          
          // Show notification
          toast.info('Meeting has been ended by the host');
          
          // Disconnect from room
          if (room && isConnected) {
            room.disconnect();
            setIsConnected(false);
          }
          
          // Navigate to dashboard
          setTimeout(() => {
            navigateToDashboard();
          }, 1000);
        }
      } catch (error) {
        console.log('Could not parse data:', error);
        // Note: Transcription is now handled by LiveKit's built-in hooks
      }
    };

    // Add event listeners
    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChange);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    room.on(RoomEvent.DataReceived, handleDataReceived);

    // Cleanup
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChange);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, navigateToDashboard]);

  // Connect on mount
  useEffect(() => {
    connectToRoom();
  }, [connectToRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room && isConnected) {
        room.disconnect();
      }
    };
  }, [room, isConnected]);

  // Handle room events
  const handleDisconnect = () => {
    if (room && isConnected) {
      room.disconnect();
      setIsConnected(false);
      
      // Show toast and navigate immediately
      toast.info('Leaving meeting...');
      
      // Navigate to dashboard immediately
      navigateToDashboard();
    }
  };

  // Handle end meeting
  const handleEndMeeting = async () => {
    if (!meetingId || isEndingMeeting) return;

    setIsEndingMeeting(true);
    
    try {
      // End the meeting via API
      await liveKitMeetingService.endMeeting(meetingId);
      
      // Broadcast end meeting command to all participants
      if (room && isConnected) {
        const endMeetingData = {
          type: 'end_meeting',
          meetingId: meetingId,
          timestamp: Date.now()
        };
        
        // Send to all participants via data channel
        await room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(endMeetingData)),
          { reliable: true }
        );
        
        // Disconnect from room
        room.disconnect();
        setIsConnected(false);
      }
      
      toast.success('Meeting ended successfully!');
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigateToDashboard();
      }, 500);
      
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast.error(`Failed to end meeting: ${error.message}`);
    } finally {
      setIsEndingMeeting(false);
    }
  };

  // Handle window close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isConnected) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave the meeting?';
        handleDisconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isConnected]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={connectToRoom}
              disabled={isConnecting}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? 'Reconnecting...' : 'Retry Connection'}
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/home'}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <Loader />
          <h2 className="text-xl font-semibold text-gray-800 mt-4">Connecting to Meeting</h2>
          <p className="text-gray-600 mt-2">Please wait while we connect you to the meeting...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-blue-500 text-6xl mb-4">📹</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Join Meeting</h2>
          {meetingData && (
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800">{meetingData.heading}</h3>
              <p className="text-gray-600 text-sm mt-1">{meetingData.description}</p>
            </div>
          )}
          <button
            onClick={connectToRoom}
            disabled={isConnecting}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Connecting...' : 'Join Meeting'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <RoomContext.Provider value={room}>
      <div className="min-h-screen bg-gray-900" data-lk-theme="default">
        {/* Meeting Header */}
        <div className="bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {meetingData?.heading || 'Live Meeting'}
            </h1>
            <p className="text-sm text-gray-600">
              Meeting ID: {meetingId}
            </p>
          </div>
        </div>

        {/* Video Conference Area */}
        <div className="flex-1 p-4 relative">
          {/* Video Conference */}
          <div className="w-full h-full">
            <MyVideoConference />
          </div>
          
          {/* Live Captions Overlay */}
          {showTranscriptions && <LiveCaptions />}
        </div>

        {/* Audio Renderer */}
        <RoomAudioRenderer />

        {/* Custom Control Bar without Start Audio button */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-4 py-2">
            {/* Camera Toggle */}
            <button className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
              </svg>
            </button>
            
            {/* Screen Share */}
            <button className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
            </button>
            
            {/* Chat */}
            <button className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
              </svg>
            </button>
            
            {/* Leave Meeting */}
            <button 
              onClick={() => {
                if (room && isConnected) {
                  room.disconnect();
                }
                window.location.href = '/dashboard';
              }}
              className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Custom End Meeting Button - Floating */}
        <div className="fixed bottom-20 right-4 z-50">
          <button
            onClick={handleEndMeeting}
            disabled={isEndingMeeting}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {isEndingMeeting ? 'Ending...' : 'End Meeting'}
          </button>
        </div>
      </div>
    </RoomContext.Provider>
  );
};

// Video Conference Component
function MyVideoConference() {
  const room = useRoomContext();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  // Get all camera and screen share tracks
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className="h-full">
      <GridLayout 
        tracks={tracks} 
        style={{ height: 'calc(100vh - 200px)' }}
        className="rounded-lg overflow-hidden"
      >
        <ParticipantTile />
      </GridLayout>
      
      {/* Participants Info */}
      <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Participants ({participants.length})</h3>
        <div className="flex flex-wrap gap-2">
          {participants.map((participant) => (
            <div
              key={participant.identity}
              className={`px-3 py-1 rounded-full text-xs ${
                participant.identity === localParticipant.localParticipant?.identity
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {participant.name || participant.identity}
              {participant.identity === localParticipant.localParticipant?.identity && ' (You)'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LiveKitMeeting;
