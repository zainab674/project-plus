// 'use client'

// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Badge } from '@/components/ui/badge';
// import {
//     MessageCircle,
//     Send,
//     Bot,
//     User,
//     X,
//     Minimize2,
//     Maximize2,
//     Mic,
//     MicOff,
//     Volume2,
//     VolumeX,
//     FileText,
//     Users,
//     Calendar,
//     DollarSign,
//     Briefcase,
//     MessageSquare,
//     Video,
//     Settings,
//     ChevronDown,
//     ChevronUp,
//     Play,
//     Pause,
//     RefreshCw,
//     TestTube,
//     Zap
// } from 'lucide-react';
// import { toast } from 'react-toastify';
// import caseCreationAIService from '@/lib/services/caseCreationAIService';
// import geminiService from '@/lib/services/geminiService';
// import CreateCaseModal from './cases/createCaseModal';
// import { useUser } from '@/providers/UserProvider';

// const AILawyerAssistant = () => {
//     // Main component states
//     const [isOpen, setIsOpen] = useState(false);
//     const [isMinimized, setIsMinimized] = useState(false);
//     const [messages, setMessages] = useState([]);
//     const [inputMessage, setInputMessage] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const [showSuggestions, setShowSuggestions] = useState(true);

//     // Enhanced voice-related states with auto-send
//     const [isListening, setIsListening] = useState(false);
//     const [isSpeaking, setIsSpeaking] = useState(false);
//     const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
//     const [transcript, setTranscript] = useState("");
//     const [silenceTimer, setSilenceTimer] = useState(null);
//     const [lastAudioTime, setLastAudioTime] = useState(0);
//     const [silenceCountdown, setSilenceCountdown] = useState(5);
//     const [isSpeechDetected, setIsSpeechDetected] = useState(false);
//     const [audioLevel, setAudioLevel] = useState(0);
//     const [autoSendEnabled, setAutoSendEnabled] = useState(true); // New: Enable/disable auto-send
//     const [recordedText, setRecordedText] = useState(''); // New: Store transcribed text for auto-send

//     // User context
//     const { user, isAuth } = useUser();

//     // Case creation states
//     const [currentCaseData, setCurrentCaseData] = useState({});
//     const [showCaseModal, setShowCaseModal] = useState(false);
//     const [caseModalData, setCaseModalData] = useState({});

//     // Refs for audio and DOM management
//     const messagesEndRef = useRef(null);
//     const inputRef = useRef(null);
//     const speechRef = useRef(null);
//     const mediaRecorderRef = useRef(null);
//     const audioChunksRef = useRef([]);
//     const audioContextRef = useRef(null);
//     const analyserRef = useRef(null);
//     const silenceStartTimeRef = useRef(null);

//     // Simple speech synthesis setup
//     useEffect(() => {
//         if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
//             speechRef.current = window.speechSynthesis;

//             const loadVoices = () => {
//                 const voices = speechRef.current.getVoices();
//                 console.log('🔊 Available voices:', voices.length);
//             };

//             speechRef.current.onvoiceschanged = loadVoices;
//             loadVoices();
//         }
//     }, []);

//     // Enhanced audio processing function with auto-send
//     const processAudio = async () => {
//         if (audioChunksRef.current.length === 0) return;

//         setTranscript("🔄 Processing your voice...");

//         try {
//             const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
//             if (!apiKey || apiKey === 'your_deepgram_api_key_here') {
//                 throw new Error('Voice recognition API key not configured. Please add your API key to .env file.');
//             }

//             const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
//             const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

//             // Create FormData for voice recognition API
//             const formData = new FormData();
//             const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
//             formData.append('audio', audioBlob, `recording.${extension}`);

//             // Call voice recognition API with FormData
//             const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true', {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Token ${apiKey}`,
//                 },
//                 body: formData
//             });

//             if (!response.ok) {
//                 const errorData = await response.text();
//                 throw new Error(`Voice recognition API request failed: ${response.status} - ${errorData}`);
//             }

//             const data = await response.json();
//             const userText = data.results?.channels[0]?.alternatives[0]?.transcript || "I didn't catch that, could you repeat?";

//             console.log('🎤 Transcribed text:', userText);

//             // Store the transcribed text
//             setRecordedText(userText);
//             setInputMessage(userText);
//             setTranscript(`✅ Transcribed: "${userText}"`);

//             // AUTO-SEND: If auto-send is enabled and we have valid text, send it automatically
//             if (autoSendEnabled && userText.trim() && userText !== "I didn't catch that, could you repeat?") {
//                 console.log('🚀 Auto-sending transcribed message...');
//                 setTranscript(`🚀 Auto-sending: "${userText}"`);

//                 // Small delay to show the transcription, then auto-send
//                 setTimeout(() => {
//                     handleSendMessage(userText);
//                 }, 1000);
//             } else {
//                 // Manual mode: User needs to review and send manually
//                 setTranscript(`📝 Ready to send: "${userText}" (Click send or press Enter)`);
//             }

//         } catch (error) {
//             console.error('Error processing audio:', error);
//             let errorMessage = "Sorry, I couldn't process your voice. Please try again.";

//             if (error instanceof Error) {
//                 if (error.message.includes('API key not configured')) {
//                     errorMessage = "Voice recognition API key not configured. Please add NEXT_PUBLIC_DEEPGRAM_API_KEY to your .env file.";
//                 } else if (error.message.includes('Voice recognition API request failed')) {
//                     errorMessage = "Voice recognition service temporarily unavailable. Please try again.";
//                 }
//             }

//             setTranscript(errorMessage);
//         }
//     };

//     // Fixed silence detection with robust auto-stop
//     const startListening = async () => {
//         try {
//             // Stop any existing recording first
//             if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
//                 console.log('🛑 Stopping existing recording...');
//                 mediaRecorderRef.current.stop();
//                 await new Promise(resolve => setTimeout(resolve, 100)); // Wait for cleanup
//             }

//             // Clear any existing silence timer
//             if (silenceTimer) {
//                 clearTimeout(silenceTimer);
//                 setSilenceTimer(null);
//             }

//             // Reset states
//             setRecordedText('');
//             silenceStartTimeRef.current = null;

//             const stream = await navigator.mediaDevices.getUserMedia({
//                 audio: {
//                     echoCancellation: true,
//                     noiseSuppression: true,
//                     autoGainControl: true,
//                     sampleRate: 16000
//                 }
//             });

//             setIsListening(true);
//             setTranscript("🎤 Listening... Speak now!");
//             setLastAudioTime(Date.now());
//             setIsSpeechDetected(false);
//             setSilenceCountdown(5);

//             // Create audio context for real-time audio analysis
//             audioContextRef.current = new AudioContext();
//             analyserRef.current = audioContextRef.current.createAnalyser();
//             const microphone = audioContextRef.current.createMediaStreamSource(stream);

//             analyserRef.current.fftSize = 512;
//             analyserRef.current.smoothingTimeConstant = 0.3;
//             const bufferLength = analyserRef.current.frequencyBinCount;
//             const dataArray = new Uint8Array(bufferLength);

//             microphone.connect(analyserRef.current);

//             // Enhanced MediaRecorder setup
//             const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
//                 MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';

//             const mediaRecorder = new MediaRecorder(stream, {
//                 mimeType,
//                 audioBitsPerSecond: 128000
//             });
//             mediaRecorderRef.current = mediaRecorder;
//             audioChunksRef.current = [];

//             let analysisRunning = true;
//             let silenceStartTime = null;

//             // Fixed speech detection with reliable auto-stop
//             const analyzeAudio = () => {
//                 if (!analysisRunning || !analyserRef.current || !isListening) {
//                     console.log('🔍 Analysis stopped:', { analysisRunning, hasAnalyser: !!analyserRef.current, isListening });
//                     return;
//                 }

//                 try {
//                     analyserRef.current.getByteFrequencyData(dataArray);

//                     // Calculate RMS (Root Mean Square) for better audio level detection
//                     let sum = 0;
//                     for (let i = 0; i < bufferLength; i++) {
//                         sum += dataArray[i] * dataArray[i];
//                     }
//                     const rms = Math.sqrt(sum / bufferLength);
//                     const normalizedLevel = (rms / 255) * 100;

//                     setAudioLevel(normalizedLevel);

//                     // Enhanced speech detection with dynamic threshold
//                     const speechThreshold = 5; // Lowered threshold for better sensitivity
//                     const isCurrentlySpeaking = normalizedLevel > speechThreshold;

//                     console.log('🔊 Audio Analysis:', {
//                         level: normalizedLevel.toFixed(1),
//                         threshold: speechThreshold,
//                         speaking: isCurrentlySpeaking,
//                         speechDetected: isSpeechDetected,
//                         silenceTime: silenceStartTime ? Date.now() - silenceStartTime : 0
//                     });

//                     if (isCurrentlySpeaking && !isSpeechDetected) {
//                         // Speech started
//                         console.log('🎤 Speech detected! Level:', normalizedLevel.toFixed(1));
//                         setIsSpeechDetected(true);
//                         setTranscript("🎤 Recording... Continue speaking...");
//                         silenceStartTime = null;
//                         silenceStartTimeRef.current = null;
//                         setSilenceCountdown(5);

//                     } else if (!isCurrentlySpeaking && isSpeechDetected) {
//                         // Potential silence - start or continue timer
//                         if (silenceStartTime === null) {
//                             console.log('🔇 Silence started...');
//                             silenceStartTime = Date.now();
//                             silenceStartTimeRef.current = silenceStartTime;
//                             setTranscript("🔇 Silence detected... 5 seconds to auto-stop...");
//                         }

//                         const silenceDuration = Date.now() - silenceStartTime;
//                         const remainingSeconds = Math.max(0, 5 - Math.floor(silenceDuration / 1000));
//                         setSilenceCountdown(remainingSeconds);

