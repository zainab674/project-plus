import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { rateLimit } from '../middlewares/rateLimitMiddleware.js';
import {
    createCall,
    getCallHistory,
    updateCallStatus,
    updateCallDescription,
    getCallStats,
    deleteCall,
    getCallBySid
} from '../controllers/callController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Call routes
router.route('/')
    .post(
        rateLimit({ maxRequests: 100, windowMs: 60 * 60 * 1000 }), // 100 calls per hour
        createCall
    )
    .get(getCallHistory);

// Call statistics
router.route('/stats')
    .get(getCallStats);

// Call by SID (for webhook updates)
router.route('/sid/:call_sid')
    .get(getCallBySid);

// Individual call operations
router.route('/:call_id')
    .patch(updateCallStatus)
    .delete(deleteCall);

// Call description update
router.route('/:call_id/description')
    .patch(updateCallDescription);

export default router;
