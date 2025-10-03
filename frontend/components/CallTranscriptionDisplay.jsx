import React from 'react';
import { Mic, MicOff, FileText } from 'lucide-react';
import { Button } from './ui/button';

const CallTranscriptionDisplay = ({ 
    transcript, 
    isTranscribing, 
    onToggleTranscription,
    isTranscriptionEnabled = true 
}) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-medium text-gray-900">Live Transcription</h3>
                </div>
                <div className="flex items-center gap-2">
                    {isTranscribing && (
                        <div className="flex items-center gap-1 text-green-600">
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                            <span className="text-xs">Listening</span>
                        </div>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleTranscription}
                        className="h-8 px-2"
                    >
                        {isTranscriptionEnabled ? (
                            <Mic className="h-3 w-3" />
                        ) : (
                            <MicOff className="h-3 w-3" />
                        )}
                    </Button>
                </div>
            </div>
            
            <div className="bg-gray-50 rounded-md p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
                {transcript ? (
                    <p className="text-sm text-gray-800 leading-relaxed">
                        {transcript}
                    </p>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <Mic className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">
                                {isTranscribing ? 'Listening for speech...' : 'Transcription will appear here'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            {transcript && (
                <div className="mt-2 text-xs text-gray-500 text-right">
                    {transcript.split(' ').length} words transcribed
                </div>
            )}
        </div>
    );
};

export default CallTranscriptionDisplay;
