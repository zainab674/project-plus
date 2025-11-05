'use client';
import { loadUserRequest, getUserWithProjectsRequest } from '@/lib/http/auth';
import {createContext, useCallback, useContext, useLayoutEffect, useState} from 'react';

export const UserContext = createContext({
    user: null,
    setUser: () => {},
    isAuth: undefined,
    setIsAuth: () => {},
    isLoading: false,
    setIsLoading: () => {},
    userAvatar: 'EX',
    loadUser: () => {},
    loadUserWithProjects: () => {},
    hasFullUserData: false,
});


export const UserProvider = ({children}) => {
    const [user,setUser] = useState(null);
    const [isAuth, setIsAuth] = useState(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [userAvatar,setUserAvatar] = useState('EX');
    const [hasFullUserData, setHasFullUserData] = useState(false);
  

    const loadUser = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await loadUserRequest();
            setIsAuth(true);
            setUser(res?.data?.user);
            const name = res?.data?.user?.name;

            if(name){
                const [firstname,lastname] = name.split(' ');
                setUserAvatar(`${firstname?.slice(0,1)?.toUpperCase() || ''}${lastname?.slice(0,1)?.toUpperCase() || ''}`)
            }

        } catch (error) {
            setIsAuth(false);
            // Clear invalid token
            localStorage.removeItem('authToken');
        }finally{
            setIsLoading(false);
        }
    },[]);

    const loadUserWithProjects = useCallback(async () => {
        // Check if we have full data AND projects exist (not empty)
        const hasProjects = user?.Projects && Array.isArray(user.Projects) && user.Projects.length > 0;
        
        if (hasFullUserData && hasProjects) {
            return user; // Return cached data if already loaded and has projects
        }
        
        setIsLoading(true);
        try {
            const res = await getUserWithProjectsRequest();
            const fullUserData = res?.data?.user;
            setUser(fullUserData);
            setHasFullUserData(true);
            return fullUserData;
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [hasFullUserData, user]);


    useLayoutEffect(() => {
        loadUser();
    },[])

    return <UserContext.Provider value={{
        user,
        setUser,
        isAuth,
        setIsAuth,
        isLoading,
        setIsLoading,
        userAvatar,
        loadUser,
        loadUserWithProjects,
        hasFullUserData,
    }}>
        {children}
    </UserContext.Provider>
}

export const useUser = () => {
    const context = useContext(UserContext);
    
    // Ensure we always return a valid context object
    if (!context) {
        console.warn('useUser must be used within a UserProvider');
        return {
            user: null,
            setUser: () => {},
            isAuth: undefined,
            setIsAuth: () => {},
            isLoading: false,
            setIsLoading: () => {},
            userAvatar: 'EX',
            loadUser: () => {},
            loadUserWithProjects: () => {},
            hasFullUserData: false,
        };
    }
    
    return context;
}