import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { validateAndTransformRequestBody } from '../utils/validateRequestBody.js';
import { CreateTaskRequestBodySchema } from '../schema/taskSchema.js';
import { transcribeFile } from '../services/taskService.js';
import { prisma } from "../prisma/index.js";
import { decrypt } from '../services/encryptionService.js';
import { fetchMail } from '../services/googleService.js';
import { uploadToCloud } from '../services/mediaService.js';
import { bytesToMB } from '../processors/bytesToMbProcessor.js';
import dayjs from 'dayjs';
import { dmmfToRuntimeDataModel } from '@prisma/client/runtime/library';
import { sendMail } from '../processors/sendMailProcessor.js';

async function getTaskDetailsByDate(taskId) {
    // Optimized: Use a single query with includes instead of multiple separate queries
    const taskWithDetails = await prisma.task.findUnique({
        where: { task_id: taskId },
        include: {
            Emails: {
                select: {
                    created_at: true,
                    content: true,
                    subject: true,
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        },
                    },
                },
            },
            Comments: {
                select: {
                    created_at: true,
                    content: true,
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        },
                    },
                },
            },
            Transcibtions: {
                select: {
                    created_at: true,
                    Transcibtion: true,
                    name: true,
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        },
                    },
                },
            },
            inReview: {
                select: {
                    created_at: true,
                    submissionDesc: true,
                    file_url: true,
                    filename: true,
                    action: true,
                    rejectedReason: true,
                },
            },
        },
    });

    if (!taskWithDetails) {
        return [];
    }

    // Combine and format data
    const combined = [
        ...taskWithDetails.Emails.map((email) => ({
            type: 'email',
            created_at: email.created_at,
            content: email.content,
            subject: email.subject,
            user: email.user,
        })),
        ...taskWithDetails.Comments.map((comment) => ({
            type: 'comment',
            created_at: comment.created_at,
            content: comment.content,
            user: comment.user,
        })),
        ...taskWithDetails.Transcibtions.map((transcription) => ({
            type: 'transcription',
            created_at: transcription.created_at,
            Transcibtion: transcription.Transcibtion,
            name: transcription.name,
            user: transcription.user,
        })),
        ...taskWithDetails.inReview.map((review) => ({
            type: 'review',
            created_at: review.created_at,
            submissionDesc: review.submissionDesc,
            file_url: review.file_url,
            filename: review.filename,
            action: review.action,
            rejectedReason: review.rejectedReason,
        })),
    ];

    // Group data by date
    const grouped = combined.reduce((acc, curr) => {
        const date = curr.created_at.toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = { date, emails: [], comments: [], transcriptions: [], reviews: [] };
        }
        if (curr.type === 'email') acc[date].emails.push(curr);
        if (curr.type === 'comment') acc[date].comments.push(curr);
        if (curr.type === 'transcription') acc[date].transcriptions.push(curr);
        if (curr.type === 'review') acc[date].reviews.push(curr);
        return acc;
    }, {});

    // Convert grouped data to array format
    return Object.values(grouped);
}

export const createTask = catchAsyncError(async (req, res, next) => {
    const user_id = req.user.user_id;
    const file = req.file; // Get uploaded file

    const [err, validatedData] = await validateAndTransformRequestBody(req.body, CreateTaskRequestBodySchema);
    if (!validatedData) {
        return next(new ErrorHandler(err, 401));
    }

    const { project_id, name, description, assigned_to, priority, last_date, otherMember, status, phase } = validatedData;

    // Check if the project exists and the user is a member
    const projectMember = await prisma.projectMember.findFirst({
        where: {
            project_id,
            user_id,
        }
    });

    const Project = await prisma.project.findUnique({
        where: {
            project_id
        },
        include: {
            Members: true
        }
    })

    if (!projectMember || projectMember.role != 'PROVIDER') {
        return next(new ErrorHandler("You are not a provider of this project", 403));
    }

    //add selected memer to add task
    const isAllProviderMemberInProject = otherMember.every(id =>
        Project.Members.some(member => member.user_id === id)
    );

    if (!isAllProviderMemberInProject) {
        return next(new ErrorHandler("You provider member is not in project.", 403));
    }

    // Create a task
    const task = await prisma.task.create({
        data: {
            project_id,
            name,
            description,
            created_by: user_id,
            assigned_to: assigned_to || null,
            priority,
            last_date,
            status,
            phase
        }
    });

    const memberData = otherMember.map(id => ({
        user_id: id,
        task_id: task.task_id
    }))

    memberData.push({
        user_id: assigned_to,
        task_id: task.task_id
    });

    const taskMember = await prisma.taskMember.createMany({
        data: memberData
    });

    // Handle file upload if present
    let media = null;
    if (file) {
        try {
            const cloudRes = await uploadToCloud(file);
            
            media = await prisma.media.create({
                data: {
                    task_id: task.task_id,
                    project_id: Number(project_id),
                    file_url: cloudRes.url,
                    key: cloudRes.key,
                    user_id: user_id,
                    filename: file.originalname,
                    mimeType: file.mimetype,
                    size: file.buffer.length
                }
            });

            // Create task progress entry for the attachment
            await prisma.taskProgress.create({
                data: {
                    message: `Task created with attachment: "${file.originalname}" (${bytesToMB(file.buffer.length)})`,
                    user_id: user_id,
                    task_id: task.task_id,
                    type: "MEDIA"
                }
            });
        } catch (uploadError) {
            console.error('File upload error:', uploadError);
            // Don't fail the task creation if file upload fails
            // Just log the error and continue
        }
    }

    res.status(201).json({
        success: true,
        task,
        media: media || null,
        message: media ? 'Task created successfully with attachment' : 'Task created successfully'
    });
});


