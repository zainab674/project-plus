import passport from 'passport';
import passportGoogle from 'passport-google-oauth20';
const GoogleStrategy = passportGoogle.Strategy;
import { prisma } from "../prisma/index.js";
import { processPendingInvitations } from "./userService.js";
import dotenv from 'dotenv';
dotenv.config();



export const initPassport = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
                clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
                callbackURL: `${process.env.BACKEND_URL}/api/v1/user/auth/google/callback`,
                passReqToCallback: true,
            },
            async (req, accessToken, refreshToken, profile, done) => {
                try {
                    const { id, displayName, emails } = profile;
                    const email = emails[0].value;
                    // Check if user exists in the database
                    let user = await prisma.user.findUnique({
                        where: { email }
                    });
                    // For new users, check for invitations and create user accordingly
                    if (!user) {
                        // Check for any valid pending invitation for this email
                        const existingInvitation = await prisma.invitation.findFirst({
                            where: {
                                invited_email: email,
                                role: { in: ['TEAM', 'BILLER'] }, // only non-client invitations
                                expires_at: { gte: new Date() }
                            },
                            orderBy: { expires_at: 'desc' }
                        });

                        const userData = {
                            name: displayName,
                            email,
                            password_hash: 'no_password',
                            account_name: displayName,
                            focus: ["Nothing"],
                            Role: existingInvitation ? existingInvitation.role : "PROVIDER" // Use invitation role if available
                        }
                        
                        user = await prisma.user.create({
                            data: userData
                        });

                        // Process any pending invitations for this email
                        await processPendingInvitations(user.user_id, email);
                    }

                    // Pass user object to the done callback
                    done(null, user);
                } catch (err) {
                    done(err, null);
                }
            }
        )
    );
}
