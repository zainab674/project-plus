import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { validateRequestBody } from '../utils/validateRequestBody.js';
import { AddProjectRequestBodySchema } from '../schema/projectSchema.js';
import crypto from 'crypto';
import { projectSelector } from '../prisma/selectors/project.selector.js';
import { sendInviation, sendOTPOnMail } from '../services/userService.js';
import { prisma } from "../prisma/index.js";
import { uploadToCloud } from '../services/mediaService.js';
import { sendMail } from "../processors/sendMailProcessor.js";
import { generateDocumentSentHtml } from "../processors/generateDocumentSentHtmlProcessor.js";

export const createProject = catchAsyncError(async (req, res, next) => {
    const { name, description, opposing, client_name, client_address, priority, filingDate, phases, status, selectedTeamMembers } = req.body;

    const [err, isValidate] = await validateRequestBody(req.body, AddProjectRequestBodySchema);
    if (!isValidate) {
        return next(new ErrorHandler(err, 401));
    }

    const userId = req.user.user_id;

    const project = await prisma.project.create({
        data: {
            name,
            description,
            created_by: userId,
            opposing,
            client_name,
            client_address,
            priority,
            filingDate,
            phases,
            status
        },
    });

    await prisma.projectMember.create({
        data: {
            project_id: project.project_id,
            user_id: userId,
            role: 'PROVIDER',
        },
    });

    // Add selected team members to project (if any)
    if (selectedTeamMembers && Array.isArray(selectedTeamMembers) && selectedTeamMembers.length > 0) {
        for (const memberData of selectedTeamMembers) {
            // Handle both old format (just memberId) and new format (object with memberId and legalRole)
            const memberId = typeof memberData === 'object' ? memberData.memberId : memberData;
            const legalRole = typeof memberData === 'object' ? memberData.legalRole : null;
            const customLegalRole = typeof memberData === 'object' ? memberData.customLegalRole : null;

            // Get the team member's role from UserTeam
            const teamMember = await prisma.userTeam.findFirst({
                where: {
                    user_id: parseInt(memberId),
                    leader_id: userId
                }
            });

            if (teamMember) {
                await prisma.projectMember.create({
                    data: {
                        project_id: project.project_id,
                        user_id: parseInt(memberId),
                        role: teamMember.role,
                        legalRole: legalRole || teamMember.legalRole,
                        customLegalRole: customLegalRole || teamMember.customLegalRole
                    }
                });
            }
        }
    }

    res.status(201).json({
        success: true,
        project,
    });
});

export const getMyProjects = catchAsyncError(async (req, res, next) => {
    // Use a lighter selector to avoid N+1 queries
    const lightProjectSelector = {
        project_id: true,
        name: true,
        description: true,
        created_by: true,
        created_at: true,
        updated_at: true,
        status: true,
        priority: true,
        // Only include basic member count and task count
        _count: {
            select: {
                Members: true,
                Tasks: true,
                Clients: true
            }
        }
    };

    let projects = await prisma.project.findMany({
        where: {
            created_by: req.user.user_id
        },
        select: lightProjectSelector
    });

    let collaboratedProjects = await prisma.projectMember.findMany({
        where: { user_id: req.user.user_id },
        include: {
            project: {
                select: lightProjectSelector
            },
        },
    });

    collaboratedProjects = collaboratedProjects.map(collabrationMember => ({ 
        ...collabrationMember.project, 
        isCollabrationProject: true 
    }));
    collaboratedProjects = collaboratedProjects.filter(project => project.created_by !== req.user.user_id)
    
    // Add this section to get projects where user is a client
    let clientProjects = await prisma.projectClient.findMany({
        where: { user_id: req.user.user_id },
        include: {
            project: {
                select: lightProjectSelector
            },
        },
    });

    clientProjects = clientProjects.map(clientProject => ({ 
        ...clientProject.project, 
        isClientProject: true 
    }));

    // Combine all projects
    const allProjects = [
        ...projects, 
        ...collaboratedProjects, 
        ...clientProjects
    ];
    
    res.status(200).json({
        success: true,
        projects: allProjects,
        collaboratedProjects,
        clientProjects
    });
});

