import { api } from '.';

export const fetchNotificationsRequest = async ({ since, limit, signal } = {}) => {
  const params = new URLSearchParams();

  if (since) {
    params.append('since', since);
  }

  if (limit) {
    params.append('limit', limit);
  }

  const queryString = params.toString();
  const url = queryString ? `/notifications?${queryString}` : '/notifications';

  const response = await api.get(url, { signal });
  return response.data;
};

export const markNotificationsAsReadRequest = async (notificationIds) => {
  const response = await api.post('/notifications/read', {
    notificationIds,
  });
  return response.data;
};

export const markAllNotificationsAsReadRequest = async () => {
  const response = await api.post('/notifications/read-all');
  return response.data;
};

