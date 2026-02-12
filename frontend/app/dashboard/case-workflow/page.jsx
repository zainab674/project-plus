"use client";

import React, { useState, useEffect } from 'react';
import { Workflow, ArrowLeft } from 'lucide-react';
import CaseWorkflowBox from '@/components/CaseWorkflowBox';
import { getAllProjectWithTasksRequest } from '@/lib/http/project';
import Loader from '@/components/Loader';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { Button } from '@/components/ui/button';

export default function CaseWorkflowPage() {
    const router = useTabNavigation();
    const { selectedCase } = useDashboardFilter();
    const [allCases, setAllCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSelectedCase, setCurrentSelectedCase] = useState(selectedCase);

    useEffect(() => {
        fetchCases();
    }, []);

    useEffect(() => {
        if (selectedCase) {
            setCurrentSelectedCase(selectedCase);
        }
    }, [selectedCase]);

    const fetchCases = async () => {
        try {
            const response = await getAllProjectWithTasksRequest();
            
            if (response && response.data) {
                const { projects, collaboratedProjects } = response.data;
                const allProjects = [...(projects || []), ...(collaboratedProjects || [])];
                
                setAllCases(allProjects);
                
                // Set default to selectedCase from context, or most recent case
                if (selectedCase) {
                    setCurrentSelectedCase(selectedCase);
                } else if (allProjects.length > 0) {
                    const recentCase = allProjects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                    setCurrentSelectedCase(recentCase);
                }
            }
        } catch (error) {
            console.error('Error fetching cases:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCaseSelect = (caseItem) => {
        setCurrentSelectedCase(caseItem);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                                className="mr-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <Workflow className="w-6 h-6 text-indigo-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Case Workflow Dashboard</h1>
                                <p className="text-sm text-gray-600">View and manage case workflows</p>
                            </div>
                        </div>
                        <Button
                            onClick={fetchCases}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-gray-50"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                            ) : (
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                            )}
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader />
                    </div>
                ) : (
                    <CaseWorkflowBox
                        selectedCase={currentSelectedCase}
                        allCases={allCases}
                        onCaseSelect={handleCaseSelect}
                        className="mb-6"
                    />
                )}
            </div>
        </div>
    );
}










