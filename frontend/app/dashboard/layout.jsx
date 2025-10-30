'use client'
import ProtectedRouteProvider from '@/providers/ProtectedRouteProvider'
import React from 'react'

const layout = ({ children }) => {
    
    return (
        <ProtectedRouteProvider>
            <div className="flex flex-col min-h-screen">
                {/* TopNavigation is rendered in ClientLayoutWrapper at root level */}
                <div className="flex-1">
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