'use client';

import { useTranscriptions } from '@livekit/components-react';

const LiveCaptions = () => {
  const { segments } = useTranscriptions(); // interim + final segments
  
  // Check if segments exists and is an array before using .at()
  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return null;
  }
  
  // Get the latest segment
  const lastSegment = segments.at(-1);
  
  if (!lastSegment) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="inline-block px-4 py-2 rounded-lg bg-black/80 text-white text-sm max-w-md text-center shadow-lg">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xs text-gray-300">
            {lastSegment.participant?.identity || 'Speaker'}
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span className={`text-xs ${lastSegment.isFinal ? 'text-green-300' : 'text-yellow-300'}`}>
            {lastSegment.isFinal ? 'Final' : 'Interim'}
          </span>
        </div>
        <div className="mt-1">
          {lastSegment.text || '…'}
        </div>
      </div>
    </div>
  );
};

export default LiveCaptions;
