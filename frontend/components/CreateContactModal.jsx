import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { X, User, Phone, Mail, Building, Star, Tag } from 'lucide-react';
import { createContact } from '@/lib/http/callContactApi';
import { toast } from 'react-toastify';

const CreateContactModal = ({ isOpen, onClose, onContactCreated, prefillData = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        email: '',
        company: '',
        notes: '',
        is_favorite: false,
        tags: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [newTag, setNewTag] = useState('');

    // Update form data when prefillData changes
    React.useEffect(() => {
        if (prefillData) {
            setFormData(prev => ({
                ...prev,
                name: prefillData.name || '',
                phone_number: prefillData.phone_number || '',
                email: prefillData.email || '',
                company: prefillData.company || '',
                notes: prefillData.notes || '',
                is_favorite: prefillData.is_favorite || false,
                tags: prefillData.tags || []
            }));
        }
    }, [prefillData]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.phone_number.trim()) {
            toast.error('Name and phone number are required');
            return;
        }

        setIsLoading(true);
        try {
            const response = await createContact(formData);
            if (response.data.success) {
                toast.success('Contact created successfully!');
                onContactCreated(response.data.data);
                handleClose();
            } else {
                toast.error('Failed to create contact');
            }
        } catch (error) {
            console.error('Error creating contact:', error);
            toast.error('Failed to create contact');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            phone_number: '',
            email: '',
            company: '',
            notes: '',
            is_favorite: false,
            tags: []
        });
        setNewTag('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Create New Contact
                    </DialogTitle>
                    <DialogDescription>
                        Add a new contact to your phone book
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Name *
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter contact name"
                            required
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number *
                        </Label>
                        <Input
                            id="phone"
                            value={formData.phone_number}
                            onChange={(e) => handleInputChange('phone_number', e.target.value)}
                            placeholder="+1234567890"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="contact@example.com"
                        />
                    </div>

                    {/* Company */}
                    <div className="space-y-2">
                        <Label htmlFor="company" className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Company
                        </Label>
                        <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => handleInputChange('company', e.target.value)}
                            placeholder="Company name"
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Tags
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="Add a tag"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                            />
                            <Button type="button" onClick={addTag} variant="outline">
                                Add
                            </Button>
                        </div>
                        {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="hover:text-blue-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Additional notes about this contact"
                            rows={3}
                        />
                    </div>

                    {/* Favorite */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="favorite"
                            checked={formData.is_favorite}
                            onCheckedChange={(checked) => handleInputChange('is_favorite', checked)}
                        />
                        <Label htmlFor="favorite" className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Mark as favorite
                        </Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Contact'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateContactModal;
