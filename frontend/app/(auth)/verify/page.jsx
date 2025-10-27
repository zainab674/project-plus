

'use client'

import { Button } from '@/components/Button'
import { Input } from '@/components/ui/input'
import { resendotpRequest, verifyotpRequest } from '@/lib/http/auth'
import { useUser } from '@/providers/UserProvider'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

export default function Page() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const { user, setUser, setIsAuth } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next_to = searchParams.get('next_to');

  // Get email from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = window.localStorage.getItem('email');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setIsResendDisabled(false);
    }
  }, [timeLeft])

  const handleOtpChange = useCallback((index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Move to next input
      if (value !== '' && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        if (nextInput) nextInput.focus()
      }
    }
  }, [otp]);

  const handleBackspace = useCallback((event, index) => {
    if (event.key === 'Backspace') {
      if (index > 0 && otp[index] === '') {
        const nextInput = document.getElementById(`otp-${index - 1}`)
        if (nextInput) nextInput.focus()
      }
    }
  }, [otp]);

  const handlePaste = useCallback((event) => {
    let paste = (event.clipboardData).getData("text");
    if (paste.length == 6 && !isNaN(paste)) {
      setOtp(paste.split(''));
    }
  }, [otp]);

  const handleVerify = useCallback(async () => {
    setIsLoading(true)
    try {
      const formdata = {
        OTP: Number(otp.join(''))
      }
      const res = await verifyotpRequest(formdata);
      toast.success(res?.data.message);
      setUser(res?.data?.user);
      setIsAuth(true);

      // Store the token explicitly
      if (res?.data?.token) {
        localStorage.setItem('authToken', res.data.token);
      } else {
      }

      if (next_to) {
        const decodedUrl = decodeURIComponent(next_to);
        router.push(decodedUrl);
      } else if (res?.data?.user?.Projects.length == 0) {
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }

    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setIsLoading(false)
    }
  }, [otp, next_to, router])

  const handleResendOtp = useCallback(async () => {
    setIsResendDisabled(true);
    try {
      let email;
      if (typeof window != 'undefined') {
        email = window.localStorage.getItem('email');
      }

      if (!email) return toast.success('Please try logging in again.');

      const formdata = {
        email
      }
      const res = await resendotpRequest(formdata);
      toast.success(res?.data?.message);
      setTimeLeft(30);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    }
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, (match, start, middle, end) => {
    return start + '*'.repeat(Math.max(middle.length, 3)) + end;
  }) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl mb-4 shadow-sm">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Check your email</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            We've sent a 6-digit verification code to
            <br />
            <span className="font-medium text-slate-800">{maskedEmail}</span>
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
          <div className="space-y-6">
            {/* OTP Input Section */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700 mb-4">Enter verification code</p>
              </div>

              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleBackspace(e, index)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-xl font-semibold bg-slate-50 border border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 text-slate-800"
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <Button
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={handleVerify}
              disabled={otp.join('').length !== 6 || isLoading}
              isLoading={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>

            {/* Resend Section */}
            <div className="text-center">
              <p className="text-sm text-slate-600">
                Didn't receive the code?
              </p>
              {isResendDisabled ? (
                <div className="mt-2 flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-slate-700">
                    Resend available in {formatTime(timeLeft)}
                  </span>
                </div>
              ) : (
                <Button
                  variant="link"
                  className="mt-2 p-0 h-auto text-blue-500 hover:text-blue-600 font-medium transition-colors duration-200"
                  onClick={handleResendOtp}
                >
                  Send new code
                </Button>
              )}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-center space-y-3">
              <p className="text-xs text-slate-500">
                Having trouble? Check your spam folder or{" "}
                <Link href="/contact-support" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">
                  contact support
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-400 leading-relaxed">
            By verifying your email, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-600 transition-colors">
              Terms of Service
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-slate-600 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}