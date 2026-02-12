import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchNotificationsRequest,
  markAllNotificationsAsReadRequest,
  markNotificationsAsReadRequest,
} from '@/lib/http/notification';
import { useUser } from '@/providers/UserProvider';

const DEFAULT_POLL_INTERVAL = 45_000;
const MAX_NOTIFICATIONS = 50;

const mergeNotifications = (existing, incoming) => {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return existing;
  }

  const notificationMap = new Map();

  existing.forEach((notification) => {
    notificationMap.set(notification.notification_id, notification);
  });

  incoming.forEach((notification) => {
    notificationMap.set(notification.notification_id, {
      ...notificationMap.get(notification.notification_id),
      ...notification,
    });
  });

  const merged = Array.from(notificationMap.values());

  merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (merged.length > MAX_NOTIFICATIONS) {
    return merged.slice(0, MAX_NOTIFICATIONS);
  }

  return merged;
};

export const useNotificationPolling = ({
  pollInterval = DEFAULT_POLL_INTERVAL,
  pageSize,
  initialDelay = 0,
} = {}) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [loadingTimeoutElapsed, setLoadingTimeoutElapsed] = useState(false);

  const intervalRef = useRef(null);
  const isMountedRef = useRef(false);

  const latestCreatedAt = useMemo(() => {
    if (!notifications.length) {
      return null;
    }

    return notifications.reduce((latest, notification) => {
      const createdAt = new Date(notification.created_at).toISOString();
      return createdAt > latest ? createdAt : latest;
    }, notifications[0].created_at);
  }, [notifications]);

  const fetchNotifications = useCallback(
    async (options = {}) => {
      const { signal } = options;

      if (!user?.user_id) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const since = lastFetchedAt || latestCreatedAt;

        const response = await fetchNotificationsRequest({
          since,
          limit: pageSize,
          signal,
        });

        if (!response?.success) {
          throw new Error(response?.message || 'Unable to fetch notifications');
        }

        const {
          notifications: incomingNotifications = [],
          unreadCount: incomingUnreadCount = 0,
          fetchedAt,
        } = response.data || {};

        setNotifications((prev) => mergeNotifications(prev, incomingNotifications));
        setUnreadCount(incomingUnreadCount);
        setLastFetchedAt(fetchedAt || new Date().toISOString());
      } catch (err) {
        if (err?.name === 'CanceledError') {
          return;
        }
        setError(err);
      } finally {
        setIsLoading(false);
        setHasFetchedOnce(true);
      }
    },
    [user?.user_id, lastFetchedAt, latestCreatedAt, pageSize]
  );

  const isInitialLoading = !hasFetchedOnce && isLoading;

  useEffect(() => {
    let timeoutId;

    if (isInitialLoading) {
      setLoadingTimeoutElapsed(false);
      timeoutId = setTimeout(() => {
        setLoadingTimeoutElapsed(true);
      }, 8000);
    } else {
      setLoadingTimeoutElapsed(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isInitialLoading]);

  useEffect(() => {
    if (!user?.user_id) {
      return undefined;
    }

    isMountedRef.current = true;

    const controller = new AbortController();
    let startTimeoutId = null;

    const startPolling = () => {
      fetchNotifications({ signal: controller.signal, immediate: true });

      intervalRef.current = setInterval(() => {
        fetchNotifications();
      }, pollInterval);
    };

    if (initialDelay > 0) {
      startTimeoutId = setTimeout(startPolling, initialDelay);
    } else {
      startPolling();
    }

    return () => {
      isMountedRef.current = false;
      controller.abort();
      if (startTimeoutId) {
        clearTimeout(startTimeoutId);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.user_id, pollInterval, initialDelay, fetchNotifications]);

  useEffect(() => {
    if (!user?.user_id) {
      setNotifications([]);
      setUnreadCount(0);
      setLastFetchedAt(null);
    }
  }, [user?.user_id]);

  const markNotificationsRead = useCallback(
    async (notificationIds) => {
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return;
      }

      try {
        await markNotificationsAsReadRequest(notificationIds);

        setNotifications((prev) =>
          prev.map((notification) =>
            notificationIds.includes(notification.notification_id)
              ? { ...notification, is_read: true, read_at: new Date().toISOString() }
              : notification
          )
        );

        setUnreadCount((prev) => Math.max(prev - notificationIds.length, 0));
      } catch (err) {
        setError(err);
      }
    },
    []
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!notifications.length) {
      return;
    }

    try {
      await markAllNotificationsAsReadRequest();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: notification.read_at || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err);
    }
  }, [notifications.length]);

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      const unreadIds = notifications.filter((notification) => !notification.is_read).map((item) => item.notification_id);
      if (unreadIds.length) {
        markNotificationsRead(unreadIds);
      }
    }
  }, [isOpen, unreadCount, notifications, markNotificationsRead]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isInitialLoading,
    hasFetchedOnce,
    loadingTimeoutElapsed,
    error,
    isOpen,
    toggleDropdown,
    closeDropdown,
    refresh: fetchNotifications,
    markNotificationsRead,
    markAllNotificationsRead,
    lastFetchedAt,
  };
};

export default useNotificationPolling;

