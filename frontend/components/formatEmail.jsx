/**
 * Gmail-Style Email Formatter
 * Preserves original email styling while adding Gmail-like interface
 */

// Utility functions
const sanitizeHtml = (html) => {
    if (!html) return '';
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '');
};

const extractTextContent = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const extractLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
};

const extractEmails = (text) => {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    return text.match(emailRegex) || [];
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else if (diffInHours < 168) { // 7 days
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    } catch {
        return dateString;
    }
};

const formatFullDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return dateString;
    }
};

// Email type detection
const detectEmailType = (body, subject = '') => {
    const bodyLower = body.toLowerCase();
    const subjectLower = subject.toLowerCase();
    const textContent = extractTextContent(body);

    // Meeting emails
    if (bodyLower.includes('meeting information') || 
        bodyLower.includes('meeting invitation') ||
        bodyLower.includes('meeting status') ||
        subjectLower.includes('meeting')) {
        
        if (bodyLower.includes('join now') || bodyLower.includes('join meeting')) {
            return 'meeting_join';
        }
        if (bodyLower.includes('accept') && bodyLower.includes('cancel')) {
            return 'meeting_rsvp';
        }
        if (bodyLower.includes('meeting status')) {
            return 'meeting_update';
        }
        return 'meeting_info';
    }

    // Document emails
    if (bodyLower.includes('document sent') || 
        bodyLower.includes('document uploaded') ||
        subjectLower.includes('document')) {
        return 'document_sent';
    }

    if (bodyLower.includes('please submit') || 
        bodyLower.includes('submit document') ||
        bodyLower.includes('document request') ||
        subjectLower.includes('submit')) {
        return 'document_request';
    }

    // Notification emails
    if (bodyLower.includes('notification') || 
        bodyLower.includes('alert') ||
        bodyLower.includes('reminder')) {
        return 'notification';
    }

    // Welcome/Registration emails
    if (bodyLower.includes('welcome') || 
        bodyLower.includes('registration') ||
        bodyLower.includes('account created')) {
        return 'welcome';
    }

    // Password reset emails
    if (bodyLower.includes('password reset') || 
        bodyLower.includes('reset password') ||
        bodyLower.includes('forgot password')) {
        return 'password_reset';
    }

    // Invoice/Billing emails
    if (bodyLower.includes('invoice') || 
        bodyLower.includes('billing') ||
        bodyLower.includes('payment') ||
        bodyLower.includes('charge')) {
        return 'billing';
    }

    // Project updates
    if (bodyLower.includes('project') || 
        bodyLower.includes('task') ||
        bodyLower.includes('update') ||
        bodyLower.includes('progress')) {
        return 'project_update';
    }

    // Team/Group emails
    if (bodyLower.includes('team') || 
        bodyLower.includes('group') ||
        bodyLower.includes('member')) {
        return 'team_update';
    }

    // Client emails
    if (bodyLower.includes('client') || 
        bodyLower.includes('customer') ||
        bodyLower.includes('account')) {
        return 'client_update';
    }

    // System/Technical emails
    if (bodyLower.includes('system') || 
        bodyLower.includes('technical') ||
        bodyLower.includes('error') ||
        bodyLower.includes('maintenance')) {
        return 'system_notification';
    }

    // Marketing/Promotional emails
    if (bodyLower.includes('promotion') || 
        bodyLower.includes('offer') ||
        bodyLower.includes('discount') ||
        bodyLower.includes('newsletter')) {
        return 'marketing';
    }

    return 'generic';
};

