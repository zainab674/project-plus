import express from "express";
import {
    createReview,
    getTaskReviews,
    getReviewById,
    updateReview,
    deleteReview,
    getAllReviews,
    getPendingDocuments,
    getMySubmissions,
    acceptDocument,
    rejectDocument,
    resubmitDocument
} from "../controllers/reviewController.js";
import { authMiddleware } from '../middlewares/authMiddleware.js';
import singleUpload from "../middlewares/multerMiddleware.js";

const router = express.Router();

// ============================================
// DOCUMENT REVIEW ROUTES
// ============================================

// Get documents pending lawyer review
router.get("/documents/pending", authMiddleware, getPendingDocuments);

// Get user's submitted documents
router.get("/documents/my-submissions", authMiddleware, getMySubmissions);

// Accept/Reject/Resubmit document
router.post("/documents/:id/accept", authMiddleware, acceptDocument);
router.post("/documents/:id/reject", authMiddleware, rejectDocument);
router.post("/documents/:id/resubmit", authMiddleware, resubmitDocument);


// ============================================
// TASK REVIEW ROUTES
// ============================================

// Create a new review submission (with optional file upload)
router
    .route("/")
    .post(authMiddleware, singleUpload, createReview);

// Get all reviews for a specific task
router
    .route("/task/:task_id")
    .get(authMiddleware, getTaskReviews);



// Get a specific review by ID
router
    .route("/:review_id")
    .get(authMiddleware, getReviewById)
    .patch(authMiddleware, updateReview)
    .delete(authMiddleware, deleteReview);

// Get all reviews (for admin dashboard)
router
    .route("/")
    .get(authMiddleware, getAllReviews);

export default router;