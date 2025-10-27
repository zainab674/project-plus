import { api } from ".";

export const createProjectRequest = async (projectData, files = []) => {
    const formData = new FormData();
    
 
    
    // Add all project data fields as JSON string
    formData.append('projectData', JSON.stringify(projectData));
    
    // Add files
    files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
    });
    
    // Don't set Content-Type header - let axios/browser set it with boundary
    return api.post('/project', formData);
};
export const updateProjectRequest = async (FormData, project_id) => api.patch(`/project/${project_id}`, FormData);
export const deleteProjectRequest = async (project_id) => api.delete(`/project/${project_id}`);

export const getProjectRequest = async (project_id) => api.get(`/project/${project_id}`);
export const getProjectComprehensiveRequest = async (project_id) => api.get(`/project/${project_id}/comprehensive`);
export const getAllProjectRequest = async () => api.get(`/project/`);
export const getAllProjectWithTasksRequest = async () => api.get(`/project/with-tasks`);
export const getAllProjectComprehensiveRequest = async () => api.get(`/project/comprehensive`);
export const invitePeopleRequest = async (formdata) => api.post(`/project/invite`, formdata);
export const sendViaMailRequest = async (formdata) => api.post(`/project/send-via-mail`, formdata);
export const joinProjectRequest = async (formdata) => api.post(`/project/join`, formdata);
export const joinClientProjectRequest = async (formdata, project_id) => api.post(`/project/${project_id}/join`, formdata);


export const createFolderRequest = async (formdata) => api.post(`/project/folder`, formdata);
export const deleteFolderRequest = async (folder_id) => api.delete(`/project/folder/${folder_id}`);
export const createFileRequest = async (formdata) => api.post(`/project/file`, formdata, {
    headers: {
        'Content-Type': 'application/form-data'
    }
});
export const deleteFileRequest = async (file_id) => api.delete(`/project/file/${file_id}`);
export const updateFileRequest = async (formdata) => api.put(`/project/file/update`, formdata, {
    headers: {
        'Content-Type': 'application/form-data'
    }
});
export const getFilesRequest = async (params = {}) => {
    const { id, phase } = params;
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (phase) {
        queryParams.append('phase', phase);
    }
    
    const queryString = queryParams.toString();
    const url = id ? `/project/tree/${id}` : `/project/tree`;
    const finalUrl = queryString ? `${url}?${queryString}` : url;
    
    return api.get(finalUrl);
};

export const checkPhaseHasFoldersRequest = async (projectId, phase) => {
    const queryParams = new URLSearchParams();
    if (phase) {
        queryParams.append('phase', phase);
    }
    
    const queryString = queryParams.toString();
    const url = `/project/check-phase-folders/${projectId}`;
    const finalUrl = queryString ? `${url}?${queryString}` : url;
    
    return api.get(finalUrl);
};
export const getTemplateFileRequest = async () => api.get(`/project/get-file`);
export const sendToLawyerRequest = async (formdata) => api.post(`/project/send`, formdata, {
    headers: {
        'Content-Type': 'application/form-data'
    }
});
export const sendToClientRequest = async (formdata) => api.post(`/project/send-client`, formdata, {
    headers: {
        'Content-Type': 'application/form-data'
    }
});

export const updateLawyerSendedDocumentRequest = async (id, formdata) => api.put(`/project/update-t-document-status/${id}`, formdata);


