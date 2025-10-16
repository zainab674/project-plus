import catchAsyncError from '../middlewares/catchAsyncError.js';
import { validateRequestBody } from '../utils/validateRequestBody.js';
import ErrorHandler from "../utils/errorHandler.js";
import bcrypt from 'bcrypt';
import { ChangePasswordRequestBodySchema, LoginRequestBodySchema, OTPRequestBodySchema, RegisterRequestBodySchema, UpdateRequestBodySchema, ForgotPasswordRequestBodySchema, ResetPasswordRequestBodySchema } from '../schema/userSchema.js';
import { generateJWTToken, sendOTPOnMail, processPendingInvitations, sendPasswordResetEmail } from '../services/userService.js';
import { sendPendingNotificationEmail } from '../services/emailNotificationService.js';
import crypto from 'crypto';

import { prisma } from "../prisma/index.js";
import { encrypt } from '../services/encryptionService.js';
import { verifyMailPassword } from '../processors/verifyMailPasswordProcessor.js';

export const register = catchAsyncError(async (req, res, next) => {
    const { name, email, password, account_name, bring, teams_member_count, focus, hear_about_as, role, project_id, company_name, reason, team_size } = req.body;

    // Validate request body using Zod
    const [err, isValidate] = await validateRequestBody(req.body, RegisterRequestBodySchema);

    if (!isValidate) {
        return next(new ErrorHandler(JSON.parse(err)[0]?.message, 401));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: {
            email: email
        }
    });

    if (existingUser) {
        return next(new ErrorHandler("User already exists with this email", 400));
    }

    // Check if there's already a pending request for this email
    const existingRequest = await prisma.userRegistrationRequest.findUnique({
        where: {
            email: email
        }
    });

    if (existingRequest) {
        if (existingRequest.status === 'PENDING') {
            return next(new ErrorHandler("A registration request is already pending for this email", 400));
        } else if (existingRequest.status === 'APPROVED') {
            return next(new ErrorHandler("Your registration has already been approved. Please login instead.", 400));
        }
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // Create a registration request instead of a user
    const registrationRequest = await prisma.userRegistrationRequest.create({
        data: {
            name,
            email,
            password_hash,
            account_name,
            bring,
            teams_member_count,
            focus,
            hear_about_as,
            company_name,
            reason,
            team_size,
            status: 'PENDING'
        }
    });

    // Send pending notification email
    try {
        await sendPendingNotificationEmail(email, name);
        console.log(`Pending notification email sent to ${email}`);
    } catch (error) {
        console.error('Error sending pending notification email:', error);
        // Don't fail the registration process if email fails
    }

    // Send response indicating request is pending
    res.status(201).json({
        success: true,
        message: "Your registration request has been submitted successfully and is pending admin approval. You will receive an email notification once your request is approved.",
        data: {
            request_id: registrationRequest.request_id,
            status: 'PENDING',
            message: "Please wait for admin approval before you can login."
        }
    });
});

export const login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate request body using Zod
    const [err, isValidate] = await validateRequestBody(req.body, LoginRequestBodySchema);
    if (!isValidate) {
        return next(new ErrorHandler(err, 401));
    }

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    })

    //when user not exist
    if (!user) {
        return next(new ErrorHandler('Invalid Credentials', 404));
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
        return next(new ErrorHandler('Invalid Credentials', 404));
    }


    await sendOTPOnMail(user, async (OTP, err) => {
        if (err) {
            return next(new ErrorHandler(err, 401));
        }
        const hash_otp = crypto.createHash('sha256').update(OTP.toString()).digest('hex');
        await prisma.oTP.create({
            data: {
                otp: hash_otp,
                user_id: user.user_id
            }
        });
    })



    res.status(200).json({
        success: true,
        message: "OTP has been send to your email."
    });
});

