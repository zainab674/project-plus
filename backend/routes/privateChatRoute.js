import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  getOrCreatePrivateConversation,
  getPrivateConversationMessages,
  savePrivateMessage,
  getPrivateConversationsList
} from "../controllers/privateChatController.js";
import singleUpload from "../middlewares/multerMiddleware.js";

const router = express.Router();

// Private chat routes
router.route('/get-or-create-conversation').post(authMiddleware, getOrCreatePrivateConversation);
router.route('/conversations').get(authMiddleware, getPrivateConversationsList);
router.route('/conversations/:private_conversation_id/messages').get(authMiddleware, getPrivateConversationMessages);
router.route('/save-message').post(authMiddleware, singleUpload, savePrivateMessage);

export default router; 