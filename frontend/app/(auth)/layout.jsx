'use client'
import { useUser } from '@/providers/UserProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useLayoutEffect } from 'react'

const layout = ({children}) => {
    const {user,isAuth} = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const next_to = searchParams.get('next_to');

    useLayoutEffect(() => {
        if(isAuth == true){
            if(next_to){
                router.push(next_to)
            }else{
                router.push('/dashboard');
            }
        }
    },[user,isAuth]);

    return (children)
}

export default layout