import express from 'express';
import { 
    compareDocuments, 
    uploadAndCompareDocuments,
    rephraseDocument,
    instructOnDocuments,
    exportDocxTrackChanges,
    exportDocxTrackChangesInplace,
    exportDocxFinal,
    convertDocxTrackChangesToHtml,
    createDocxFromText
} from '../controllers/aiLegalDocController.js';
import singleUpload, { multipleUpload } from '../middlewares/multerMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import ErrorHandler from '../utils/errorHandler.js';
import multer from 'multer';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'AI Legal Doc service is running' });
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

// Rephrase one uploaded document
router.post('/rephrase', authMiddleware, (req, res, next) => {
    singleUpload(req, res, (err) => {
        if (err) {
            return next(new ErrorHandler('File upload error: ' + err.message, 400));
        }
        next();
    });
}, rephraseDocument);

// Generic instruction over documents (multi-file supported)
router.post('/instruct', authMiddleware, (req, res, next) => {
    multipleUpload(req, res, (err) => {
        if (err) {
            return next(new ErrorHandler('File upload error: ' + err.message, 400));
        }
        next();
    });
}, instructOnDocuments);

// Export Word-compatible .docx with highlighted changes
router.post('/export-docx-track-changes', authMiddleware, exportDocxTrackChanges);
const uploadMemory = multer({ storage: multer.memoryStorage() });
router.post('/export-docx-track-changes-inplace', authMiddleware, (req, res, next) => {
    // single file field: original_docx
    const handler = uploadMemory.single('original_docx');
    handler(req, res, (err) => {
        if (err) {
            return next(new ErrorHandler('File upload error: ' + err.message, 400));
        }
        next();
    });
}, exportDocxTrackChangesInplace);

// Convert DOCX with tracked changes to HTML for inline display
router.post('/convert-docx-to-html', authMiddleware, (req, res, next) => {
    const handler = uploadMemory.single('original_docx');
    handler(req, res, (err) => {
        if (err) {
            return next(new ErrorHandler('File upload error: ' + err.message, 400));
        }
        next();
    });
}, convertDocxTrackChangesToHtml);

// Create a DOCX file from plain text
router.post('/create-docx-from-text', authMiddleware, createDocxFromText);

// Export final DOCX by applying revised text to original DOCX without tracked changes
router.post('/export-docx-final', authMiddleware, (req, res, next) => {
    // single file field: original_docx
    const handler = uploadMemory.single('original_docx');
    handler(req, res, (err) => {
        if (err) {
            return next(new ErrorHandler('File upload error: ' + err.message, 400));
        }
        next();
    });
}, exportDocxFinal);

export default router;
