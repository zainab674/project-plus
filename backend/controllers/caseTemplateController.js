import { prisma } from '../prisma/index.js';
import ErrorHandler from '../utils/errorHandler.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import { uploadToCloud } from '../services/mediaService.js';
import { validateRequestBody } from '../utils/validateRequestBody.js';
import { 
    createCaseTemplateSchema, 
    updateCaseTemplateSchema, 
    createTemplateFolderSchema,
    useTemplateForProjectSchema,
    templateQuerySchema,
    templateIdSchema,
    fileUploadSchema
} from '../schema/caseTemplateSchema.js';

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

        console.log(`Successfully copied ${template.folders.length} folders and ${template.files.length} root files from template to user ${userId}`);
    } catch (error) {
        console.error('Error copying template documents to project:', error);
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

// Test endpoint to check database connection
export const testDatabaseConnection = catchAsyncError(async (req, res, next) => {
    try {
        // Test basic database connection
        await prisma.$queryRaw`SELECT 1`;
        
        // Test if case template tables exist
        const tableExists = await prisma.$queryRaw`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'CaseTemplate'
            );
        `;
        
        res.status(200).json({
            success: true,
            message: "Database connection successful",
            caseTemplateTableExists: tableExists[0].exists
        });
    } catch (error) {
        console.error('Database connection test failed:', error);
        return next(new ErrorHandler(`Database connection failed: ${error.message}`, 500));
    }
});

// Get all case templates for a user
export const getAllCaseTemplates = catchAsyncError(async (req, res, next) => {
    const user = req.user;
    const { category, search, page = 1, limit = 10 } = req.query;

    // For now, make templates globally accessible to all users
    // TODO: Implement proper template sharing/permissions system
    const where = {
        is_active: true
    };

    if (category && category !== 'all') {
        where.category = category;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
        ];
    }

    // Get templates with pagination
    const templates = await prisma.caseTemplate.findMany({
        where,
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
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
    });

    // Get total count for pagination
    const totalCount = await prisma.caseTemplate.count({ where });

    res.status(200).json({
        success: true,
        templates,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasNext: page * limit < totalCount,
            hasPrev: page > 1
        }
    });
});

// Get a single case template by ID
export const getCaseTemplateById = catchAsyncError(async (req, res, next) => {
    const { templateId } = req.params;
    const user = req.user;

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
        return next(new ErrorHandler("Case template not found", 404));
    }

    res.status(200).json({
        success: true,
        template
    });
});

// Helper function to validate files inside folders
export const validateFolderFiles = (folders, files) => {
    const validationErrors = [];
    
    // Create a map of folder IDs for quick lookup (including temporary IDs)
    const folderIds = new Set();
    folders.forEach(folder => {
        // Add both database ID and temporary ID if they exist
        if (folder.folder_id) folderIds.add(folder.folder_id);
        if (folder.id) folderIds.add(folder.id);
        if (folder.temp_id) folderIds.add(folder.temp_id);
    });
    
    // Check if files reference valid folders
    files.forEach((file, index) => {
        if (file.folder_id && !folderIds.has(file.folder_id)) {
            validationErrors.push(`File "${file.name}" at index ${index} references non-existent folder ID: ${file.folder_id}`);
        }
    });
    
    // Note: Removed validation that requires folders to have files
    // Folders can exist without files - this is a valid use case
    
    // Check if files in folders have proper file_url or are properly saved
    files.forEach((file, fileIndex) => {
        if (file.folder_id && !file.file_url && !file.is_saved) {
            const folder = folders.find(f => (f.folder_id || f.id || f.temp_id) === file.folder_id);
            const folderName = folder ? folder.name : 'Unknown';
            validationErrors.push(`File "${file.name}" in folder "${folderName}" is not properly saved (missing file_url)`);
        }
    });
    
    return validationErrors;
};

