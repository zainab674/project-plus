'use client'
import React, { useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Brain, DoorOpen, Menu, User, Shield } from 'lucide-react'
import { useUser } from '@/providers/UserProvider'
import { useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutUserRequest } from '@/lib/http/auth'
import { toast } from 'react-toastify'

const TopNavigation = ({ setSidebarOpen }) => {
    const { user, userAvatar, setUser, setIsAuth } = useUser();
    const router = useRouter();


    const handleClick = useCallback(async () => {
        try {
            const res = await logoutUserRequest();
            toast.success(res.data.message);
            setIsAuth(false);
            setUser(null);
            
            // Clear role selection flag when logging out
            localStorage.removeItem('roleSelected');
            // Clear auth token when logging out
            localStorage.removeItem('authToken');
        } catch (error) {
            toast.error(error.response?.data.message || error.message);
        }
    }, []);
    return (
        <header className="bg-white shadow">
            <div className="flex h-16 items-center justify-between px-4">
                <h2 className='font-medium text-2xl hidden lg:block text-black'>flexywexy.com</h2>
                {/* <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden text-black hover:bg-tbutton-bg hover:text-tbutton-text"
                >
                    <Menu className="h-6 w-6" />
                </Button> */}

                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" className="text-black hover:bg-tbutton-bg hover:text-tbutton-text">
                        <Brain className="h-5 w-5" />
                    </Button>
                    
                    {/* Admin Panel Button - Only visible for ADMIN users */}
                    {user?.Role === 'ADMIN' && (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-black hover:bg-tbutton-bg hover:text-tbutton-text flex items-center space-x-2"
                            onClick={() => router.push('/admin')}
                            title="Admin Panel"
                        >
                            <Shield className="h-4 w-4" />
                            <span className="hidden sm:inline">Admin</span>
                        </Button>
                    )}
                    
                    {/* <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button> */}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="cursor-pointer">
                                <AvatarImage src="" alt="User" />
                                <AvatarFallback className="bg-tbutton-bg text-white cursor-pointer">{userAvatar}</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 mr-2 bg-white border border-secondary">
                            {/* User Info Section */}
                            <div className="px-3 py-2 border-b border-gray-200">
                                <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
                                <div className="text-xs text-gray-500 capitalize">{user?.Role?.toLowerCase() || 'User'}</div>
                            </div>
                            
                            <DropdownMenuGroup>
                                <DropdownMenuItem 
                                    className="cursor-pointer text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                                    onClick={() => router.push('/profile')}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-black hover:!bg-tbutton-bg hover:!text-tbutton-text" onClick={handleClick}>
                                    <DoorOpen className="mr-2 h-4 w-4" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>
        </header>
    )
}

export default TopNavigation