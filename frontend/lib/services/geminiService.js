// Gemini API Service for AI Chatbot
// This service handles communication with Google's Gemini API

class GeminiService {
    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyD2cD5oHKpZUgiZGX05aiHLJsFMJc1uRKg';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    }

    // Website knowledge base for context
    getWebsiteContext() {
        return `
        You are an AI assistant for FlexyWexy, a comprehensive legal practice management system. 
        You help users understand and navigate the platform's features.

        STRICT FORMAT (ALWAYS):
# <Title>

## Summary
2 concise sentences.

## Steps
1. ...
2. ...
3. ...


STYLE RULES:
- Use Markdown exactly as above.
- Bold UI labels with **...**.
- Use numbered lists only under "Steps".
- Use hyphen bullets elsewhere.
- No follow-up questions or suggestions.
- No extra sections.

        FlexyWexy FEATURES AND KNOWLEDGE:

        CASE MANAGEMENT:
        - Users can create and manage legal cases with phases, tasks, and team collaboration
        - Case creation steps: Dashboard → Cases → Create New Case → Fill details (name, opposing party, client info, status, priority, filing date) → Add team members → Define phases → Set budget
        - Case phases: can be any can act like milestones
        - Case statuses: Pending, Active, Settled
        - Case priorities: High, Medium, Low

        TASK MANAGEMENT:
        - Create and assign tasks to team members with deadlines and priorities
        - Task creation: Navigate to case → Create Task → Fill details (name, description, assigned member, priority, due date, phase) → Add additional members
        - Task features: Progress tracking, reminders, comments, file attachments, time tracking
        - View tasks: Dashboard → Timeline

        BILLING & INVOICING:
        - Time tracking for tasks and activities
        - Hourly rate configuration per team member
        - Invoice generation and management
        - Expense tracking and reimbursement
        - Billing statuses: PAID, UNPAID, DRAFT, SENT, OVERDUE
        - Billing types: Hourly, Monthly, Project-based, Task-based, Fixed Fee
        - Access: Dashboard → Billing

        TEAM COLLABORATION:
        - Real-time chat between team members and clients
        - Group chat for project teams
        - Private messaging between users
        - Voice and video calls
        - File sharing in conversations
        - User roles: Provider (creates/manages cases), Biller (handles billing), Team Member (works on tasks), Client (accesses case info)

        MEETINGS:
        - Schedule and conduct virtual meetings with clients and team members
        - Video conferencing with screen sharing
        - Meeting recording and transcription
        - Meeting types: Scheduled, immediate can be with team or client

        DOCUMENT MANAGEMENT:
        - Upload, manage, and share legal documents securely
        - Document upload and storage with version control
        - Document templates and customization
        - Digital signature integration
        - Secure sharing with clients
        - Document types: Legal pleadings, contracts, evidence, client communications, billing documents
        - Access: Dashboard → Documents

        CLIENT PORTAL:
        - Secure client access to case updates and documents
        - Client dashboard with case overview
        - Document access and download
        - Case status updates and timeline
        - Secure messaging with legal team
        - Billing and payment information

        NAVIGATION:
        - Dashboard: Main overview of all cases and activities
        - Cases/Projects: View and manage all legal cases
        - Billing: Manage billing, invoices, and time tracking
        - Chat: Team communication and messaging
        - Meetings: Schedule and join virtual meetings
        - Documents: Document management and sharing
        - Clients: Client information and portal access
        - Team: Team member management and roles
        - Timeline: Case timeline and progress tracking

       
        `;
    }