// Helper function to upload files to Cloudinary and validate URLs
export const uploadFilesToCloudinary = async (files) => {
    const uploadedFiles = [];
    const uploadErrors = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            // Upload to Cloudinary
            const cloudRes = await uploadToCloud(file);
            
            // Validate that we got a proper URL
            if (!cloudRes.url || !cloudRes.url.startsWith('https://')) {
                uploadErrors.push(`File "${file.originalname}" at index ${i} failed to upload to Cloudinary - invalid URL`);
                continue;
            }
            
            uploadedFiles.push({
                name: file.originalname,
                description: file.description || null,
                file_url: cloudRes.url,
                file_size: file.size,
                mime_type: file.mimetype,
                order: file.order || 0,
                folder_id: file.folder_id || null,
                cloudinary_key: cloudRes.key // Store Cloudinary public_id for future reference
            });
            
        } catch (error) {
            uploadErrors.push(`File "${file.originalname}" at index ${i} failed to upload: ${error.message}`);
        }
    }
    
    return { uploadedFiles, uploadErrors };
};

// Create a new case template with file upload support
export const createCaseTemplate = catchAsyncError(async (req, res, next) => {
    const user = req.user;
    let user_id = user.Role === "TEAM" ? user.leader_id : user.user_id;

    // Parse FormData fields
    const name = req.body.name;
    const description = req.body.description;
    const category = req.body.category;
    const default_priority = req.body.default_priority;
    const estimated_duration = req.body.estimated_duration;
    
    // Parse JSON fields
    let phases = [];
    let folders = [];
    let files = [];
    
    try {
        phases = req.body.phases ? JSON.parse(req.body.phases) : [];
        folders = req.body.folders ? JSON.parse(req.body.folders) : [];
    } catch (error) {
        return next(new ErrorHandler("Invalid JSON format for phases or folders", 400));
    }

    // Handle file uploads
    if (req.files) {
        const uploadedFiles = [];
        const uploadErrors = [];
        
        // Handle different file field structures
        let allFiles = [];
        
        // If files is an array (from .array() middleware)
        if (Array.isArray(req.files)) {
            allFiles = req.files;
        }
        // If files is an object (from .fields() middleware)
        else if (typeof req.files === 'object') {
            Object.values(req.files).forEach(fileArray => {
                if (Array.isArray(fileArray)) {
                    allFiles.push(...fileArray);
                } else {
                    allFiles.push(fileArray);
                }
            });
        }
        
        for (let i = 0; i < allFiles.length; i++) {
            const file = allFiles[i];
            
            try {
                // Upload to Cloudinary
                const cloudRes = await uploadToCloud(file);
                
                // Validate that we got a proper URL
                if (!cloudRes.url || !cloudRes.url.startsWith('https://')) {
                    uploadErrors.push(`File "${file.originalname}" at index ${i} failed to upload to Cloudinary - invalid URL`);
                    continue;
                }
                
                // Get folder association for this file
                const folderId = req.body[`file_${i}_folder_id`] || null;
                console.log(`Processing file ${i}: ${file.originalname} -> Folder ID: ${folderId}`);
                
                uploadedFiles.push({
                    name: file.originalname,
                    description: null,
                    file_url: cloudRes.url,
                    file_size: file.size,
                    mime_type: file.mimetype,
                    order: i,
                    folder_id: folderId,
                    cloudinary_key: cloudRes.key
                });
                
            } catch (error) {
                console.error(`File upload error for "${file.originalname}" at index ${i}:`, error);
                const errorMessage = error?.message || error?.toString() || 'Unknown error';
                uploadErrors.push(`File "${file.originalname}" at index ${i} failed to upload: ${errorMessage}`);
            }
        }
        
        if (uploadErrors.length > 0) {
            return next(new ErrorHandler(`File upload failed: ${uploadErrors.join('; ')}`, 400));
        }
        
        files = uploadedFiles;
    }

    console.log('Creating template with data:', {
        name,
        category,
        user_id,
        phases_count: phases.length,
        documents_count: files.length,
        folders_count: folders.length
    });

    // Validate files inside folders
    const folderFileValidationErrors = validateFolderFiles(folders, files);
    if (folderFileValidationErrors.length > 0) {
        return next(new ErrorHandler(`File validation failed: ${folderFileValidationErrors.join('; ')}`, 400));
    }

    try {
        // Create template with phases and folders first
        const template = await prisma.caseTemplate.create({
            data: {
                name,
                description,
                category,
                default_priority: default_priority || 'Medium',
                estimated_duration,
                phases_count: phases.length,
                documents_count: files.length,
                created_by: user_id,
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

        // Handle folder relationships after creation
        if (folders.length > 0) {
            for (const folder of folders) {
                const updates = {};
                
                // Handle parent-child relationships
                if (folder.parent_id) {
                    const originalFolder = folders.find(f => (f.folder_id || f.id || f.temp_id) === folder.parent_id);
                    if (originalFolder) {
                        const parentFolder = template.folders.find(f => f.name === originalFolder.name);
                        if (parentFolder) {
                            updates.parent_id = parentFolder.folder_id;
                        }
                    }
                }
                
                // Handle phase relationships
                if (folder.phase_id) {
                    // phase_id from frontend is the order number, need to find the actual phase
                    const phaseOrder = parseInt(folder.phase_id);
                    const phase = template.phases.find(p => p.order === phaseOrder);
                    if (phase) {
                        updates.phase_id = phase.phase_id;
                    }
                }
                
                // Update folder if there are any relationships to set
                if (Object.keys(updates).length > 0) {
                    const folderToUpdate = template.folders.find(f => f.name === folder.name);
                    if (folderToUpdate) {
                        await prisma.caseTemplateFolder.update({
                            where: { folder_id: folderToUpdate.folder_id },
                            data: updates
                        });
                    }
                }
            }
        }

        // Create files after template and folders are created
        if (files.length > 0) {
            const createdFiles = [];
            
            for (const file of files) {
                // Find the corresponding folder ID in the created folders
                let folderId = null;
                if (file.folder_id) {
                    console.log(`Looking for folder with ID: ${file.folder_id}`);
                    // First try to find by matching the temporary folder ID to the folder name
                    const originalFolder = folders.find(f => (f.folder_id || f.id || f.temp_id) === file.folder_id);
                    console.log(`Found original folder:`, originalFolder);
                    if (originalFolder) {
                        const createdFolder = template.folders.find(folder => folder.name === originalFolder.name);
                        console.log(`Found created folder:`, createdFolder);
                        folderId = createdFolder?.folder_id || null;
                    }
                }
                console.log(`Final folder ID for file ${file.name}: ${folderId}`);

                const templateFile = await prisma.caseTemplateFile.create({
                    data: {
                        template_id: template.template_id,
                        folder_id: folderId,
                        name: file.name,
                        description: file.description,
                        file_url: file.file_url,
                        file_size: file.file_size,
                        mime_type: file.mime_type,
                        order: file.order || 0
                    }
                });
                
                createdFiles.push(templateFile);
            }

            // Update document count with actual created files
            await prisma.caseTemplate.update({
                where: { template_id: template.template_id },
                data: { documents_count: createdFiles.length }
            });
        }

        // Get the complete template with files
        const completeTemplate = await prisma.caseTemplate.findUnique({
            where: { template_id: template.template_id },
            include: {
                phases: {
                    orderBy: { order: 'asc' }
                },
                folders: {
                    include: {
                        files: true
                    },
                    orderBy: { order: 'asc' }
                },
                files: {
                    where: { folder_id: null },
                    orderBy: { order: 'asc' }
                }
            }
        });

        console.log('Template created successfully:', template.template_id);

        res.status(201).json({
            success: true,
            template: completeTemplate,
            message: "Case template created successfully"
        });
    } catch (error) {
        console.error('Error creating template:', error);
        return next(new ErrorHandler(`Failed to create template: ${error.message}`, 500));
    }
});

// Update a case template
export const updateCaseTemplate = catchAsyncError(async (req, res, next) => {
    const { templateId } = req.params;
    const user = req.user;
    let user_id = user.Role === "TEAM" ? user.leader_id : user.user_id;

    // Parse FormData fields
    const name = req.body.name;
    const description = req.body.description;
    const category = req.body.category;
    const default_priority = req.body.default_priority;
    const estimated_duration = req.body.estimated_duration;
    
    // Parse JSON fields
    let phases = [];
    let folders = [];
    let files = [];
    
    try {
        phases = req.body.phases ? JSON.parse(req.body.phases) : [];
        folders = req.body.folders ? JSON.parse(req.body.folders) : [];
    } catch (error) {
        return next(new ErrorHandler("Invalid JSON format for phases or folders", 400));
    }

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.caseTemplate.findFirst({
        where: {
            template_id: templateId,
            created_by: user_id,
            is_active: true
        }
    });

    if (!existingTemplate) {
        return next(new ErrorHandler("Case template not found", 404));
    }

    // Handle new file uploads
    if (req.files) {
        const uploadedFiles = [];
        const uploadErrors = [];
        
        // Handle different file field structures
        let allFiles = [];
        
        // If files is an array (from .array() middleware)
        if (Array.isArray(req.files)) {
            allFiles = req.files;
        }
        // If files is an object (from .fields() middleware)
        else if (typeof req.files === 'object') {
            Object.values(req.files).forEach(fileArray => {
                if (Array.isArray(fileArray)) {
                    allFiles.push(...fileArray);
                } else {
                    allFiles.push(fileArray);
                }
            });
        }
        
        for (let i = 0; i < allFiles.length; i++) {
            const file = allFiles[i];
            
            try {
                // Upload to Cloudinary
                const cloudRes = await uploadToCloud(file);
                
                // Validate that we got a proper URL
                if (!cloudRes.url || !cloudRes.url.startsWith('https://')) {
                    uploadErrors.push(`File "${file.originalname}" at index ${i} failed to upload to Cloudinary - invalid URL`);
                    continue;
                }
                
                // Get folder association for this file
                const folderId = req.body[`file_${i}_folder_id`] || null;
                console.log(`Processing file ${i}: ${file.originalname} -> Folder ID: ${folderId}`);
                
                uploadedFiles.push({
                    name: file.originalname,
                    description: null,
                    file_url: cloudRes.url,
                    file_size: file.size,
                    mime_type: file.mimetype,
                    order: i,
                    folder_id: folderId,
                    cloudinary_key: cloudRes.key
                });
                
            } catch (error) {
                console.error(`File upload error for "${file.originalname}" at index ${i}:`, error);
                const errorMessage = error?.message || error?.toString() || 'Unknown error';
                uploadErrors.push(`File "${file.originalname}" at index ${i} failed to upload: ${errorMessage}`);
            }
        }
        
        if (uploadErrors.length > 0) {
            return next(new ErrorHandler(`File upload failed: ${uploadErrors.join('; ')}`, 400));
        }
        
        files = uploadedFiles;
    }

    try {
        // Update template basic info
        const template = await prisma.caseTemplate.update({
            where: { template_id: templateId },
            data: {
                name,
                description,
                category,
                default_priority,
                estimated_duration,
                phases_count: phases.length,
                documents_count: { increment: files.length }, // Add new files to count
                updated_at: new Date()
            }
        });

        // Update phases (delete existing and create new ones)
        await prisma.caseTemplatePhase.deleteMany({
            where: { template_id: templateId }
        });

        if (phases.length > 0) {
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

        // Update folders (delete existing and create new ones)
        await prisma.caseTemplateFolder.deleteMany({
            where: { template_id: templateId }
        });

        if (folders.length > 0) {
            // First create all folders without relationships
            await prisma.caseTemplateFolder.createMany({
                data: folders.map(folder => ({
                    template_id: templateId,
                    name: folder.name,
                    description: folder.description,
                    order: folder.order || 0
                }))
            });
            
            // Then handle folder relationships
            for (const folder of folders) {
                const updates = {};
                
                // Handle parent-child relationships
                if (folder.parent_id) {
                    const originalFolder = folders.find(f => (f.folder_id || f.id || f.temp_id) === folder.parent_id);
                    if (originalFolder) {
                        const parentFolder = await prisma.caseTemplateFolder.findFirst({
                            where: {
                                template_id: templateId,
                                name: originalFolder.name
                            }
                        });
                        if (parentFolder) {
                            updates.parent_id = parentFolder.folder_id;
                        }
                    }
                }
                
                // Handle phase relationships
                if (folder.phase_id) {
                    // phase_id from frontend is the order number, need to find the actual phase
                    const phaseOrder = parseInt(folder.phase_id);
                    const phase = await prisma.caseTemplatePhase.findFirst({
                        where: {
                            template_id: templateId,
                            order: phaseOrder
                        }
                    });
                    if (phase) {
                        updates.phase_id = phase.phase_id;
                    }
                }
                
                // Update folder if there are any relationships to set
                if (Object.keys(updates).length > 0) {
                    const folderToUpdate = await prisma.caseTemplateFolder.findFirst({
                        where: {
                            template_id: templateId,
                            name: folder.name
                        }
                    });
                    if (folderToUpdate) {
                        await prisma.caseTemplateFolder.update({
                            where: { folder_id: folderToUpdate.folder_id },
                            data: updates
                        });
                    }
                }
            }
        }

        // Add new files if any
        if (files.length > 0) {
            const createdFiles = [];
            
            for (const file of files) {
                // Find the corresponding folder ID in the created folders
                let folderId = null;
                if (file.folder_id) {
                    // First try to find by matching the temporary folder ID to the folder name
                    const originalFolder = folders.find(f => (f.folder_id || f.id || f.temp_id) === file.folder_id);
                    if (originalFolder) {
                        const createdFolder = await prisma.caseTemplateFolder.findFirst({
                            where: {
                                template_id: templateId,
                                name: originalFolder.name
                            }
                        });
                        folderId = createdFolder?.folder_id || null;
                    }
                }

                const templateFile = await prisma.caseTemplateFile.create({
                    data: {
                        template_id: templateId,
                        folder_id: folderId,
                        name: file.name,
                        description: file.description,
                        file_url: file.file_url,
                        file_size: file.file_size,
                        mime_type: file.mime_type,
                        order: file.order || 0
                    }
                });
                
                createdFiles.push(templateFile);
            }
        }

        // Get updated template with relations
        const updatedTemplate = await prisma.caseTemplate.findUnique({
            where: { template_id: templateId },
            include: {
                phases: {
                    orderBy: { order: 'asc' }
                },
                folders: {
                    include: {
                        files: true
                    },
                    orderBy: { order: 'asc' }
                },
                files: {
                    where: { folder_id: null },
                    orderBy: { order: 'asc' }
                }
            }
        });

        res.status(200).json({
            success: true,
            template: updatedTemplate,
            message: "Case template updated successfully"
        });
    } catch (error) {
        console.error('Error updating template:', error);
        return next(new ErrorHandler(`Failed to update template: ${error.message}`, 500));
    }
});

// Delete a case template (soft delete)
export const deleteCaseTemplate = catchAsyncError(async (req, res, next) => {
    const { templateId } = req.params;
    const user = req.user;

    let user_id = user.Role === "TEAM" ? user.leader_id : user.user_id;

    // Check if template exists and belongs to user
    const template = await prisma.caseTemplate.findFirst({
        where: {
            template_id: templateId,
            created_by: user_id,
            is_active: true
        }
    });

    if (!template) {
        return next(new ErrorHandler("Case template not found", 404));
    }

    // Soft delete by setting is_active to false
    await prisma.caseTemplate.update({
        where: { template_id: templateId },
        data: { is_active: false }
    });

    res.status(200).json({
        success: true,
        message: "Case template deleted successfully"
    });
});

// Upload file to template folder
export const uploadTemplateFile = catchAsyncError(async (req, res, next) => {
    const { templateId, folderId } = req.body;
    const file = req.file;
    const user = req.user;

    let user_id = user.Role === "TEAM" ? user.leader_id : user.user_id;

    if (!file || !templateId) {
        return next(new ErrorHandler("File and template ID are required", 400));
    }

    // Check if template exists and belongs to user
    const template = await prisma.caseTemplate.findFirst({
        where: {
            template_id: templateId,
            created_by: user_id,
            is_active: true
        }
    });

    if (!template) {
        return next(new ErrorHandler("Case template not found", 404));
    }

    // Upload to Cloudinary
    const cloudRes = await uploadToCloud(file);

    // Save file record
    const templateFile = await prisma.caseTemplateFile.create({
        data: {
            template_id: templateId,
            folder_id: folderId || null,
            name: file.originalname,
            description: req.body.description || null,
            file_url: cloudRes.url,
            file_size: file.size,
            mime_type: file.mimetype,
            order: 0
        }
    });

    // Update document count
    await prisma.caseTemplate.update({
        where: { template_id: templateId },
        data: { 
            documents_count: { increment: 1 }
        }
    });

    res.status(201).json({
        success: true,
        file: templateFile,
        message: "File uploaded successfully"
    });
});

// Create template folder
export const createTemplateFolder = catchAsyncError(async (req, res, next) => {
    const { templateId } = req.params;
    const { name, description, parent_id, order } = req.body;
    const user = req.user;

    let user_id = user.Role === "TEAM" ? user.leader_id : user.user_id;

    if (!name) {
        return next(new ErrorHandler("Folder name is required", 400));
    }

    // Check if template exists and belongs to user
    const template = await prisma.caseTemplate.findFirst({
        where: {
            template_id: templateId,
            created_by: user_id,
            is_active: true
        }
    });

    if (!template) {
        return next(new ErrorHandler("Case template not found", 404));
    }

    // Create folder
    const folder = await prisma.caseTemplateFolder.create({
        data: {
            template_id: templateId,
            name,
            description,
            parent_id: parent_id || null,
            order: order || 0
        }
    });

    res.status(201).json({
        success: true,
        folder,
        message: "Folder created successfully"
    });
});

// Use template to create project
export const useTemplateForProject = catchAsyncError(async (req, res, next) => {
    // Validate request body
    const [err, isValidate] = await validateRequestBody(req.body, useTemplateForProjectSchema);
    if (!isValidate) {
        return next(new ErrorHandler(err, 400));
    }

    const { templateId } = req.params;
    const { 
        projectName, 
        projectDescription, 
        clientName, 
        clientAddress,
        opposing,
        priority,
        filingDate,
        phases,
        status,
        budget,
        selectedTeamMembers
    } = req.body;
    const user = req.user;

    let user_id = user.Role === "TEAM" ? user.leader_id : user.user_id;

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
        return next(new ErrorHandler("Case template not found", 404));
    }

    // Create project using template
    const project = await prisma.project.create({
        data: {
            name: projectName,
            description: projectDescription || template.description,
            created_by: user_id,
            client_name: clientName,
            client_address: clientAddress,
            opposing: opposing,
            priority: priority || template.default_priority,
            filingDate: filingDate ? new Date(filingDate) : new Date(),
            phases: phases || template.phases.map(phase => phase.name),
            status: status || 'Pending',
            budget: budget || 0,
            template_id: templateId
        }
    });

    // Copy template documents to project
    await copyTemplateDocumentsToProject(template, project.project_id, user_id);

    // Add project creator as PROVIDER
    await prisma.projectMember.create({
        data: {
            project_id: project.project_id,
            user_id: user_id,
            role: 'PROVIDER',
        },
    });

    // Add selected team members
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
                    leader_id: user_id
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

    res.status(201).json({
        success: true,
        project,
        message: "Project created from template successfully"
    });
});

// Get template categories
export const getTemplateCategories = catchAsyncError(async (req, res, next) => {
    const categories = [
        'Real Estate',
        'Personal Injury',
        'Business Law',
        'Criminal Law',
        'Family Law',
        'Employment Law',
        'Immigration Law',
        'Estate Planning',
        'Intellectual Property',
        'Tax Law'
    ];

    res.status(200).json({
        success: true,
        categories
    });
});

// Get template statistics
export const getTemplateStats = catchAsyncError(async (req, res, next) => {
    const user = req.user;
    let user_id = user.Role === "TEAM" ? user.leader_id : user.user_id;

    const stats = await prisma.caseTemplate.aggregate({
        where: {
            created_by: user_id,
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
            created_by: user_id,
            is_active: true
        },
        _count: {
            template_id: true
        }
    });

    res.status(200).json({
        success: true,
        stats: {
            totalTemplates: stats._count.template_id,
            totalUsage: stats._sum.usage_count || 0,
            totalPhases: stats._sum.phases_count || 0,
            totalDocuments: stats._sum.documents_count || 0,
            categoryBreakdown: categoryStats
        }
    });
});
