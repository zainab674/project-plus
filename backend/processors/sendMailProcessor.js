import { createTransport } from "nodemailer";

export const sendMail = async (subject, mail, html) => {
    try {
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

        console.log('✅ Email sent successfully:', result.messageId);
        return result;

    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        throw error; // Re-throw the error so it can be handled properly
    }
}