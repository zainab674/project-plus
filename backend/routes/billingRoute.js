import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
    setBillingConfig,
    getBillingConfig,
    assignCaseToBiller,
    getBillerAssignedCases,
    getMyAssignedCases,
    getCaseDetails,
    setMemberRate,
    getMemberRates,
    generateTaskBillingEntry,
    generateMeetingBillingEntry,
    generateReviewBillingEntry,
    generateProgressBillingEntry,
    getProjectBillingEntries,
    getProjectActivities,
    generateTaskCreationBilling,
    generateTaskUpdateBilling,
    generateCommentBilling,
    generateEmailBilling,
    generateTranscriptionBilling,
    generateMediaBilling,
    generateComprehensiveProjectBilling,
    createCustomBillingLineItem,
    getProjectTeamMembers,
    checkProjectBillingReadiness,
    debugProjectAccess,
    debugCaseAssignments,
    deleteBillingEntry,
    updateBillingEntry,
    getBusinessStatus,
    getAllBillingEntries,
    getClientBillingActivities
} from '../controllers/billingController.js';

const router = express.Router();

// 🔹 Get Billing Configuration
router.route('/get-billing-config/:caseId').get(authMiddleware, getBillingConfig);

// 🔹 Get Business Status
router.route('/business-status').get(authMiddleware, getBusinessStatus);

// 🔹 Get All Billing Entries for User's Projects
router.route('/all-billing-entries').get(authMiddleware, getAllBillingEntries);

// 🔹 Set Billing Configuration
router.route('/config').post(authMiddleware, setBillingConfig);

// 🔹 Assign Case to Biller
router.route('/assign-case').post(authMiddleware, assignCaseToBiller);

// 🔹 Get My Assigned Cases (for billers)
router.route('/my-assigned-cases').get(authMiddleware, getMyAssignedCases);

// 🔹 Get All Assigned Cases (for project owners/admins)
router.route('/assigned-cases').get(authMiddleware, getBillerAssignedCases);

// 🔹 Get Case Details
router.route('/case-details/:projectId').get(authMiddleware, getCaseDetails);

// 🔹 Set Member Rate
router.route('/member-rate').post(authMiddleware, setMemberRate);

// 🔹 Get Member Rates
router.route('/member-rates/:caseId').get(authMiddleware, getMemberRates);

// 🔹 Generate Task Billing Entry
router.route('/generate-task-billing').post(authMiddleware, generateTaskBillingEntry);

// 🔹 Generate Meeting Billing Entry
router.route('/generate-meeting-billing').post(authMiddleware, generateMeetingBillingEntry);

// 🔹 Generate Review Billing Entry
router.route('/generate-review-billing').post(authMiddleware, generateReviewBillingEntry);

// 🔹 Generate Progress Billing Entry
router.route('/generate-progress-billing').post(authMiddleware, generateProgressBillingEntry);

// 🔹 Create Custom Billing Line Item
router.route('/create-billing-line-item').post(authMiddleware, createCustomBillingLineItem);

// 🔹 Get Project Billing Entries
router.route('/project-billing-entries/:projectId').get(authMiddleware, getProjectBillingEntries);

// 🔹 Get Project Activities
router.route('/project-activities/:projectId').get(authMiddleware, getProjectActivities);

// 🔹 Generate Task Creation Billing
router.route('/generate-task-creation-billing/:task_id').post(authMiddleware, generateTaskCreationBilling);

// 🔹 Generate Task Update Billing
router.route('/generate-task-update-billing/:task_id').post(authMiddleware, generateTaskUpdateBilling);

// 🔹 Generate Comment Billing
router.route('/generate-comment-billing/:comment_id').post(authMiddleware, generateCommentBilling);

// 🔹 Generate Email Billing
router.route('/generate-email-billing/:email_id').post(authMiddleware, generateEmailBilling);

// 🔹 Generate Transcription Billing
router.route('/generate-transcription-billing/:transcription_id').post(authMiddleware, generateTranscriptionBilling);

// 🔹 Generate Media Billing
router.route('/generate-media-billing/:media_id').post(authMiddleware, generateMediaBilling);

// 🔹 Generate Comprehensive Project Billing
router.route('/generate-comprehensive-billing/:project_id').post(authMiddleware, generateComprehensiveProjectBilling);

// 🔹 Get Project Team Members
router.route('/project-team-members/:projectId').get(authMiddleware, getProjectTeamMembers);

// 🔹 Check Project Billing Readiness
router.route('/check-billing-readiness/:projectId').get(authMiddleware, checkProjectBillingReadiness);

// 🔹 Check if Activity has been billed


// 🔹 Delete Billing Entry
router.route('/delete-billing-entry/:lineItemId').delete(authMiddleware, deleteBillingEntry);

// 🔹 Update Billing Entry
router.route('/update-billing-entry/:lineItemId').patch(authMiddleware, updateBillingEntry);

// 🔹 Debug Project Access
router.route('/debug-access/:project_id').get(authMiddleware, debugProjectAccess);

// 🔹 Debug Case Assignments
router.route('/debug-case-assignments').get(authMiddleware, debugCaseAssignments);

// 🔹 Get Client Billing Activities
router.route('/client-billing-activities/:projectId').get(authMiddleware, getClientBillingActivities);

export default router;
