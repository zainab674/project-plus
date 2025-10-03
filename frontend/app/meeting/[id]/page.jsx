'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import LiveKitMeeting from '@/components/LiveKitMeeting';
import Loader from '@/components/Loader';

export default function MeetingPage() {
  const params = useParams();
  const meetingId = params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (meetingId) {
      setLoading(false);
    }
  }, [meetingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Meeting Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <LiveKitMeeting meetingId={meetingId} />
    </div>
  );
}
