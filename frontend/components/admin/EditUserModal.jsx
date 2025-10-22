'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Building, Users, Target, MessageSquare, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateAdminUserInfo } from '@/lib/http/auth';

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        account_name: '',
        focus: [],
        bring: '',
        teams_member_count: '',
        hear_about_as: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [newFocusItem, setNewFocusItem] = useState('');

    // Focus areas options
    const focusOptions = [
        'Real Estate Law',
        'Personal Injury',
        'Business Law',
        'Criminal Law',
        'Family Law',
        'Employment Law',
        'Immigration Law',
        'Estate Planning',
        'Tax Law',
        'Intellectual Property',
        'Contract Law',
        'Litigation',
        'Corporate Law',
        'Healthcare Law',
        'Environmental Law'
    ];

    // Hear about us options
    const hearAboutOptions = [
        'Google Search',
        'Social Media',
        'Referral',
        'Advertisement',
        'Legal Directory',
        'Website',
        'Conference',
        'Other'
    ];

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                account_name: user.account_name || '',
                focus: user.focus || [],
                bring: user.bring || '',
                teams_member_count: user.teams_member_count || '',
                hear_about_as: user.hear_about_as || ''
            });
            setErrors({});
        }
    }, [user, isOpen]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleAddFocus = () => {
        if (newFocusItem.trim() && !formData.focus.includes(newFocusItem.trim())) {
            setFormData(prev => ({
                ...prev,
                focus: [...prev.focus, newFocusItem.trim()]
            }));
            setNewFocusItem('');
        }
    };

    const handleRemoveFocus = (itemToRemove) => {
        setFormData(prev => ({
            ...prev,
            focus: prev.focus.filter(item => item !== itemToRemove)
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        if (formData.teams_member_count && (isNaN(formData.teams_member_count) || parseInt(formData.teams_member_count) < 0)) {
            newErrors.teams_member_count = 'Please enter a valid number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const updateData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim() || null,
                address: formData.address.trim() || null,
                account_name: formData.account_name.trim() || null,
                focus: formData.focus,
                bring: formData.bring.trim() || null,
                teams_member_count: formData.teams_member_count ? parseInt(formData.teams_member_count) : null,
                hear_about_as: formData.hear_about_as || null
            };

            const response = await updateAdminUserInfo(user.user_id, updateData);

            if (response.data.success) {
                toast.success('User information updated successfully');
                onUserUpdated(response.data.data.user);
                onClose();
            } else {
                toast.error(response.data.message || 'Failed to update user information');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error(error.response?.data?.message || 'Failed to update user information');
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'ADMIN':
                return <Badge variant="outline" className="bg-red-50 text-red-700">Admin</Badge>;
            case 'PROVIDER':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700">Provider</Badge>;
            case 'CLIENT':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700">Client</Badge>;
            case 'BILLER':
                return <Badge variant="outline" className="bg-orange-50 text-orange-700">Biller</Badge>;
            case 'TEAM':
                return <Badge variant="outline" className="bg-green-50 text-green-700">Team Member</Badge>;
            default:
                return <Badge variant="outline" className="bg-gray-50 text-gray-700">{role || 'No Role'}</Badge>;
        }
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Edit User Information
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* User Info Header */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                                {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{user.name || 'Unknown User'}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {getRoleBadge(user.Role)}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Basic Information
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Name *</label>
                                    <Input
                                        placeholder="Enter full name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Email *</label>
                                    <Input
                                        type="email"
                                        placeholder="Enter email address"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Phone</label>
                                    <Input
                                        placeholder="Enter phone number"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Account Name</label>
                                    <Input
                                        placeholder="Enter account name"
                                        value={formData.account_name}
                                        onChange={(e) => handleInputChange('account_name', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Address</label>
                                <Textarea
                                    placeholder="Enter address"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className="mt-1"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Focus Areas */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Focus Areas
                            </h4>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-700">Current Focus Areas</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.focus.map((item, index) => (
                                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                                            {item}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFocus(item)}
                                                className="ml-1 hover:text-red-500"
                                            >
                                                ×
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Select value={newFocusItem} onValueChange={setNewFocusItem}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select focus area" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {focusOptions.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    onClick={handleAddFocus}
                                    disabled={!newFocusItem.trim() || formData.focus.includes(newFocusItem.trim())}
                                    variant="outline"
                                >
                                    Add
                                </Button>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Additional Information
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Team Size</label>
                                    <Input
                                        type="number"
                                        placeholder="Enter team size"
                                        value={formData.teams_member_count}
                                        onChange={(e) => handleInputChange('teams_member_count', e.target.value)}
                                        className={`mt-1 ${errors.teams_member_count ? 'border-red-500' : ''}`}
                                        min="0"
                                    />
                                    {errors.teams_member_count && <p className="text-red-500 text-xs mt-1">{errors.teams_member_count}</p>}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">How did you hear about us?</label>
                                    <Select value={formData.hear_about_as} onValueChange={(value) => handleInputChange('hear_about_as', value)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {hearAboutOptions.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">What do you bring to the table?</label>
                                <Textarea
                                    placeholder="Describe what you bring to the table"
                                    value={formData.bring}
                                    onChange={(e) => handleInputChange('bring', e.target.value)}
                                    className="mt-1"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    'Update User'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditUserModal;
