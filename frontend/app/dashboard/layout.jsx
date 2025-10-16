'use client'
import { ChatSidebar } from '@/components/ChattingComponent'
import TopNavigation from '@/components/TopNavigation'
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
            <div>
                {/* <TopNavigation setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} /> */}
                <div className="">
                    {/* <Sibebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /> */}
                    <div className="">
                        {/* Back Button - positioned at top left */}
                        {showBackButton && (
                            <div className="fixed top-4 left-4 z-50">
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