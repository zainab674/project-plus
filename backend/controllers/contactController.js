import "dotenv/config";
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { prisma } from '../prisma/index.js';

// Create a new contact
export const createContact = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        const { 
            name, 
            phone_number, 
            email, 
            company, 
            notes, 
            tags = [], 
            is_favorite = false 
        } = req.body;

        if (!userId) {
            return next(new ErrorHandler('User authentication required', 401));
        }

        if (!name || !phone_number) {
            return next(new ErrorHandler('Name and phone number are required', 400));
        }

        // Check if contact already exists for this user
        const existingContact = await prisma.contact.findFirst({
            where: {
                user_id: userId,
                phone_number
            }
        });

        if (existingContact) {
            return next(new ErrorHandler('Contact with this phone number already exists', 409));
        }

        const contact = await prisma.contact.create({
            data: {
                user_id: userId,
                name,
                phone_number,
                email,
                company,
                notes,
                tags,
                is_favorite
            }
        });

        res.status(201).json({
            success: true,
            message: 'Contact created successfully',
            data: contact
        });

    } catch (error) {
        console.error('Create contact error:', error);
        return next(new ErrorHandler(`Failed to create contact: ${error.message}`, 500));
    }
});

// Get all contacts for a user
export const getContacts = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        const { 
            page = 1, 
            limit = 50, 
            search, 
            is_favorite, 
            tags 
        } = req.query;

        if (!userId) {
            return next(new ErrorHandler('User authentication required', 401));
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Build where clause
        const where = {
            user_id: userId
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone_number: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (is_favorite !== undefined) {
            where.is_favorite = is_favorite === 'true';
        }

        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            where.tags = {
                hasSome: tagArray
            };
        }

        const [contacts, totalCount] = await Promise.all([
            prisma.contact.findMany({
                where,
                orderBy: [
                    { is_favorite: 'desc' },
                    { name: 'asc' }
                ],
                skip,
                take: parseInt(limit)
            }),
            prisma.contact.count({ where })
        ]);

        res.status(200).json({
            success: true,
            data: {
                contacts,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalCount / parseInt(limit)),
                    total_count: totalCount,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get contacts error:', error);
        return next(new ErrorHandler(`Failed to fetch contacts: ${error.message}`, 500));
    }
});

// Get contact by ID
export const getContactById = catchAsyncError(async (req, res, next) => {
    try {
        const { contact_id } = req.params;
        const userId = req.user?.user_id;

        if (!userId) {
            return next(new ErrorHandler('User authentication required', 401));
        }

        const contact = await prisma.contact.findFirst({
            where: {
                contact_id,
                user_id: userId
            }
        });

        if (!contact) {
            return next(new ErrorHandler('Contact not found', 404));
        }

        res.status(200).json({
            success: true,
            data: contact
        });

    } catch (error) {
        console.error('Get contact by ID error:', error);
        return next(new ErrorHandler(`Failed to fetch contact: ${error.message}`, 500));
    }
});

