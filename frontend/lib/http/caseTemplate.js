import { api } from ".";

// Get all case templates with filtering and pagination
export const getAllCaseTemplatesRequest = async (params = {}) => {
    return api.get('/case-templates', { params });
};

// Get a single case template by ID
export const getCaseTemplateByIdRequest = async (templateId) => {
    return api.get(`/case-templates/${templateId}`);
};

// Create a new case template
export const createCaseTemplateRequest = async (templateData) => {
    return api.post('/case-templates', templateData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// Update a case template
export const updateCaseTemplateRequest = async (templateId, templateData) => {
    return api.put(`/case-templates/${templateId}`, templateData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// Delete a case template (soft delete)
export const deleteCaseTemplateRequest = async (templateId) => {
    return api.delete(`/case-templates/${templateId}`);
};

// Upload file to template folder
export const uploadTemplateFileRequest = async (templateId, formData) => {
    return api.post(`/case-templates/${templateId}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// Create folder in template
export const createTemplateFolderRequest = async (templateId, folderData) => {
    return api.post(`/case-templates/${templateId}/folders`, folderData);
};

// Use template to create project
export const useTemplateForProjectRequest = async (templateId, projectData) => {
    return api.post(`/case-templates/${templateId}/use`, projectData);
};

// Get template categories
export const getTemplateCategoriesRequest = async () => {
    return api.get('/case-templates/categories');
};

// Get template statistics
export const getTemplateStatsRequest = async () => {
    return api.get('/case-templates/stats');
};

// Test database connection (for debugging)
export const testDatabaseConnectionRequest = async () => {
    return api.get('/case-templates/test-db');
};
