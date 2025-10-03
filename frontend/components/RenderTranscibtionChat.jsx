import React, { useMemo, useState } from 'react'
import { Button } from './Button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import moment from 'moment';

const RenderTranscibtionChat = ({ transcribtion }) => {
    const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

    const viewLenght = useMemo(() => (isTranscriptOpen ? transcribtion?.length : 3), [isTranscriptOpen]);
    
    return (
        <>
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Meeting Transcriptions</h3>
                <div className="space-y-3">
                    {transcribtion.slice(0, viewLenght).map((transcribe, index) => (
                        <div key={index} className="bg-white rounded-md p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">
                                    {transcribe?.user?.name}
                                </span>
                                <time className="text-xs text-gray-500">
                                    {moment(transcribe?.created_at).format('HH:mm:ss')}
                                </time>
                            </div>
                            <p className="text-gray-800 leading-relaxed">
                                {transcribe.transcribe}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            
            {transcribtion.length > 3 && (
                <div className='flex items-center mt-3'>
                    <Button
                        variant="ghost"
                        className="text-primary"
                        onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                    >
                        {isTranscriptOpen ? (
                            <>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Show Less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Show More ({transcribtion.length - 3} more)
                            </>
                        )}
                    </Button>
                </div>
            )}
        </>
    )
}

export default RenderTranscibtionChat