export const verify = catchAsyncError(async (req, res, next) => {
    const { OTP } = req.body;
    const [err, isValidate] = await validateRequestBody(req.body, OTPRequestBodySchema);

    if (!isValidate) {
        return next(new ErrorHandler(err, 401));
    }

    const hash_otp = crypto.createHash('sha256').update(OTP.toString()).digest('hex');
    const otpRecord = await prisma.oTP.findUnique({
        where: {
            otp: hash_otp,
        },
        include: {
            user: {
                select: {
                    user_id: true,
                    name: true,
                    email: true,
                    bring: true,
                    hear_about_as: true,
                    focus: true,
                    account_name: true,
                    Projects: true,
                    Role: true
                }
            }
        }
    });

    if (!otpRecord) {
        return next(new ErrorHandler('Invalid OTP or Expire', 404));
    }

    // Calculate expiration time
    const expirationTime = new Date(otpRecord.created_at);
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);

    // Compare current time with expiration time
    if (new Date() > expirationTime) {
        return next(new ErrorHandler('Invalid OTP or Expire', 404));
    }

    const jwttoken = generateJWTToken(otpRecord.user);

    // Set options for the cookie
    const options = {
        httpOnly: true,    // Prevent access to the cookie from JavaScript
        expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Set expiration time
        secure: true,  // Force secure cookies for production
        sameSite: 'none', // Required for cross-domain in production
        // Don't set domain in production to let the browser handle it automatically
        // domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
    };

    await prisma.oTP.delete({
        where: {
            otp: hash_otp,
        }
    })

    // Send response with token as a cookie and in response body
    res.status(201).cookie("token", jwttoken, options).json({
        success: true,
        message: "Login Successfully",
        user: otpRecord.user,
        token: jwttoken // Include token in response body for frontend storage
    });

});


export const googleLogin = catchAsyncError(async (req, res, next) => {
    const user = req.user;
    const jwttoken = generateJWTToken(user);

    // Set options for the cookie
    const options = {
        httpOnly: true,    // Prevent access to the cookie from JavaScript
        expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Set expiration time
        secure: true,  // Force secure cookies for production
        sameSite: 'none', // Required for cross-domain in production
        // Don't set domain in production to let the browser handle it automatically
        // domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
    };

    // Redirect to frontend with token as query parameter
    res.status(201).cookie("token", jwttoken, options).redirect(`${process.env.FRONTEND_URL}/dashboard?token=${jwttoken}`);
});

export const logout = catchAsyncError(async (req, res, next) => {

    const options = {
        httpOnly: true,
        expires: new Date(Date.now()),
        secure: true,
        sameSite: 'none',
        // Don't set domain in production to let the browser handle it automatically
        // domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
    };

    // Send response with token as a cookie
    res.status(201).cookie("token", null, options).json({
        success: true,
        message: "Logout Successfully"
    });
});

export const changePassword = catchAsyncError(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    const [err, isValidate] = await validateRequestBody(req.body, ChangePasswordRequestBodySchema);

    if (!isValidate) {
        return next(new ErrorHandler(err, 401));
    }

    const user = req.user;

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordCorrect) {
        return next(new ErrorHandler('Current password is incorrect', 403));
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { user_id: user.user_id },
        data: { password_hash: newHashedPassword },
    });

    res.status(200).json({ success: true, message: 'Password updated successfully' });
});

export const updateUser = catchAsyncError(async (req, res, next) => {
    const { name, account_name, bring, teams_member_count, focus, hear_about_as } = req.body;

    const [err, isValidate] = await validateRequestBody(req.body, UpdateRequestBodySchema);

    if (!isValidate) {
        return next(new ErrorHandler(err, 401));
    }

    const userId = req.user.user_id;


    // Validate request body to ensure only allowed fields are updated
    const updateData = {};
    if (name) updateData.name = name;
    if (account_name) updateData.account_name = account_name;
    if (bring) updateData.bring = bring;
    if (teams_member_count) updateData.teams_member_count = teams_member_count;
    if (focus) updateData.focus = focus;
    if (hear_about_as) updateData.hear_about_as = hear_about_as;

    if (Object.keys(updateData).length === 0) {
        return next(new ErrorHandler('No fields provided for update', 400));
    }

    // Update user details in the database
    const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        message: 'User updated successfully',
        user: updatedUser, // Optionally send updated user data
    });
});

