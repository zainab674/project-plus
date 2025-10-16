'use client'

import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    User, 
    Mail, 
    Building, 
    Calendar, 
    Shield, 
    Edit3, 
    Save, 
    X,
    Eye,
    EyeOff
} from 'lucide-react';
import { toast } from 'react-toastify';
import { UserContext } from '@/providers/UserProvider';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';

const ProfilePage = () => {
    const { user, setUser } = useContext(UserContext);
    const router = useRouter();
    
    // Check if user is authenticated
    useEffect(() => {
        if (!user) {
            toast.error('Please sign in to access your profile');
            router.push('/sign-in');
            return;
        }
    }, [user, router]);

    // Show loading while checking authentication
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    // Profile form state
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        account_name: user.account_name || '',
        bring: user.bring || '',
        teams_member_count: user.teams_member_count || '',
        hear_about_as: user.hear_about_as || '',
        focus: user.focus || []
    });
    const [newFocus, setNewFocus] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle focus array changes
    const handleFocusChange = (action, value = null, index = null) => {
        if (action === 'add' && value && !formData.focus.includes(value)) {
            setFormData(prev => ({
                ...prev,
                focus: [...prev.focus, value]
            }));
            setNewFocus('');
        } else if (action === 'remove' && index !== null) {
            setFormData(prev => ({
                ...prev,
                focus: prev.focus.filter((_, i) => i !== index)
            }));
        }
    };

    // Save profile changes
    const handleSaveProfile = async () => {
        try {
            // Here you would typically make an API call to update the profile
            // For now, we'll just update the local state
            setUser(prev => ({
                ...prev,
                ...formData
            }));
            
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error('Failed to update profile. Please try again.');
        }
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setFormData({
            name: user.name || '',
            email: user.email || '',
            account_name: user.account_name || '',
            bring: user.bring || '',
            teams_member_count: user.teams_member_count || '',
            hear_about_as: user.hear_about_as || '',
            focus: user.focus || []
        });
        setIsEditing(false);
    };

    // Change password
    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        try {
            // Here you would typically make an API call to change the password
            toast.success('Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setShowPasswordForm(false);
        } catch (error) {
            toast.error('Failed to change password. Please try again.');
        }
    };

    const getRoleBadge = (role) => {
        const roleColors = {
            'ADMIN': 'bg-red-100 text-red-800',
            'PROVIDER': 'bg-blue-100 text-blue-800',
            'CLIENT': 'bg-green-100 text-green-800',
            'BILLER': 'bg-purple-100 text-purple-800',
            'TEAM': 'bg-orange-100 text-orange-800'
        };

        return (
            <Badge className={`${roleColors[role] || 'bg-gray-100 text-gray-800'} px-3 py-1 rounded-full text-sm font-medium`}>
                {role}
            </Badge>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
                            <p className="text-gray-600">Manage your account information and settings</p>
                        </div>
                        <BackButton />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Overview Card */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <User className="h-5 w-5" />
                                    <span>Profile Overview</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Avatar */}
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-white font-semibold text-2xl">
                                            {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>

                                {/* Role Badge */}
                                <div className="text-center">
                                    {getRoleBadge(user.Role)}
                                </div>

                                {/* Account Info */}
                                <div className="space-y-3 pt-4 border-t">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Member Since</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {user.account_name && (
                                        <div className="flex items-center space-x-3">
                                            <Building className="h-4 w-4 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Account</p>
                                                <p className="text-sm text-gray-500">{user.account_name}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Profile Details Card */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center space-x-2">
                                        <Edit3 className="h-5 w-5" />
                                        <span>Profile Details</span>
                                    </CardTitle>
                                    {!isEditing ? (
                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            Edit Profile
                                        </Button>
                                    ) : (
                                        <div className="flex space-x-2">
                                            <Button
                                                onClick={handleSaveProfile}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Save className="h-4 w-4 mr-2" />
                                                Save
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleCancelEdit}
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        {isEditing ? (
                                            <Input
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                placeholder="Enter your full name"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                {user.name || 'Not provided'}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                            {user.email}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Account Name
                                        </label>
                                        {isEditing ? (
                                            <Input
                                                value={formData.account_name}
                                                onChange={(e) => handleInputChange('account_name', e.target.value)}
                                                placeholder="Enter account name"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                {user.account_name || 'Not provided'}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            What do you bring?
                                        </label>
                                        {isEditing ? (
                                            <Input
                                                value={formData.bring}
                                                onChange={(e) => handleInputChange('bring', e.target.value)}
                                                placeholder="What do you bring to the table?"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                {user.bring || 'Not provided'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Focus Areas */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Focus Areas
                                    </label>
                                    {isEditing ? (
                                        <div className="space-y-3">
                                            <div className="flex space-x-2">
                                                <Input
                                                    value={newFocus}
                                                    onChange={(e) => setNewFocus(e.target.value)}
                                                    placeholder="Add a focus area"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleFocusChange('add', newFocus);
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => handleFocusChange('add', newFocus)}
                                                    disabled={!newFocus.trim()}
                                                    size="sm"
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.focus.map((focus, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="secondary"
                                                        className="flex items-center space-x-1"
                                                    >
                                                        <span>{focus}</span>
                                                        <button
                                                            onClick={() => handleFocusChange('remove', null, index)}
                                                            className="ml-1 hover:text-red-600"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {user.focus && user.focus.length > 0 ? (
                                                user.focus.map((focus, index) => (
                                                    <Badge key={index} variant="secondary">
                                                        {focus}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500">No focus areas defined</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Additional Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Team Size
                                        </label>
                                        {isEditing ? (
                                            <Input
                                                value={formData.teams_member_count}
                                                onChange={(e) => handleInputChange('teams_member_count', e.target.value)}
                                                placeholder="Enter team size"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                {user.teams_member_count || 'Not provided'}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            How did you hear about us?
                                        </label>
                                        {isEditing ? (
                                            <Input
                                                value={formData.hear_about_as}
                                                onChange={(e) => handleInputChange('hear_about_as', e.target.value)}
                                                placeholder="How did you hear about us?"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                {user.hear_about_as || 'Not provided'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Change Password Card */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Shield className="h-5 w-5" />
                                    <span>Security</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!showPasswordForm ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowPasswordForm(true)}
                                        className="w-full"
                                    >
                                        <Shield className="h-4 w-4 mr-2" />
                                        Change Password
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Current Password
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData(prev => ({
                                                        ...prev,
                                                        currentPassword: e.target.value
                                                    }))}
                                                    placeholder="Enter current password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                New Password
                                            </label>
                                            <Input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData(prev => ({
                                                    ...prev,
                                                    newPassword: e.target.value
                                                }))}
                                                placeholder="Enter new password"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirm New Password
                                            </label>
                                            <Input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData(prev => ({
                                                    ...prev,
                                                    confirmPassword: e.target.value
                                                }))}
                                                placeholder="Confirm new password"
                                            />
                                        </div>

                                        <div className="flex space-x-2">
                                            <Button
                                                onClick={handleChangePassword}
                                                className="bg-green-600 hover:bg-green-700 flex-1"
                                            >
                                                <Save className="h-4 w-4 mr-2" />
                                                Change Password
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setShowPasswordForm(false);
                                                    setPasswordData({
                                                        currentPassword: '',
                                                        newPassword: '',
                                                        confirmPassword: ''
                                                    });
                                                }}
                                                className="flex-1"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;












