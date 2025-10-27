/**
 * Email Proxy Service
 * Sends emails through Vercel API when SMTP is blocked
 */

const EMAIL_PROXY_URL = process.env.EMAIL_PROXY_URL || 'https://vercel-email-proxy.vercel.app';

/**
 * Send email through Vercel proxy
 * @param {Object} emailData - Email data object
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.html - HTML content
 * @param {string} [emailData.text] - Plain text content
 * @param {string} [emailData.from] - Sender email address
 * @param {string} [emailData.replyTo] - Reply-to email address
 * @param {Array} [emailData.attachments] - Email attachments
 * @returns {Promise<Object>} - Response object with success status and messageId
 */
export const sendEmailViaProxy = async (emailData) => {
    try {
        // Get environment variables
        const EMAIL_PROXY_API_KEY = process.env.EMAIL_PROXY_API_KEY;
        const EMAIL_PROXY_URL = process.env.EMAIL_PROXY_URL || 'https://vercel-email-proxy.vercel.app';
        
        // Validate required fields
        if (!emailData.to || !emailData.subject) {
            throw new Error('Missing required fields: to and subject are required');
        }

        // Validate API key
        if (!EMAIL_PROXY_API_KEY) {
            throw new Error('EMAIL_PROXY_API_KEY environment variable is not set');
        }

        // Prepare request payload
        const payload = {
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
            from: emailData.from,
            replyTo: emailData.replyTo,
            attachments: emailData.attachments || [],
            apiKey: EMAIL_PROXY_API_KEY
        };

        

        // Log the payload for debugging

        // Check payload size before sending
        const payloadString = JSON.stringify(payload);
        const payloadSizeKB = Math.round(payloadString.length / 1024);

        // Vercel has a 4.5MB limit for request body, but let's be conservative
        if (payloadSizeKB > 1000) { // 1MB limit
            throw new Error(`Request body too large: ${payloadSizeKB}KB. Maximum allowed: 1000KB`);
        }

        // Make request to Vercel API with timeout and retry logic
        const makeRequest = async (retryCount = 0) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            try {
                
                const response = await fetch(`${EMAIL_PROXY_URL}/api/send-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: payloadString,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout - email proxy took too long to respond');
                }
                
                // Retry on network errors (up to 2 retries)
                if (retryCount < 2 && (error.message.includes('fetch') || error.message.includes('network'))) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                    return makeRequest(retryCount + 1);
                }
                
                throw error;
            }
        };
        
        const response = await makeRequest();

        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            
            // If JSON parsing fails, get the raw response text
            const responseText = await response.text();
            
            // Check if it's a "Body is unusable" error
            if (responseText.includes('Body is unusable') || jsonError.message.includes('Body is unusable')) {
                throw new Error('Request body error - the request body may be too large or malformed');
            }
            
            throw new Error(`Invalid JSON response from email proxy (Status: ${response.status}): ${responseText.substring(0, 200)}...`);
        }

        if (!response.ok) {
            throw new Error(`Email proxy API error: ${result.error || 'Unknown error'}`);
        }

        if (!result.success) {
            throw new Error(`Email sending failed: ${result.error || 'Unknown error'}`);
        }

           
        return {
            success: true,
            messageId: result.messageId,
            timestamp: result.timestamp
        };

    } catch (error) {
         
        throw error;
    }
};

/**
 * Send simple email through proxy
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise<Object>} - Response object
 */
export const sendSimpleEmail = async (to, subject, html) => {
    return await sendEmailViaProxy({
        to,
        subject,
        html
    });
};

/**
 * Send email with attachments through proxy
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {Array} attachments - Array of attachment objects
 * @returns {Promise<Object>} - Response object
 */
export const sendEmailWithAttachments = async (to, subject, html, attachments) => {
    return await sendEmailViaProxy({
        to,
        subject,
        html,
        attachments
    });
};

/**
 * Check if email proxy is available
 * @returns {Promise<boolean>} - True if proxy is available
 */
export const checkEmailProxyHealth = async () => {
    try {
        const response = await fetch(`${EMAIL_PROXY_URL}/api/send-email`, {
            method: 'OPTIONS'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
};
