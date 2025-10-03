

"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Bell,
    Settings,
    Plus,
    Calendar,
    Mail,
    MessageCircle,
    Users,
    Clock,
    FileText,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Filter,
    MoreHorizontal,
    Briefcase,
    DollarSign,
    Target,
    CheckCircle,
    AlertCircle,
    Circle,
} from 'lucide-react';
import { Header } from '@/components/Navbar';
import { acquisitionData, caseStatusData, priorityTasks, recentActivities, stats, topCases, user, weeklyTimeData } from '@/contstant';
import { ChartCard, DonutChart, LineChart, ProgressBar, StatsCard } from '@/components/graphCards';
import { TaskList, ActivityFeed, ListCard } from '@/components/dash';
import { QuickActions } from '@/components/quickActions';




// Main Dashboard Component
const Dashboard = () => {

    const handleSearch = (query) => {
        console.log('Search query:', query);
    };

    const handleAddTask = () => {
        console.log('Add task clicked');
    };

    const handleViewAll = () => {
        console.log('View all clicked');
    };



    return (
        <div className="min-h-screen bg-gray-50">
            {/* Simple Header */}
            <Header onSearch={handleSearch} userData={user} />

            {/* Main Content */}
            <div className="px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome, Charles</h1>
                    <p className="text-gray-600 mt-1">Here's what's happening with your cases today</p>
                </div>

                <QuickActions />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <StatsCard key={index} {...stat} />
                    ))}
                </div>



                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <ChartCard title="Case Status Distribution">
                        <DonutChart data={caseStatusData} />
                    </ChartCard>
                    <ChartCard title="Weekly Time Tracking">
                        <LineChart data={weeklyTimeData} />
                    </ChartCard>
                    <ChartCard title="Client Acquisition">
                        <ProgressBar items={acquisitionData} maxValue={156} />
                    </ChartCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <TaskList
                        title="Priority Tasks"
                        tasks={priorityTasks}
                        onAddTask={handleAddTask}
                    />
                    <ActivityFeed
                        title="Recent Activities"
                        activities={recentActivities}
                        onViewAll={handleViewAll}
                    />
                    <ListCard
                        title="Top Cases by Hours"
                        items={topCases}
                        onViewAll={handleViewAll}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;


