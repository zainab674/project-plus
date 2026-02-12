import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  getNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.post('/read', authMiddleware, markNotificationsRead);
router.post('/read-all', authMiddleware, markAllNotificationsRead);

export default router;