import jwt from "jsonwebtoken";
import { createTransport } from "nodemailer";
import { sendEmailViaProxy } from "./emailProxyService.js";
import { generateOTP } from "../processors/generateOTPProcessor.js";
import { prisma } from "../prisma/index.js";


export const generateJWTToken = (user, callback) => {
  const jwttoken = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '15d' });
  return jwttoken;
}


export const sendOTPOnMail = async (user, callback) => {
  try {
    const subject = "OTP";
    const OTP = generateOTP();
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 18px; font-weight: bold; color: #007bff;">Your OTP is: ${OTP}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          This OTP is valid for 10 minutes. Please do not share it with anyone.
        </p>
      </div>
    `;

    // Try to send via Vercel proxy first (for DigitalOcean deployments)
    if (process.env.USE_EMAIL_PROXY === 'true' && process.env.EMAIL_PROXY_URL) {
      console.log('📧 Sending OTP email via Vercel proxy to:', user.email);
      
      const result = await sendEmailViaProxy({
        to: user.email,
        subject,
        html
      });

      console.log('✅ OTP email sent successfully via proxy:', result.messageId);
      callback(OTP, null);
      return;
    }

    // Fallback to direct SMTP
    console.log('📧 Sending OTP email via direct SMTP to:', user.email);
    
    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      to: user.email,
      subject,
      text: `your otp is ${OTP}`,
      html
    });

    console.log('✅ OTP email sent successfully via direct SMTP');
    callback(OTP, null);

  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    
    // If direct SMTP fails and we haven't tried proxy yet, try proxy as fallback
    if (process.env.USE_EMAIL_PROXY !== 'true' && process.env.EMAIL_PROXY_URL) {
      console.log('🔄 Direct SMTP failed, trying Vercel proxy as fallback...');
      try {
        const subject = "OTP";
        const OTP = generateOTP();
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Your OTP Code</h2>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="font-size: 18px; font-weight: bold; color: #007bff;">Your OTP is: ${OTP}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              This OTP is valid for 10 minutes. Please do not share it with anyone.
            </p>
          </div>
        `;

        const result = await sendEmailViaProxy({
          to: user.email,
          subject,
          html
        });

        console.log('✅ OTP email sent successfully via proxy fallback:', result.messageId);
        callback(OTP, null);
        return;
      } catch (proxyError) {
        console.error('❌ Proxy fallback also failed:', proxyError.message);
        callback(null, error.message);
        return;
      }
    }
    
    callback(null, error.message);
  }
};


export const sendInviation = async (message, mail) => {
  try {
    // Try to send via Vercel proxy first (for DigitalOcean deployments)
    if (process.env.USE_EMAIL_PROXY === 'true' && process.env.EMAIL_PROXY_URL) {
      console.log('📧 Sending invitation email via Vercel proxy to:', mail);
      
      const subject = "flexywexy.com Project Invitation";
      
      // Limit message size to prevent large request bodies
      const truncatedMessage = message.length > 5000 ? message.substring(0, 5000) + '...' : message;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Project Invitation</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            ${truncatedMessage.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #666; font-size: 14px;">
            Sent by: FlexyWexy Team<br>
            Date: ${new Date().toLocaleDateString()}
          </p>
        </div>
      `;

      const result = await sendEmailViaProxy({
        to: mail,
        subject,
        html
      });

      console.log('✅ Invitation email sent successfully via proxy:', result.messageId);
      return result;
    }

    // Fallback to direct SMTP
    console.log('📧 Sending invitation email via direct SMTP to:', mail);
    
    // Check if SMTP credentials are configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP configuration is missing. Please check environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
    }

    console.log('📧 SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? '***' : 'NOT_SET',
      pass: process.env.SMTP_PASS ? '***' : 'NOT_SET'
    });

    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465', // true if using port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const subject = "flexywexy.com Project Invitation";

    const result = await transporter.sendMail({
      from: `"FlexyWexy" <${process.env.SMTP_USER}>`, // sender must match SMTP_USER
      to: mail,
      subject,
      text: message,
    });

    console.log('✅ Invitation email sent successfully via direct SMTP:', result.messageId);
    return result;

  } catch (error) {
    console.error("❌ Error sending invitation email:", error.message);
    
    // If direct SMTP fails and we haven't tried proxy yet, try proxy as fallback
    if (process.env.USE_EMAIL_PROXY !== 'true' && process.env.EMAIL_PROXY_URL) {
      console.log('🔄 Direct SMTP failed, trying Vercel proxy as fallback...');
      try {
        const subject = "flexywexy.com Project Invitation";
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Project Invitation</h2>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #666; font-size: 14px;">
              Sent by: FlexyWexy Team<br>
              Date: ${new Date().toLocaleDateString()}
            </p>
          </div>
        `;

        const result = await sendEmailViaProxy({
          to: mail,
          subject,
          html
        });

        console.log('✅ Invitation email sent successfully via proxy fallback:', result.messageId);
        return result;
      } catch (proxyError) {
        console.error('❌ Proxy fallback also failed:', proxyError.message);
        throw error; // Throw original error
      }
    }
    
    if (error.response) {
      console.error("Response:", error.response);
    }
    throw error;
  }
};

