'use client'
import { ChatSidebar } from '@/components/ChattingComponent'
import TopNavigation from '@/components/TopNavigation'
import Sibebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import ProtectedRouteProvider from '@/providers/ProtectedRouteProvider'
import { MessageCircle } from 'lucide-react'
import React, { useState } from 'react'

const layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false)
    return (
        <ProtectedRouteProvider>
            <div>
                {/* <TopNavigation setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} /> */}
                <div className="">
                    {/* <Sibebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /> */}
                    <div className="">


                        {children}
                    </div>
                </div>
            </div>
        </ProtectedRouteProvider>
    )
}

export default layout