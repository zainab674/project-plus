

'use client';

import React, { useState, useEffect } from 'react';
import {
    Receipt,
    Scale, Settings, Users, X, DollarSign, Clock, FileText, CheckCircle, Plus, Building2, User, Calendar, MapPin, Gavel
} from 'lucide-react';
import { getCaseDetailsRequest, getProjectTeamMembersRequest, getProjectBillingEntriesRequest } from '@/lib/http/client';
import { toast } from 'react-toastify';
import Loader from '@/components/Loader';
import moment from 'moment';
import MemberRateModal from './MemberRateModal';
import BillingEntriesModal from './BillingEntriesModal';
import BillingConfigModal from './BillingConfigModal';
import ActivityBillingModal from './ActivityBillingModal';

const CaseDetailsModal = ({ isOpen, onClose, projectId }) => {
    const [caseDetails, setCaseDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    const [isBillingConfigModalOpen, setIsBillingConfigModalOpen] = useState(false);
    const [isMemberRateModalOpen, setIsMemberRateModalOpen] = useState(false);
    const [isBillingEntriesModalOpen, setIsBillingEntriesModalOpen] = useState(false);
    const [isActivityBillingModalOpen, setIsActivityBillingModalOpen] = useState(false);
    const [selectedCaseForConfig, setSelectedCaseForConfig] = useState(null);
    const [selectedCaseForRates, setSelectedCaseForRates] = useState(null);
    const [selectedCaseForEntries, setSelectedCaseForEntries] = useState(null);
    const [selectedActivityForBilling, setSelectedActivityForBilling] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [billingEntries, setBillingEntries] = useState([]);

    const assignment = {
        project_id: caseDetails?.project_id,
        project: {
            name: caseDetails?.name,
            Members: caseDetails?.Members
        }
    };

    const handleBillingConfigClick = (e, assignment) => {
        e.stopPropagation();
        setSelectedCaseForConfig({
            caseId: assignment.project_id,
            caseName: assignment.project.name
        });
        setIsBillingConfigModalOpen(true);
    };

    const closeBillingConfigModal = () => {
        setIsBillingConfigModalOpen(false);
        setSelectedCaseForConfig(null);
    };



    const handleMemberRateClick = async (e, assignment) => {
        e.stopPropagation();


        setSelectedCaseForRates({
            caseId: assignment.project_id,
            caseName: assignment.project.name
        });

        let members = [];

        // 1. Try from caseDetails
        if (caseDetails?.Members && Array.isArray(caseDetails.Members)) {
            members = caseDetails.Members
                .filter(member => member.role !== 'CLIENT')
                .map(member => ({
                    user_id: member.user?.user_id || member.user_id,
                    name: member.user?.name || member.name,
                    email: member.user?.email || member.email
                }));
        }

        // 2. Fallback: assignment.project.Members
        if (members.length === 0 && assignment.project.Members && Array.isArray(assignment.project.Members)) {
            members = assignment.project.Members
                .filter(member => member.role !== 'CLIENT')
                .map(member => ({
                    user_id: member.user?.user_id || member.user_id,
                    name: member.user?.name || member.name,
                    email: member.user?.email || member.email
                }));
        }

        // 3. Fallback: API request
        if (members.length === 0) {
            try {
                const response = await getProjectTeamMembersRequest(assignment.project_id);
                if (response.data.teamMembers && Array.isArray(response.data.teamMembers)) {
                    members = response.data.teamMembers
                        .filter(member => member.role !== 'CLIENT')
                        .map(member => ({
                            user_id: member.user_id,
                            name: member.name,
                            email: member.email
                        }));
                }
            } catch (error) {
                console.error('Error fetching team members:', error);
                toast.error('Failed to fetch team members');
            }
        }


        if (members.length === 0) {
            toast.warning('No team members found for this case. Please ensure team members are assigned to the case.');
        }

        setTeamMembers(members);
        setIsMemberRateModalOpen(true);
    };

    const closeMemberRateModal = () => {
        setIsMemberRateModalOpen(false);
        setSelectedCaseForRates(null);
        setTeamMembers([]);
    };

    const handleBillingEntriesClick = (e, assignment) => {
        e.stopPropagation();
        setSelectedCaseForEntries({
            projectId: assignment.project_id,
            projectName: assignment.project.name
        });
        setIsBillingEntriesModalOpen(true);
    };

    const closeBillingEntriesModal = () => {
        setIsBillingEntriesModalOpen(false);
        setSelectedCaseForEntries(null);
    };

    const handleActivityBillingClick = (activity, activityType) => {
        const activityId = activityType === 'TASK' ? activity.task_id :
            activityType === 'PROGRESS' ? activity.progress_id :
                activityType === 'TIME' ? activity.time_id :
                    activityType === 'REVIEW' ? activity.review_id : null;

        setSelectedActivityForBilling({
            activity,
            activityType,
            projectId: caseDetails?.project_id,
            projectName: caseDetails?.name
        });
        setIsActivityBillingModalOpen(true);
    };

    const closeActivityBillingModal = () => {
        setIsActivityBillingModalOpen(false);
        setSelectedActivityForBilling(null);
    };

    const handleBillingConfigSuccess = () => {
        fetchCaseDetails();
    };

    const handleMemberRateSuccess = () => {
        fetchCaseDetails();
    };

    const handleActivityBillingSuccess = async (activityType, activityId) => {
        // Refresh the case details and billing entries to ensure everything is up to date
        await fetchCaseDetails();
    };

    const handleBillingEntryDeleted = async (deletedEntry) => {
        // Refresh the case details and billing entries to update billing status
        await fetchCaseDetails();
    };




    const getTaskBillingAmount = (taskId) => {
        if (!billingEntries || billingEntries.length === 0) {
            return 0;
        }

        // Calculate total amount for all billing entries related to this task
        const taskEntries = billingEntries.filter(entry =>
            entry.task_id === taskId
        );

        return taskEntries.reduce((total, entry) => total + (entry.total_amount || 0), 0);
    };

    const isActivityBilled = (activityType, activityId, activityData) => {
        if (!billingEntries || billingEntries.length === 0) {
            return false;
        }

        switch (activityType) {
            case 'TASK':
                // Check if there's a billing entry for this task
                return billingEntries.some(entry =>
                    entry.item_type === 'TASK' &&
                    entry.task_id === activityId
                );

            case 'PROGRESS':
                // Check if there's a billing entry with matching description
                return billingEntries.some(entry =>
                    entry.item_type === 'PROGRESS' &&
                    entry.description === `Progress: ${activityData.message}`
                );

            case 'TIME':
                // Check if there's a billing entry for this time entry
                return billingEntries.some(entry =>
                    entry.item_type === 'TIME' &&
                    entry.description === `Time: ${activityData.work_description}`
                );

            case 'REVIEW':
                // Check if there's a billing entry for this review
                return billingEntries.some(entry =>
                    entry.item_type === 'REVIEW' &&
                    entry.description === `Review: ${activityData.submissionDesc}`
                );

            default:
                return false;
        }
    };

    useEffect(() => {
        if (isOpen && projectId) {
            fetchCaseDetails();
        }
    }, [isOpen, projectId]);



    const fetchCaseDetails = async () => {
        setLoading(true);
        try {
            const [caseDetailsResponse, billingEntriesResponse] = await Promise.all([
                getCaseDetailsRequest(projectId),
                getProjectBillingEntriesRequest(projectId)
            ]);

            setCaseDetails(caseDetailsResponse.data.caseDetails);
            setBillingEntries(billingEntriesResponse.data.billingEntries || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to fetch case details');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
                <div className="flex min-h-full items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-xl p-8 shadow-2xl">
                        <Loader />
                    </div>
                </div>
            </div>
        );
    }

    if (!caseDetails) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl">
                                    <Gavel className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">Case Details & Progress</h1>
                                    <p className="text-slate-300 text-sm mt-1">Comprehensive case management and billing overview</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 transition-colors text-white hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={(e) => handleBillingConfigClick(e, assignment)}
                                className="flex items-center justify-center space-x-3 px-6 py-4 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 border border-amber-600 rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <Settings className="w-5 h-5" />
                                <span>Configure Billing</span>
                            </button>

                            <button
                                onClick={(e) => handleMemberRateClick(e, assignment)}
                                className="flex items-center justify-center space-x-3 px-6 py-4 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-600 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <Users className="w-5 h-5" />
                                <span>Team Rates</span>
                            </button>

                            <button
                                onClick={(e) => handleBillingEntriesClick(e, assignment)}
                                className="flex items-center justify-center space-x-3 px-6 py-4 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 border border-emerald-600 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <Receipt className="w-5 h-5" />
                                <span>View Billing Entries</span>
                            </button>
                        </div>
                    </div>

                    {/* Case Information */}
                    <div className="px-8 py-8">
                        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 border border-slate-200 shadow-sm mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <Building2 className="w-6 h-6 text-slate-600" />
                                Case Information
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Case Name</p>
                                            <p className="text-lg font-semibold text-slate-800">{caseDetails.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Description</p>
                                            <p className="text-slate-700 leading-relaxed">{caseDetails.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <User className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Client Name</p>
                                            <p className="text-lg font-semibold text-slate-800">{caseDetails.client_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <MapPin className="w-4 h-4 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Client Address</p>
                                            <p className="text-slate-700">{caseDetails.client_address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                            <Scale className="w-4 h-4 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Opposing Party</p>
                                            <p className="text-slate-700">{caseDetails.opposing}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Completed Tasks */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                                Completed Tasks & Activities
                            </h2>

                            {caseDetails.Tasks?.filter(task => task.status === 'DONE').map((task, index) => (
                                <div key={task.task_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* Task Header */}
                                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl">
                                                    <span className="text-emerald-700 font-bold text-lg">{index + 1}</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-800">{task.name}</h3>
                                                    <p className="text-slate-600 text-sm mt-1">{task.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200">
                                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                                <span className="text-emerald-800">
                                                    ${getTaskBillingAmount(task.task_id).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Task Details */}
                                    <div className="p-8">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Task Information */}
                                            <div className="space-y-4">
                                                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-slate-600" />
                                                    Task Details
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                        <span className="text-sm font-medium text-slate-600">Status</span>
                                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-full">Completed</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                        <span className="text-sm font-medium text-slate-600">Priority</span>
                                                        <span className="text-sm font-semibold text-slate-800">{task.priority}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                        <span className="text-sm font-medium text-slate-600">Phase</span>
                                                        <span className="text-sm font-semibold text-slate-800">{task.phase}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                        <span className="text-sm font-medium text-slate-600">Due Date</span>
                                                        <span className="text-sm font-semibold text-slate-800">{moment(task.last_date).format('LL')}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                        <span className="text-sm font-medium text-slate-600">Created By</span>
                                                        <span className="text-sm font-semibold text-slate-800">{task.creator?.name}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                        <span className="text-sm font-medium text-slate-600">Assignees</span>
                                                        <span className="text-sm font-semibold text-slate-800">{task.assignees?.map(a => a.user?.name).join(', ')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Review Information */}
                                            <div className="space-y-4">
                                                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                    <CheckCircle className="w-5 h-5 text-slate-600" />
                                                    Review Information
                                                </h4>
                                                {task.inReview?.[0] ? (
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                            <span className="text-sm font-medium text-slate-600">Submitted By</span>
                                                            <span className="text-sm font-semibold text-slate-800">{task.inReview[0].submitted_by?.name}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                            <span className="text-sm font-medium text-slate-600">Review Action</span>
                                                            <span className="text-sm font-semibold text-slate-800">{task.inReview[0].action}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                            <span className="text-sm font-medium text-slate-600">Reviewed By</span>
                                                            <span className="text-sm font-semibold text-slate-800">{task.inReview[0].acted_by?.name}</span>
                                                        </div>
                                                        {task.inReview[0].file_url && (
                                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                                <span className="text-sm font-medium text-slate-600">Attached File</span>
                                                                <a href={task.inReview[0].file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline">
                                                                    {task.inReview[0].filename}
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-500 text-sm italic">No review information available</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Activity Logs */}
                                        <div className="mt-8 space-y-6">
                                            {/* Progress Logs */}
                                            {task.Progress?.length > 0 && (
                                                <div className="bg-slate-50 rounded-xl p-6">
                                                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                        <Clock className="w-5 h-5 text-blue-600" />
                                                        Progress Log
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {task.Progress.map(progress => (
                                                            <div key={progress.progress_id} className="flex items-center justify-between bg-white rounded-lg p-4 border border-slate-200">
                                                                <div className="flex-1">
                                                                    <p className="text-slate-800 font-medium">{progress.message}</p>
                                                                    <p className="text-slate-500 text-sm mt-1">
                                                                        {moment(progress.created_at).format('LLL')} • {progress.user?.name}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleActivityBillingClick(progress, 'PROGRESS')}
                                                                    disabled={isActivityBilled('PROGRESS', progress.progress_id, progress)}
                                                                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${isActivityBilled('PROGRESS', progress.progress_id, progress)
                                                                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                                            : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                                                        }`}
                                                                >
                                                                    <DollarSign className="w-4 h-4" />
                                                                    <span>
                                                                        {isActivityBilled('PROGRESS', progress.progress_id, progress) ? 'Billed' : 'Bill'}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Time Logs */}
                                            {task.Time?.length > 0 && (
                                                <div className="bg-slate-50 rounded-xl p-6">
                                                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                        <Clock className="w-5 h-5 text-purple-600" />
                                                        Time Logs
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {task.Time.map(time => (
                                                            <div key={time.time_id} className="flex items-center justify-between bg-white rounded-lg p-4 border border-slate-200">
                                                                <div className="flex-1">
                                                                    <p className="text-slate-800 font-medium">{time.work_description}</p>
                                                                    <p className="text-slate-500 text-sm mt-1">
                                                                        {moment(time.start).format('LT')} - {moment(time.end).format('LT')} • {time.user?.name}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleActivityBillingClick(time, 'TIME')}
                                                                    disabled={isActivityBilled('TIME', time.time_id, time)}
                                                                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${isActivityBilled('TIME', time.time_id, time)
                                                                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                                            : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                                                        }`}
                                                                >
                                                                    <DollarSign className="w-4 h-4" />
                                                                    <span>
                                                                        {isActivityBilled('TIME', time.time_id, time) ? 'Billed' : 'Bill'}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Review Logs */}
                                            {task.inReview?.length > 0 && (
                                                <div className="bg-slate-50 rounded-xl p-6">
                                                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                        <CheckCircle className="w-5 h-5 text-orange-600" />
                                                        Review Logs
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {task.inReview.map(review => (
                                                            <div key={review.review_id} className="flex items-center justify-between bg-white rounded-lg p-4 border border-slate-200">
                                                                <div className="flex-1">
                                                                    <p className="text-slate-800 font-medium">{review.submissionDesc}</p>
                                                                    <p className="text-slate-500 text-sm mt-1">
                                                                        {moment(review.created_at).format('LLL')} • {review.submitted_by?.name}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleActivityBillingClick(review, 'REVIEW')}
                                                                    disabled={isActivityBilled('REVIEW', review.review_id, review)}
                                                                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${isActivityBilled('REVIEW', review.review_id, review)
                                                                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                                            : 'bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                                                        }`}
                                                                >
                                                                    <DollarSign className="w-4 h-4" />
                                                                    <span>
                                                                        {isActivityBilled('REVIEW', review.review_id, review) ? 'Billed' : 'Bill'}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing Configuration Modal */}
            <BillingConfigModal
                isOpen={isBillingConfigModalOpen}
                onClose={closeBillingConfigModal}
                caseId={selectedCaseForConfig?.caseId}
                caseName={selectedCaseForConfig?.caseName}
                onSuccess={handleBillingConfigSuccess}
            />

            {/* Member Rate Modal */}
            <MemberRateModal
                isOpen={isMemberRateModalOpen}
                onClose={closeMemberRateModal}
                caseId={selectedCaseForRates?.caseId}
                caseName={selectedCaseForRates?.caseName}
                teamMembers={teamMembers}
                onSuccess={handleMemberRateSuccess}
            />

            {/* Billing Entries Modal */}
            <BillingEntriesModal
                isOpen={isBillingEntriesModalOpen}
                onClose={closeBillingEntriesModal}
                projectId={selectedCaseForEntries?.projectId}
                projectName={selectedCaseForEntries?.projectName}
                onEntryDeleted={handleBillingEntryDeleted}
            />

            {/* Activity Billing Modal */}
            <ActivityBillingModal
                isOpen={isActivityBillingModalOpen}
                onClose={closeActivityBillingModal}
                activity={selectedActivityForBilling?.activity}
                activityType={selectedActivityForBilling?.activityType}
                projectId={selectedActivityForBilling?.projectId}
                projectName={selectedActivityForBilling?.projectName}
                onSuccess={handleActivityBillingSuccess}
            />
        </div>
    );
};

export default CaseDetailsModal;