export const getMyProjectsWithTasks = catchAsyncError(async (req, res, next) => {
    // Use the full project selector for business status
    const fullProjectSelector = {
        project_id: true,
        name: true,
        description: true,
        created_by: true,
        created_at: true,
        updated_at: true,
        status: true,
        priority: true,
        opposing: true,
        client_name: true,
        client_address: true,
        budget: true,
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
                        email: true,
                        name: true,
                    },
                },
            },
        },
        Tasks: {
            select: {
                task_id: true,
                description: true,
                assigned_to: true,
                name: true,
                created_at: true,
                last_date: true,
                updated_at: true,
                status: true,
                priority: true,
                phase: true,
                assignees: {
                    select: {
                        user: {
                            select: {
                                user_id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        },
        Clients: {
            select: {
                project_client_id: true,
                user: {
                    select: {
                        user_id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        },
    };

    let projects = await prisma.project.findMany({
        where: {
            created_by: req.user.user_id
        },
        select: fullProjectSelector
    });

    let collaboratedProjects = await prisma.projectMember.findMany({
        where: { user_id: req.user.user_id },
        include: {
            project: {
                select: fullProjectSelector
            },
        },
    });

    collaboratedProjects = collaboratedProjects.map(collabrationMember => ({ 
        ...collabrationMember.project, 
        isCollabrationProject: true 
    }));
    collaboratedProjects = collaboratedProjects.filter(project => project.created_by !== req.user.user_id)
    
    res.status(200).json({
        success: true,
        projects,
        collaboratedProjects
    });
});

export const getMyProjectsComprehensive = catchAsyncError(async (req, res, next) => {
    // Use comprehensive project selector for timeline view
    const comprehensiveProjectSelector = {
        project_id: true,
        name: true,
        description: true,
        created_by: true,
        created_at: true,
        updated_at: true,
        status: true,
        priority: true,
        opposing: true,
        client_name: true,
        client_address: true,
        budget: true,
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
                        email: true,
                        name: true,
                    },
                },
            },
        },
        Tasks: {
            select: {
                task_id: true,
                description: true,
                assigned_to: true,
                name: true,
                created_at: true,
                last_date: true,
                updated_at: true,
                status: true,
                priority: true,
                phase: true,
                assignees: {
                    select: {
                        user: {
                            select: {
                                user_id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        },
        Clients: {
            select: {
                project_client_id: true,
                added_at: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        user_id: true,
                    }
                },
            },
        },
        Media: {
            select: {
                media_id: true,
                filename: true,
                file_url: true,
                mimeType: true,
                size: true,
                created_at: true,
                project_id: true,
                task_id: true,
                user_id: true,
                user: {
                    select: {
                        name: true,
                        user_id: true,
                    }
                },
            },
        },
        Time: {
            select: {
                time_id: true,
                start: true,
                end: true,
                status: true,
                created_at: true,
                work_description: true,
                task: {
                    select: {
                        name: true,
                        task_id: true,
                    }
                },
                user: {
                    select: {
                        name: true,
                        user_id: true,
                    }
                },
            },
        },
        Comments: {
            select: {
                comment_id: true,
                content: true,
                created_at: true,
                project_id: true,
                user: {
                    select: {
                        name: true,
                        user_id: true,
                    }
                },
            },
        },
    };

    let projects = await prisma.project.findMany({
        where: {
            created_by: req.user.user_id
        },
        select: comprehensiveProjectSelector
    });

    let collaboratedProjects = await prisma.projectMember.findMany({
        where: { user_id: req.user.user_id },
        include: {
            project: {
                select: comprehensiveProjectSelector
            },
        },
    });

    collaboratedProjects = collaboratedProjects.map(collabrationMember => ({ 
        ...collabrationMember.project, 
        isCollabrationProject: true 
    }));
    collaboratedProjects = collaboratedProjects.filter(project => project.created_by !== req.user.user_id)
    
    res.status(200).json({
        success: true,
        projects,
        collaboratedProjects
    });
});

export const getProjectById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
        where: { project_id: parseInt(id) },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    user_id: true,

                },
            },
            Members: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true,
                        },
                    },
                },
            },
            Tasks: {
                include: {
                    assignees: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true,
                                },
                            },
                        },
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
                            created_at: true,
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    },
                },
            },
            Clients: {
                select: {
                    project_client_id: true,
                    added_at: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true,
                        }
                    },
                }
            },
        },
    });

    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    res.status(200).json({
        success: true,
        project,
    });
});

export const updateProject = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const {
        name,
        description,
        opposing,
        client_name,
        client_address,
        priority,
        filingDate,
        phases,
        status,
        selectedTeamMembers
    } = req.body;

    const userId = req.user.user_id;

    // Step 1: Validate ownership
    const project = await prisma.project.findUnique({
        where: { project_id: parseInt(id) },
    });

    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    if (project.created_by !== userId) {
        return next(new ErrorHandler("You are not authorized to update this project", 403));
    }

    // Step 2: Update the project fields
    const updatedProject = await prisma.project.update({
        where: { project_id: parseInt(id) },
        data: {
            name,
            description,
            created_by: userId,
            opposing,
            client_name,
            client_address,
            priority,
            filingDate,
            phases,
            status,
        },
    });

    // Step 3: Update Project Members
    if (Array.isArray(selectedTeamMembers)) {
        console.log('Updating project members with:', selectedTeamMembers);
        
        // Remove existing non-admin project members
        await prisma.projectMember.deleteMany({
            where: {
                project_id: project.project_id,
                NOT: {
                    role: 'PROVIDER' // Don't delete the admin (creator)
                }
            }
        });

        // Re-add selected team members
        for (const memberData of selectedTeamMembers) {
            const memberId = typeof memberData === 'object' ? memberData.memberId : memberData;
            const legalRole = typeof memberData === 'object' ? memberData.legalRole : null;
            const customLegalRole = typeof memberData === 'object' ? memberData.customLegalRole : null;

            // First check if the user exists and is a team member
            const user = await prisma.user.findUnique({
                where: { user_id: parseInt(memberId) }
            });

            console.log(`Processing member ${memberId}:`, user);

            if (user && user.Role === 'TEAM') {
                // Get the team member's role from UserTeam (if they have one)
                const teamMember = await prisma.userTeam.findFirst({
                    where: {
                        user_id: parseInt(memberId)
                    }
                });

                console.log(`Team member data for ${memberId}:`, teamMember);

                await prisma.projectMember.create({
                    data: {
                        project_id: project.project_id,
                        user_id: parseInt(memberId),
                        role: teamMember?.role || 'TEAM',
                        legalRole: legalRole || teamMember?.legalRole,
                        customLegalRole: customLegalRole || teamMember?.customLegalRole
                    }
                });
                
                console.log(`Successfully added member ${memberId} to project`);
            } else {
                console.log(`User ${memberId} is not a team member or doesn't exist`);
            }
        }
    }

    res.status(200).json({
        success: true,
        message: "Project updated successfully",
        project: updatedProject,
    });
});



export const deleteProject = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.user_id;

    // Find the project to ensure the user is the owner
    const project = await prisma.project.findUnique({
        where: { project_id: parseInt(id) },
    });

    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    // Check if the authenticated user is the owner
    if (project.created_by !== userId) {
        return next(new ErrorHandler("You are not authorized to delete this project", 403));
    }

    // Use a transaction to delete the project and related records
    await prisma.$transaction([
        prisma.projectMember.deleteMany({
            where: { project_id: parseInt(id) }, // Delete project members
        }),
        prisma.taskMember.deleteMany({
            where: {
                task: {
                    project_id: parseInt(id), // Delete task members linked to the project's tasks
                },
            },
        }),
        prisma.task.deleteMany({
            where: { project_id: parseInt(id) }, // Delete tasks
        }),
        prisma.project.delete({
            where: { project_id: parseInt(id) }, // Delete the project itself
        }),
    ]);

    res.status(200).json({
        success: true,
        message: "Project and all associated data deleted successfully",
    });
});


