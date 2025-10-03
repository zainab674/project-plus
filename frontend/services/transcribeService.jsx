import { ON_TRANSCRIPT } from "@/contstant/transcribeEventConstant";
import { io } from "socket.io-client";

export class TranscribedService {
    io = null;
    audioStream = null;
    socket = null;
    meetingId = null;
    userId = null;

    constructor(query) {
        console.log('🎤 Initializing TranscribedService with query:', query);
        this.meetingId = query.meeting_id;
        this.userId = query.user_id;
        
        // Connect to direct transcription server
        const socketUrl = `${process.env.NEXT_PUBLIC_API_URL}/transcription-direct`;
        console.log('🎤 Connecting to socket:', socketUrl);
        
        this.io = io(socketUrl, {
            query: query
        });

        this.onConnect = this.onConnect.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onMessage = this.onMessage.bind(this);

        this.io.on('connect', this.onConnect);
        this.io.on('close', this.onClose);
        this.io.on('message', this.onMessage);
        
        console.log('🎤 TranscribedService initialized');
    }

    onConnect() {
        this.sendAudioStream();
        console.log('🎤 Connected to direct transcription service');
    }

    onClose() {
        console.log('🎤 Transcription service closed');
    }

    onMessage(data) {
        console.log(`📝 Received message from transcription service: ${data}`);
    }

    close() {
        if (this.io) {
            this.io.disconnect();
        }
        if (this.socket) {
            this.socket.close();
        }
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
    }

    async getAudioStream() {
        if (this.audioStream) {
            return this.audioStream;
        }

        if (typeof window !== 'undefined') {
            try {
                console.log('🎤 Getting microphone access for transcription...');
                
                // Simple approach - just get microphone access
                this.audioStream = await window.navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false, // Disable echo cancellation to capture more audio
                        noiseSuppression: false, // Disable noise suppression to capture all audio
                        autoGainControl: false, // Disable auto gain to capture all audio levels
                        sampleRate: 16000
                    }
                });
                
                console.log('🎤 Successfully got microphone stream');
                console.log('🎤 Audio tracks count:', this.audioStream.getAudioTracks().length);
                
                // Debug each audio track
                this.audioStream.getAudioTracks().forEach((track, index) => {
                    console.log(`🎤 Track ${index}:`, {
                        enabled: track.enabled,
                        muted: track.muted,
                        readyState: track.readyState,
                        label: track.label,
                        kind: track.kind
                    });
                });
                
