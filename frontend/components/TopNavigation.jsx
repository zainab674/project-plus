'use client'
import React, { useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Brain, DoorOpen, Menu, User, Shield, PanelLeft, PanelRight, Loader2, LayoutDashboard } from 'lucide-react'
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
import FilterControls from './FilterControls'
import useClickOutside from '@/hooks/useClickOutside'
import useNotificationPolling from '@/hooks/useNotificationPolling'

const TopNavigation = ({ setSidebarOpen, isSidebarMode, setIsSidebarMode }) => {
    const { user, userAvatar, setUser, setIsAuth } = useUser();
    const router = useRouter();

    const {
        notifications,
        unreadCount,
        isOpen: isNotificationOpen,
        toggleDropdown: toggleNotificationDropdown,
        closeDropdown: closeNotificationDropdown,
        isLoading: isNotificationsLoading,
        isInitialLoading,
        loadingTimeoutElapsed,
        error: notificationsError,
        markAllNotificationsRead,
        refresh: refreshNotifications,
    } = useNotificationPolling({ pollInterval: 30000, pageSize: 30, initialDelay: 30000 });

    const notificationDropdownRef = useClickOutside(() => {
        if (isNotificationOpen) {
            closeNotificationDropdown();
        }
    }, [isNotificationOpen, closeNotificationDropdown]);

    const formatTimestamp = useCallback((timestamp) => {
        if (!timestamp) {
            return '';
        }

        try {
            return new Date(timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        } catch (error) {
            return '';
        }
    }, []);

    const resolveNotificationDestination = useCallback((notification) => {
        if (!notification) {
            return null;
        }

        const metadata = notification.metadata || {};

        if (metadata.redirectUrl) {
            return metadata.redirectUrl;
        }

        if (metadata.url) {
            return metadata.url;
        }

        if (metadata.route) {
            return metadata.route;
        }

        const projectId = metadata.projectId || notification.project_id;

        switch (notification.entity_type) {
            case 'TASK':
            case 'COMMENT':
            case 'DOCUMENT':
            case 'TIME_ENTRY':
                if (projectId) {
                    return `/dashboard/project/${projectId}`;
                }
                return '/dashboard';
            case 'EMAIL':
                if (projectId) {
                    return `/dashboard/project/${projectId}`;
                }
                return '/dashboard/mail';
            case 'MEETING':
                if (projectId) {
                    return `/dashboard/project/${projectId}`;
                }
                return '/dashboard/meeting';
            default:
                if (projectId) {
                    return `/dashboard/project/${projectId}`;
                }
                return '/dashboard';
        }
    }, []);

    const handleNotificationClick = useCallback((notification) => {
        const destination = resolveNotificationDestination(notification);

        if (destination) {
            router.push(destination);
        }

        closeNotificationDropdown();
    }, [router, closeNotificationDropdown, resolveNotificationDestination]);


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
        <header className="sticky top-0 z-[40] bg-white shadow">
            <div className="flex h-16 items-center justify-between px-4">
                <div className="flex items-center space-x-6">
                    <h2 className='font-medium text-2xl hidden lg:block text-black'>flexywexy.com</h2>
                    
                    {/* Filter Controls - Only show for non-CLIENT users */}
                    {user?.Role !== 'CLIENT' && (
                        <div className="hidden md:block">
                            <FilterControls />
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    {/* Quick Actions Toggle Button */}
                    {isSidebarMode !== undefined && setIsSidebarMode && (
                        <button
                            onClick={() => setIsSidebarMode(!isSidebarMode)}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-sm font-medium text-gray-700"
                            title={isSidebarMode ? "Switch to horizontal layout" : "Switch to vertical layout"}
                        >
                            {isSidebarMode ? (
                                <>
                                    <PanelRight className="w-4 h-4" />
                                    <span className="hidden sm:inline">Horizontal</span>
                                </>
                            ) : (
                                <>
                                    <PanelLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Vertical</span>
                                </>
                            )}
                        </button>
                    )}
                    
                    <Button variant="ghost" size="icon" className="text-black hover:bg-tbutton-bg hover:text-tbutton-text">
                        <Brain className="h-5 w-5" />
                    </Button>

                    <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-black hover:bg-tbutton-bg hover:text-tbutton-text flex items-center space-x-2"
                        onClick={() => router.push('/dashboard/overview')}
                        title="Overview"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="hidden sm:inline">Overview</span>
                    </Button>

                    <div className="relative" ref={notificationDropdownRef}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative text-black hover:bg-tbutton-bg hover:text-tbutton-text"
                            onClick={toggleNotificationDropdown}
                            aria-label="Notifications"
                        >
                            {isInitialLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Bell className="h-5 w-5" />
                            )}
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex min-h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>

                        {isNotificationOpen && (
                            <div className="absolute right-0 z-50 mt-3 w-[26rem] rounded-xl border border-gray-100 bg-white shadow-xl">
                                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                                        <p className="text-xs text-gray-500">Latest case and task updates</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={refreshNotifications}
                                            className="rounded-lg border border-transparent px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:border-gray-200 hover:bg-gray-50"
                                        >
                                            Refresh
                                        </button>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllNotificationsRead}
                                                className="rounded-lg border border-transparent px-2.5 py-1 text-xs font-semibold text-indigo-600 transition hover:border-indigo-100 hover:bg-indigo-50"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="max-h-[28rem] overflow-y-auto">
                                    {isInitialLoading ? (
                                        <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-gray-500">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading notifications...
                                        </div>
                                    ) : null}

                                    {loadingTimeoutElapsed && (
                                        <div className="px-4 pb-4 text-xs text-yellow-600">
                                            Taking longer than expected. Check your connection or try Refresh.
                                        </div>
                                    )}

                                    {!isNotificationsLoading && notificationsError ? (
                                        <div className="px-4 py-6 text-sm text-red-500">
                                            <p className="mb-2 font-medium">Unable to load notifications.</p>
                                            <button
                                                onClick={refreshNotifications}
                                                className="text-xs font-semibold text-indigo-600 hover:underline"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    ) : null}

                                    {!isNotificationsLoading && !notificationsError && notifications.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-sm text-gray-500">
                                            You're all caught up!
                                        </div>
                                    ) : null}

                                    {notifications.map((notification) => (
                                        <button
                                            key={notification.notification_id}
                                            type="button"
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`w-full text-left border-b border-gray-50 px-4 py-3 transition ${
                                                notification.is_read ? 'bg-white' : 'bg-indigo-50/70'
                                            } hover:bg-indigo-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400`}
                                        >
                                            <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                                            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                                                <span>{formatTimestamp(notification.created_at)}</span>
                                                {notification.entity_type && notification.entity_id ? (
                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                                        {notification.entity_type}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="border-t border-gray-100 px-4 py-2 text-right">
                                    <button
                                        onClick={closeNotificationDropdown}
                                        className="text-xs font-medium text-gray-500 hover:text-gray-700"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
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
            
            {/* Mobile Filter Controls */}
            {user?.Role !== 'CLIENT' && (
                <div className="md:hidden border-t border-gray-200 bg-gray-50 px-4 py-3">
                    <FilterControls />
                </div>
            )}
        </header>
    )
}

export default TopNavigation