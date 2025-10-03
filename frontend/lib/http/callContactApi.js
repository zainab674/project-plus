import { api } from ".";

// Call API functions
export const createCall = async (callData) => {
    return api.post('/calls', callData);
};

export const getCallHistory = async (params = {}) => {
    return api.get('/calls', { params });
};

export const updateCallStatus = async (callId, updateData) => {
    return api.patch(`/calls/${callId}`, updateData);
};

export const updateCallDescription = async (callId, updateData) => {
    return api.patch(`/calls/${callId}/description`, updateData);
};

export const getCallStats = async (params = {}) => {
    return api.get('/calls/stats', { params });
};

export const deleteCall = async (callId) => {
    return api.delete(`/calls/${callId}`);
};

export const getCallBySid = async (callSid) => {
    return api.get(`/calls/sid/${callSid}`);
};

// Contact API functions
export const createContact = async (contactData) => {
    return api.post('/contacts', contactData);
};

export const getContacts = async (params = {}) => {
    return api.get('/contacts', { params });
};

export const getContactById = async (contactId) => {
    return api.get(`/contacts/${contactId}`);
};

export const updateContact = async (contactId, updateData) => {
    return api.patch(`/contacts/${contactId}`, updateData);
};

export const deleteContact = async (contactId) => {
    return api.delete(`/contacts/${contactId}`);
};

export const bulkImportContacts = async (contacts) => {
    return api.post('/contacts/import', { contacts });
};

export const getContactStats = async () => {
    return api.get('/contacts/stats');
};