// Main formatter function
const formatEmailBody = (body, subject = '', metadata = {}) => {
    if (!body) {
        return `
            <div class="bg-white min-h-screen">
                <div class="flex items-center justify-center h-64 text-gray-500">
                    <p>No content available</p>
                </div>
            </div>
        `;
    }

    try {
        const emailType = detectEmailType(body, subject);
        console.log('Detected email type:', emailType);

        // Check if the body contains HTML (from processors)
        const hasHtml = body.includes('<html') || body.includes('<div') || body.includes('<style');
        
        if (hasHtml) {
            // If it's HTML from processors, preserve the styling and add Gmail wrapper
            return formatProcessedEmail(body, subject, metadata);
        }

        // For plain text emails, use the type-specific formatters
        switch (emailType) {
            case 'meeting_info':
                return formatMeetingInfoEmail(body, subject, metadata);
            case 'meeting_join':
                return formatMeetingJoinEmail(body, subject, metadata);
            case 'meeting_rsvp':
                return formatMeetingRsvpEmail(body, subject, metadata);
            case 'meeting_update':
                return formatMeetingUpdateEmail(body, subject, metadata);
            case 'document_sent':
                return formatDocumentSentEmail(body, subject, metadata);
            case 'document_request':
                return formatDocumentRequestEmail(body, subject, metadata);
            case 'notification':
                return formatNotificationEmail(body, subject, metadata);
            case 'welcome':
                return formatWelcomeEmail(body, subject, metadata);
            case 'password_reset':
                return formatPasswordResetEmail(body, subject, metadata);
            case 'billing':
                return formatBillingEmail(body, subject, metadata);
            case 'project_update':
                return formatProjectUpdateEmail(body, subject, metadata);
            case 'team_update':
                return formatTeamUpdateEmail(body, subject, metadata);
            case 'client_update':
                return formatClientUpdateEmail(body, subject, metadata);
            case 'system_notification':
                return formatSystemNotificationEmail(body, subject, metadata);
            case 'marketing':
                return formatMarketingEmail(body, subject, metadata);
            default:
                return formatGenericEmail(body, subject, metadata);
        }
    } catch (error) {
        console.error('Error formatting email:', error);
        return formatGenericEmail(body, subject, metadata);
    }
};

// Format emails that come from processors (preserve original styling)
const formatProcessedEmail = (body, subject, metadata) => {
    const sender = metadata.sender || 'Unknown Sender';
    const date = metadata.date || new Date().toISOString();
    
    // Extract the body content from the HTML (remove DOCTYPE, html, head, body tags)
    let emailContent = body;
    
    // Remove DOCTYPE and html tags
    emailContent = emailContent.replace(/<!DOCTYPE[^>]*>/i, '');
    emailContent = emailContent.replace(/<html[^>]*>/i, '');
    emailContent = emailContent.replace(/<\/html>/i, '');
    
    // Extract content from head and body
    const headMatch = emailContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const bodyMatch = emailContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    
    let styles = '';
    let content = '';
    
    if (headMatch) {
        const styleMatch = headMatch[1].match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (styleMatch) {
            styles = styleMatch[1];
        }
    }
    
    if (bodyMatch) {
        content = bodyMatch[1];
    } else {
        // If no body tag, try to extract content after head
        const afterHead = emailContent.replace(/<head[^>]*>[\s\S]*?<\/head>/i, '');
        content = afterHead.trim();
    }

    return `
        <div class="bg-white min-h-screen font-sans">
            <!-- Gmail Header -->
            <div class="border-b border-gray-200 bg-white sticky top-0 z-10">
                <div class="flex items-center justify-between px-6 py-3">
                    <div class="flex items-center space-x-4">
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                            </svg>
                        </button>
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                        </button>
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                            </svg>
                        </button>
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Email Content -->
            <div class="max-w-4xl mx-auto px-6 py-8">
                <!-- Email Header -->
                <div class="mb-8">
                    <h1 class="text-2xl font-normal text-gray-900 mb-4">${subject || 'No Subject'}</h1>
                    
                    <!-- Sender Info -->
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex items-center space-x-4">
                            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <span class="text-white font-medium text-sm">${sender.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="font-medium text-gray-900">${sender}</span>
                                    <span class="text-gray-500">&lt;${extractEmails(sender)[0] || 'sender@example.com'}&gt;</span>
                                </div>
                                <div class="text-sm text-gray-500">
                                    to me
                                </div>
                            </div>
                        </div>
                        <div class="text-sm text-gray-500">
                            ${formatFullDate(date)}
                        </div>
                    </div>
                </div>

                <!-- Original Email Content with Preserved Styling -->
                <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <style>
                        ${styles}
                        /* Override some styles for better Gmail integration */
                        body {
                            margin: 0 !important;
                            padding: 20px !important;
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                        }
                        .container {
                            max-width: none !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            border: none !important;
                            border-radius: 0 !important;
                        }
                        .button a {
                            color: white !important;
                            text-decoration: none !important;
                        }
                        table {
                            border-collapse: collapse !important;
                        }
                        table th, table td {
                            border: 1px solid #e5e7eb !important;
                            padding: 12px !important;
                        }
                        table th {
                            background-color: #f9fafb !important;
                            font-weight: 600 !important;
                        }
                    </style>
                    ${content}
                </div>
            </div>
        </div>
    `;
};