export const getTaskById = catchAsyncError(async (req, res, next) => {
    const task_id = req.params.task_id;

    const task = await prisma.task.findUnique({
        where: {
            task_id: parseInt(task_id)
        },
        include: {
            assignees: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true
                        }
                    }
                }
            },
            Transcibtions: {
                select: {
                    transcribtion_id: true,
                    name: true,
                    Transcibtion: true,
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
                    },
                    created_at: true,
                }
            },

            Emails: {
                select: {
                    email_id: true,
                    subject: true,
                    content: true,
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
                    },
                    created_at: true,
                }
            },


            Comments: {
                select: {
                    comment_id: true,
                    content: true,
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
                    },
                    created_at: true,
                }
            },
            inReview: {
                select: {
                    review_id: true,
                    submissionDesc: true,
                    file_url: true,
                    size: true,
                    mimeType: true,
                    filename: true,
                    action: true,
                    rejectedReason: true,
                    created_at: true
                },
                orderBy: {
                    created_at: 'desc'
                }
            },
            Media: {
                select: {
                    media_id: true,
                    file_url: true,
                    filename: true,
                    mimeType: true,
                    size: true,
                    created_at: true,
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            }
        }
    });

    const progress = await getTaskDetailsByDate(parseInt(task_id));

    res.status(200).json({
        success: true,
        task,
        progress
    });
});


export const getTasksByProject = catchAsyncError(async (req, res, next) => {
    const { project_id } = req.params;

    // Validate project existence
    const project = await prisma.project.findUnique({
        where: { project_id: parseInt(project_id) },
        include: {
            Tasks: {
                include: {
                    assignees: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true
                                }
                            }
                        }
                    }
                }
            }
        },
    });

    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    res.status(200).json({
        success: true,
        tasks: project.Tasks,
    });
});


export const updateTask = catchAsyncError(async (req, res, next) => {
    const { task_id } = req.params;
    const { name, description, status, assigned_to, priority, last_date, phase, stuckReason, overDueReason } = req.body;
    const user_id = req.user.user_id;

    // Fetch task and validate permissions
    const task = await prisma.task.findUnique({
        where: { task_id: parseInt(task_id) },
        include: { project: { include: { Members: true } } },
    });

    if (!task) {
        return next(new ErrorHandler("Task not found", 404));
    }

    const isProjectAdmin = task.project.Members.some(
        (member) => member.user_id === user_id && (member.role === "PROVIDER" || member.role === "TEAM")
    );

    if (task.created_by !== user_id && !isProjectAdmin) {
        return next(new ErrorHandler("You are not authorized to update this task", 403));
    }

    // Update task
    const updateData = {};
    if (name) updateData['name'] = name;
    if (description) updateData['description'] = description;
    if (status) updateData['status'] = status;
    if (assigned_to) updateData['assigned_to'] = assigned_to;
    if (priority) updateData['priority'] = priority;
    if (last_date) updateData['last_date'] = last_date;
    if (phase) updateData['phase'] = phase;
    if (stuckReason) updateData['stuckReason'] = stuckReason;
    if (overDueReason) updateData['overDueReason'] = overDueReason;

    const updatedTask = await prisma.task.update({
        where: { task_id: parseInt(task_id) },
        data: updateData,
    });

    if (updatedTask) {
        await prisma.taskProgress.create({
            data: {
                message: `User updated "${updatedTask.name}" task.`,
                user_id: user_id,
                task_id: updatedTask.task_id,
                type: "OTHER"
            }
        });
    }

    res.status(200).json({
        success: true,
        task: updatedTask,
    });
});

export const deleteTask = catchAsyncError(async (req, res, next) => {
    const { task_id } = req.params;
    const user_id = req.user.user_id;

    // Fetch task and validate permissions
    const task = await prisma.task.findUnique({
        where: { task_id: parseInt(task_id) },
        include: { project: { include: { Members: true } } },
    });

    if (!task) {
        return next(new ErrorHandler("Task not found", 404));
    }

    const isProjectAdmin = task.project.Members.some(
        (member) => member.user_id === user_id && member.role === "PROVIDER"
    );

    if (task.created_by !== user_id && !isProjectAdmin) {
        return next(new ErrorHandler("You are not authorized to delete this task", 403));
    }

    // Use a transaction with increased timeout to handle all operations
    await prisma.$transaction(async (tx) => {
        // Delete all related records in parallel where possible to speed up the process

        // Delete all related records in parallel (these don't depend on each other)
        await Promise.all([
            // Delete TaskProgress records
            tx.taskProgress.deleteMany({
                where: { task_id: parseInt(task_id) },
            }),

            // Delete TaskTime records
            tx.taskTime.deleteMany({
                where: { task_id: parseInt(task_id) },
            }),

            // Delete Media records
            tx.media.deleteMany({
                where: { task_id: parseInt(task_id) },
            }),

            // Delete Review records
            tx.review.deleteMany({
                where: { task_id: parseInt(task_id) },
            }),

            // Delete Email records
            tx.email.deleteMany({
                where: { task_id: parseInt(task_id) },
            }),

            // Delete Transcibtion records
            tx.transcibtion.deleteMany({
                where: { task_id: parseInt(task_id) },
            }),

            // Delete TaskMember records
            tx.taskMember.deleteMany({
                where: { task_id: parseInt(task_id) },
            }),
        ]);

        // Delete Meeting-related records (these need to be done sequentially due to foreign key relationships)
        const meetings = await tx.meeting.findMany({
            where: { task_id: parseInt(task_id) },
            select: { meeting_id: true }
        });

        if (meetings.length > 0) {
            const meetingIds = meetings.map(m => m.meeting_id);

            // Delete meeting-related records in parallel
            await Promise.all([
                tx.meetingTranscibtion.deleteMany({
                    where: { meeting_id: { in: meetingIds } }
                }),
                tx.meetingParticipant.deleteMany({
                    where: { meeting_id: { in: meetingIds } }
                })
            ]);

            // Delete Meeting records
            await tx.meeting.deleteMany({
                where: { task_id: parseInt(task_id) },
            });
        }

        // Finally, delete the task itself
        await tx.task.delete({
            where: { task_id: parseInt(task_id) },
        });
    }, {
        timeout: 30000 // Increase timeout to 30 seconds
    });

    res.status(200).json({
        success: true,
        message: "Task deleted successfully",
    });
});

