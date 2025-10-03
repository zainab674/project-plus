"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { resetPasswordRequest } from '@/lib/http/auth';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast.error('Invalid reset link');
      router.push('/sign-in');
      return;
    }
    setToken(tokenParam);
  }, [searchParams, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await resetPasswordRequest({ 
        token, 
        newPassword 
      });
      
      if (response.data.success) {
        setIsSuccess(true);
        toast.success('Password reset successfully!');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="w-full flex-1 p-12 flex relative">
          <div className="flex items-center justify-center px-4 mx-auto border border-black bg-white rounded-md h-[45rem]">
            <div className="w-[35rem] space-y-6 rounded-md p-4 text-center">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-black">Password Reset Successful!</h1>
                <p className="text-gray-600">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
              </div>
              
              <Link href="/sign-in">
                <Button className="w-full bg-tbutton-bg text-white hover:bg-tbutton-hover">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-full flex-1 p-12 flex relative">
        <div className="flex items-center justify-center px-4 mx-auto border border-black bg-white rounded-md h-[45rem]">
          <div className="w-[35rem] space-y-6 rounded-md p-4">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold text-black">Reset Your Password</h1>
              <p className="text-black">
                Enter your new password below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-black">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <input
                  id="newPassword"
                  type="password"
                  name="newPassword"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  required
                  minLength={8}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-tbutton-bg text-white disabled:opacity-40 hover:bg-tbutton-hover"
                disabled={!newPassword || !confirmPassword || isLoading}
                isLoading={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>

            <div className="text-center text-sm text-black">
              Remember your password?{" "}
              <Link href="/sign-in" className="text-accent hover:text-accent-hover">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
