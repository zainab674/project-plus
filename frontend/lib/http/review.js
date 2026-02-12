import { api } from "./index";

// Get documents pending lawyer review
export const getPendingDocumentsRequest = async () => api.get(`/review/documents/pending`);

// Get user's submitted documents
export const getMySubmissionsRequest = async () => api.get(`/review/documents/my-submissions`);

// Accept document
export const acceptDocumentRequest = async (id) => api.post(`/review/documents/${id}/accept`);

// Reject document
export const rejectDocumentRequest = async (id, reason) => api.post(`/review/documents/${id}/reject`, { rejection_reason: reason });

// Resubmit document
export const resubmitDocumentRequest = async (id) => api.post(`/review/documents/${id}/resubmit`);

// ============================================
// TASK REVIEW ROUTES
// ============================================

// Create a new review submission (with optional file upload)
export const createReviewRequest = async (formData) => api.post(`/review`, formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    }
});

// Get all reviews for a specific task
export const getTaskReviewsRequest = async (task_id) => api.get(`/review/task/${task_id}`);

// Update review (approve/reject)
export const updateReviewRequest = async (review_id, data) => api.patch(`/review/${review_id}`, data);