export const addMembersToTask = catchAsyncError(async (req, res, next) => {
    const { task_id } = req.params
    const { otherMember } = req.body;

    // Fetch task and project
    const task = await prisma.task.findUnique({
        where: { task_id: parseInt(task_id) },
        include: { project: { include: { Members: true } } },
    });

    if (!task) {
        return next(new ErrorHandler("Task not found", 404));
    }

    const isAllProviderMemberInProject = otherMember.every(id =>
        task.project.Members.some(member => member.user_id === id)
    );



    if (!isAllProviderMemberInProject) {
        return next(new ErrorHandler("Users is not a member of this project", 403));
    }

    const memberData = otherMember.map(id => ({
        user_id: id,
        task_id: task.task_id
    }))

    // Add member to task
    const taskMember = await prisma.taskMember.createMany({
        data: memberData,
    });

    res.status(201).json({
        success: true,
        taskMember,
    });
});



export const addTranscibtion = catchAsyncError(async (req, res, next) => {
    let { task_id, name } = req.body;
    const user_id = req.user.user_id;
    if (!task_id || !name) return next(new ErrorHandler(401, "Task Id is required."));

    const task = await prisma.task.findUnique({
        where: {
            task_id: parseInt(task_id)
        }
    });



    if (!task) return next(new ErrorHandler(401, "Invalid Task Id"));


    const file = req.file;
    if (!file || !name) return next(new ErrorHandler(401, "File And Name Required."));
    const fileBuffer = file.buffer;
    const Transcibtion = await transcribeFile(fileBuffer);

    await prisma.transcibtion.create({
        data: {
            task_id: parseInt(task_id),
            user_id: user_id,
            Transcibtion: Transcibtion,
            name: name
        }
    })

    res.status(200).json({
        success: true,
        message: 'Audio Tanscibed Successfully',
    });
});


export const addComments = catchAsyncError(async (req, res, next) => {
    let { project_id, content } = req.body;
    const user_id = req.user.user_id;
    if (!project_id) return next(new ErrorHandler(401, "Task Id is required."));



    if (!content) return next(new ErrorHandler(401, "Content is required."));

    await prisma.comment.create({
        data: {
            project_id: parseInt(project_id),
            user_id: user_id,
            content: content
        }
    })



    // await prisma.taskProgress.create({
    //     data: {
    //         message: `User Add a comments: ${content}`,
    //         user_id: user_id,
    //         task_id: parseInt(task_id),
    //         type: "COMMENT"
    //     }
    // });


    res.status(200).json({
        success: true,
        message: 'Comment Add Successfully',
    });
});

export const getComments = catchAsyncError(async (req, res, next) => {
    let { task_id: project_id } = req.params;
    const user_id = req.user.user_id;
    if (!project_id) return next(new ErrorHandler(401, "Task Id is required."));





    const comments = await prisma.comment.findMany({
        where: {
            project_id: parseInt(project_id)
        },
        select: {
            content: true,
            comment_id: true,
            created_at: true,
            user: {
                select: {
                    user_id: true,
                    name: true,
                    email: true
                }
            }
        }
    })

    res.status(200).json({
        success: true,
        comments
    });
});