// Gmail-style Generic Email Formatter (for plain text emails)
const formatGenericEmail = (body, subject, metadata) => {
    const sanitizedBody = sanitizeHtml(body);
    const textContent = extractTextContent(body);
    const links = extractLinks(body);
    const emails = extractEmails(body);
    const sender = metadata.sender || 'Unknown Sender';
    const date = metadata.date || new Date().toISOString();

    return `
        <div class="bg-white min-h-screen font-sans">
            <!-- Gmail Header -->
            <div class="border-b border-gray-200 bg-white sticky top-0 z-10">
                <div class="flex items-center justify-between px-6 py-3">
                    <div class="flex items-center space-x-4">
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                            </svg>
                        </button>
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                        </button>
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                            </svg>
                        </button>
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Email Content -->
            <div class="max-w-4xl mx-auto px-6 py-8">
                <!-- Email Header -->
                <div class="mb-8">
                    <h1 class="text-2xl font-normal text-gray-900 mb-4">${subject || 'No Subject'}</h1>
                    
                    <!-- Sender Info -->
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex items-center space-x-4">
                            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <span class="text-white font-medium text-sm">${sender.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="font-medium text-gray-900">${sender}</span>
                                    <span class="text-gray-500">&lt;${extractEmails(sender)[0] || 'sender@example.com'}&gt;</span>
                                </div>
                                <div class="text-sm text-gray-500">
                                    to me
                                </div>
                            </div>
                        </div>
                        <div class="text-sm text-gray-500">
                            ${formatFullDate(date)}
                        </div>
                    </div>
                </div>

                <!-- Email Body -->
                <div class="prose max-w-none">
                    <div class="text-gray-900 leading-relaxed whitespace-pre-line">
                        ${sanitizedBody || textContent}
                    </div>
                </div>

                <!-- Links Section -->
                ${links.length > 0 ? `
                    <div class="mt-8 pt-6 border-t border-gray-200">
                        <h3 class="text-sm font-medium text-gray-900 mb-3">Links in this email:</h3>
                        <div class="space-y-2">
                            ${links.map(link => `
                                <a href="${link}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm block break-all">
                                    ${link}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Email Addresses Section -->
                ${emails.length > 0 ? `
                    <div class="mt-4">
                        <h3 class="text-sm font-medium text-gray-900 mb-3">Email addresses in this email:</h3>
                        <div class="space-y-2">
                            ${emails.map(email => `
                                <a href="mailto:${email}" class="text-blue-600 hover:text-blue-800 text-sm block">
                                    ${email}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
};

// Meeting Information Email (Gmail Style)
const formatMeetingInfoEmail = (body, subject, metadata) => {
    // Clean and normalize the content
    const cleanBody = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanBody.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Initialize extracted data
    const extracted = {
        recipient: null,
        title: null,
        description: null,
        scheduledTime: null,
        location: null,
        organizer: null,
        participants: []
    };
    
    // Parse the content line by line to extract meeting details
    let currentSection = '';
    let participantSection = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip if we've already found all the main details
        if (extracted.recipient && extracted.title && extracted.description && extracted.scheduledTime) {
            break;
        }
        
        // Extract recipient
        if (line.includes('Recipient:') && !extracted.recipient) {
            const match = line.match(/Recipient:\s*(.+)/i);
            if (match) extracted.recipient = match[1].trim();
            continue;
        }
        
        // Extract title
        if (line.includes('Title:') && !extracted.title) {
            const match = line.match(/Title:\s*(.+)/i);
            if (match) extracted.title = match[1].trim();
            continue;
        }
        
        // Extract description
        if (line.includes('Description:') && !extracted.description) {
            const match = line.match(/Description:\s*(.+)/i);
            if (match) extracted.description = match[1].trim();
            continue;
        }
        
        // Extract scheduled time
        if (line.includes('Scheduled Time:') && !extracted.scheduledTime) {
            const match = line.match(/Scheduled Time:\s*(.+)/i);
            if (match) extracted.scheduledTime = match[1].trim();
            continue;
        }
        
        // Extract location
        if (line.includes('Location:') && !extracted.location) {
            const match = line.match(/Location:\s*(.+)/i);
            if (match) extracted.location = match[1].trim();
            continue;
        }
        
        // Extract organizer
        if (line.includes('Organizer:') && !extracted.organizer) {
            const match = line.match(/Organizer:\s*(.+)/i);
            if (match) extracted.organizer = match[1].trim();
            continue;
        }
    }
    
    // Parse participants from the entire content
    const participantRegex = /(\w+\s+\w+)\s+(NO|YES|ACCEPTED|DECLINED|PENDING|NO RESPONSE)/gi;
    let participantMatch;
    const seenParticipants = new Set();
    
    while ((participantMatch = participantRegex.exec(cleanBody)) !== null) {
        const name = participantMatch[1].trim();
        const status = participantMatch[2].toUpperCase();
        
        // Avoid duplicates
        if (!seenParticipants.has(name)) {
            seenParticipants.add(name);
            extracted.participants.push({
                name: name,
                status: status === 'NO' ? 'NO RESPONSE' : status
            });
        }
    }
    
    // Extract action URLs and create buttons
    const actionButtons = [];
    const urlRegex = /(https?:\/\/[^\s\n\r]+)/g;
    let urlMatch;
    const seenUrls = new Set();
    
    while ((urlMatch = urlRegex.exec(cleanBody)) !== null) {
        const url = urlMatch[1];
        
        if (!seenUrls.has(url)) {
            seenUrls.add(url);
            
            let label = 'View Details';
            if (url.includes('/api/v1/meeting/confirm/')) {
                label = url.includes('vote=1') ? 'Accept Meeting' : 'Decline Meeting';
            } else if (url.includes('/api/v1/meeting/vote/')) {
                label = url.includes('vote=1') ? 'Accept' : 'Decline';
            } else if (url.includes('/meeting/')) {
                label = 'Join Meeting';
            }
            
            actionButtons.push({ label, url });
        }
    }
    
    // Format the scheduled time properly
    let formattedTime = extracted.scheduledTime;
    if (extracted.scheduledTime && extracted.scheduledTime !== 'Invalid Date') {
        try {
            const date = new Date(extracted.scheduledTime);
            if (!isNaN(date.getTime())) {
                formattedTime = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }
        } catch (e) {
            // Keep original if parsing fails
        }
    }
    
    // Create the meeting details section
    const meetingDetailsSection = `
        <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Meeting Details
            </h3>
            <div class="space-y-4">
                ${extracted.recipient ? `
                    <div class="flex items-start">
                        <span class="font-medium text-gray-700 w-24 flex-shrink-0">Recipient:</span>
                        <span class="text-gray-900">${formatEmailLinks(extracted.recipient)}</span>
                    </div>
                ` : ''}
                
                ${extracted.title ? `
                    <div class="flex items-start">
                        <span class="font-medium text-gray-700 w-24 flex-shrink-0">Title:</span>
                        <span class="text-gray-900">${extracted.title}</span>
                    </div>
                ` : ''}
                
                ${extracted.description ? `
                    <div class="flex items-start">
                        <span class="font-medium text-gray-700 w-24 flex-shrink-0">Description:</span>
                        <span class="text-gray-900">${extracted.description}</span>
                    </div>
                ` : ''}
                
                ${formattedTime ? `
                    <div class="flex items-start">
                        <span class="font-medium text-gray-700 w-24 flex-shrink-0">Scheduled:</span>
                        <span class="text-gray-900">${formattedTime}</span>
                    </div>
                ` : ''}
                
                ${extracted.location ? `
                    <div class="flex items-start">
                        <span class="font-medium text-gray-700 w-24 flex-shrink-0">Location:</span>
                        <span class="text-gray-900">${extracted.location}</span>
                    </div>
                ` : ''}
                
                ${extracted.organizer ? `
                    <div class="flex items-start">
                        <span class="font-medium text-gray-700 w-24 flex-shrink-0">Organizer:</span>
                        <span class="text-gray-900">${extracted.organizer}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Create the participants table
    let participantsSection = '';
    if (extracted.participants.length > 0) {
        participantsSection = `
            <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                    </svg>
                    Participant Responses
                </h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${extracted.participants.map(p => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${p.name}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(p.status)}">
                                            ${p.status}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Create action buttons
    let actionButtonsSection = '';
    if (actionButtons.length > 0) {
        actionButtonsSection = `
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    Actions
                </h3>
                <div class="flex gap-4">
                    ${actionButtons.map(btn => `
                        <a href="${btn.url}" 
                           target="_blank"
                           class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                            ${btn.label}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    return `
        <div class="bg-white min-h-screen font-sans">
            <!-- Gmail Header -->
            <div class="border-b border-gray-200 bg-white sticky top-0 z-10">
                <div class="flex items-center justify-between px-6 py-3">
                    <div class="flex items-center space-x-4">
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                        </button>
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Email Content -->
            <div class="max-w-4xl mx-auto px-6 py-8">
                <!-- Email Header -->
                <div class="mb-8">
                    <h1 class="text-2xl font-normal text-gray-900 mb-4 flex items-center">
                        <svg class="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        ${subject || 'Meeting Information'}
                    </h1>
                    
                    <!-- Sender Info -->
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex items-center space-x-4">
                            <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="font-medium text-gray-900">Meeting System</span>
                                    <span class="text-gray-500">&lt;meetings@flexywexy.com&gt;</span>
                                </div>
                                <div class="text-sm text-gray-500">
                                    to me
                                </div>
                            </div>
                        </div>
                        <div class="text-sm text-gray-500">
                            ${formatFullDate(metadata.date || new Date().toISOString())}
                        </div>
                    </div>
                </div>

                ${meetingDetailsSection}
                ${participantsSection}
                ${actionButtonsSection}
            </div>
        </div>
    `;
};

// Document Sent Email (Gmail Style)
const formatDocumentSentEmail = (body, subject, metadata) => {
    const textContent = extractTextContent(body);
    
    const patterns = {
        sender: /(?:sent by|from|sender):\s*([^\n\r<]+)/i,
        documentName: /(?:document name|file name|title):\s*([^\n\r<]+)/i,
        description: /(?:description|details):\s*([^\n\r<]+)/i,
        size: /(?:size|file size):\s*([^\n\r<]+)/i
    };

    const extracted = {};
    Object.keys(patterns).forEach(key => {
        const match = textContent.match(patterns[key]);
        extracted[key] = match ? match[1].trim() : null;
    });

    // Fallback extraction for common patterns
    if (!extracted.sender) {
        const senderMatch = body.match(/sent to you by <strong>([^<]*)<\/strong>/);
        extracted.sender = senderMatch ? senderMatch[1] : 'Unknown';
    }

    if (!extracted.documentName) {
        const docMatch = body.match(/Document Name:<\/strong>\s*([^<]*?)(?=<|$)/);
        extracted.documentName = docMatch ? docMatch[1].trim() : 'Document';
    }

    return `
        <div class="bg-white min-h-screen font-sans">
            <!-- Gmail Header -->
            <div class="border-b border-gray-200 bg-white sticky top-0 z-10">
                <div class="flex items-center justify-between px-6 py-3">
                    <div class="flex items-center space-x-4">
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                        </button>
                        <button class="p-2 hover:bg-gray-100 rounded-full">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Email Content -->
            <div class="max-w-4xl mx-auto px-6 py-8">
                <!-- Email Header -->
                <div class="mb-8">
                    <h1 class="text-2xl font-normal text-gray-900 mb-4">📄 ${subject || 'Document Sent'}</h1>
                    
                    <!-- Sender Info -->
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex items-center space-x-4">
                            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="font-medium text-gray-900">${extracted.sender}</span>
                                    <span class="text-gray-500">&lt;${extracted.sender.toLowerCase().replace(/\s+/g, '.')}@flexywexy.com&gt;</span>
                                </div>
                                <div class="text-sm text-gray-500">
                                    to me
                                </div>
                            </div>
                        </div>
                        <div class="text-sm text-gray-500">
                            ${formatFullDate(metadata.date || new Date().toISOString())}
                        </div>
                    </div>
                </div>

                <!-- Email Body -->
                <div class="prose max-w-none mb-6">
                    <p class="text-gray-900 mb-4">Hello,</p>
                    <p class="text-gray-900 mb-4">
                        A document has been sent to you by <strong>${extracted.sender}</strong>.
                    </p>
                </div>

                <!-- Document Details -->
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                    <h3 class="font-semibold text-gray-900 mb-4">Document Details:</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="font-medium text-gray-700">Document Name:</span>
                            <span class="text-gray-900">${extracted.documentName}</span>
                        </div>
                        ${extracted.description ? `
                            <div class="flex justify-between">
                                <span class="font-medium text-gray-700">Description:</span>
                                <span class="text-gray-900">${extracted.description}</span>
                            </div>
                        ` : ''}
                        ${extracted.size ? `
                            <div class="flex justify-between">
                                <span class="font-medium text-gray-700">File Size:</span>
                                <span class="text-gray-900">${extracted.size}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Note -->
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p class="text-sm text-yellow-800">
                        <strong>Note:</strong> This document has been uploaded to your account. 
                        You can access it through your dashboard.
                    </p>
                </div>

                <p class="text-gray-900 text-sm">Please log in to your account to view and manage this document.</p>
            </div>
        </div>
    `;
};

// Helper functions
const parseParticipants = (text) => {
    if (!text) return [];
    const parts = text.split(/\s+/);
    const participants = [];
    
    for (let i = 0; i < parts.length; i += 3) {
        if (i + 2 < parts.length) {
            participants.push({
                name: `${parts[i]} ${parts[i + 1]}`,
                status: parts[i + 2]
            });
        }
    }
    
    return participants;
};

const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('accept') || statusLower.includes('accepted') || statusLower.includes('yes')) return 'text-green-600';
    if (statusLower.includes('decline') || statusLower.includes('declined') || statusLower.includes('no')) return 'text-red-600';
    if (statusLower.includes('pending') || statusLower.includes('no response') || statusLower.includes('maybe')) return 'text-yellow-600';
    return 'text-gray-600';
};

const getStatusBadgeColor = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('accept') || statusLower.includes('accepted') || statusLower.includes('yes')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('decline') || statusLower.includes('declined') || statusLower.includes('no')) return 'bg-red-100 text-red-800';
    if (statusLower.includes('pending') || statusLower.includes('no response') || statusLower.includes('maybe')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
};

const extractActionButtons = (body) => {
    const buttons = [];
    
    // Extract URLs from the content
    const urlMatches = body.match(/https?:\/\/[^\s\n\r]+/g);
    
    if (urlMatches) {
        urlMatches.forEach(url => {
            if (url.includes('/api/v1/meeting/confirm/')) {
                const label = url.includes('vote=1') ? 'Accept Meeting' : 'Decline Meeting';
                buttons.push({ label, url });
            } else if (url.includes('/api/v1/meeting/vote/')) {
                const label = url.includes('vote=1') ? 'Accept' : 'Decline';
                buttons.push({ label, url });
            } else if (url.includes('/meeting/')) {
                buttons.push({ label: 'Join Meeting', url });
            }
        });
    }
    
    // Remove duplicates based on URL
    const uniqueButtons = buttons.filter((button, index, self) => 
        index === self.findIndex(b => b.url === button.url)
    );
    
    if (uniqueButtons.length > 0) {
        return `
            <div class="flex gap-4 mt-6">
                ${uniqueButtons.map(btn => `
                    <a href="${btn.url}" 
                       target="_blank"
                       class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                        ${btn.label}
                    </a>
                `).join('')}
            </div>
        `;
    }
    
    return '';
};

const formatEmailLinks = (text) => {
    if (!text) return '';
    return text.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, 
        '<a href="mailto:$1" class="text-blue-600 hover:underline">$1</a>');
};

// Placeholder functions for other email types (using Gmail style)
const formatMeetingJoinEmail = (body, subject, metadata) => formatMeetingInfoEmail(body, subject, metadata);
const formatMeetingRsvpEmail = (body, subject, metadata) => formatMeetingInfoEmail(body, subject, metadata);
const formatMeetingUpdateEmail = (body, subject, metadata) => formatMeetingInfoEmail(body, subject, metadata);
const formatDocumentRequestEmail = (body, subject, metadata) => formatDocumentSentEmail(body, subject, metadata);
const formatNotificationEmail = (body, subject, metadata) => formatGenericEmail(body, subject, metadata);
const formatWelcomeEmail = (body, subject, metadata) => formatGenericEmail(body, subject, metadata);
const formatPasswordResetEmail = (body, subject, metadata) => formatGenericEmail(body, subject, metadata);
const formatBillingEmail = (body, subject, metadata) => formatGenericEmail(body, subject, metadata);
const formatProjectUpdateEmail = (body, subject, metadata) => formatGenericEmail(body, subject, metadata);
const formatTeamUpdateEmail = (body, subject, metadata) => formatGenericEmail(body, subject, metadata);
const formatClientUpdateEmail = (body, subject, metadata) => formatGenericEmail(body, subject, metadata);
const formatSystemNotificationEmail = (body, subject, metadata) => formatGenericEmail(body, subject, metadata);
const formatMarketingEmail = (body, subject, metadata) => formatGenericEmail(body, subject, metadata);

// Export the main function
export { formatEmailBody };