import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
    createProject,
    getMyProjects,
    getMyProjectsWithTasks,
    getMyProjectsComprehensive,
    getProjectById,
    getProjectDetailsComprehensive,
    updateProject,
    deleteProject,
    removeMemberFromProject,
    getProjectMembers,
    generateInvitationLink,
    addMemberThroughInvitation,
    addMemberThroughInvitationPublic,
    sendInvitationViaMail,
    createFolder,
    fileUpload,
    getFolderTreeByTemplateDocument,
    sendToLawyer,
    getTemplateDocumentFiles,
    updateFileUpload,
    updateTDocumentStatus,
    sendToClient,
    getGroupChatMessages,
    createGroupChatMessage,
    getProjectGroupChatInfo,
    deleteFolder,
    deleteFile
} from '../controllers/projectController.js';
import singleUpload from "../middlewares/multerMiddleware.js";
const router = express.Router();

router.route('/get-file').get(authMiddleware, getTemplateDocumentFiles);
router.route('/send').post(authMiddleware, singleUpload, sendToLawyer);
router.route('/send-client').post(authMiddleware, singleUpload, sendToClient);


router.route('/').post(authMiddleware, createProject).get(authMiddleware, getMyProjects)
router.route('/with-tasks').get(authMiddleware, getMyProjectsWithTasks);
router.route('/comprehensive').get(authMiddleware, getMyProjectsComprehensive);
router.route('/invite').post(authMiddleware, generateInvitationLink);
router.route('/join').post(authMiddleware, addMemberThroughInvitation);

// Public invitation endpoints (no authentication required)
router.route('/join-invitation').post(addMemberThroughInvitationPublic);
router.route('/send-via-mail').post(authMiddleware, sendInvitationViaMail);

// Document management routes (must come before parameterized routes)
router.route('/folder').post(authMiddleware, createFolder);
router.route('/folder/:folder_id').delete(authMiddleware, deleteFolder);
router.route('/file').post(authMiddleware, singleUpload, fileUpload)
router.route('/file/:file_id').delete(authMiddleware, deleteFile);
router.route('/file/update').put(authMiddleware, singleUpload, updateFileUpload);
router.route('/tree').get(authMiddleware, getFolderTreeByTemplateDocument);
router.route('/tree/:project_id').get(authMiddleware, getFolderTreeByTemplateDocument);

// Project-specific routes (must come after specific routes)
router.route('/:id').get(authMiddleware, getProjectById).patch(authMiddleware, updateProject).delete(authMiddleware, deleteProject);
router.route('/:id/comprehensive').get(authMiddleware, getProjectDetailsComprehensive);
router.route('/members/:project_member_id').delete(authMiddleware, removeMemberFromProject);
router.route('/:project_id/members').get(authMiddleware, getProjectMembers);

router.route('/update-t-document-status/:id').put(authMiddleware, updateTDocumentStatus);

// Group Chat Routes
router.route('/:project_id/chat/info').get(authMiddleware, getProjectGroupChatInfo);
router.route('/:project_id/chat/:task_id/messages').get(authMiddleware, getGroupChatMessages);
router.route('/:project_id/chat/:task_id/messages').post(authMiddleware, singleUpload, createGroupChatMessage);

export default router;