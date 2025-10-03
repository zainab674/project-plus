'use client'

import React from 'react';
import Link from 'next/link';
import { useUser } from '@/providers/UserProvider';
import { Shield, Users, Briefcase, CheckSquare, UserPlus, Settings, BarChart3 } from 'lucide-react';

const AdminNav = () => {
    const { user } = useUser();

    // Only show admin nav for admin users
    if (!user || user.Role !== 'ADMIN') {
        return null;
    }

    const adminLinks = [
        {
            name: 'Dashboard',
            href: '/admin',
            icon: BarChart3,
            description: 'System overview and statistics'
        },
        {
            name: 'User Management',
            href: '/admin?tab=users',
            icon: Users,
            description: 'Manage all system users'
        },
        {
            name: 'Projects & Cases',
            href: '/admin?tab=projects',
            icon: Briefcase,
            description: 'View all projects and cases'
        },
        {
            name: 'Task Management',
            href: '/admin?tab=tasks',
            icon: CheckSquare,
            description: 'Monitor task progress'
        },
        {
            name: 'Registration Requests',
            href: '/admin?tab=requests',
            icon: UserPlus,
            description: 'Approve new user registrations'
        }
    ];

    return (
        <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <div className="flex items-center space-x-2">
                            <Shield className="h-6 w-6 text-blue-600" />
                            <span className="text-lg font-semibold text-gray-900">Admin Panel</span>
                        </div>
                        
                        <nav className="flex space-x-6">
                            {adminLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                    <link.icon className="h-4 w-4" />
                                    <span>{link.name}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                            Logged in as: <span className="font-medium text-gray-700">{user.name}</span>
                        </span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNav;

