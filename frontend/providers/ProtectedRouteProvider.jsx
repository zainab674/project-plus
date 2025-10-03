'use client'
import { useUser } from '@/providers/UserProvider';
import { useRouter } from 'next/navigation';
import { useLayoutEffect } from 'react'

const ProtectedRouteProvider = ({children}) => {
    const {user,isAuth} = useUser();
    const router = useRouter();

    useLayoutEffect(() => {
        if(isAuth == false){
            router.push('/sign-in');
        }
    },[user,isAuth]);

    return (children)
}

export default ProtectedRouteProvider