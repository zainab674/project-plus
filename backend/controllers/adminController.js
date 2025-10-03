import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from "../utils/errorHandler.js";
import { prisma } from "../prisma/index.js";
import { sendOTPOnMail } from '../services/userService.js';
import { sendApprovalEmail, sendRejectionEmail } from '../services/emailNotificationService.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

/** Map DB record (schema fields) -> API shape your FE expects */
const mapRequestForFE = (r) => ({
    request_id: r.request_id,
    // flatten requester info for FE compatibility
    name: r.name,
    email: r.email,
    company_name: r.company_name,
    status: r.status,
    // keep old names in payload for FE (aliases)
    created_at: r.created_at,
    approved_at: r.approved_at,
    approved_by: r.approved_by,
    admin_notes: r.admin_notes,
    // Additional fields for FE
    account_name: r.account_name,
    bring: r.bring,
    teams_member_count: r.teams_member_count,
    focus: r.focus,
    hear_about_as: r.hear_about_as,
    reason: r.reason,
    team_size: r.team_size,
    submitted_at: r.created_at, // alias for backward compatibility
    notes: r.admin_notes, // alias for backward compatibility
});

/** -------- GET PENDING -------- */
export const getPendingRequests = catchAsyncError(async (req, res) => {
    const rows = await prisma.userRegistrationRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { created_at: 'desc' },
    });

    res.status(200).json({
        success: true,
        data: rows.map(mapRequestForFE),
    });
});

/** -------- GET ALL (with status=ALL) -------- */
export const getAllRequests = catchAsyncError(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Number(limit) || 10);
    const where = status && status !== 'ALL' ? { status } : {};
    const skip = (p - 1) * l;

    const [rows, total] = await Promise.all([
        prisma.userRegistrationRequest.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip,
            take: l,
        }),
        prisma.userRegistrationRequest.count({ where }),
    ]);

    res.status(200).json({
        success: true,
        data: rows.map(mapRequestForFE),
        pagination: {
            page: p,
            limit: l,
            total,
            pages: Math.ceil(total / l),
        },
    });
});

/** -------- APPROVE -------- */
export const approveRequest = catchAsyncError(async (req, res, next) => {
    const { request_id, admin_notes } = req.body;
    const admin_id = req.user?.user_id;

    console.log(`🚀 Starting approval process for request: ${request_id}`);

    if (!request_id) return next(new ErrorHandler("Request ID is required", 400));

    const request = await prisma.userRegistrationRequest.findUnique({
        where: { request_id },
    });

    if (!request) return next(new ErrorHandler("Registration request not found", 404));
    if (request.status !== 'PENDING') return next(new ErrorHandler("Request is not pending", 400));

    console.log(`📋 Approving registration for: ${request.name} (${request.email})`);

    // Mark approved on request
    const updated = await prisma.userRegistrationRequest.update({
        where: { request_id },
        data: {
            status: 'APPROVED',
            admin_notes: admin_notes || null,
            approved_at: new Date(),
            approved_by: admin_id ?? null,
        },
    });

    // Create a new user from the approved registration request
    console.log(`👤 Creating new user account for: ${updated.name}`);
    const newUser = await prisma.user.create({
        data: {
            name: updated.name,
            email: updated.email,
            password_hash: updated.password_hash,
            account_name: updated.account_name,
            bring: updated.bring,
            teams_member_count: updated.teams_member_count,
            focus: updated.focus,
            hear_about_as: updated.hear_about_as,
            Role: 'PROVIDER', // Default role for approved users
        },
    });
    console.log(`✅ User account created successfully with ID: ${newUser.user_id}`);

    // Send OTP to the new user
    console.log(`📧 Sending OTP to new user: ${newUser.email}`);
    await sendOTPOnMail(newUser, async (OTP, err) => {
        if (err) {
            console.error('❌ Error sending OTP:', err);
            return; // do not fail the approval
        }
        console.log(`🔐 OTP generated successfully for user: ${newUser.email}`);
        const hash_otp = crypto.createHash('sha256').update(OTP.toString()).digest('hex');
        await prisma.oTP.create({
            data: {
                otp: hash_otp,
                user_id: newUser.user_id,
            },
        });
        console.log(`✅ OTP stored in database for user: ${newUser.email}`);
    });

    // Send approval notification email to the user
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('⚠️ SMTP credentials not configured - skipping approval email');
        } else {
            const emailResult = await sendApprovalEmail(updated.email, updated.name);
            if (emailResult.success) {
                console.log(`✅ Approval email sent successfully to ${updated.email}`);
            } else {
                console.error('❌ Approval email failed:', emailResult.error);
            }
        }
    } catch (e) {
        console.error('❌ Error sending approval email:', e);
        // Don't fail the approval process if email fails
    }

    console.log(`🎉 Registration approval completed successfully for: ${updated.name} (${updated.email})`);

    res.status(200).json({
        success: true,
        message: "User registration request approved successfully",
        data: {
            ...mapRequestForFE(updated),
            status: 'APPROVED',
        },
    });
});

