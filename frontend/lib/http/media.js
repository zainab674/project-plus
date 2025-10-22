import { api } from ".";

export const getMediaByProjectIdRequest = async (id) => api.get(`/media/project/${id}`);
export const getMediaByTaskIdRequest = async (id) => api.get(`/media/task/${id}`);
export const uploadMediaRequest = async (formdata) => api.post(`/media/upload/`,formdata,{
    headers: {
        "Content-Type": "multipart/form-data"
    }
});
export const deleteMediaRequest = async (mediaId) => api.delete(`/media/delete/${mediaId}`);