// Update contact
export const updateContact = catchAsyncError(async (req, res, next) => {
    try {
        const { contact_id } = req.params;
        const userId = req.user?.user_id;
        const { 
            name, 
            phone_number, 
            email, 
            company, 
            notes, 
            tags, 
            is_favorite 
        } = req.body;

        if (!userId) {
            return next(new ErrorHandler('User authentication required', 401));
        }

        // Verify the contact belongs to the user
        const existingContact = await prisma.contact.findFirst({
            where: {
                contact_id,
                user_id: userId
            }
        });

        if (!existingContact) {
            return next(new ErrorHandler('Contact not found or access denied', 404));
        }

        // Check if phone number is being changed and if it conflicts
        if (phone_number && phone_number !== existingContact.phone_number) {
            const phoneConflict = await prisma.contact.findFirst({
                where: {
                    user_id: userId,
                    phone_number,
                    contact_id: { not: contact_id }
                }
            });

            if (phoneConflict) {
                return next(new ErrorHandler('Contact with this phone number already exists', 409));
            }
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (phone_number) updateData.phone_number = phone_number;
        if (email !== undefined) updateData.email = email;
        if (company !== undefined) updateData.company = company;
        if (notes !== undefined) updateData.notes = notes;
        if (tags) updateData.tags = tags;
        if (is_favorite !== undefined) updateData.is_favorite = is_favorite;

        const contact = await prisma.contact.update({
            where: { contact_id },
            data: updateData
        });

        res.status(200).json({
            success: true,
            message: 'Contact updated successfully',
            data: contact
        });

    } catch (error) {
        console.error('Update contact error:', error);
        return next(new ErrorHandler(`Failed to update contact: ${error.message}`, 500));
    }
});

// Delete contact
export const deleteContact = catchAsyncError(async (req, res, next) => {
    try {
        const { contact_id } = req.params;
        const userId = req.user?.user_id;

        if (!userId) {
            return next(new ErrorHandler('User authentication required', 401));
        }

        // Verify the contact belongs to the user
        const contact = await prisma.contact.findFirst({
            where: {
                contact_id,
                user_id: userId
            }
        });

        if (!contact) {
            return next(new ErrorHandler('Contact not found or access denied', 404));
        }

        await prisma.contact.delete({
            where: { contact_id }
        });

        res.status(200).json({
            success: true,
            message: 'Contact deleted successfully'
        });

    } catch (error) {
        console.error('Delete contact error:', error);
        return next(new ErrorHandler(`Failed to delete contact: ${error.message}`, 500));
    }
});

// Bulk import contacts from CSV
export const bulkImportContacts = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        const { contacts } = req.body; // Array of contact objects

        if (!userId) {
            return next(new ErrorHandler('User authentication required', 401));
        }

        if (!contacts || !Array.isArray(contacts)) {
            return next(new ErrorHandler('Contacts array is required', 400));
        }

        // Validate contacts
        const validContacts = [];
        const errors = [];

        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            if (!contact.name || !contact.phone_number) {
                errors.push(`Row ${i + 1}: Name and phone number are required`);
                continue;
            }

            // Check for duplicates in the import data
            const duplicateInImport = validContacts.find(c => c.phone_number === contact.phone_number);
            if (duplicateInImport) {
                errors.push(`Row ${i + 1}: Duplicate phone number in import data`);
                continue;
            }

            // Check for existing contacts in database
            const existingContact = await prisma.contact.findFirst({
                where: {
                    user_id: userId,
                    phone_number: contact.phone_number
                }
            });

            if (existingContact) {
                errors.push(`Row ${i + 1}: Contact with phone number ${contact.phone_number} already exists`);
                continue;
            }

            validContacts.push({
                user_id: userId,
                name: contact.name,
                phone_number: contact.phone_number,
                email: contact.email || null,
                company: contact.company || null,
                notes: contact.notes || null,
                tags: contact.tags || [],
                is_favorite: contact.is_favorite || false
            });
        }

        if (validContacts.length === 0) {
            return next(new ErrorHandler('No valid contacts to import', 400));
        }

        // Bulk create contacts
        const createdContacts = await prisma.contact.createMany({
            data: validContacts,
            skipDuplicates: true
        });

        res.status(201).json({
            success: true,
            message: `Successfully imported ${createdContacts.count} contacts`,
            data: {
                imported_count: createdContacts.count,
                total_provided: contacts.length,
                errors: errors.length > 0 ? errors : null
            }
        });

    } catch (error) {
        console.error('Bulk import contacts error:', error);
        return next(new ErrorHandler(`Failed to import contacts: ${error.message}`, 500));
    }
});

// Get contact statistics
export const getContactStats = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?.user_id;

        if (!userId) {
            return next(new ErrorHandler('User authentication required', 401));
        }

        const [totalContacts, favoriteContacts, contactsWithEmail, contactsWithCompany] = await Promise.all([
            prisma.contact.count({
                where: { user_id: userId }
            }),
            prisma.contact.count({
                where: { 
                    user_id: userId,
                    is_favorite: true 
                }
            }),
            prisma.contact.count({
                where: { 
                    user_id: userId,
                    email: { not: null }
                }
            }),
            prisma.contact.count({
                where: { 
                    user_id: userId,
                    company: { not: null }
                }
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                total_contacts: totalContacts,
                favorite_contacts: favoriteContacts,
                contacts_with_email: contactsWithEmail,
                contacts_with_company: contactsWithCompany
            }
        });

    } catch (error) {
        console.error('Get contact stats error:', error);
        return next(new ErrorHandler(`Failed to fetch contact statistics: ${error.message}`, 500));
    }
});