export const generateInvitationLink = catchAsyncError(async (req, res, next) => {
    const { role, legalRole, customLegalRole, projectId, invited_email } = req.body;
    const user_id = req.user.user_id;

    // Validate role
    const validRoles = ['CLIENT', 'TEAM', 'BILLER'];
    if (!validRoles.includes(role)) {
        return next(new ErrorHandler('Invalid role. Must be one of: CLIENT, TEAM, BILLER', 400));
    }

    // For team and biller invitations, projectId is optional
    if (role === 'CLIENT' && !projectId) {
        return next(new ErrorHandler('Project ID is required for client invitations', 400));
    }

    // Validate email if provided
    if (invited_email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(invited_email)) {
            return next(new ErrorHandler('Invalid email format', 400));
        }
    }

    const token = crypto.randomBytes(32).toString('hex');

    // Store the token with the project_id and legal role information
    await prisma.invitation.create({
        data: {
            token,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            role,
            user_id: user_id,
            leader_id: user_id, // The user sending the invitation is the leader
            project_id: projectId ? parseInt(projectId) : null,
            legalRole: legalRole || null,
            customLegalRole: customLegalRole || null,
            invited_email: invited_email || null
        }
    });

    // Generate appropriate link based on role
    let link;
    if (role === 'CLIENT') {
        link = `${process.env.FRONTEND_URL}/join-project/${token}`;
    } else if (role === 'TEAM' && projectId) {
        // For project-specific team invitations
        link = `${process.env.FRONTEND_URL}/join-project/${token}`;
    } else {
        // For general team and biller invitations (no project_id)
        link = `${process.env.FRONTEND_URL}/join-team/${token}`;
    }

    res.status(201).json({
        success: true,
        link,
        message: `${role} invitation link generated successfully`
    });
});


export const addMemberThroughInvitation = catchAsyncError(async (req, res, next) => {
    const { token } = req.body;
    const user_id = req.user.user_id;

    // Validate the token
    const invitation = await prisma.invitation.findUnique({
        where: { token },
    });


    if (!invitation || invitation.expires_at < new Date()) {
        return next(new ErrorHandler("Invalid or expired invitation link", 400));
    }

    // Handle team and biller invitations (no project_id)
    if (invitation.role !== "CLIENT") {
        // Check if user is already in the specific team of the invitation sender
        const isAlreadyInTeam = await prisma.userTeam.findFirst({
            where: {
                user_id: user_id,
                leader_id: invitation.leader_id || invitation.user_id // Use leader_id if available, fallback to user_id
            }
        });

        if (!isAlreadyInTeam) {
            await prisma.userTeam.create({
                data: {
                    user_id: user_id,
                    leader_id: invitation.leader_id || invitation.user_id, // Use leader_id if available, fallback to user_id
                    role: invitation.role,
                    legalRole: invitation.legalRole,
                    customLegalRole: invitation.customLegalRole
                }
            })
        } else {
            // Update existing team member with new role and legal information if different
            await prisma.userTeam.update({
                where: {
                    team_member_id: isAlreadyInTeam.team_member_id
                },
                data: {
                    role: invitation.role,
                    legalRole: invitation.legalRole || isAlreadyInTeam.legalRole,
                    customLegalRole: invitation.customLegalRole || isAlreadyInTeam.customLegalRole
                }
            });
        }

        // Add user to project if project_id is provided
        if (invitation.project_id) {
            // Check if user is already a project member
            const existingProjectMember = await prisma.projectMember.findFirst({
                where: {
                    project_id: invitation.project_id,
                    user_id: user_id
                }
            });

            if (!existingProjectMember) {
                await prisma.projectMember.create({
                    data: {
                        project_id: invitation.project_id,
                        user_id: user_id,
                        role: invitation.role,
                        legalRole: invitation.legalRole,
                        customLegalRole: invitation.customLegalRole
                    }
                });
            }
        }

        // Update user role
        if (invitation.role === "BILLER") {
            await prisma.user.update({
                where: {
                    user_id: req.user.user_id
                },
                data: {
                    Role: "BILLER",
                }
            });
        } else {
            await prisma.user.update({
                where: {
                    user_id: req.user.user_id
                },
                data: {
                    Role: "TEAM",
                }
            });
        }

        // Delete the invitation token
        await prisma.invitation.delete({
            where: { token }
        });

        res.status(201).json({
            success: true,
            message: invitation.project_id ? "You have successfully joined the project and team" : "You have successfully joined the team"
        });
    } else {
        // Handle client invitations (with project_id)
        if (!invitation.project_id) {
            return next(new ErrorHandler("Invalid client invitation - project ID is missing", 400));
        }

        // Check if the user is already a member of the project
        const existingClient = await prisma.projectClient.findFirst({
            where: {
                project_id: invitation.project_id,
                user_id,
            },
        });

        if (existingClient) {
            return next(new ErrorHandler("You are already a client of this project", 400));
        }

        // Add the user as a project client
        const projectClient = await prisma.projectClient.create({
            data: {
                project_id: invitation.project_id,
                user_id
            },
        });

        const prismaProjectMember = await prisma.projectMember.findMany({
            where: {
                project_id: invitation.project_id,
            },
        });

        //create conversation
        const data = [];

        prismaProjectMember.forEach(member => {
            data.push({
                isGroup: false,
                user_id: member.user_id,
                project_id: invitation.project_id,
                conversation_id: crypto.randomBytes(32).toString('hex'),
                created_at: new Date(),
                updated_at: new Date()
            });
        });

        // Add conversation for the new client
        // Find an existing task in the project to use for conversation
        const existingTask = await prisma.task.findFirst({
            where: {
                project_id: invitation.project_id
            },
            select: {
                task_id: true
            }
        });

        if (existingTask) {
            data.push({
                isGroup: false,
                project_id: invitation.project_id,
                task_id: existingTask.task_id
            });
        } else {
            // Create a default task for the project if none exists
            const defaultTask = await prisma.task.create({
                data: {
                    name: "General Discussion",
                    description: "General project discussion and communication",
                    project_id: invitation.project_id,
                    created_by: invitation.user_id || invitation.leader_id,
                    status: "TO_DO"
                }
            });

            data.push({
                isGroup: false,
                project_id: invitation.project_id,
                task_id: defaultTask.task_id
            });
        }

        await prisma.conversation.createMany({
            data: data
        });

        // Delete the invitation token
        await prisma.invitation.delete({
            where: { token }
        });

        res.status(201).json({
            success: true,
            message: "You have successfully joined the project as a client"
        });
    }
});