                return this.audioStream;
            } catch (error) {
                console.error('❌ Failed to get microphone access:', error);
                throw new Error("Permission Denied");
            }
        }
    }

    async createCombinedAudioStream() {
        try {
            console.log('🎤 Attempting to create combined audio stream...');
            
            // Get local microphone audio
            const localAudio = await window.navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 16000
                }
            });
            
            console.log('🎤 Local microphone captured');
            
            // Try to get remote audio from the meeting
            const remoteAudio = await this.captureMixedAudio();
            
            if (remoteAudio) {
                console.log('🎤 Remote audio captured, combining streams');
                
                // Create a combined stream
                const combinedStream = new MediaStream();
                
                // Add local audio tracks
                localAudio.getAudioTracks().forEach(track => {
                    combinedStream.addTrack(track);
                    console.log('🎤 Added local audio track');
                });
                
                // Add remote audio tracks
                remoteAudio.getAudioTracks().forEach(track => {
                    combinedStream.addTrack(track);
                    console.log('🎤 Added remote audio track');
                });
                
                console.log('🎤 Combined stream created with', combinedStream.getAudioTracks().length, 'tracks');
                return combinedStream;
            } else {
                console.log('🎤 No remote audio found, using local microphone only');
                return localAudio;
            }
            
        } catch (error) {
            console.log('🎤 Error creating combined audio stream:', error.message);
            return null;
        }
    }

    async captureMixedAudio() {
        try {
            // Try to capture audio from the browser's audio context
            // This will capture the mixed audio output from the meeting
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a MediaStreamDestination to capture mixed audio
            const destination = audioContext.createMediaStreamDestination();
            
            // Try to connect to the audio output (this captures what the user hears)
            // Note: This requires the browser to support audio capture from output
            if (navigator.mediaDevices.getDisplayMedia) {
                try {
                    // Try to capture system audio (if supported)
                    const systemAudio = await navigator.mediaDevices.getDisplayMedia({
                        audio: {
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: false,
                            sampleRate: 16000
                        },
                        video: false
                    });
                    
                    console.log('🎤 Captured system audio stream');
                    return systemAudio;
                } catch (displayError) {
                    console.log('🎤 System audio capture not available:', displayError.message);
                }
            }

            // Alternative: Try to capture from audio elements in the page
            const audioElements = document.querySelectorAll('audio, video');
            if (audioElements.length > 0) {
                console.log('🎤 Found', audioElements.length, 'audio/video elements');
                
                // Create a mixed stream from all audio elements
                const mixedStream = new MediaStream();
                let tracksAdded = 0;
                
                for (const element of audioElements) {
                    try {
                        // Check if element has audio tracks
                        if (element.captureStream) {
                            const stream = element.captureStream();
                            if (stream && stream.getAudioTracks().length > 0) {
                                stream.getAudioTracks().forEach(track => {
                                    mixedStream.addTrack(track);
                                    tracksAdded++;
                                });
                                console.log('🎤 Added audio track from element');
                            }
                        }
                        
                        // Also try to access the element's audio context
                        if (element.srcObject && element.srcObject.getAudioTracks) {
                            element.srcObject.getAudioTracks().forEach(track => {
                                mixedStream.addTrack(track);
                                tracksAdded++;
                            });
                            console.log('🎤 Added audio track from srcObject');
                        }
                    } catch (elementError) {
                        console.log('🎤 Could not capture from audio element:', elementError.message);
                    }
                }
                
                if (tracksAdded > 0) {
                    console.log('🎤 Created mixed stream with', tracksAdded, 'audio tracks');
                    return mixedStream;
                }
            }

            // Method 3: Try to capture from WebRTC peer connections
            try {
                console.log('🎤 Attempting to capture from WebRTC connections...');
                // This is a more advanced approach to capture from peer connections
                // We'll look for any active peer connections that might contain audio
                const peerConnections = window.RTCPeerConnection ? 
                    Object.values(window).filter(obj => obj instanceof RTCPeerConnection) : [];
                
                if (peerConnections.length > 0) {
                    console.log('🎤 Found', peerConnections.length, 'peer connections');
                    // Note: Direct access to peer connection streams is limited by browser security
                }
            } catch (peerError) {
                console.log('🎤 Peer connection capture failed:', peerError.message);
            }

            // Method 4: Try to capture from meeting audio context
            try {
                console.log('🎤 Attempting to capture from meeting audio context...');
                
                // Look for meeting audio context in the global scope
                if (window.meetingAudioContext) {
                    console.log('🎤 Meeting audio context found');
                }
                
                // Try to access the meeting's audio context
                const audioContexts = [];
                for (let prop in window) {
                    try {
                        if (window[prop] && typeof window[prop] === 'object' && 
                            window[prop].createMediaStreamDestination) {
                            audioContexts.push(window[prop]);
                        }
                    } catch (e) {
                        // Ignore errors when checking properties
                    }
                }
                
                if (audioContexts.length > 0) {
                    console.log('🎤 Found', audioContexts.length, 'audio contexts');
                }
                
            } catch (meetingError) {
                console.log('🎤 Meeting audio context capture failed:', meetingError.message);
            }

            console.log('🎤 Mixed audio capture not available, will use fallback');
            return null;
        } catch (error) {
            console.log('🎤 Error capturing mixed audio:', error.message);
            return null;
        }
    }

    sendAudioStream() {
        console.log('🎤 Starting audio stream...');
        this.getAudioStream().then(stream => {
            console.log('🎤 Audio stream obtained:', stream);
            console.log('🎤 Stream active:', stream.active);
            console.log('🎤 Stream ID:', stream.id);
            
            // Enhanced MediaRecorder setup with proper codec and quality
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
                MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';

            console.log('🎤 Using MIME type:', mimeType);

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                audioBitsPerSecond: 128000
            });
            
            console.log('🎤 MediaRecorder created:', mediaRecorder);
            
            // Connect to Deepgram with enhanced parameters
            const deepgramUrl = `wss://api.deepgram.com/v1/listen?model=nova-2-phonecall&language=en&punctuate=true&smart_format=true&interim_results=true&utterance_end_ms=2000`;
            console.log('🎤 Connecting to Deepgram:', deepgramUrl);
            
            this.socket = new WebSocket(deepgramUrl, [
                'token',
                process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY,
            ]);
            
            this.socket.onopen = () => {
                console.log('🎤 Deepgram connection opened');
                mediaRecorder.addEventListener('dataavailable', async (event) => {
                    console.log('🎤 Audio data available:', event.data.size, 'bytes');
                    if (event.data.size > 0 && this.socket.readyState == 1) {
                        this.socket.send(event.data);
                        console.log('🎤 Audio data sent to Deepgram');
                    }
                });
                mediaRecorder.start(2000); // Increased chunk size for better sentence completion
                console.log('🎤 MediaRecorder started with 2000ms chunks');
            };

            this.socket.onmessage = (message) => {
                console.log('🎤 Received message from Deepgram:', message.data);
                try {
                    const received = JSON.parse(message.data);
                    console.log('🎤 Parsed Deepgram response:', received);
                    
                    const transcript = received.channel?.alternatives?.[0]?.transcript;
                    console.log('🎤 Extracted transcript:', transcript, 'is_final:', received.is_final);
                    
                    // Process both interim and final results to prevent word skipping
                    if (transcript && (received.is_final || received.is_final === undefined)) {
                        const data = {
                            text: transcript,
                            user_id: this.userId,
                            meeting_id: this.meetingId,
                            is_final: received.is_final || false
                        };
                        
                        console.log('🎤 Processing transcription data:', data);
                        
                        // Send to backend directly
                        this.saveTranscriptionToBackend(data);
                        
                        // Also emit to socket for real-time updates
                        this.io.emit('transcript', data);
                        console.log('🎤 Transcription emitted to socket');
                    }
                } catch (error) {
                    console.error('🎤 Error processing Deepgram message:', error);
                }
            };

            this.socket.onclose = () => {
                console.log('🎤 Deepgram connection closed');
            };

            this.socket.onerror = (error) => {
                console.error('🎤 Deepgram error:', error);
            };
        }).catch(err => {
            console.error('🎤 Audio stream error:', err.message);
            console.error('🎤 Full error:', err);
        });
    }

    // Save transcription directly to backend
    async saveTranscriptionToBackend(data) {
        try {
            console.log('🎤 Saving transcription to backend:', data);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/transcription/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(data)
            });

            console.log('🎤 Backend response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Transcription saved to backend:', result);
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to save transcription:', response.status, errorText);
            }
        } catch (error) {
            console.error('❌ Error saving transcription:', error);
        }
    }

    handlemute(value) {
        if (this.audioStream) {
            this.audioStream.getAudioTracks().forEach(track => {
                track.enabled = !value;
            });
        }
        
        // Notify other participants about mute status
        this.io.emit('mute', value);
    }

    disconnect() {
        try {
            if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
                this.socket.close();
            }
        } catch (error) {
            console.warn('Error closing socket:', error);
        }
        
        try {
            if (this.io) {
                this.io.disconnect();
            }
        } catch (error) {
            console.warn('Error disconnecting io:', error);
        }
        
        // Reset references
        this.socket = null;
        this.audioStream = null;
    }
}