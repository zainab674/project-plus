"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { forgotPasswordRequest } from '@/lib/http/auth';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await forgotPasswordRequest({ email });
      
      if (response.data.success) {
        setIsSubmitted(true);
        toast.success('Password reset link sent successfully!');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
                <h1 className="text-2xl font-semibold text-black">Check your email</h1>
                <p className="text-gray-600">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  If you don't see the email, check your spam folder or try again.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => setIsSubmitted(false)}
                  className="w-full bg-tbutton-bg text-white hover:bg-tbutton-hover"
                >
                  Try another email
                </Button>
                <Link href="/sign-in">
                  <Button variant="outline" className="w-full">
                    Back to sign in
                  </Button>
                </Link>
              </div>
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
              <h1 className="text-3xl font-semibold text-black">Forgot your password?</h1>
              <p className="text-black">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-black">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-tbutton-bg text-white disabled:opacity-40 hover:bg-tbutton-hover"
                disabled={!email || isLoading}
                isLoading={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
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
