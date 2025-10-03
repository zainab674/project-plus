import React, { useState, useEffect, useCallback } from 'react';
import {
    AlertCircle, DollarSign, PieChart, Clock, CheckCircle, XCircle, User,
    FileText, Calendar, TrendingUp, TrendingDown, Plus, Settings,
    Users, Calculator, Receipt, BarChart3, Filter, Download, Eye, Briefcase, RefreshCw, ChevronRight
} from 'lucide-react';

import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { getMyAssignedCasesRequest, getBillerAssignedCasesRequest } from '@/lib/http/billing';
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

const Billing = () => {
    const { user } = useUser();
    const [assignedCases, setAssignedCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCaseId, setSelectedCaseId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
    const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
    const [selectedProviderCases, setSelectedProviderCases] = useState([]);
    const [selectedProviderName, setSelectedProviderName] = useState('');

    // Determine if user is a biller or provider
    const isBiller = user?.Role === 'BILLER';
    const isProvider = user?.Role === 'PROVIDER';

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
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to fetch cases');
        } finally {
            setLoading(false);
        }
    }, [isBiller, isProvider]);

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

    const getStatusColor = (status) => {
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
                                {isBiller ? 'My Assigned Cases' : 'Biller Case Assignments'}
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
                                {isBiller ? 'No cases assigned' : 'No biller assignments'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {isBiller
                                    ? "You don't have any cases assigned to you yet."
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
                                                        {assignment.project.status.replace('_', ' ')}
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

                                                {/* {assignment.project.budget && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-500">Budget:</span>
                                                        <span className="text-sm font-medium text-green-600">
                                                            ${assignment.project.budget.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )} */}

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
                            ) : (
                                // Provider View - Show cases grouped by biller
                                <div className="">
                                    {Object.entries(groupedCases).map(([groupName, cases]) => {
                                        const totalCases = cases.length;
                                        // const totalBudget = cases.reduce((sum, assignment) => {
                                        //     return sum + (assignment.project.budget || 0);
                                        // }, 0);

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
                                                                {totalCases} case{totalCases !== 1 ? 's' : ''} •
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

        </>
    );
};

export default Billing;