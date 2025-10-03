import { api } from '.';

// Assign case to biller
export const assignCaseToBillerRequest = async (assignmentData) => {
    return await api.post('/billing/assign-case', assignmentData);
};

// Get cases assigned to billers (for project owners/admins)
export const getBillerAssignedCasesRequest = async () => {
    return await api.get('/billing/assigned-cases');
};

// Get my assigned cases (for billers)
export const getMyAssignedCasesRequest = async () => {
    return await api.get('/billing/my-assigned-cases');
};

// Get client billing activities for a specific project
export const getClientBillingActivitiesRequest = async (projectId) => {
    return await api.get(`/billing/client-billing-activities/${projectId}`);
};










