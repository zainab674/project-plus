import { useState, useEffect, useCallback } from 'react';
import { Room, RoomEvent, ConnectionState } from 'livekit-client';
import liveKitMeetingService from '@/lib/services/liveKitMeetingService';

export const useLiveKitMeeting = (meetingId) => {
  const [room] = useState(() => new Room({
    adaptiveStream: true,
    dynacast: true,
  }));

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [meetingData, setMeetingData] = useState(null);
  const [connectionState, setConnectionState] = useState(ConnectionState.Disconnected);

  // Connect to meeting
  const connect = useCallback(async () => {
    if (!meetingId || isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      const data = await liveKitMeetingService.generateMeetingToken(meetingId);
      setMeetingData(data.meeting);

      await room.connect(data.serverUrl, data.token);
      setIsConnected(true);
      setConnectionState(ConnectionState.Connected);

      return data;
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [meetingId, room, isConnecting, isConnected]);

  // Disconnect from meeting
  const disconnect = useCallback(() => {
    if (room && isConnected) {
      room.disconnect();
      setIsConnected(false);
      setConnectionState(ConnectionState.Disconnected);
    }
  }, [room, isConnected]);

  // Handle room events
  useEffect(() => {
    const handleConnectionStateChange = (state) => {
      setConnectionState(state);
      if (state === ConnectionState.Disconnected) {
        setIsConnected(false);
      } else if (state === ConnectionState.Connected) {
        setIsConnected(true);
      }
    };

    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChange);

    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChange);
    };
  }, [room]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room && isConnected) {
        room.disconnect();
      }
    };
  }, [room, isConnected]);

  return {
    room,
    isConnected,
    isConnecting,
    error,
    meetingData,
    connectionState,
    connect,
    disconnect,
  };
};

export const useMeetingValidation = (meetingId) => {
  const [isValidating, setIsValidating] = useState(false);
  const [hasAccess, setHasAccess] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [meetingDetails, setMeetingDetails] = useState(null);

  const validateAccess = useCallback(async () => {
    if (!meetingId) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await liveKitMeetingService.validateMeetingAccess(meetingId);
      setHasAccess(result.hasAccess);
      
      if (result.hasAccess) {
        setMeetingDetails(result.meeting);
      } else {
        setValidationError(result.error);
      }
    } catch (error) {
      setHasAccess(false);
      setValidationError(error.message);
    } finally {
      setIsValidating(false);
    }
  }, [meetingId]);

  useEffect(() => {
    validateAccess();
  }, [validateAccess]);

  return {
    isValidating,
    hasAccess,
    validationError,
    meetingDetails,
    revalidate: validateAccess,
  };
};
