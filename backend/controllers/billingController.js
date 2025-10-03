import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import billingService from '../services/billingService.js';
import { prisma } from '../prisma/index.js';

// Assign case to biller
export const assignCaseToBiller = catchAsyncError(async (req, res, next) => {
    const assignmentData = req.body;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!assignmentData.project_id || !assignmentData.biller_id) {
        return next(new ErrorHandler("Project ID and Biller ID are required", 400));
    }

    try {
        const assignment = await billingService.assignCaseToBiller(
            assignmentData.project_id,
            assignmentData.biller_id,
            userId
        );

        res.status(201).json({
            success: true,
            message: 'Case assigned to biller successfully',
            assignment
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get billing configuration for a case
export const getBillingConfig = catchAsyncError(async (req, res, next) => {
    const { caseId } = req.params;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!caseId) {
        return next(new ErrorHandler("Case ID is required", 400));
    }

    try {
        const billingConfig = await billingService.getBillingConfig(caseId, userId);

        res.status(200).json({
            success: true,
            billingConfig
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Set billing configuration for a case
export const setBillingConfig = catchAsyncError(async (req, res, next) => {
    const { case_id, billingMethod, amount } = req.body;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!case_id || !billingMethod) {
        return next(new ErrorHandler("Case ID and billing method are required", 400));
    }

    // Validate billing method
    const validBillingMethods = ['PER_TASK', 'PER_CASE', 'HOURLY'];
    if (!validBillingMethods.includes(billingMethod)) {
        return next(new ErrorHandler("Invalid billing method. Must be PER_TASK, PER_CASE, or HOURLY", 400));
    }

    // Validate amount for non-hourly billing
    if (billingMethod !== 'HOURLY' && (!amount || amount <= 0)) {
        return next(new ErrorHandler("Amount is required for PER_TASK and PER_CASE billing methods", 400));
    }

    try {
        const billingConfig = await billingService.setBillingConfig(
            case_id,
            billingMethod,
            amount,
            userId
        );

        res.status(201).json({
            success: true,
            message: 'Billing configuration set successfully',
            billingConfig
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Set member rate for a case
export const setMemberRate = catchAsyncError(async (req, res, next) => {
    const { case_id, member_id, rateType, rateValue } = req.body;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!case_id || !member_id || !rateType || !rateValue) {
        return next(new ErrorHandler("Case ID, member ID, rate type, and rate value are required", 400));
    }

    // Validate rate type
    const validRateTypes = ['PER_TASK', 'HOURLY'];
    if (!validRateTypes.includes(rateType)) {
        return next(new ErrorHandler("Invalid rate type. Must be PER_TASK or HOURLY", 400));
    }

    // Validate rate value
    if (!rateValue || parseFloat(rateValue) <= 0) {
        return next(new ErrorHandler("Rate value must be greater than 0", 400));
    }

    try {
        const memberRate = await billingService.setMemberRate(
            case_id,
            member_id,
            rateType,
            rateValue,
            userId
        );

        res.status(201).json({
            success: true,
            message: 'Member rate set successfully',
            memberRate
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get member rates for a case
export const getMemberRates = catchAsyncError(async (req, res, next) => {
    const { caseId } = req.params;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!caseId) {
        return next(new ErrorHandler("Case ID is required", 400));
    }

    try {
        const memberRates = await billingService.getMemberRates(caseId, userId);

        res.status(200).json({
            success: true,
            memberRates
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Auto-generate billing entry for task completion
export const generateTaskBillingEntry = catchAsyncError(async (req, res, next) => {
    const { task_id } = req.body;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!task_id) {
        return next(new ErrorHandler("Task ID is required", 400));
    }

    try {
        const billingEntries = await billingService.generateTaskBillingEntry(task_id, userId);

        res.status(201).json({
            success: true,
            message: 'Billing entries generated successfully',
            billingEntries
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Auto-generate billing entry for meeting
export const generateMeetingBillingEntry = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.body;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!meeting_id) {
        return next(new ErrorHandler("Meeting ID is required", 400));
    }

    try {
        const billingEntries = await billingService.generateMeetingBillingEntry(meeting_id, userId);

        res.status(201).json({
            success: true,
            message: 'Meeting billing entries generated successfully',
            billingEntries
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Auto-generate billing entry for review
export const generateReviewBillingEntry = catchAsyncError(async (req, res, next) => {
    const { review_id } = req.body;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!review_id) {
        return next(new ErrorHandler("Review ID is required", 400));
    }

    try {
        const billingEntries = await billingService.generateReviewBillingEntry(review_id, userId);

        res.status(201).json({
            success: true,
            message: 'Review billing entries generated successfully',
            billingEntries
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Generate billing entry for progress activities
export const generateProgressBillingEntry = catchAsyncError(async (req, res, next) => {
    const { progress_id } = req.body;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!progress_id) {
        return next(new ErrorHandler("Progress ID is required", 400));
    }

    try {
        const result = await billingService.generateProgressBillingEntry(progress_id, userId);

        res.status(200).json({
            success: true,
            message: result.message,
            billingLineItem: result.billingLineItem
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get billing entries for a project
export const getProjectBillingEntries = catchAsyncError(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!projectId) {
        return next(new ErrorHandler("Project ID is required", 400));
    }

    try {
        const billingEntries = await billingService.getProjectBillingEntries(projectId, userId);

        res.status(200).json({
            success: true,
            billingEntries
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get cases assigned to billers
export const getBillerAssignedCases = catchAsyncError(async (req, res, next) => {
    const userId = req.user.user_id;



    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    try {
        const assignedCases = await billingService.getBillerAssignedCases(userId);



        res.status(200).json({
            success: true,
            assignedCases
        });
    } catch (error) {
        console.error('❌ getBillerAssignedCases - Error:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get cases assigned to the logged-in biller
export const getMyAssignedCases = catchAsyncError(async (req, res, next) => {
    const userId = req.user.user_id;



    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    try {
        const assignedCases = await billingService.getCasesAssignedToBiller(userId);


        res.status(200).json({
            success: true,
            assignedCases
        });
    } catch (error) {
        console.error('❌ Controller error:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get detailed case information
export const getCaseDetails = catchAsyncError(async (req, res, next) => {
    const projectId = parseInt(req.params.projectId, 10);



    if (!projectId) {
        return next(new ErrorHandler("Project ID is required", 400));
    }

    try {
        const caseDetails = await billingService.getCaseDetails(projectId);

        res.status(200).json({
            success: true,
            caseDetails
        });
    } catch (error) {
        console.error('❌ getCaseDetails - Error:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get project activities for billing
export const getProjectActivities = catchAsyncError(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!projectId) {
        return next(new ErrorHandler("Project ID is required", 400));
    }

    try {
        const activities = await billingService.getProjectActivities(projectId, userId);

        res.status(200).json({
            success: true,
            activities
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Debug endpoint to check project access
export const debugProjectAccess = catchAsyncError(async (req, res, next) => {
    const { project_id } = req.params;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!project_id) {
        return next(new ErrorHandler("Project ID is required", 400));
    }

    try {
        // Check if project exists
        const project = await prisma.project.findUnique({
            where: { project_id: parseInt(project_id) }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: `Project with ID ${project_id} does not exist`
            });
        }

        // Check if user is project owner
        const isOwner = project.created_by === userId;

        // Check if user is project member
        const member = await prisma.projectMember.findFirst({
            where: {
                project_id: parseInt(project_id),
                user_id: userId
            }
        });

        // Check if user is assigned biller
        const billerAssignment = await prisma.caseAssignment.findFirst({
            where: {
                project_id: parseInt(project_id),
                biller_id: userId
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                project_id: parseInt(project_id),
                user_id: userId,
                project_exists: true,
                is_owner: isOwner,
                is_member: !!member,
                is_biller: !!billerAssignment,
                has_access: isOwner || !!member || !!billerAssignment,
                project_created_by: project.created_by,
                member_details: member,
                biller_assignment: billerAssignment
            }
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Debug endpoint to check all case assignments
export const debugCaseAssignments = catchAsyncError(async (req, res, next) => {
    try {
        const allAssignments = await prisma.caseAssignment.findMany({
            include: {
                project: {
                    select: {
                        project_id: true,
                        name: true,
                        client_name: true
                    }
                },
                biller: {
                    select: {
                        user_id: true,
                        name: true,
                        email: true
                    }
                },
                assignedBy: {
                    select: {
                        user_id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });



        res.status(200).json({
            success: true,
            totalAssignments: allAssignments.length,
            assignments: allAssignments
        });
    } catch (error) {
        console.error('❌ Debug error:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// Generate billing for task creation
export const generateTaskCreationBilling = catchAsyncError(async (req, res, next) => {
    const { task_id } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await billingService.generateTaskCreationBillingEntry(task_id, userId);
        res.status(200).json({
            success: true,
            message: result.message,
            billingEntry: result.billingLineItem
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Generate billing for task updates
export const generateTaskUpdateBilling = catchAsyncError(async (req, res, next) => {
    const { task_id } = req.params;
    const { updateType } = req.body;
    const userId = req.user.user_id;

    try {
        const result = await billingService.generateTaskUpdateBillingEntry(task_id, userId, updateType);
        res.status(200).json({
            success: true,
            message: result.message,
            billingEntry: result.billingLineItem
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Generate billing for comment creation
export const generateCommentBilling = catchAsyncError(async (req, res, next) => {
    const { comment_id } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await billingService.generateCommentBillingEntry(comment_id, userId);
        res.status(200).json({
            success: true,
            message: result.message,
            billingEntry: result.billingLineItem
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Generate billing for email creation
export const generateEmailBilling = catchAsyncError(async (req, res, next) => {
    const { email_id } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await billingService.generateEmailBillingEntry(email_id, userId);
        res.status(200).json({
            success: true,
            message: result.message,
            billingEntry: result.billingLineItem
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Generate billing for transcription creation
export const generateTranscriptionBilling = catchAsyncError(async (req, res, next) => {
    const { transcription_id } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await billingService.generateTranscriptionBillingEntry(transcription_id, userId);
        res.status(200).json({
            success: true,
            message: result.message,
            billingEntry: result.billingLineItem
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Generate billing for media upload
export const generateMediaBilling = catchAsyncError(async (req, res, next) => {
    const { media_id } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await billingService.generateMediaBillingEntry(media_id, userId);
        res.status(200).json({
            success: true,
            message: result.message,
            billingEntry: result.billingLineItem
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Generate comprehensive project billing
export const generateComprehensiveProjectBilling = catchAsyncError(async (req, res, next) => {
    const { project_id } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await billingService.generateComprehensiveProjectBilling(project_id, userId);
        res.status(200).json({
            success: true,
            message: result.message,
            billingEntries: result.billingEntries,
            errors: result.errors
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get team members for a project
export const getProjectTeamMembers = catchAsyncError(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!projectId) {
        return next(new ErrorHandler("Project ID is required", 400));
    }

    try {
        const teamMembers = await billingService.getProjectTeamMembers(projectId, userId);

        res.status(200).json({
            success: true,
            teamMembers
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Check project billing readiness
export const checkProjectBillingReadiness = catchAsyncError(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!projectId) {
        return next(new ErrorHandler("Project ID is required", 400));
    }

    try {
        const readiness = await billingService.checkProjectBillingReadiness(projectId, userId);

        res.status(200).json({
            success: true,
            ...readiness
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});



// Create custom billing line item for individual activities
export const createCustomBillingLineItem = catchAsyncError(async (req, res, next) => {
    const billingData = req.body;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!billingData.project_id || !billingData.item_type || !billingData.description ||
        !billingData.quantity || !billingData.unit_rate || !billingData.total_amount) {
        return next(new ErrorHandler("Missing required billing data", 400));
    }

    try {
        const result = await billingService.createCustomBillingLineItem(billingData, userId);

        res.status(201).json({
            success: true,
            message: result.message,
            billingLineItem: result.billingLineItem
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get business status
export const getBusinessStatus = catchAsyncError(async (req, res, next) => {
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    try {
        const businessStatus = await billingService.getBusinessStatus(userId);

        res.status(200).json({
            success: true,
            businessStatus
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get all billing entries for user's projects
export const getAllBillingEntries = catchAsyncError(async (req, res, next) => {
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    try {
        const billingEntries = await billingService.getAllBillingEntriesForUser(userId);

        res.status(200).json({
            success: true,
            billingEntries
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Delete billing entry
export const deleteBillingEntry = catchAsyncError(async (req, res, next) => {
    const { lineItemId } = req.params;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!lineItemId) {
        return next(new ErrorHandler("Billing line item ID is required", 400));
    }

    try {
        const result = await billingService.deleteBillingEntry(lineItemId, userId);

        res.status(200).json({
            success: true,
            message: result.message,
            deletedEntry: result.deletedEntry
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Update billing entry
export const updateBillingEntry = catchAsyncError(async (req, res, next) => {
    const { lineItemId } = req.params;
    const updateData = req.body;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!lineItemId) {
        return next(new ErrorHandler("Billing line item ID is required", 400));
    }

    // Validate required fields
    if (!updateData.description || !updateData.quantity || !updateData.unit_rate) {
        return next(new ErrorHandler("Description, quantity, and unit rate are required", 400));
    }

    // Validate numeric values
    if (isNaN(updateData.quantity) || parseFloat(updateData.quantity) <= 0) {
        return next(new ErrorHandler("Quantity must be a positive number", 400));
    }

    if (isNaN(updateData.unit_rate) || parseFloat(updateData.unit_rate) < 0) {
        return next(new ErrorHandler("Unit rate must be a non-negative number", 400));
    }

    try {
        const result = await billingService.updateBillingEntry(lineItemId, updateData, userId);

        res.status(200).json({
            success: true,
            message: result.message,
            updatedEntry: result.updatedEntry
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get client billing activities for a specific project
export const getClientBillingActivities = catchAsyncError(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.user_id;

    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }

    if (!projectId) {
        return next(new ErrorHandler("Project ID is required", 400));
    }

    try {
        const billingActivities = await billingService.getClientBillingActivities(projectId, userId);

        res.status(200).json({
            success: true,
            billingActivities
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

