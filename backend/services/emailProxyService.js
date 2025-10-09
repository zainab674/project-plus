/**
 * Email Proxy Service
 * Sends emails through Vercel API when SMTP is blocked
 */

const EMAIL_PROXY_URL = process.env.EMAIL_PROXY_URL || 'https://your-vercel-app.vercel.app';
const EMAIL_PROXY_API_KEY = process.env.EMAIL_PROXY_API_KEY;

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

        // Make request to Vercel API
        const response = await fetch(`${EMAIL_PROXY_URL}/api/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

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
