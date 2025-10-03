// AI Task Creation Service
// This service handles the conversation flow for creating legal tasks

class TaskCreationAIService {
    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    }

    // Get the legal task creation context
    getTaskCreationContext() {
        return `
        You are a professional legal assistant AI helping lawyers create new tasks. 
        Your role is to gather all necessary information through natural conversation.

        TASK CREATION REQUIREMENTS:
        - Project/Case Selection (required) - Choose existing case or create new one
        - Task Name (required)
        - Description (required)
        - Priority (CRITICAL/HIGH/MEDIUM/LOW/NONE)
        - Due Date (required)
        - Task Leader/Assigned To (required)
        - Team Members (optional but recommended)
        - Status (TO_DO/IN_PROGRESS/STUCK/DONE)
        - Phase (if project has phases)

        CONVERSATION STYLE:
        - Be professional but friendly
        - Ask one question at a time
        - Confirm information before moving to next question
        - Provide helpful suggestions when appropriate
        - Be concise but thorough
        - After gathering basic task info, ask about team members naturally
        - Suggest team collaboration for complex tasks

        RESPONSE FORMAT:
        IMPORTANT: Respond ONLY with valid JSON. Do NOT include markdown formatting, code blocks, or any other text.
        
        Use this exact JSON structure:
        {
            "message": "Your conversational message",
            "nextQuestion": "What to ask next",
            "gatheredInfo": {
                "projectId": "value or null",
                "projectName": "value or null",
                "taskName": "value or null",
                "description": "value or null",
                "priority": "value or null",
                "dueDate": "value or null",
                "assignedTo": "value or null",
                "teamMembers": ["member1", "member2"] or null,
                "status": "value or null",
                "phase": "value or null"
            },
            "isComplete": false,
            "missingFields": ["field1", "field2"],
            "suggestions": ["suggestion1", "suggestion2"]
        }
        
        CRITICAL: Start your response with { and end with }. No other characters before or after the JSON.

        TASK PRIORITY LEVELS:
        - CRITICAL: Urgent matters, immediate deadlines, client emergencies
        - HIGH: Important tasks with short timelines
        - MEDIUM: Standard tasks with normal timelines
        - LOW: Non-urgent tasks, long-term planning
        - NONE: Very low priority, can be done anytime

        TASK STATUS EXPLANATIONS:
        - TO_DO: Task not yet started
        - IN_PROGRESS: Task is actively being worked on
        - STUCK: Task is blocked or needs assistance
        - DONE: Task has been completed

        TEAM MEMBER ASSIGNMENT:
        - Ask about team members after gathering basic task information
        - Allow users to say "just me" or "myself" if they want to handle alone
        - Accept multiple names separated by commas or spaces
        - Suggest adding team members for complex tasks
        - Team members are optional but recommended for better task management
        - Examples: "John and Sarah", "Just me", "Add the litigation team", "Skip for now"

        TASK TYPES AND EXAMPLES:
        Common task types: Document Review, Client Meeting, Court Filing, Research, Contract Drafting, Discovery, Settlement Negotiation
        Common phases: Initial Review, Research, Drafting, Review, Finalization, Filing
        `;
    }

    async processConversation(userMessage, conversationHistory = [], currentTaskData = {}) {
        try {
            if (!this.apiKey) {
                throw new Error('Gemini API key not configured');
            }

            // Prepare the conversation context
            const context = this.getTaskCreationContext();

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

Current Task Data: ${JSON.stringify(currentTaskData)}

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
                    return this.generateFallbackResponse(userMessage, currentTaskData);
                }
            } else {
                throw new Error('Invalid response format from Gemini API');
            }

        } catch (error) {
            console.error('Task Creation AI Error:', error);
            return this.generateFallbackResponse(userMessage, currentTaskData);
        }
    }

    generateFallbackResponse(userMessage, currentTaskData) {
        const lowerMessage = userMessage.toLowerCase();

        // Check if user is mentioning a specific case/project name
        if (!currentTaskData.projectId && !currentTaskData.projectName) {
            // Look for patterns like "add task to [case name]" or "task for [case name]"
            const casePatterns = [
                /add task to (.+)/i,
                /task for (.+)/i,
                /task in (.+)/i,
                /add to (.+)/i,
                /for case (.+)/i
            ];

            for (const pattern of casePatterns) {
                const match = userMessage.match(pattern);
                if (match && match[1]) {
                    const caseName = match[1].trim();
                    // Remove common words that aren't part of the case name
                    const cleanCaseName = caseName.replace(/\b(case|project|file|matter)\b/gi, '').trim();

                    if (cleanCaseName.length > 2) {
                        return {
                            success: true,
                            data: {
                                message: `I see you want to add a task to the "${cleanCaseName}" case. What's the name of this task?`,
                                nextQuestion: "What's the task name?",
                                gatheredInfo: { ...currentTaskData, projectName: cleanCaseName },
                                isComplete: false,
                                missingFields: ["projectId", "taskName", "description", "priority", "dueDate", "assignedTo", "teamMembers"],
                                suggestions: ["Document review", "Client meeting", "Court filing", "Research task"]
                            }
                        };
                    }
                }
            }
        }

        // Simple fallback logic for task creation flow
        if (lowerMessage.includes('create') || lowerMessage.includes('new') || lowerMessage.includes('task')) {
            // Check if we already have project context
            if (currentTaskData.projectId && currentTaskData.projectName) {
                return {
                    success: true,
                    data: {
                        message: `Great! I see you want to create a task for the "${currentTaskData.projectName}" case. What's the name of this task?`,
                        nextQuestion: "What's the task name?",
                        gatheredInfo: currentTaskData,
                        isComplete: false,
                        missingFields: ["taskName", "description", "priority", "dueDate", "assignedTo", "teamMembers"],
                        suggestions: ["Document review", "Client meeting", "Court filing", "Research task"]
                    }
                };
            } else {
                return {
                    success: true,
                    data: {
                        message: "I'll help you create a new task! First, I need to know which case/project this task belongs to. Do you want to add a task to an existing case, or should I create a new case for you?",
                        nextQuestion: "Which case should this task belong to?",
                        gatheredInfo: currentTaskData,
                        isComplete: false,
                        missingFields: ["projectId", "projectName", "taskName", "description", "priority", "dueDate", "assignedTo", "teamMembers"],
                        suggestions: ["Add to existing case", "Create new case", "List my cases"]
                    }
                };
            }
        }

        // Handle task name input
        if (!currentTaskData.taskName && (lowerMessage.length > 3)) {
            // Check if this looks like a task name (not a command)
            if (!lowerMessage.includes('create') && !lowerMessage.includes('new') && !lowerMessage.includes('task') && !lowerMessage.includes('add')) {
                return {
                    success: true,
                    data: {
                        message: `Great! The task name is "${userMessage}". Now can you describe what this task involves?`,
                        nextQuestion: "What's the task description?",
                        gatheredInfo: { ...currentTaskData, taskName: userMessage },
                        isComplete: false,
                        missingFields: ["description", "priority", "dueDate", "assignedTo", "teamMembers"],
                        suggestions: []
                    }
                };
            }
        }

        // Handle case where user has project context but is providing task details
        if (currentTaskData.projectName && !currentTaskData.taskName && (lowerMessage.length > 3)) {
            // Check if this looks like a task name (not a command)
            if (!lowerMessage.includes('create') && !lowerMessage.includes('new') && !lowerMessage.includes('task') && !lowerMessage.includes('add') && !lowerMessage.includes('case')) {
                return {
                    success: true,
                    data: {
                        message: `Perfect! I'll create a task called "${userMessage}" for the "${currentTaskData.projectName}" case. Now can you describe what this task involves?`,
                        nextQuestion: "What's the task description?",
                        gatheredInfo: { ...currentTaskData, taskName: userMessage },
                        isComplete: false,
                        missingFields: ["description", "priority", "dueDate", "assignedTo", "teamMembers"],
                        suggestions: []
                    }
                };
            }
        }

        // Handle task description input
        if (currentTaskData.taskName && !currentTaskData.description && lowerMessage.length > 5) {
            return {
                success: true,
                data: {
                    message: `Excellent! The task description is "${userMessage}". What's the priority level for this task?`,
                    nextQuestion: "What's the priority level?",
                    gatheredInfo: { ...currentTaskData, description: userMessage },
                    isComplete: false,
                    missingFields: ["priority", "dueDate", "assignedTo", "teamMembers"],
                    suggestions: ["Critical", "High", "Medium", "Low", "None"]
                }
            };
        }

        // Handle task description input when user has project context
        if (currentTaskData.projectName && currentTaskData.taskName && !currentTaskData.description && lowerMessage.length > 5) {
            return {
                success: true,
                data: {
                    message: `Perfect! The task description is "${userMessage}". What's the priority level for this task?`,
                    nextQuestion: "What's the priority level?",
                    gatheredInfo: { ...currentTaskData, description: userMessage },
                    isComplete: false,
                    missingFields: ["priority", "dueDate", "assignedTo", "teamMembers"],
                    suggestions: ["Critical", "High", "Medium", "Low", "None"]
                }
            };
        }

        // Handle priority input
        if (currentTaskData.taskName && currentTaskData.description && !currentTaskData.priority && lowerMessage.length > 2) {
            let priority = "MEDIUM";
            if (lowerMessage.includes('critical') || lowerMessage.includes('urgent')) {
                priority = "CRITICAL";
            } else if (lowerMessage.includes('high')) {
                priority = "HIGH";
            } else if (lowerMessage.includes('low')) {
                priority = "LOW";
            } else if (lowerMessage.includes('none') || lowerMessage.includes('very low')) {
                priority = "NONE";
            }

            return {
                success: true,
                data: {
                    message: `Perfect! The priority is set to ${priority}. When is this task due?`,
                    nextQuestion: "What's the due date?",
                    gatheredInfo: { ...currentTaskData, priority },
                    isComplete: false,
                    missingFields: ["dueDate", "assignedTo", "teamMembers"],
                    suggestions: ["Today", "Tomorrow", "This week", "Next week", "Specific date"]
                }
            };
        }

        // Handle priority input when user has project context
        if (currentTaskData.projectName && currentTaskData.taskName && currentTaskData.description && !currentTaskData.priority && lowerMessage.length > 2) {
            let priority = "MEDIUM";
            if (lowerMessage.includes('critical') || lowerMessage.includes('urgent')) {
                priority = "CRITICAL";
            } else if (lowerMessage.includes('high')) {
                priority = "HIGH";
            } else if (lowerMessage.includes('low')) {
                priority = "LOW";
            } else if (lowerMessage.includes('none') || lowerMessage.includes('very low')) {
                priority = "NONE";
            }

            return {
                success: true,
                data: {
                    message: `Great! The priority is set to ${priority}. When is this task due?`,
                    nextQuestion: "What's the due date?",
                    gatheredInfo: { ...currentTaskData, priority },
                    isComplete: false,
                    missingFields: ["dueDate", "assignedTo", "teamMembers"],
                    suggestions: ["Today", "Tomorrow", "This week", "Next week", "Specific date"]
                }
            };
        }

        // Handle due date input
        if (currentTaskData.taskName && currentTaskData.description && currentTaskData.priority && !currentTaskData.dueDate && lowerMessage.length > 2) {
            return {
                success: true,
                data: {
                    message: `Great! The due date is "${userMessage}". Now, who should be assigned as the task leader?`,
                    nextQuestion: "Who should lead this task?",
                    gatheredInfo: { ...currentTaskData, dueDate: userMessage },
                    isComplete: false,
                    missingFields: ["assignedTo", "teamMembers"],
                    suggestions: []
                }
            };
        }

        // Handle due date input when user has project context
        if (currentTaskData.projectName && currentTaskData.taskName && currentTaskData.description && currentTaskData.priority && !currentTaskData.dueDate && lowerMessage.length > 2) {
            return {
                success: true,
                data: {
                    message: `Perfect! The due date is "${userMessage}". Now, who should be assigned as the task leader?`,
                    nextQuestion: "Who should lead this task?",
                    gatheredInfo: { ...currentTaskData, dueDate: userMessage },
                    isComplete: false,
                    missingFields: ["assignedTo", "teamMembers"],
                    suggestions: []
                }
            };
        }

        // Handle assigned to input
        if (currentTaskData.taskName && currentTaskData.description && currentTaskData.priority && currentTaskData.dueDate && !currentTaskData.assignedTo && lowerMessage.length > 2) {
            return {
                success: true,
                data: {
                    message: `Perfect! ${userMessage} will be the task leader. Now, which team members should be assigned to this task? You can mention their names or say "just me" if you want to handle it alone.`,
                    nextQuestion: "Which team members should be assigned?",
                    gatheredInfo: { ...currentTaskData, assignedTo: userMessage },
                    isComplete: false,
                    missingFields: ["teamMembers"],
                    suggestions: ["Just me", "Add team members", "Skip for now"]
                }
            };
        }

        // Handle assigned to input when user has project context
        if (currentTaskData.projectName && currentTaskData.taskName && currentTaskData.description && currentTaskData.priority && currentTaskData.dueDate && !currentTaskData.assignedTo && lowerMessage.length > 2) {
            return {
                success: true,
                data: {
                    message: `Great! ${userMessage} will be the task leader. Now, which team members should be assigned to this task? You can mention their names or say "just me" if you want to handle it alone.`,
                    nextQuestion: "Which team members should be assigned?",
                    gatheredInfo: { ...currentTaskData, assignedTo: userMessage },
                    isComplete: false,
                    missingFields: ["teamMembers"],
                    suggestions: ["Just me", "Add team members", "Skip for now"]
                }
            };
        }

        // Handle team members input
        if (currentTaskData.taskName && currentTaskData.description && currentTaskData.priority && currentTaskData.dueDate && currentTaskData.assignedTo && !currentTaskData.teamMembers) {
            let teamMembers = [];
            let message = "";

            if (lowerMessage.includes('just me') || lowerMessage.includes('alone') || lowerMessage.includes('myself') || lowerMessage.includes('solo')) {
                teamMembers = [];
                message = "Perfect! You'll handle this task yourself. I have all the information I need to create your task.";
            } else if (lowerMessage.includes('skip') || lowerMessage.includes('later') || lowerMessage.includes('not now')) {
                teamMembers = [];
                message = "No problem! We can add team members later. I have all the information I need to create your task.";
            } else if (lowerMessage.includes('team') || lowerMessage.includes('everyone') || lowerMessage.includes('all')) {
                teamMembers = ["Full team"];
                message = "Great! I've noted that you want to assign the full team to this task. I have all the information I need to create your task.";
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
                    message = `Great! I've noted the team members: ${names.join(', ')}. I have all the information I need to create your task.`;
                } else {
                    teamMembers = [];
                    message = "I understand you want to add team members, but I couldn't identify specific names. I have all the information I need to create your task, and you can add team members later in the form.";
                }
            }

            const completeTaskData = { ...currentTaskData, teamMembers };
            return {
                success: true,
                data: {
                    message: message + " Let me open the task creation form for you to review and submit.",
                    nextQuestion: "Review the form and submit when ready",
                    gatheredInfo: completeTaskData,
                    isComplete: true,
                    missingFields: [],
                    suggestions: ["Review and submit task", "Make changes", "Start over"]
                }
            };
        }

        // Handle team members input when user has project context
        if (currentTaskData.projectName && currentTaskData.taskName && currentTaskData.description && currentTaskData.priority && currentTaskData.dueDate && currentTaskData.assignedTo && !currentTaskData.teamMembers) {
            let teamMembers = [];
            let message = "";

            if (lowerMessage.includes('just me') || lowerMessage.includes('alone') || lowerMessage.includes('myself') || lowerMessage.includes('solo')) {
                teamMembers = [];
                message = `Perfect! You'll handle this task yourself. I have all the information I need to create your task for the "${currentTaskData.projectName}" case.`;
            } else if (lowerMessage.includes('skip') || lowerMessage.includes('later') || lowerMessage.includes('not now')) {
                teamMembers = [];
                message = `No problem! We can add team members later. I have all the information I need to create your task for the "${currentTaskData.projectName}" case.`;
            } else if (lowerMessage.includes('team') || lowerMessage.includes('everyone') || lowerMessage.includes('all')) {
                teamMembers = ["Full team"];
                message = `Great! I've noted that you want to assign the full team to this task. I have all the information I need to create your task for the "${currentTaskData.projectName}" case.`;
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
                    message = `Great! I've noted the team members: ${names.join(', ')}. I have all the information I need to create your task for the "${currentTaskData.projectName}" case.`;
                } else {
                    teamMembers = [];
                    message = `I understand you want to add team members, but I couldn't identify specific names. I have all the information I need to create your task for the "${currentTaskData.projectName}" case, and you can add team members later in the form.`;
                }
            }

            const completeTaskData = { ...currentTaskData, teamMembers };
            return {
                success: true,
                data: {
                    message: message + " Let me open the task creation form for you to review and submit.",
                    nextQuestion: "Review the form and submit when ready",
                    gatheredInfo: completeTaskData,
                    isComplete: true,
                    missingFields: [],
                    suggestions: ["Review and submit task", "Make changes", "Start over"]
                }
            };
        }

        // Default response
        if (currentTaskData.projectName) {
            return {
                success: true,
                data: {
                    message: `I understand you're working on task creation for the "${currentTaskData.projectName}" case. Let me help you gather the necessary information. What would you like to tell me about this task?`,
                    nextQuestion: "What task details can you provide?",
                    gatheredInfo: currentTaskData,
                    isComplete: false,
                    missingFields: this.getMissingFields(currentTaskData),
                    suggestions: ["Start with task name", "Tell me about the task", "What type of task is this?", "Add team members"]
                }
            };
        } else {
            return {
                success: true,
                data: {
                    message: "I understand you're working on task creation. Let me help you gather the necessary information. What would you like to tell me about this task?",
                    nextQuestion: "What task details can you provide?",
                    gatheredInfo: currentTaskData,
                    isComplete: false,
                    missingFields: this.getMissingFields(currentTaskData),
                    suggestions: ["Start with task name", "Tell me about the task", "What type of task is this?", "Add team members"]
                }
            };
        }
    }

    // Check if all required fields are filled
    isTaskComplete(taskData) {
        const requiredFields = ['projectId', 'projectName', 'taskName', 'description', 'priority', 'dueDate', 'assignedTo'];
        const hasRequiredFields = requiredFields.every(field => {
            const value = taskData[field];
            if (!value) return false;

            // Handle different data types
            if (typeof value === 'string') {
                return value.trim() !== '';
            } else if (typeof value === 'number') {
                return value > 0; // For IDs, ensure they're positive
            } else if (Array.isArray(value)) {
                return value.length > 0;
            } else {
                return true; // For other types (boolean, object), consider them valid
            }
        });

        // Team members are optional but recommended
        const hasTeamMembers = taskData.teamMembers && taskData.teamMembers.length > 0;

        return hasRequiredFields;
    }

    // Get missing required fields
    getMissingFields(taskData) {
        const requiredFields = ['projectId', 'projectName', 'taskName', 'description', 'priority', 'dueDate', 'assignedTo'];
        const missingRequired = requiredFields.filter(field => {
            const value = taskData[field];
            if (!value) return true;

            // Handle different data types
            if (typeof value === 'string') {
                return value.trim() === '';
            } else if (typeof value === 'number') {
                return value <= 0; // For IDs, ensure they're positive
            } else if (Array.isArray(value)) {
                return value.length === 0;
            } else {
                return false; // For other types (boolean, object), consider them valid
            }
        });

        // Add team members as a recommended field if not present
        if (!taskData.teamMembers || taskData.teamMembers.length === 0) {
            missingRequired.push('teamMembers');
        }

        return missingRequired;
    }

    // Format task data for the creation modal
    formatTaskDataForModal(taskData) {
        const formattedData = {
            name: taskData.taskName || '',
            description: taskData.description || '',
            priority: taskData.priority || 'MEDIUM',
            last_date: taskData.dueDate || '',
            assigned_to: taskData.assignedTo || -1,
            otherMember: taskData.teamMembers || [],
            status: taskData.status || 'TO_DO',
            phase: taskData.phase || '',
            project_id: taskData.projectId || null
        };

        // Ensure project_id is a number
        if (formattedData.project_id && typeof formattedData.project_id === 'string') {
            formattedData.project_id = parseInt(formattedData.project_id, 10);
        }

        // Ensure assigned_to is a number
        if (formattedData.assigned_to && typeof formattedData.assigned_to === 'string') {
            formattedData.assigned_to = parseInt(formattedData.assigned_to, 10);
        }

        return formattedData;
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
const taskCreationAIService = new TaskCreationAIService();
export default taskCreationAIService;