//                         // Auto-stop after 5 seconds of silence
//                         if (silenceDuration >= 5000) {
//                             console.log('⏰ 5 seconds of silence completed, auto-stopping...');
//                             analysisRunning = false;

//                             if (mediaRecorder && mediaRecorder.state === 'recording') {
//                                 console.log('🛑 Stopping MediaRecorder...');
//                                 mediaRecorder.stop();
//                             }
//                             return;
//                         }

//                     } else if (isCurrentlySpeaking && isSpeechDetected && silenceStartTime) {
//                         // Speech resumed after brief pause
//                         console.log('🎤 Speech resumed, canceling silence timer...');
//                         silenceStartTime = null;
//                         silenceStartTimeRef.current = null;
//                         setSilenceCountdown(5);
//                         setTranscript("🎤 Recording... Continue speaking...");
//                     }

//                     // Continue analyzing if still running
//                     if (analysisRunning) {
//                         requestAnimationFrame(analyzeAudio);
//                     }

//                 } catch (error) {
//                     console.error('🔊 Audio analysis error:', error);
//                     analysisRunning = false;
//                 }
//             };

//             // MediaRecorder event handlers
//             mediaRecorder.ondataavailable = (event) => {
//                 if (event.data.size > 0) {
//                     console.log('📊 Audio data chunk received:', event.data.size, 'bytes');
//                     audioChunksRef.current.push(event.data);
//                     setLastAudioTime(Date.now());
//                 }
//             };

//             mediaRecorder.onstop = async () => {
//                 try {
//                     console.log('🛑 MediaRecorder stopped, processing audio...');
//                     analysisRunning = false;

//                     // Clear silence timer
//                     if (silenceTimer) {
//                         clearTimeout(silenceTimer);
//                         setSilenceTimer(null);
//                     }

//                     // Clean up audio context
//                     if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
//                         await audioContextRef.current.close();
//                         console.log('🔊 Audio context closed');
//                     }

//                     // Process the recorded audio
//                     if (audioChunksRef.current.length > 0) {
//                         console.log('🔄 Processing', audioChunksRef.current.length, 'audio chunks...');
//                         await processAudio();
//                     } else {
//                         console.log('⚠️ No audio chunks to process');
//                         setTranscript("No audio recorded. Please try again.");
//                     }

//                 } catch (error) {
//                     console.error('❌ Error in onstop handler:', error);
//                     setTranscript("Error processing recording. Please try again.");
//                 } finally {
//                     // Clean up stream and reset states
//                     console.log('🧹 Cleaning up recording session...');
//                     stream.getTracks().forEach(track => {
//                         track.stop();
//                         console.log('🔇 Audio track stopped');
//                     });

//                     setIsListening(false);
//                     setIsSpeechDetected(false);
//                     setAudioLevel(0);
//                     silenceStartTimeRef.current = null;
//                     silenceStartTime = null;
//                 }
//             };

//             mediaRecorder.onerror = (event) => {
//                 console.error('🔴 MediaRecorder error:', event.error);
//                 analysisRunning = false;
//                 setTranscript("Recording error. Please try again.");
//                 setIsListening(false);
//             };

//             // Start recording
//             console.log('🎬 Starting MediaRecorder...');
//             mediaRecorder.start(100); // Collect data every 100ms

//             // Start audio analysis
//             console.log('🔍 Starting audio analysis...');
//             analyzeAudio();

//             // Safety timeout: Force stop after 30 seconds (reduced from 60)
//             const safetyTimeout = setTimeout(() => {
//                 if (mediaRecorder && mediaRecorder.state === 'recording') {
//                     console.log('⏰ Safety timeout: 30 seconds reached, force stopping...');
//                     analysisRunning = false;
//                     mediaRecorder.stop();
//                 }
//             }, 30000);

//             // Store cleanup function
//             mediaRecorder.safetyTimeout = safetyTimeout;

//         } catch (error) {
//             console.error('❌ Error starting recording:', error);
//             setTranscript("Error accessing microphone. Please check permissions.");
//             setIsListening(false);
//         }
//     };

//     // Fixed manual stop functionality
//     const stopListening = () => {
//         console.log('🛑 Manually stopping recording...');

//         // Clear silence timer if manually stopping
//         if (silenceTimer) {
//             clearTimeout(silenceTimer);
//             setSilenceTimer(null);
//         }

//         // Clear safety timeout if exists
//         if (mediaRecorderRef.current && mediaRecorderRef.current.safetyTimeout) {
//             clearTimeout(mediaRecorderRef.current.safetyTimeout);
//         }

//         // Force stop the recording
//         if (mediaRecorderRef.current) {
//             const currentState = mediaRecorderRef.current.state;
//             console.log('📊 MediaRecorder state:', currentState);

//             if (currentState === 'recording') {
//                 console.log('🛑 Stopping MediaRecorder...');
//                 try {
//                     mediaRecorderRef.current.stop();
//                 } catch (error) {
//                     console.error('❌ Error stopping MediaRecorder:', error);
//                     // Force cleanup if stop fails
//                     forceCleanup();
//                 }
//             } else if (currentState === 'paused') {
//                 console.log('▶️ Resuming and stopping paused recording...');
//                 mediaRecorderRef.current.resume();
//                 setTimeout(() => {
//                     if (mediaRecorderRef.current.state === 'recording') {
//                         mediaRecorderRef.current.stop();
//                     }
//                 }, 100);
//             } else {
//                 console.log('ℹ️ MediaRecorder not in recording state, forcing cleanup...');
//                 forceCleanup();
//             }
//         } else {
//             console.log('⚠️ No MediaRecorder instance found, forcing cleanup...');
//             forceCleanup();
//         }
//     };

//     // Force cleanup function for stuck states
//     const forceCleanup = () => {
//         console.log('🧹 Force cleanup initiated...');

//         // Reset all states immediately
//         setIsListening(false);
//         setIsSpeechDetected(false);
//         setAudioLevel(0);
//         setSilenceCountdown(5);
//         silenceStartTimeRef.current = null;

//         // Close audio context if exists
//         if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
//             audioContextRef.current.close().catch(err =>
//                 console.error('Error closing audio context:', err)
//             );
//         }

//         // Clean up MediaRecorder
//         if (mediaRecorderRef.current) {
//             mediaRecorderRef.current = null;
//         }

//         // Clear audio chunks
//         audioChunksRef.current = [];

//         setTranscript("Recording stopped manually.");

//         console.log('✅ Force cleanup completed');
//     };

//     // Simple text-to-speech
//     const speakMessage = useCallback((text) => {
//         if (!isVoiceEnabled || !speechRef.current || !text?.trim()) return;

//         try {
//             // Stop any current speech
//             speechRef.current.cancel();

//             const utterance = new SpeechSynthesisUtterance(text);

//             // Get available voices and prioritize English voices
//             const voices = speechRef.current.getVoices();
//             let selectedVoice = voices.find(voice =>
//                 voice.lang.startsWith('en') && (
//                     voice.name.includes('Google') ||
//                     voice.name.includes('Natural') ||
//                     voice.name.includes('Premium') ||
//                     voice.name.includes('US') ||
//                     voice.name.includes('UK') ||
//                     voice.name.includes('English')
//                 )
//             );

//             if (!selectedVoice) {
//                 selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
//             }

//             if (!selectedVoice && voices.length > 0) {
//                 selectedVoice = voices[0];
//             }

//             if (selectedVoice) {
//                 utterance.voice = selectedVoice;
//             }

//             utterance.rate = 0.9;
//             utterance.pitch = 1;
//             utterance.volume = 0.8;

//             setIsSpeaking(true);

//             utterance.onend = () => setIsSpeaking(false);
//             utterance.onerror = (event) => {
//                 setIsSpeaking(false);
//                 if (event.error !== 'interrupted' && event.error !== 'canceled') {
//                     console.error('🔊 TTS error:', event.error);
//                 }
//             };

//             speechRef.current.speak(utterance);

//         } catch (error) {
//             console.error('🔊 Speech synthesis error:', error);
//             setIsSpeaking(false);
//         }
//     }, [isVoiceEnabled]);

//     // Enhanced voice input toggle
//     const toggleVoiceInput = async () => {
//         if (!isVoiceEnabled) {
//             return;
//         }

//         if (isListening) {
//             stopListening();
//         } else {
//             startListening();
//         }
//     };

//     // Toggle auto-send functionality
//     const toggleAutoSend = () => {
//         const newState = !autoSendEnabled;
//         setAutoSendEnabled(newState);
//         console.log('🚀 Auto-send toggled:', newState);

//         // Show feedback
//         setTranscript(newState ?
//             "✅ Auto-send enabled: Messages will be sent automatically after voice input" :
//             "⏸️ Auto-send disabled: You'll need to review and send manually"
//         );

//         setTimeout(() => {
//             if (!isListening) setTranscript("");
//         }, 3000);
//     };

//     // Simple voice output toggle
//     const toggleVoiceOutput = () => {
//         const newState = !isVoiceEnabled;
//         setIsVoiceEnabled(newState);

//         if (speechRef.current) {
//             speechRef.current.cancel();
//             setIsSpeaking(false);
//         }
//     };

//     // List user's cases
//     const listUserCases = async () => {
//         try {
//             console.log('🔍 Fetching user cases...');

//             if (!user || !isAuth) {
//                 return {
//                     success: false,
//                     message: "You need to be logged in to view your cases. Please log in first.",
//                     suggestions: ["Log in", "Create a case"]
//                 };
//             }