// Public version of addMemberThroughInvitation (no authentication required)
export const addMemberThroughInvitationPublic = catchAsyncError(async (req, res, next) => {
    const { token, email } = req.body;

    if (!token || !email) {
        return next(new ErrorHandler('Token and email are required', 400));
    }

    // Validate the token first
    const invitation = await prisma.invitation.findUnique({
        where: { token },
    });


    if (!invitation || invitation.expires_at < new Date()) {
        return next(new ErrorHandler("Invalid or expired invitation link", 400));
    }

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        // Return a specific response indicating user needs to register
        return res.status(404).json({
            success: false,
            message: 'User not found with this email. Please register first.',
            requiresRegistration: true,
            invitation: {
                token: invitation.token,
                role: invitation.role,
                project_id: invitation.project_id,
                legalRole: invitation.legalRole,
                customLegalRole: invitation.customLegalRole
            }
        });
    }

    const user_id = user.user_id;

    // Handle team and biller invitations (no project_id)
    if (invitation.role !== "CLIENT") {
        // Check if user is already in the specific team of the invitation sender
        const isAlreadyInTeam = await prisma.userTeam.findFirst({
            where: {
                user_id: user_id,
                leader_id: invitation.leader_id || invitation.user_id // Use leader_id if available, fallback to user_id
            }
        });

        if (!isAlreadyInTeam) {
            await prisma.userTeam.create({
                data: {
                    user_id: user_id,
                    leader_id: invitation.leader_id || invitation.user_id, // Use leader_id if available, fallback to user_id
                    role: invitation.role,
                    legalRole: invitation.legalRole,
                    customLegalRole: invitation.customLegalRole
                }
            })
        } else {
            // Update existing team member with new role and legal information if different
            await prisma.userTeam.update({
                where: {
                    team_member_id: isAlreadyInTeam.team_member_id
                },
                data: {
                    role: invitation.role,
                    legalRole: invitation.legalRole || isAlreadyInTeam.legalRole,
                    customLegalRole: invitation.customLegalRole || isAlreadyInTeam.customLegalRole
                }
            });
        }

        // Add user to project if project_id is provided
        if (invitation.project_id) {
            // Check if user is already a project member
            const existingProjectMember = await prisma.projectMember.findFirst({
                where: {
                    project_id: invitation.project_id,
                    user_id: user_id
                }
            });

            if (!existingProjectMember) {
                await prisma.projectMember.create({
                    data: {
                        project_id: invitation.project_id,
                        user_id: user_id,
                        role: invitation.role,
                        legalRole: invitation.legalRole,
                        customLegalRole: invitation.customLegalRole
                    }
                });
            }
        }

        // Update user role
        if (invitation.role === "BILLER") {
            await prisma.user.update({
                where: {
                    user_id: user_id
                },
                data: {
                    Role: "BILLER",
                }
            });
        } else {
            await prisma.user.update({
                where: {
                    user_id: user_id
                },
                data: {
                    Role: "TEAM",
                }
            });
        }

        // Delete the invitation token
        await prisma.invitation.delete({
            where: { token }
        });

        // Send OTP to user for authentication
        await sendOTPOnMail(user, async (OTP, err) => {
            if (err) {
                console.error('Error sending OTP:', err);
                // Don't fail the request if OTP sending fails
                return;
            }
            const hash_otp = crypto.createHash('sha256').update(OTP.toString()).digest('hex');

            // Delete any existing OTPs for the user
            await prisma.oTP.deleteMany({
                where: {
                    user_id: user_id,
                },
            });

            await prisma.oTP.create({
                data: {
                    otp: hash_otp,
                    user_id: user_id
                }
            });
        });

        res.status(201).json({
            success: true,
            message: invitation.project_id ? "You have successfully joined the project and team. Please check your email for OTP verification." : "You have successfully joined the team. Please check your email for OTP verification.",
            requiresVerification: true
        });
    } else {
            // Handle client invitations (with project_id)
    if (!invitation.project_id) {
        return next(new ErrorHandler("Invalid client invitation - project ID is missing", 400));
    }

    // Check if user is already a project client
    const existingProjectClient = await prisma.projectClient.findFirst({
        where: {
            project_id: invitation.project_id,
            user_id: user_id
        }
    });

    if (existingProjectClient) {
        return next(new ErrorHandler("You are already a client of this project", 400));
    }

    // For CLIENT invitations, directly process the invitation and set role to CLIENT
    // No need for role selection since the invitation already specifies CLIENT role
    if (user.Role !== 'CLIENT') {
        // Update user role to CLIENT first
        await prisma.user.update({
            where: { user_id: user_id },
            data: { Role: "CLIENT" }
        });
    }

    // Add client to ProjectClient table only (not to ProjectMember)
    await prisma.projectClient.create({
        data: {
            project_id: invitation.project_id,
            user_id: user_id
        }
    });

    // Update user role to CLIENT
    await prisma.user.update({
        where: {
            user_id: user_id
        },
        data: {
            Role: "CLIENT",
        }
    });

        // Create conversation for the project
        // Find an existing task in the project to use for conversation
        const existingTask = await prisma.task.findFirst({
            where: {
                project_id: invitation.project_id
            },
            select: {
                task_id: true
            }
        });

        if (existingTask) {
            // Create conversation for the project using existing task
            await prisma.conversation.createMany({
                data: [{
                    project_id: invitation.project_id,
                    task_id: existingTask.task_id,
                    isGroup: false
                }]
            });
        } else {
            // Create a default task for the project if none exists
            const defaultTask = await prisma.task.create({
                data: {
                    name: "General Discussion",
                    description: "General project discussion and communication",
                    project_id: invitation.project_id,
                    created_by: invitation.user_id || invitation.leader_id,
                    status: "TO_DO"
                }
            });

            // Create conversation for the project using the new task
            await prisma.conversation.createMany({
                data: [{
                    project_id: invitation.project_id,
                    task_id: defaultTask.task_id,
                    isGroup: false
                }]
            });
        }

        // Delete the invitation token
        await prisma.invitation.delete({
            where: { token }
        });

        // Send OTP to user for authentication
        await sendOTPOnMail(user, async (OTP, err) => {
            if (err) {
                console.error('Error sending OTP:', err);
                // Don't fail the request if OTP sending fails
                return;
            }
            const hash_otp = crypto.createHash('sha256').update(OTP.toString()).digest('hex');

            // Delete any existing OTPs for the user
            await prisma.oTP.deleteMany({
                where: {
                    user_id: user_id,
                },
            });

            await prisma.oTP.create({
                data: {
                    otp: hash_otp,
                    user_id: user_id
                }
            });
        });

        res.status(201).json({
            success: true,
            message: "You have successfully joined the project as a client. Please check your email for OTP verification.",
            requiresVerification: true
        });
    }
});

