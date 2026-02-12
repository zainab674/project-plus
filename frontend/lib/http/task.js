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
export const addTaskNoteRequest = async (formdata) => api.post(`/task/note`, formdata);
export const getTaskNotesRequest = async (task_id) => api.get(`/task/note/${task_id}`);
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

// Task Updates API functions
export const createTaskUpdateRequest = async (formData) => {
    return api.post('/task/update', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

export const getTaskUpdatesRequest = async (filters = {}) => {
    const params = new URLSearchParams();
    // Only add valid numeric IDs, skip 'all', empty, undefined, or null values
    const appendId = (key, value) => {
        const parsed = parseInt(value);
        if (!isNaN(parsed) && parsed > 0) {
            params.append(key, parsed);
        }
    };

    if (Array.isArray(filters.user_ids) && filters.user_ids.length > 0) {
        const uniqueUserIds = [...new Set(filters.user_ids)];
        uniqueUserIds.forEach((id) => appendId('user_ids[]', id));
    } else if (filters.user_id && 
        filters.user_id !== 'all' && 
        filters.user_id !== '' && 
        filters.user_id !== undefined && 
        filters.user_id !== null &&
        !isNaN(parseInt(filters.user_id)) &&
        parseInt(filters.user_id) > 0) {
        appendId('user_id', filters.user_id);
    }

    if (filters.project_id && 
        filters.project_id !== 'all' && 
        filters.project_id !== '' && 
        filters.project_id !== undefined && 
        filters.project_id !== null &&
        !isNaN(parseInt(filters.project_id)) &&
        parseInt(filters.project_id) > 0) {
        appendId('project_id', filters.project_id);
    }

    if (Array.isArray(filters.task_ids) && filters.task_ids.length > 0) {
        const uniqueTaskIds = [...new Set(filters.task_ids)];
        uniqueTaskIds.forEach((id) => appendId('task_ids[]', id));
    } else if (filters.task_id && 
        filters.task_id !== 'all' && 
        filters.task_id !== '' && 
        filters.task_id !== undefined && 
        filters.task_id !== null &&
        !isNaN(parseInt(filters.task_id)) &&
        parseInt(filters.task_id) > 0) {
        appendId('task_id', filters.task_id);
    }
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.read_status) params.append('read_status', filters.read_status);
    if (filters.limit && !isNaN(parseInt(filters.limit))) params.append('limit', parseInt(filters.limit));
    
    return api.get(`/task/updates${params.toString() ? `?${params.toString()}` : ''}`);
};

export const getTaskUpdatesByTaskRequest = async (task_id) => {
    return api.get(`/task/${task_id}/updates`);
};

export const markTaskUpdatesAsReadRequest = async (updateIds = []) => {
    return api.post(`/task/updates/mark-read`, {
        update_ids: updateIds
    });
};