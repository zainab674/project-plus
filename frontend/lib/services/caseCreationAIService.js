// AI Case Creation Service
// This service handles the conversation flow for creating legal cases

class CaseCreationAIService {
    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    }

    // Get the legal case creation context
    getCaseCreationContext() {
        return `
        You are a professional legal assistant AI helping lawyers create new cases. 
        Your role is to gather all necessary information through natural conversation.

        CASE CREATION REQUIREMENTS:
        - Case Name (required)
        - Opposing Party (required)
        - Client Name (required)
        - Client Address (required)
        - Case Status (Pending/Active/Settled)
        - Priority (High/Medium/Low)
        - Filing Date
        - Description (required)
        - Budget (optional)
        - Case Phases (optional)
        - Team Members (optional but recommended)

        CONVERSATION STYLE:
        - Be professional but friendly
        - Ask one question at a time
        - Confirm information before moving to next question
        - Provide helpful suggestions when appropriate
        - Be concise but thorough
        - After gathering basic case info, ask about team members naturally
        - Suggest team collaboration for complex cases

        RESPONSE FORMAT:
        IMPORTANT: Respond ONLY with valid JSON. Do NOT include markdown formatting, code blocks, or any other text.
        
        Use this exact JSON structure:
        {
            "message": "Your conversational message",
            "nextQuestion": "What to ask next",
            "gatheredInfo": {
                "caseName": "value or null",
                "opposingParty": "value or null",
                "clientName": "value or null",
                "clientAddress": "value or null",
                "status": "value or null",
                "priority": "value or null",
                "filingDate": "value or null",
                "description": "value or null",
                "budget": "value or null",
                "phases": ["phase1", "phase2"] or null,
                "teamMembers": ["member1", "member2"] or null
            },
            "isComplete": false,
            "missingFields": ["field1", "field2"],
            "suggestions": ["suggestion1", "suggestion2"]
        }
        
        CRITICAL: Start your response with { and end with }. No other characters before or after the JSON.

        LEGAL CASE TYPES AND PHASES:
        Common case types: Contract Dispute, Personal Injury, Criminal Defense, Family Law, Employment, Real Estate
        Common phases: Initial Consultation, Pleadings, Discovery, Pre-trial, Trial, Settlement, Appeals

        TEAM MEMBER ASSIGNMENT:
        - Ask about team members after gathering basic case information
        - Allow users to say "just me" or "myself" if they want to handle alone
        - Accept multiple names separated by commas or spaces
        - Suggest adding team members for complex cases
        - Team members are optional but recommended for better case management
        - Examples: "John and Sarah", "Just me", "Add the litigation team", "Skip for now"

        PRIORITY LEVELS:
        - High: Urgent matters, court deadlines, client emergencies
        - Medium: Standard cases with normal timelines
        - Low: Non-urgent matters, long-term planning

        STATUS EXPLANATIONS:
        - Pending: Case not yet filed or in initial stages
        - Active: Case is actively being worked on
        - Settled: Case has been resolved or settled
        `;
    }

    async processConversation(userMessage, conversationHistory = [], currentCaseData = {}) {
        try {
            if (!this.apiKey) {
                throw new Error('Gemini API key not configured');
            }

            // Prepare the conversation context
            const context = this.getCaseCreationContext();
            
            // Format conversation history for context
            const formattedHistory = conversationHistory.map(msg => ({
                role: msg.type === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

            // Create the request payload
            const requestBody = {
                contents: [
                    {
                        parts: [{
                            text: `${context}

Current Case Data: ${JSON.stringify(currentCaseData)}

Conversation History: ${JSON.stringify(formattedHistory)}

User Message: ${userMessage}

Please respond with the exact JSON format specified above. Be conversational but gather all required information systematically.

REMEMBER: Respond ONLY with valid JSON, no markdown, no code blocks, no extra text.`
                        }]
                    }
                ],
                generationConfig: {
                    temperature: 0.3, // Lower temperature for more consistent JSON output
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            };

            // Make the API request
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': this.apiKey
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const responseText = data.candidates[0].content.parts[0].text;
                
                try {
                    // Extract JSON from the response text
                    const jsonResponse = this.extractJSONFromResponse(responseText);
                    
                    if (jsonResponse) {
                        const parsedResponse = JSON.parse(jsonResponse);
                        return {
                            success: true,
                            data: parsedResponse
                        };
                    } else {
                        throw new Error('No valid JSON found in response');
                    }
                } catch (parseError) {
                    // If JSON parsing fails, return a fallback response
                    console.error('Failed to parse AI response as JSON:', parseError);
                    console.error('Raw response:', responseText);
                    return this.generateFallbackResponse(userMessage, currentCaseData);
                }
            } else {
                throw new Error('Invalid response format from Gemini API');
            }

        } catch (error) {
            console.error('Case Creation AI Error:', error);
            return this.generateFallbackResponse(userMessage, currentCaseData);
        }
    }

    generateFallbackResponse(userMessage, currentCaseData) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Simple fallback logic for case creation flow
        if (lowerMessage.includes('create') || lowerMessage.includes('new') || lowerMessage.includes('case')) {
            return {
                success: true,
                data: {
                    message: "I'll help you create a new case! Let's start with the basics. What's the name of this case?",
                    nextQuestion: "What's the case name?",
                    gatheredInfo: currentCaseData,
                    isComplete: false,
                    missingFields: ["caseName", "opposingParty", "clientName", "clientAddress", "description", "teamMembers"],
                    suggestions: ["Contract dispute", "Personal injury", "Criminal defense", "Family law"]
                }
            };
        }

        // Handle case name input
        if (!currentCaseData.caseName && (lowerMessage.includes('name') || lowerMessage.length > 3)) {
            return {
                success: true,
                data: {
                    message: `Great! The case name is "${userMessage}". Now who is the opposing party in this case?`,
                    nextQuestion: "Who is the opposing party?",
                    gatheredInfo: { ...currentCaseData, caseName: userMessage },
                    isComplete: false,
                    missingFields: ["opposingParty", "clientName", "clientAddress", "description", "teamMembers"],
                    suggestions: []
                }
            };
        }

        // Handle opposing party input
        if (currentCaseData.caseName && !currentCaseData.opposingParty && lowerMessage.length > 2) {
            return {
                success: true,
                data: {
                    message: `Perfect! The opposing party is "${userMessage}". Now who is your client?`,
                    nextQuestion: "Who is your client?",
                    gatheredInfo: { ...currentCaseData, opposingParty: userMessage },
                    isComplete: false,
                    missingFields: ["clientName", "clientAddress", "description", "teamMembers"],
                    suggestions: []
                }
            };
        }

        // Handle client name input
        if (currentCaseData.caseName && currentCaseData.opposingParty && !currentCaseData.clientName && lowerMessage.length > 2) {
            return {
                success: true,
                data: {
                    message: `Excellent! Your client is "${userMessage}". What's the client's address?`,
                    nextQuestion: "What's the client's address?",
                    gatheredInfo: { ...currentCaseData, clientName: userMessage },
                    isComplete: false,
                    missingFields: ["clientAddress", "description", "teamMembers"],
                    suggestions: []
                }
            };
        }

        // Handle client address input
        if (currentCaseData.caseName && currentCaseData.opposingParty && currentCaseData.clientName && !currentCaseData.clientAddress && lowerMessage.length > 5) {
            return {
                success: true,
                data: {
                    message: `Great! The client address is "${userMessage}". Finally, can you describe what type of case this is?`,
                    nextQuestion: "What type of case is this?",
                    gatheredInfo: { ...currentCaseData, clientAddress: userMessage },
                    isComplete: false,
                    missingFields: ["description", "teamMembers"],
                    suggestions: ["Contract dispute", "Personal injury", "Criminal defense", "Family law", "Employment", "Real estate"]
                }
            };
        }

        // Handle case description input
        if (currentCaseData.caseName && currentCaseData.opposingParty && currentCaseData.clientName && currentCaseData.clientAddress && !currentCaseData.description && lowerMessage.length > 5) {
            const completeCaseData = { ...currentCaseData, description: userMessage };
            
            // Determine if this is a complex case that might benefit from team collaboration
            const complexCaseKeywords = ['complex', 'multiple', 'large', 'corporate', 'business', 'litigation', 'trial', 'appeal'];
            const isComplexCase = complexCaseKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
            
            let teamMessage = "Now, which team members would you like to assign to this case?";
            if (isComplexCase) {
                teamMessage = "This sounds like a complex case that might benefit from team collaboration. Which team members would you like to assign?";
            }
            
            return {
                success: true,
                data: {
                    message: `Excellent! The case description is "${userMessage}". ${teamMessage} You can mention their names or say "just me" if you want to handle it alone.`,
                    nextQuestion: "Which team members should be assigned?",
                    gatheredInfo: completeCaseData,
                    isComplete: false,
                    missingFields: ["teamMembers"],
                    suggestions: ["Just me", "Add team members", "Skip for now"]
                }
            };
        }

        // Handle team members input
        if (currentCaseData.caseName && currentCaseData.opposingParty && currentCaseData.clientName && currentCaseData.clientAddress && currentCaseData.description && !currentCaseData.teamMembers) {
            let teamMembers = [];
            let message = "";
            
            if (lowerMessage.includes('just me') || lowerMessage.includes('alone') || lowerMessage.includes('myself') || lowerMessage.includes('solo')) {
                teamMembers = [];
                message = "Perfect! You'll handle this case yourself. I have all the information I need to create your case.";
            } else if (lowerMessage.includes('skip') || lowerMessage.includes('later') || lowerMessage.includes('not now')) {
                teamMembers = [];
                message = "No problem! We can add team members later. I have all the information I need to create your case.";
            } else if (lowerMessage.includes('team') || lowerMessage.includes('everyone') || lowerMessage.includes('all')) {
                teamMembers = ["Full team"];
                message = "Great! I've noted that you want to assign the full team to this case. I have all the information I need to create your case.";
            } else {
                // Extract names from the message - handle various formats
                let names = [];
                
                // Handle "John and Sarah" format
                if (lowerMessage.includes(' and ')) {
                    names = userMessage.split(/ and /i).map(name => name.trim()).filter(name => name.length > 2);
                }
                // Handle "John, Sarah, Mike" format
                else if (lowerMessage.includes(',')) {
                    names = userMessage.split(',').map(name => name.trim()).filter(name => name.length > 2);
                }
                // Handle space-separated names
                else {
                    names = userMessage.split(/\s+/).filter(name => name.length > 2);
                }
                
                // Filter out common words that aren't names
                const commonWords = ['add', 'include', 'assign', 'team', 'members', 'people', 'staff', 'lawyers', 'attorneys'];
                names = names.filter(name => !commonWords.includes(name.toLowerCase()));
                
                if (names.length > 0) {
                    teamMembers = names;
                    message = `Great! I've noted the team members: ${names.join(', ')}. I have all the information I need to create your case.`;
                } else {
                    teamMembers = [];
                    message = "I understand you want to add team members, but I couldn't identify specific names. I have all the information I need to create your case, and you can add team members later in the form.";
                }
            }
            
            const completeCaseData = { ...currentCaseData, teamMembers };
            return {
                success: true,
                data: {
                    message: message + " Let me open the case creation form for you to review and submit.",
                    nextQuestion: "Review the form and submit when ready",
                    gatheredInfo: completeCaseData,
                    isComplete: true,
                    missingFields: [],
                    suggestions: ["Review and submit case", "Make changes", "Start over"]
                }
            };
        }

        // Default response
        return {
            success: true,
                data: {
                    message: "I understand you're working on case creation. Let me help you gather the necessary information. What would you like to tell me about this case?",
                    nextQuestion: "What case details can you provide?",
                    gatheredInfo: currentCaseData,
                    isComplete: false,
                    missingFields: this.getMissingFields(currentCaseData),
                    suggestions: ["Start with case name", "Tell me about the client", "What type of case is this?", "Add team members"]
                }
            };
    }

    // Check if all required fields are filled
    isCaseComplete(caseData) {
        const requiredFields = ['caseName', 'opposingParty', 'clientName', 'clientAddress', 'description'];
        const hasRequiredFields = requiredFields.every(field => caseData[field] && caseData[field].trim() !== '');
        
        // Team members are optional but recommended
        const hasTeamMembers = caseData.teamMembers && caseData.teamMembers.length > 0;
        
        return hasRequiredFields;
    }

    // Get missing required fields
    getMissingFields(caseData) {
        const requiredFields = ['caseName', 'opposingParty', 'clientName', 'clientAddress', 'description'];
        const missingRequired = requiredFields.filter(field => !caseData[field] || caseData[field].trim() === '');
        
        // Add team members as a recommended field if not present
        if (!caseData.teamMembers || caseData.teamMembers.length === 0) {
            missingRequired.push('teamMembers');
        }
        
        return missingRequired;
    }

    // Format case data for the creation modal
    formatCaseDataForModal(caseData) {
        return {
            name: caseData.caseName || '',
            opposing: caseData.opposingParty || '',
            client_name: caseData.clientName || '',
            client_address: caseData.clientAddress || '',
            status: caseData.status || 'Pending',
            budget: caseData.budget || 0,
            priority: caseData.priority || 'Medium',
            filingDate: caseData.filingDate || new Date().toISOString(),
            description: caseData.description || '',
            phases: caseData.phases || [],
            teamMembers: caseData.teamMembers || []
        };
    }

    // Extract JSON from AI response text
    extractJSONFromResponse(responseText) {
        if (!responseText) return null;
        
        let text = responseText.trim();
        
        // Remove markdown code blocks
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
        
        // Try to find JSON object boundaries
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
            
            // Validate that it looks like JSON
            if (jsonCandidate.includes('"') && jsonCandidate.includes(':')) {
                return jsonCandidate;
            }
        }
        
        // If no JSON found, try to parse the entire text
        if (text.startsWith('{') && text.endsWith('}')) {
            return text;
        }
        
        return null;
    }
}

// Create and export a singleton instance
const caseCreationAIService = new CaseCreationAIService();
export default caseCreationAIService;
