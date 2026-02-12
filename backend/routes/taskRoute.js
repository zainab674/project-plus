import express from "express";
import {
    createTask,
    getTasksByProject,
    updateTask,
    deleteTask,
    addMembersToTask,
    addTranscibtion,
    getTaskById,
    addComments,
    addEmail,
    getMails,
    getProgress,
    getConnectMails,
    manualEmailPoll,
    addMailClient,
    getAllTaskProgress,
    getProjectTaskDetails,
    createTime,
    stopTime,
    getComments,
    getTasksNeedingReview,
    getAllUserTasks,
    createSignatureEmail,
    createDocumentRequestEmail,
    getTimeEfficiencyData,
    checkMeetingEmails,
    addTaskNote,
    getTaskNotes,
    createTaskUpdate,
    getTaskUpdates,
    getTaskUpdatesByTask,
    markTaskUpdatesAsRead,
} from "../controllers/taskController.js";
import { authMiddleware } from '../middlewares/authMiddleware.js'
import singleUpload, { multipleUpload } from "../middlewares/multerMiddleware.js";

const router = express.Router();

router
    .route("/")
    .post(authMiddleware, singleUpload, createTask);

// Get all tasks for user dashboard
router
    .route("/user/all")
    .get(authMiddleware, getAllUserTasks);

router
    .route("/get-connect-mails").get(authMiddleware, getConnectMails);

router
    .route("/manual-email-poll").post(authMiddleware, manualEmailPoll);

// Time efficiency route - must come before parameterized routes
router
    .route("/time-efficiency").get(authMiddleware, getTimeEfficiencyData);

router
    .route("/transcribe").post(authMiddleware, singleUpload, addTranscibtion);

router
    .route("/comment").post(authMiddleware, addComments);

router
    .route("/email").post(authMiddleware, singleUpload, addEmail);
router
    .route("/email/client").post(authMiddleware, singleUpload, addMailClient);

// New routes for signature and document request emails
router
    .route("/email/signature").post(authMiddleware, createSignatureEmail);
router
    .route("/email/document-request").post(authMiddleware, createDocumentRequestEmail);

router
    .route("/emails/get-emails").get(authMiddleware, getMails);

router
    .route("/emails/check-meeting-emails").get(authMiddleware, checkMeetingEmails);

router
    .route("/progress/get-progress").get(authMiddleware, getAllTaskProgress);

router
    .route("/project/details").get(authMiddleware, getProjectTaskDetails);

router
    .route("/needing-review").get(authMiddleware, getTasksNeedingReview);

// Task Updates routes - must come before parameterized routes
router
    .route("/update").post(authMiddleware, multipleUpload, createTaskUpdate);
router
    .route("/updates").get(authMiddleware, getTaskUpdates);
router
    .route("/updates/mark-read").post(authMiddleware, markTaskUpdatesAsRead);

router
    .route("/note").post(authMiddleware, addTaskNote);

// Parameterized routes - must come after specific routes
router
    .route("/:task_id")
    .patch(authMiddleware, updateTask)
    .delete(authMiddleware, deleteTask)
    .get(authMiddleware, getTaskById);

router
    .route("/:project_id/")
    .get(getTasksByProject);

router
    .route("/members/add/:task_id")
    .post(authMiddleware, addMembersToTask);

router
    .route("/comment/:task_id").get(authMiddleware, getComments);

router
    .route("/note/:task_id").get(authMiddleware, getTaskNotes);

router
    .route("/progress/get-progress/:task_id").get(authMiddleware, getProgress);

router
    .route("/time/:task_id").post(authMiddleware, createTime);
router
    .route("/time-stop/:time_id").post(authMiddleware, stopTime);

router
    .route("/:task_id/updates").get(authMiddleware, getTaskUpdatesByTask);

export default router;
