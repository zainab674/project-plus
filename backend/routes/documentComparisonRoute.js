import express from 'express';
import { 
    compareDocuments, 
    uploadAndCompareDocuments
} from '../controllers/documentComparisonController.js';
import { multipleUpload } from '../middlewares/multerMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import ErrorHandler from '../utils/errorHandler.js';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Document comparison service is running' });
});

// Compare two existing documents
router.post('/compare', authMiddleware, compareDocuments);

// Upload and compare two new documents
router.post('/upload-and-compare', authMiddleware, (req, res, next) => {
    multipleUpload(req, res, (err) => {
        if (err) {
            return next(new ErrorHandler('File upload error: ' + err.message, 400));
        }
        next();
    });
}, uploadAndCompareDocuments);

export default router;
