'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { clientSignupRequest } from '@/lib/http/auth';
import { toast } from 'react-toastify';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ClientSignupPage = () => {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: searchParams.get('email') || '',
        password: '',
        confirmPassword: ''
    });
    const [invitationData, setInvitationData] = useState(null);

    // Fetch invitation data on component mount
    useEffect(() => {
        const fetchInvitationData = async () => {
            try {
                // You can add an API call here to validate the token and get invitation details
                // For now, we'll just use the token from params
                setInvitationData({ token: params.token });
            } catch (error) {
                setError('Invalid invitation link');
            }
        };

        fetchInvitationData();
    }, [params.token]);

    const handleInputChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return false;
        }
        if (!formData.email.trim()) {
            toast.error('Email is required');
            return false;
        }
        if (!formData.password) {
            toast.error('Password is required');
            return false;
        }
        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await clientSignupRequest({
                token: params.token,
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            setIsSuccess(true);
            toast.success('Account created successfully! You can now login.');
        } catch (error) {
            setError(error?.response?.data?.message || 'Failed to create account');
            toast.error(error?.response?.data?.message || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = () => {
        router.push('/sign-in');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            Creating Account...
                        </h2>
                        <p className="text-gray-500 text-center">
                            Please wait while we create your client account.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error && error.includes('Invalid invitation')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center p-8">
                        <XCircle className="h-12 w-12 text-red-500 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            Invalid Invitation
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            This invitation link is invalid or has expired.
                        </p>
                        <Button onClick={() => router.push('/sign-in')} className="w-full">
                            Go to Sign In
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center p-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            Welcome to the Project!
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            Your client account has been created successfully! You can now login and access the project.
                        </p>
                        <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700">
                            Login Now
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center flex items-center justify-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Client Account Setup
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 text-center mb-6">
                        You've been invited to join a project as a client. Create your account to get started.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email address"
                                required
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Create a password"
                                required
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                        
                        {error && (
                            <div className="flex items-center space-x-2 text-red-600 text-sm">
                                <XCircle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}
                        
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Client Account'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ClientSignupPage;

