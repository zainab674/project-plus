import { prisma } from '../prisma/index.js';
import ErrorHandler from '../utils/errorHandler.js';

// Service to get template with all relations
export const getTemplateWithRelations = async (templateId, userId) => {
    const template = await prisma.caseTemplate.findFirst({
        where: {
            template_id: templateId,
            created_by: userId,
            is_active: true
        },
        include: {
            phases: {
                orderBy: { order: 'asc' }
            },
            folders: {
                include: {
                    phase: true,
                    files: true,
                    subfolders: {
                        include: {
                            phase: true,
                            files: true,
                            subfolders: {
                                include: {
                                    phase: true,
                                    files: true,
                                    subfolders: {
                                        include: {
                                            phase: true,
                                            files: true,
                                            subfolders: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { order: 'asc' }
            },
            files: {
                where: { folder_id: null },
                orderBy: { order: 'asc' }
            },
            creator: {
                select: {
                    user_id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    if (!template) {
        throw new ErrorHandler("Case template not found", 404);
    }

    return template;
};

// Service to create template with phases and folders
export const createTemplateWithRelations = async (templateData, userId) => {
    const { phases = [], folders = [], files = [], ...templateInfo } = templateData;

    const template = await prisma.caseTemplate.create({
        data: {
            ...templateInfo,
            created_by: userId,
            phases_count: phases.length,
            documents_count: files.length,
            phases: {
                create: phases.map((phase, index) => ({
                    name: phase.name,
                    description: phase.description,
                    order: index + 1,
                    estimated_days: phase.estimated_days
                }))
            },
            folders: {
                create: folders.map(folder => ({
                    name: folder.name,
                    description: folder.description,
                    parent_id: folder.parent_id,
                    order: folder.order || 0
                }))
            }
        },
        include: {
            phases: {
                orderBy: { order: 'asc' }
            },
            folders: {
                orderBy: { order: 'asc' }
            }
        }
    });

    return template;
};

// Service to update template phases
export const updateTemplatePhases = async (templateId, phases) => {
    // Delete existing phases
    await prisma.caseTemplatePhase.deleteMany({
        where: { template_id: templateId }
    });

    // Create new phases if provided
    if (phases && phases.length > 0) {
        await prisma.caseTemplatePhase.createMany({
            data: phases.map((phase, index) => ({
                template_id: templateId,
                name: phase.name,
                description: phase.description,
                order: index + 1,
                estimated_days: phase.estimated_days
            }))
        });
    }

    // Update phases count
    await prisma.caseTemplate.update({
        where: { template_id: templateId },
        data: { phases_count: phases.length }
    });
};

// Service to update template folders
export const updateTemplateFolders = async (templateId, folders) => {
    // Delete existing folders (this will cascade delete files)
    await prisma.caseTemplateFolder.deleteMany({
        where: { template_id: templateId }
    });

    // Create new folders if provided
    if (folders && folders.length > 0) {
        await prisma.caseTemplateFolder.createMany({
            data: folders.map(folder => ({
                template_id: templateId,
                name: folder.name,
                description: folder.description,
                parent_id: folder.parent_id,
                order: folder.order || 0
            }))
        });
    }
};

// Service to create project from template
export const createProjectFromTemplate = async (templateId, projectData, userId) => {
    // Get template with phases, folders, and files
    const template = await prisma.caseTemplate.findFirst({
        where: {
            template_id: templateId,
            is_active: true
        },
        include: {
            phases: {
                orderBy: { order: 'asc' }
            },
            folders: {
                include: {
                    phase: true,
                    files: true,
                    subfolders: {
                        include: {
                            phase: true,
                            files: true,
                            subfolders: {
                                include: {
                                    phase: true,
                                    files: true,
                                    subfolders: {
                                        include: {
                                            phase: true,
                                            files: true,
                                            subfolders: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { order: 'asc' }
            },
            files: {
                where: { folder_id: null },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!template) {
        throw new ErrorHandler("Case template not found", 404);
    }

    // Create project
    const project = await prisma.project.create({
        data: {
            name: projectData.projectName,
            description: projectData.projectDescription || template.description,
            created_by: userId,
            client_name: projectData.clientName,
            client_address: projectData.clientAddress,
            opposing: projectData.opposing,
            priority: projectData.priority || template.default_priority,
            filingDate: projectData.filingDate ? new Date(projectData.filingDate) : new Date(),
            phases: projectData.phases || template.phases.map(phase => phase.name),
            status: projectData.status || 'Pending',
            budget: projectData.budget || 0,
            template_id: templateId
        }
    });

    // Copy template documents to project
    await copyTemplateDocumentsToProject(template, project.project_id, userId);

    // Add project creator as PROVIDER
    await prisma.projectMember.create({
        data: {
            project_id: project.project_id,
            user_id: userId,
            role: 'PROVIDER',
        },
    });

    // Add selected team members
    if (projectData.selectedTeamMembers && Array.isArray(projectData.selectedTeamMembers) && projectData.selectedTeamMembers.length > 0) {
        for (const memberData of projectData.selectedTeamMembers) {
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

    // Increment usage count
    await prisma.caseTemplate.update({
        where: { template_id: templateId },
        data: { usage_count: { increment: 1 } }
    });

    return project;
};

// Helper function to copy template documents to user's personal space
const copyTemplateDocumentsToProject = async (template, projectId, userId) => {
    try {
        // Create or get TemplateDocument for the USER (not the project)
        let templateDocument = await prisma.templateDocument.findFirst({
            where: { owner_id: userId }
        });

        if (!templateDocument) {
            templateDocument = await prisma.templateDocument.create({
                data: { owner_id: userId }
            });
        }

        const templateDocumentId = templateDocument.template_document_id;

        // Create a map to track folder ID mappings (template folder ID -> project folder ID)
        const folderIdMap = new Map();

        // Helper function to recursively copy folders maintaining hierarchy
        const copyFolderRecursively = async (templateFolder, parentProjectFolderId) => {
            // Find the phase name for this folder
            const phaseName = templateFolder.phase ? templateFolder.phase.name : null;
            
            const projectFolder = await prisma.folder.create({
                data: {
                    name: templateFolder.name,
                    parent_id: parentProjectFolderId,
                    phase_name: phaseName,
                    template_document_id: templateDocumentId
                }
            });
            
            // Map template folder ID to project folder ID
            folderIdMap.set(templateFolder.folder_id, projectFolder.folder_id);

            // Copy files in this folder
            await copyTemplateFilesToProject(templateFolder.files, projectFolder.folder_id, templateDocumentId, userId);

            // Recursively copy subfolders
            if (templateFolder.subfolders && templateFolder.subfolders.length > 0) {
                for (const subfolder of templateFolder.subfolders) {
                    await copyFolderRecursively(subfolder, projectFolder.folder_id);
                }
            }

            return projectFolder;
        };

        // Copy all folders recursively starting from root folders
        // The copyFolderRecursively function handles the entire folder tree
        const rootFolders = template.folders.filter(folder => !folder.parent_id);
        for (const templateFolder of rootFolders) {
            await copyFolderRecursively(templateFolder, null);
        }

        // Copy root files (files not in any folder)
        await copyTemplateFilesToProject(template.files, null, templateDocumentId, userId);

    } catch (error) {
        throw new ErrorHandler(`Failed to copy template documents: ${error.message}`, 500);
    }
};

// Helper function to copy template files to project
const copyTemplateFilesToProject = async (templateFiles, projectFolderId, templateDocumentId, userId) => {
    for (const templateFile of templateFiles) {
        await prisma.file.create({
            data: {
                name: templateFile.name,
                size: templateFile.file_size || 0,
                type: templateFile.mime_type || 'application/octet-stream',
                path: templateFile.file_url || '',
                folder_id: projectFolderId,
                template_document_id: templateDocumentId,
                lawyer_id: userId // Associate files with the project creator
            }
        });
    }
};

// Service to get template statistics
export const getTemplateStatistics = async (userId) => {
    const stats = await prisma.caseTemplate.aggregate({
        where: {
            created_by: userId,
            is_active: true
        },
        _count: {
            template_id: true
        },
        _sum: {
            usage_count: true,
            phases_count: true,
            documents_count: true
        }
    });

    // Get category breakdown
    const categoryStats = await prisma.caseTemplate.groupBy({
        by: ['category'],
        where: {
            created_by: userId,
            is_active: true
        },
        _count: {
            template_id: true
        }
    });

    // Get most used templates
    const mostUsedTemplates = await prisma.caseTemplate.findMany({
        where: {
            created_by: userId,
            is_active: true
        },
        select: {
            template_id: true,
            name: true,
            usage_count: true,
            category: true
        },
        orderBy: { usage_count: 'desc' },
        take: 5
    });

    return {
        totalTemplates: stats._count.template_id,
        totalUsage: stats._sum.usage_count || 0,
        totalPhases: stats._sum.phases_count || 0,
        totalDocuments: stats._sum.documents_count || 0,
        categoryBreakdown: categoryStats,
        mostUsedTemplates
    };
};

// Service to duplicate template
export const duplicateTemplate = async (templateId, newName, userId) => {
    const originalTemplate = await getTemplateWithRelations(templateId, userId);

    const duplicatedTemplate = await prisma.caseTemplate.create({
        data: {
            name: newName,
            description: originalTemplate.description,
            category: originalTemplate.category,
            default_priority: originalTemplate.default_priority,
            estimated_duration: originalTemplate.estimated_duration,
            phases_count: originalTemplate.phases.length,
            documents_count: originalTemplate.files.length,
            created_by: userId,
            phases: {
                create: originalTemplate.phases.map(phase => ({
                    name: phase.name,
                    description: phase.description,
                    order: phase.order,
                    estimated_days: phase.estimated_days
                }))
            },
            folders: {
                create: originalTemplate.folders.map(folder => ({
                    name: folder.name,
                    description: folder.description,
                    parent_id: folder.parent_id,
                    order: folder.order
                }))
            }
        },
        include: {
            phases: {
                orderBy: { order: 'asc' }
            },
            folders: {
                orderBy: { order: 'asc' }
            }
        }
    });

    return duplicatedTemplate;
};

// Service to archive template
export const archiveTemplate = async (templateId, userId) => {
    const template = await prisma.caseTemplate.findFirst({
        where: {
            template_id: templateId,
            created_by: userId,
            is_active: true
        }
    });

    if (!template) {
        throw new ErrorHandler("Case template not found", 404);
    }

    await prisma.caseTemplate.update({
        where: { template_id: templateId },
        data: { is_active: false }
    });

    return { message: "Template archived successfully" };
};

// Service to restore archived template
export const restoreTemplate = async (templateId, userId) => {
    const template = await prisma.caseTemplate.findFirst({
        where: {
            template_id: templateId,
            created_by: userId,
            is_active: false
        }
    });

    if (!template) {
        throw new ErrorHandler("Archived template not found", 404);
    }

    await prisma.caseTemplate.update({
        where: { template_id: templateId },
        data: { is_active: true }
    });

    return { message: "Template restored successfully" };
};

// Service to get archived templates
export const getArchivedTemplates = async (userId, page = 1, limit = 10) => {
    const templates = await prisma.caseTemplate.findMany({
        where: {
            created_by: userId,
            is_active: false
        },
        include: {
            phases: {
                orderBy: { order: 'asc' }
            },
            creator: {
                select: {
                    user_id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: { updated_at: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
    });

    const totalCount = await prisma.caseTemplate.count({
        where: {
            created_by: userId,
            is_active: false
        }
    });

    return {
        templates,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasNext: page * limit < totalCount,
            hasPrev: page > 1
        }
    };
};

// Service to search templates
export const searchTemplates = async (userId, searchTerm, category = 'all', page = 1, limit = 10) => {
    const where = {
        created_by: userId,
        is_active: true
    };

    if (category && category !== 'all') {
        where.category = category;
    }

    if (searchTerm) {
        where.OR = [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { category: { contains: searchTerm, mode: 'insensitive' } }
        ];
    }

    const templates = await prisma.caseTemplate.findMany({
        where,
        include: {
            phases: {
                orderBy: { order: 'asc' }
            },
            creator: {
                select: {
                    user_id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
    });

    const totalCount = await prisma.caseTemplate.count({ where });

    return {
        templates,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasNext: page * limit < totalCount,
            hasPrev: page > 1
        }
    };
};

// Service to validate template ownership
export const validateTemplateOwnership = async (templateId, userId) => {
    const template = await prisma.caseTemplate.findFirst({
        where: {
            template_id: templateId,
            created_by: userId
        }
    });

    if (!template) {
        throw new ErrorHandler("Template not found or access denied", 404);
    }

    return template;
};

// Service to get template usage history
export const getTemplateUsageHistory = async (templateId, userId, page = 1, limit = 10) => {
    const template = await validateTemplateOwnership(templateId, userId);

    const projects = await prisma.project.findMany({
        where: {
            template_id: templateId
        },
        include: {
            Clients: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
    });

    const totalCount = await prisma.project.count({
        where: {
            template_id: templateId
        }
    });

    return {
        template: {
            template_id: template.template_id,
            name: template.name,
            usage_count: template.usage_count
        },
        projects,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasNext: page * limit < totalCount,
            hasPrev: page > 1
        }
    };
};
