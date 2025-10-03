import { api } from ".";

export const getDocuemtnRequest = async (id) => api.get(`/client/get-all/${id}`);
export const getUpdatesRequest = async (id) => api.get(`/client/get-updates/${id}`);
export const getOverviewRequest = async (date, user_id, project_id) => {
    const params = new URLSearchParams();

    if (date) params.append("date", date);
    if (user_id) params.append("user_id", user_id);
    if (project_id) params.append("project_id", project_id);

    return api.get(`/client/get-overview?${params.toString()}`);
};

export const getByDateRange = async (startDate,endDate,project_client_id) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return api.get(`/client/get-by-date-range/${project_client_id}?${params.toString()}`);
};

export const requestDocuemtnRequest = async (formdata) => api.post(`/client/request`, formdata);
export const updateStatusRequest = async (formdata) => api.post(`/client/status`, formdata);




export const getHistoryRequest = async (id) => api.get(`/client/history/${id}`);
export const getBillingRequest = async (id) => api.get(`/client/get-all-billing/${id}`);
export const createBillingRequest = async (formdata) => api.post(`/client/create-billing`, formdata);
export const updateBillingStatusRequest = async (formdata) => api.post(`/client/status-billing`, formdata);

// Billing case assignment
export const getMyAssignedCasesRequest = async () => api.get(`/billing/my-assigned-cases`);
export const getBillerAssignedCasesRequest = async () => api.get(`/billing/assigned-cases`);
export const getCaseDetailsRequest = async (projectId) => api.get(`/billing/case-details/${projectId}`);
export const getBillingConfigRequest = async (caseId) => api.get(`/billing/get-billing-config/${caseId}`);

export const getBusinessStatusRequest = async () => api.get('/billing/business-status');

export const getAllBillingEntriesRequest = async () => api.get('/billing/all-billing-entries');

export const setBillingConfigRequest = async (formdata) => api.post(`/billing/config`, formdata);

// Member rates
export const setMemberRateRequest = async (formdata) => api.post(`/billing/member-rate`, formdata);
export const getMemberRatesRequest = async (caseId) => api.get(`/billing/member-rates/${caseId}`);

// Auto-generate billing entries
export const generateTaskBillingEntryRequest = async (formdata) => api.post(`/billing/generate-task-billing`, formdata);
export const generateMeetingBillingEntryRequest = async (formdata) => api.post(`/billing/generate-meeting-billing`, formdata);
export const generateReviewBillingEntryRequest = async (formdata) => api.post(`/billing/generate-review-billing`, formdata);
export const generateProgressBillingEntryRequest = async (formdata) => api.post(`/billing/generate-progress-billing`, formdata);

// Create custom billing line item
export const createCustomBillingLineItemRequest = async (formdata) => api.post(`/billing/create-billing-line-item`, formdata);

// Get project team members
export const getProjectTeamMembersRequest = async (projectId) => api.get(`/billing/project-team-members/${projectId}`);

// Check project billing readiness
export const checkProjectBillingReadinessRequest = async (projectId) => api.get(`/billing/check-billing-readiness/${projectId}`);

// Check if activity has been billed


// Comprehensive billing for all activities
export const generateTaskCreationBillingRequest = async (taskId) => api.post(`/billing/generate-task-creation-billing/${taskId}`);
export const generateTaskUpdateBillingRequest = async (taskId, updateType) => api.post(`/billing/generate-task-update-billing/${taskId}`, { updateType });
export const generateCommentBillingRequest = async (commentId) => api.post(`/billing/generate-comment-billing/${commentId}`);
export const generateEmailBillingRequest = async (emailId) => api.post(`/billing/generate-email-billing/${emailId}`);
export const generateTranscriptionBillingRequest = async (transcriptionId) => api.post(`/billing/generate-transcription-billing/${transcriptionId}`);
export const generateMediaBillingRequest = async (mediaId) => api.post(`/billing/generate-media-billing/${mediaId}`);
export const generateComprehensiveProjectBillingRequest = async (projectId) => api.post(`/billing/generate-comprehensive-billing/${projectId}`);

// Get project billing entries
export const getProjectBillingEntriesRequest = async (projectId) => api.get(`/billing/project-billing-entries/${projectId}`);

// Delete billing entry
export const deleteBillingEntryRequest = async (lineItemId) => api.delete(`/billing/delete-billing-entry/${lineItemId}`);

// Update billing entry
export const updateBillingEntryRequest = async (lineItemId, formdata) => api.patch(`/billing/update-billing-entry/${lineItemId}`, formdata);

// Get project activities
export const getProjectActivitiesRequest = async (projectId) => api.get(`/billing/project-activities/${projectId}`);

export const getFilledRequest = async (id) => api.get(`/client/get-all-filed/${id}`);
export const updateFiledStatusRequest = async (formdata) => api.post(`/client/status-filed`, formdata);


export const getSignedRequest = async (id) => api.get(`/client/get-all-signed/${id}`);
export const updateSignedStatusRequest = async (formdata) => api.post(`/client/status-signed`, formdata);


export const getPedingDocsRequest = async () => api.get(`/client/get-peding-documents`);

export const getClientDocumentRequest = async (id) => api.get(`/client/client-document/${id}`);

export const getPedingDocsByIdRequest = async (id) => api.get(`/client/get-peding-documents/${id}`);

export const uploadDocumentRequest = async (formdata) => api.post(`/client/upload/`, formdata, {
    headers: {
        "Content-Type": "multipart/form-data"
    }
});


export const createFiledRequest = async (formdata) => api.post(`/client/create-filed`, formdata, {
    headers: {
        "Content-Type": "multipart/form-data"
    }
});


export const createSignRequest = async (formdata) => api.post(`/client/create-signed`, formdata, {
    headers: {
        "Content-Type": "multipart/form-data"
    }
});

export const uploadSignRequest = async (formdata) => api.post(`/client/upload-signed`, formdata, {
    headers: {
        "Content-Type": "multipart/form-data"
    }
});


export const giveUpdateRequest = async (formdata) => api.post(`/client/give-update/`, formdata, {
    headers: {
        "Content-Type": "multipart/form-data"
    }
});

// Debug project access
export const debugProjectAccessRequest = async (projectId) => api.get(`/billing/debug-access/${projectId}`);

// Debug case assignments
export const debugCaseAssignmentsRequest = async () => api.get('/billing/debug-case-assignments');

// Get client projects
export const getClientProjectsRequest = async () => api.get('/client/my-projects');
