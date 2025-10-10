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

        console.log('📧 Sending email via Vercel proxy:', {
            to: emailData.to,
            subject: emailData.subject,
            timestamp: new Date().toISOString()
        });

        // Log the payload for debugging
        console.log('📧 Request payload:', JSON.stringify(payload, null, 2));

        // Check payload size before sending
        const payloadString = JSON.stringify(payload);
        const payloadSizeKB = Math.round(payloadString.length / 1024);
        
        console.log(`📧 Request payload size: ${payloadSizeKB}KB`);
        console.log(`📧 EMAIL_PROXY_URL from env: ${process.env.EMAIL_PROXY_URL || 'NOT_SET'}`);
        console.log(`📧 Using EMAIL_PROXY_URL: ${EMAIL_PROXY_URL}`);
        console.log(`📧 Making request to: ${EMAIL_PROXY_URL}/api/send-email`);
        console.log(`📧 Request method: POST`);
        console.log(`📧 Content-Type: application/json`);
        console.log(`📧 API Key: ${EMAIL_PROXY_API_KEY ? 'SET' : 'NOT_SET'}`);
        
        // Vercel has a 4.5MB limit for request body, but let's be conservative
        if (payloadSizeKB > 1000) { // 1MB limit
            throw new Error(`Request body too large: ${payloadSizeKB}KB. Maximum allowed: 1000KB`);
        }

        // Make request to Vercel API with timeout and retry logic
        const makeRequest = async (retryCount = 0) => {
            console.log(`📧 Starting request attempt ${retryCount + 1}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            try {
                console.log(`📧 Sending fetch request to: ${EMAIL_PROXY_URL}/api/send-email`);
                console.log(`📧 Request body length: ${payloadString.length} characters`);
                
                const response = await fetch(`${EMAIL_PROXY_URL}/api/send-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: payloadString,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                console.log(`📧 Received response with status: ${response.status}`);
                console.log(`📧 Response headers:`, Object.fromEntries(response.headers.entries()));
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                console.error(`📧 Request attempt ${retryCount + 1} failed:`, error.message);
                console.error(`📧 Error type:`, error.name);
                console.error(`📧 Error stack:`, error.stack);
                
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout - email proxy took too long to respond');
                }
                
                // Retry on network errors (up to 2 retries)
                if (retryCount < 2 && (error.message.includes('fetch') || error.message.includes('network'))) {
                    console.log(`🔄 Retrying request (attempt ${retryCount + 1}/2)...`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                    return makeRequest(retryCount + 1);
                }
                
                throw error;
            }
        };
        
        const response = await makeRequest();

        let result;
        try {
            console.log(`📧 Attempting to parse response as JSON...`);
            result = await response.json();
            console.log(`📧 Successfully parsed JSON response:`, JSON.stringify(result, null, 2));
        } catch (jsonError) {
            console.error('❌ Failed to parse JSON response from email proxy:');
            console.error('JSON Error:', jsonError.message);
            console.error('JSON Error type:', jsonError.name);
            
            // If JSON parsing fails, get the raw response text
            console.log(`📧 Attempting to read response as text...`);
            const responseText = await response.text();
            console.error('Response status:', response.status);
            console.error('Response headers:', Object.fromEntries(response.headers.entries()));
            console.error('Response body length:', responseText.length);
            console.error('Response body (first 500 chars):', responseText.substring(0, 500));
            console.error('Response body (last 500 chars):', responseText.substring(Math.max(0, responseText.length - 500)));
            
            // Check if it's a "Body is unusable" error
            if (responseText.includes('Body is unusable') || jsonError.message.includes('Body is unusable')) {
                console.error('❌ Detected "Body is unusable" error');
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

        console.log('✅ Email sent successfully via proxy:', {
            messageId: result.messageId,
            to: emailData.to,
            subject: emailData.subject,
            timestamp: result.timestamp
        });

        return {
            success: true,
            messageId: result.messageId,
            timestamp: result.timestamp
        };

    } catch (error) {
        console.error('❌ Error sending email via proxy:', {
            error: error.message,
            to: emailData.to,
            subject: emailData.subject,
            timestamp: new Date().toISOString()
        });
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
        console.error('Email proxy health check failed:', error.message);
        return false;
    }
};
