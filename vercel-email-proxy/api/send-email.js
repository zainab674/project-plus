import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Only POST requests are accepted.' 
    });
  }

  try {
    const { 
      to, 
      subject, 
      html, 
      text, 
      from, 
      replyTo,
      attachments,
      apiKey 
    } = req.body;

    // Validate required fields
    if (!to || !subject || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and apiKey are required'
      });
    }

    // Validate API key
    if (apiKey !== process.env.EMAIL_PROXY_API_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient email address'
      });
    }

    // Check if SMTP credentials are configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({
        success: false,
        error: 'SMTP configuration is missing. Please check environment variables.'
      });
    }

    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
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

    // Prepare mail options
    const mailOptions = {
      from: from || process.env.SMTP_USER,
      to: to,
      subject: subject,
      html: html,
      text: text,
      replyTo: replyTo,
      attachments: attachments || []
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully via Vercel proxy:', {
      messageId: result.messageId,
      to: to,
      subject: subject,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending email via Vercel proxy:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