export const addEmail = catchAsyncError(async (req, res, next) => {
    let { task_id, subject, content } = req.body;
    const user_id = req.user.user_id;
    const file = req.file;

    if (!content || !subject) {
        return next(new ErrorHandler("Content and subject are required.", 400));
    }

    let project_id = null;
    let data = [];
    let emailsToSend = [];

    // If task_id is provided and not "no-task", validate and process it
    if (task_id && task_id !== 'no-task' && task_id !== 'undefined' && task_id !== 'null' && task_id.trim() !== '') {
        const task = await prisma.task.findUnique({
            where: {
                task_id: parseInt(task_id)
            },
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
                }
            }
        });

        if (!task) return next(new ErrorHandler("Invalid Task Id", 400));

        project_id = task.project_id;

        // Get sender info
        const sender = await prisma.user.findUnique({
            where: { 
                user_id: user_id 
            },
            select: { 
                name: true, 
                email: true 
            }
        });

        if (!sender) {
            return next(new ErrorHandler("Sender user not found", 404));
        }

        // Create HTML content for email
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">${subject}</h2>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    ${content.replace(/\n/g, '<br>')}
                </div>
                <p style="color: #666; font-size: 14px;">
                    Sent by: ${sender.name} (${sender.email})<br>
                    Task: ${task.name}<br>
                    Date: ${new Date().toLocaleDateString()}
                </p>
            </div>
        `;

        // Handle file upload if present
        let attachmentData = {};
        if (file) {
            const cloudRes = await uploadToCloud(file);
            attachmentData = {
                attachment_url: cloudRes.url,
                attachment_name: file.originalname,
                attachment_size: file.buffer.length,
                attachment_mime_type: file.mimetype
            };
        }

        data.push({
            task_id: parseInt(task_id),
            user_id: user_id,
            content,
            subject,
            project_id,
            ...attachmentData
        });

        // Send emails to all task assignees except the sender
        for (const assignee of task.assignees) {
            if (assignee.user_id === user_id) continue;
            
            data.push({
                task_id: parseInt(task_id),
                user_id: user_id,
                content,
                subject,
                to_user: assignee.user_id,
                project_id,
                ...attachmentData
            });

            // Add to emails to send
            emailsToSend.push({
                to: assignee.user.email,
                subject: `[Task: ${task.name}] ${subject}`,
                html: htmlContent
            });
        }

        // Log task progress
        await prisma.taskProgress.create({
            data: {
                message: `User sent a mail: ${subject}`,
                user_id: user_id,
                task_id: parseInt(task_id),
                type: "MAIL"
            }
        });
    } else {
        // Without task_id, send email only to self
        // Handle file upload if present
        let attachmentData = {};
        if (file) {
            const cloudRes = await uploadToCloud(file);
            attachmentData = {
                attachment_url: cloudRes.url,
                attachment_name: file.originalname,
                attachment_size: file.buffer.length,
                attachment_mime_type: file.mimetype
            };
        }

        data.push({
            user_id: user_id,
            content,
            subject,
            ...attachmentData
        });
    }

    // Save emails to database
    await prisma.email.createMany({ data });

    // Send actual emails
    for (const emailData of emailsToSend) {
        try {
            await sendMail(emailData.subject, emailData.to, emailData.html);
        } catch (error) {
            console.error(`Failed to send email to ${emailData.to}:`, error.message);
            // Continue with other emails even if one fails
        }
    }

    res.status(200).json({
        success: true,
        message: 'Email sent successfully.',
        emailsSent: emailsToSend.length
    });
});



export const addMailClient = catchAsyncError(async (req, res, next) => {
    let { client_id, task_id, subject, content } = req.body;
    const user_id = req.user.user_id;
    const file = req.file;
    
    // Make task_id optional - only require it if it's provided and valid
    if (task_id && task_id !== 'no-task' && task_id !== 'undefined' && task_id !== 'null' && task_id.trim() !== '') {
        // Validate task if task_id is provided
        const task = await prisma.task.findUnique({
            where: {
                task_id: parseInt(task_id)
            },
            include: {
                project: {
                    select: {
                        name: true,
                        project_id: true
                    }
                }
            }
        });

        if (!task) return next(new ErrorHandler(401, "Invalid Task Id"));
    }

    if (!content || !subject) return next(new ErrorHandler(401, "Content and subject is required."));

    // Get sender info
    const sender = await prisma.user.findUnique({
        where: { 
            user_id: user_id 
        },
        select: { 
            name: true, 
            email: true 
        }
    });

    if (!sender) {
        return next(new ErrorHandler("Sender user not found", 404));
    }

    // Get client info directly using user_id
    const client = await prisma.user.findUnique({
        where: { 
            user_id: parseInt(client_id) 
        },
        select: { 
            user_id: true,
            name: true, 
            email: true 
        }
    });

    if (!client) {
        return next(new ErrorHandler("Client not found", 404));
    }

    let project_id = null;
    let taskName = null;
    let projectName = null;

    // If task_id is provided, get task and project info
    if (task_id && task_id !== 'no-task' && task_id !== 'undefined' && task_id !== 'null' && task_id.trim() !== '') {
        const task = await prisma.task.findUnique({
            where: {
                task_id: parseInt(task_id)
            },
            include: {
                project: {
                    select: {
                        name: true,
                        project_id: true
                    }
                }
            }
        });

        if (!task) return next(new ErrorHandler(401, "Invalid Task Id"));

        project_id = task.project_id;
        taskName = task.name;
        projectName = task.project.name;

        // Verify that the client is actually a member of this project
        const projectClient = await prisma.projectClient.findFirst({
            where: {
                project_id: task.project_id,
                user_id: client.user_id
            }
        });

        if (!projectClient) {
            return next(new ErrorHandler("Client is not a member of this project", 403));
        }
    } else {
        // For general emails, find a project where the client is a member
        const projectClient = await prisma.projectClient.findFirst({
            where: {
                user_id: client.user_id
            },
            include: {
                project: {
                    select: {
                        name: true,
                        project_id: true
                    }
                }
            }
        });

        if (projectClient) {
            project_id = projectClient.project.project_id;
            projectName = projectClient.project.name;
        }
    }

    // Create HTML content for email
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                ${content.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #666; font-size: 14px;">
                Sent by: ${sender.name} (${sender.email})<br>
                ${projectName ? `Project: ${projectName}<br>` : ''}
                ${taskName ? `Task: ${taskName}<br>` : ''}
                Date: ${new Date().toLocaleDateString()}
            </p>
        </div>
    `;

    // Handle file upload if present
    let attachmentData = {};
    if (file) {
        const cloudRes = await uploadToCloud(file);
        attachmentData = {
            attachment_url: cloudRes.url,
            attachment_name: file.originalname,
            attachment_size: file.buffer.length,
            attachment_mime_type: file.mimetype
        };
    }

    // Save email to database
    const emailData = {
        user_id: user_id,
        content: content,
        subject: subject,
        to_user: client.user_id,
        ...attachmentData
    };

    // Only add task_id and project_id if they exist
    if (task_id && task_id !== 'no-task' && task_id !== 'undefined' && task_id !== 'null' && task_id.trim() !== '') {
        emailData.task_id = parseInt(task_id);
    }
    if (project_id) {
        emailData.project_id = project_id;
    }

    await prisma.email.create({
        data: emailData
    });

    // Send actual email to client
    try {
        const emailSubject = projectName ? `[Project: ${projectName}] ${subject}` : subject;
        await sendMail(emailSubject, client.email, htmlContent);
    } catch (error) {
        console.error(`Failed to send email to client ${client.email}:`, error.message);
        return next(new ErrorHandler("Failed to send email to client", 500));
    }

    // Only create task progress if task_id exists
    if (task_id && task_id !== 'no-task' && task_id !== 'undefined' && task_id !== 'null' && task_id.trim() !== '') {
        await prisma.taskProgress.create({
            data: {
                message: `User Send a mail subject: ${subject}`,
                user_id: user_id,
                task_id: parseInt(task_id),
                type: "MAIL"
            }
        });
    }

    res.status(200).json({
        success: true,
        message: 'Email sent successfully to client.',
    });
});