export const removeMemberFromProject = catchAsyncError(async (req, res, next) => {

    const { project_member_id } = req.params;
    const userId = req.user.user_id;  // Assuming user_id is stored in the request after authentication

    // Fetch the project member to ensure the user is authorized to delete
    const projectMember = await prisma.projectMember.findUnique({
        where: { project_member_id: parseInt(project_member_id) },
        include: {
            project: true, // Include project to get its creator
        },
    });

    if (!projectMember) {
        return next(new ErrorHandler("Project member not found", 404));
    }

    // Check if the authenticated user is the project owner
    if (projectMember.project.created_by !== userId) {
        return next(new ErrorHandler("You are not authorized to remove members from this project", 403));
    }

    // Delete the project member
    await prisma.projectMember.delete({
        where: { project_member_id: parseInt(project_member_id) },
    });

    res.status(200).json({
        success: true,
        message: "Member removed successfully",
    });
});


export const getProjectMembers = catchAsyncError(async (req, res, next) => {
    const { project_id } = req.params;

    const members = await prisma.projectMember.findMany({
        where: { project_id: parseInt(project_id) },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    user_id: true,
                }
            }
        }
    });

    res.status(200).json({
        success: true,
        members,
    });
});





export const sendInvitationViaMail = catchAsyncError(async (req, res, next) => {
    const { invitation, mail } = req.body;
    if (!invitation || !mail) return next(new ErrorHandler('Invitation and Mail is required.'));

    try {
        const result = await sendInviation(invitation, mail);
        
        res.status(200).json({
            success: true,
            message: "Mail sent successfully",
            data: {
                messageId: result.messageId,
                to: mail
            }
        });
    } catch (error) {
        console.error('❌ Failed to send invitation email:', error.message);
        return next(new ErrorHandler(`Failed to send email: ${error.message}`, 500));
    }
});





export const createFolder = catchAsyncError(async (req, res, next) => {
    const { name, parent_id } = req.body;

    const user = req.user;

    let user_id = user.Role == "TEAM" ? user.leader_id : user.user_id


    let template_document = await prisma.templateDocument.findFirst({
        where: {
            owner_id: user_id
        }
    });

    if (!template_document) {
        template_document = await prisma.templateDocument.create({
            data: {
                owner_id: user_id,
            }
        });
    }

    const template_document_id = template_document.template_document_id;


    if (!name || !template_document_id) {
        return next(new ErrorHandler("Folder name and template_document_id are required", 400));
    }

    const folder = await prisma.folder.create({
        data: {
            name,
            parent_id,
            template_document_id
        }
    });

    res.status(201).json({
        success: true,
        folder
    });
});


export const fileUpload = catchAsyncError(async (req, res, next) => {
    const { folder_id } = req.body;
    const file = req.file;


    const user = req.user;

    let user_id = user.Role == "TEAM" ? user.leader_id : user.user_id


    let template_document = await prisma.templateDocument.findFirst({
        where: {
            owner_id: user_id
        }
    });

    if (!template_document) {
        template_document = await prisma.templateDocument.create({
            data: {
                owner_id: user_id,
            }
        });
    }

    const template_document_id = template_document.template_document_id;

    if (!file || !folder_id || !template_document_id) {
        return next(new ErrorHandler("File, folder_id, and template_document_id are required", 400));
    }

    // Upload to Cloudinary
    const cloudRes = await uploadToCloud(file);

    // Save in DB
    const savedFile = await prisma.file.create({
        data: {
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            path: cloudRes.url,
            folder_id,
            template_document_id
        }
    });

    res.status(201).json({
        success: true,
        file: savedFile
    });
})


export const updateFileUpload = catchAsyncError(async (req, res, next) => {
    const { file_id } = req.body;
    const file = req.file;


    if (!file) {
        return next(new ErrorHandler("File, folder_id, and template_document_id are required", 400));
    }

    // Upload to Cloudinary
    const cloudRes = await uploadToCloud(file);

    // Save in DB
    const savedFile = await prisma.file.update({
        where: {
            file_id
        },
        data: {
            size: file.size,
            type: file.mimetype,
            path: cloudRes.url
        }
    });

    res.status(201).json({
        success: true,
        message: "FIle Update Successfully"
    });
});







export const getFolderTreeByTemplateDocument = catchAsyncError(async (req, res, next) => {
    const { project_id } = req.params;

    const user = req.user;

    let user_id = user.Role == "TEAM" ? user.leader_id : user.user_id

    // If project_id is provided, use it; otherwise, use user_id
    const owner_id = project_id ? parseInt(project_id) : user_id;

    let template_document = await prisma.templateDocument.findFirst({
        where: {
            owner_id: owner_id
        }
    });

    if (!template_document) {
        template_document = await prisma.templateDocument.create({
            data: {
                owner_id: owner_id,
            }
        });
    }

    const template_document_id = template_document.template_document_id;

    if (!template_document_id) {
        return next(new ErrorHandler("template_document_id is required", 400));
    }

    // Fetch all folders and files for that template
    const folders = await prisma.folder.findMany({
        where: { template_document_id: String(template_document_id) },
        include: { files: true }
    });

    // Convert list to map for easy parent-child lookup
    const folderMap = new Map();
    folders.forEach(folder => folderMap.set(folder.folder_id, { ...folder, subfolders: [] }));

    let rootFolders = [];

    // Construct tree
    for (const folder of folders) {
        if (folder.parent_id) {
            const parent = folderMap.get(folder.parent_id);
            if (parent) {
                parent.subfolders.push(folderMap.get(folder.folder_id));
            }
        } else {
            rootFolders.push(folderMap.get(folder.folder_id));
        }
    }

    res.status(200).json({
        success: true,
        folders: rootFolders
    });
});



