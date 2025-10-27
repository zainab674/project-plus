import { useState } from 'react';

// Custom hook for notification functionality
export const useNotificationState = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationSound, setNotificationSound] = useState(true);

  return {
    notifications,
    setNotifications,
    unreadNotificationCount,
    setUnreadNotificationCount,
    notificationSound,
    setNotificationSound,
  };
};
