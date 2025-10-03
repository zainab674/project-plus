import express from 'express';
import { login, register, verify, changePassword, updateUser, loadUser, resendOTP, googleLogin, logout, connectGmail, getTeamMembers, updateTeamMember, deleteTeamMember, updateRole, inviteTeamMember, generateTeamInvitationLink, joinTeamThroughInvitation, joinTeamThroughInvitationPublic, teamSignup, clientSignup, debugInvitations, getUserWithProjects, forgotPassword, resetPassword } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import passport from 'passport';
import { initPassport } from '../services/passportService.js';

const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/verify').post(verify);
router.route('/resend-otp').post(resendOTP);

// Password reset routes
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password').post(resetPassword);

router.route('/change-password').put(authMiddleware,changePassword);
router.route('/update').put(authMiddleware,updateUser);
router.route('/get').get(authMiddleware,loadUser);
router.route('/get-with-projects').get(authMiddleware,getUserWithProjects);
router.route('/team-members').get(authMiddleware,getTeamMembers);
router.route('/team-members/:team_member_id').patch(authMiddleware,updateTeamMember).delete(authMiddleware,deleteTeamMember);
router.route('/connect-mail').post(authMiddleware,connectGmail);
router.route('/logout').get(authMiddleware,logout);
router.route('/update-role').put(authMiddleware,updateRole);

// Team management routes
router.route('/invite-team-member').post(authMiddleware, inviteTeamMember);
router.route('/generate-team-invitation').post(authMiddleware, generateTeamInvitationLink);
router.route('/join-team').post(authMiddleware, joinTeamThroughInvitation);

// Public invitation endpoints (no authentication required)
router.route('/join-team-invitation').post(joinTeamThroughInvitationPublic);
router.route('/team-signup').post(teamSignup);
router.route('/client-signup').post(clientSignup);

// Debug endpoint (for development only)
router.route('/debug-invitations').get(debugInvitations);

//google auth
initPassport();
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'],session: false }));
router.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login',session: false }),
    googleLogin
);


export default router;