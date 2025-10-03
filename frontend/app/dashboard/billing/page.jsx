"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    AlertCircle, DollarSign, PieChart, Clock, CheckCircle, XCircle, User,
    FileText, Calendar, TrendingUp, TrendingDown, Plus, Settings,
    Users, Calculator, Receipt, BarChart3, Filter, Download, Eye, Briefcase, RefreshCw, ChevronRight, X
} from 'lucide-react';

import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { getMyAssignedCasesRequest, getBillerAssignedCasesRequest, getClientBillingActivitiesRequest } from '@/lib/http/billing';
import { getAllProjectRequest } from '@/lib/http/project';
import { useUser } from '@/providers/UserProvider';
import { toast } from 'react-toastify';
import Loader from '@/components/Loader';
import moment from 'moment';
import CaseDetailsModal from '@/components/modals/CaseDetailsModal';
import BillingConfigModal from '@/components/modals/BillingConfigModal';
import MemberRateModal from '@/components/modals/MemberRateModal';
import BillingEntriesModal from '@/components/modals/BillingEntriesModal';
import { ExpensesModal } from '@/components/modals/ExpensesModal';
import { ProviderCasesModal } from '@/components/modals/ProviderCasesModal';

const BillingPage = () => {
    const { user } = useUser();
    const [assignedCases, setAssignedCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCaseId, setSelectedCaseId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
    const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
    const [selectedProviderCases, setSelectedProviderCases] = useState([]);
    const [selectedProviderName, setSelectedProviderName] = useState('');
    const [billingActivities, setBillingActivities] = useState([]);
    const [isBillingActivitiesModalOpen, setIsBillingActivitiesModalOpen] = useState(false);
    const [selectedProjectForBilling, setSelectedProjectForBilling] = useState(null);

    // Determine if user is a biller, provider, or client
    const isBiller = user?.Role === 'BILLER';
    const isProvider = user?.Role === 'PROVIDER';
    const isClient = user?.Role === 'CLIENT';

    const getMyAssignedCases = useCallback(async () => {
        setLoading(true);
        try {
            let response;
            if (isBiller) {
                // For billers, get their assigned cases
                response = await getMyAssignedCasesRequest();
                setAssignedCases(response.data.assignedCases);
            } else if (isProvider) {
                // For providers, get all cases (both assigned and unassigned)
                const [assignedResponse, allProjectsResponse] = await Promise.all([
                    getBillerAssignedCasesRequest(),
                    getAllProjectRequest()
                ]);

                const assignedCases = assignedResponse.data.assignedCases || [];
                const allProjects = allProjectsResponse.data.projects || [];

                // Create a map of assigned project IDs
                const assignedProjectIds = new Set(assignedCases.map(assignment => assignment.project_id));

                // Find unassigned projects
                const unassignedProjects = allProjects.filter(project => !assignedProjectIds.has(project.project_id));

                // Create assignment-like objects for unassigned projects
                const unassignedAssignments = unassignedProjects.map(project => ({
                    project_id: project.project_id,
                    project: project,
                    assigned_at: null,
                    assignedBy: null,
                    biller: null,
                    isUnassigned: true
                }));

                // Combine assigned and unassigned cases
                const allCases = [...assignedCases, ...unassignedAssignments];
                setAssignedCases(allCases);
            } else if (isClient) {
                // For clients, get their projects and billing information
                const allProjectsResponse = await getAllProjectRequest();
                const projects = allProjectsResponse.data.projects || [];
                const collaboratedProjects = allProjectsResponse.data.collaboratedProjects || [];
                const clientProjects = allProjectsResponse.data.clientProjects || [];

                // Combine all project types and remove duplicates based on project_id
                const allProjects = [...projects, ...collaboratedProjects, ...clientProjects];
                const uniqueProjects = allProjects.filter((project, index, self) => 
                    index === self.findIndex(p => p.project_id === project.project_id)
                );

                // Create assignment-like objects for client projects
                const clientAssignments = uniqueProjects.map(project => ({
                    project_id: project.project_id,
                    project: project,
                    assigned_at: project.created_at,
                    assignedBy: project.createdBy,
                    biller: project.biller,
                    isClientProject: true
                }));

                setAssignedCases(clientAssignments);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to fetch cases');
        } finally {
            setLoading(false);
        }
    }, [isBiller, isProvider, isClient, user?.user_id]);

    // Function to fetch billing activities for a specific project
    const getBillingActivities = useCallback(async (projectId) => {
        try {
            const response = await getClientBillingActivitiesRequest(projectId);
            setBillingActivities(response.data.billingActivities || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to fetch billing activities');
        }
    }, []);

    useEffect(() => {
        if (user) {
            getMyAssignedCases();
        }
    }, [user]);

    const handleCaseClick = (projectId) => {
        setSelectedCaseId(projectId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCaseId(null);
    };

    const handleExpensesClick = () => {
        setIsExpensesModalOpen(true);
    };

    const closeExpensesModal = () => {
        setIsExpensesModalOpen(false);
    };

    const handleProviderClick = (providerCases, providerName) => {
        setSelectedProviderCases(providerCases);
        setSelectedProviderName(providerName);
        setIsProviderModalOpen(true);
    };

    const closeProviderModal = () => {
        setIsProviderModalOpen(false);
        setSelectedProviderCases([]);
        setSelectedProviderName('');
    };

    const handleBillingActivitiesClick = (project) => {
        setSelectedProjectForBilling(project);
        getBillingActivities(project.project_id);
        setIsBillingActivitiesModalOpen(true);
    };

    const closeBillingActivitiesModal = () => {
        setIsBillingActivitiesModalOpen(false);
        setSelectedProjectForBilling(null);
        setBillingActivities([]);
    };

    const getStatusColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800';

        switch (status) {
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'ON_HOLD':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'HIGH':
                return 'bg-red-100 text-red-800';
            case 'MEDIUM':
                return 'bg-yellow-100 text-yellow-800';
            case 'LOW':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Group cases by provider (for provider view)
    const groupCasesByProvider = (cases) => {
        const grouped = {};

        // Separate assigned and unassigned cases
        const assignedCases = cases.filter(assignment => !assignment.isUnassigned);
        const unassignedCases = cases.filter(assignment => assignment.isUnassigned);

        // Group assigned cases by biller
        assignedCases.forEach(assignment => {
            const billerName = assignment.biller?.name || assignment.assignedBy?.name || 'Unknown Biller';
            if (!grouped[billerName]) {
                grouped[billerName] = [];
            }
            grouped[billerName].push(assignment);
        });

        // Add unassigned cases to a special group
        if (unassignedCases.length > 0) {
            grouped['Unassigned Cases'] = unassignedCases;
        }

        return grouped;
    };

    const groupedCases = isProvider ? groupCasesByProvider(assignedCases) : {};

    if (loading) {
        return (
            <div className="h-screen bg-white m-2 rounded-md flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <>
            {/* Billing Dashboard Card */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-orange-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-orange-200 bg-orange-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {isBiller ? 'My Assigned Cases' : isClient ? 'My Projects & Billing' : 'Biller Case Assignments'}
                            </h2>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Briefcase className="text-orange-500" size={24} />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {assignedCases.length === 0 ? (
                        <div className="text-center py-8">
                            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                {isBiller ? 'No cases assigned' : isClient ? 'No projects found' : 'No biller assignments'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {isBiller
                                    ? "You don't have any cases assigned to you yet."
                                    : isClient
                                        ? "You don't have any projects yet."
                                        : "No cases have been assigned to billers yet."
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {isBiller
                                        ? `Total Assigned Cases: ${assignedCases.length}`
                                        : isClient
                                            ? `Total Projects: ${assignedCases.length}`
                                            : ` `
                                    }
                                </h3>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={getMyAssignedCases}
                                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-orange-600 hover:text-orange-700"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        <span>Refresh</span>
                                    </button>
                                </div>
                            </div>

                            {isBiller ? (
                                // Biller View - Show cases directly
                                <div className="space-y-4">
                                    {assignedCases.map((assignment) => (
                                        <div
                                            key={assignment.project_id}
                                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-semibold text-gray-900 truncate">
                                                        {assignment.project.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        Client: {assignment.project.client_name}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500">Status:</span>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.project.status)}`}>
                                                        {assignment.project.status ? assignment.project.status.replace('_', ' ') : 'N/A'}
                                                    </span>
                                                </div>

                                                {assignment.project.filingDate && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-500">Filing Date:</span>
                                                        <span className="text-sm text-gray-900">
                                                            {moment(assignment.project.filingDate).format('MMM DD, YYYY')}
                                                        </span>
                                                    </div>
                                                )}

                                                {assignment.project.budget && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-500">Budget:</span>
                                                        <span className="text-sm font-medium text-green-600">
                                                            ${assignment.project.budget.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500">Assigned:</span>
                                                    <span className="text-sm text-gray-900">
                                                        {moment(assignment.assigned_at).format('MMM DD, YYYY')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <button
                                                    onClick={() => handleCaseClick(assignment.project_id)}
                                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>View Details</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : isClient ? (
                                // Client View - Show projects with billing activities
                                <div className="space-y-4">
                                    {assignedCases.map((assignment) => (
                                        <div
                                            key={assignment.project_id}
                                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            {console.log("assignment", assignment)}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-semibold text-gray-900 truncate">
                                                        {assignment.project.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        Provider: {assignment.project.provider?.name || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">


                                                {assignment.project.filingDate && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-500">Filing Date:</span>
                                                        <span className="text-sm text-gray-900">
                                                            {moment(assignment.project.filingDate).format('MMM DD, YYYY')}
                                                        </span>
                                                    </div>
                                                )}

                                                {assignment.project.budget && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-500">Budget:</span>
                                                        <span className="text-sm font-medium text-green-600">
                                                            ${assignment.project.budget.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500">Created:</span>
                                                    <span className="text-sm text-gray-900">
                                                        {moment(assignment.project.created_at).format('MMM DD, YYYY')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <div className="flex space-x-2">
                                                    {/* <button
                                                        onClick={() => handleCaseClick(assignment.project_id)}
                                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span>View Details</span>
                                                    </button> */}
                                                    <button
                                                        onClick={() => handleBillingActivitiesClick(assignment.project)}
                                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors"
                                                    >
                                                        <DollarSign className="w-4 h-4" />
                                                        <span>View Bills</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Provider View - Show cases grouped by biller
                                <div className="">
                                    {Object.entries(groupedCases).map(([groupName, cases]) => {
                                        const totalCases = cases.length;
                                        const totalBudget = cases.reduce((sum, assignment) => {
                                            return sum + (assignment.project.budget || 0);
                                        }, 0);

                                        const isUnassignedGroup = groupName === 'Unassigned Cases';

                                        return (
                                            <div
                                                key={groupName}
                                                className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow mb-4 ${isUnassignedGroup
                                                    ? 'border-orange-200 bg-orange-50'
                                                    : 'border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full ${isUnassignedGroup
                                                            ? 'bg-orange-100'
                                                            : 'bg-blue-100'
                                                            }`}>
                                                            {isUnassignedGroup ? (
                                                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                                            ) : (
                                                                <User className="w-5 h-5 text-blue-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-900">
                                                                {isUnassignedGroup ? 'Unassigned Cases' : `${groupName}'s Cases`}
                                                            </h4>
                                                            <p className="text-sm text-gray-500">
                                                                {totalCases} case{totalCases !== 1 ? 's' : ''} • ${totalBudget.toLocaleString()} total budget
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleProviderClick(cases, groupName)}
                                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isUnassignedGroup
                                                            ? 'text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 hover:border-orange-300'
                                                            : 'text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                                                            }`}
                                                    >
                                                        <span>View Cases</span>
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Case Details Modal */}
            <CaseDetailsModal
                isOpen={isModalOpen}
                onClose={closeModal}
                projectId={selectedCaseId}
            />

            {/* Expenses Modal */}
            <ExpensesModal
                isOpen={isExpensesModalOpen}
                onClose={closeExpensesModal}
            />

            {/* Provider Cases Modal */}
            <ProviderCasesModal
                isOpen={isProviderModalOpen}
                onClose={closeProviderModal}
                providerCases={selectedProviderCases}
                providerName={selectedProviderName}
            />

            {/* Billing Activities Modal */}
            {isBillingActivitiesModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={closeBillingActivitiesModal} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="w-6 h-6 text-gray-600" />
                                        <h2 className="text-xl font-semibold text-gray-800">
                                            Billing Activities - {selectedProjectForBilling?.name}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={closeBillingActivitiesModal}
                                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[85vh] overflow-y-auto p-6">
                                {billingActivities.length === 0 ? (
                                    <div className="text-center py-12">
                                        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No billing activities</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            No billing activities have been recorded for this project yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                Total Activities: {billingActivities.length}
                                            </h3>
                                            <div className="text-sm text-gray-500">
                                                Total Amount: ${billingActivities.reduce((sum, activity) => sum + (activity.amount || 0), 0).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {billingActivities.map((activity) => (
                                                <div
                                                    key={activity.billing_activity_id}
                                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <h4 className="text-lg font-semibold text-gray-900">
                                                                {activity.description}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {activity.task_name && `Task: ${activity.task_name}`}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-bold text-green-600">
                                                                ${activity.amount?.toLocaleString() || '0'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {activity.hours ? `${activity.hours} hours` : 'Fixed rate'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-500">Date:</span>
                                                            <span className="text-sm text-gray-900">
                                                                {moment(activity.created_at).format('MMM DD, YYYY')}
                                                            </span>
                                                        </div>

                                                        {activity.rate && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-gray-500">Rate:</span>
                                                                <span className="text-sm text-gray-900">
                                                                    ${activity.rate}/hour
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-500">Status:</span>
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${activity.status === 'PAID'
                                                                ? 'bg-green-100 text-green-800'
                                                                : activity.status === 'PENDING'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {activity.status || 'PENDING'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {activity.status !== 'PAID' && (
                                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                                            <button
                                                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 hover:border-green-700 transition-colors"
                                                            >
                                                                <DollarSign className="w-4 h-4" />
                                                                <span>Pay Now</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default BillingPage; 