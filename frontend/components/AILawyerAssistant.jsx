

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
import openaiService from '@/lib/services/geminiService';
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
            
            // Test if we can create a recognition instance
            try {
                const testRecognition = new SpeechRecognition();
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

    // Use OpenAI to understand user intent
    const understandUserIntent = async (userMessage, conversationHistory) => {
        try {
            const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
            if (!apiKey) {
                throw new Error('OpenAI API key not configured');
            }

            const systemPrompt = `You are an AI legal assistant that helps users with legal case management. 

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

IMPORTANT: Be intelligent about context. If someone says "I want to start a new case", that's "case_creation". If they say "show me my cases", that's "list_cases". If they mention creating a case, managing cases, or starting legal proceedings, route to case_creation.

Return only valid JSON:`;

            const userPrompt = `CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}

USER MESSAGE: "${userMessage}"`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API request failed: ${response.status}`);
            }

            const data = await response.json();
            const openaiResponse = data.choices?.[0]?.message?.content || '';

            const jsonMatch = openaiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid response format from OpenAI');
            }

            const intentData = JSON.parse(jsonMatch[0]);

            return intentData;
        } catch (error) {
            console.error('Error understanding user intent with OpenAI:', error);
            return {
                intent: 'general_help',
                confidence: 0.5,
                extracted_info: {},
                reasoning: 'Fallback due to OpenAI error',
                suggestions: ['Try rephrasing your request', 'Use text input instead']
            };
        }
    };

    // Process AI conversation
    const processAIConversation = async (userMessage) => {
        try {
            if (!isAuth || !user) {
                return {
                    content: "You need to be logged in to use the AI assistant. Please log in first.",
                    suggestions: ["Log in", "Refresh page"]
                };
            }

            const conversationHistory = messages.filter(msg => msg.type === 'bot' || msg.type === 'user');

            const intentData = await understandUserIntent(userMessage, conversationHistory);

            

            const intent = intentData.intent;
            const extractedInfo = intentData.extracted_info;

           

            if (intent === 'list_cases') {
                const result = await listUserCases();
                return {
                    content: result.message,
                    suggestions: result.suggestions || []
                };
            } else if (intent === 'case_creation') {
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
            const aiResponse = await processAIConversation(userMessage);

            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                content: aiResponse.content,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);

            if (isVoiceEnabled && !isSpeaking && aiResponse.content?.trim()) {
                speakMessage(aiResponse.content);
            }

            if (aiResponse.suggestions) {
                setShowSuggestions(true);
            }

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
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };



    const clearCaseContext = () => {
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