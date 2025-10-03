import { api } from ".";

// Create a new review submission (with optional file upload)
export const createReviewRequest = async (formData) => {
  return api.post('/review', formData);
};

// Get all reviews for a specific task
export const getTaskReviewsRequest = async (task_id) => api.get(`/review/task/${task_id}`);

// Get a specific review by ID
export const getReviewByIdRequest = async (review_id) => api.get(`/review/${review_id}`);

// Update review (approve/reject)
export const updateReviewRequest = async (review_id, data) => api.patch(`/review/${review_id}`, data);

// Delete a review
export const deleteReviewRequest = async (review_id) => api.delete(`/review/${review_id}`);



// Get all reviews across all projects (for admin dashboard)
export const getAllReviewsRequest = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.status) queryParams.append('status', params.status);
  if (params.project_id) queryParams.append('project_id', params.project_id);

  return api.get(`/review?${queryParams.toString()}`);
};

// Get tasks that need review
export const getTasksNeedingReviewRequest = async (project_id = null) => {
  const params = {};
  if (project_id) params.project_id = project_id;
  
  return api.get('/task/reviews/needing', { params });
}; 