import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import { Button } from './Button'
import CallTranscriptionDisplay from './CallTranscriptionDisplay'

const TwilioCallComponent = ({
    accepted, 
    callInfo, 
    status, 
    hangupCall, 
    toggleMute, 
    isMuted, 
    controllView, 
    timer,
    transcript,
    isTranscribing,
    onToggleTranscription,
    isTranscriptionEnabled,
    isIncoming = false,
    acceptCall,
    rejectCall
}) => {
    const ringtoneRef = useRef(null);

    // Play ringtone for incoming calls
    useEffect(() => {
        if (isIncoming && controllView === 'incoming') {
            // Create a simple ringtone using Web Audio API
            let audioContext;
            let beepInterval;
            
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                const playBeep = () => {
                    try {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        // Phone ringtone pattern: two beeps
                        oscillator.frequency.value = 800;
                        oscillator.type = 'sine';
                        
                        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                        
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.3);
                        
                        // Second beep after short delay
                        setTimeout(() => {
                            const oscillator2 = audioContext.createOscillator();
                            const gainNode2 = audioContext.createGain();
                            
                            oscillator2.connect(gainNode2);
                            gainNode2.connect(audioContext.destination);
                            
                            oscillator2.frequency.value = 800;
                            oscillator2.type = 'sine';
                            
                            gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime);
                            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                            
                            oscillator2.start(audioContext.currentTime);
                            oscillator2.stop(audioContext.currentTime + 0.3);
                        }, 400);
                    } catch (err) {
                        console.log('Error playing ringtone:', err);
                    }
                };
                
                // Play ringtone pattern every 3 seconds
                beepInterval = setInterval(playBeep, 3000);
                playBeep(); // Play immediately
            } catch (err) {
                console.log('Error initializing audio context:', err);
            }
            
            return () => {
                if (beepInterval) {
                    clearInterval(beepInterval);
                }
                if (audioContext) {
                    audioContext.close().catch(() => {});
                }
            };
        }
    }, [isIncoming, controllView]);

    return (
        <div className={`fixed inset-0 overflow-y-auto z-[9999] p-5 transition-all flex items-center justify-center ${
            isIncoming && controllView === 'incoming' 
                ? 'bg-black/60 backdrop-blur-sm' 
                : 'bg-black/10'
        }`}>
          
            <div className={`${
                isIncoming && controllView === 'incoming'
                    ? 'bg-gradient-to-br from-blue-50 to-white shadow-2xl border-2 border-blue-300 animate-pulse'
                    : 'bg-white shadow-sm'
            } rounded-lg min-h-[20rem] mx-auto p-6 relative w-[28rem] pt-12 flex flex-col items-center`}>
                <div className='flex items-center justify-center flex-col gap-4'>
                    {isIncoming && controllView === 'incoming' && (
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-ping">
                            <Phone className="h-8 w-8 text-white" />
                        </div>
                    )}
                    <h3 className={`text-3xl font-semibold ${
                        isIncoming && controllView === 'incoming' 
                            ? 'text-blue-700' 
                            : 'text-black'
                    }`}>
                        {callInfo?.name || callInfo?.number}
                    </h3>
                    {callInfo?.number && callInfo?.name && callInfo?.name !== callInfo?.number && (
                        <p className="text-sm text-gray-600">{callInfo?.number}</p>
                    )}
                </div>
                <div className='flex-1'></div>
                
                {
                    controllView != 'processing' && 
                    <p className={`text-lg font-medium ${
                        isIncoming && controllView === 'incoming'
                            ? 'text-blue-600 animate-pulse'
                            : 'text-green-500'
                    }`}>
                        {status}
                    </p>
                }
                {
                    controllView == 'processing' && 
                    <p className='text-green-500 text-lg font-medium'>{timer}</p>
                }

                <div className='flex-1'></div>
                
                {/* when call processing  */}
                {
                    (controllView == 'processing') &&
                    <div className='mt-4 flex items-center gap-20 justify-center'>
                        <Button className={'bg-gray-500 rounded-full hover:bg-gray-600 text-white'} size='icon' onClick={toggleMute}>
                            {
                                isMuted ? <MicOff/> : <Mic />
                            }
                        </Button>

                        <Button className={'bg-red-500 rounded-full hover:bg-red-600'} size='icon' onClick={hangupCall}>
                            <Phone />
                        </Button>
                    </div>
                }

                {/* when call ringing (outgoing)  */}
                {
                    (controllView == 'ringing' && !isIncoming) &&
                    <div className='mt-4 flex items-center gap-20 justify-center'>
                        <Button className={'bg-red-500 rounded-full hover:bg-red-600'} size='icon' onClick={hangupCall}>
                            <Phone />
                        </Button>
                    </div>
                }

                {/* when incoming call  */}
                {
                    (controllView == 'incoming' && isIncoming) &&
                    <div className='mt-6 flex items-center gap-12 justify-center'>
                        <div className="flex flex-col items-center gap-2">
                            <Button 
                                className={'bg-green-500 rounded-full hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-110 w-16 h-16'} 
                                size='icon' 
                                onClick={acceptCall}
                            >
                                <Phone className="h-8 w-8" />
                            </Button>
                            <span className="text-xs text-gray-600 font-medium">Answer</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Button 
                                className={'bg-red-500 rounded-full hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-110 w-16 h-16'} 
                                size='icon' 
                                onClick={rejectCall}
                            >
                                <PhoneOff className="h-8 w-8" />
                            </Button>
                            <span className="text-xs text-gray-600 font-medium">Decline</span>
                        </div>
                    </div>
                }

                {/* Transcription Display - only show when call is processing */}
                {
                    (controllView == 'processing') &&
                    <CallTranscriptionDisplay
                        transcript={transcript}
                        isTranscribing={isTranscribing}
                        onToggleTranscription={onToggleTranscription}
                        isTranscriptionEnabled={isTranscriptionEnabled}
                    />
                }
            </div>
        </div>
    )
}

export default TwilioCallComponent