export const getTeamMembers = catchAsyncError(async (req, res, next) => {
    const userId = req.user.user_id;

    // Get team members for the current user (as leader)
    const teamMembers = await prisma.userTeam.findMany({
        where: {
            leader_id: userId
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

    res.status(200).json({
        success: true,
        teamMembers
    });
});

export const updateTeamMember = catchAsyncError(async (req, res, next) => {
    const { team_member_id } = req.params;
    const { role, legalRole, customLegalRole } = req.body;
    const userId = req.user.user_id;

    // Validate request body
    if (!role) {
        return next(new ErrorHandler('Role is required', 400));
    }

    // Check if the team member exists and belongs to the current user's team
    const teamMember = await prisma.userTeam.findFirst({
        where: {
            team_member_id: team_member_id,
            leader_id: userId
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

    if (!teamMember) {
        return next(new ErrorHandler('Team member not found or you are not authorized to update this member', 404));
    }

    // Prepare update data
    const updateData = {
        role,
        legalRole: legalRole || null,
        customLegalRole: customLegalRole || null
    };

    // Update the team member
    const updatedTeamMember = await prisma.userTeam.update({
        where: {
            team_member_id: team_member_id
        },
        data: updateData,
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

    res.status(200).json({
        success: true,
        message: 'Team member updated successfully',
        teamMember: updatedTeamMember
    });
});

export const deleteTeamMember = catchAsyncError(async (req, res, next) => {
    const { team_member_id } = req.params;
    const userId = req.user.user_id;




    // Check if the team member exists and belongs to the current user's team
    const teamMember = await prisma.userTeam.findFirst({
        where: {
            team_member_id: team_member_id,
            leader_id: userId
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

    if (!teamMember) {
        return next(new ErrorHandler('Team member not found or you are not authorized to delete this member', 404));
    }

    // Get count of projects the member is part of for feedback
    const projectCount = await prisma.projectMember.count({
        where: {
            user_id: teamMember.user_id
        }
    });

    await prisma.projectMember.deleteMany({
        where: {
            user_id: teamMember.user_id
        }
    });

    // Delete the team member (this will cascade delete all related data)
    await prisma.userTeam.delete({
        where: {
            team_member_id: team_member_id
        }
    });

    res.status(200).json({
        success: true,
        message: `Team member removed successfully. They were also removed from ${projectCount} project(s) and all related tasks, meetings, and other data.`
    });
});

export const loadUser = catchAsyncError(async (req, res, next) => {
    // Generate a fresh token for the authenticated user
    const freshToken = generateJWTToken(req.user);

    res.status(200).json({
        success: true,
        user: req.user,
        token: freshToken
    });
});

export const updateRole = catchAsyncError(async (req, res, next) => {
    const { role } = req.body;
    const userId = req.user.user_id;




    // Update user role
    const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: { Role: role }
    });

    res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        user: updatedUser
    });
});

// Invite team member to user team
export const inviteTeamMember = catchAsyncError(async (req, res, next) => {
    const { email, role, legalRole, customLegalRole } = req.body;
    const leaderId = req.user.user_id;

    // Validate required fields
    if (!email || !role) {
        return next(new ErrorHandler('Email and role are required', 400));
    }

    // Validate role
    const validRoles = ['TEAM', 'BILLER'];
    if (!validRoles.includes(role)) {
        return next(new ErrorHandler('Invalid role. Must be one of: TEAM, BILLER', 400));
    }

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!existingUser) {
            return next(new ErrorHandler('User with this email does not exist', 404));
        }

        // Check if user is already in the team
        const existingTeamMember = await prisma.userTeam.findFirst({
            where: {
                user_id: existingUser.user_id,
                leader_id: leaderId
            }
        });

        if (existingTeamMember) {
            return next(new ErrorHandler('User is already in your team', 400));
        }

        // Add user to team
        const teamMember = await prisma.userTeam.create({
            data: {
                user_id: existingUser.user_id,
                leader_id: leaderId,
                role,
                legalRole: legalRole || null,
                customLegalRole: customLegalRole || null
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

        // Update user's main role if needed
        if (role === 'BILLER' && existingUser.Role !== 'BILLER') {
            await prisma.user.update({
                where: { user_id: existingUser.user_id },
                data: { Role: 'BILLER' }
            });
        } else if (role === 'TEAM' && existingUser.Role === 'PROVIDER') {
            await prisma.user.update({
                where: { user_id: existingUser.user_id },
                data: { Role: 'TEAM' }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Team member added successfully',
            teamMember
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to add team member: ${error.message}`, 500));
    }
});

// Generate team invitation link
export const generateTeamInvitationLink = catchAsyncError(async (req, res, next) => {
    const { role, legalRole, customLegalRole, invited_email } = req.body;
    const leaderId = req.user.user_id;

    // Validate role
    const validRoles = ['TEAM', 'BILLER'];
    if (!validRoles.includes(role)) {
        return next(new ErrorHandler('Invalid role. Must be one of: TEAM, BILLER', 400));
    }

    // Validate email if provided
    if (invited_email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(invited_email)) {
            return next(new ErrorHandler('Invalid email format', 400));
        }
    }

    const token = crypto.randomBytes(32).toString('hex');

    // Store the invitation token
    await prisma.invitation.create({
        data: {
            token,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            role,
            user_id: leaderId,
            leader_id: leaderId, // The user sending the invitation is the leader
            project_id: null, // This is a team invitation, not project invitation
            legalRole: legalRole || null,
            customLegalRole: customLegalRole || null,
            invited_email: invited_email || null
        }
    });

    const link = `${process.env.FRONTEND_URL}/join-team/${token}`;

    res.status(201).json({
        success: true,
        link,
        message: 'Team invitation link generated successfully'
    });
});

// Join team through invitation (authenticated)
export const joinTeamThroughInvitation = catchAsyncError(async (req, res, next) => {
    const { token } = req.body;
    const userId = req.user.user_id;

    // Validate the token
    const invitation = await prisma.invitation.findUnique({
        where: { token }
    });

    if (!invitation || invitation.expires_at < new Date()) {
        return next(new ErrorHandler('Invalid or expired invitation link', 400));
    }

    // For team invitations, project_id can be present for project-specific team invitations
    // Only reject if this is a CLIENT invitation being processed as team invitation
    if (invitation.role === 'CLIENT') {
        return next(new ErrorHandler('This is a client invitation, not a team invitation', 400));
    }

    // Check if user is already in the team
    const existingTeamMember = await prisma.userTeam.findFirst({
        where: {
            user_id: userId,
            leader_id: invitation.leader_id || invitation.user_id // Use leader_id if available, fallback to user_id
        }
    });

    if (existingTeamMember) {
        return next(new ErrorHandler('You are already a member of this team', 400));
    }

    try {
        // Add user to team
        const teamMember = await prisma.userTeam.create({
            data: {
                user_id: userId,
                leader_id: invitation.leader_id || invitation.user_id, // Use leader_id if available, fallback to user_id
                role: invitation.role,
                legalRole: invitation.legalRole,
                customLegalRole: invitation.customLegalRole
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

        // Update user's main role
        if (invitation.role === 'BILLER') {
            await prisma.user.update({
                where: { user_id: userId },
                data: { Role: 'BILLER' }
            });
        } else if (invitation.role === 'TEAM') {
            await prisma.user.update({
                where: { user_id: userId },
                data: { Role: 'TEAM' }
            });
        }

        // Delete the invitation token
        await prisma.invitation.delete({
            where: { token }
        });

        res.status(201).json({
            success: true,
            message: 'Successfully joined the team',
            teamMember
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to join team: ${error.message}`, 500));
    }
});

// Join team through invitation (public - no authentication required)
// Team signup for invited users (no admin approval needed)
export const teamSignup = catchAsyncError(async (req, res, next) => {
    const { token, name, email, password } = req.body;

    if (!token || !name || !email || !password) {
        return next(new ErrorHandler('Token, name, email, and password are required', 400));
    }

    // Validate the token
    const invitation = await prisma.invitation.findUnique({
        where: { token }
    });

    if (!invitation || invitation.expires_at < new Date()) {
        return next(new ErrorHandler('Invalid or expired invitation link', 400));
    }

    // Check if this is a team invitation (project_id is optional for team invitations)
    // For project-specific team invitations, we'll handle them here too
    if (invitation.role !== 'TEAM' && invitation.role !== 'BILLER') {
        return next(new ErrorHandler('This is not a team invitation', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        return next(new ErrorHandler('User already exists with this email', 400));
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    try {
        // Create user account directly (no admin approval needed)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password_hash,
                account_name: name,
                focus: ["Nothing"],
                Role: invitation.role // Set role based on invitation
            }
        });

        // Add user to team
        const teamMember = await prisma.userTeam.create({
            data: {
                user_id: user.user_id,
                leader_id: invitation.leader_id || invitation.user_id,
                role: invitation.role,
                legalRole: invitation.legalRole,
                customLegalRole: invitation.customLegalRole
            }
        });

        // Add user to project if project_id is provided (for project-specific team invitations)
        if (invitation.project_id) {
            await prisma.projectMember.create({
                data: {
                    project_id: invitation.project_id,
                    user_id: user.user_id,
                    role: invitation.role,
                    legalRole: invitation.legalRole,
                    customLegalRole: invitation.customLegalRole
                }
            });
        }

        // Delete the invitation token
        await prisma.invitation.delete({
            where: { token }
        });

        res.status(201).json({
            success: true,
            message: invitation.project_id ? 'Account created successfully! You can now login and access the project.' : 'Account created successfully! You can now login.',
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.Role
            }
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to create team account: ${error.message}`, 500));
    }
});

// Client signup for invited users (no admin approval needed)
export const clientSignup = catchAsyncError(async (req, res, next) => {
    const { token, name, email, password } = req.body;

    if (!token || !name || !email || !password) {
        return next(new ErrorHandler('Token, name, email, and password are required', 400));
    }

    // Validate the token
    const invitation = await prisma.invitation.findUnique({
        where: { token }
    });

    if (!invitation || invitation.expires_at < new Date()) {
        return next(new ErrorHandler('Invalid or expired invitation link', 400));
    }

    // Check if this is a client invitation (has project_id)
    if (!invitation.project_id) {
        return next(new ErrorHandler('This is a team invitation, not a client invitation', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        return next(new ErrorHandler('User already exists with this email', 400));
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    try {
        // Create user account directly (no admin approval needed)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password_hash,
                account_name: name,
                focus: ["Nothing"],
                Role: "CLIENT" // Set role to CLIENT
            }
        });

        // Add client to project
        const projectClient = await prisma.projectClient.create({
            data: {
                project_id: invitation.project_id,
                user_id: user.user_id
            }
        });

        // Delete the invitation token
        await prisma.invitation.delete({
            where: { token }
        });

        res.status(201).json({
            success: true,
            message: 'Client account created successfully! You can now login.',
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.Role
            },
            projectClient: {
                project_client_id: projectClient.project_client_id,
                project_id: projectClient.project_id
            }
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to create client account: ${error.message}`, 500));
    }
});

export const joinTeamThroughInvitationPublic = catchAsyncError(async (req, res, next) => {
    const { token, email } = req.body;

    if (!token || !email) {
        return next(new ErrorHandler('Token and email are required', 400));
    }

    // Validate the token
    const invitation = await prisma.invitation.findUnique({
        where: { token }
    });

    if (!invitation || invitation.expires_at < new Date()) {
        return next(new ErrorHandler('Invalid or expired invitation link', 400));
    }

    // For team invitations, project_id can be present for project-specific team invitations
    // Only reject if this is a CLIENT invitation being processed as team invitation
    if (invitation.role === 'CLIENT') {
        return next(new ErrorHandler('This is a client invitation, not a team invitation', 400));
    }

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        return next(new ErrorHandler('User not found with this email. Please register first.', 404));
    }

    // Check if user is already in the team
    const existingTeamMember = await prisma.userTeam.findFirst({
        where: {
            user_id: user.user_id,
            leader_id: invitation.leader_id || invitation.user_id
        }
    });

    if (existingTeamMember) {
        return next(new ErrorHandler('You are already a member of this team', 400));
    }

    try {
        // Add user to team
        const teamMember = await prisma.userTeam.create({
            data: {
                user_id: user.user_id,
                leader_id: invitation.leader_id || invitation.user_id,
                role: invitation.role,
                legalRole: invitation.legalRole,
                customLegalRole: invitation.customLegalRole
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

        // Update user's main role
        if (invitation.role === 'BILLER') {
            await prisma.user.update({
                where: { user_id: user.user_id },
                data: { Role: 'BILLER' }
            });
        } else if (invitation.role === 'TEAM') {
            await prisma.user.update({
                where: { user_id: user.user_id },
                data: { Role: 'TEAM' }
            });
        }

        // Delete the invitation token
        await prisma.invitation.delete({
            where: { token }
        });

        // Send OTP to user for authentication
        await sendOTPOnMail(user, async (OTP, err) => {
            if (err) {
                console.error('Error sending OTP:', err);
                // Don't fail the request if OTP sending fails
                return;
            }
            const hash_otp = crypto.createHash('sha256').update(OTP.toString()).digest('hex');

            // Delete any existing OTPs for the user
            await prisma.oTP.deleteMany({
                where: {
                    user_id: user.user_id,
                },
            });

            await prisma.oTP.create({
                data: {
                    otp: hash_otp,
                    user_id: user.user_id
                }
            });
        });

        res.status(201).json({
            success: true,
            message: 'Successfully joined the team. Please check your email for OTP verification.',
            teamMember,
            requiresVerification: true
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to join team: ${error.message}`, 500));
    }
});

// Debug endpoint to check and update invitations
export const debugInvitations = catchAsyncError(async (req, res, next) => {
    const { email } = req.query;

    if (!email) {
        return next(new ErrorHandler('Email parameter is required', 400));
    }

    // Check for invitations with this email
    const invitationsWithEmail = await prisma.invitation.findMany({
        where: {
            invited_email: email,
            expires_at: { gte: new Date() }
        }
    });

    // Check for invitations without email
    const invitationsWithoutEmail = await prisma.invitation.findMany({
        where: {
            invited_email: null,
            role: { in: ['TEAM', 'BILLER'] },
            expires_at: { gte: new Date() }
        },
        orderBy: { expires_at: 'desc' }
    });

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { email }
    });

    res.status(200).json({
        success: true,
        data: {
            user: user ? { user_id: user.user_id, email: user.email, role: user.Role } : null,
            invitationsWithEmail,
            invitationsWithoutEmail: invitationsWithoutEmail.slice(0, 5), // Show only first 5
            totalInvitationsWithoutEmail: invitationsWithoutEmail.length
        }
    });
});


export const resendOTP = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    // Validate the request body
    if (!email) {
        return next(new ErrorHandler('Email is required', 400));
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        return next(new ErrorHandler('User not found with this email', 404));
    }

    // Generate a new OTP
    await sendOTPOnMail(user, async (OTP) => {
        const hash_otp = crypto.createHash('sha256').update(OTP.toString()).digest('hex');

        // Delete any existing OTPs for the user
        await prisma.oTP.deleteMany({
            where: {
                user_id: user.user_id,
            },
        });

        // Save the new OTP in the database
        await prisma.oTP.create({
            data: {
                otp: hash_otp,
                user_id: user.user_id,
            },
        });
    });

    res.status(200).json({
        success: true,
        message: 'A new OTP has been sent to your email.',
    });
});


export const connectGmail = catchAsyncError(async (req, res, next) => {
    const { connect_mail_password, connect_mail } = req.body;


    if (!connect_mail || !connect_mail) {
        return next(new ErrorHandler("gmail and app password required", 401));
    }

    const verify = await verifyMailPassword(connect_mail, connect_mail_password);

    if (!verify) {
        return next(new ErrorHandler("Invalid Gmail Or App Password", 401));
    }

    const user_id = req.user.user_id;
    const mergeData = `${connect_mail}|${connect_mail_password}`;
    const encryptedData = encrypt(mergeData);


    // Update user details in the database
    const updatedUser = await prisma.user.update({
        where: { user_id: user_id },
        data: {
            connect_mail_hash: encryptedData.encryptedData,
            encryption_key: encryptedData.key,
            encryption_vi: encryptedData.iv
        }
    });

    res.status(200).json({
        success: true,
        message: 'Mail Connect Successfully',
        user: updatedUser,
    });
});

// Get user data with projects and related data
export const getUserWithProjects = catchAsyncError(async (req, res, next) => {
    const user_id = req.user.user_id;

    const user = await prisma.user.findUnique({
        where: {
            user_id: user_id,
        },
        select: {
            user_id: true,
            name: true,
            email: true,
            bring: true,
            hear_about_as: true,
            focus: true,
            account_name: true,
            Role: true,
            leader_id: true,
            connect_mail_hash: true,
            Projects: {
                select: {
                    project_id: true,
                    name: true,
                    description: true,
                    priority: true,
                    filingDate: true,
                    opposing: true,
                    client_name: true,
                    client_address: true,
                    status: true,
                    phases: true,
                    created_at: true,
                    updated_at: true,
                    created_by: true,
                    Tasks: {
                        select: {
                            task_id: true,
                            name: true,
                            status: true,
                            priority: true,
                            created_at: true,
                            last_date: true,
                            assignees: {
                                select: {
                                    user: {
                                        select: {
                                            user_id: true,
                                            name: true,
                                            email: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    Clients: {
                        select: {
                            project_client_id: true,
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true
                                }
                            }
                        },
                    },
                    Members: {
                        select: {
                            project_member_id: true,
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true
                                }
                            }
                        },
                    },
                },
            },
            Collaboration: {
                select: {
                    project_member_id: true,
                    role: true,
                    legalRole: true,
                    customLegalRole: true,
                    project: {
                        select: {
                            project_id: true,
                            name: true,
                            description: true,
                            Tasks: {
                                select: {
                                    task_id: true,
                                    name: true
                                }
                            },
                            Clients: {
                                select: {
                                    project_client_id: true,
                                    user: {
                                        select: {
                                            name: true,
                                            email: true,
                                            user_id: true
                                        }
                                    }
                                },
                            },
                            Members: {
                                select: {
                                    project_member_id: true,
                                    user: {
                                        select: {
                                            name: true,
                                            email: true,
                                            user_id: true
                                        }
                                    }
                                },
                            },
                        },
                    },
                },
            },
            Services: {
                select: {
                    project_client_id: true,
                    added_at: true,
                    project: {
                        select: {
                            project_id: true,
                            name: true,
                            description: true,
                            Tasks: {
                                select: {
                                    task_id: true,
                                    name: true
                                }
                            },
                            Clients: {
                                select: {
                                    project_client_id: true,
                                    user: {
                                        select: {
                                            name: true,
                                            email: true,
                                            user_id: true
                                        }
                                    }
                                },
                            },
                            Members: {
                                select: {
                                    project_member_id: true,
                                    user: {
                                        select: {
                                            name: true,
                                            email: true,
                                            user_id: true
                                        }
                                    }
                                },
                            },
                        },
                    },
                },
            },
            Time: {
                where: {
                    status: "PROCESSING"
                },
                select: {
                    task_id: true,
                    start: true,
                    status: true,
                    end: true,
                    time_id: true
                }
            },
            teamsMember: {
                select: {
                    team_member_id: true,
                    role: true,
                    legalRole: true,
                    customLegalRole: true,
                    leader: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            }
        }
    });

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    res.status(200).json({
        success: true,
        user: user
    });
});

// Forgot Password Function
export const forgotPassword = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    console.log('🔐 Password reset requested for email:', email);

    // Validate request body
    const [err, isValidate] = await validateRequestBody(req.body, ForgotPasswordRequestBodySchema);

    if (!isValidate) {
        console.log('❌ Validation failed:', err);
        return next(new ErrorHandler(JSON.parse(err)[0]?.message, 401));
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    if (!user) {
        console.log('❌ User not found for email:', email);
        // Don't reveal if user exists or not for security
        return res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    }

    console.log('✅ User found, generating reset token for:', email);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    try {
        await prisma.user.update({
            where: { email: email },
            data: {
                reset_token: resetToken,
                reset_token_expiry: resetTokenExpiry
            }
        });
        console.log('✅ Reset token stored in database for:', email);
    } catch (dbError) {
        console.error('❌ Database error storing reset token:', dbError);
        return next(new ErrorHandler('Failed to process password reset request. Please try again later.', 500));
    }

    // Send password reset email
    try {
        console.log('📧 Attempting to send password reset email to:', email);
        await sendPasswordResetEmail(email, resetToken);
        console.log('✅ Password reset email sent successfully to:', email);

        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    } catch (emailError) {
        console.error('❌ Failed to send password reset email:', emailError);

        // Remove the reset token if email fails
        try {
            await prisma.user.update({
                where: { email: email },
                data: {
                    reset_token: null,
                    reset_token_expiry: null
                }
            });
            console.log('✅ Reset token cleaned up after email failure for:', email);
        } catch (cleanupError) {
            console.error('❌ Failed to cleanup reset token:', cleanupError);
        }

        return next(new ErrorHandler('Failed to send password reset email. Please try again later.', 500));
    }
});

// Reset Password Function
export const resetPassword = catchAsyncError(async (req, res, next) => {
    const { token, newPassword } = req.body;

    // Validate request body
    const [err, isValidate] = await validateRequestBody(req.body, ResetPasswordRequestBodySchema);

    if (!isValidate) {
        return next(new ErrorHandler(JSON.parse(err)[0]?.message, 401));
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
        where: {
            reset_token: token,
            reset_token_expiry: {
                gt: new Date()
            }
        }
    });

    if (!user) {
        return next(new ErrorHandler('Invalid or expired reset token', 400));
    }

    // Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
        where: { user_id: user.user_id },
        data: {
            password_hash: newHashedPassword,
            reset_token: null,
            reset_token_expiry: null
        }
    });

    res.status(200).json({
        success: true,
        message: 'Password has been reset successfully'
    });
});