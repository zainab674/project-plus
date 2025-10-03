import { api } from ".";
import axios from "axios";

// Create a separate API instance for unauthenticated requests
const publicApi = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
    withCredentials: false
});

export const registerRequest = async (FormData) => api.post('/user/register',FormData);
export const loginRequest = async (FormData) => api.post('/user/login',FormData);
export const resendotpRequest = async (FormData) => api.post('/user/resend-otp',FormData);
export const verifyotpRequest = async (FormData) => api.post('/user/verify',FormData);
export const loadUserRequest = async () => api.get('/user/get');
export const getUserWithProjectsRequest = async () => api.get('/user/get-with-projects');
export const logoutUserRequest = async () => api.get('/user/logout');
export const connectMailRequest = async (FormData) => api.post('/user/connect-mail',FormData);
export const getTeamMembersRequest = async () => api.get('/user/team-members');
export const updateTeamMemberRequest = async (team_member_id, formData) => api.patch(`/user/team-members/${team_member_id}`, formData);
export const deleteTeamMemberRequest = async (team_member_id) => api.delete(`/user/team-members/${team_member_id}`);
export const updateRoleRequest = async (formData) => api.put('/user/update-role', formData);

// New team management functions
export const inviteTeamMemberRequest = async (formData) => api.post('/user/invite-team-member', formData);
export const generateTeamInvitationRequest = async (formData) => api.post('/user/generate-team-invitation', formData);
export const joinTeamRequest = async (formData) => api.post('/user/join-team', formData);

// Public invitation functions (no authentication required)
export const joinTeamInvitationRequest = async (formData) => publicApi.post('/user/join-team-invitation', formData);
export const joinProjectInvitationRequest = async (formData) => publicApi.post('/project/join-invitation', formData);

export const teamSignupRequest = async (formData) => publicApi.post('/user/team-signup', formData);
export const clientSignupRequest = async (formData) => publicApi.post('/user/client-signup', formData);

// Password reset functions
export const forgotPasswordRequest = async (FormData) => publicApi.post('/user/forgot-password', FormData);
export const resetPasswordRequest = async (FormData) => publicApi.post('/user/reset-password', FormData);

// Admin functions
export const getAdminDashboardStats = async () => {
    return api.get('/admin/dashboard-stats');
};

export const getAdminAllRequests = async (params = {}) => {
    return api.get('/admin/requests', { params });
};

export const approveAdminRequest = async (data) => {
    return api.post('/admin/requests/approve', data);
};

export const rejectAdminRequest = async (data) => {
    return api.post('/admin/requests/reject', data);
};

// New Admin Functions for Comprehensive Dashboard
export const getAdminSystemOverview = async () => {
    return api.get('/admin/system-overview');
};

export const getAdminAllUsers = async (params = {}) => {
    return api.get('/admin/users', { params });
};

export const getAdminUserDetails = async (userId) => {
    return api.get(`/admin/users/${userId}`);
};

export const updateAdminUserRole = async (userId, role) => {
    return api.put(`/admin/users/${userId}/role`, { role });
};

export const createAdminUser = async (userData) => {
    return api.post('/admin/users/create-admin', userData);
};

export const deleteAdminUser = async (userId) => {
    return api.delete(`/admin/users/${userId}`);
};

export const getAdminAllProjects = async (params = {}) => {
    return api.get('/admin/projects', { params });
};

export const getAdminAllTasks = async (params = {}) => {
    return api.get('/admin/tasks', { params });
};

export const getAdminSystemAnalytics = async (params = {}) => {
    return api.get('/admin/analytics', { params });
};