export const getMails = catchAsyncError(async (req, res, next) => {
    const user_id = req.user.user_id;
    const { date } = req.query;
    const whereCondition = {
        OR: [
            { user_id: user_id },
            { to_user: user_id },
        ],
    };

    // Check if both start and end dates are provided
    if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);


        whereCondition.created_at = {
            gte: startOfDay,
            lte: endOfDay,
        };
    }
    const emails = await prisma.email.findMany({
        where: whereCondition,
        include: {
            user: {
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
        emails
    });
});





export const getProgress = catchAsyncError(async (req, res, next) => {
    const task_id = req.params.task_id;
    const { date } = req.query;

    const whereCondition = {
        task_id: parseInt(task_id)
    };


    if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);


        whereCondition.created_at = {
            gte: startOfDay,
            lte: endOfDay,
        };
    }

    const progresss = await prisma.taskProgress.findMany({
        where: whereCondition,
        include: {
            user: {
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
        progresss
    });
});





export const getConnectMails = catchAsyncError(async (req, res, next) => {
    const user_id = req.user.user_id;
    const count = Math.min(parseInt(req.query.count) || 100, 1000); // Default to 100, max 1000 emails
    const user = await prisma.user.findFirst({
        where: {
            user_id: user_id,
        },
        select: {
            connect_mail_hash: true,
            encryption_key: true,
            encryption_vi: true
        }
    });

    if (!user.connect_mail_hash) {
        next(new ErrorHandler("Please Connect Mail First", 401));
        return
    }

    const decryptData = decrypt(user.connect_mail_hash, user.encryption_key, user.encryption_vi);
    const [mail, password] = decryptData.split('|');

    // Fetch emails based on the count parameter
    const mails = await fetchMail(mail, password, count);


    res.status(200).json({
        success: true,
        mails
    });
});