export const sendToLawyer = catchAsyncError(async (req, res, next) => {
    const { description } = req.body;
    const file = req.file;

    const user = req.user;
    let user_id = user.Role == "TEAM" ? user.leader_id : user.user_id

    if (!file) {
        return next(new ErrorHandler("File, folder_id, and template_document_id are required", 400));
    }


    const cloudRes = await uploadToCloud(file);

    const tdocument = await prisma.tDocuments.create({
        data: {
            user_id,
            description,
            file_url: cloudRes.url,
            key: cloudRes.key,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        }
    });



    res.status(200).json({
        success: true,
        message: `Send To Lawyer Successfully`,
        tdocument
    });
});

export const sendToClient = catchAsyncError(async (req, res, next) => {
    const { description, user_id } = req.body;
    const file = req.file;
    const sender = req.user;

    if (!file) {
        return next(new ErrorHandler("File is required", 400));
    }

    // Get client information
    const client = await prisma.user.findUnique({
        where: {
            user_id: parseInt(user_id)
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

    // Find the project_client_id for this client
    // We'll use the first project where the sender is the creator and the client is a client
    const projectClient = await prisma.projectClient.findFirst({
        where: {
            user_id: parseInt(user_id),
            project: {
                created_by: sender.user_id
            }
        },
        select: {
            project_client_id: true,
            project_id: true
        }
    });

    if (!projectClient) {
        return next(new ErrorHandler("Client is not associated with any of your projects", 404));
    }

    const cloudRes = await uploadToCloud(file);

    // Create record in tDocuments table (for template documents)
    const tdocument = await prisma.tDocuments.create({
        data: {
            user_id: parseInt(user_id),
            description,
            file_url: cloudRes.url,
            key: cloudRes.key,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        }
    });

    // Create record in Documents table (for client's documents page)
    const clientDocument = await prisma.documents.create({
        data: {
            project_client_id: projectClient.project_client_id,
            project_id: projectClient.project_id,
            user_id: parseInt(user_id),
            name: file.originalname,
            description,
            file_url: cloudRes.url,
            key: cloudRes.key,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            status: "PENDING"
        }
    });

    // Send email to client and store in database
    try {
        const html = generateDocumentSentHtml(file.originalname, description, sender.name);
        await sendMail("Document Sent - FlexyWexy", client.email, html);
        
        // Create email record in database for mail center
        await prisma.email.create({
            data: {
                user_id: sender.user_id, // The sender (lawyer/provider)
                to_user: parseInt(user_id), // The client
                subject: "Document Sent - FlexyWexy",
                content: `A document "${file.originalname}" has been sent to you by ${sender.name}. Description: ${description}`,
                project_id: projectClient.project_id,
                attachment_url: cloudRes.url,
                attachment_name: file.originalname,
                attachment_size: file.size,
                attachment_mime_type: file.mimetype
            }
        });
    } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email sending fails
    }

    res.status(200).json({
        success: true,
        message: `Document sent to client successfully`,
        tdocument,
        clientDocument
    });
});

export const updateTDocumentStatus = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;



    await prisma.tDocuments.update({
        where: {
            t_document_id: id
        },
        data: {
            status
        }
    });

    res.status(200).json({
        success: true,
        message: `Status Update Successfully`,
    });
});



