import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { rateLimit } from '../middlewares/rateLimitMiddleware.js';
import { createToken, handleVoiceWebhook, handleRecordingStatus, handleCallStatus, getNgrokInfo, getAvailableNumbers } from '../controllers/twilioController.js';

const router = express.Router();

// Apply rate limiting to token generation (50 tokens per hour per user)
router.route('/token').post(
    authMiddleware,
    rateLimit({ maxRequests: 50, windowMs: 60 * 60 * 1000 }),
    createToken
);

// TwiML webhook endpoints (no auth required - called by Twilio)
router.route('/voice-webhook').post(handleVoiceWebhook);
router.route('/recording-status').post(handleRecordingStatus);
router.route('/call-status').post(handleCallStatus);

// Get ngrok tunnel information (no auth required for easy access)
router.route('/ngrok-info').get(getNgrokInfo);

// Get available phone numbers from Twilio
router.route('/numbers/search').get(authMiddleware, getAvailableNumbers);

export default router;