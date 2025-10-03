'use client';
import { loadUserRequest, getUserWithProjectsRequest, updateRoleRequest } from '@/lib/http/auth';
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
    showRoleSelection: false,
    setShowRoleSelection: () => {},
    updateUserRole: () => {},
    resetRoleSelection: () => {},
    forceShowRoleSelection: () => {},
    dismissRoleSelection: () => {}
});


export const UserProvider = ({children}) => {
    const [user,setUser] = useState(null);
    const [isAuth, setIsAuth] = useState(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [userAvatar,setUserAvatar] = useState('EX');
    const [showRoleSelection, setShowRoleSelection] = useState(false);
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

            // Check if user needs role selection
            const userRole = res?.data?.user?.Role;
            
            // Check if user has already selected a role (persisted in localStorage)
            const hasSelectedRole = localStorage.getItem('roleSelected');
            
            // Only show role selection for users who:
            // 1. Have default PROVIDER role
            // 2. Haven't already selected a role (persisted in localStorage)
            // 3. Haven't dismissed the role selection
            const hasDismissedRoleSelection = localStorage.getItem('roleSelectionDismissed');
            
            if (userRole === 'PROVIDER' && !hasSelectedRole && !hasDismissedRoleSelection) {
                setShowRoleSelection(true);
            } else if (userRole !== 'PROVIDER') {
                // If user has already selected a role other than PROVIDER, mark as selected
                localStorage.setItem('roleSelected', 'true');
            }
        } catch (error) {
            setIsAuth(false);
            // Clear invalid token
            localStorage.removeItem('authToken');
            console.log(error?.response?.data?.message || error.message)
        }finally{
            setIsLoading(false);
        }
    },[]);

    const loadUserWithProjects = useCallback(async () => {
        if (hasFullUserData) return user; // Return cached data if already loaded
        
        setIsLoading(true);
        try {
            const res = await getUserWithProjectsRequest();
            const fullUserData = res?.data?.user;
            setUser(fullUserData);
            setHasFullUserData(true);
            return fullUserData;
        } catch (error) {
            console.log(error?.response?.data?.message || error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [hasFullUserData, user]);

    const updateUserRole = useCallback(async (role) => {
        setIsLoading(true);
        try {
            const res = await updateRoleRequest({ role });
            setUser(res?.data?.user);
            setShowRoleSelection(false);
            
            // Persist that user has selected a role
            localStorage.setItem('roleSelected', 'true');
            
            return res?.data?.user;
        } catch (error) {
            console.log(error?.response?.data?.message || error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetRoleSelection = useCallback(() => {
        localStorage.removeItem('roleSelected');
        setShowRoleSelection(false);
    }, []);

    const forceShowRoleSelection = useCallback(() => {
        localStorage.removeItem('roleSelected');
        localStorage.removeItem('roleSelectionDismissed');
        setShowRoleSelection(true);
    }, []);

    const dismissRoleSelection = useCallback(() => {
        localStorage.setItem('roleSelectionDismissed', 'true');
        setShowRoleSelection(false);
    }, []);

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
        showRoleSelection,
        setShowRoleSelection,
        updateUserRole,
        resetRoleSelection,
        forceShowRoleSelection,
        dismissRoleSelection
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
            showRoleSelection: false,
            setShowRoleSelection: () => {},
            updateUserRole: () => {},
            resetRoleSelection: () => {},
            forceShowRoleSelection: () => {},
            dismissRoleSelection: () => {}
        };
    }
    
    return context;
}