    async generateResponse(userMessage, conversationHistory = []) {
        try {
            if (!this.apiKey) {
                throw new Error('Gemini API key not configured');
            }

            // Prepare the conversation context
            const context = this.getWebsiteContext();

            // Format conversation history
            const formattedHistory = conversationHistory.map(msg => ({
                role: msg.type === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

            // Create the request payload
            const requestBody = {
                contents: [
                    {
                        parts: [{
                            text: `${context}\n\nUser Question: ${userMessage}\n\nRespond ONLY in the strict Markdown format described.Please provide a helpful, detailed response about FlexyWexy based on the context above. Focus on practical steps and specific features.`
                        }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
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
                return {
                    content: data.candidates[0].content.parts[0].text,
                    success: true
                };
            } else {
                throw new Error('Invalid response format from Gemini API');
            }

        } catch (error) {
            console.error('Gemini API Error:', error);

            // Fallback to local response generation
            return this.generateFallbackResponse(userMessage);
        }
    }

    generateFallbackResponse(userMessage) {
        // Fallback response generation when API is not available
        const lowerMessage = userMessage.toLowerCase();

        // Case creation
        if (lowerMessage.includes('create') && (lowerMessage.includes('case') || lowerMessage.includes('project'))) {
            return {
                content: `**How to Create a New Case:**

1. **Navigate to Cases**: Go to your Dashboard and click on "Cases" in the sidebar
2. **Create New Case**: Click the "Create New Case" button (usually a + icon)
3. **Fill Case Details**:
   - **Case Name**: Enter a descriptive name for your case
   - **Opposing Party**: Name of the opposing party/client
   - **Client Information**: Client name and address
   - **Status**: Choose from Pending, Active, or Settled
   - **Priority**: Set as High, Medium, or Low
   - **Filing Date**: Select the case filing date
   - **Description**: Add detailed case description
4. **Add Team Members** (Optional): Select team members to assign to the case
5. **Define Phases**: Add case phases like Pleadings, Discovery, Trial, etc.
6. **Set Budget**: Enter estimated budget for the case
7. **Save**: Click "Create Case" to save

The case will then appear in your dashboard and you can start adding tasks, documents, and managing the workflow.`,
                success: true
            };
        }

        // Case phases
        if (lowerMessage.includes('phase') && lowerMessage.includes('case')) {
            return {
                content: `**Case Phases in FlexyWexy:**

Legal cases typically follow these phases:

1. **Pleadings Phase**
   - Initial complaint filing
   - Defendant's response/answer
   - Counterclaims and replies
   - Motion practice

2. **Discovery Phase**
   - Document requests and production
   - Interrogatories and responses
   - Depositions
   - Expert witness disclosures

3. **Pre-trial Phase**
   - Motion hearings
   - Settlement negotiations
   - Trial preparation
   - Pre-trial conferences

4. **Trial Phase**
   - Jury selection
   - Opening statements
   - Evidence presentation
   - Closing arguments
   - Jury deliberation

5. **Post-trial Phase**
   - Judgment entry
   - Appeals process
   - Enforcement actions
   - Settlement agreements

**To add phases to your case:**
1. Go to your case details
2. Look for the "Phases" section
3. Click "Add Phase" or edit existing phases
4. Each phase can have multiple tasks assigned to team members

Phases help organize your case workflow and track progress systematically.`,
                success: true
            };
        }

        // Default response
        return {
            content: `I understand you're asking about "${userMessage}". Let me help you with that!

Based on your question, here are some relevant areas I can assist with:

**🔍 Quick Navigation:**
- **Cases**: Create and manage legal cases
- **Tasks**: Assign and track tasks
- **Billing**: Handle invoicing and time tracking
- **Chat**: Team communication
- **Meetings**: Schedule and conduct video calls
- **Documents**: Upload and manage files
- **Team**: Manage team members and roles

**💡 Try asking about:**
- "How do I create a new case?"
- "What are the phases in a case?"
- "How do I assign tasks to team members?"
- "How does billing work?"
- "How do I schedule a meeting?"

If you need more specific help, please provide more details about what you're trying to accomplish!`,
            success: true
        };
    }

    // Extract suggested questions from AI response
    extractSuggestions(response) {
        const suggestions = [
            "How do I create a case?",
            "What are the case phases?",
            "How do I assign tasks?",
            "How does billing work?",
            "How do I schedule meetings?",
            "How do I upload documents?",
            "How do I manage team members?",
            "What are the user roles?"
        ];

        // Return 3 random suggestions
        return suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
    }
}

// Create and export a singleton instance
const geminiService = new GeminiService();
export default geminiService;
