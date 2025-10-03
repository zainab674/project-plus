'use client';

import { useState } from 'react';
import { Video, Play, Users, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const JoinMeetingButton = ({ 
  meetingId, 
  meetingTitle, 
  isScheduled = false, 
  status = 'PROCESSING',
  className = '',
  size = 'default',
  showDetails = false 
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleJoinMeeting = async () => {
    if (!meetingId) return;
    
    setIsJoining(true);
    
    try {
      // Navigate to the meeting page
      router.push(`/meeting/${meetingId}`);
    } catch (error) {
      console.error('Error joining meeting:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const canJoin = status === 'PROCESSING' || status === 'SCHEDULED' || status === 'CONFIRMED';
  
  const buttonSizes = {
    small: 'px-3 py-1 text-sm',
    default: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  };

  const iconSizes = {
    small: 14,
    default: 16,
    large: 20
  };

  if (!canJoin) {
    return (
      <div className={`inline-flex items-center px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed ${className}`}>
        <Clock className="mr-2" size={iconSizes[size]} />
        <span className="text-sm">Meeting Not Available</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {showDetails && meetingTitle && (
        <div className="mb-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-gray-800 text-sm">{meetingTitle}</h4>
          <p className="text-xs text-gray-600 mt-1">
            {isScheduled ? 'Scheduled Meeting' : 'Live Meeting'}
          </p>
        </div>
      )}
      
      <button
        onClick={handleJoinMeeting}
        disabled={isJoining}
        className={`
          inline-flex items-center justify-center
          ${buttonSizes[size]}
          bg-green-600 hover:bg-green-700 
          text-white rounded-lg 
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          font-medium
        `}
      >
        {isJoining ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            <span>Joining...</span>
          </>
        ) : (
          <>
            <Video className="mr-2" size={iconSizes[size]} />
            <span>Join Meeting</span>
          </>
        )}
      </button>
    </div>
  );
};

// Quick meeting join component for cards
export const QuickJoinMeeting = ({ meetingId, meetingTitle, status }) => (
  <JoinMeetingButton
    meetingId={meetingId}
    meetingTitle={meetingTitle}
    status={status}
    size="small"
    showDetails={true}
  />
);

// Meeting status indicator
export const MeetingStatusBadge = ({ status, isScheduled }) => {
  const statusConfig = {
    'PROCESSING': { color: 'bg-blue-100 text-blue-800', text: 'Live' },
    'SCHEDULED': { color: 'bg-green-100 text-green-800', text: 'Scheduled' },
    'CONFIRMED': { color: 'bg-green-100 text-green-800', text: 'Confirmed' },
    'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
    'CANCELED': { color: 'bg-red-100 text-red-800', text: 'Canceled' },
    'COMPLETED': { color: 'bg-gray-100 text-gray-800', text: 'Completed' }
  };

  const config = statusConfig[status] || statusConfig['PENDING'];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <div className="w-2 h-2 bg-current rounded-full mr-1"></div>
      {config.text}
    </span>
  );
};

// Meeting card component
export const MeetingCard = ({ meeting }) => {
  const canJoin = meeting.status === 'PROCESSING' || meeting.status === 'SCHEDULED' || meeting.status === 'CONFIRMED';
  
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-lg mb-1">{meeting.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{meeting.description}</p>
        </div>
        <MeetingStatusBadge status={meeting.status} isScheduled={meeting.isScheduled} />
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
        <div className="flex items-center">
          <Clock className="mr-1" size={14} />
          <span>{meeting.time}</span>
        </div>
        <div className="flex items-center">
          <Users className="mr-1" size={14} />
          <span>{meeting.participants?.length || 0} participants</span>
        </div>
      </div>
      
      {canJoin && (
        <div className="pt-3 border-t border-gray-100">
          <JoinMeetingButton
            meetingId={meeting.meeting_id}
            meetingTitle={meeting.title}
            status={meeting.status}
            isScheduled={meeting.isScheduled}
            size="small"
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

export default JoinMeetingButton;
