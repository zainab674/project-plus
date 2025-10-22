import { z } from 'zod';

// Validation schema for creating a case template
export const createCaseTemplateSchema = z.object({
    name: z.string()
        .min(3, 'Template name must be at least 3 characters long')
        .max(255, 'Template name cannot exceed 255 characters'),
    
    description: z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
    
    category: z.enum([
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
    ], {
        errorMap: () => ({ message: 'Category must be one of the predefined values' })
    }),
    
    default_priority: z.enum(['High', 'Medium', 'Low'])
        .default('Medium')
        .optional(),
    
    estimated_duration: z.string()
        .max(50, 'Estimated duration cannot exceed 50 characters')
        .optional(),
    
    phases: z.array(z.object({
        name: z.string()
            .min(3, 'Phase name must be at least 3 characters long')
            .max(255, 'Phase name cannot exceed 255 characters'),
        description: z.string()
            .max(500, 'Phase description cannot exceed 500 characters')
            .optional(),
        estimated_days: z.number()
            .int('Estimated days must be a whole number')
            .min(1, 'Estimated days must be at least 1')
            .max(365, 'Estimated days cannot exceed 365')
            .optional()
    }))
    .max(20, 'Cannot have more than 20 phases')
    .optional()
    .default([]),
    
    folders: z.array(z.object({
        name: z.string()
            .min(1, 'Folder name must be at least 1 character long')
            .max(255, 'Folder name cannot exceed 255 characters'),
        description: z.string()
            .max(500, 'Folder description cannot exceed 500 characters')
            .optional(),
        parent_id: z.string()
            .uuid('Parent ID must be a valid UUID')
            .optional()
            .nullable(),
        order: z.number()
            .int('Order must be a whole number')
            .min(0, 'Order cannot be negative')
            .optional()
            .default(0)
    }))
    .max(50, 'Cannot have more than 50 folders')
    .optional()
    .default([]),
    
    files: z.array(z.object({
        name: z.string()
            .min(1, 'File name must be at least 1 character long')
            .max(255, 'File name cannot exceed 255 characters'),
        description: z.string()
            .max(500, 'File description cannot exceed 500 characters')
            .optional(),
        folder_id: z.string()
            .uuid('Folder ID must be a valid UUID')
            .optional()
            .nullable(),
        file_url: z.string()
            .url('File URL must be a valid URL')
            .optional(),
        file_size: z.number()
            .int('File size must be a whole number')
            .min(0, 'File size cannot be negative')
            .optional(),
        mime_type: z.string()
            .max(100, 'MIME type cannot exceed 100 characters')
            .optional(),
        order: z.number()
            .int('Order must be a whole number')
            .min(0, 'Order cannot be negative')
            .optional()
            .default(0),
        is_saved: z.boolean()
            .optional()
            .default(false)
    }))
    .max(100, 'Cannot have more than 100 files')
    .optional()
    .default([])
    .refine(files => {
        // Validate that files with folder_id have proper file_url or is_saved flag
        if (!files || !Array.isArray(files)) {
            return true; // Skip validation if files is undefined or not an array
        }
        return files.every(file => {
            if (file.folder_id && !file.file_url && !file.is_saved) {
                return false;
            }
            return true;
        });
    }, {
        message: 'Files assigned to folders must have a valid file_url or be marked as saved'
    })
});