//             // For now, return a simple message since we're not using projectService
//             return {
//                 success: true,
//                 message: "I can help you create new legal cases. Would you like to start a new case?",
//                 suggestions: ["Create a case"]
//             };
//         } catch (error) {
//             console.error('🔍 Error handling cases:', error);
//             return {
//                 success: false,
//                 message: "I encountered an error while processing your request. Please try again."
//             };
//         }
//     };

//     // Use Gemini to intelligently understand user intent
//     const understandUserIntent = async (userMessage, conversationHistory) => {
//         try {
//             const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
//             if (!apiKey) {
//                 throw new Error('Gemini API key not configured');
//             }

//             const prompt = `You are an AI legal assistant that helps users with legal case management. 

// Analyze the user's message and determine their intent. Return a JSON response with the following structure:

// {
//     "intent": "case_creation" | "list_cases" | "general_help" | "other",
//     "confidence": 0.0-1.0,
//     "extracted_info": {
//         "case_name": "extracted case name if mentioned",
//         "description": "brief description of what they want",
//         "priority": "high/medium/low if mentioned",
//         "status": "pending/active/closed if mentioned"
//     },
//     "reasoning": "brief explanation of why you chose this intent",
//     "suggestions": ["array of helpful suggestions for next steps"]
// }

// CONVERSATION HISTORY:
// ${conversationHistory.map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}

// USER MESSAGE: "${userMessage}"

// IMPORTANT: Be intelligent about context. If someone says "I want to start a new case", that's "case_creation". If they say "show me my cases", that's "list_cases". If they mention creating a case, managing cases, or starting legal proceedings, route to case_creation.

// Return only valid JSON:`;

//             const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     contents: [{
//                         parts: [{
//                             text: prompt
//                         }]
//                     }]
//                 })
//             });

//             if (!response.ok) {
//                 throw new Error(`Gemini API request failed: ${response.status}`);
//             }

//             const data = await response.json();
//             const geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

//             // Extract JSON from response
//             const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
//             if (!jsonMatch) {
//                 throw new Error('Invalid response format from Gemini');
//             }

//             const intentData = JSON.parse(jsonMatch[0]);
//             console.log('🧠 Gemini Intent Analysis:', intentData);

//             return intentData;
//         } catch (error) {
//             console.error('Error understanding user intent with Gemini:', error);
//             // Fallback to basic keyword matching
//             return {
//                 intent: 'general_help',
//                 confidence: 0.5,
//                 extracted_info: {},
//                 reasoning: 'Fallback due to Gemini error',
//                 suggestions: ['Try rephrasing your request', 'Use text input instead']
//             };
//         }
//     };

//     // Process AI conversation with Gemini-powered intent understanding
//     const processAIConversation = async (userMessage) => {
//         try {
//             if (!isAuth || !user) {
//                 console.log('🔍 User not authenticated');
//                 return {
//                     content: "You need to be logged in to use the AI assistant. Please log in first.",
//                     suggestions: ["Log in", "Refresh page"]
//                 };
//             }

//             const conversationHistory = messages.filter(msg => msg.type === 'bot' || msg.type === 'user');

//             // Use Gemini to understand user intent
//             console.log('🧠 Analyzing user intent with Gemini...');
//             const intentData = await understandUserIntent(userMessage, conversationHistory);

//             console.log('🧠 Intent Analysis Result:', {
//                 intent: intentData.intent,
//                 confidence: intentData.confidence,
//                 extracted_info: intentData.extracted_info
//             });

//             // Use Gemini's intent analysis to route the request
//             const intent = intentData.intent;
//             const extractedInfo = intentData.extracted_info;

//             console.log('🧠 Routing based on Gemini intent:', {
//                 intent,
//                 confidence: intentData.confidence,
//                 extracted_info: extractedInfo,
//                 reasoning: intentData.reasoning
//             });

//             if (intent === 'list_cases') {
//                 const result = await listUserCases();
//                 return {
//                     content: result.message,
//                     suggestions: result.suggestions || []
//                 };
//             } else if (intent === 'case_creation') {
//                 console.log('🔍 Processing CASE request');
//                 const response = await caseCreationAIService.processConversation(
//                     userMessage,
//                     conversationHistory,
//                     currentCaseData
//                 );

//                 if (response.success) {
//                     const aiData = response.data;
//                     setCurrentCaseData(aiData.gatheredInfo);

//                     if (aiData.isComplete || caseCreationAIService.isCaseComplete(aiData.gatheredInfo)) {
//                         const modalData = caseCreationAIService.formatCaseDataForModal(aiData.gatheredInfo);
//                         setCaseModalData(modalData);
//                         setShowCaseModal(true);

//                         return {
//                             content: `Perfect! I have all the information I need to create your case. Let me open the case creation form for you to review and submit.\n\n**Case Summary:**\n- **Name**: ${aiData.gatheredInfo.caseName}\n- **Client**: ${aiData.gatheredInfo.clientName}\n- **Opposing Party**: ${aiData.gatheredInfo.opposingParty}\n- **Type**: ${aiData.gatheredInfo.description}\n- **Priority**: ${aiData.gatheredInfo.priority || 'Medium'}\n- **Status**: ${aiData.gatheredInfo.status || 'Pending'}\n\nThe case creation form is now open. Please review the details and click "Create Case" when you're ready.`,
//                             suggestions: ["Review and submit case", "Make changes", "Start over"]
//                         };
//                     }

//                     return {
//                         content: aiData.message,
//                         suggestions: aiData.suggestions || []
//                     };
//                 }
//             } else if (intent === 'general_help' || intent === 'other') {
//                 // Handle general help or unclear requests
//                 return {
//                     content: `I understand you're asking about "${userMessage}". Let me help you with that.\n\n${intentData.reasoning}\n\nWhat would you like to do? I can help you with:\n• Creating legal cases\n• Listing your current cases`,
//                     suggestions: intentData.suggestions || ["Create a case", "List my cases"]
//                 };
//             } else {
//                 // Default to case creation for ambiguous requests
//                 const response = await caseCreationAIService.processConversation(
//                     userMessage,
//                     conversationHistory,
//                     currentCaseData
//                 );

//                 if (response.success) {
//                     const aiData = response.data;
//                     setCurrentCaseData(aiData.gatheredInfo);
//                     return {
//                         content: aiData.message,
//                         suggestions: aiData.suggestions || []
//                     };
//                 }
//             }

//             throw new Error('Failed to process conversation');

//         } catch (error) {
//             console.error('AI Conversation Error:', error);
//             return {
//                 content: `I apologize, but I encountered an error processing your request. Please try again or rephrase your message.\n\nError details: ${error.message}`,
//                 suggestions: ["Try again", "Start over", "Use text input"]
//             };
//         }
//     };

//     // Enhanced send message with comprehensive voice handling
//     const handleSendMessage = async (messageText = null) => {
//         const userMessage = messageText || inputMessage.trim();
//         if (!userMessage || isLoading) return;

//         console.log('📤 Sending message:', userMessage);

//         // Stop listening if active
//         if (isListening) {
//             setIsListening(false);
//             stopListening();
//             console.log('🎤 Stopped voice recording before sending message');
//         }

//         const userMsg = {
//             id: Date.now(),
//             type: 'user',
//             content: userMessage,
//             timestamp: new Date()
//         };

//         setMessages(prev => [...prev, userMsg]);
//         setInputMessage('');
//         setTranscript('');
//         setRecordedText('');
//         setIsLoading(true);
//         setShowSuggestions(false);

//         try {
//             console.log('🤖 Processing AI response...');
//             const aiResponse = await processAIConversation(userMessage);

//             const botMsg = {
//                 id: Date.now() + 1,
//                 type: 'bot',
//                 content: aiResponse.content,
//                 timestamp: new Date()
//             };

//             setMessages(prev => [...prev, botMsg]);

//             // Enhanced text-to-speech
//             if (isVoiceEnabled && !isSpeaking && aiResponse.content?.trim()) {
//                 console.log('🔊 Starting TTS for response...');
//                 speakMessage(aiResponse.content);
//             }

//             if (aiResponse.suggestions) {
//                 setShowSuggestions(true);
//             }

//             console.log('✅ Message processed successfully');
//         } catch (error) {
//             console.error('❌ Send message error:', error);
//             const errorMsg = {
//                 id: Date.now() + 1,
//                 type: 'bot',
//                 content: `I apologize, but I encountered an error processing your request. Please try again.\n\nError: ${error.message}`,
//                 timestamp: new Date()
//             };
//             setMessages(prev => [...prev, errorMsg]);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // Enhanced suggestion click handler
//     const handleSuggestionClick = (suggestion) => {
//         console.log('📝 Suggestion clicked:', suggestion);

//         if (suggestion === "Start over" || suggestion === "Start over with new case") {
//             clearCaseContext();
//             setInputMessage("I want to start over");
//             handleSendMessage("I want to start over");
//         } else {
//             setInputMessage(suggestion);
//             inputRef.current?.focus();
//         }
//     };

//     // Enhanced key press handling with voice integration
//     const handleKeyPress = (e) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();

//             if (isListening) {
//                 // Stop listening first, then allow user to review
//                 toggleVoiceInput();
//             } else {
//                 handleSendMessage();
//             }
//         }
//     };

//     // UI control functions
//     const toggleChat = () => {
//         setIsOpen(!isOpen);
//         if (!isOpen) {
//             setIsMinimized(false);
//         }
//         console.log('💬 Chat toggled:', !isOpen);
//     };

//     const toggleMinimize = () => {
//         setIsMinimized(!isMinimized);
//         console.log('🔽 Chat minimized:', !isMinimized);
//     };

//     // Enhanced clear chat with proper cleanup
//     const clearChat = () => {
//         console.log('🧹 Clearing chat...');

//         const welcomeMessage = {
//             id: 1,
//             type: 'bot',
//             content: `Hello! I'm your AI legal assistant with enhanced voice features.

