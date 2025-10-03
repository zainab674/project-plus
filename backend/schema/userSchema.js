import { z } from 'zod';


export const RegisterRequestBodySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password length must be 8 or greater'),
    account_name: z.string().min(1, 'Account name is required').optional(),
    bring: z.string().optional(),
    teams_member_count: z.string().optional(),
    focus: z.array(z.string()).min(1, 'At least one item should be provided in the bring array').optional(),
    role: z.enum(['CLIENT', 'PROVIDER', 'BILLER', 'TEAM']).optional(),
    hear_about_as: z.string().optional(),
    company_name: z.string().min(1, 'Company name is required'),
    reason: z.string().min(10, 'Please provide a detailed reason for access (minimum 10 characters)'),
    team_size: z.string().min(1, 'Team size is required'),
});



export const LoginRequestBodySchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password length must be 8 or greater')
});



export const OTPRequestBodySchema = z.object({
    OTP: z.number().min(6, 'OTP lenght shoult be 6')
});


export const ChangePasswordRequestBodySchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, "Password length must be 8 or greater."),
});

export const ForgotPasswordRequestBodySchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const ResetPasswordRequestBodySchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, "Password length must be 8 or greater."),
});


export const UpdateRequestBodySchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    password: z.string().optional(),
    account_name: z.string().optional(),
    bring: z.string().optional(),
    teams_member_count: z.string().optional(),
    focus: z.array(z.string()).optional(),
});