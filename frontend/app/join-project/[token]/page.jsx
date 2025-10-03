'use client'
import { Button } from '@/components/Button'
import { joinProjectInvitationRequest } from '@/lib/http/auth';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useState } from 'react'
import { toast } from 'react-toastify';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, UserPlus } from 'lucide-react';

const page = ({ params }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(true);
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const router = useRouter();
  const { token } = useParams();

  const handleJoin = useCallback(async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await joinProjectInvitationRequest({ 
        token: token,
        email: email 
      });
      
      // For CLIENT invitations, the backend will process them directly
      // No role selection needed since invitation specifies CLIENT role
      setIsSuccess(true);
      setShowEmailForm(false);
      toast.success(res.data.message);
    } catch (error) {
      const errorData = error?.response?.data;
      
      if (errorData?.requiresRegistration) {
        // User needs to register first
        setRequiresRegistration(true);
        setInvitationData(errorData.invitation);
        
        // Store the invitation role and project ID in localStorage for registration
        if (errorData.invitation?.role) {
          localStorage.setItem('invitationRole', errorData.invitation.role);
        }
        if (errorData.invitation?.project_id) {
          localStorage.setItem('invitationProjectId', errorData.invitation.project_id.toString());
        }
        
        setError('You need to create an account to join this project.');
      } else {
        setError(errorData?.message || error?.message);
        toast.error(errorData?.message || error?.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, token]);

  const handleRedirect = () => {
    router.push('/dashboard');
  };

  const handleRegister = () => {
    // Store invitation data in localStorage for registration flow
    if (invitationData) {
      localStorage.setItem('pendingInvitation', JSON.stringify(invitationData));
    }
    
    // For CLIENT invitations, redirect to simplified client signup
    if (invitationData?.role === 'CLIENT') {
      router.push(`/client-signup/${token}?email=${encodeURIComponent(email)}`);
    } else {
      // For team/biller invitations, redirect to team signup
      router.push(`/team-signup/${token}?email=${encodeURIComponent(email)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Joining Project...
            </h2>
            <p className="text-gray-500 text-center">
              Please wait while we process your project invitation.
            </p>
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
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Successfully Joined!
            </h2>
            <p className="text-gray-500 text-center mb-6">
              You have successfully joined the project. Please check your email for verification.
            </p>
            <Button onClick={handleRedirect} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiresRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Create Account to Join Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <UserPlus className="h-12 w-12 text-blue-600" />
            </div>
            <p className="text-gray-600 text-center mb-4">
              You need to create an account to join this project. We'll use your email: <strong>{email}</strong>
            </p>
            <div className="space-y-3">
              <Button onClick={handleRegister} className="w-full">
                Create Account
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setRequiresRegistration(false);
                  setError(null);
                  setInvitationData(null);
                }} 
                className="w-full"
              >
                Try Different Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Join Project Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
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
                  Joining...
                </>
              ) : (
                'Join Project'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default page;