// **Voice Features:**
// • 🎤 **Auto-Stop & Send**: Automatically stops recording after 5 seconds of silence and sends your message
// • 🔊 **Text-to-Speech**: Reads responses aloud
// • 🧠 **Smart Intent Recognition**: Understands what you want naturally

// **What I can do:**
// • Create new legal cases with all required information
// • List and manage your current cases
// • Guide you through all processes step by step

// **How to use voice:**
// • Click the microphone button to start
// • Speak naturally - I'll detect when you're done
// • After 5 seconds of silence, I'll automatically transcribe and send your message
// • Toggle auto-send on/off if you prefer manual review

// Just tell me what you want: "Create a case for a car accident" or "Show me my cases"

// What would you like to do?`,
//             timestamp: new Date()
//         };

//         setMessages([welcomeMessage]);
//         setShowSuggestions(true);
//         setCurrentCaseData({});
//         setInputMessage('');
//         setTranscript('');
//         setRecordedText('');

//         if (isVoiceEnabled && speechRef.current) {
//             speakMessage("Hello! I'm your AI legal assistant with enhanced voice features. I can automatically transcribe and send your messages after 5 seconds of silence. How can I help you today?");
//         }
//     };

//     // Clear case context when starting over
//     const clearCaseContext = () => {
//         console.log('🔄 Clearing case context...');
//         setCurrentCaseData({});
//     };

//     // Modal close handlers with follow-up
//     const handleCaseModalClose = () => {
//         setShowCaseModal(false);
//         setCaseModalData({});
//         setCurrentCaseData({});

//         const followUpMessage = {
//             id: Date.now(),
//             type: 'bot',
//             content: `Great! Your case has been created successfully. Would you like to create another case, or is there something else I can help you with?`,
//             timestamp: new Date()
//         };
//         setMessages(prev => [...prev, followUpMessage]);

//         if (isVoiceEnabled) {
//             speakMessage("Great! Your case has been created successfully. Would you like to create another case?");
//         }
//     };

//     // Initialize welcome message only when chat is opened
//     useEffect(() => {
//         if (isOpen && messages.length === 0) {
//             const welcomeMessage = {
//                 id: 1,
//                 type: 'bot',
//                 content: `Hello! I'm your AI legal assistant with enhanced voice features.



// **What I can do:**
// • Create new legal cases with all required information
// • Guide you through all processes step by step

// **How to use voice:**
// • Click the microphone button to start
// • Speak naturally - I'll detect when you're done
// • After 5 seconds of silence, I'll automatically transcribe and send your message
// • Toggle auto-send on/off if you prefer manual review

// Just tell me what you want: "Create a case for a car accident" or "Show me my cases"

// What would you like to do?`,
//                 timestamp: new Date()
//             };
//             setMessages([welcomeMessage]);

//             // Speak welcome message after brief delay
//             setTimeout(() => {
//                 if (isVoiceEnabled && speechRef.current) {
//                     speakMessage("Hello! I'm your AI legal assistant with enhanced voice features. I can automatically transcribe and send your messages after detecting speech and 5 seconds of silence. How can I help you today?");
//                 }
//             }, 500);
//         }
//     }, [isOpen, messages.length, isVoiceEnabled, speakMessage]);

//     // Scroll to bottom effect
//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     };

//     useEffect(() => {
//         scrollToBottom();
//     }, [messages]);

//     // Focus input when chat opens
//     useEffect(() => {
//         if (isOpen && inputRef.current) {
//             inputRef.current.focus();
//         }
//     }, [isOpen]);

//     // Don't render if user is not authenticated
//     if (!user) {
//         return null;
//     }

//     // Error boundary wrapper
//     try {
//         return (
//             <>
//                 {/* Enhanced Chat Toggle Button */}
//                 <Button
//                     onClick={toggleChat}
//                     className="fixed bottom-4 left-4 z-50 rounded-full w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-xl transition-all duration-300 transform hover:scale-110"
//                     size="icon"
//                 >
//                     {isOpen ? <X className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
//                     {isListening && (
//                         <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse">
//                             <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
//                         </div>
//                     )}
//                     {isVoiceEnabled && !isListening && (
//                         <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full"></div>
//                     )}
//                     {autoSendEnabled && (
//                         <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-blue-500 rounded-full">
//                             <Zap className="h-3 w-3 text-white" />
//                         </div>
//                     )}
//                 </Button>

//                 {/* Professional Chat Window */}
//                 {isOpen && (
//                     <div className="fixed bottom-24 left-4 z-40 w-[600px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
//                         {/* Enhanced Header with Voice Status */}
//                         <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white rounded-t-2xl">
//                             <div className="flex items-center space-x-3">
//                                 <div className="relative">
//                                     <Bot className="h-6 w-6" />
//                                     {isSpeaking && (
//                                         <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
//                                     )}
//                                 </div>
//                                 <div>
//                                     <h3 className="font-bold text-lg">AI Legal Assistant</h3>
//                                     <p className="text-xs text-green-100">
//                                         {isListening ? (
//                                             isSpeechDetected ? (
//                                                 `🎤 Recording... Auto-stop in ${silenceCountdown}s of silence`
//                                             ) : (
//                                                 `🎤 Listening... Speak now!`
//                                             )
//                                         ) : isSpeaking ? (
//                                             "🔊 Speaking Response"
//                                         ) : isVoiceEnabled ? (
//                                             `🎤 Voice Ready${autoSendEnabled ? ' • Auto-Send ON' : ' • Manual Mode'}`
//                                         ) : (
//                                             "🎤 Voice Disabled"
//                                         )}
//                                     </p>
//                                 </div>
//                             </div>

//                             <div className="flex items-center space-x-2">
//                                 {/* Auto-Send Status */}
//                                 {autoSendEnabled && (
//                                     <div className="flex items-center space-x-1 bg-blue-500/20 rounded-full px-2 py-1">
//                                         <Zap className="w-3 h-3 text-blue-200" />
//                                         <span className="text-xs font-medium text-blue-200">AUTO</span>
//                                     </div>
//                                 )}

//                                 {/* Voice Status */}
//                                 {isListening && (
//                                     <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
//                                         <div className={`w-2 h-2 rounded-full ${isSpeechDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-pulse'}`} />
//                                         <span className="text-xs font-medium">
//                                             {isSpeechDetected ? 'SPEAKING' : 'LISTENING'}
//                                         </span>
//                                     </div>
//                                 )}

//                                 {/* Silence Countdown */}
//                                 {isListening && isSpeechDetected && silenceStartTimeRef.current && (
//                                     <div className="flex items-center space-x-1 bg-orange-500/20 rounded-full px-2 py-1">
//                                         <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
//                                         <span className="text-xs font-medium">{silenceCountdown}s</span>
//                                     </div>
//                                 )}

//                                 {/* Audio Level Indicator */}
//                                 {isListening && (
//                                     <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
//                                         <div className="flex space-x-1">
//                                             {[...Array(5)].map((_, i) => (
//                                                 <div
//                                                     key={i}
//                                                     className={`w-1 h-3 rounded-full transition-all duration-100 ${audioLevel > (i + 1) * 15 ? 'bg-green-400' : 'bg-white/40'
//                                                         }`}
//                                                 />
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}

//                                 {/* Control Buttons */}
//                                 <Button
//                                     onClick={toggleAutoSend}
//                                     variant="ghost"
//                                     size="sm"
//                                     className="text-white hover:bg-white/20 transition-colors"
//                                     title={autoSendEnabled ? "Disable auto-send" : "Enable auto-send"}
//                                 >
//                                     {autoSendEnabled ? (
//                                         <Zap className="h-4 w-4 text-blue-200" />
//                                     ) : (
//                                         <Pause className="h-4 w-4" />
//                                     )}
//                                 </Button>

//                                 <Button
//                                     onClick={toggleVoiceOutput}
//                                     variant="ghost"
//                                     size="sm"
//                                     className="text-white hover:bg-white/20 transition-colors"
//                                     title={isVoiceEnabled ? "Disable voice output" : "Enable voice output"}
//                                 >
//                                     {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
//                                 </Button>

//                                 <Button
//                                     onClick={toggleMinimize}
//                                     variant="ghost"
//                                     size="sm"
//                                     className="text-white hover:bg-white/20 transition-colors"
//                                 >
//                                     {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
//                                 </Button>

//                                 <Button
//                                     onClick={toggleChat}
//                                     variant="ghost"
//                                     size="sm"
//                                     className="text-white hover:bg-white/20 transition-colors"
//                                 >
//                                     <X className="h-4 w-4" />
//                                 </Button>
//                             </div>
//                         </div>

//                         {!isMinimized && (
//                             <>
//                                 {/* Enhanced Messages Area */}
//                                 <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-white">
//                                     <div className="space-y-4">
//                                         {messages.map((message) => (
//                                             <div
//                                                 key={message.id}
//                                                 className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
//                                             >
//                                                 <div
//                                                     className={`max-w-[85%] text-sm rounded-2xl p-4 shadow-sm transition-all duration-200 ${message.type === 'user'
//                                                         ? 'bg-gradient-to-r from-green-600 to-green-700 text-white ml-8'
//                                                         : 'bg-white border border-gray-200 text-gray-900 mr-8'
//                                                         }`}
//                                                 >
//                                                     <div className="flex items-start space-x-3">
//                                                         {message.type === 'bot' && (
//                                                             <div className="flex-shrink-0 mt-1">
//                                                                 <Bot className="h-5 w-5 text-green-600" />
//                                                             </div>
//                                                         )}
//                                                         {message.type === 'user' && (
//                                                             <div className="flex-shrink-0 mt-1">
//                                                                 <User className="h-5 w-5 text-green-100" />
//                                                             </div>
//                                                         )}
//                                                         <div className="flex-1 min-w-0">
//                                                             <div className="prose prose-sm max-w-none leading-relaxed whitespace-pre-wrap">
//                                                                 {message.content}
//                                                             </div>
//                                                             <div className={`text-xs mt-3 ${message.type === 'user' ? 'text-green-100' : 'text-gray-500'
//                                                                 }`}>
//                                                                 {message.timestamp ? message.timestamp.toLocaleTimeString([], {
//                                                                     hour: '2-digit',
//                                                                     minute: '2-digit'
//                                                                 }) : 'Just now'}
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         ))}

