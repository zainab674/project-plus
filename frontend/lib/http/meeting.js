import { api } from ".";

export const createMeetingRequest = async (formdata) => api.post('/meeting/create',formdata);
export const createMeetingClientRequest = async (formdata) => api.post('/meeting/create/client',formdata);
export const getsMeetingRequest = async (isScheduled) => api.get(`/meeting/get${isScheduled ? '?isScheduled=true':''}`);
export const getMeetingByIdRequest = async (id) => api.get(`/meeting/get/${id}`);
export const updateMeetingStatusRequest = async (meetingId, status) => api.put(`/meeting/status/${meetingId}`, { status });
export const deleteMeetingRequest = async (meetingId) => api.delete(`/meeting/${meetingId}`);
export const voteMeetingRequest = async (meetingId, userId, vote) => api.get(`/meeting/vote/${meetingId}?user_id=${userId}&vote=${vote}`);
export const confirmMeetingRequest = async (meetingId, userId, vote) => api.get(`/meeting/confirm/${meetingId}?user_id=${userId}&vote=${vote}`);
