"use client"

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, AlertCircle, Search, Filter, Grid, List, Table as TableIcon } from 'lucide-react';
import { getAllProjectRequest } from '@/lib/http/project';
import CreateCaseModal from './createCaseModal';
import Loader from '../Loader';
import { Button } from '../Button';
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useUser } from '@/providers/UserProvider';

const CaseManagementSystem = () => {
    const [projects, setProjects] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showNewCaseForm, setShowNewCaseForm] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // grid, list, or table
    const [searchTerm, setSearchTerm] = useState('');
    const { user, loadUser } = useUser();


    const getProjectAllProject = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [res] = await Promise.all([getAllProjectRequest()]);
            const { projects, collaboratedProjects } = res.data;
            
            // Create a Map to track unique projects by project_id
            const uniqueProjectsMap = new Map();
            
            // Add owned projects first
            projects.forEach(project => {
                uniqueProjectsMap.set(project.project_id, project);
            });
            
            // Add collaborated projects only if they don't already exist
            collaboratedProjects.forEach(project => {
                if (!uniqueProjectsMap.has(project.project_id)) {
                    uniqueProjectsMap.set(project.project_id, project);
                }
            });
            
            // Convert Map values back to array
            const allProjects = Array.from(uniqueProjectsMap.values());

            setProjects(allProjects);
        } catch (error) {
            setProjects(null);
            console.log(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        { console.log("uuuuuu", user) }

        getProjectAllProject();
    }, []);

    const filteredProjects = projects?.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Case Management</h1>
                            <p className="text-gray-600 mt-1">Manage and track all your cases</p>
                        </div>

                        {user?.Role !== 'TEAM' && (

                            <Button
                                onClick={() => setShowNewCaseForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                New Case
                            </Button>
                        )}
                    </div>

                    {/* Search and Filters */}
                    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search cases..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">

                            <div className="flex border border-gray-300 rounded-md">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Grid View"
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="List View"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Table View"
                                >
                                    <TableIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cases Display */}
                {filteredProjects?.length === 0 ? (
                    <div className="bg-blue-200 rounded-lg border border-blue-200 p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <Grid className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                        <p className="text-gray-600 mb-6">Get started by creating your first case</p>
                        <Button
                            onClick={() => setShowNewCaseForm(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Case
                        </Button>
                    </div>
                ) : viewMode === 'table' ? (
                    // Table View
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold">Case Name</TableHead>
                                    <TableHead className="font-semibold">Client</TableHead>
                                    <TableHead className="font-semibold">Priority</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Case ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProjects?.map(project => (
                                    <TableRow key={project.project_id} className="hover:bg-gray-50 cursor-pointer">
                                        <TableCell>
                                            <Link
                                                href={`/dashboard/project/${project.project_id}`}
                                                className="font-medium text-gray-900 hover:text-blue-600"
                                            >
                                                {project.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {project.client_name}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${project.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                    project.priority === 'Medium' ? 'bg-green-100 text-green-800' :
                                                        project.priority === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                {project.priority || 'N/A'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {project.status && (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${project.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                        project.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            project.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                    {project.status}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-sm">
                                            {project.project_id}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    // Grid and List Views
                    <div className={`${viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'space-y-4'}`}>
                        {filteredProjects?.map(project => (
                            <Link
                                href={`/dashboard/project/${project.project_id}`}
                                key={project.project_id}
                                className="block"
                            >
                                <div className={`bg-blue-100 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-gray-300 ${viewMode === 'list' ? 'flex items-center p-4' : 'p-6'
                                    }`}>
                                    {viewMode === 'grid' ? (
                                        <>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-blue-600 truncate">
                                                        {project.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {project.client_name}
                                                        {project.priority}
                                                    </p>
                                                </div>
                                                {project.priority === 'High' && (
                                                    <p className="text-sm text-red-600">
                                                        {project.priority}
                                                    </p>
                                                )}
                                                {project.priority === 'Medium' && (
                                                    <p className="text-sm text-green-600">
                                                        {project.priority}
                                                    </p>)}
                                                {project.priority === 'Low' && (
                                                    <p className="text-sm text-yellow-600">
                                                        {project.priority}
                                                    </p>)}
                                            </div>

                                            {project.status && (
                                                <div className="mb-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                        ${project.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                            project.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                project.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-gray-100 text-gray-800'}`}>
                                                        {project.status}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="text-xs text-gray-500">
                                                Case ID: {project.project_id}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                                                        {project.name}
                                                    </h3>
                                                    {project.priority === 'High' && (
                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                    )}
                                                    {project.status && (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                                            ${project.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                                project.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    project.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                                                        'bg-gray-100 text-gray-800'}`}>
                                                            {project.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{project.client_name}</p>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ID: {project.project_id}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {showNewCaseForm && (
                <CreateCaseModal
                    onClose={async () => {
                        setShowNewCaseForm(false);
                    }}
                />
            )}
        </div>
    );
};

export default CaseManagementSystem;