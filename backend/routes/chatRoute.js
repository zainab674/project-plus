import express from "express";
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { getChatsUser, getConversationID, getConversations, getConversationUsers, getProjectChatMessages, getPrivateChatConversationID, getPrivateChatConversations, testMessageSaving } from "../controllers/chatController.js";


const router = express.Router();
router.route('/get-conversation-id').post(authMiddleware, getConversationID);
router.route('/get-conversations/:conversation_id').get(authMiddleware, getConversations);
router.route('/get-users/').get(authMiddleware, getChatsUser);
router.route('/get-conversation-users/').get(authMiddleware, getConversationUsers);

// Private chat routes
router.route('/private/get-conversation-id').post(authMiddleware, getPrivateChatConversationID);
router.route('/private/get-conversations/:conversation_id').get(authMiddleware, getPrivateChatConversations);

// Test route
router.route('/test-save-message').post(authMiddleware, testMessageSaving);

export default router;
