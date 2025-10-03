import { Mic, MicOff, Phone } from 'lucide-react'
import React from 'react'
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
    isTranscriptionEnabled
}) => {
    return (
        <div className={`absolute top-0 left-0 right-0 bottom-0 overflow-y-auto z-50 p-5 bg-black/10 transition-all flex items-center justify-center`}>
          
            <div className={`bg-white shadow-sm rounded-md min-h-[16rem] mx-auto p-4 relative w-[24rem] pt-10 flex flex-col items-center`}>
                <div className='flex items-center justify-center flex-col gap-4'>
                    <h3 className='text-3xl text-black'>{callInfo?.name || callInfo?.number}</h3>
                </div>
                <div className='flex-1'></div>
                
                {
                    controllView != 'processing' && 
                    <p className='text-green-500'>{status}</p>
                }
                {
                    controllView == 'processing' && 
                    <p className='text-green-500'>{timer}</p>
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

                {/* when call ringing  */}
                {
                    (controllView == 'ringing') &&
                    <div className='mt-4 flex items-center gap-20 justify-center'>
                        <Button className={'bg-red-500 rounded-full hover:bg-red-600'} size='icon' onClick={hangupCall}>
                            <Phone />
                        </Button>
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