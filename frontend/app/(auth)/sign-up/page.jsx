'use client'
import { Button } from '@/components/Button'
import Step0 from '@/components/sign-up/Step0'
import Step1 from '@/components/sign-up/Step1'
import Step2 from '@/components/sign-up/Step2'
import Step3 from '@/components/sign-up/Step3'
import Step4 from '@/components/sign-up/Step4'
import Step5 from '@/components/sign-up/Step5'
import { registerRequest } from '@/lib/http/auth'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

const Steps = {
    0: Step0,
    1: Step1,
    2: Step2,
    3: Step3,
    4: Step4,
    5: Step5
}

const StepsImages = {
    0: "/assets/step-0.avif",
    1: "/assets/step-1.avif",
    2: "/assets/step-2.avif",
    3: "/assets/step-3.avif",
    4: "/assets/step-4.avif",
    5: "/assets/step-5.avif"
}

export default function Page() {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedStep, setSelectedStep] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [isContinueButtonDisable, setIsContinueButtonDisable] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const next_to = searchParams.get('next_to');
    const emailParam = searchParams.get('email');

    const [formdata, setFormdata] = useState({
        email: emailParam || '',
        name: '',
        password: '',
        account_name: 'test',
        bring: 'test',
        teams_member_count: '10',
        focus: ["focus"],
        hear_about_as: 'A',
        company_name: '',
        reason: '',
        team_size: ''
    });

    const Step = useMemo(() => Steps[selectedStep], [selectedStep]);

    // Check for pending invitation on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pendingInvitation = localStorage.getItem('pendingInvitation');
            if (pendingInvitation) {
                console.log('Found pending invitation:', pendingInvitation);
                // The invitation will be processed automatically during registration
            }
        }
    }, []);

    const handleSubmit = useCallback(async () => {
        console.log('🚀 Starting registration process...');
        console.log('📝 Form data:', formdata);
        
        setIsLoading(true);
        try {
            // Validate required fields for admin approval
            if (!formdata.company_name || !formdata.reason || !formdata.team_size) {
                console.log('❌ Validation failed: Missing required fields');
                toast.error('Please fill in all required fields: Company Name, Reason for Access, and Team Size');
                setIsLoading(false);
                return;
            }

            if (formdata.reason.length < 10) {
                console.log('❌ Validation failed: Reason too short');
                toast.error('Reason for access must be at least 10 characters long');
                setIsLoading(false);
                return;
            }

            // Get invitation role and project ID from localStorage if available
            const invitationRole = localStorage.getItem('invitationRole');
            const invitationProjectId = localStorage.getItem('invitationProjectId');
            console.log('🎯 Invitation data:', { invitationRole, invitationProjectId });
            
            // Add role and project ID to formdata if they exist
            const registrationData = {
                ...formdata,
                ...(invitationRole && { role: invitationRole }),
                ...(invitationProjectId && { project_id: invitationProjectId })
            };
            
            console.log('📤 Sending registration request with data:', registrationData);
            console.log('🔗 API URL:', process.env.NEXT_PUBLIC_API_URL);
            
            const res = await registerRequest(registrationData);
            console.log('✅ Registration successful:', res);
            toast.success(res?.data?.message);
            
            if (typeof window != 'undefined') {
                window.localStorage.setItem('email', formdata.email);
                // Clear pending invitation and invitation data after successful registration
                localStorage.removeItem('pendingInvitation');
                localStorage.removeItem('invitationRole');
                localStorage.removeItem('invitationProjectId');
            }

            // Show success message and redirect to login
            toast.success('Registration request submitted successfully! Please wait for admin approval.');
            router.push('/sign-in');
        } catch (error) {
            console.error('❌ Registration error:', error);
            console.error('❌ Error response:', error?.response);
            console.error('❌ Error message:', error?.message);
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [formdata, next_to, router]);

    const handleNextStep = useCallback(() => {
        handleSubmit();
    }, [selectedStep, formdata, handleSubmit])

    const onFormDataChange = useCallback((e) => {
        setFormdata(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, [formdata]);

    //continue button check - updated to include new required fields
    useEffect(() => {
        if (selectedStep == 0 && (
            !formdata.name || 
            !formdata.password || 
            !formdata.email || 
            !formdata.company_name || 
            !formdata.reason || 
            !formdata.team_size ||
            formdata.reason.length < 10
        )) {
            setIsContinueButtonDisable(true);
            return
        }
        setIsContinueButtonDisable(false);

    }, [selectedStep, JSON.stringify(formdata)]);

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Column */}
            <div className="w-full flex-1 p-16 flex  relative">
                <Step 
                    selectedCategory={selectedCategory} 
                    setSelectedCategory={setSelectedCategory} 
                    selectedOptions={selectedOptions} 
                    setSelectedOptions={setSelectedOptions} 
                    formdata={formdata} 
                    setFormdata={setFormdata} 
                    onFormDataChange={onFormDataChange} 
                    handleNextStep={handleNextStep} 
                    isContinueButtonDisable={isContinueButtonDisable} 
                    isLoading={isLoading}
                />
            </div>
        </div>
    )
}