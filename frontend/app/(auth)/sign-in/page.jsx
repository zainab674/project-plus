'use client'

import { Button } from '@/components/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginRequest } from '@/lib/http/auth'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { toast } from 'react-toastify'

export default function Login() {
  const [formdata, setFormdata] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter();
  const searchParams = useSearchParams();
  const next_to = searchParams.get('next_to');

  const onFormDataChange = useCallback((e) => {
    setFormdata(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await loginRequest(formdata);
      toast.success(res?.data?.message);

      if (typeof window != 'undefined') {
        window.localStorage.setItem('email', formdata.email);
      }
      router.push(`/verify${next_to ? `?next_to=${next_to}` : ''}`);

    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setIsLoading(false)
    }
  }, [formdata]);



  const handleGoogleLogin = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/auth/google`;
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-white ">
      {/* Left Column */}
      <div className="w-full  flex-1 p-12 flex  relative">
        <div className="flex items-center justify-center px-4 mx-auto border border-black bg-white rounded-md h-[45r">
          <div className="w-[35rem] space-y-6  rounded-md p-4">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold text-black">Log in to your account</h1>
              <p className="text-black">Welcome back! Please enter your details.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-black">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formdata.email}
                  onChange={onFormDataChange}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formdata.password}
                  onChange={onFormDataChange}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-600 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-black">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link href="/forgot-password" className="text-accent hover:text-accent-hover">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-tbutton-bg text-white disabled:opacity-40 hover:bg-tbutton-hover"
                disabled={(!formdata.email || !formdata.password) || isLoading}
                isLoading={isLoading}
              >
                Log in
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-black">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-1">
              <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
                <Image src="https://dapulse-res.cloudinary.com/image/upload/remote_logos/995426/google-icon.svg" alt="Google" width={20} height={20} className="mr-2" />
                <span className="text-gray-700">Continue with Google</span>
              </Button>

            </div>

            <div className="text-center text-sm text-black">
              Don't have an account?{" "}
              <Link href={`/sign-up${next_to ? `?next_to=${next_to}` : ''}`} className="text-accent hover:text-accent-hover">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

