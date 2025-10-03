import { prisma } from "../prisma/index.js";

// Get review statistics for a project
export const getReviewStats = async (projectId) => {
    const stats = await prisma.review.groupBy({
        by: ['action'],
        where: {
            task: {
                project_id: projectId
            }
        },
        _count: {
            review_id: true
        }
    });

    const totalReviews = await prisma.review.count({
        where: {
            task: {
                project_id: projectId
            }
        }
    });

    const pendingReviews = await prisma.review.count({
        where: {
            task: {
                project_id: projectId
            },
            action: null
        }
    });

    return {
        total: totalReviews,
        pending: pendingReviews,
        approved: stats.find(s => s.action === 'APPROVED')?._count.review_id || 0,
        rejected: stats.find(s => s.action === 'REJECTED')?._count.review_id || 0
    };
};

// Get review statistics for a user
export const getUserReviewStats = async (userId) => {
    const submittedReviews = await prisma.review.count({
        where: {
            task: {
                assignees: {
                    some: {
                        user_id: userId
                    }
                }
            }
        }
    });

    const approvedReviews = await prisma.review.count({
        where: {
            task: {
                assignees: {
                    some: {
                        user_id: userId
                    }
                }
            },
            action: 'APPROVED'
        }
    });

    const rejectedReviews = await prisma.review.count({
        where: {
            task: {
                assignees: {
                    some: {
                        user_id: userId
                    }
                }
            },
            action: 'REJECTED'
        }
    });

    const pendingReviews = await prisma.review.count({
        where: {
            task: {
                assignees: {
                    some: {
                        user_id: userId
                    }
                }
            },
            action: null
        }
    });

    return {
        submitted: submittedReviews,
        approved: approvedReviews,
        rejected: rejectedReviews,
        pending: pendingReviews,
        approvalRate: submittedReviews > 0 ? (approvedReviews / submittedReviews) * 100 : 0
    };
};

// Get tasks that need review
export const getTasksNeedingReview = async (projectId = null) => {
    const whereClause = {
        status: 'IN_REVIEW'
    };

    if (projectId) {
        whereClause.project_id = projectId;
    }

    const tasks = await prisma.task.findMany({
        where: whereClause,
        include: {
            inReview: {
                orderBy: {
                    created_at: 'desc'
                },
                take: 1
            },
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
                select: {
                    name: true,
                    project_id: true
                }
            }
        },
        orderBy: {
            updated_at: 'desc'
        }
    });

    return tasks;
};

// Check if a task has pending reviews
export const hasPendingReviews = async (taskId) => {
    const pendingCount = await prisma.review.count({
        where: {
            task_id: taskId,
            action: null
        }
    });

    return pendingCount > 0;
};

// Get recent review activity
export const getRecentReviewActivity = async (projectId = null, limit = 10) => {
    const whereClause = {};
    
    if (projectId) {
        whereClause.task = {
            project_id: projectId
        };
    }

    const reviews = await prisma.review.findMany({
        where: whereClause,
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
        },
        orderBy: {
            created_at: 'desc'
        },
        take: limit
    });

    return reviews;
};

// Get review timeline for a task
export const getTaskReviewTimeline = async (taskId) => {
    const reviews = await prisma.review.findMany({
        where: {
            task_id: taskId
        },
        orderBy: {
            created_at: 'asc'
        },
        include: {
            task: {
                select: {
                    name: true,
                    status: true
                }
            }
        }
    });

    return reviews.map(review => ({
        id: review.review_id,
        type: 'review',
        action: review.action || 'SUBMITTED',
        description: review.submissionDesc,
        file: review.file_url ? {
            url: review.file_url,
            name: review.filename,
            size: review.size,
            type: review.mimeType
        } : null,
        rejectedReason: review.rejectedReason,
        createdAt: review.created_at,
        status: review.action || 'PENDING'
    }));
}; 