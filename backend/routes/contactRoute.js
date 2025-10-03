import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { rateLimit } from '../middlewares/rateLimitMiddleware.js';
import {
    createContact,
    getContacts,
    getContactById,
    updateContact,
    deleteContact,
    bulkImportContacts,
    getContactStats
} from '../controllers/contactController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Contact routes
router.route('/')
    .post(
        rateLimit({ maxRequests: 200, windowMs: 60 * 60 * 1000 }), // 200 contacts per hour
        createContact
    )
    .get(getContacts);

// Bulk import contacts
router.route('/import')
    .post(
        rateLimit({ maxRequests: 10, windowMs: 60 * 60 * 1000 }), // 10 imports per hour
        bulkImportContacts
    );

// Contact statistics
router.route('/stats')
    .get(getContactStats);

// Individual contact operations
router.route('/:contact_id')
    .get(getContactById)
    .patch(updateContact)
    .delete(deleteContact);

export default router;
