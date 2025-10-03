import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ContactService {
    /**
     * Create a new contact
     */
    static async createContact(contactData) {
        try {
            // Check for duplicate phone number
            const existingContact = await prisma.contact.findFirst({
                where: {
                    user_id: contactData.user_id,
                    phone_number: contactData.phone_number
                }
            });

            if (existingContact) {
                return { 
                    success: false, 
                    error: 'Contact with this phone number already exists',
                    data: existingContact
                };
            }

            const contact = await prisma.contact.create({
                data: contactData
            });

            return { success: true, data: contact };
        } catch (error) {
            console.error('ContactService.createContact error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get contacts for user with filters
     */
    static async getContacts(userId, filters = {}) {
        try {
            const {
                page = 1,
                limit = 50,
                search,
                is_favorite,
                tags
            } = filters;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            const where = { user_id: userId };

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
                where.tags = { hasSome: tagArray };
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

            return {
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
            };
        } catch (error) {
            console.error('ContactService.getContacts error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get contact by ID
     */
    static async getContactById(contactId, userId) {
        try {
            const contact = await prisma.contact.findFirst({
                where: {
                    contact_id: contactId,
                    user_id: userId
                }
            });

            if (!contact) {
                return { success: false, error: 'Contact not found' };
            }

            return { success: true, data: contact };
        } catch (error) {
            console.error('ContactService.getContactById error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update contact
     */
    static async updateContact(contactId, userId, updateData) {
        try {
            // Verify ownership
            const existingContact = await prisma.contact.findFirst({
                where: {
                    contact_id: contactId,
                    user_id: userId
                }
            });

            if (!existingContact) {
                return { success: false, error: 'Contact not found or access denied' };
            }

            // Check for phone number conflicts if phone is being updated
            if (updateData.phone_number && updateData.phone_number !== existingContact.phone_number) {
                const phoneConflict = await prisma.contact.findFirst({
                    where: {
                        user_id: userId,
                        phone_number: updateData.phone_number,
                        contact_id: { not: contactId }
                    }
                });

                if (phoneConflict) {
                    return { 
                        success: false, 
                        error: 'Contact with this phone number already exists' 
                    };
                }
            }

            const contact = await prisma.contact.update({
                where: { contact_id: contactId },
                data: updateData
            });

            return { success: true, data: contact };
        } catch (error) {
            console.error('ContactService.updateContact error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete contact
     */
    static async deleteContact(contactId, userId) {
        try {
            // Verify ownership
            const contact = await prisma.contact.findFirst({
                where: {
                    contact_id: contactId,
                    user_id: userId
                }
            });

            if (!contact) {
                return { success: false, error: 'Contact not found or access denied' };
            }

            await prisma.contact.delete({
                where: { contact_id: contactId }
            });

            return { success: true, message: 'Contact deleted successfully' };
        } catch (error) {
            console.error('ContactService.deleteContact error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Bulk import contacts
     */
    static async bulkImportContacts(userId, contacts) {
        try {
            if (!Array.isArray(contacts)) {
                return { success: false, error: 'Contacts must be an array' };
            }

            const validContacts = [];
            const errors = [];

            // Validate and deduplicate contacts
            for (let i = 0; i < contacts.length; i++) {
                const contact = contacts[i];
                
                if (!contact.name || !contact.phone_number) {
                    errors.push(`Row ${i + 1}: Name and phone number are required`);
                    continue;
                }

                // Check for duplicates in import data
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
                return { success: false, error: 'No valid contacts to import' };
            }

            // Bulk create contacts
            const result = await prisma.contact.createMany({
                data: validContacts,
                skipDuplicates: true
            });

            return {
                success: true,
                data: {
                    imported_count: result.count,
                    total_provided: contacts.length,
                    errors: errors.length > 0 ? errors : null
                }
            };
        } catch (error) {
            console.error('ContactService.bulkImportContacts error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get contact statistics
     */
    static async getContactStats(userId) {
        try {
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

            return {
                success: true,
                data: {
                    total_contacts: totalContacts,
                    favorite_contacts: favoriteContacts,
                    contacts_with_email: contactsWithEmail,
                    contacts_with_company: contactsWithCompany
                }
            };
        } catch (error) {
            console.error('ContactService.getContactStats error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Search contacts by phone number
     */
    static async searchContactByPhone(userId, phoneNumber) {
        try {
            const contact = await prisma.contact.findFirst({
                where: {
                    user_id: userId,
                    phone_number: phoneNumber
                }
            });

            return { success: true, data: contact };
        } catch (error) {
            console.error('ContactService.searchContactByPhone error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Toggle favorite status
     */
    static async toggleFavorite(contactId, userId) {
        try {
            const contact = await prisma.contact.findFirst({
                where: {
                    contact_id: contactId,
                    user_id: userId
                }
            });

            if (!contact) {
                return { success: false, error: 'Contact not found' };
            }

            const updatedContact = await prisma.contact.update({
                where: { contact_id: contactId },
                data: { is_favorite: !contact.is_favorite }
            });

            return { success: true, data: updatedContact };
        } catch (error) {
            console.error('ContactService.toggleFavorite error:', error);
            return { success: false, error: error.message };
        }
    }
}

export default ContactService;