/** -------- REJECT -------- */
export const rejectRequest = catchAsyncError(async (req, res, next) => {
    const { request_id, admin_notes } = req.body;
    const admin_id = req.user?.user_id;

    if (!request_id) return next(new ErrorHandler("Request ID is required", 400));

    const request = await prisma.userRegistrationRequest.findUnique({
        where: { request_id },
    });

    if (!request) return next(new ErrorHandler("Registration request not found", 404));
    if (request.status !== 'PENDING') return next(new ErrorHandler("Request is not pending", 400));

    const updated = await prisma.userRegistrationRequest.update({
        where: { request_id },
        data: {
            status: 'REJECTED',
            admin_notes: admin_notes || null,
            approved_at: new Date(),
            approved_by: admin_id ?? null,
        },
    });

    try {
        await sendRejectionEmail(updated.email, updated.name, admin_notes);
    } catch (e) {
        console.error('Error sending rejection email:', e);
    }

    res.status(200).json({
        success: true,
        message: "User registration request rejected successfully",
        data: {
            request_id,
            status: 'REJECTED',
            ...mapRequestForFE(updated),
        },
    });
});

/** -------- DETAILS -------- */
export const getRequestDetails = catchAsyncError(async (req, res, next) => {
    const { request_id } = req.params;

    const r = await prisma.userRegistrationRequest.findUnique({
        where: { request_id },
    });

    if (!r) return next(new ErrorHandler("Registration request not found", 404));

    res.status(200).json({
        success: true,
        data: mapRequestForFE(r),
    });
});

/** -------- GET DASHBOARD STATS -------- */
export const getDashboardStats = catchAsyncError(async (req, res, next) => {
    try {
        const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
            prisma.userRegistrationRequest.count({ where: { status: 'PENDING' } }),
            prisma.userRegistrationRequest.count({ where: { status: 'APPROVED' } }),
            prisma.userRegistrationRequest.count({ where: { status: 'REJECTED' } }),
            prisma.userRegistrationRequest.count()
        ]);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    pending: pendingCount,
                    approved: approvedCount,
                    rejected: rejectedCount,
                    total: totalCount
                }
            }
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to fetch dashboard stats: ${error.message}`, 500));
    }
});

/** -------- GET ALL USERS -------- */
export const getAllUsers = catchAsyncError(async (req, res, next) => {
    try {
        const { page = 1, limit = 50, role, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        // Filter by role if specified
        if (role && role !== 'ALL') {
            where.Role = role;
        }

        // Search functionality
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { account_name: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    user_id: true,
                    name: true,
                    email: true,
                    Role: true,
                    account_name: true,
                    created_at: true,
                    updated_at: true,
                    active_status: true
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.user.count({ where })
        ]);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to fetch users: ${error.message}`, 500));
    }
});

/** -------- GET USER DETAILS -------- */



// export const getUserDetails = catchAsyncError(async (req, res, next) => {
//     try {
//         const { userId } = req.params;

//         const user = await prisma.user.findUnique({
//             where: { user_id: parseInt(userId) },
//             include: {
//                 Projects: {
//                     select: {
//                         project_id: true,
//                         name: true,
//                         description: true,
//                         status: true,
//                         created_at: true,
//                         updated_at: true,
//                     },
//                 },
//                 Collaboration: {
//                     include: {
//                         project: {
//                             select: {
//                                 project_id: true,
//                                 name: true,
//                                 description: true,
//                                 status: true,
//                                 created_at: true,
//                             },
//                         },
//                     },
//                 },
//                 AssignedTasks: {
//                     select: {
//                         task: {
//                             select: {
//                                 task_id: true,
//                                 name: true,
//                                 status: true,
//                                 priority: true,
//                             },
//                         },
//                     },
//                 },
//                 CreatedTasks: {
//                     select: {
//                         task_id: true,
//                         name: true,
//                         status: true,
//                         priority: true,
//                     },
//                 },
//                 Notifications: {
//                     select: {
//                         notification_id: true,
//                         message: true,
//                         is_read: true,
//                         created_at: true,
//                     },
//                 },
//                 otps: {
//                     select: {
//                         otp: true,
//                         created_at: true,
//                     },
//                 },
//                 Transcibtions: {
//                     select: {
//                         transcribtion_id: true,
//                         Transcibtion: true,
//                         created_at: true,
//                     },
//                 },
//                 Emails: {
//                     select: {
//                         email_id: true,
//                         subject: true,
//                         content: true,
//                         created_at: true,
//                     },
//                 },
//                 Comments: {
//                     select: {
//                         comment_id: true,
//                         content: true,
//                         created_at: true,
//                     },
//                 },
//                 Progress: {
//                     select: {
//                         progress_id: true,
//                         message: true,
//                         created_at: true,
//                     },
//                 },

