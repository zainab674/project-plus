"use client"

import React, { useState } from 'react';
import { X, Eye, User, Calendar, DollarSign, Briefcase, Receipt } from 'lucide-react';
import moment from 'moment';
import { toast } from 'react-toastify';
import CaseDetailsModal from './CaseDetailsModal';
import { ExpensesModal } from './ExpensesModal';

export const ProviderCasesModal = ({ isOpen, onClose, providerCases, providerName }) => {
    const [selectedCaseId, setSelectedCaseId] = useState(null);
    const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
    const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
    const [selectedProviderId, setSelectedProviderId] = useState(null);

    if (!isOpen || !providerCases) return null;

    const handleCaseClick = (projectId) => {
        setSelectedCaseId(projectId);
        setIsCaseModalOpen(true);
    };

    const closeCaseModal = () => {
        setIsCaseModalOpen(false);
        setSelectedCaseId(null);
    };

    const handleExpensesClick = () => {
        console.log('Expenses button clicked');
        console.log('Provider cases:', providerCases);
        
        // Get the provider/biller ID from the first case
        if (providerCases && providerCases.length > 0) {
            // Check if it's a biller assignment or provider assignment
            const assignment = providerCases[0];
            console.log('First assignment:', assignment);
            
            // For biller assignments, use biller_id
            // For provider assignments, use assigned_by
            // For unassigned cases, use project creator
            let userId = null;
            
            if (assignment.biller_id) {
                userId = assignment.biller_id;
                console.log('Using biller_id:', userId);
            } else if (assignment.assigned_by) {
                userId = assignment.assigned_by;
                console.log('Using assigned_by:', userId);
            } else if (assignment.biller?.user_id) {
                userId = assignment.biller.user_id;
                console.log('Using biller.user_id:', userId);
            } else if (assignment.assignedBy?.user_id) {
                userId = assignment.assignedBy.user_id;
                console.log('Using assignedBy.user_id:', userId);
            } else if (assignment.project?.created_by) {
                // Use project creator for unassigned cases
                userId = assignment.project.created_by;
                console.log('Using project.created_by for unassigned case:', userId);
            }
            
            console.log('Final selected User ID:', userId);
            
            if (userId) {
                setSelectedProviderId(userId);
                setIsExpensesModalOpen(true);
                console.log('Opening expenses modal with provider ID:', userId);
            } else {
                console.error('Could not determine user ID for expenses');
                console.error('Assignment object keys:', Object.keys(assignment));
                // Show error to user
                toast.error('Could not determine provider ID for expenses. Please check the case assignment data.');
            }
        } else {
            console.error('No provider cases available');
            toast.error('No cases available to determine provider ID');
        }
    };

    const closeExpensesModal = () => {
        setIsExpensesModalOpen(false);
        setSelectedProviderId(null);
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

    const totalCases = providerCases.length;
    const totalBudget = providerCases.reduce((sum, assignment) => {
        return sum + (assignment.project.budget || 0);
    }, 0);

    // Determine if this is showing biller cases or provider cases
    const isBillerView = providerCases.length > 0 && providerCases[0].biller;
    const displayName = isBillerView ? 'Biller' : 'Provider';

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white text-sm rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {providerName === 'Unassigned Cases' ? 'All Unassigned Cases' : `${providerName}'s Cases`}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {providerName === 'Unassigned Cases' 
                                        ? `Total Unassigned Cases: ${totalCases}` 
                                        : `Total Cases: ${totalCases}`
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExpensesClick}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                                title="View expenses"
                            >
                                <Receipt className="w-4 h-4" />
                                Expenses
                            </button>
                            <button
                                onClick={onClose}
                                className="text-gray-800 hover:text-black"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium text-gray-900">
                                    {providerName === 'Unassigned Cases' ? 'Unassigned Cases' : 'Total Cases'}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{totalCases}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-gray-900">Total Budget</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600 mt-1">${totalBudget.toLocaleString()}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-orange-600" />
                                <span className="text-sm font-medium text-gray-900">
                                    {providerName === 'Unassigned Cases' ? 'Latest Created' : 'Latest Assignment'}
                                </span>
                            </div>
                            <p className="text-sm text-orange-600 mt-1">
                                {providerCases.length > 0 ? 
                                    (providerName === 'Unassigned Cases' 
                                        ? moment(providerCases[0].project?.created_at).format('MMM DD, YYYY')
                                        : moment(providerCases[0].assigned_at).format('MMM DD, YYYY')
                                    ) : 
                                    'N/A'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Cases List */}
                    <div className="space-y-4">
                        {providerCases.map((assignment) => (
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

                                    {assignment.project.budget && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Budget:</span>
                                            <span className="text-sm font-medium text-green-600">
                                                ${assignment.project.budget.toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">
                                            {providerName === 'Unassigned Cases' ? 'Created:' : 'Assigned:'}
                                        </span>
                                        <span className="text-sm text-gray-900">
                                            {providerName === 'Unassigned Cases' 
                                                ? moment(assignment.project?.created_at).format('MMM DD, YYYY')
                                                : moment(assignment.assigned_at).format('MMM DD, YYYY')
                                            }
                                        </span>
                                    </div>

                                    {/* Show assigned by information if available */}
                                    {assignment.assignedBy && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Assigned By:</span>
                                            <span className="text-sm text-gray-900">
                                                {assignment.assignedBy.name}
                                            </span>
                                        </div>
                                    )}
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

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Case Details Modal */}
            <CaseDetailsModal
                isOpen={isCaseModalOpen}
                onClose={closeCaseModal}
                projectId={selectedCaseId}
            />

            {/* Expenses Modal */}
            <ExpensesModal
                isOpen={isExpensesModalOpen}
                onClose={closeExpensesModal}
                defaultProviderId={selectedProviderId}
            />
            
            {/* Debug Info - Remove this after testing */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-xs">
                    <div>Modal Open: {isExpensesModalOpen ? 'Yes' : 'No'}</div>
                    <div>Selected Provider ID: {selectedProviderId || 'None'}</div>
                    <div>Provider Cases Count: {providerCases?.length || 0}</div>
                    {providerCases?.length > 0 && (
                        <div>
                            First Case: {JSON.stringify(providerCases[0], null, 2)}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}; 