export const getTemplateDocumentFiles = catchAsyncError(async (req, res, next) => {

    const user = req.user;
    let user_id = user.Role == "TEAM" ? user.leader_id : user.user_id

    // Fetch only clients associated with the current user's projects
    // Use a more specific query to avoid duplicates
    const projectIds = await prisma.project.findMany({
        where: {
            OR: [
                { created_by: user_id },
                {
                    Members: {
                        some: {
                            user_id: user_id
                        }
                    }
                }
            ]
        },
        select: {
            project_id: true
        }
    });

    const projectIdList = projectIds.map(p => p.project_id);

    const clients = await prisma.projectClient.findMany({
        where: {
            project_id: {
                in: projectIdList
            }
        },
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

    // Transform the data to match the expected format and remove duplicates using Map for better performance
    const uniqueClientsMap = new Map();
    clients.forEach(client => {
        const key = client.user.user_id;
        if (!uniqueClientsMap.has(key)) {
            uniqueClientsMap.set(key, {
                user_id: client.user.user_id,
                name: client.user.name,
                email: client.user.email
            });
        }
    });
    
    const transformedClients = Array.from(uniqueClientsMap.values());

    // Additional validation to ensure clean data
    const finalClients = transformedClients.filter(client => 
        client.user_id && 
        client.name && 
        client.email &&
        typeof client.user_id === 'number' &&
        typeof client.name === 'string' &&
        typeof client.email === 'string'
    );

    // Log for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
        console.log('Raw clients count:', clients.length);
        console.log('Transformed clients count:', transformedClients.length);
        console.log('Final clients count:', finalClients.length);
        console.log('Unique client IDs:', [...new Set(finalClients.map(c => c.user_id))]);
    }

    const documents = await prisma.tDocuments.findMany({
        where: {
            user_id
        }
    })

    res.status(200).json({
        success: true,
        documents,
        clients: finalClients
    });
});

// Get comprehensive project details with all task-related information
export const getProjectDetailsComprehensive = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.user_id;

    // Check if user has access to this project
    const project = await prisma.project.findFirst({
        where: {
            project_id: parseInt(id),
            OR: [
                // User is project owner
                { created_by: userId },
                // User is project member
                {
                    Members: {
                        some: {
                            user_id: userId
                        }
                    }
                }
            ]
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    user_id: true,
                },
            },
            Members: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true,
                        },
                    },
                },
            },
            Tasks: {
                include: {
                    assignees: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true,
                                },
                            },
                        },
                    },
                    creator: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true,
                        },
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
                            created_at: true,
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    },
                    Meetings: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true,
                                },
                            },
                            participants: {
                                include: {
                                    user: {
                                        select: {
                                            name: true,
                                            email: true,
                                            user_id: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    },
                    Progress: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true,
                                },
                            },
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    },
                    Time: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true,
                                },
                            },
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    },
                    Comments: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true,
                                },
                            },
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    },
                    Emails: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true,
                                },
                            },
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    },
                    Transcibtions: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true,
                                },
                            },
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    },
                    Media: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true,
                                },
                            },
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    },
                },
                orderBy: {
                    created_at: 'desc'
                }
            },
            Clients: {
                select: {
                    project_client_id: true,
                    added_at: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true,
                        }
                    },
                }
            },
            caseAssignments: {
                include: {
                    biller: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true,
                        }
                    },
                    assignedBy: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true,
                        }
                    }
                }
            },
            billingConfig: {
                include: {
                    memberRates: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    user_id: true,
                                }
                            }
                        }

                    }
                }
            }
        },
    });

    if (!project) {
        // If not found through project membership, check if user is assigned biller
        const billerAssignment = await prisma.caseAssignment.findFirst({
            where: {
                project_id: parseInt(id),
                biller_id: userId
            }
        });

        if (!billerAssignment) {
            return next(new ErrorHandler("Project not found or access denied", 404));
        }

        // If user is biller, get project without member restrictions
        const projectAsBiller = await prisma.project.findUnique({
            where: { project_id: parseInt(id) },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        user_id: true,
                    },
                },
                Members: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                user_id: true,
                            },
                        },
                    },
                },
                Tasks: {
                    include: {
                        assignees: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                        user_id: true,
                                    },
                                },
                            },
                        },
                        creator: {
                            select: {
                                name: true,
                                email: true,
                                user_id: true,
                            },
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
                                created_at: true,
                            },
                            orderBy: {
                                created_at: 'desc'
                            }
                        },
                        Meetings: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                        user_id: true,
                                    },
                                },
                                participants: {
                                    include: {
                                        user: {
                                            select: {
                                                name: true,
                                                email: true,
                                                user_id: true,
                                            },
                                        },
                                    },
                                },
                            },
                            orderBy: {
                                created_at: 'desc'
                            }
                        },
                        Progress: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                        user_id: true,
                                    },
                                },
                            },
                            orderBy: {
                                created_at: 'desc'
                            }
                        },
                        Time: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                        user_id: true,
                                    },
                                },
                            },
                            orderBy: {
                                created_at: 'desc'
                            }
                        },
                        Comments: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                        user_id: true,
                                    },
                                },
                            },
                            orderBy: {
                                created_at: 'desc'
                            }
                        },
                        Emails: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                        user_id: true,
                                    },
                                },
                            },
                            orderBy: {
                                created_at: 'desc'
                            }
                        },
                        Transcibtions: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                        user_id: true,
                                    },
                                },
                            },
                            orderBy: {
                                created_at: 'desc'
                            }
                        },
                        Media: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                        user_id: true,
                                    },
                                },
                            },
                            orderBy: {
                                created_at: 'desc'
                            }
                        },
                    },
                    orderBy: {
                        created_at: 'desc'
                    }
                },
                Clients: {
                    select: {
                        project_client_id: true,
                        user: {
                            select: {
                                name: true,
                                email: true,
                                user_id: true,
                            }
                        },
                    }
                },
                caseAssignments: {
                    include: {
                        biller: {
                            select: {
                                name: true,
                                email: true,
                                user_id: true,
                            }
                        },
                        assignedBy: {
                            select: {
                                name: true,
                                email: true,
                                user_id: true,
                            }
                        }
                    }
                },
                billingConfig: {
                    include: {
                        memberRates: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                        user_id: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });

        if (!projectAsBiller) {
            return next(new ErrorHandler("Project not found", 404));
        }

        // Calculate summary statistics
        const summary = calculateProjectSummary(projectAsBiller);

        res.status(200).json({
            success: true,
            project: projectAsBiller,
            summary,
            userAccess: 'biller'
        });
        return;
    }

    // Calculate summary statistics
    const summary = calculateProjectSummary(project);

    res.status(200).json({
        success: true,
        project,
        summary,
        userAccess: 'member'
    });
});

// Helper function to calculate project summary
function calculateProjectSummary(project) {
    const tasks = project.Tasks || [];

    const summary = {
        totalTasks: tasks.length,
        tasksByStatus: {
            TO_DO: tasks.filter(t => t.status === 'TO_DO').length,
            IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
            IN_REVIEW: tasks.filter(t => t.status === 'IN_REVIEW').length,
            DONE: tasks.filter(t => t.status === 'DONE').length,
            STUCK: tasks.filter(t => t.status === 'STUCK').length,
            OVER_DUE: tasks.filter(t => t.status === 'OVER_DUE').length,
        },
        tasksByPriority: {
            CRITICAL: tasks.filter(t => t.priority === 'CRITICAL').length,
            HIGH: tasks.filter(t => t.priority === 'HIGH').length,
            MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
            LOW: tasks.filter(t => t.priority === 'LOW').length,
            NONE: tasks.filter(t => t.priority === 'NONE').length,
        },
        reviews: {
            total: tasks.reduce((sum, task) => sum + (task.inReview?.length || 0), 0),
            approved: tasks.reduce((sum, task) => sum + (task.inReview?.filter(r => r.action === 'APPROVED').length || 0), 0),
            rejected: tasks.reduce((sum, task) => sum + (task.inReview?.filter(r => r.action === 'REJECTED').length || 0), 0),
            pending: tasks.reduce((sum, task) => sum + (task.inReview?.filter(r => !r.action).length || 0), 0),
        },
        meetings: {
            total: tasks.reduce((sum, task) => sum + (task.Meetings?.length || 0), 0),
            scheduled: tasks.reduce((sum, task) => sum + (task.Meetings?.filter(m => m.isScheduled).length || 0), 0),
            completed: tasks.reduce((sum, task) => sum + (task.Meetings?.filter(m => m.status === 'COMPLETED').length || 0), 0),
        },
        activities: {
            progressEntries: tasks.reduce((sum, task) => sum + (task.Progress?.length || 0), 0),
            timeEntries: tasks.reduce((sum, task) => sum + (task.Time?.length || 0), 0),
            comments: tasks.reduce((sum, task) => sum + (task.Comments?.length || 0), 0),
            emails: tasks.reduce((sum, task) => sum + (task.Emails?.length || 0), 0),
            transcriptions: tasks.reduce((sum, task) => sum + (task.Transcibtions?.length || 0), 0),
            media: tasks.reduce((sum, task) => sum + (task.Media?.length || 0), 0),
        },
        teamMembers: project.Members?.length || 0,
        clients: project.Clients?.length || 0,
    };

    return summary;
}

