import { prisma } from '../prisma/index.js';
import { DEFAULT_NOTIFICATION_PAGE_SIZE } from '../constants/notificationTypeConstant.js';

const baseSelect = {
  notification_id: true,
  user_id: true,
  project_id: true,
  entity_type: true,
  entity_id: true,
  event_type: true,
  message: true,
  metadata: true,
  is_read: true,
  created_at: true,
  read_at: true,
};

export const createNotification = async ({
  userId,
  eventType,
  message,
  projectId = null,
  entityType = null,
  entityId = null,
  metadata = null,
}) => {
  if (!userId) {
    throw new Error('userId is required to create a notification');
  }

  if (!eventType) {
    throw new Error('eventType is required to create a notification');
  }

  if (!message) {
    throw new Error('message is required to create a notification');
  }

  const notification = await prisma.notification.create({
    data: {
      user_id: userId,
      project_id: projectId,
      entity_type: entityType,
      entity_id: entityId,
      event_type: eventType,
      message,
      metadata,
    },
    select: baseSelect,
  });

  return notification;
};

export const createNotifications = async ({
  userIds = [],
  eventType,
  message,
  projectId = null,
  entityType = null,
  entityId = null,
  metadata = null,
}) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const notifications = await prisma.$transaction(
    userIds.map((userId) =>
      prisma.notification.create({
        data: {
          user_id: userId,
          project_id: projectId,
          entity_type: entityType,
          entity_id: entityId,
          event_type: eventType,
          message,
          metadata,
        },
        select: baseSelect,
      })
    )
  );

  return notifications;
};

export const getNotificationsForUser = async ({
  userId,
  since,
  limit = DEFAULT_NOTIFICATION_PAGE_SIZE,
}) => {
  if (!userId) {
    throw new Error('userId is required to fetch notifications');
  }

  const where = {
    user_id: userId,
  };

  if (since) {
    where.created_at = {
      gt: new Date(since),
    };
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: limit,
    select: baseSelect,
  });

  return notifications;
};

export const getUnreadNotificationCount = async ({ userId }) => {
  if (!userId) {
    throw new Error('userId is required to fetch unread notification count');
  }

  const count = await prisma.notification.count({
    where: {
      user_id: userId,
      is_read: false,
    },
  });

  return count;
};

export const markNotificationsAsRead = async ({ userId, notificationIds = [] }) => {
  if (!userId) {
    throw new Error('userId is required to mark notifications as read');
  }

  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return { count: 0 };
  }

  const result = await prisma.notification.updateMany({
    where: {
      user_id: userId,
      notification_id: { in: notificationIds },
      is_read: false,
    },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });

  return result;
};

export const markAllNotificationsAsRead = async ({ userId }) => {
  if (!userId) {
    throw new Error('userId is required to mark notifications as read');
  }

  const result = await prisma.notification.updateMany({
    where: {
      user_id: userId,
      is_read: false,
    },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });

  return result;
};

export const getProjectMemberUserIds = async ({ projectId }) => {
  if (!projectId) {
    return [];
  }

  const members = await prisma.projectMember.findMany({
    where: { project_id: projectId },
    select: { user_id: true },
  });

  return members.map((member) => member.user_id);
};

export const getTaskInvolvedUserIds = async ({ taskId }) => {
  if (!taskId) {
    return [];
  }

  const task = await prisma.task.findUnique({
    where: { task_id: taskId },
    select: {
      created_by: true,
      assigned_to: true,
      assignees: {
        select: { user_id: true },
      },
    },
  });

  if (!task) {
    return [];
  }

  const userIds = new Set();

  if (task.created_by) {
    userIds.add(task.created_by);
  }

  if (task.assigned_to) {
    userIds.add(task.assigned_to);
  }

  task.assignees.forEach((assignee) => {
    userIds.add(assignee.user_id);
  });

  return Array.from(userIds);
};

export const notifyProjectMembers = async ({
  projectId,
  actorId,
  eventType,
  message,
  entityType = null,
  entityId = null,
  metadata = null,
  includeUserIds = [],
  includeActor = true,
}) => {
  if (!projectId) {
    return [];
  }

  const [projectUserIds, additionalUserIds] = await Promise.all([
    getProjectMemberUserIds({ projectId }),
    Promise.resolve(includeUserIds),
  ]);

  const uniqueUserIds = new Set([...projectUserIds, ...additionalUserIds]);

  if (!includeActor && actorId) {
    uniqueUserIds.delete(actorId);
  }

  const recipients = Array.from(uniqueUserIds);

  if (recipients.length === 0) {
    return [];
  }

  return createNotifications({
    userIds: recipients,
    eventType,
    message,
    projectId,
    entityType,
    entityId,
    metadata,
  });
};