// Password reset email function
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    console.log('📧 Setting up email transporter...');
    console.log('📧 SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? '***' : 'NOT_SET',
      pass: process.env.SMTP_PASS ? '***' : 'NOT_SET'
    });

    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465', // true if using port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Get your frontend URL from environment variable or use a default
    const frontendUrl = process.env.FRONTEND_URL || 'https://flexy-frontend.vercel.app';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    console.log('📧 Frontend URL:', frontendUrl);
    console.log('📧 Reset link generated:', resetLink);

    const subject = "FlexyWexy - Password Reset Request";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">FlexyWexy</h1>
          <h2 style="color: #666; font-size: 18px; margin: 0;">Password Reset Request</h2>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #333; margin: 0 0 15px 0;">
            You requested a password reset for your FlexyWexy account. Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin: 0;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #007bff; font-size: 14px; margin: 5px 0 0 0; word-break: break-all;">
            ${resetLink}
          </p>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">
            This link will expire in 1 hour for security reasons.
          </p>
          <p style="margin: 0;">
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      </div>
    `;

    console.log('📧 Sending email...');
    const result = await transporter.sendMail({
      from: `"FlexyWexy" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: htmlContent,
      text: `Password Reset Request\n\nYou requested a password reset for your FlexyWexy account. Click this link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour. If you didn't request this, please ignore this email.`,
    });

    console.log("✅ Password reset email sent successfully to:", email);
    console.log("✅ Email result:", result);
    return true;

  } catch (error) {
    console.error("❌ Error sending password reset email:", error.message);
    console.error("❌ Full error:", error);
    if (error.response) {
      console.error("Response:", error.response);
    }
    throw error;
  }
};


// Helper function to process pending invitations for a user
export const processPendingInvitations = async (userId, email) => {
  try {

    // Check for any valid pending invitation for this email
    let existingInvitation = await prisma.invitation.findFirst({
      where: {
        invited_email: email,
        expires_at: { gte: new Date() }
      },
      orderBy: { expires_at: 'desc' }
    });

    // REMOVED: The fallback logic that was causing new users to get assigned random roles
    // from invitations with invited_email: null

    if (existingInvitation) {


      try {
        if (existingInvitation.role === 'CLIENT') {
          // Handle client invitation
          if (existingInvitation.project_id) {
            // Check if user is already a project client
            const existingProjectClient = await prisma.projectClient.findFirst({
              where: {
                project_id: existingInvitation.project_id,
                user_id: userId
              }
            });

            if (!existingProjectClient) {
              // Add client to ProjectClient table only (not to ProjectMember)
              await prisma.projectClient.create({
                data: {
                  project_id: existingInvitation.project_id,
                  user_id: userId
                }
              });

              // Find an existing task in the project to use for conversation
              const existingTask = await prisma.task.findFirst({
                where: {
                  project_id: existingInvitation.project_id
                },
                select: {
                  task_id: true
                }
              });

              if (existingTask) {
                // Create conversation for the project using existing task
                await prisma.conversation.createMany({
                  data: [{
                    project_id: existingInvitation.project_id,
                    task_id: existingTask.task_id,
                    isGroup: false
                  }]
                });
              } else {
                // Create a default task for the project if none exists
                const defaultTask = await prisma.task.create({
                  data: {
                    name: "General Discussion",
                    description: "General project discussion and communication",
                    project_id: existingInvitation.project_id,
                    created_by: existingInvitation.user_id || existingInvitation.leader_id,
                    status: "TO_DO"
                  }
                });

                // Create conversation for the project using the new task
                await prisma.conversation.createMany({
                  data: [{
                    project_id: existingInvitation.project_id,
                    task_id: defaultTask.task_id,
                    isGroup: false
                  }]
                });
              }
            }
          }

          // Update user role to CLIENT
          const updatedUser = await prisma.user.update({
            where: { user_id: userId },
            data: { Role: "CLIENT" }
          });

        } else {
          // Handle team and biller invitations
          // Add to team of leader
          const teamMember = await prisma.userTeam.create({
            data: {
              user_id: userId,
              leader_id: existingInvitation.leader_id || existingInvitation.user_id,
              role: existingInvitation.role,
              legalRole: existingInvitation.legalRole,
              customLegalRole: existingInvitation.customLegalRole
            }
          });


          // Add user to project if project_id is provided
          if (existingInvitation.project_id) {
            // Check if user is already a project member
            const existingProjectMember = await prisma.projectMember.findFirst({
              where: {
                project_id: existingInvitation.project_id,
                user_id: userId
              }
            });

            if (!existingProjectMember) {
              await prisma.projectMember.create({
                data: {
                  project_id: existingInvitation.project_id,
                  user_id: userId,
                  role: existingInvitation.role,
                  legalRole: existingInvitation.legalRole,
                  customLegalRole: existingInvitation.customLegalRole
                }
              });
            }
          }

          // Update Role in User table based on invitation
          const updatedUser = await prisma.user.update({
            where: { user_id: userId },
            data: { Role: existingInvitation.role }
          });

        }

        // Delete the invitation
        await prisma.invitation.delete({
          where: { id: existingInvitation.id }
        });

        return existingInvitation;
      } catch (createError) {
        console.error('Error processing invitation:', createError);
        throw createError;
      }
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error in processPendingInvitations:', error);
    throw error;
  }
};

export const getTeamMembers = async (leaderId) => {
  const teamMembers = await prisma.userTeam.findMany({
    where: {
      leader_id: leaderId
    },
    include: {
      user: {
        select: {
          user_id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return teamMembers;
};