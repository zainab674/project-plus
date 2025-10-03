import nodemailer from 'nodemailer';

// Create transporter (you'll need to configure this with your email provider)
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

// Send approval email
export const sendApprovalEmail = async (userEmail, userName) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: userEmail,
            subject: '🎉 Your Registration Request Has Been Approved!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">🎉 Registration Approved!</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to our platform!</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Hello ${userName},</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Great news! Your registration request has been reviewed and approved by our admin team. 
                            You can now access our platform and start using all the features.
                        </p>
                        
                        <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h3 style="color: #2e7d32; margin-top: 0;">✅ What's Next?</h3>
                            <ul style="color: #2e7d32; padding-left: 20px;">
                                <li>Visit our login page</li>
                                <li>Use your email and password to sign in</li>
                                <li>Complete your profile setup</li>
                                <li>Start exploring the platform</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/sign-in" 
                               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                🚀 Login Now
                            </a>
                        </div>
                        
                        <p style="color: #666; line-height: 1.6;">
                            If you have any questions or need assistance, please don't hesitate to contact our support team.
                        </p>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Best regards,<br>
                            <strong>The Admin Team</strong>
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Approval email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('Error sending approval email:', error);
        return { success: false, error: error.message };
    }
};

// Send rejection email
export const sendRejectionEmail = async (userEmail, userName, adminNotes = '') => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: userEmail,
            subject: '📝 Update on Your Registration Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">📝 Registration Update</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Important information about your request</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Hello ${userName},</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Thank you for your interest in our platform. After careful review of your registration request, 
                            we regret to inform you that we are unable to approve your application at this time.
                        </p>
                        
                        ${adminNotes ? `
                        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h3 style="color: #856404; margin-top: 0;">📋 Admin Notes:</h3>
                            <p style="color: #856404; margin: 0;">${adminNotes}</p>
                        </div>
                        ` : ''}
                        
                        <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h3 style="color: #c53030; margin-top: 0;">💡 What You Can Do:</h3>
                            <ul style="color: #c53030; padding-left: 20px;">
                                <li>Review the feedback provided above</li>
                                <li>Address any concerns mentioned</li>
                                <li>Submit a new application with updated information</li>
                                <li>Contact our support team for clarification</li>
                            </ul>
                        </div>
                        
                        <p style="color: #666; line-height: 1.6;">
                            We encourage you to review your application and consider submitting a new request 
                            with any additional information that might help with the approval process.
                        </p>
                        
                        <p style="color: #666; line-height: 1.6;">
                            If you have any questions or would like to discuss this decision, 
                            please don't hesitate to reach out to our support team.
                        </p>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Best regards,<br>
                            <strong>The Admin Team</strong>
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Rejection email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('Error sending rejection email:', error);
        return { success: false, error: error.message };
    }
};

// Send pending notification email
export const sendPendingNotificationEmail = async (userEmail, userName) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: userEmail,
            subject: '⏳ Your Registration Request is Under Review',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">⏳ Request Under Review</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">We're processing your application</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Hello ${userName},</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Thank you for submitting your registration request! We've received your application 
                            and it's currently under review by our admin team.
                        </p>
                        
                        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h3 style="color: #856404; margin-top: 0;">📋 What Happens Next?</h3>
                            <ul style="color: #856404; padding-left: 20px;">
                                <li>Our admin team reviews your application</li>
                                <li>We verify the information provided</li>
                                <li>You'll receive an email with the decision</li>
                                <li>If approved, you can immediately start using the platform</li>
                            </ul>
                        </div>
                        
                        <p style="color: #666; line-height: 1.6;">
                            This process typically takes 1-2 business days. We'll notify you as soon as 
                            a decision has been made.
                        </p>
                        
                        <p style="color: #666; line-height: 1.6;">
                            In the meantime, if you have any questions about your application, 
                            feel free to contact our support team.
                        </p>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Best regards,<br>
                            <strong>The Admin Team</strong>
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Pending notification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('Error sending pending notification email:', error);
        return { success: false, error: error.message };
    }
};
