import express from 'express';
import { 
    getPendingRequests, 
    getAllRequests, 
    approveRequest, 
    rejectRequest, 
    getRequestDetails, 
    getDashboardStats,
    getAllUsers,
    getUserDetails,
    updateUserRole,
    getSystemOverview,
    getAllProjects,
    getAllTasks,
    getSystemAnalytics,
    createAdminUser,
    deleteUser
} from '../controllers/adminController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication
router.use(authMiddleware);

// Get admin dashboard statistics
router.route('/dashboard-stats').get(getDashboardStats);

// Get system overview
router.route('/system-overview').get(getSystemOverview);

// Get all users with pagination and filtering
router.route('/users').get(getAllUsers);

// Get specific user details
router.route('/users/:userId').get(getUserDetails);

// Update user role
router.route('/users/:userId/role').put(updateUserRole);

// Create new admin user
router.route('/users/create-admin').post(createAdminUser);

// Delete user
router.route('/users/:userId').delete(deleteUser);

// Get all projects with pagination and filtering
router.route('/projects').get(getAllProjects);

// Get all tasks with pagination and filtering
router.route('/tasks').get(getAllTasks);

// Get system analytics
router.route('/analytics').get(getSystemAnalytics);

// Get pending registration requests
router.route('/requests/pending').get(getPendingRequests);

// Get all registration requests with pagination and filtering
router.route('/requests').get(getAllRequests);

// Get specific request details
router.route('/requests/:requestId').get(getRequestDetails);

// Approve registration request
router.route('/requests/approve').post(approveRequest);

// Reject registration request
router.route('/requests/reject').post(rejectRequest);

export default router;
