"use client"

import React, { useState, useEffect } from 'react';
import { Workflow } from 'lucide-react';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { getAllProjectWithTasksRequest } from '@/lib/http/project';
import Loader from '../Loader';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';

const CaseWorkflowDashboard = () => {
    const router = useTabNavigation();
    const [allCases, setAllCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const { selectedCase } = useDashboardFilter();

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const response = await getAllProjectWithTasksRequest();
            
            if (response && response.data) {
                const { projects, collaboratedProjects } = response.data;
                const allProjects = [...(projects || []), ...(collaboratedProjects || [])];
                setAllCases(allProjects);
            }
        } catch (error) {
            console.error('Error fetching cases:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg shadow-sm border border-indigo-200">
                <div className="flex items-center justify-center h-32">
                    <Loader />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg shadow-sm border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <Workflow className="text-indigo-500 mr-2" size={24} />
                        <h2 className="text-xl font-semibold text-gray-800">Case Workflow</h2>
                    </div>
                </div>
                <div
                    className="bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push('/dashboard/case-workflow')}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">View Case Workflows</span>
                        <Workflow className="text-indigo-500" size={20} />
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>View and manage case workflow progress</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CaseWorkflowDashboard;

