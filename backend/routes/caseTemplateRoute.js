import express from "express";
import {
    testDatabaseConnection,
    getAllCaseTemplates,
    getCaseTemplateById,
    createCaseTemplate,
    updateCaseTemplate,
    deleteCaseTemplate,
    uploadTemplateFile,
    createTemplateFolder,
    useTemplateForProject,
    getTemplateCategories,
    getTemplateStats,
    saveDocumentAsTemplate,
    getTemplatesByTaskId
} from "../controllers/caseTemplateController.js";
import { authMiddleware } from '../middlewares/authMiddleware.js';
import singleUpload, { multipleUpload } from "../middlewares/multerMiddleware.js";

const router = express.Router();

// Test database connection (for debugging)
router
    .route("/test-db")
    .get(testDatabaseConnection);

// Get all case templates with filtering and pagination
router
    .route("/")
    .get(authMiddleware, getAllCaseTemplates)
    .post(authMiddleware, multipleUpload, createCaseTemplate);

// Get template categories
router
    .route("/categories")
    .get(authMiddleware, getTemplateCategories);

// Get template statistics
router
    .route("/stats")
    .get(authMiddleware, getTemplateStats);

// Get single template by ID
router
    .route("/:templateId")
    .get(authMiddleware, getCaseTemplateById)
    .put(authMiddleware, multipleUpload, updateCaseTemplate)
    .delete(authMiddleware, deleteCaseTemplate);

// Upload file to template
router
    .route("/:templateId/upload")
    .post(authMiddleware, singleUpload, uploadTemplateFile);

// Create folder in template
router
    .route("/:templateId/folders")
    .post(authMiddleware, createTemplateFolder);

// Use template to create project
router
    .route("/:templateId/use")
    .post(authMiddleware, multipleUpload, useTemplateForProject);

// Save edited document as template
router
    .route("/save-document")
    .post(authMiddleware, singleUpload, saveDocumentAsTemplate);

// Get templates by task ID
router
    .route("/by-task/:taskId")
    .get(authMiddleware, getTemplatesByTaskId);

export default router;
