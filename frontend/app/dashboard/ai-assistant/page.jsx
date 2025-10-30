'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/providers/UserProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  User,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Zap,
  Maximize2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import caseCreationAIService from '@/lib/services/caseCreationAIService';
import CreateCaseModal from '@/components/cases/createCaseModal';
import Loader from '@/components/Loader';

const AIAssistantPage = () => {
  const router = useRouter();
  const { user, isAuth } = useUser();

  // Main component states
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Enhanced voice-related states
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

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const speechRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Redirect if user is not Provider, Team, or Admin
    if (isAuth && user && user.Role !== 'PROVIDER' && user.Role !== 'ADMIN' && user.Role !== 'TEAM') {
      router.push('/dashboard');
    }
  }, [user, isAuth, router]);

  // Check for Speech Recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
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
      setTranscript("Speech recognition not supported in this browser.");
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
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

        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
        }

        silenceTimeout = setTimeout(() => {
          recognition.stop();
        }, 3000);

        let countdown = 3;
        const countdownInterval = setInterval(() => {
          countdown--;
          setSilenceCountdown(countdown);
          if (countdown <= 0) {
            clearInterval(countdownInterval);
          }
        }, 1000);
        setTimeout(() => clearInterval(countdownInterval), 5000);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setIsSpeechDetected(false);
      setTranscript("Speech recognition error. Please try again.");
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

        if (autoSendEnabled && finalText.length > 2) {
          setTranscript(`Auto-sending: "${finalText}"`);
          setTimeout(() => {
            handleSendMessage(finalText);
          }, 1000);
        } else {
          setTranscript(`Ready to send: "${finalText}"`);
        }
      } else {
        setTranscript("No speech detected. Please try again.");
      }
    };

    return recognition;
  };

  // Start listening
  const startListening = async () => {
    try {
      setRecordedText('');
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          if (permission.state === 'denied') {
            setTranscript("Microphone permission denied.");
            setIsVoiceEnabled(false);
            return;
          }
        } catch (permError) {}
      }

      const recognition = initializeSpeechRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setTranscript("Error starting speech recognition.");
      setIsListening(false);
      setIsVoiceEnabled(false);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsSpeechDetected(false);
    setSilenceCountdown(5);
  };

  // Text-to-speech
  const speakMessage = useCallback((text) => {
    if (!isVoiceEnabled || !speechRef.current || !text?.trim()) return;

    try {
      speechRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = speechRef.current.getVoices();
      let selectedVoice = voices.find(voice =>
        voice.lang.startsWith('en') && (
          voice.name.includes('Google') ||
          voice.name.includes('Natural') ||
          voice.name.includes('Premium')
        )
      );

      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      setIsSpeaking(true);

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechRef.current.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
    }
  }, [isVoiceEnabled]);

  // Toggle voice input
  const toggleVoiceInput = async () => {
    if (!speechSupported || !isVoiceEnabled) {
      setTranscript("Voice features not available.");
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Toggle auto-send
  const toggleAutoSend = () => {
    setAutoSendEnabled(!autoSendEnabled);
  };

  // Toggle voice output
  const toggleVoiceOutput = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (speechRef.current) {
      speechRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Understand user intent with Gemini
  const understandUserIntent = async (userMessage, conversationHistory) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `You are an AI legal assistant. Analyze the user's message and return JSON:
{
    "intent": "case_creation" | "list_cases" | "general_help" | "other",
    "confidence": 0.0-1.0,
    "extracted_info": {
        "case_name": "extracted case name if mentioned",
        "description": "brief description",
        "priority": "high/medium/low if mentioned",
        "status": "pending/active/closed if mentioned"
    },
    "reasoning": "brief explanation",
    "suggestions": ["array of suggestions"]
}

CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}

USER MESSAGE: "${userMessage}"

Return only valid JSON:`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
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

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error understanding user intent:', error);
      return {
        intent: 'general_help',
        confidence: 0.5,
        extracted_info: {},
        reasoning: 'Fallback due to error',
        suggestions: ['Try rephrasing your request']
      };
    }
  };

  // Process AI conversation
  const processAIConversation = async (userMessage) => {
    try {
      if (!isAuth || !user) {
        return {
          content: "You need to be logged in to use the AI assistant.",
          suggestions: ["Log in", "Refresh page"]
        };
      }

      const conversationHistory = messages.filter(msg => msg.type === 'bot' || msg.type === 'user');
      const intentData = await understandUserIntent(userMessage, conversationHistory);
      const intent = intentData.intent;
      const extractedInfo = intentData.extracted_info;

      if (intent === 'list_cases') {
        return {
          content: "I can help you create new legal cases. Would you like to start a new case?",
          suggestions: ["Create a case"]
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
        content: `I apologize, but I encountered an error processing your request. Please try again.\n\nError details: ${error.message}`,
        suggestions: ["Try again", "Start over"]
      };
    }
  };

  // Send message
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

  // Handle key press
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

  // Handle case modal close
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
      speakMessage("Great! Your case has been created successfully.");
    }
  };

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        id: 1,
        type: 'bot',
        content: `Hello! I'm your AI legal assistant with voice features.

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
          speakMessage("Hello! I'm your AI legal assistant. How can I help you today?");
        }
      }, 500);
    }
  }, [messages.length, isVoiceEnabled, speakMessage, speechSupported]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Show loading if not authenticated
  if (!isAuth || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Show access denied
  if (user.Role !== 'PROVIDER' && user.Role !== 'ADMIN' && user.Role !== 'TEAM') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the AI Legal Assistant.</p>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Get status text for header
  const getStatusText = () => {
    if (!speechSupported) {
      return "Voice not supported - Text only";
    } else if (isListening) {
      return isSpeechDetected 
        ? `Recording... Auto-stop in ${silenceCountdown}s`
        : "Listening... Speak now!";
    } else if (isSpeaking) {
      return "Speaking Response";
    } else if (isVoiceEnabled) {
      return `Voice Ready${autoSendEnabled ? ' • Auto-Send ON' : ' • Manual Mode'}`;
    } else {
      return "Voice Disabled";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Green Header */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Bot className="h-6 w-6" />
          <div>
            <h1 className="text-xl font-bold">AI Legal Assistant</h1>
            <p className="text-sm text-green-100">{getStatusText()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Auto-Send Indicator */}
          {autoSendEnabled && speechSupported && (
            <div className="flex items-center space-x-1 bg-blue-500/20 rounded-full px-3 py-1">
              <Zap className="w-4 h-4 text-blue-200" />
              <span className="text-sm font-medium text-blue-200">AUTO</span>
            </div>
          )}

          {/* Auto-Send Toggle */}
          {speechSupported && (
            <Button
              onClick={toggleAutoSend}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              title={autoSendEnabled ? "Disable auto-send" : "Enable auto-send"}
            >
              <Zap className="h-4 w-4" />
            </Button>
          )}

          {/* Voice Output Toggle */}
          <Button
            onClick={toggleVoiceOutput}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            title={isVoiceEnabled ? "Disable voice output" : "Enable voice output"}
          >
            {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-white">
        <div className="p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] text-sm rounded-2xl p-4 shadow-sm ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                    : 'bg-gray-50 border border-gray-200 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {message.type === 'bot' && (
                    <Bot className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                  )}
                  {message.type === 'user' && (
                    <User className="h-5 w-5 text-green-100 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-green-100' : 'text-gray-500'}`}>
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
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 shadow-sm">
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

      {/* Input Bar - Fixed at bottom */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
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
              className={`w-full rounded-xl transition-all duration-200 ${
                isListening
                  ? 'border-red-300 bg-red-50'
                  : autoSendEnabled && isVoiceEnabled && speechSupported
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {autoSendEnabled && isVoiceEnabled && speechSupported && !isListening && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Zap className="w-4 h-4 text-blue-500" />
              </div>
            )}
          </div>

          {/* Voice Button */}
          {speechSupported && isVoiceEnabled && (
            <Button
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={`min-w-[48px] h-12 rounded-xl ${
                isListening
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  : autoSendEnabled
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
              }`}
              size="icon"
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}

          {/* Send Button */}
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 min-w-[48px] h-12 rounded-xl disabled:opacity-50"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className={`mt-2 p-2 rounded-lg text-sm ${
            transcript.includes('Auto-sending') ? 'bg-blue-50 text-blue-700' :
            transcript.includes('Error') ? 'bg-red-50 text-red-700' :
            transcript.includes('Transcribed') || transcript.includes('Ready') ? 'bg-green-50 text-green-700' :
            'bg-gray-50 text-gray-700'
          }`}>
            {transcript}
          </div>
        )}
      </div>

      {/* Case Creation Modal */}
      {showCaseModal && (
        <CreateCaseModal
          onClose={handleCaseModalClose}
          prefillData={caseModalData}
        />
      )}
    </div>
  );
};

export default AIAssistantPage;
