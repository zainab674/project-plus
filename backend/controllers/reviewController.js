import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { validateRequestBody } from '../utils/validateRequestBody.js';
import { CreateReviewRequestBodySchema, UpdateReviewRequestBodySchema } from '../schema/reviewSchema.js';
import { prisma } from "../prisma/index.js";
import { uploadToCloud } from '../services/mediaService.js';
import { createNotification } from '../services/notificationService.js';
import { NOTIFICATION_EVENT_TYPES } from '../constants/notificationTypeConstant.js';

// Create a new review submission
export const createReview = catchAsyncError(async (req, res, next) => {
    const { task_id, submissionDesc } = req.body;
    const user_id = req.user.user_id;

    const [err, isValidate] = await validateRequestBody(req.body, CreateReviewRequestBodySchema);
    if (!isValidate) {
        return next(new ErrorHandler(err, 401));
    }

    // Check if the task exists and user has access
    const task = await prisma.task.findUnique({
        where: { task_id: parseInt(task_id) },
        include: {
            assignees: {
                include: {
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            },
            project: {
                include: {
                    Members: true
                }
            }
        }
    });

    if (!task) {
        return next(new ErrorHandler("Task not found", 404));
    }

    // Check if user is assigned to the task or is project admin
    const isAssigned = task.assignees.some(assignee => assignee.user_id === user_id);
    const isProjectAdmin = task.project.Members.some(member =>
        member.user_id === user_id && (member.role === 'PROVIDER' || member.role === 'TEAM')
    );

    if (!isAssigned && !isProjectAdmin) {
        return next(new ErrorHandler("You don't have permission to submit reviews for this task", 403));
    }

    // Handle file upload if present
    let fileData = {};
    if (req.file) {
        // Upload file to cloud storage (Cloudinary)
        const cloudRes = await uploadToCloud(req.file);

        fileData = {
            file_url: cloudRes.url,
            size: req.file.size,
            mimeType: req.file.mimetype,
            filename: req.file.originalname,
            key: cloudRes.key
        };
    }

    // Create the review
    const review = await prisma.review.create({
        data: {
            task_id: parseInt(task_id),
            submitted_by_id: user_id, // ✅ Add this line

            submissionDesc,
            ...fileData
        },
        include: {
            task: {
                select: {
                    name: true,
                    project: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });

    // Update task status to IN_REVIEW
    await prisma.task.update({
        where: { task_id: parseInt(task_id) },
        data: { status: 'IN_REVIEW' }
    });

    // Create a progress entry
    await prisma.taskProgress.create({
        data: {
            task_id: parseInt(task_id),
            user_id,
            message: `Review submitted: ${submissionDesc}`,
            type: 'OTHER'
        }
    });

    res.status(201).json({
        success: true,
        review,
        message: "Review submitted successfully"
    });
});

// Get all reviews for a task
export const getTaskReviews = catchAsyncError(async (req, res, next) => {
    const { task_id } = req.params;
    const user_id = req.user.user_id;

    // Check if the task exists and user has access
    const task = await prisma.task.findUnique({
        where: { task_id: parseInt(task_id) },
        include: {
            assignees: {
                include: {
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            },
            project: {
                include: {
                    Members: true
                }
            }
        }
    });

    if (!task) {
        return next(new ErrorHandler("Task not found", 404));
    }

    // Check if user has access to the task
    const isAssigned = task.assignees.some(assignee => assignee.user_id === user_id);
    const isProjectAdmin = task.project.Members.some(member =>
        member.user_id === user_id && (member.role === 'PROVIDER' || member.role === 'TEAM')
    );

    if (!isAssigned && !isProjectAdmin) {
        return next(new ErrorHandler("You don't have permission to view reviews for this task", 403));
    }

    const reviews = await prisma.review.findMany({
        where: { task_id: parseInt(task_id) },
        orderBy: { created_at: 'desc' },
        include: {
            task: {
                select: {
                    name: true,
                    project: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });

    res.status(200).json({
        success: true,
        reviews,
        count: reviews.length
    });
});

// Get a specific review by ID
export const getReviewById = catchAsyncError(async (req, res, next) => {
    const { review_id } = req.params;
    const user_id = req.user.user_id;

    const review = await prisma.review.findUnique({
        where: { review_id: parseInt(review_id) },
        include: {
            task: {
                include: {
                    assignees: {
                        include: {
                            user: {
                                select: {
                                    user_id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    project: {
                        include: {
                            Members: true
                        }
                    }
                }
            }
        }
    });

    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    // Check if user has access to the review
    const isAssigned = review.task.assignees.some(assignee => assignee.user_id === user_id);
    const isProjectAdmin = review.task.project.Members.some(member =>
        member.user_id === user_id && (member.role === 'PROVIDER' || member.role === 'TEAM')
    );

    if (!isAssigned && !isProjectAdmin) {
        return next(new ErrorHandler("You don't have permission to view this review", 403));
    }

    res.status(200).json({
        success: true,
        review
    });
});

// Update review (approve/reject)
export const updateReview = catchAsyncError(async (req, res, next) => {
    const { review_id } = req.params;
    const { action, rejectedReason } = req.body;
    const user_id = req.user.user_id;

    const [err, isValidate] = await validateRequestBody(req.body, UpdateReviewRequestBodySchema);
    if (!isValidate) {
        return next(new ErrorHandler(err, 401));
    }

    const review = await prisma.review.findUnique({
        where: { review_id: parseInt(review_id) },
        include: {
            task: {
                include: {
                    assignees: {
                        include: {
                            user: {
                                select: {
                                    user_id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    project: {
                        include: {
                            Members: true
                        }
                    }
                }
            }
        }
    });

    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    // Only project admins can approve/reject reviews
    const isProjectAdmin = review.task.project.Members.some(member =>
        member.user_id === user_id && (member.role === 'PROVIDER' || member.role === 'TEAM')
    );

    if (!isProjectAdmin) {
        return next(new ErrorHandler("Only project admins can approve/reject reviews", 403));
    }

    // Validate rejectedReason is provided when action is REJECTED
    if (action === 'REJECTED' && !rejectedReason) {
        return next(new ErrorHandler("Rejection reason is required when rejecting a review", 400));
    }

    // Update the review
    const updatedReview = await prisma.review.update({
        where: { review_id: parseInt(review_id) },
        data: {
            action,
            acted_by_id: user_id,

            rejectedReason: action === 'REJECTED' ? rejectedReason : null
        },
        include: {
            task: {
                select: {
                    name: true,
                    project: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });

    // Update task status based on review action
    let newTaskStatus = 'TO_DO';
    if (action === 'APPROVED') {
        newTaskStatus = 'DONE';
    } else if (action === 'REJECTED') {
        newTaskStatus = 'IN_PROGRESS';
    }

    await prisma.task.update({
        where: { task_id: review.task_id },
        data: { status: newTaskStatus }
    });

    // Create a progress entry
    const actionMessage = action === 'APPROVED'
        ? `Review approved`
        : `Review rejected: ${rejectedReason}`;

    await prisma.taskProgress.create({
        data: {
            task_id: review.task_id,
            user_id,
            message: actionMessage,
            type: 'OTHER'
        }
    });

    res.status(200).json({
        success: true,
        review: updatedReview,
        message: `Review ${action.toLowerCase()} successfully`
    });
});

// Delete a review (only by the submitter or project admin)
export const deleteReview = catchAsyncError(async (req, res, next) => {
    const { review_id } = req.params;
    const user_id = req.user.user_id;

    const review = await prisma.review.findUnique({
        where: { review_id: parseInt(review_id) },
        include: {
            task: {
                include: {
                    assignees: {
                        include: {
                            user: {
                                select: {
                                    user_id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    project: {
                        include: {
                            Members: true
                        }
                    }
                }
            }
        }
    });

    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    // Check if user is project admin
    const isProjectAdmin = review.task.project.Members.some(member =>
        member.user_id === user_id && (member.role === 'PROVIDER' || member.role === 'TEAM')
    );

    if (!isProjectAdmin) {
        return next(new ErrorHandler("Only project admins can delete reviews", 403));
    }

    // Delete the review
    await prisma.review.delete({
        where: { review_id: parseInt(review_id) }
    });

    // Check if there are any remaining reviews for this task
    const remainingReviews = await prisma.review.count({
        where: { task_id: review.task_id }
    });

    // If no reviews left, update task status back to IN_PROGRESS
    if (remainingReviews === 0) {
        await prisma.task.update({
            where: { task_id: review.task_id },
            data: { status: 'IN_PROGRESS' }
        });
    }

    res.status(200).json({
        success: true,
        message: "Review deleted successfully"
    });
});

// Get all reviews across all projects (for admin dashboard)
export const getAllReviews = catchAsyncError(async (req, res, next) => {
    const user_id = req.user.user_id;
    const { page = 1, limit = 10, status, project_id } = req.query;

    // Build where clause
    const whereClause = {};

    if (status) {
        whereClause.action = status;
    }

    if (project_id) {
        whereClause.task = {
            project_id: parseInt(project_id)
        };
    }

    // Check if user is admin of any projects
    const userProjects = await prisma.projectMember.findMany({
        where: {
            user_id,
            role: 'PROVIDER'
        },
        select: {
            project_id: true
        }
    });

    if (userProjects.length === 0) {
        return next(new ErrorHandler("You don't have permission to view all reviews", 403));
    }

    // Add project filter to where clause
    whereClause.task = {
        ...whereClause.task,
        project_id: {
            in: userProjects.map(p => p.project_id)
        }
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where: whereClause,
            skip,
            take: parseInt(limit),
            orderBy: { created_at: 'desc' },
            include: {
                task: {
                    select: {
                        name: true,
                        project: {
                            select: {
                                name: true,
                                project_id: true
                            }
                        }
                    }
                }
            }
        }),
        prisma.review.count({ where: whereClause })
    ]);

    res.status(200).json({
        success: true,
        reviews,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
        }
    });
});
export const getPendingDocuments = catchAsyncError(async (req, res, next) => {
    const user = req.user;

    // Get documents sent to lawyer
    const documents = await prisma.tDocuments.findMany({
        where: {
            status: 'SENT_TO_LAWYER'
        },
        orderBy: {
            created_at: 'desc'
        },
        include: {
            user: {
                select: {
                    user_id: true,
                    name: true,
                    email: true
                }
            },
            reviewer: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });

    res.status(200).json({
        success: true,
        documents,
        count: documents.length
    });
});

// Get user's submitted documents
export const getMySubmissions = catchAsyncError(async (req, res, next) => {
    const userId = req.user.user_id;

    const documents = await prisma.tDocuments.findMany({
        where: {
            user_id: userId
        },
        orderBy: {
            created_at: 'desc'
        },
        include: {
            reviewer: {
                select: {
                    name: true,
                    email: true
                }
            },
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });

    res.status(200).json({
        success: true,
        documents,
        count: documents.length
    });
});

// Accept document (lawyer approves)
export const acceptDocument = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const reviewer_id = req.user.user_id;

    const tdocument = await prisma.tDocuments.findUnique({
        where: { t_document_id: String(id) }
    });

    if (!tdocument) {
        return next(new ErrorHandler("Document not found", 404));
    }

    const updatedDocument = await prisma.tDocuments.update({
        where: { t_document_id: String(id) },
        data: {
            status: 'APPROVED',
            reviewed_by: reviewer_id,
            reviewed_at: new Date(),
            rejection_reason: null // Clear any previous rejection reason
        }
    });

    // Notify the user
    await createNotification({
        userId: tdocument.user_id,
        eventType: NOTIFICATION_EVENT_TYPES.DOCUMENT,
        message: `Your document "${tdocument.filename}" has been approved by ${req.user.name}.`,
        entityType: 'TDocuments',
        entityId: tdocument.t_document_id
    });

    res.status(200).json({
        success: true,
        message: 'Document approved successfully',
        document: updatedDocument
    });
});

// Reject document (lawyer rejects with reason)
export const rejectDocument = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const reviewer_id = req.user.user_id;

    if (!rejection_reason) {
        return next(new ErrorHandler("Rejection reason is required", 400));
    }

    const tdocument = await prisma.tDocuments.findUnique({
        where: { t_document_id: String(id) }
    });

    if (!tdocument) {
        return next(new ErrorHandler("Document not found", 404));
    }

    const updatedDocument = await prisma.tDocuments.update({
        where: { t_document_id: String(id) },
        data: {
            status: 'REJECTED',
            reviewed_by: reviewer_id,
            reviewed_at: new Date(),
            rejection_reason
        }
    });

    // Notify the user
    await createNotification({
        userId: tdocument.user_id,
        eventType: NOTIFICATION_EVENT_TYPES.DOCUMENT,
        message: `Your document "${tdocument.filename}" has been rejected. Reason: ${rejection_reason}`,
        entityType: 'TDocuments',
        entityId: tdocument.t_document_id
    });

    res.status(200).json({
        success: true,
        message: 'Document rejected',
        document: updatedDocument
    });
});

// Resubmit document (user resubmits after making changes)
export const resubmitDocument = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const tdocument = await prisma.tDocuments.findUnique({
        where: { t_document_id: String(id) },
        include: {
            user: true // Include user to get leader_id
        }
    });

    if (!tdocument) {
        return next(new ErrorHandler("Document not found", 404));
    }

    const updatedDocument = await prisma.tDocuments.update({
        where: { t_document_id: String(id) },
        data: {
            status: 'SENT_TO_LAWYER',
            reviewed_by: null,
            reviewed_at: null,
            rejection_reason: null
        }
    });

    // Notify the lawyer (user's leader)
    const lawyerId = tdocument.user.leader_id;

    if (lawyerId) {
        await createNotification({
            userId: lawyerId,
            eventType: NOTIFICATION_EVENT_TYPES.DOCUMENT,
            message: `Document "${tdocument.filename}" has been resubmitted for review by ${req.user.name}.`,
            entityType: 'TDocuments',
            entityId: tdocument.t_document_id
        });
    }

    res.status(200).json({
        success: true,
        message: 'Document resubmitted successfully',
        document: updatedDocument
    });
});