//                 Meetings: {
//                     select: {
//                         meeting_id: true,
//                         heading: true,
//                         date: true,
//                         status: true,
//                         created_at: true,
//                     },
//                 },
//                 Media: {
//                     select: {
//                         media_id: true,
//                         file_url: true,
//                         created_at: true,
//                     },
//                 },
//                 Services: {
//                     select: {
//                         project_client_id: true,
//                         added_at: true,
//                         project: {
//                             select: {
//                                 name: true,
//                                 description: true,
//                             },
//                         },
//                     },
//                 },
//                 Time: {
//                     select: {
//                         time_id: true,
//                         start: true,
//                         end: true,
//                         work_description: true,
//                         created_at: true,
//                     },
//                 },
//                 teamsLed: {
//                     select: {
//                         team_member_id: true,
//                         user_id: true,
//                         role: true,
//                     },
//                 },
//                 teamsMember: {
//                     select: {
//                         team_member_id: true,
//                         user_id: true,
//                         role: true,
//                     },
//                 },
//                 lawyerFiles: {
//                     select: {
//                         file_id: true,
//                         name: true,
//                         size: true,
//                         path: true,
//                         createdAt: true,
//                     },
//                 },
//                 clientFiles: {
//                     select: {
//                         file_id: true,
//                         name: true,
//                         size: true,
//                         path: true,
//                         createdAt: true,
//                     },
//                 },
//                 billingLineItems: {
//                     select: {
//                         line_item_id: true,
//                         description: true,
//                         total_amount: true,
//                         created_at: true,
//                     },
//                 },
//                 memberRates: {
//                     select: {
//                         member_rate_id: true,
//                         hourly_rate: true,
//                         monthly_salary: true,
//                     },
//                 },
//                 clientInvoices: {
//                     select: {
//                         invoice_id: true,
//                         invoice_number: true,
//                         total_amount: true,
//                         status: true,
//                         issued_date: true,
//                     },
//                 },
//                 billerInvoices: {
//                     select: {
//                         invoice_id: true,
//                         invoice_number: true,
//                         total_amount: true,
//                         status: true,
//                         issued_date: true,
//                     },
//                 },
//                 billerCaseAssignments: {
//                     select: {
//                         assignment_id: true,
//                         assigned_at: true,
//                         project: {
//                             select: {
//                                 name: true,
//                             },
//                         },
//                     },
//                 },
//                 assignedByCaseAssignments: {
//                     select: {
//                         assignment_id: true,
//                         assigned_at: true,
//                         project: {
//                             select: {
//                                 name: true,
//                             },
//                         },
//                     },
//                 },
//                 submittedReviews: {
//                     select: {
//                         review_id: true,
//                         submissionDesc: true,
//                         action: true,
//                     },
//                 },
//                 actedReviews: {
//                     select: {
//                         review_id: true,
//                         submissionDesc: true,
//                         action: true,
//                     },
//                 },
//                 Messages: {
//                     select: {
//                         message_id: true,
//                         content: true,
//                         createdAt: true,
//                     },
//                 },
//                 User1PrivateConversations: {
//                     select: {
//                         private_conversation_id: true,
//                         created_at: true,
//                     },
//                 },
//                 User2PrivateConversations: {
//                     select: {
//                         private_conversation_id: true,
//                         created_at: true,
//                     },
//                 },
//                 expenses: {
//                     select: {
//                         expense_id: true,
//                         name: true,
//                         price: true,
//                         month: true,
//                         created_at: true,
//                     },
//                 },
//                 providerExpenses: {
//                     select: {
//                         expense_id: true,
//                         name: true,
//                         price: true,
//                         month: true,
//                         created_at: true,
//                     },
//                 },
//                 AdminApprovals: {
//                     select: {
//                         request_id: true,
//                         status: true,
//                         created_at: true,
//                     },
//                 },
//             },
//         });

//         if (!user) {
//             return next(new ErrorHandler('User not found', 404));
//         }

//         res.status(200).json({
//             success: true,
//             data: { user },
//         });
//     } catch (error) {
//         return next(new ErrorHandler(`Failed to fetch user details: ${error.message}`, 500));
//     }
// });

