import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import {
  createNotification,
  createNotifications,
  getNotificationsForUser,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationsAsRead,
} from '../services/notificationService.js';
import { DEFAULT_NOTIFICATION_PAGE_SIZE } from '../constants/notificationTypeConstant.js';

export const getNotifications = catchAsyncError(async (req, res) => {
  const { since, limit } = req.query;
  const userId = req.user?.user_id;

  const parsedLimit = Number(limit);
  const take = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : DEFAULT_NOTIFICATION_PAGE_SIZE;

  const notifications = await getNotificationsForUser({
    userId,
    since,
    limit: take,
  });

  const unreadCount = await getUnreadNotificationCount({ userId });

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
      fetchedAt: new Date().toISOString(),
    },
  });
});

export const markNotificationsRead = catchAsyncError(async (req, res, next) => {
  const userId = req.user?.user_id;
  const { notificationIds } = req.body;

  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return next(new ErrorHandler('notificationIds array is required', 400));
  }

  const { count } = await markNotificationsAsRead({ userId, notificationIds });

  res.status(200).json({
    success: true,
    data: {
      updated: count,
    },
  });
});

export const markAllNotificationsRead = catchAsyncError(async (req, res) => {
  const userId = req.user?.user_id;

  const { count } = await markAllNotificationsAsRead({ userId });

  res.status(200).json({
    success: true,
    data: {
      updated: count,
    },
  });
});

// Helper endpoints (optional) for creating manual notifications via API - useful for testing
export const createNotificationForUser = catchAsyncError(async (req, res, next) => {
  const userId = req.body.userId || req.user?.user_id;
  const { eventType, message, projectId, entityType, entityId, metadata } = req.body;

  if (!eventType || !message) {
    return next(new ErrorHandler('eventType and message are required', 400));
  }

  const notification = await createNotification({
    userId,
    eventType,
    message,
    projectId,
    entityType,
    entityId,
    metadata,
  });

  res.status(201).json({
    success: true,
    data: notification,
  });
});

export const createNotificationsForUsers = catchAsyncError(async (req, res, next) => {
  const { userIds, eventType, message, projectId, entityType, entityId, metadata } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return next(new ErrorHandler('userIds array is required', 400));
  }

  if (!eventType || !message) {
    return next(new ErrorHandler('eventType and message are required', 400));
  }

  const notifications = await createNotifications({
    userIds,
    eventType,
    message,
    projectId,
    entityType,
    entityId,
    metadata,
  });

  res.status(201).json({
    success: true,
    data: notifications,
  });
});










