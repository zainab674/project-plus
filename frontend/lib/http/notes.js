import { api } from ".";

// Create a new note
export const createNoteRequest = async (noteData) => {
  try {
    const formData = new FormData();
    
    // Add text fields
    formData.append('project_id', noteData.project_id || '');
    formData.append('task_id', noteData.task_id || '');
    formData.append('content', noteData.content);
    formData.append('note_type', noteData.note_type || 'general');
    
    // Add file if present
    if (noteData.file) {
      formData.append('file', noteData.file);
    }

    const response = await api.post('/notes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

// Get notes for a project
export const getProjectNotesRequest = async (projectId, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `/notes/project/${projectId}?${queryParams}` : `/notes/project/${projectId}`;
    const response = await api.get(url);

    return response.data;
  } catch (error) {
    console.error('Error fetching project notes:', error);
    throw error;
  }
};

// Get notes for a task
export const getTaskNotesRequest = async (taskId, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `/notes/task/${taskId}?${queryParams}` : `/notes/task/${taskId}`;
    const response = await api.get(url);

    return response.data;
  } catch (error) {
    console.error('Error fetching task notes:', error);
    throw error;
  }
};

// Get user's recent notes
export const getUserRecentNotesRequest = async (limit = 10) => {
  try {
    const response = await api.get(`/notes/recent?limit=${limit}`);

    return response.data;
  } catch (error) {
    console.error('Error fetching recent notes:', error);
    throw error;
  }
};

// Update a note
export const updateNoteRequest = async (noteId, noteData) => {
  try {
    const response = await api.put(`/notes/${noteId}`, noteData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

// Delete a note
export const deleteNoteRequest = async (noteId) => {
  try {
    const response = await api.delete(`/notes/${noteId}`);

    return response.data;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};
