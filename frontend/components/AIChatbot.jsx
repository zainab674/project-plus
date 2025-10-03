'use client'

import React, { useState, useRef, useEffect } from 'react';
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
    HelpCircle,
    FileText,
    Users,
    Calendar,
    DollarSign,
    Briefcase,
    MessageSquare,
    Video,
    Settings,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import geminiService from '@/lib/services/geminiService';
import { miniMarkdownToHtml } from './markdownToHtml';
import { useUser } from '@/providers/UserProvider';

const AIChatbot = () => {
    // User context
    const { user, isAuth } = useUser();

    // Role-based access control - Only show for Provider and Admin
    if (!isAuth || !user || (user.Role !== 'PROVIDER' && user.Role !== 'ADMIN')) {
        return null;
    }
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Website knowledge base for the AI
    const websiteKnowledge = {
        features: {
            caseManagement: {
                description: "Create and manage legal cases with phases, tasks, and team collaboration",
                steps: [
                    "Go to Dashboard → Cases",
                    "Click 'Create New Case' button",
                    "Fill in case details: name, opposing party, client info, status, priority, filing date",
                    "Add team members (optional)",
                    "Define case phases (e.g., Pleadings, Discovery, Trial, Settlement)",
                    "Set budget and description"
                ],
                phases: [
                    "Pleadings - Initial filing and response documents",
                    "Discovery - Evidence gathering and document exchange",
                    "Pre-trial - Motions, hearings, and trial preparation",
                    "Trial - Court proceedings and arguments",
                    "Post-trial - Appeals, enforcement, or settlement"
                ]
            },
            taskManagement: {
                description: "Create and assign tasks to team members with deadlines and priorities",
                steps: [
                    "Navigate to a specific case/project",
                    "Click 'Create Task' or use the task management section",
                    "Fill in task details: name, description, assigned member, priority, due date",
                    "Select the case phase this task belongs to",
                    "Add additional team members if needed"
                ]
            },
            billing: {
                description: "Track time, generate invoices, and manage billing for cases",
                features: [
                    "Time tracking for tasks and activities",
                    "Hourly rate configuration per team member",
                    "Invoice generation and management",
                    "Expense tracking and reimbursement",
                    "Billing status tracking (Draft, Sent, Paid, Overdue)"
                ]
            },
            chat: {
                description: "Real-time communication between team members and clients",
                features: [
                    "Group chat for project teams",
                    "Private messaging between users",
                    "Voice and video calls",
                    "File sharing in conversations",
                    "Message history and search"
                ]
            },
            meetings: {
                description: "Schedule and conduct virtual meetings with clients and team members",
                features: [
                    "Meeting scheduling with calendar integration",
                    "Video conferencing with screen sharing",
                    "Meeting recording and transcription",
                    "Meeting notes and action items",
                    "RSVP functionality for participants"
                ]
            },
            documents: {
                description: "Upload, manage, and share legal documents securely",
                features: [
                    "Document upload and storage",
                    "Document templates and customization",
                    "Digital signature integration",
                    "Document version control",
                    "Secure sharing with clients"
                ]
            },
            clientPortal: {
                description: "Secure client access to case updates and documents",
                features: [
                    "Client dashboard with case overview",
                    "Document access and download",
                    "Case status updates and timeline",
                    "Secure messaging with legal team",
                    "Billing and payment information"
                ]
            }
        },
        navigation: {
            dashboard: "Main dashboard with overview of all cases and activities",
            cases: "View and manage all legal cases",
            projects: "Alternative term for cases - same functionality",
            billing: "Manage billing, invoices, and time tracking",
            chat: "Team communication and messaging",
            meetings: "Schedule and join virtual meetings",
            documents: "Document management and sharing",
            clients: "Client information and portal access",
            team: "Team member management and roles",
            timeline: "Case timeline and progress tracking"
        },
        roles: {
            provider: "Legal professional who creates and manages cases",
            biller: "User responsible for billing and invoicing",
            client: "Client with access to their case information",
            team: "Team member assigned to specific cases"
        }
    };

    // Quick suggestions for common questions
    const quickSuggestions = [
        "How do I create a new case?",
        "What are the phases in a case?",
        "How do I assign tasks to team members?",
        "How does billing work?",
        "How do I schedule a meeting?",
        "How do I upload documents?",
        "How do I invite team members?",
        "What are the different user roles?"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Initialize with welcome message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: 1,
                    type: 'bot',
                    content: `Hello! I'm your AI assistant for FlexyWexy.

What would you like to know about?`,
                    timestamp: new Date()
                }
            ]);
        }
    }, []);

    const generateAIResponse = async (userMessage) => {
        try {
            // Get conversation history for context
            const conversationHistory = messages.filter(msg => msg.type === 'bot' || msg.type === 'user');

            // Use Gemini service to generate response
            const response = await geminiService.generateResponse(userMessage, conversationHistory);

            if (response.success) {
                return {
                    content: response.content,
                    suggestions: null
                };
            } else {
                throw new Error('Failed to generate response');
            }
        } catch (error) {
            console.error('AI Response Error:', error);

            // Fallback to local response generation
            const lowerMessage = userMessage.toLowerCase();

            // Case creation
            if (lowerMessage.includes('create') && (lowerMessage.includes('case') || lowerMessage.includes('project'))) {
                return {
                    content: `**How to Create a New Case:**

1. **Navigate to Cases**: Go to your Dashboard and click on "Cases" in the sidebar

2. **Create New Case**: Click the "Create New Case" button (usually a + icon)

3. **Fill Case Details**:
   • **Case Name**: Enter a descriptive name for your case
   • **Opposing Party**: Name of the opposing party/client
   • **Client Information**: Client name and address
   • **Status**: Choose from Pending, Active, or Settled
   • **Priority**: Set as High, Medium, or Low
   • **Filing Date**: Select the case filing date
   • **Description**: Add detailed case description

4. **Add Team Members** (Optional): Select team members to assign to the case

5. **Define Phases**: Add case phases like Pleadings, Discovery, Trial, etc.

6. **Set Budget**: Enter estimated budget for the case

7. **Save**: Click "Create Case" to save

The case will then appear in your dashboard and you can start adding tasks, documents, and managing the workflow.`,
                    suggestions: null
                };
            }

            // Case phases
            if (lowerMessage.includes('phase') && lowerMessage.includes('case')) {
                return {
                    content: `**Case Phases in FlexyWexy:**

Legal cases typically follow these phases:

1. **Pleadings Phase**
   • Initial complaint filing
   • Defendant's response/answer
   • Counterclaims and replies
   • Motion practice

2. **Discovery Phase**
   • Document requests and production
   • Interrogatories and responses
   • Depositions
   • Expert witness disclosures

3. **Pre-trial Phase**
   • Motion hearings
   • Settlement negotiations
   • Trial preparation
   • Pre-trial conferences

4. **Trial Phase**
   • Jury selection
   • Opening statements
   • Evidence presentation
   • Closing arguments
   • Jury deliberation

5. **Post-trial Phase**
   • Judgment entry
   • Appeals process
   • Enforcement actions
   • Settlement agreements

**To add phases to your case:**
1. Go to your case details
2. Look for the "Phases" section
3. Click "Add Phase" or edit existing phases
4. Each phase can have multiple tasks assigned to team members

Phases help organize your case workflow and track progress systematically.`,
                    suggestions: null
                };
            }

            // Default response
            return {
                content: `I understand you're asking about "${userMessage}". Let me help you with that!

Based on your question, here are some relevant areas I can assist with:

**🔍 Quick Navigation:**
• **Cases**: Create and manage legal cases
• **Tasks**: Assign and track tasks
• **Billing**: Handle invoicing and time tracking
• **Chat**: Team communication
• **Meetings**: Schedule and conduct video calls
• **Documents**: Upload and manage files
• **Team**: Manage team members and roles

If you need more specific help, please provide more details about what you're trying to accomplish!`,
                suggestions: null
            };
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = inputMessage.trim();
        const userMsg = {
            id: Date.now(),
            type: 'user',
            content: userMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputMessage('');
        setIsLoading(true);
        setShowSuggestions(false);

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const aiResponse = await generateAIResponse(userMessage);

            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                content: miniMarkdownToHtml(aiResponse.content),
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            toast.error('Sorry, I encountered an error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setInputMessage(suggestion);
        inputRef.current?.focus();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setIsMinimized(false);
            // Reset suggestions when opening chat
            if (messages.length === 1) {
                setShowSuggestions(true);
            }
        }
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    const clearChat = () => {
        setMessages([
            {
                id: 1,
                type: 'bot',
                content: `Hello! I'm your AI assistant for FlexyWexy. 
What would you like to know about?`,
                timestamp: new Date()
            }
        ]);
        setShowSuggestions(true);
        setInputMessage('');
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <Button
                onClick={toggleChat}
                className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                size="icon"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </Button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-20 right-4 z-40 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                        <div className="flex items-center space-x-2">
                            <Bot className="h-5 w-5" />
                            <div>
                                <h3 className="font-semibold">AI Assistant</h3>
                                <p className="text-xs text-blue-100">FlexyWexy Help</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Button
                                onClick={toggleMinimize}
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-blue-600"
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </Button>
                            <Button
                                onClick={toggleChat}
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-blue-600"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[95%] text-sm rounded-lg p-3 ${message.type === 'user'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-900'
                                                    }`}
                                            >
                                                <div className="flex items-start space-x-2">
                                                    {message.type === 'bot' && (
                                                        <Bot className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                                    )}
                                                    {message.type === 'user' && (
                                                        <User className="h-4 w-4 mt-0.5 text-blue-100 flex-shrink-0" />
                                                    )}
                                                    <div className="flex-2">
                                                        <div
                                                            className="prose prose-sm max-w-none leading-relaxed"
                                                            dangerouslySetInnerHTML={{
                                                                __html: message.content
                                                                    .replace(/\n\n/g, '</p><p>')
                                                                    .replace(/\n/g, '<br>')
                                                                    .replace(/^/, '<p>')
                                                                    .replace(/$/, '</p>')
                                                            }}
                                                        />

                                                    </div>
                                                </div>
                                                <div className="text-xs opacity-70 mt-2">
                                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Quick Suggestions - Show only when chat is first opened and no user questions yet */}
                                    {showSuggestions && messages.length === 1 && (
                                        <div className="flex justify-start">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-[95%]">
                                                <div className="flex items-start space-x-2">
                                                    <HelpCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-blue-900 mb-3">Quick Suggestions</h4>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {quickSuggestions.map((suggestion, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                                    className="text-left text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 p-2 rounded transition-colors"
                                                                >
                                                                    {suggestion}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-100 rounded-lg p-3">
                                                <div className="flex items-center space-x-2">
                                                    <Bot className="h-4 w-4 text-blue-600" />
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>



                            {/* Input Area */}
                            <div className="p-4 border-t border-gray-200">
                                <div className="flex space-x-2">
                                    <Input
                                        ref={inputRef}
                                        id="ai-chatbot-input"
                                        name="ai-chatbot-input"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask me anything about FlexyWexy..."
                                        className="flex-1"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || isLoading}
                                        className="bg-blue-600 hover:bg-blue-700"
                                        size="icon"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-gray-500">
                                        Press Enter to send, Shift+Enter for new line
                                    </p>
                                    <Button
                                        onClick={clearChat}
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        Clear chat
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default AIChatbot;
