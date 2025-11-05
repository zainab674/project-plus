import express from "express";
import { authMiddleware } from '../middlewares/authMiddleware.js'
import singleUpload from '../middlewares/multerMiddleware.js';
import { 
  getChatsUser, 
  getConversationID, 
  getConversations, 
  getConversationUsers, 
  getProjectChatMessages, 
  getPrivateChatConversationID, 
  getPrivateChatConversations, 
  testMessageSaving,
  createCustomGroup,
  getCustomGroups,
  getCustomGroupMessages,
  sendCustomGroupMessage,
  addGroupMembers,
  removeGroupMember
} from "../controllers/chatController.js";


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

// Custom Group Chat routes
router.route('/groups/create').post(authMiddleware, createCustomGroup);
router.route('/groups').get(authMiddleware, getCustomGroups);
router.route('/groups/:group_id/messages').get(authMiddleware, getCustomGroupMessages);
router.route('/groups/:group_id/messages').post(authMiddleware, singleUpload, sendCustomGroupMessage);
router.route('/groups/:group_id/members').post(authMiddleware, addGroupMembers);
router.route('/groups/:group_id/members/:user_id').delete(authMiddleware, removeGroupMember);

export default router;
