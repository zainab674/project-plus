'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { joinTeamInvitationRequest } from '@/lib/http/auth';
import { toast } from 'react-toastify';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const JoinTeamPage = () => {
    const params = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState('');
    const [showEmailForm, setShowEmailForm] = useState(true);

    const handleJoinTeam = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setIsLoading(true);
        try {
            const response = await joinTeamInvitationRequest({ 
                token: params.token,
                email: email 
            });
            setIsSuccess(true);
            setShowEmailForm(false);
            toast.success(response.data.message);
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Failed to join team';
            
            // Check if user needs to register
            if (errorMessage.includes('User not found') || errorMessage.includes('Please register first')) {
                // Redirect to team signup page
                router.push(`/team-signup/${params.token}`);
                return;
            }
            
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedirect = () => {
        router.push('/dashboard');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            Joining Team...
                        </h2>
                        <p className="text-gray-500 text-center">
                            Please wait while we process your team invitation.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (showEmailForm && !error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">Join Team Invitation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-600 text-center mb-4">
                            Please enter your email address to join the team.
                        </p>
                        <form onSubmit={handleJoinTeam} className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Joining...' : 'Join Team'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        const isUserNotFound = error.includes('User not found') || error.includes('Please register first');
        
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center p-8">
                        <XCircle className="h-12 w-12 text-red-500 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            {isUserNotFound ? 'Account Required' : 'Invitation Error'}
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            {error}
                        </p>
                        <div className="space-y-3 w-full">
                            {isUserNotFound && (
                                <Button 
                                    onClick={() => router.push(`/sign-up?next_to=${encodeURIComponent(window.location.href)}`)} 
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    Create Account
                                </Button>
                            )}
                            <Button 
                                onClick={() => router.push('/sign-in')} 
                                variant="outline" 
                                className="w-full"
                            >
                                Sign In
                            </Button>
                        </div>
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
                            Welcome to the Team!
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            You have successfully joined the team! To complete your setup, please check your email for an OTP verification code and complete the authentication process.
                        </p>
                        <div className="space-y-3 w-full">
                            <Button 
                                onClick={() => router.push(`/verify?next_to=${encodeURIComponent('/dashboard')}`)} 
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                Verify Email & Continue
                            </Button>
                            <Button 
                                onClick={handleRedirect} 
                                variant="outline" 
                                className="w-full"
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
};

export default JoinTeamPage; 