//                                         {/* Enhanced Loading Indicator */}
//                                         {isLoading && (
//                                             <div className="flex justify-start">
//                                                 <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mr-8">
//                                                     <div className="flex items-center space-x-3">
//                                                         <Bot className="h-5 w-5 text-green-600" />
//                                                         <div className="flex space-x-2">
//                                                             <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
//                                                             <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                                                             <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                                                         </div>
//                                                         <span className="text-sm text-gray-600">Processing...</span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         )}

//                                         <div ref={messagesEndRef} />

//                                         {/* Suggestions */}
//                                         {showSuggestions && (
//                                             <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
//                                                 <p className="text-xs font-medium text-gray-600 mb-2">Quick Actions:</p>
//                                                 <div className="flex flex-wrap gap-2">
//                                                     {["Create a case", "List my cases"].map((suggestion) => (
//                                                         <Button
//                                                             key={suggestion}
//                                                             variant="outline"
//                                                             size="sm"
//                                                             onClick={() => handleSuggestionClick(suggestion)}
//                                                             className="text-xs h-7 px-3 bg-white hover:bg-green-50 border-gray-300 hover:border-green-300 transition-colors"
//                                                         >
//                                                             {suggestion}
//                                                         </Button>
//                                                     ))}
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </ScrollArea>

//                                 {/* Professional Input Area with Enhanced Voice Integration */}
//                                 <div className="p-4 border-t border-gray-200 bg-white">
//                                     <div className="flex space-x-3">
//                                         <div className="flex-1 relative">
//                                             <Input
//                                                 ref={inputRef}
//                                                 value={inputMessage}
//                                                 onChange={(e) => setInputMessage(e.target.value)}
//                                                 onKeyPress={handleKeyPress}
//                                                 placeholder={
//                                                     isListening
//                                                         ? isSpeechDetected
//                                                             ? `🎤 Recording... Will auto-${autoSendEnabled ? 'send' : 'stop'} after ${silenceCountdown}s silence`
//                                                             : "🎤 Listening... Speak now!"
//                                                         : autoSendEnabled && isVoiceEnabled
//                                                             ? "Type or click mic for voice input (auto-sends after 5s silence)"
//                                                             : isVoiceEnabled
//                                                                 ? "Type your message or click the microphone for voice input..."
//                                                                 : "Type your message..."
//                                                 }
//                                                 className={`w-full pr-4 transition-all duration-200 border-2 rounded-xl ${isListening
//                                                     ? 'border-red-300 bg-red-50 shadow-md ring-2 ring-red-100'
//                                                     : autoSendEnabled && isVoiceEnabled
//                                                         ? 'border-blue-300 bg-blue-50 hover:border-blue-400 focus:border-blue-500'
//                                                         : isVoiceEnabled
//                                                             ? 'border-green-300 bg-green-50 hover:border-green-400 focus:border-green-500'
//                                                             : 'border-gray-300 hover:border-gray-400 focus:border-gray-500'
//                                                     }`}
//                                                 disabled={isLoading}
//                                             />

//                                             {/* Enhanced status indicators */}
//                                             {isListening && (
//                                                 <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                                                     <div className="flex items-center space-x-1">
//                                                         <div className={`w-2 h-2 rounded-full animate-pulse ${isSpeechDetected ? 'bg-green-500' : 'bg-red-500'
//                                                             }`}></div>
//                                                         <span className={`text-xs font-medium ${isSpeechDetected ? 'text-green-600' : 'text-red-600'
//                                                             }`}>
//                                                             {isSpeechDetected ? `${silenceCountdown}s` : 'SPEAK'}
//                                                         </span>
//                                                     </div>
//                                                 </div>
//                                             )}

//                                             {/* Connection status indicator */}
//                                             {!isListening && (
//                                                 <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                                                     <div className="flex items-center space-x-1">
//                                                         <div className={`w-2 h-2 rounded-full ${autoSendEnabled && isVoiceEnabled ? 'bg-blue-500' :
//                                                                 isVoiceEnabled ? 'bg-green-500' : 'bg-gray-400'
//                                                             }`} />
//                                                         {autoSendEnabled && isVoiceEnabled && (
//                                                             <Zap className="w-3 h-3 text-blue-500" />
//                                                         )}
//                                                     </div>
//                                                 </div>
//                                             )}
//                                         </div>

//                                         {/* Enhanced Voice Button with better state management */}
//                                         {isVoiceEnabled && (
//                                             <Button
//                                                 onClick={toggleVoiceInput}
//                                                 disabled={isLoading}
//                                                 className={`transition-all duration-300 min-w-[48px] h-12 rounded-xl ${isListening
//                                                     ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg scale-105'
//                                                     : autoSendEnabled
//                                                         ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
//                                                         : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg'
//                                                     }`}
//                                                 size="icon"
//                                                 title={
//                                                     isListening ? "Stop voice input (click to stop recording)" :
//                                                         autoSendEnabled ? "Start voice input (auto-send enabled)" :
//                                                             "Start voice input (manual mode)"
//                                                 }
//                                             >
//                                                 {isListening ? (
//                                                     <MicOff className="h-5 w-5" />
//                                                 ) : (
//                                                     <Mic className="h-5 w-5" />
//                                                 )}
//                                                 {autoSendEnabled && !isListening && (
//                                                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full">
//                                                         <Zap className="h-2 w-2 text-white absolute top-0.5 left-0.5" />
//                                                     </div>
//                                                 )}
//                                                 {!autoSendEnabled && isVoiceEnabled && !isListening && (
//                                                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
//                                                 )}
//                                                 {isListening && (
//                                                     <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse">
//                                                         <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
//                                                     </div>
//                                                 )}
//                                             </Button>
//                                         )}

//                                         {/* Send Button */}
//                                         <Button
//                                             onClick={() => handleSendMessage()}
//                                             disabled={!inputMessage.trim() || isLoading}
//                                             className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 min-w-[48px] h-12 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
//                                             size="icon"
//                                             title="Send message"
//                                         >
//                                             <Send className="h-5 w-5" />
//                                         </Button>
//                                     </div>

//                                     {/* Enhanced Transcript Display */}
//                                     {transcript && (
//                                         <div className={`mt-2 p-3 rounded-lg border transition-all duration-200 ${transcript.includes('Auto-sending') ? 'bg-blue-50 border-blue-200' :
//                                                 transcript.includes('Error') ? 'bg-red-50 border-red-200' :
//                                                     transcript.includes('✅') ? 'bg-green-50 border-green-200' :
//                                                         'bg-gray-50 border-gray-200'
//                                             }`}>
//                                             <p className="text-sm text-gray-700 font-medium">{transcript}</p>
//                                         </div>
//                                     )}

//                                     {/* Enhanced Status Bar */}
//                                     <div className="flex justify-between items-center mt-3">
//                                         <div className="flex items-center space-x-4">
//                                             <p className="text-xs text-gray-600">
//                                                 {isListening ? (
//                                                     isSpeechDetected ? (
//                                                         <span className="flex items-center space-x-2">
//                                                             <Zap className="h-3 w-3 text-green-600" />
//                                                             <span className="font-medium text-green-600">
//                                                                 Recording... Auto-{autoSendEnabled ? 'send' : 'stop'} in {silenceCountdown}s
//                                                             </span>
//                                                         </span>
//                                                     ) : (
//                                                         <span className="flex items-center space-x-2">
//                                                             <Mic className="h-3 w-3 text-red-600" />
//                                                             <span className="font-medium text-red-600">
//                                                                 Listening... Speak now!
//                                                             </span>
//                                                         </span>
//                                                     )
//                                                 ) : isSpeaking ? (
//                                                     <span className="flex items-center space-x-2">
//                                                         <Volume2 className="h-3 w-3 text-blue-600" />
//                                                         <span className="font-medium text-blue-600">Speaking response...</span>
//                                                     </span>
//                                                 ) : autoSendEnabled && isVoiceEnabled ? (
//                                                     <span className="flex items-center space-x-2">
//                                                         <Zap className="h-3 w-3 text-blue-600" />
//                                                         <span className="font-medium text-blue-600">Auto-send mode active</span>
//                                                     </span>
//                                                 ) : isVoiceEnabled ? (
//                                                     <span className="flex items-center space-x-2">
//                                                         <Mic className="h-3 w-3 text-gray-500" />
//                                                         <span>Voice recognition ready (manual mode)</span>
//                                                     </span>
//                                                 ) : (
//                                                     <span className="flex items-center space-x-2">
//                                                         <MessageSquare className="h-3 w-3 text-gray-500" />
//                                                         <span>Voice disabled - Text input only</span>
//                                                     </span>
//                                                 )}
//                                             </p>
//                                         </div>

//                                         <div className="flex items-center space-x-2">
//                                             {/* Voice control shortcuts */}
//                                             {isListening && (
//                                                 <>
//                                                     <Button
//                                                         onClick={stopListening}
//                                                         variant="outline"
//                                                         size="sm"
//                                                         className="text-xs h-7 px-3 text-red-600 border-red-300 hover:bg-red-50 transition-colors"
//                                                     >
//                                                         <MicOff className="h-3 w-3 mr-1" />
//                                                         Force Stop
//                                                     </Button>