// Group Chat Functions
export const getGroupChatMessages = catchAsyncError(async (req, res, next) => {
    const { project_id, task_id } = req.params;
    const userId = req.user.user_id;

    // Verify user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
        where: {
            project_id: parseInt(project_id),
            user_id: userId
        }
    });

    if (!projectMember) {
        return next(new ErrorHandler('You are not a member of this project', 403));
    }

    // Get messages for the group chat
    const messages = await prisma.message.findMany({
        where: {
            project_id: parseInt(project_id),
            task_id: parseInt(task_id),
            is_group_chat: true
        },
        orderBy: {
            createdAt: 'asc'
        },
        include: {
            sender: {
                select: {
                    user_id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    // Format messages for frontend
    const formattedMessages = messages.map(message => ({
        message_id: message.message_id,
        sender_id: message.sender_id,
        sender_name: message.sender?.name || 'Unknown',
        content: message.content,
        content_type: message.content_type,
        createdAt: message.createdAt,
        project_id: message.project_id,
        task_id: message.task_id,
        is_group_chat: message.is_group_chat,
        attachment_url: message.attachment_url,
        attachment_name: message.attachment_name,
        attachment_size: message.attachment_size,
        attachment_mime_type: message.attachment_mime_type
    }));

    res.status(200).json({
        success: true,
        messages: formattedMessages
    });
});

export const createGroupChatMessage = catchAsyncError(async (req, res, next) => {
    const { project_id, task_id } = req.params;
    const { content, content_type = 'PLAIN_TEXT' } = req.body;
    const userId = req.user.user_id;
    const file = req.file;

    // Verify user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
        where: {
            project_id: parseInt(project_id),
            user_id: userId
        }
    });

    if (!projectMember) {
        return next(new ErrorHandler('You are not a member of this project', 403));
    }

    // Create conversation ID for group chat
    const conversationId = `project-${project_id}-${task_id}`;

    // Check if conversation exists, if not create it
    let conversation = await prisma.conversation.findFirst({
        where: {
            conversation_id: conversationId
        }
    });

    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                conversation_id: conversationId,
                name: `Group Chat - Project ${project_id}`,
                isGroup: true,
                task_id: parseInt(task_id),
                project_id: parseInt(project_id)
            }
        });

        // Add all project members as participants
        const projectMembers = await prisma.projectMember.findMany({
            where: {
                project_id: parseInt(project_id)
            }
        });

        for (const member of projectMembers) {
            await prisma.participant.create({
                data: {
                    user_id: member.user_id,
                    conversation_id: conversationId
                }
            });
        }
    }

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

    // Create the message
    const message = await prisma.message.create({
        data: {
            conversation_id: conversationId,
            sender_id: userId,
            content: content,
            content_type: content_type,
            project_id: parseInt(project_id),
            task_id: parseInt(task_id),
            is_group_chat: true,
            ...attachmentData
        },
        include: {
            sender: {
                select: {
                    user_id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    // Update conversation last message
    await prisma.conversation.update({
        where: {
            conversation_id: conversationId
        },
        data: {
            last_message: content
        }
    });

    // Format message for response and broadcasting
    const formattedMessage = {
        message_id: message.message_id,
        sender_id: message.sender_id,
        sender_name: message.sender?.name || 'Unknown',
        content: message.content,
        content_type: message.content_type,
        createdAt: message.createdAt,
        project_id: message.project_id,
        task_id: message.task_id,
        is_group_chat: message.is_group_chat,
        conversation_id: conversationId,
        attachment_url: message.attachment_url,
        attachment_name: message.attachment_name,
        attachment_size: message.attachment_size,
        attachment_mime_type: message.attachment_mime_type
    };

    // Broadcast the message to all connected users via socket
    // This will be handled by the socket.io server
    // The message will be sent to all users in the project

    res.status(201).json({
        success: true,
        message: formattedMessage
    });
});

export const getProjectGroupChatInfo = catchAsyncError(async (req, res, next) => {
    const { project_id } = req.params;
    const userId = req.user.user_id;

    // Verify user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
        where: {
            project_id: parseInt(project_id),
            user_id: userId
        }
    });

    if (!projectMember) {
        return next(new ErrorHandler('You are not a member of this project', 403));
    }

    // Get project info with team members
    const project = await prisma.project.findUnique({
        where: {
            project_id: parseInt(project_id)
        },
        include: {
            Members: {
                include: {
                    user: {
                        select: {
                            user_id: true,
                            name: true,
                            email: true,
                            active_status: true
                        }
                    }
                }
            },
            Tasks: {
                select: {
                    task_id: true,
                    name: true,
                    description: true
                }
            }
        }
    });

    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    res.status(200).json({
        success: true,
        project: {
            project_id: project.project_id,
            name: project.name,
            description: project.description,
            team_members: project.Members.map(member => ({
                user_id: member.user.user_id,
                name: member.user.name,
                email: member.user.email,
                active_status: member.user.active_status,
                role: member.role
            })),
            tasks: project.Tasks
        }
    });
});

// Delete folder
export const deleteFolder = catchAsyncError(async (req, res, next) => {
    const { folder_id } = req.params;
    const user_id = req.user.user_id;

    // Find the folder and validate permissions
    const folder = await prisma.folder.findUnique({
        where: { folder_id },
        include: {
            templateDocument: true
        }
    });

    if (!folder) {
        return next(new ErrorHandler("Folder not found", 404));
    }

    // Check if user has permission to delete this folder
    // The folder belongs to the user's template document
    if (folder.templateDocument.owner_id !== user_id) {
        return next(new ErrorHandler("You are not authorized to delete this folder", 403));
    }

    // Delete folder and all its contents (files and subfolders will be deleted due to cascade)
    await prisma.folder.delete({
        where: { folder_id }
    });

    res.status(200).json({
        success: true,
        message: "Folder deleted successfully"
    });
});

// Delete file
export const deleteFile = catchAsyncError(async (req, res, next) => {
    const { file_id } = req.params;
    const user_id = req.user.user_id;

    // Find the file and validate permissions
    const file = await prisma.file.findUnique({
        where: { file_id },
        include: {
            templateDocument: true
        }
    });

    if (!file) {
        return next(new ErrorHandler("File not found", 404));
    }

    // Check if user has permission to delete this file
    // The file belongs to the user's template document
    if (file.templateDocument.owner_id !== user_id) {
        return next(new ErrorHandler("You are not authorized to delete this file", 403));
    }

    // Delete file
    await prisma.file.delete({
        where: { file_id }
    });

    res.status(200).json({
        success: true,
        message: "File deleted successfully"
    });
});


