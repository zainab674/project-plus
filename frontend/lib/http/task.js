import { api } from ".";

export const createTaskRequest = async (FormData) => api.post('/task', FormData);
export const updateTaskRequest = async (FormData, task_id) => api.patch(`/task/${task_id}`, FormData);
export const deleteTaskRequest = async (task_id) => api.delete(`/task/${task_id}`);
export const getTaskByIdRequest = async (task_id) => api.get(`/task/${task_id}`);
export const getAllUserTasksRequest = async (date_range) => api.get(`/task/user/all${date_range ? `?date_range=${date_range}` : ''}`);
export const addTaskTranscribtionRequest = async (formdata) => api.post(`/task/transcribe`, formdata, {
  headers: {
    'Content-Type': 'multipart/form-data',
  }
});
export const addTaskCommentsRequest = async (formdata) => api.post(`/task/comment`, formdata);
export const getTaskCommentsRequest = async (task_id) => api.get(`/task/comment/${task_id}`);
export const sendTaskEmailRequest = async (formdata) => api.post(`/task/email`, formdata, {
  headers: {
    'Content-Type': 'multipart/form-data',
  }
});
export const sendEmailToClientRequest = async (formdata) => api.post(`/task/email/client`, formdata, {
  headers: {
    'Content-Type': 'multipart/form-data',
  }
});
export const getTaskEmailRequest = async (date) => api.get(`/task/emails/get-emails${date ? `?date=${date}` : ''}`);

export const checkMeetingEmailsRequest = async () => api.get('/task/emails/check-meeting-emails');
export const getTaskProgressRequest = async (id, date) => api.get(`/task/progress/get-progress/${id}${date ? `?date=${date}` : ''}`);
export const createTimeRequest = async (id) => api.post(`/task/time/${id}`);
export const stopTimeRequest = async (id, formdata) => api.post(`/task/time-stop/${id}`, formdata);
export const getAllTaskProgressRequest = async (sdate, edate, type, project_id) => {
  const params = {};
  if (sdate) params.sdate = sdate;
  if (edate) params.edate = edate;
  if (type) params.type = type;
  if (project_id) params.project_id = project_id;

  return api.get('/task/progress/get-progress', { params });
};
export const getConnectMailsRequest = async (count = 100) => api.get(`/task/get-connect-mails?count=${count}`);
export const manualEmailPollRequest = async () => api.post(`/task/manual-email-poll`);

export const getTimeEfficiencyDataRequest = async (project_id) => {
    const params = new URLSearchParams();
    if (project_id) params.append("project_id", project_id);
    
    return api.get(`/task/time-efficiency${params.toString() ? `?${params.toString()}` : ''}`);
};

export const getProjectTaskDetailsRequest = async (project_id) => {
    return api.get(`/task/project/details?project_id=${project_id}`);
};