//                                                     <Button
//                                                         onClick={forceCleanup}
//                                                         variant="outline"
//                                                         size="sm"
//                                                         className="text-xs h-7 px-3 text-orange-600 border-orange-300 hover:bg-orange-50 transition-colors"
//                                                     >
//                                                         <X className="h-3 w-3 mr-1" />
//                                                         Reset
//                                                     </Button>
//                                                 </>
//                                             )}

//                                             {isSpeaking && (
//                                                 <Button
//                                                     onClick={() => {
//                                                         if (speechRef.current) {
//                                                             speechRef.current.cancel();
//                                                             setIsSpeaking(false);
//                                                         }
//                                                     }}
//                                                     variant="outline"
//                                                     size="sm"
//                                                     className="text-xs h-7 px-3 text-blue-600 border-blue-300 hover:bg-blue-50 transition-colors"
//                                                 >
//                                                     <VolumeX className="h-3 w-3 mr-1" />
//                                                     Stop Speaking
//                                                 </Button>
//                                             )}

//                                             <Button
//                                                 onClick={clearChat}
//                                                 variant="ghost"
//                                                 size="sm"
//                                                 className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
//                                             >
//                                                 🧹 Clear Chat
//                                             </Button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </>
//                         )}
//                     </div>
//                 )}

//                 {/* Professional Case Creation Modal */}
//                 {showCaseModal && (
//                     <CreateCaseModal
//                         onClose={handleCaseModalClose}
//                         prefillData={caseModalData}
//                     />
//                 )}
//             </>
//         );
//     } catch (error) {
//         console.error('AILawyerAssistant Render Error:', error);

//         // Fallback error UI
//         return (
//             <div className="fixed bottom-4 left-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//                 <strong className="font-bold">AI Assistant Error:</strong>
//                 <span className="block sm:inline"> {error.message}</span>
//                 <button
//                     onClick={() => window.location.reload()}
//                     className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
//                 >
//                     Reload Page
//                 </button>
//             </div>
//         );
//     }
// };

// export default AILawyerAssistant;



'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    MessageCircle,
    Send,
    Bot,
    User,
    X,
    Minimize2,
    Maximize2,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    FileText,
    Users,
    Calendar,
    DollarSign,
    Briefcase,
    MessageSquare,
    Video,
    Settings,
    ChevronDown,
    ChevronUp,
    Play,
    Pause,
    RefreshCw,
    TestTube,
    Zap
} from 'lucide-react';
import { toast } from 'react-toastify';
import caseCreationAIService from '@/lib/services/caseCreationAIService';
import geminiService from '@/lib/services/geminiService';
import CreateCaseModal from './cases/createCaseModal';
import { useUser } from '@/providers/UserProvider';

