import express from "express";
import {
    createReview,
    getTaskReviews,
    getReviewById,
    updateReview,
    deleteReview,
    getAllReviews
} from "../controllers/reviewController.js";
import { authMiddleware } from '../middlewares/authMiddleware.js';
import singleUpload from "../middlewares/multerMiddleware.js";

const router = express.Router();

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