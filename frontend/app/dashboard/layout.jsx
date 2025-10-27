'use client'
import { ChatSidebar } from '@/components/ChattingComponent'
import Sibebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import ProtectedRouteProvider from '@/providers/ProtectedRouteProvider'
import { MessageCircle } from 'lucide-react'
import React, { useState } from 'react'
import BackButton from '@/components/BackButton'
import { usePathname } from 'next/navigation'

const layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false)
    const pathname = usePathname()
    
    // Don't show back button on the main dashboard page
    const showBackButton = pathname !== '/dashboard'
    
    return (
        <ProtectedRouteProvider>
            <div className="flex flex-col min-h-screen">
                {/* TopNavigation is rendered in ClientLayoutWrapper at root level */}
                <div className="flex-1">
                    {/* <Sibebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /> */}
                    <div className="">
                        {/* Back Button - positioned at top left with proper spacing for sidebar */}
                        {showBackButton && (
                            <div className="fixed top-16 left-4 z-50 p-4">
                                <BackButton />
                            </div>
                        )}

                        {children}
                    </div>
                </div>
            </div>
        </ProtectedRouteProvider>
    )
}

export default layout