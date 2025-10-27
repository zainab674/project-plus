import { createTransport } from "nodemailer";
import { sendEmailViaProxy } from "../services/emailProxyService.js";

export const sendMail = async (subject, mail, html) => {
    try {
        // Try to send via Vercel proxy first (for DigitalOcean deployments)
        if (process.env.USE_EMAIL_PROXY === 'true' && process.env.EMAIL_PROXY_URL) {
            const result = await sendEmailViaProxy({
                to: mail,
                subject,
                html
            });
            return result;
        }

        // Fallback to direct SMTP (for local development or when proxy is not available)
        
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

        return result;

    } catch (error) {
        
        // If direct SMTP fails and we haven't tried proxy yet, try proxy as fallback
        if (process.env.USE_EMAIL_PROXY !== 'true' && process.env.EMAIL_PROXY_URL) {
            try {
                const result = await sendEmailViaProxy({
                    to: mail,
                    subject,
                    html
                });
                return result;
            } catch (proxyError) {
                throw error; // Throw original error
            }
        }
        
        throw error; // Re-throw the error so it can be handled properly
    }
}