// Validation schema for updating a case template
export const updateCaseTemplateSchema = z.object({
    name: z.string()
        .min(3, 'Template name must be at least 3 characters long')
        .max(255, 'Template name cannot exceed 255 characters')
        .optional(),
    
    description: z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
    
    category: z.enum([
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
    ])
    .optional(),
    
    default_priority: z.enum(['High', 'Medium', 'Low'])
        .optional(),
    
    estimated_duration: z.string()
        .max(50, 'Estimated duration cannot exceed 50 characters')
        .optional(),
    
    phases: z.array(z.object({
        name: z.string()
            .min(3, 'Phase name must be at least 3 characters long')
            .max(255, 'Phase name cannot exceed 255 characters'),
        description: z.string()
            .max(500, 'Phase description cannot exceed 500 characters')
            .optional(),
        estimated_days: z.number()
            .int('Estimated days must be a whole number')
            .min(1, 'Estimated days must be at least 1')
            .max(365, 'Estimated days cannot exceed 365')
            .optional()
    }))
    .max(20, 'Cannot have more than 20 phases')
    .optional(),
    
    folders: z.array(z.object({
        name: z.string()
            .min(1, 'Folder name must be at least 1 character long')
            .max(255, 'Folder name cannot exceed 255 characters'),
        description: z.string()
            .max(500, 'Folder description cannot exceed 500 characters')
            .optional(),
        parent_id: z.string()
            .uuid('Parent ID must be a valid UUID')
            .optional()
            .nullable(),
        order: z.number()
            .int('Order must be a whole number')
            .min(0, 'Order cannot be negative')
            .optional()
            .default(0)
    }))
    .max(50, 'Cannot have more than 50 folders')
    .optional(),
    
    files: z.array(z.object({
        name: z.string()
            .min(1, 'File name must be at least 1 character long')
            .max(255, 'File name cannot exceed 255 characters'),
        description: z.string()
            .max(500, 'File description cannot exceed 500 characters')
            .optional(),
        folder_id: z.string()
            .uuid('Folder ID must be a valid UUID')
            .optional()
            .nullable(),
        file_url: z.string()
            .url('File URL must be a valid URL')
            .optional(),
        file_size: z.number()
            .int('File size must be a whole number')
            .min(0, 'File size cannot be negative')
            .optional(),
        mime_type: z.string()
            .max(100, 'MIME type cannot exceed 100 characters')
            .optional(),
        order: z.number()
            .int('Order must be a whole number')
            .min(0, 'Order cannot be negative')
            .optional()
            .default(0),
        is_saved: z.boolean()
            .optional()
            .default(false)
    }))
    .max(100, 'Cannot have more than 100 files')
    .optional()
    .refine(files => {
        // Validate that files with folder_id have proper file_url or is_saved flag
        if (!files || !Array.isArray(files)) {
            return true; // Skip validation if files is undefined or not an array
        }
        return files.every(file => {
            if (file.folder_id && !file.file_url && !file.is_saved) {
                return false;
            }
            return true;
        });
    }, {
        message: 'Files assigned to folders must have a valid file_url or be marked as saved'
    })
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
});

// Validation schema for creating a template folder
export const createTemplateFolderSchema = z.object({
    name: z.string()
        .min(1, 'Folder name must be at least 1 character long')
        .max(255, 'Folder name cannot exceed 255 characters'),
    
    description: z.string()
        .max(500, 'Folder description cannot exceed 500 characters')
        .optional(),
    
    parent_id: z.string()
        .uuid('Parent ID must be a valid UUID')
        .optional()
        .nullable(),
    
    order: z.number()
        .int('Order must be a whole number')
        .min(0, 'Order cannot be negative')
        .optional()
        .default(0)
});

// Validation schema for using template to create project
export const useTemplateForProjectSchema = z.object({
    projectName: z.string()
        .min(3, 'Project name must be at least 3 characters long')
        .max(255, 'Project name cannot exceed 255 characters'),
    
    projectDescription: z.string()
        .max(1000, 'Project description cannot exceed 1000 characters')
        .optional(),
    
    clientName: z.string()
        .min(2, 'Client name must be at least 2 characters long')
        .max(255, 'Client name cannot exceed 255 characters')
        .optional(),
    
    clientAddress: z.string()
        .max(500, 'Client address cannot exceed 500 characters')
        .optional()
});

// Validation schema for query parameters
export const templateQuerySchema = z.object({
    category: z.enum([
        'all',
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
    ])
    .optional()
    .default('all'),
    
    search: z.string()
        .max(100, 'Search term cannot exceed 100 characters')
        .optional(),
    
    page: z.number()
        .int('Page must be a whole number')
        .min(1, 'Page must be at least 1')
        .optional()
        .default(1),
    
    limit: z.number()
        .int('Limit must be a whole number')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .optional()
        .default(10)
});

// Validation schema for template ID parameter
export const templateIdSchema = z.object({
    templateId: z.string()
        .uuid('Template ID must be a valid UUID')
});

// Validation schema for file upload
export const fileUploadSchema = z.object({
    templateId: z.string()
        .uuid('Template ID must be a valid UUID'),
    
    folderId: z.string()
        .uuid('Folder ID must be a valid UUID')
        .optional()
        .nullable(),
    
    description: z.string()
        .max(500, 'File description cannot exceed 500 characters')
        .optional()
});