const AILawyerAssistant = () => {
    // User context
    const { user, isAuth } = useUser();

    // Role-based access control - Only show for Provider and Admin
    if (!isAuth || !user || (user.Role !== 'PROVIDER' && user.Role !== 'ADMIN')) {
        return null;
    }

    // Main component states
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);

    // Enhanced voice-related states with browser Speech Recognition
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [transcript, setTranscript] = useState("");
    const [silenceTimer, setSilenceTimer] = useState(null);
    const [silenceCountdown, setSilenceCountdown] = useState(5);
    const [isSpeechDetected, setIsSpeechDetected] = useState(false);
    const [autoSendEnabled, setAutoSendEnabled] = useState(true);
    const [recordedText, setRecordedText] = useState('');
    const [speechSupported, setSpeechSupported] = useState(false);

    // Case creation states
    const [currentCaseData, setCurrentCaseData] = useState({});
    const [showCaseModal, setShowCaseModal] = useState(false);
    const [caseModalData, setCaseModalData] = useState({});

    // Refs for speech and DOM management
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const speechRef = useRef(null);
    const recognitionRef = useRef(null);

    // Check for Speech Recognition support
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setSpeechSupported(true);
            console.log('Speech Recognition supported');
            
            // Test if we can create a recognition instance
            try {
                const testRecognition = new SpeechRecognition();
                console.log('Speech Recognition instance created successfully');
            } catch (error) {
                console.error('Failed to create Speech Recognition instance:', error);
                setSpeechSupported(false);
                setIsVoiceEnabled(false);
            }
        } else {
            setSpeechSupported(false);
            setIsVoiceEnabled(false);
            console.warn('Speech Recognition not supported in this browser');
        }
    }, []);

    // Speech synthesis setup
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            speechRef.current = window.speechSynthesis;

            const loadVoices = () => {
                const voices = speechRef.current.getVoices();
                console.log('Available voices:', voices.length);
            };

            speechRef.current.onvoiceschanged = loadVoices;
            loadVoices();
        }
    }, []);

    // Initialize Speech Recognition
    const initializeSpeechRecognition = () => {
        if (!speechSupported) {
            setTranscript("Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.");
            return null;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setTranscript("Speech recognition not available. Please check your browser support.");
            return null;
        }

        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        let finalTranscript = '';
        let interimTranscript = '';
        let silenceTimeout = null;

        recognition.onstart = () => {
            console.log('Speech recognition started');
            setIsListening(true);
            setIsSpeechDetected(false);
            setTranscript("Listening... Speak now!");
            setSilenceCountdown(5);
            finalTranscript = '';
            interimTranscript = '';
        };

        recognition.onresult = (event) => {
            interimTranscript = '';
            finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            const currentTranscript = finalTranscript || interimTranscript;

            if (currentTranscript.trim()) {
                setIsSpeechDetected(true);
                setInputMessage(currentTranscript.trim());
                setRecordedText(currentTranscript.trim());
                setTranscript(`Recording: "${currentTranscript.trim()}"`);

                // Clear existing silence timer
                if (silenceTimeout) {
                    clearTimeout(silenceTimeout);
                }

                // Start silence detection for auto-stop
                silenceTimeout = setTimeout(() => {
                    console.log('3 seconds of silence detected, stopping...');
                    recognition.stop();
                }, 3000);

                // Update countdown
                let countdown = 3;
                const countdownInterval = setInterval(() => {
                    countdown--;
                    setSilenceCountdown(countdown);
                    if (countdown <= 0) {
                        clearInterval(countdownInterval);
                    }
                }, 1000);

                // Clear countdown interval when speech continues
                setTimeout(() => clearInterval(countdownInterval), 5000);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            setIsSpeechDetected(false);

            let errorMessage = "Speech recognition error. Please try again.";
            if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                errorMessage = "Microphone permission denied. Please allow microphone access and try again.";
                setIsVoiceEnabled(false);
            } else if (event.error === 'no-speech') {
                errorMessage = "No speech detected. Please try speaking again.";
            } else if (event.error === 'network') {
                errorMessage = "Network error. Please check your connection and try again.";
            } else if (event.error === 'audio-capture') {
                errorMessage = "Microphone not available. Please check your microphone and try again.";
            } else if (event.error === 'service-not-allowed') {
                errorMessage = "Speech recognition service not allowed. Please check your browser settings.";
            }

            setTranscript(errorMessage);
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
            setIsListening(false);

            if (silenceTimeout) {
                clearTimeout(silenceTimeout);
            }

            const finalText = finalTranscript.trim() || recordedText.trim();

            if (finalText) {
                setTranscript(`Transcribed: "${finalText}"`);
                setInputMessage(finalText);

                // Auto-send if enabled and we have valid text
                if (autoSendEnabled && finalText.length > 2) {
                    console.log('Auto-sending transcribed message...');
                    setTranscript(`Auto-sending: "${finalText}"`);

                    setTimeout(() => {
                        handleSendMessage(finalText);
                    }, 1000);
                } else {
                    setTranscript(`Ready to send: "${finalText}" (Click send or press Enter)`);
                }
            } else {
                setTranscript("No speech detected. Please try again.");
            }
        };

        return recognition;
    };

    // Start listening function
    const startListening = async () => {
        try {
            setRecordedText('');

            // Check microphone permissions first
            if (navigator.permissions) {
                try {
                    const permission = await navigator.permissions.query({ name: 'microphone' });
                    if (permission.state === 'denied') {
                        setTranscript("Microphone permission denied. Please enable microphone access in your browser settings.");
                        setIsVoiceEnabled(false);
                        return;
                    }
                } catch (permError) {
                    console.log('Permission API not supported, continuing...');
                }
            }

            const recognition = initializeSpeechRecognition();
            if (!recognition) return;

            recognitionRef.current = recognition;
            recognition.start();

        } catch (error) {
            console.error('Error starting speech recognition:', error);
            setTranscript("Error starting speech recognition. Please check microphone permissions and browser support.");
            setIsListening(false);
            setIsVoiceEnabled(false);
        }
    };

    // Stop listening function
    const stopListening = () => {
        console.log('Manually stopping speech recognition...');

        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        setIsListening(false);
        setIsSpeechDetected(false);
        setSilenceCountdown(5);
    };

    // Text-to-speech function
    const speakMessage = useCallback((text) => {
        if (!isVoiceEnabled || !speechRef.current || !text?.trim()) return;

        try {
            // Stop any current speech
            speechRef.current.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            // Get available voices and prioritize English voices
            const voices = speechRef.current.getVoices();
            let selectedVoice = voices.find(voice =>
                voice.lang.startsWith('en') && (
                    voice.name.includes('Google') ||
                    voice.name.includes('Natural') ||
                    voice.name.includes('Premium') ||
                    voice.name.includes('US') ||
                    voice.name.includes('UK') ||
                    voice.name.includes('English')
                )
            );

            if (!selectedVoice) {
                selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
            }

            if (!selectedVoice && voices.length > 0) {
                selectedVoice = voices[0];
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;

            setIsSpeaking(true);

            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = (event) => {
                setIsSpeaking(false);
                if (event.error !== 'interrupted' && event.error !== 'canceled') {
                    console.error('TTS error:', event.error);
                }
            };

            speechRef.current.speak(utterance);

        } catch (error) {
            console.error('Speech synthesis error:', error);
            setIsSpeaking(false);
        }
    }, [isVoiceEnabled]);

    // Toggle voice input
    const toggleVoiceInput = async () => {
        if (!speechSupported) {
            setTranscript("Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari for voice features.");
            return;
        }

        if (!isVoiceEnabled) {
            setTranscript("Voice features are disabled. Please check microphone permissions or browser settings.");
            return;
        }

        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // Toggle auto-send functionality
    const toggleAutoSend = () => {
        const newState = !autoSendEnabled;
        setAutoSendEnabled(newState);
        console.log('Auto-send toggled:', newState);

        setTranscript(newState ?
            "Auto-send enabled: Messages will be sent automatically after voice input" :
            "Auto-send disabled: You'll need to review and send manually"
        );

        setTimeout(() => {
            if (!isListening) setTranscript("");
        }, 3000);
    };

    // Toggle voice output
    const toggleVoiceOutput = () => {
        const newState = !isVoiceEnabled;
        setIsVoiceEnabled(newState);

        if (speechRef.current) {
            speechRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    // List user's cases
    const listUserCases = async () => {
        try {
            console.log('Fetching user cases...');

            if (!user || !isAuth) {
                return {
                    success: false,
                    message: "You need to be logged in to view your cases. Please log in first.",
                    suggestions: ["Log in", "Create a case"]
                };
            }

            return {
                success: true,
                message: "I can help you create new legal cases. Would you like to start a new case?",
                suggestions: ["Create a case"]
            };
        } catch (error) {
            console.error('Error handling cases:', error);
            return {
                success: false,
                message: "I encountered an error while processing your request. Please try again."
            };
        }
    };

    // Use Gemini to understand user intent
    const understandUserIntent = async (userMessage, conversationHistory) => {
        try {
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error('Gemini API key not configured');
            }

            const prompt = `You are an AI legal assistant that helps users with legal case management. 

Analyze the user's message and determine their intent. Return a JSON response with the following structure:

{
    "intent": "case_creation" | "list_cases" | "general_help" | "other",
    "confidence": 0.0-1.0,
    "extracted_info": {
        "case_name": "extracted case name if mentioned",
        "description": "brief description of what they want",
        "priority": "high/medium/low if mentioned",
        "status": "pending/active/closed if mentioned"
    },
    "reasoning": "brief explanation of why you chose this intent",
    "suggestions": ["array of helpful suggestions for next steps"]
}

CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}

USER MESSAGE: "${userMessage}"

IMPORTANT: Be intelligent about context. If someone says "I want to start a new case", that's "case_creation". If they say "show me my cases", that's "list_cases". If they mention creating a case, managing cases, or starting legal proceedings, route to case_creation.

Return only valid JSON:`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API request failed: ${response.status}`);
            }

            const data = await response.json();
            const geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid response format from Gemini');
            }

            const intentData = JSON.parse(jsonMatch[0]);
            console.log('Gemini Intent Analysis:', intentData);

            return intentData;
        } catch (error) {
            console.error('Error understanding user intent with Gemini:', error);
            return {
                intent: 'general_help',
                confidence: 0.5,
                extracted_info: {},
                reasoning: 'Fallback due to Gemini error',
                suggestions: ['Try rephrasing your request', 'Use text input instead']
            };
        }
    };

    // Process AI conversation
    const processAIConversation = async (userMessage) => {
        try {
            if (!isAuth || !user) {
                console.log('User not authenticated');
                return {
                    content: "You need to be logged in to use the AI assistant. Please log in first.",
                    suggestions: ["Log in", "Refresh page"]
                };
            }

            const conversationHistory = messages.filter(msg => msg.type === 'bot' || msg.type === 'user');

            console.log('Analyzing user intent with Gemini...');
            const intentData = await understandUserIntent(userMessage, conversationHistory);

            console.log('Intent Analysis Result:', {
                intent: intentData.intent,
                confidence: intentData.confidence,
                extracted_info: intentData.extracted_info
            });

            const intent = intentData.intent;
            const extractedInfo = intentData.extracted_info;

            console.log('Routing based on Gemini intent:', {
                intent,
                confidence: intentData.confidence,
                extracted_info: extractedInfo,
                reasoning: intentData.reasoning
            });

            if (intent === 'list_cases') {
                const result = await listUserCases();
                return {
                    content: result.message,
                    suggestions: result.suggestions || []
                };
            } else if (intent === 'case_creation') {
                console.log('Processing CASE request');
                const response = await caseCreationAIService.processConversation(
                    userMessage,
                    conversationHistory,
                    currentCaseData
                );

                if (response.success) {
                    const aiData = response.data;
                    setCurrentCaseData(aiData.gatheredInfo);

                    if (aiData.isComplete || caseCreationAIService.isCaseComplete(aiData.gatheredInfo)) {
                        const modalData = caseCreationAIService.formatCaseDataForModal(aiData.gatheredInfo);
                        setCaseModalData(modalData);
                        setShowCaseModal(true);

                        return {
                            content: `Perfect! I have all the information I need to create your case. Let me open the case creation form for you to review and submit.\n\n**Case Summary:**\n- **Name**: ${aiData.gatheredInfo.caseName}\n- **Client**: ${aiData.gatheredInfo.clientName}\n- **Opposing Party**: ${aiData.gatheredInfo.opposingParty}\n- **Type**: ${aiData.gatheredInfo.description}\n- **Priority**: ${aiData.gatheredInfo.priority || 'Medium'}\n- **Status**: ${aiData.gatheredInfo.status || 'Pending'}\n\nThe case creation form is now open. Please review the details and click "Create Case" when you're ready.`,
                            suggestions: ["Review and submit case", "Make changes", "Start over"]
                        };
                    }

                    return {
                        content: aiData.message,
                        suggestions: aiData.suggestions || []
                    };
                }
            } else if (intent === 'general_help' || intent === 'other') {
                return {
                    content: `I understand you're asking about "${userMessage}". Let me help you with that.\n\n${intentData.reasoning}\n\nWhat would you like to do? I can help you with:\n• Creating legal cases\n• Listing your current cases`,
                    suggestions: intentData.suggestions || ["Create a case", "List my cases"]
                };
            } else {
                const response = await caseCreationAIService.processConversation(
                    userMessage,
                    conversationHistory,
                    currentCaseData
                );

                if (response.success) {
                    const aiData = response.data;
                    setCurrentCaseData(aiData.gatheredInfo);
                    return {
                        content: aiData.message,
                        suggestions: aiData.suggestions || []
                    };
                }
            }

            throw new Error('Failed to process conversation');

        } catch (error) {
            console.error('AI Conversation Error:', error);
            return {
                content: `I apologize, but I encountered an error processing your request. Please try again or rephrase your message.\n\nError details: ${error.message}`,
                suggestions: ["Try again", "Start over", "Use text input"]
            };
        }
    };

    // Send message function
    const handleSendMessage = async (messageText = null) => {
        const userMessage = messageText || inputMessage.trim();
        if (!userMessage || isLoading) return;

        console.log('Sending message:', userMessage);

        if (isListening) {
            stopListening();
        }

        const userMsg = {
            id: Date.now(),
            type: 'user',
            content: userMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputMessage('');
        setTranscript('');
        setRecordedText('');
        setIsLoading(true);
        setShowSuggestions(false);

        try {
            console.log('Processing AI response...');
            const aiResponse = await processAIConversation(userMessage);

            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                content: aiResponse.content,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);

            if (isVoiceEnabled && !isSpeaking && aiResponse.content?.trim()) {
                console.log('Starting TTS for response...');
                speakMessage(aiResponse.content);
            }

            if (aiResponse.suggestions) {
                setShowSuggestions(true);
            }

            console.log('Message processed successfully');
        } catch (error) {
            console.error('Send message error:', error);
            const errorMsg = {
                id: Date.now() + 1,
                type: 'bot',
                content: `I apologize, but I encountered an error processing your request. Please try again.\n\nError: ${error.message}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    // Suggestion click handler
    const handleSuggestionClick = (suggestion) => {
        console.log('Suggestion clicked:', suggestion);

        if (suggestion === "Start over" || suggestion === "Start over with new case") {
            clearCaseContext();
            setInputMessage("I want to start over");
            handleSendMessage("I want to start over");
        } else {
            setInputMessage(suggestion);
            inputRef.current?.focus();
        }
    };

    // Key press handler
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();

            if (isListening) {
                toggleVoiceInput();
            } else {
                handleSendMessage();
            }
        }
    };

    // UI control functions
    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setIsMinimized(false);
        }
        console.log('Chat toggled:', !isOpen);
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        console.log('Chat minimized:', !isMinimized);
    };



    const clearCaseContext = () => {
        console.log('Clearing case context...');
        setCurrentCaseData({});
    };

    const handleCaseModalClose = () => {
        setShowCaseModal(false);
        setCaseModalData({});
        setCurrentCaseData({});

        const followUpMessage = {
            id: Date.now(),
            type: 'bot',
            content: `Great! Your case has been created successfully. Would you like to create another case, or is there something else I can help you with?`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, followUpMessage]);

        if (isVoiceEnabled) {
            speakMessage("Great! Your case has been created successfully. Would you like to create another case?");
        }
    };

    // Initialize welcome message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage = {
                id: 1,
                type: 'bot',
                content:
                    `Hello! I'm your AI legal assistant with voice features.

**What I can do:**
• Create new legal cases with all required information
• Guide you through all processes step by step

**How to use voice:**
• Click the microphone button to start
• Speak naturally - I'll transcribe your speech
• Speech stops automatically after a pause
• Toggle auto-send on/off if you prefer manual review

Just tell me what you want: "Create a case for a car accident" 

What would you like to do?`,
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);

            setTimeout(() => {
                if (isVoiceEnabled && speechRef.current && speechSupported) {
                    speakMessage("Hello! I'm your AI legal assistant . How can I help you today?");
                }
            }, 500);
        }
    }, [isOpen, messages.length, isVoiceEnabled, speakMessage, speechSupported]);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Don't render if user is not authenticated
    if (!user) {
        return null;
    }

    return (
        <>
            {/* Chat Toggle Button */}
            <Button
                onClick={toggleChat}
                className="fixed bottom-4 left-4 z-50 rounded-full w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-xl transition-all duration-300 transform hover:scale-110"
                size="icon"
            >
                {isOpen ? <X className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                {isListening && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse">
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                    </div>
                )}
                {speechSupported && isVoiceEnabled && !isListening && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full"></div>
                )}
                {autoSendEnabled && speechSupported && (
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-blue-500 rounded-full">
                        <Zap className="h-3 w-3 text-white" />
                    </div>
                )}
            </Button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 left-4 z-40 w-[600px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white rounded-t-2xl">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <Bot className="h-6 w-6" />
                                {isSpeaking && (
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">AI Legal Assistant</h3>
                                <p className="text-xs text-green-100">
                                    {!speechSupported ? (
                                        "Voice not supported - Text only"
                                    ) : isListening ? (
                                        isSpeechDetected ? (
                                            `Recording... Auto-stop in ${silenceCountdown}s`
                                        ) : (
                                            "Listening... Speak now!"
                                        )
                                    ) : isSpeaking ? (
                                        "Speaking Response"
                                    ) : isVoiceEnabled ? (
                                        `Voice Ready${autoSendEnabled ? ' • Auto-Send ON' : ' • Manual Mode'}`
                                    ) : (
                                        "Voice Disabled"
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Auto-Send Status */}
                            {autoSendEnabled && speechSupported && (
                                <div className="flex items-center space-x-1 bg-blue-500/20 rounded-full px-2 py-1">
                                    <Zap className="w-3 h-3 text-blue-200" />
                                    <span className="text-xs font-medium text-blue-200">AUTO</span>
                                </div>
                            )}

                            {/* Voice Status */}
                            {isListening && (
                                <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
                                    <div className={`w-2 h-2 rounded-full ${isSpeechDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-pulse'}`} />
                                    <span className="text-xs font-medium">
                                        {isSpeechDetected ? 'SPEAKING' : 'LISTENING'}
                                    </span>
                                </div>
                            )}

                            {/* Silence Countdown */}
                            {isListening && isSpeechDetected && (
                                <div className="flex items-center space-x-1 bg-orange-500/20 rounded-full px-2 py-1">
                                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                                    <span className="text-xs font-medium">{silenceCountdown}s</span>
                                </div>
                            )}

                            {/* Control Buttons */}
                            {speechSupported && (
                                <Button
                                    onClick={toggleAutoSend}
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/20 transition-colors"
                                    title={autoSendEnabled ? "Disable auto-send" : "Enable auto-send"}
                                >
                                    {autoSendEnabled ? (
                                        <Zap className="h-4 w-4 text-blue-200" />
                                    ) : (
                                        <Pause className="h-4 w-4" />
                                    )}
                                </Button>
                            )}

                            <Button
                                onClick={toggleVoiceOutput}
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/20 transition-colors"
                                title={isVoiceEnabled ? "Disable voice output" : "Enable voice output"}
                            >
                                {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            </Button>

                            <Button
                                onClick={toggleMinimize}
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/20 transition-colors"
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </Button>

                            <Button
                                onClick={toggleChat}
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/20 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages Area */}
                            <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-white">
                                <div className="space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] text-sm rounded-2xl p-4 shadow-sm transition-all duration-200 ${message.type === 'user'
                                                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white ml-8'
                                                    : 'bg-white border border-gray-200 text-gray-900 mr-8'
                                                    }`}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    {message.type === 'bot' && (
                                                        <div className="flex-shrink-0 mt-1">
                                                            <Bot className="h-5 w-5 text-green-600" />
                                                        </div>
                                                    )}
                                                    {message.type === 'user' && (
                                                        <div className="flex-shrink-0 mt-1">
                                                            <User className="h-5 w-5 text-green-100" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="prose prose-sm max-w-none leading-relaxed whitespace-pre-wrap">
                                                            {message.content}
                                                        </div>
                                                        <div className={`text-xs mt-3 ${message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                                                            }`}>
                                                            {message.timestamp ? message.timestamp.toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) : 'Just now'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Loading Indicator */}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mr-8">
                                                <div className="flex items-center space-x-3">
                                                    <Bot className="h-5 w-5 text-green-600" />
                                                    <div className="flex space-x-2">
                                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    </div>
                                                    <span className="text-sm text-gray-600">Processing...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />


                                </div>
                            </ScrollArea>

                            {/* Input Area */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <div className="flex space-x-3">
                                    <div className="flex-1 relative">
                                        <Input
                                            ref={inputRef}
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder={
                                                !speechSupported
                                                    ? "Type your message (voice not supported in this browser)"
                                                    : isListening
                                                        ? isSpeechDetected
                                                            ? `Recording... Will auto-${autoSendEnabled ? 'send' : 'stop'} after ${silenceCountdown}s silence`
                                                            : "Listening... Speak now!"
                                                        : autoSendEnabled && isVoiceEnabled
                                                            ? "Type or click mic for voice input (auto-sends after pause)"
                                                            : isVoiceEnabled
                                                                ? "Type your message or click the microphone for voice input..."
                                                                : "Type your message..."
                                            }
                                            className={`w-full pr-4 transition-all duration-200 border-2 rounded-xl ${isListening
                                                ? 'border-red-300 bg-red-50 shadow-md ring-2 ring-red-100'
                                                : autoSendEnabled && isVoiceEnabled && speechSupported
                                                    ? 'border-blue-300 bg-blue-50 hover:border-blue-400 focus:border-blue-500'
                                                    : isVoiceEnabled && speechSupported
                                                        ? 'border-green-300 bg-green-50 hover:border-green-400 focus:border-green-500'
                                                        : 'border-gray-300 hover:border-gray-400 focus:border-gray-500'
                                                }`}
                                            disabled={isLoading}
                                        />

                                        {/* Status indicators */}
                                        {isListening && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <div className="flex items-center space-x-1">
                                                    <div className={`w-2 h-2 rounded-full animate-pulse ${isSpeechDetected ? 'bg-green-500' : 'bg-red-500'
                                                        }`}></div>
                                                    <span className={`text-xs font-medium ${isSpeechDetected ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {isSpeechDetected ? `${silenceCountdown}s` : 'SPEAK'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Connection status indicator */}
                                        {!isListening && speechSupported && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <div className="flex items-center space-x-1">
                                                    <div className={`w-2 h-2 rounded-full ${autoSendEnabled && isVoiceEnabled ? 'bg-blue-500' :
                                                        isVoiceEnabled ? 'bg-green-500' : 'bg-gray-400'
                                                        }`} />
                                                    {autoSendEnabled && isVoiceEnabled && (
                                                        <Zap className="w-3 h-3 text-blue-500" />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Voice Button */}
                                    {speechSupported && isVoiceEnabled && (
                                        <Button
                                            onClick={toggleVoiceInput}
                                            disabled={isLoading}
                                            className={`transition-all duration-300 min-w-[48px] h-12 rounded-xl ${isListening
                                                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg scale-105'
                                                : autoSendEnabled
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
                                                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg'
                                                }`}
                                            size="icon"
                                            title={
                                                isListening ? "Stop voice input (click to stop recording)" :
                                                    autoSendEnabled ? "Start voice input (auto-send enabled)" :
                                                        "Start voice input (manual mode)"
                                            }
                                        >
                                            {isListening ? (
                                                <MicOff className="h-5 w-5" />
                                            ) : (
                                                <Mic className="h-5 w-5" />
                                            )}
                                            {autoSendEnabled && !isListening && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full">
                                                    <Zap className="h-2 w-2 text-white absolute top-0.5 left-0.5" />
                                                </div>
                                            )}
                                            {!autoSendEnabled && isVoiceEnabled && !isListening && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
                                            )}
                                            {isListening && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse">
                                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                                </div>
                                            )}
                                        </Button>
                                    )}

                                    {/* Send Button */}
                                    <Button
                                        onClick={() => handleSendMessage()}
                                        disabled={!inputMessage.trim() || isLoading}
                                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 min-w-[48px] h-12 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                                        size="icon"
                                        title="Send message"
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Transcript Display */}
                                {transcript && (
                                    <div className={`mt-2 p-3 rounded-lg border transition-all duration-200 ${transcript.includes('Auto-sending') ? 'bg-blue-50 border-blue-200' :
                                        transcript.includes('Error') || transcript.includes('not supported') ? 'bg-red-50 border-red-200' :
                                            transcript.includes('Transcribed') || transcript.includes('Ready') ? 'bg-green-50 border-green-200' :
                                                'bg-gray-50 border-gray-200'
                                        }`}>
                                        <p className="text-sm text-gray-700 font-medium">{transcript}</p>
                                    </div>
                                )}


                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Case Creation Modal */}
            {showCaseModal && (
                <CreateCaseModal
                    onClose={handleCaseModalClose}
                    prefillData={caseModalData}
                />
            )}
        </>
    );
};

export default AILawyerAssistant;