export const getAllTaskProgress = catchAsyncError(async (req, res, next) => {
    let sdate = req.query.sdate;
    let edate = req.query.edate;
    let type = req.query.type;
    const project_id = req.query.project_id ? parseInt(req.query.project_id) : null;
    const user_id = req.user.user_id;

    // Parse date properly
    sdate = sdate ? dayjs(sdate, "DD-MM-YYYY", true) : dayjs();
    edate = edate ? dayjs(edate, "DD-MM-YYYY", true) : dayjs();

    // Define the start and end of the day
    const startOfDay = sdate.startOf("day").utc().toDate(); // Convert to UTC
    const endOfDay = edate.endOf("day").utc().toDate(); // Convert to UTC

    // Get user's projects since they're not included in basic auth middleware
    const userProjects = await prisma.projectMember.findMany({
        where: {
            user_id: user_id
        },
        select: {
            project_id: true
        }
    });

    const projectIds = userProjects.map(project => project.project_id);

    if (projectIds.length === 0) {
        return res.status(200).json({
            success: true,
            progress: [],
            times: [],
            documents: []
        });
    }

    const where = {
        created_at: {
            gte: startOfDay,
            lte: endOfDay
        }
    };

    if (type) {
        where["type"] = type
    }

    let documents = await prisma.project.findMany({
        where: {
            project_id: {
                in: project_id ? [project_id] : projectIds
            }
        },
        select: {
            name: true,
            Clients: {
                select: {
                    Documents: {
                        where: {
                            ...where
                        },

                    }
                }
            }
        }
    })

    let progress = await prisma.project.findMany({
        where: {
            project_id: {
                in: project_id ? [project_id] : projectIds
            }
        },
        select: {
            name: true,
            description: true,
            Tasks: {
                select: {
                    Progress: {
                        where: {
                            ...where
                        },
                        select: {
                            message: true,
                            created_at: true,
                            progress_id: true,
                            type: true,
                            task: {
                                select: {
                                    name: true,
                                    assigned_to: true,
                                    assignees: true,
                                    description: true
                                }
                            },
                            user: {
                                select: {
                                    name: true,
                                }
                            },
                        }
                    }
                }
            }
        }
    })

    let times = await prisma.project.findMany({
        where: {
            project_id: {
                in: project_id ? [project_id] : projectIds
            }
        },
        select: {
            name: true,
            description: true,
            Time: {
                where: {
                    created_at: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                select: {
                    created_at: true,
                    end: true,
                    start: true,
                    status: true,
                    work_description: true,
                    task: {
                        select: {
                            name: true,
                            description: true
                        }
                    },
                    time_id: true,
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            }
        }
    });

    res.status(200).json({
        success: true,
        progress,
        times,
        documents
    });
});

// Get comprehensive task details for a project including reviews, rejections, etc.
export const getProjectTaskDetails = catchAsyncError(async (req, res, next) => {
    const project_id = req.query.project_id ? parseInt(req.query.project_id) : null;
    const user_id = req.user.user_id;

    if (!project_id) {
        return res.status(400).json({
            success: false,
            message: "Project ID is required"
        });
    }

    // Get user's projects to ensure they have access
    const userProjects = await prisma.projectMember.findMany({
        where: {
            user_id: user_id
        },
        select: {
            project_id: true
        }
    });

    const projectIds = userProjects.map(project => project.project_id);

    if (!projectIds.includes(project_id)) {
        return res.status(403).json({
            success: false,
            message: "Access denied to this project"
        });
    }

    // Get comprehensive task details
    const tasks = await prisma.task.findMany({
        where: {
            project_id: project_id
        },
        include: {
            inReview: {
                orderBy: {
                    created_at: 'desc'
                },
                select: {
                    review_id: true,
                    created_at: true,
                    submissionDesc: true,
                    file_url: true,
                    filename: true,
                    action: true,
                    rejectedReason: true,
                    submitted_by: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
                    },
                    acted_by: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            },
            Progress: {
                orderBy: {
                    created_at: 'desc'
                },
                select: {
                    progress_id: true,
                    message: true,
                    created_at: true,
                    type: true,
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            },
            Media: {
                select: {
                    media_id: true,
                    file_url: true,
                    filename: true,
                    mimeType: true,
                    size: true,
                    created_at: true,
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            },
            Time: {
                orderBy: {
                    created_at: 'desc'
                },
                select: {
                    time_id: true,
                    start: true,
                    end: true,
                    status: true,
                    work_description: true,
                    created_at: true,
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            },
            assignees: {
                select: {
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            },

        },
        orderBy: {
            created_at: 'desc'
        }
    });

    // Process tasks to include computed fields
    const processedTasks = tasks.map(task => {
        const latestReview = task.inReview[0];
        const totalTime = task.Time.reduce((acc, time) => {
            if (time.start && time.end) {
                const duration = new Date(time.end) - new Date(time.start);
                return acc + duration;
            }
            return acc;
        }, 0);

        return {
            ...task,
            latestReview,
            totalTimeHours: Math.round((totalTime / (1000 * 60 * 60)) * 100) / 100,
            reviewCount: task.inReview.length,
            progressCount: task.Progress.length,
            timeEntriesCount: task.Time.length,
            commentCount: 0, // Comments are not directly related to tasks
            isRejected: latestReview?.action === 'REJECTED',
            isApproved: latestReview?.action === 'APPROVED',
            isPendingReview: latestReview?.action === 'PENDING' || !latestReview
        };
    });

    res.status(200).json({
        success: true,
        tasks: processedTasks,
        summary: {
            totalTasks: processedTasks.length,
            rejectedTasks: processedTasks.filter(t => t.isRejected).length,
            approvedTasks: processedTasks.filter(t => t.isApproved).length,
            pendingReview: processedTasks.filter(t => t.isPendingReview).length,
            totalTimeHours: processedTasks.reduce((acc, t) => acc + t.totalTimeHours, 0)
        }
    });
});






export const createTime = catchAsyncError(async (req, res, next) => {
    const task_id = req.params.task_id;
    const user_id = req.user.user_id;

    const task = await prisma.task.findUnique({
        where: {
            task_id: parseInt(task_id)
        }
    })
    const taskTime = await prisma.taskTime.create({
        data: {
            start: new Date(Date.now()),
            status: "PROCESSING",
            task_id: parseInt(task_id),
            user_id: parseInt(user_id),
            project_id: task.project_id
        }
    });

    res.status(200).json({
        success: true,
        message: "Time start successfully"
    });
});


export const stopTime = catchAsyncError(async (req, res, next) => {
    const time_id = req.params.time_id;
    const description = req.body.description;

    await prisma.taskTime.update({
        where: {
            time_id
        },
        data: {
            end: new Date(Date.now()),
            status: "ENDED",
            work_description: description
        }
    });

    res.status(200).json({
        success: true,
        message: "Time Stop successfully"
    });
});

// Get tasks that need review
export const getTasksNeedingReview = catchAsyncError(async (req, res, next) => {
    const user_id = req.user.user_id;
    const { project_id } = req.query;

    // Build where clause
    const whereClause = {
        status: 'IN_REVIEW'
    };

    if (project_id) {
        whereClause.project_id = parseInt(project_id);
    }

    // Get user's projects where they are admin
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
        return res.status(200).json({
            success: true,
            tasks: [],
            count: 0
        });
    }

    // Add project filter
    whereClause.project_id = {
        in: userProjects.map(p => p.project_id)
    };

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

    res.status(200).json({
        success: true,
        tasks,
        count: tasks.length
    });
});

// Get all tasks for a user grouped by date
export const getAllUserTasks = catchAsyncError(async (req, res, next) => {
    const user_id = req.user.user_id;

    // Get user's project IDs
    const userProjects = await prisma.projectMember.findMany({
        where: { user_id },
        select: { project_id: true }
    });

    const projectIds = userProjects.map(p => p.project_id);

    if (projectIds.length === 0) {
        return res.status(200).json({
            success: true,
            tasks: [],
            totalTasks: 0
        });
    }

    // Get tasks that are either assigned to the user or where user is a task member
    const tasks = await prisma.task.findMany({
        where: {
            project_id: { in: projectIds },
            OR: [
                { assigned_to: user_id }, // Tasks directly assigned to user
                {
                    assignees: {
                        some: {
                            user_id: user_id // Tasks where user is a task member
                        }
                    }
                }
            ]
        },
        include: {
            project: {
                select: {
                    name: true,
                    project_id: true
                }
            },
            assignees: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true
                        }
                    }
                }
            },
            creator: {
                select: {
                    name: true,
                    email: true,
                    user_id: true
                }
            }
        },
        orderBy: {
            last_date: 'asc'
        }
    });

    res.status(200).json({
        success: true,
        tasks,
        totalTasks: tasks.length
    });
});

export const createSignatureEmail = catchAsyncError(async (req, res, next) => {
    const { project_client_id, name, description, user_id } = req.body;
    
    if (!project_client_id || !name || !description || !user_id) {
        return next(new ErrorHandler("All fields are required", 400));
    }

    // Get project client info
    const projectClient = await prisma.projectClient.findFirst({
        where: { project_client_id },
        include: {
            user: true,
            project: true
        }
    });

    if (!projectClient) {
        return next(new ErrorHandler("Invalid project client", 400));
    }

    // Create email record in database
    const email = await prisma.email.create({
        data: {
            user_id: user_id, // The provider/lawyer who requested the signature
            to_user: projectClient.user_id, // The client who needs to sign
            subject: `Submit Document - ${name}`,
            content: `Please review and sign the document: ${description}. Click the link below to access the document.`,
            project_id: projectClient.project_id,
            created_at: new Date()
        }
    });

    res.status(200).json({
        success: true,
        email
    });
});

export const createDocumentRequestEmail = catchAsyncError(async (req, res, next) => {
    const { project_client_id, name, description, user_id } = req.body;
    
    if (!project_client_id || !name || !description || !user_id) {
        return next(new ErrorHandler("All fields are required", 400));
    }

    // Get project client info
    const projectClient = await prisma.projectClient.findFirst({
        where: { project_client_id },
        include: {
            user: true,
            project: true
        }
    });

    if (!projectClient) {
        return next(new ErrorHandler("Invalid project client", 400));
    }

    // Create email record in database
    const email = await prisma.email.create({
        data: {
            user_id: user_id, // The provider/lawyer who requested the document
            to_user: projectClient.user_id, // The client who needs to submit
            subject: `Document Request - ${name}`,
            content: `Please submit the requested document: ${description}.`,
            project_id: projectClient.project_id,
            created_at: new Date()
        }
    });

    res.status(200).json({
        success: true,
        email
    });
});

// Get time efficiency data for all team members
export const getTimeEfficiencyData = catchAsyncError(async (req, res, next) => {
    const { project_id } = req.query;
    const user_id = req.user.user_id;

    // Get all projects the user has access to
    let projectIds = [];
    
    if (project_id) {
        // If specific project is provided, use only that project
        projectIds = [parseInt(project_id)];
    } else {
        // Get all projects the user is a member of
        const userProjects = await prisma.projectMember.findMany({
            where: { user_id },
            select: { project_id: true }
        });
        projectIds = userProjects.map(p => p.project_id);
        
        // If user is a provider, also get projects they created
        if (req.user.Role === 'PROVIDER') {
            const createdProjects = await prisma.project.findMany({
                where: { created_by: user_id },
                select: { project_id: true }
            });
            const createdProjectIds = createdProjects.map(p => p.project_id);
            projectIds = [...new Set([...projectIds, ...createdProjectIds])];
        }
    }

    if (projectIds.length === 0) {
        return res.status(200).json({
            success: true,
            efficiencyData: []
        });
    }

    // Get all project members from the accessible projects
    const projectMembers = await prisma.projectMember.findMany({
        where: { 
            project_id: { in: projectIds }
        },
        include: {
            user: {
                select: {
                    user_id: true,
                    name: true,
                    email: true,
                    Role: true
                }
            },
            project: {
                select: {
                    project_id: true,
                    name: true
                }
            }
        }
    });

    // Group members by user to avoid duplicates and filter out CLIENT users
    const uniqueMembers = new Map();
    projectMembers.forEach(member => {
        const userId = member.user.user_id;
        // Skip users with CLIENT role
        if (member.user.Role === 'CLIENT') return;
        
        if (!uniqueMembers.has(userId)) {
            uniqueMembers.set(userId, {
                user: member.user,
                projects: []
            });
        }
        uniqueMembers.get(userId).projects.push(member.project);
    });

    const efficiencyData = [];

    for (const [userId, memberData] of uniqueMembers) {
        const user = memberData.user;

        // Get time tracking data for the last 30 days across all accessible projects
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const timeEntries = await prisma.taskTime.findMany({
            where: {
                user_id: userId,
                project_id: { in: projectIds },
                created_at: {
                    gte: thirtyDaysAgo
                },
                status: 'ENDED'
            },
            include: {
                task: {
                    select: {
                        name: true,
                        status: true,
                        priority: true
                    }
                }
            }
        });

        // Calculate time distribution
        let taskHours = 0;
        let meetingHours = 0;
        let clientHours = 0;
        let researchHours = 0;
        let totalHours = 0;

        timeEntries.forEach(entry => {
            if (entry.end) {
                const durationMs = new Date(entry.end).getTime() - new Date(entry.start).getTime();
                const durationHours = durationMs / (1000 * 60 * 60);
                totalHours += durationHours;

                // Categorize time based on work description or task type
                const description = entry.work_description?.toLowerCase() || '';
                const taskName = entry.task?.name?.toLowerCase() || '';

                if (description.includes('meeting') || taskName.includes('meeting')) {
                    meetingHours += durationHours;
                } else if (description.includes('client') || taskName.includes('client')) {
                    clientHours += durationHours;
                } else if (description.includes('research') || taskName.includes('research')) {
                    researchHours += durationHours;
                } else {
                    taskHours += durationHours;
                }
            }
        });

        // Get task statistics across all accessible projects
        const assignedTasks = await prisma.task.findMany({
            where: {
                project_id: { in: projectIds },
                assignees: {
                    some: {
                        user_id: userId
                    }
                }
            },
            include: {
                inReview: {
                    select: {
                        action: true,
                        rejectedReason: true
                    }
                }
            }
        });

        const completedTasks = assignedTasks.filter(task => task.status === 'DONE');
        const totalTasks = assignedTasks.length;
        const tasksCompleted = completedTasks.length;

        // Calculate review statistics
        const reviews = await prisma.review.findMany({
            where: {
                task: {
                    project_id: { in: projectIds },
                    assignees: {
                        some: {
                            user_id: userId
                        }
                    }
                }
            }
        });

        const totalReviews = reviews.length;
        const approvedReviews = reviews.filter(r => r.action === 'APPROVED').length;
        const rejectedReviews = reviews.filter(r => r.action === 'REJECTED').length;
        const pendingReviews = reviews.filter(r => !r.action).length;

        // Calculate efficiency metrics
        const taskAccuracy = totalReviews > 0 ? (approvedReviews / totalReviews) * 100 : 100;
        const efficiency = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
        
        // Get recent tasks with comments
        const recentTasks = await prisma.task.findMany({
            where: {
                project_id: { in: projectIds },
                assignees: {
                    some: {
                        user_id: userId
                    }
                }
            },
            take: 5,
            orderBy: {
                updated_at: 'desc'
            },
            include: {
                project: {
                    select: {
                        name: true
                    }
                },
                inReview: {
                    select: {
                        action: true,
                        rejectedReason: true,
                        submissionDesc: true,
                        created_at: true,
                        acted_by: {
                            select: {
                                name: true,
                                Role: true
                            }
                        }
                    }
                },
                Progress: {
                    take: 1,
                    orderBy: {
                        created_at: 'desc'
                    },
                    include: {
                        user: {
                            select: {
                                name: true,
                                Role: true
                            }
                        }
                    }
                }
            }
        });

        const tasksWithComments = recentTasks.map(task => {
            const latestReview = task.inReview[0];
            const latestProgress = task.Progress[0];
            
            let comments = [];
            
            if (latestReview) {
                comments.push({
                    id: 1,
                    author: latestReview.acted_by?.name || 'Reviewer',
                    role: latestReview.acted_by?.Role || 'Reviewer',
                    text: latestReview.action === 'REJECTED' 
                        ? `Review rejected: ${latestReview.rejectedReason}` 
                        : latestReview.action === 'APPROVED'
                        ? 'Review approved'
                        : latestReview.submissionDesc,
                    time: latestReview.created_at
                });
            }
            
            if (latestProgress) {
                comments.push({
                    id: 2,
                    author: latestProgress.user.name,
                    role: latestProgress.user.Role,
                    text: latestProgress.message,
                    time: latestProgress.created_at
                });
            }

            return {
                id: task.task_id,
                name: task.name,
                projectName: task.project.name,
                status: task.status.toLowerCase(),
                accuracy: task.inReview.length > 0 
                    ? (task.inReview.filter(r => r.action === 'APPROVED').length / task.inReview.length) * 100 
                    : 100,
                deadline: task.last_date,
                type: task.priority || 'MEDIUM',
                comments: comments.slice(0, 1) // Show only the latest comment
            };
        });

        efficiencyData.push({
            lawyer: user.name,
            title: user.Role,
            taskHours: Math.round(taskHours * 10) / 10,
            meetingHours: Math.round(meetingHours * 10) / 10,
            clientHours: Math.round(clientHours * 10) / 10,
            researchHours: Math.round(researchHours * 10) / 10,
            totalHours: Math.round(totalHours * 10) / 10,
            efficiency: Math.round(efficiency),
            tasksCompleted,
            tasksAccuracy: Math.round(taskAccuracy),
            tasks: tasksWithComments,
            reviewStats: {
                total: totalReviews,
                approved: approvedReviews,
                rejected: rejectedReviews,
                pending: pendingReviews
            },
            projectsCount: memberData.projects.length
        });
    }

    res.status(200).json({
        success: true,
        efficiencyData
    });
});

export const checkMeetingEmails = catchAsyncError(async (req, res, next) => {
    try {
        const meetingEmails = await prisma.email.findMany({
            where: {
                OR: [
                    { subject: { contains: 'Meeting' } },
                    { content: { contains: 'Meeting ID:' } }
                ]
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            count: meetingEmails.length,
            emails: meetingEmails
        });
    } catch (error) {
        console.error('Error checking meeting emails:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking meeting emails'
        });
    }
});

export const manualEmailPoll = catchAsyncError(async (req, res, next) => {
    const user_id = req.user.user_id;
    
    // Check if user has connected Gmail
    const user = await prisma.user.findFirst({
        where: {
            user_id: user_id,
        },
        select: {
            connect_mail_hash: true,
            encryption_key: true,
            encryption_vi: true
        }
    });

    if (!user.connect_mail_hash) {
        return next(new ErrorHandler("Please Connect Mail First", 401));
    }

    try {
        // Import the email polling service
        const emailPollingService = (await import('../services/emailPollingService.js')).default;
        
        // Trigger manual polling
        await emailPollingService.manualPoll();
        
        res.status(200).json({
            success: true,
            message: 'Manual email polling completed successfully'
        });
    } catch (error) {
        console.error('Error in manual email polling:', error);
        return next(new ErrorHandler("Failed to poll emails", 500));
    }
});
