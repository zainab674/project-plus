'use client'
import { getNameAvatar } from '@/utils/getNameAvatar'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getColorByFirstLetter } from '@/utils/getColorByFirstLetter'
import { Button } from '@/components/ui/button'
import { Phone } from 'lucide-react'
import { WebRTC } from '@/services/webRTCService'
import { v4 as uuid } from 'uuid'
import { useUser } from '@/providers/UserProvider'
import { ON_CALL_ANSWER, ON_CALL_END, ON_CALL_NO_RESPONSE, ON_SIGNAL } from '@/contstant/chatEventConstant'
import DurationCounter from '../chat/DurationCount'
import { calculateTimeDifference } from '@/utils/calculateTimeDifference'

const CallStatus = {
    processing: 'processing',
    ringing: 'ringing',
    call_coming: 'call_coming',
    rejected: 'rejected',
    no_response: 'no_response',
    ended: "ended",
    missed_call: "missed_call",
    line_busy: "line_busy",
}

const CallDialog = ({ open, setCurrentCallUser, currentCallUser, selectedTask, isCallByMe, conversationId, socketRef, handleCall, setMessages, handleCallAnswer, setCallMessageId, callMessageId, handleSendSignal, handleCallEnd, handelNoResponse,setIsCallByMe }) => {
    // ringing,processing,rejected,no_response
    const [status, setStatus] = useState(isCallByMe ? CallStatus.ringing : CallStatus.call_coming);
    const { user } = useUser();


    const ringAudioRef = useRef(null);
    const webRTCRef = useRef(null);
    const callInitialize = useRef(false);
    const audioRef = useRef(null);
    const callStatedTimeRef = useRef(null);
    const callMessageIdRef = useRef(null);



    const handleUpdateMessage = useCallback((message_id, data) => {
        setMessages((prev) => {
            const prevCopy = JSON.parse(JSON.stringify(prev))
            const messageIndexOf = prevCopy.findIndex(m => m.message_id == message_id);
            if (messageIndexOf == -1) {
                return prev;
            }

            prevCopy[messageIndexOf] = { ...prevCopy[messageIndexOf], ...data };
            return prevCopy;
        });
    }, []);



    const handleTimeout = useCallback(() => {
        setStatus(CallStatus.no_response);
        handleUpdateMessage(callMessageIdRef.current, { call_status: "NO_RESPONSE" });
        const data = {
            message_id: callMessageIdRef.current,
            type: 'no_response',
            sender_id: user.user_id,
            reciever_id: currentCallUser.user_id,
        }

        handelNoResponse(data);
    }, [callMessageIdRef.current, user, currentCallUser]);

    const handlePlayRing = useCallback(() => {
        if (typeof window !== 'undefined') {
            if (ringAudioRef.current) ringAudioRef.current.pause();
            callStatedTimeRef.current = Date.now();
            ringAudioRef.current = new Audio(isCallByMe ? '/calling-ringtone.wav' : '/call-coming-rintone.mp3');
            ringAudioRef.current.play();


            if (isCallByMe) {
                ringAudioRef.current.onended = () => handleTimeout();
            } else {
                ringAudioRef.current.loop = true;
            }
        }
    }, []);

    const handleCallAgain = useCallback(() => {
        setIsCallByMe(true);
        handlePlayRing();
        handleCreateCall();
        handleStartListner();
        setStatus(CallStatus.ringing);
    }, []);

    const handleCreateCall = useCallback(() => {
        if (webRTCRef.current) return;
        const message_id = uuid();
        setCallMessageId(message_id);
        callMessageIdRef.current = message_id;
        const data = {
            sender_id: user.user_id,
            reciever_id: currentCallUser.user_id,
            conversation_id: conversationId,
            content_type: "CALL",
            call_status: "RINGING",
            createdAt: new Date(Date.now()),
            sender_name: user?.name,
            task_name: selectedTask?.name,
            message_id: message_id,
        }

        handleCall(data);
        setMessages(prev => [...prev, data]);
    }, [isCallByMe, webRTCRef.current, conversationId, user, currentCallUser, selectedTask]);


    const handleRecievePeerSignal = useCallback((data) => {
        const signalData = {
            signal: data,
            sender_id: user.user_id,
            reciever_id: currentCallUser.user_id,
        }

        handleSendSignal(signalData);
    }, [currentCallUser, user]);


    const handleReciveStream = useCallback((stream) => {
        audioRef.current.srcObject = stream;
        audioRef.current.play();
    }, [audioRef.current]);


    const handleCreatePeerConnection = useCallback(() => {
        webRTCRef.current = new WebRTC(isCallByMe);
        webRTCRef.current.on('signal', handleRecievePeerSignal);
        webRTCRef.current.on('stream', handleReciveStream);
    }, [webRTCRef.current]);


    const handleReciveSignal = useCallback((data) => {
        webRTCRef.current?.signal(data.signal);
    }, [webRTCRef.current]);



    const handleAnswer = useCallback((type) => {
        if (type == 'rejected') {
            const data = {
                message_id: callMessageId,
                picked_up: false,
                sender_id: user.user_id,
                reciever_id: currentCallUser.user_id,
            }
            handleCallAnswer(data);
            ringAudioRef.current.pause();
            setCurrentCallUser(null);

            handleUpdateMessage(callMessageId, { call_status: "REJECTED" })
        } else {
            const data = {
                message_id: callMessageId,
                picked_up: true,
                sender_id: user.user_id,
                reciever_id: currentCallUser.user_id,
            }
            handleCallAnswer(data);
            ringAudioRef.current.pause();
            handleCreatePeerConnection();
            setStatus(CallStatus.processing);
            handleUpdateMessage(callMessageId, { call_status: "PROCESSING" })
        }

    }, [callMessageId]);

    const handleUserEndCall = useCallback((data) => {
        setStatus(CallStatus.ended);
        setMessages((prev) => {
            const prevCopy = JSON.parse(JSON.stringify(prev))
            const messageIndexOf = prevCopy.findIndex(m => m.message_id == data.message_id);
            if (messageIndexOf == -1) {
                return prev;
            }
            prevCopy[messageIndexOf].call_status = "ENDED";
            prevCopy[messageIndexOf].duration = data.duration;
            return prevCopy;
        });
        endCall();
    }, []);



    const handleCallAnswerByUser = useCallback((data) => {

        if (data.picked_up) {
            setStatus(CallStatus.processing);
            handleCreatePeerConnection();
            handleUpdateMessage(data.message_id, { call_status: "PROCESSING" });


        } else {
            if (data.line_busy) {
                setStatus(CallStatus.line_busy)
            }else{
                setStatus(CallStatus.rejected);
            }

            handleUpdateMessage(data.message_id, { call_status: "REJECTED" });

        }

        ringAudioRef.current.pause();
        ringAudioRef.current.onended = () => { };
    }, []);


    const handleMissedCall = useCallback((data) => {
        setStatus(CallStatus.missed_call);
        handleUpdateMessage(data.message_id, { call_status: "NO_RESPONSE" });
        ringAudioRef.current.pause();
    }, [])


    const endCall = useCallback(() => {
        webRTCRef.current?.destroy();
        webRTCRef.current = null;
        audioRef.current.srcObject = null;
        audioRef.current?.pause();
        ringAudioRef.current.pause();
        socketRef.current?.off(ON_CALL_ANSWER, handleCallAnswerByUser);
        socketRef.current?.off(ON_SIGNAL, handleReciveSignal);
        socketRef.current?.off(ON_CALL_END, handleUserEndCall);
        socketRef.current?.off(ON_CALL_END, handleMissedCall);
        
    }, [audioRef]);


    const handleEnd = useCallback(() => {
        const duration = calculateTimeDifference(callStatedTimeRef.current);
        const data = {
            message_id: callMessageId,
            type: "call-ended",
            sender_id: user.user_id,
            duration,
            reciever_id: currentCallUser.user_id,
        }

        handleCallEnd(data);
        handleUpdateMessage(callMessageId, { call_status: "ENDED", duration });

        endCall();
        setCurrentCallUser(null);
    }, [currentCallUser, user, callStatedTimeRef.current, callMessageId]);



    const handleStartListner = useCallback(() => {
        socketRef.current?.on(ON_CALL_ANSWER, handleCallAnswerByUser);
        socketRef.current?.on(ON_SIGNAL, handleReciveSignal);
        socketRef.current?.on(ON_CALL_END, handleUserEndCall);
        socketRef.current?.on(ON_CALL_NO_RESPONSE, handleMissedCall);
    },[])


    useEffect(() => {
        if (callInitialize.current == true) return;
        callInitialize.current = true;

        handlePlayRing();
        if (isCallByMe) {
            handleCreateCall();
        }
        handleStartListner();
        
        return () => { }
    }, []);


    return (
        <div className={`absolute top-0 left-0 right-0 bottom-0 overflow-y-auto z-50 p-5 bg-black/10 transition-all flex items-center justify-center`}>
            <audio ref={audioRef} hidden={true}></audio>
            <div className={`bg-secondary shadow-sm rounded-md min-h-[16rem] mx-auto p-4 relative w-[20rem] border border-primary`}>
                <div className='flex items-center justify-center flex-col gap-4'>
                    <Avatar className={`w-[5rem] h-[5rem]`}>
                        <AvatarImage alt="User" />
                        <AvatarFallback className={`text-tbutton-text text-4xl`} style={{ background: getColorByFirstLetter(currentCallUser?.name || "A A") }}>
                            {getNameAvatar(currentCallUser?.name || "A A")}
                        </AvatarFallback>
                    </Avatar>
                    <h3 className='text-3xl text-foreground-primary'>{currentCallUser?.name}</h3>

                    {
                        status == CallStatus.ringing &&
                        <p className='text-green-500'>Ringing...</p>
                    }

                    {
                        status == CallStatus.processing &&
                        <DurationCounter />
                    }

                    {
                        status == CallStatus.no_response &&
                        <p className='text-red-500'>No Response</p>
                    }

                    {
                        status == CallStatus.rejected &&
                        <p className='text-red-500'>Rejected</p>
                    }

                    {
                        status == CallStatus.missed_call &&
                        <p className='text-red-500'>You Missed Call</p>
                    }

                    {
                        status == CallStatus.line_busy &&
                        <p className='text-red-500'>User Busy On Another Call</p>
                    }
                </div>

                {/* when call coming  */}
                {
                    (status == CallStatus.call_coming) &&
                    <div className='mt-4 flex items-center gap-20 justify-center'>
                        <Button 
                            className='bg-tbutton-bg text-tbutton-text rounded-full hover:bg-tbutton-hover hover:text-tbutton-text transition-all' 
                            size='icon' 
                            onClick={() => handleAnswer('picked_up')}
                        >
                            <Phone />
                        </Button>

                        <Button 
                            className='bg-red-500 text-white rounded-full hover:bg-red-600 transition-all' 
                            size='icon' 
                            onClick={() => handleAnswer('rejected')}
                        >
                            <Phone />
                        </Button>
                    </div>
                }

                {/* when call processing and ringing */}
                {
                    (status == CallStatus.ringing || status == CallStatus.processing) &&
                    <div className='mt-4 flex items-center gap-20 justify-center'>
                        <Button 
                            className='bg-red-500 text-white rounded-full hover:bg-red-600 transition-all' 
                            size='icon' 
                            onClick={handleEnd}
                        >
                            <Phone />
                        </Button>
                    </div>
                }

                {/* when when call  timeout or rejected */}
                {
                    (status == CallStatus.no_response || status == CallStatus.rejected || status == CallStatus.ended || status == CallStatus.missed_call) &&
                    <div className='mt-8 flex items-center justify-between gap-5'>
                        <Button 
                            className="bg-secondary text-foreground-primary hover:bg-secondary-hover flex-1 transition-all" 
                            onClick={() => setCurrentCallUser(null)}
                        >
                            Go Back
                        </Button>
                        <Button 
                            className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text flex-1 transition-all" 
                            onClick={handleCallAgain}
                        >
                            Call Again!
                        </Button>
                    </div>
                }

                {
                    status == CallStatus.line_busy &&
                    <div className='mt-8 flex items-center justify-between gap-5'>
                        <Button 
                            className="bg-secondary text-foreground-primary hover:bg-secondary-hover flex-1 transition-all" 
                            onClick={() => setCurrentCallUser(null)}
                        >
                            Go Back
                        </Button>
                    </div>
                }
            </div>
        </div>
    )
}

export default CallDialog