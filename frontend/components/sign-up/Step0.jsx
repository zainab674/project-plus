import Image from 'next/image'
import { useSearchParams } from 'next/navigation';
import React, { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Building, MessageSquare, Users, Loader2 } from 'lucide-react'

const Step0 = ({ formdata, onFormDataChange, handleNextStep, isContinueButtonDisable, isLoading }) => {
    const searchParams = useSearchParams();
    const next_to = searchParams.get('next_to');

    const handleGoogleLogin = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/auth/google`;
        }
    }, []);

    const handleSubmit = useCallback(async () => {
        console.log('🎯 Step0 handleSubmit called');
        try {
            // Call the parent's handleNextStep which will make the API call
            console.log('📞 Calling parent handleNextStep...');
            handleNextStep();
        } catch (error) {
            console.error('❌ Error in Step0 handleSubmit:', error);
        }
    }, [handleNextStep]);

    return (
        <>
            <div className="flex items-center justify-center px-4 mx-auto border border-black bg-white rounded-md ">
                <div className="w-[35rem] space-y-6  rounded-md p-4">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-semibold text-black">Welcome to flexywexy.com</h1>
                        <p className="text-black">Get started - it's free. No credit card needed.</p>
                    </div>

                    <div className="space-y-4">
                        <div className='space-y-4 text-black'>
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name='name'
                                    className="w-full h-12 px-3 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Enter your full name"
                                    value={formdata.name}
                                    onChange={onFormDataChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={formdata.email}
                                    onChange={onFormDataChange}
                                    className="w-full h-12 px-3 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <input
                                    type="password"
                                    id="password"
                                    name='password'
                                    className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Enter at least 8 characters"
                                    value={formdata.password}
                                    onChange={onFormDataChange}
                                    disabled={isLoading}
                                />
                            </div>
                            
                            {/* New fields for admin approval */}
                            <div className="space-y-2">
                                <Label htmlFor="company_name" className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    Company Name
                                </Label>
                                <input
                                    type="text"
                                    id="company_name"
                                    name='company_name'
                                    className="w-full h-12 px-3 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Enter your company name"
                                    value={formdata.company_name || ''}
                                    onChange={onFormDataChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="reason" className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Reason for Access
                                </Label>
                                <textarea
                                    id="reason"
                                    name='reason'
                                    className="w-full h-24 px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    placeholder="Please explain why you need access to this platform (minimum 10 characters)"
                                    value={formdata.reason || ''}
                                    onChange={onFormDataChange}
                                    required
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500">
                                    Minimum 10 characters required
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="team_size" className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Team Size
                                </Label>
                                <select
                                    id="team_size"
                                    name='team_size'
                                    className="w-full h-12 px-3 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={formdata.team_size || ''}
                                    onChange={onFormDataChange}
                                    required
                                    disabled={isLoading}
                                >
                                    <option value="">Select team size</option>
                                    <option value="1-5">1-5 people</option>
                                    <option value="6-10">6-10 people</option>
                                    <option value="11-25">11-25 people</option>
                                    <option value="26-50">26-50 people</option>
                                    <option value="51-100">51-100 people</option>
                                    <option value="100+">100+ people</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            className="w-full h-12 bg-tbutton-bg text-white rounded-md hover:bg-tbutton-hover transition-colors disabled:opacity-40 flex items-center justify-center" 
                            onClick={handleSubmit} 
                            disabled={isContinueButtonDisable || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Registration Request'
                            )}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-900">Or</span>
                            </div>
                        </div>

                        <button
                            className="w-full flex items-center justify-center space-x-2 h-12 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors bg-white disabled:opacity-50"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <Image
                                src="https://dapulse-res.cloudinary.com/image/upload/remote_logos/995426/google-icon.svg"
                                alt="Google logo"
                                width={20}
                                height={20}
                            />
                            <span className="text-gray-700">Continue with Google</span>
                        </button>
                    </div>
                </div>
            </div>


        </>
    )
}

export default Step0