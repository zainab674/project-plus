import { createTransport } from "nodemailer";
import { sendEmailViaProxy } from "../services/emailProxyService.js";

export const sendMail = async (subject, mail, html) => {
    try {
        // Try to send via Vercel proxy first (for DigitalOcean deployments)
        if (process.env.USE_EMAIL_PROXY === 'true' && process.env.EMAIL_PROXY_URL) {
            console.log('📧 Attempting to send email via Vercel proxy...');
            const result = await sendEmailViaProxy({
                to: mail,
                subject,
                html
            });
            console.log('✅ Email sent successfully via proxy:', result.messageId);
            return result;
        }

        // Fallback to direct SMTP (for local development or when proxy is not available)
        console.log('📧 Attempting to send email via direct SMTP...');
        
        // Check if SMTP credentials are configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            throw new Error('SMTP configuration is missing. Please check environment variables: SMTP_USER, SMTP_PASS');
        }

        // Use Gmail SMTP with secure settings
        const transporter = createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const result = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: mail,
            subject,
            html
        });

        console.log('✅ Email sent successfully via direct SMTP:', result.messageId);
        return result;

    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        
        // If direct SMTP fails and we haven't tried proxy yet, try proxy as fallback
        if (process.env.USE_EMAIL_PROXY !== 'true' && process.env.EMAIL_PROXY_URL) {
            console.log('🔄 Direct SMTP failed, trying Vercel proxy as fallback...');
            try {
                const result = await sendEmailViaProxy({
                    to: mail,
                    subject,
                    html
                });
                console.log('✅ Email sent successfully via proxy fallback:', result.messageId);
                return result;
            } catch (proxyError) {
                console.error('❌ Proxy fallback also failed:', proxyError.message);
                throw error; // Throw original error
            }
        }
        
        throw error; // Re-throw the error so it can be handled properly
    }
}