export const getUserDetails = catchAsyncError(async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { user_id: parseInt(userId) },
            include: {
                // Projects created by this user
                Projects: {
                    select: {
                        project_id: true,
                        name: true,
                        description: true,
                        status: true,
                        created_at: true,
                        updated_at: true,
                        priority: true,
                        client_name: true,
                        client_address: true,
                        budget: true,
                        opposing: true,
                        filingDate: true,
                        phases: true,
                        Members: {
                            select: {
                                project_member_id: true,
                                role: true,
                                legalRole: true,
                                customLegalRole: true,
                                added_at: true,
                                user: {
                                    select: {
                                        user_id: true,
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        },
                        Clients: {
                            select: {
                                project_client_id: true,
                                added_at: true,
                                user: {
                                    select: {
                                        user_id: true,
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        },
                        Tasks: {
                            select: {
                                task_id: true,
                                name: true,
                                description: true,
                                status: true,
                                priority: true,
                                phase: true,
                                created_at: true,
                                updated_at: true,
                                last_date: true
                            }
                        },
                        Media: {
                            select: {
                                media_id: true,
                                file_url: true,
                                filename: true,
                                size: true,
                                mimeType: true,
                                created_at: true
                            }
                        },
                        Time: {
                            select: {
                                time_id: true,
                                start: true,
                                end: true,
                                status: true,
                                work_description: true,
                                created_at: true,
                                user: {
                                    select: {
                                        user_id: true,
                                        name: true
                                    }
                                }
                            }
                        },
                        Comments: {
                            select: {
                                comment_id: true,
                                content: true,
                                created_at: true,
                                user: {
                                    select: {
                                        user_id: true,
                                        name: true
                                    }
                                }
                            }
                        },
                        invoices: {
                            select: {
                                invoice_id: true,
                                invoice_number: true,
                                total_amount: true,
                                status: true,
                                issued_date: true,
                                due_date: true
                            }
                        }
                    }
                },
                // Project memberships (where user is a member but not creator)
                Collaboration: {
                    select: {
                        project_member_id: true,
                        role: true,
                        legalRole: true,
                        customLegalRole: true,
                        added_at: true,
                        project: {
                            select: {
                                project_id: true,
                                name: true,
                                description: true,
                                status: true,
                                priority: true,
                                created_at: true,
                                client_name: true
                            }
                        }
                    }
                },
                // Tasks assigned to user
                AssignedTasks: {
                    select: {
                        task_member_id: true,
                        assigned_at: true,
                        task: {
                            select: {
                                task_id: true,
                                name: true,
                                description: true,
                                status: true,
                                priority: true,
                                phase: true,
                                created_at: true,
                                last_date: true,
                                project: {
                                    select: {
                                        project_id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                // Tasks created by user
                CreatedTasks: {
                    select: {
                        task_id: true,
                        name: true,
                        description: true,
                        status: true,
                        priority: true,
                        phase: true,
                        created_at: true,
                        updated_at: true,
                        last_date: true,
                        project: {
                            select: {
                                project_id: true,
                                name: true
                            }
                        }
                    }
                },
                // Teams where user is leader
                teamsLed: {
                    select: {
                        team_member_id: true,
                        role: true,
                        legalRole: true,
                        customLegalRole: true,
                        user: {
                            select: {
                                user_id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                // Teams where user is member
                teamsMember: {
                    select: {
                        team_member_id: true,
                        role: true,
                        legalRole: true,
                        customLegalRole: true,
                        leader: {
                            select: {
                                user_id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                // User's messages
                Messages: {
                    select: {
                        message_id: true,
                        content: true,
                        content_type: true,
                        createdAt: true,
                        is_group_chat: true,
                        attachment_url: true,
                        attachment_name: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 50 // Limit to recent messages
                },
                // Files where user is lawyer
                lawyerFiles: {
                    select: {
                        file_id: true,
                        name: true,
                        size: true,
                        type: true,
                        path: true,
                        createdAt: true
                    }
                },
                // Files where user is client
                clientFiles: {
                    select: {
                        file_id: true,
                        name: true,
                        size: true,
                        type: true,
                        path: true,
                        createdAt: true
                    }
                },
                // User's billing line items
                billingLineItems: {
                    select: {
                        line_item_id: true,
                        item_type: true,
                        description: true,
                        quantity: true,
                        unit_rate: true,
                        total_amount: true,
                        created_at: true
                    }
                },
                // Invoices where user is client
                clientInvoices: {
                    select: {
                        invoice_id: true,
                        invoice_number: true,
                        total_amount: true,
                        subtotal: true,
                        tax_amount: true,
                        status: true,
                        issued_date: true,
                        due_date: true,
                        paid_date: true
                    }
                },
                // User notifications
                Notifications: {
                    select: {
                        notification_id: true,
                        message: true,
                        is_read: true,
                        created_at: true
                    },
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 20 // Limit to recent notifications
                },
                // User OTPs
                otps: {
                    select: {
                        otp: true,
                        created_at: true
                    }
                },
                // User transcriptions
                Transcibtions: {
                    select: {
                        transcribtion_id: true,
                        name: true,
                        Transcibtion: true,
                        created_at: true,
                        task: {
                            select: {
                                task_id: true,
                                name: true
                            }
                        }
                    }
                },
                // User emails
                Emails: {
                    select: {
                        email_id: true,
                        subject: true,
                        content: true,
                        is_read: true,
                        created_at: true,
                        to_user: true,
                        from_user: true,
                        attachment_url: true,
                        attachment_name: true
                    },
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 50 // Limit to recent emails
                },
                // Task progress entries by user
                Progress: {
                    select: {
                        progress_id: true,
                        message: true,
                        type: true,
                        created_at: true,
                        task: {
                            select: {
                                task_id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 30 // Limit to recent progress
                },
                // User expenses
                expenses: {
                    select: {
                        expense_id: true,
                        name: true,
                        price: true,
                        month: true,
                        created_at: true,
                        updated_at: true
                    }
                },
                // Meeting participations
                MeetingParticipants: {
                    select: {
                        meeting_participant_id: true,
                        vote: true,
                        created_at: true,
                        meeting: {
                            select: {
                                meeting_id: true,
                                heading: true,
                                description: true,
                                date: true,
                                time: true,
                                status: true,
                                task: {
                                    select: {
                                        task_id: true,
                                        name: true,
                                        project: {
                                            select: {
                                                project_id: true,
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                // Private conversations
                User1PrivateConversations: {
                    select: {
                        private_conversation_id: true,
                        created_at: true,
                        updated_at: true,
                        user2: {
                            select: {
                                user_id: true,
                                name: true,
                                email: true
                            }
                        },
                        task: {
                            select: {
                                task_id: true,
                                name: true
                            }
                        }
                    }
                },
                User2PrivateConversations: {
                    select: {
                        private_conversation_id: true,
                        created_at: true,
                        updated_at: true,
                        user1: {
                            select: {
                                user_id: true,
                                name: true,
                                email: true
                            }
                        },
                        task: {
                            select: {
                                task_id: true,
                                name: true
                            }
                        }
                    }
                },
                // Projects where user is a client
                Services: {
                    select: {
                        project_client_id: true,
                        added_at: true,
                        project: {
                            select: {
                                project_id: true,
                                name: true,
                                description: true,
                                status: true,
                                priority: true,
                                created_at: true,
                                updated_at: true,
                                client_name: true,
                                client_address: true,
                                budget: true,
                                opposing: true,
                                filingDate: true,
                                phases: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        res.status(200).json({
            success: true,
            data: { user },
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to fetch user details: ${error.message}`, 500));
    }
});




/** -------- UPDATE USER ROLE -------- */
export const updateUserRole = catchAsyncError(async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Validate role
        const validRoles = ['CLIENT', 'PROVIDER', 'BILLER', 'TEAM', 'ADMIN'];
        if (!validRoles.includes(role)) {
            return next(new ErrorHandler('Invalid role. Must be one of: CLIENT, PROVIDER, BILLER, TEAM, ADMIN', 400));
        }

        const updatedUser = await prisma.user.update({
            where: { user_id: parseInt(userId) },
            data: { Role: role },
            select: {
                user_id: true,
                name: true,
                email: true,
                Role: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to update user role: ${error.message}`, 500));
    }
});

/** -------- GET SYSTEM OVERVIEW -------- */
export const getSystemOverview = catchAsyncError(async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalProjects,
            totalTasks,
            pendingTasks,
            completedTasks,
            activeProjects,
            recentUsers,
            recentProjects
        ] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
            prisma.task.count(),
            prisma.task.count({ where: { status: { in: ['TO_DO', 'IN_PROGRESS'] } } }),
            prisma.task.count({ where: { status: 'DONE' } }),
            prisma.project.count({ where: { status: { not: 'Completed' } } }),
            prisma.user.findMany({
                select: { user_id: true, name: true, email: true, Role: true, created_at: true },
                orderBy: { created_at: 'desc' },
                take: 5
            }),
            prisma.project.findMany({
                select: { project_id: true, name: true, status: true, created_at: true },
                orderBy: { created_at: 'desc' },
                take: 5
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalProjects,
                    totalTasks,
                    pendingTasks,
                    completedTasks,
                    activeProjects
                },
                recentUsers,
                recentProjects
            }
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to fetch system overview: ${error.message}`, 500));
    }
});

/** -------- GET ALL PROJECTS -------- */
export const getAllProjects = catchAsyncError(async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        // Filter by status if specified
        if (status && status !== 'ALL') {
            where.status = status;
        }

        // Search functionality
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { client_name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                include: {
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
                    },
                    Tasks: {
                        select: {
                            task_id: true,
                            name: true,
                            status: true,
                            priority: true
                        }
                    },
                    Members: {
                        include: {
                            user: {
                                select: {
                                    user_id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.project.count({ where })
        ]);

        res.status(200).json({
            success: true,
            data: {
                projects,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to fetch projects: ${error.message}`, 500));
    }
});

/** -------- GET ALL TASKS -------- */
export const getAllTasks = catchAsyncError(async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status, priority, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        // Filter by status if specified
        if (status && status !== 'ALL') {
            where.status = status;
        }

        // Filter by priority if specified
        if (priority && priority !== 'ALL') {
            where.priority = priority;
        }

        // Search functionality
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                include: {
                    project: {
                        select: {
                            project_id: true,
                            name: true,
                            status: true
                        }
                    },
                    creator: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
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
                    }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.task.count({ where })
        ]);

        res.status(200).json({
            success: true,
            data: {
                tasks,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to fetch tasks: ${error.message}`, 500));
    }
});

/** -------- GET SYSTEM ANALYTICS -------- */
export const getSystemAnalytics = catchAsyncError(async (req, res, next) => {
    try {
        const { period = '30' } = req.query; // days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const [
            userGrowth,
            projectGrowth,
            taskCompletion,
            roleDistribution,
            projectStatusDistribution,
            taskStatusDistribution
        ] = await Promise.all([
            // User growth over time
            prisma.user.groupBy({
                by: ['created_at'],
                _count: { user_id: true },
                where: { created_at: { gte: startDate } },
                orderBy: { created_at: 'asc' }
            }),

            // Project growth over time
            prisma.project.groupBy({
                by: ['created_at'],
                _count: { project_id: true },
                where: { created_at: { gte: startDate } },
                orderBy: { created_at: 'asc' }
            }),

            // Task completion over time
            prisma.task.groupBy({
                by: ['status'],
                _count: { task_id: true }
            }),

            // Role distribution
            prisma.user.groupBy({
                by: ['Role'],
                _count: { user_id: true }
            }),

            // Project status distribution
            prisma.project.groupBy({
                by: ['status'],
                _count: { project_id: true }
            }),

            // Task status distribution
            prisma.task.groupBy({
                by: ['status'],
                _count: { task_id: true }
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                userGrowth,
                projectGrowth,
                taskCompletion,
                roleDistribution,
                projectStatusDistribution,
                taskStatusDistribution
            }
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to fetch system analytics: ${error.message}`, 500));
    }
});

/** -------- CREATE ADMIN USER -------- */
export const createAdminUser = catchAsyncError(async (req, res, next) => {
    try {
        const { name, email, password, account_name } = req.body;
        const currentAdminId = req.user?.user_id;

        // Check if current user is admin
        const currentUser = await prisma.user.findUnique({
            where: { user_id: currentAdminId },
            select: { Role: true }
        });

        if (!currentUser || currentUser.Role !== 'ADMIN') {
            return next(new ErrorHandler('Only existing admins can create new admin users', 403));
        }

        // Validate required fields
        if (!name || !email || !password) {
            return next(new ErrorHandler('Name, email, and password are required', 400));
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return next(new ErrorHandler('User with this email already exists', 400));
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create admin user
        const newAdmin = await prisma.user.create({
            data: {
                name,
                email,
                password_hash,
                account_name: account_name || null,
                Role: 'ADMIN',
                focus: [],
                active_status: 'Offline'
            },
            select: {
                user_id: true,
                name: true,
                email: true,
                Role: true,
                account_name: true,
                created_at: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Admin user created successfully',
            data: { user: newAdmin }
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to create admin user: ${error.message}`, 500));
    }
});

/** -------- DELETE USER -------- */
export const deleteUser = catchAsyncError(async (req, res, next) => {
    try {
        const { userId } = req.params;
        const currentAdminId = req.user?.user_id;

        // Check if current user is admin
        const currentUser = await prisma.user.findUnique({
            where: { user_id: parseInt(currentAdminId) },
            select: { Role: true }
        });

        if (!currentUser || currentUser.Role !== 'ADMIN') {
            return next(new ErrorHandler('Only admins can delete users', 403));
        }

        // Check if user exists
        const userToDelete = await prisma.user.findUnique({
            where: { user_id: parseInt(userId) },
            select: { user_id: true, name: true, email: true, Role: true }
        });

        if (!userToDelete) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Prevent admin from deleting themselves
        if (parseInt(userId) === currentAdminId) {
            return next(new ErrorHandler('Cannot delete your own account', 400));
        }

        // Prevent admin from deleting other admins (optional security measure)
        if (userToDelete.Role === 'ADMIN') {
            return next(new ErrorHandler('Cannot delete other admin users', 400));
        }

        // Check if user is a team leader
        const teamLeadership = await prisma.userTeam.findFirst({
            where: { leader_id: parseInt(userId) }
        });

        if (teamLeadership) {
            // Delete team relationships first
            await prisma.userTeam.deleteMany({
                where: { leader_id: parseInt(userId) }
            });
        }

        // Also check if user is a team member
        const teamMembership = await prisma.userTeam.findFirst({
            where: { user_id: parseInt(userId) }
        });

        if (teamMembership) {
            // Delete team memberships
            await prisma.userTeam.deleteMany({
                where: { user_id: parseInt(userId) }
            });
        }


        // Check if user has created projects
        const userProjects = await prisma.project.findFirst({
            where: { created_by: parseInt(userId) }
        });

        if (userProjects) {
            // Get all project IDs created by this user
            const projectIds = await prisma.project.findMany({
                where: { created_by: parseInt(userId) },
                select: { project_id: true }
            }).then(projects => projects.map(p => p.project_id));

            // Delete in correct order to avoid foreign key constraints

            // 1. Delete billing line items first
            await prisma.billingLineItem.deleteMany({
                where: {
                    billing_id: {
                        in: await prisma.billing.findMany({
                            where: { project_id: { in: projectIds } },
                            select: { billing_id: true }
                        }).then(billings => billings.map(b => b.billing_id))
                    }
                }
            });
            // 2. Delete invoices
            await prisma.invoice.deleteMany({
                where: { project_id: { in: projectIds } }
            });

            // 3. Delete case assignments
            await prisma.caseAssignment.deleteMany({
                where: { project_id: { in: projectIds } }
            });

            // 4. Delete billing configs and related data
            await prisma.memberRate.deleteMany({
                where: {
                    config_id: {
                        in: await prisma.billingConfig.findMany({
                            where: { project_id: { in: projectIds } },
                            select: { config_id: true }
                        }).then(configs => configs.map(c => c.config_id))
                    }
                }
            });

            await prisma.taskRate.deleteMany({
                where: {
                    config_id: {
                        in: await prisma.billingConfig.findMany({
                            where: { project_id: { in: projectIds } },
                            select: { config_id: true }
                        }).then(configs => configs.map(c => c.config_id))
                    }
                }
            });

            await prisma.billingConfig.deleteMany({
                where: { project_id: { in: projectIds } }
            });

            // 5. Delete billings
            await prisma.billing.deleteMany({
                where: { project_id: { in: projectIds } }
            });

            // 6. Delete documents, filled, signed, updates
            await prisma.documents.deleteMany({
                where: { project_id: { in: projectIds } }
            });

            await prisma.filled.deleteMany({
                where: { project_id: { in: projectIds } }
            });

            await prisma.signed.deleteMany({
                where: { project_id: { in: projectIds } }
            });

            await prisma.updates.deleteMany({
                where: { project_id: { in: projectIds } }
            });

            // 7. Delete project clients
            await prisma.projectClient.deleteMany({
                where: { project_id: { in: projectIds } }
            });

            // 8. Delete project members
            await prisma.projectMember.deleteMany({
                where: { project_id: { in: projectIds } }
            });

            // 9. Delete tasks and related data
            const taskIds = await prisma.task.findMany({
                where: { project_id: { in: projectIds } },
                select: { task_id: true }
            }).then(tasks => tasks.map(t => t.task_id));

            if (taskIds.length > 0) {
                // Delete task-related data
                await prisma.billingLineItem.deleteMany({
                    where: { task_id: { in: taskIds } }
                });

                await prisma.taskTime.deleteMany({
                    where: { task_id: { in: taskIds } }
                });

                await prisma.taskMember.deleteMany({
                    where: { task_id: { in: taskIds } }
                });

                await prisma.taskProgress.deleteMany({
                    where: { task_id: { in: taskIds } }
                });

                await prisma.review.deleteMany({
                    where: { task_id: { in: taskIds } }
                });

                await prisma.transcibtion.deleteMany({
                    where: { task_id: { in: taskIds } }
                });

                await prisma.email.deleteMany({
                    where: { task_id: { in: taskIds } }
                });

                await prisma.media.deleteMany({
                    where: { task_id: { in: taskIds } }
                });

                await prisma.meeting.deleteMany({
                    where: { task_id: { in: taskIds } }
                });

                await prisma.privateConversation.deleteMany({
                    where: { task_id: { in: taskIds } }
                });

                // Delete tasks
                await prisma.task.deleteMany({
                    where: { task_id: { in: taskIds } }
                });
            }

            // 10. Delete comments
            await prisma.comment.deleteMany({
                where: { project_id: { in: projectIds } }
            });

            // 11. Finally delete projects
            await prisma.project.deleteMany({
                where: { created_by: parseInt(userId) }
            });
        }

        // Check if user is a project member
        const projectMembership = await prisma.projectMember.findFirst({
            where: { user_id: parseInt(userId) }
        });

        if (projectMembership) {
            // Delete project memberships
            await prisma.projectMember.deleteMany({
                where: { user_id: parseInt(userId) }
            });
        }

        // Check if user is a project client
        const projectClient = await prisma.projectClient.findFirst({
            where: { user_id: parseInt(userId) }
        });

        if (projectClient) {
            // Get all project client IDs for this user
            const projectClientIds = await prisma.projectClient.findMany({
                where: { user_id: parseInt(userId) },
                select: { project_client_id: true }
            }).then(clients => clients.map(c => c.project_client_id));

            // Delete in correct order to avoid foreign key constraints

            // 1. Delete billing line items first
            await prisma.billingLineItem.deleteMany({
                where: {
                    billing_id: {
                        in: await prisma.billing.findMany({
                            where: { project_client_id: { in: projectClientIds } },
                            select: { billing_id: true }
                        }).then(billings => billings.map(b => b.billing_id))
                    }
                }
            });

            // 2. Delete billings
            await prisma.billing.deleteMany({
                where: { project_client_id: { in: projectClientIds } }
            });

            // 3. Delete documents, filled, signed, updates
            await prisma.documents.deleteMany({
                where: { project_client_id: { in: projectClientIds } }
            });

            await prisma.filled.deleteMany({
                where: { project_client_id: { in: projectClientIds } }
            });

            await prisma.signed.deleteMany({
                where: { project_client_id: { in: projectClientIds } }
            });

            await prisma.updates.deleteMany({
                where: { project_client_id: { in: projectClientIds } }
            });

            // 4. Finally delete project client relationships
            await prisma.projectClient.deleteMany({
                where: { user_id: parseInt(userId) }
            });
        }

        // Clean up other user-related data that might have foreign key constraints

        // Delete OTPs
        await prisma.oTP.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete notifications
        await prisma.notification.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete comments
        await prisma.comment.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete task progress
        await prisma.taskProgress.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete task time entries
        await prisma.taskTime.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete task memberships
        await prisma.taskMember.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete media
        await prisma.media.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete emails
        await prisma.email.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete transcriptions
        await prisma.transcibtion.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete meetings and related data
        const userMeetingIds = await prisma.meeting.findMany({
            where: { user_id: parseInt(userId) },
            select: { meeting_id: true }
        }).then(meetings => meetings.map(m => m.meeting_id));

        if (userMeetingIds.length > 0) {
            await prisma.meetingParticipant.deleteMany({
                where: { meeting_id: { in: userMeetingIds } }
            });

            await prisma.meetingTranscibtion.deleteMany({
                where: { meeting_id: { in: userMeetingIds } }
            });

            await prisma.meeting.deleteMany({
                where: { meeting_id: { in: userMeetingIds } }
            });
        }

        // Delete meeting participations
        await prisma.meetingParticipant.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete meeting transcriptions
        await prisma.meetingTranscibtion.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete private conversations and messages
        const privateConversationIds = await prisma.privateConversation.findMany({
            where: {
                OR: [
                    { user1_id: parseInt(userId) },
                    { user2_id: parseInt(userId) }
                ]
            },
            select: { private_conversation_id: true }
        }).then(conversations => conversations.map(c => c.private_conversation_id));

        if (privateConversationIds.length > 0) {
            await prisma.privateMessage.deleteMany({
                where: { private_conversation_id: { in: privateConversationIds } }
            });

            await prisma.privateConversation.deleteMany({
                where: { private_conversation_id: { in: privateConversationIds } }
            });
        }

        // Delete private messages
        await prisma.privateMessage.deleteMany({
            where: {
                OR: [
                    { sender_id: parseInt(userId) },
                    { receiver_id: parseInt(userId) }
                ]
            }
        });

        // Delete chat messages
        await prisma.message.deleteMany({
            where: { sender_id: parseInt(userId) }
        });

        // Delete chat participants
        await prisma.participant.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete expenses
        await prisma.expense.deleteMany({
            where: {
                OR: [
                    { user_id: parseInt(userId) },
                    { provider_id: parseInt(userId) }
                ]
            }
        });

        // Delete billing line items
        await prisma.billingLineItem.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete member rates
        await prisma.memberRate.deleteMany({
            where: { user_id: parseInt(userId) }
        });

        // Delete invoices
        await prisma.invoice.deleteMany({
            where: {
                OR: [
                    { client_id: parseInt(userId) },
                    { biller_id: parseInt(userId) }
                ]
            }
        });

        // Delete case assignments
        await prisma.caseAssignment.deleteMany({
            where: {
                OR: [
                    { biller_id: parseInt(userId) },
                    { assigned_by: parseInt(userId) }
                ]
            }
        });

        // Delete reviews
        await prisma.review.deleteMany({
            where: {
                OR: [
                    { submitted_by_id: parseInt(userId) },
                    { acted_by_id: parseInt(userId) }
                ]
            }
        });

        // Delete admin approvals
        await prisma.userRegistrationRequest.updateMany({
            where: { approved_by: parseInt(userId) },
            data: { approved_by: null }
        });

        // Delete the user (Prisma will handle cascading deletes)
        await prisma.user.delete({
            where: { user_id: parseInt(userId) }
        });

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: { deletedUser: userToDelete }
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to delete user: ${error.message}`, 500));
    }
});
