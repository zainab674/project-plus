import React, { useState, useEffect } from 'react';
import { FileText, Users, DollarSign, CheckCircle, Clock, AlertCircle, X, RefreshCw, Settings } from 'lucide-react';
import { getAllProjectWithTasksRequest } from '@/lib/http/project';
import { getBillingConfigRequest, getMemberRatesRequest, getProjectBillingEntriesRequest } from '@/lib/http/client';
import { toast } from 'react-toastify';
import { useUser } from '@/providers/UserProvider';
import BillingConfigModal from '@/components/modals/BillingConfigModal';
import { getExpensesRequest } from '@/lib/http/expenses';

const BusinessStatus = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format


    const [billingConfigModal, setBillingConfigModal] = useState({
        isOpen: false,
        caseId: null,
        caseName: ''
    });
    const { user } = useUser();

    const loadExpenses = async () => {
        setLoading(true);

        try {
            const response = await getExpensesRequest(selectedMonth, user.user_id || null);
            setExpenses(response.data.expenses || []);
            setTotalExpenses(response.data.total || 0);

            console.log("exexex", response)
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load expenses');
        } finally {
            setLoading(false);

        }
    };

    const fetchUserCases = async () => {
        try {
            setLoading(true);
            const response = await getAllProjectWithTasksRequest();
            const { projects } = response.data;

            // Filter cases created by the logged-in user
            const userCases = projects.filter(project => project.created_by === user?.user_id);

            // Fetch billing config, member rates, and billing entries for each case
            const casesWithBillingConfig = await Promise.all(
                userCases.map(async (caseItem) => {
                    try {
                        const [billingResponse, memberRatesResponse, billingEntriesResponse] = await Promise.all([
                            getBillingConfigRequest(caseItem.project_id),
                            getMemberRatesRequest(caseItem.project_id),
                            getProjectBillingEntriesRequest(caseItem.project_id)
                        ]);

                        const billingConfig = billingResponse.data.billingConfig;
                        const memberRates = memberRatesResponse.data.memberRates || [];
                        const billingEntries = billingEntriesResponse.data.billingEntries || [];

                        // Debug: Log the tasks for this case
                        console.log(`Case ${caseItem.project_id} tasks:`, caseItem.Tasks);

                        const completedTasks = caseItem.Tasks?.filter(task => {
                            console.log(`Task ${task.task_id} status:`, task.status, 'Type:', typeof task.status);
                            // Check for DONE status - handle both string and enum values
                            const status = String(task.status).trim().toUpperCase();
                            const isDone = status === 'DONE';
                            console.log(`Task ${task.task_id} processed status:`, status, 'Is done:', isDone);
                            return isDone;
                        }) || [];

                        // Debug: Log all tasks for this case
                        console.log(`Case ${caseItem.project_id} all tasks:`, caseItem.Tasks);
                        console.log(`Case ${caseItem.project_id} completed tasks:`, completedTasks);

                        // Calculate billing totals for each completed task
                        const tasksWithBilling = completedTasks.map(task => {
                            const taskBillingEntries = billingEntries.filter(entry =>
                                entry.task && entry.task.task_id === task.task_id
                            );

                            const totalAmount = taskBillingEntries.reduce((sum, entry) =>
                                sum + (entry.total_amount || 0), 0
                            );

                            return {
                                ...task,
                                billingEntries: taskBillingEntries,
                                totalBillingAmount: totalAmount
                            };
                        });

                        // Calculate overall billing summary
                        const billingSummary = {
                            total: billingEntries.reduce((sum, entry) => sum + (entry.total_amount || 0), 0),
                            taskBased: billingEntries.filter(entry => entry.item_type === 'TASK').reduce((sum, entry) => sum + (entry.total_amount || 0), 0),
                            hourly: billingEntries.filter(entry => entry.item_type === 'TIME').reduce((sum, entry) => sum + (entry.total_amount || 0), 0),
                            review: billingEntries.filter(entry => entry.item_type === 'REVIEW').reduce((sum, entry) => sum + (entry.total_amount || 0), 0),
                            meeting: billingEntries.filter(entry => entry.item_type === 'MEETING').reduce((sum, entry) => sum + (entry.total_amount || 0), 0)
                        };

                        console.log(`Case ${caseItem.project_id} completed tasks:`, completedTasks);

                        return {
                            ...caseItem,
                            billingConfig,
                            memberRates,
                            completedTasks: tasksWithBilling,
                            billingEntries,
                            billingSummary
                        };
                    } catch (error) {
                        console.log(`Error fetching data for case ${caseItem.project_id}:`, error);

                        const completedTasks = caseItem.Tasks?.filter(task => {
                            console.log(`Task ${task.task_id} status (fallback):`, task.status, 'Type:', typeof task.status);
                            // More robust filtering - handle potential case sensitivity or whitespace
                            const status = String(task.status).trim().toUpperCase();
                            const isDone = status === 'DONE';
                            console.log(`Task ${task.task_id} processed status (fallback):`, status, 'Is done:', isDone);
                            return isDone;
                        }) || [];

                        return {
                            ...caseItem,
                            billingConfig: null,
                            memberRates: [],
                            completedTasks: completedTasks.map(task => ({
                                ...task,
                                billingEntries: [],
                                totalBillingAmount: 0
                            })),
                            billingEntries: [],
                            billingSummary: {
                                total: 0,
                                taskBased: 0,
                                hourly: 0,
                                review: 0,
                                meeting: 0
                            }
                        };
                    }
                })
            );

            setCases(casesWithBillingConfig);
        } catch (error) {
            console.error('Failed to fetch cases:', error);
            toast.error('Failed to load cases');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.user_id) {
            loadExpenses();
            fetchUserCases();
        }
    }, [user]);

    const getBillingTypeText = (billingConfig) => {
        if (!billingConfig) return 'No billing config';

        if (billingConfig.is_taskbase) {
            return `Per Task - $${billingConfig.task_amount || 'N/A'}`;
        } else if (billingConfig.is_fullcase) {
            return `Per Case - $${billingConfig.project_fee || 'N/A'}`;
        } else if (billingConfig.is_hourly) {
            return `Hourly - $${billingConfig.hourly_rate || 'N/A'}/hr`;
        }

        return 'Billing type not set';
    };

    const getBillingTypeIcon = (itemType) => {
        switch (itemType) {
            case 'TASK':
                return <FileText className="h-3 w-3 text-blue-600" />;
            case 'TIME':
                return <Clock className="h-3 w-3 text-green-600" />;
            case 'REVIEW':
                return <CheckCircle className="h-3 w-3 text-purple-600" />;
            case 'MEETING':
                return <Users className="h-3 w-3 text-orange-600" />;
            default:
                return <DollarSign className="h-3 w-3 text-gray-600" />;
        }
    };

    const getBillingTypeLabel = (itemType) => {
        switch (itemType) {
            case 'TASK':
                return 'Task';
            case 'TIME':
                return 'Hourly';
            case 'REVIEW':
                return 'Review';
            case 'MEETING':
                return 'Meeting';
            default:
                return itemType;
        }
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleOpenBillingConfig = (caseId, caseName) => {
        setBillingConfigModal({
            isOpen: true,
            caseId,
            caseName
        });
    };

    const handleCloseBillingConfig = () => {
        setBillingConfigModal({
            isOpen: false,
            caseId: null,
            caseName: ''
        });
    };

    const handleBillingConfigSuccess = () => {
        // Refresh the cases data to get updated billing config
        fetchUserCases();
    };

    // Calculate overall summary across all cases
    const overallSummary = cases.reduce((summary, caseItem) => {
        if (caseItem.billingSummary) {
            summary.total += caseItem.billingSummary.total;
            summary.taskBased += caseItem.billingSummary.taskBased;
            summary.hourly += caseItem.billingSummary.hourly;
            summary.review += caseItem.billingSummary.review;
            summary.meeting += caseItem.billingSummary.meeting;
        }
        return summary;
    }, {
        total: 0,
        taskBased: 0,
        hourly: 0,
        review: 0,
        meeting: 0
    });

    // Calculate account receivable (sum of all actual billed activities)
    const accountReceivable = cases.reduce((total, caseItem) => {
        // Sum up billed activities from billing entries
        if (caseItem.billingEntries && caseItem.billingEntries.length > 0) {
            const billedActivities = caseItem.billingEntries.filter(entry =>
                entry.status === 'BILLED' || entry.status === 'INVOICED' || entry.status === 'SENT'
            );
            const billedTotal = billedActivities.reduce((sum, entry) =>
                sum + (entry.total_amount || 0), 0
            );
            return total + billedTotal;
        }
        return total;
    }, 0);

    // Calculate unbilled activities (work done but not yet billed)
    const unbilledActivities = cases.reduce((total, caseItem) => {
        if (caseItem.billingEntries && caseItem.billingEntries.length > 0) {
            const unbilledEntries = caseItem.billingEntries.filter(entry =>
                !entry.status || entry.status === 'PENDING' || entry.status === 'DRAFT'
            );
            const unbilledTotal = unbilledEntries.reduce((sum, entry) =>
                sum + (entry.total_amount || 0), 0
            );
            return total + unbilledTotal;
        }
        return total;
    }, 0);

    // Calculate account payable (sum of all member payments based on completed tasks)
    const accountPayable = cases.reduce((total, caseItem) => {
        let casePayable = 0;

        if (caseItem.memberRates && caseItem.memberRates.length > 0) {
            caseItem.memberRates.forEach(rate => {
                // Count completed tasks for this member
                const completedTasksCount = caseItem.Tasks?.filter(task =>
                    task.status === 'DONE' &&
                    task.assignees?.some(assignee =>
                        assignee.user_id === rate.user_id ||
                        assignee.user?.user_id === rate.user_id
                    )
                ).length || 0;

                // Calculate payment for this member
                if (rate.rate_type === 'HOURLY') {
                    // For hourly rates, we'd need actual hours worked - using a placeholder for now
                    // This could be enhanced with actual time tracking data
                    casePayable += parseFloat(rate.rate_value) * completedTasksCount; // Placeholder: 1 hour per task
                } else {
                    // For task-based rates
                    casePayable += parseFloat(rate.rate_value) * completedTasksCount;
                }
            });
        }

        return total + casePayable;
    }, 0);

    const totalCompletedTasks = cases.reduce((total, caseItem) => {
        return total + (caseItem.completedTasks?.length || 0);
    }, 0);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-lg border-2 border-lime-200">
                <div className="px-6 py-4 border-b border-blue-200 bg-lime-200 bg-opacity-70">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <h2 className="text-xl font-semibold text-gray-800">My Cases</h2>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <FileText className="text-lime-500" size={24} />
                        </div>
                    </div>
                </div>
                <div className="p-8 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading cases...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Clickable Card */}
            <div
                className="bg-white rounded-lg shadow-lg border-2 border-lime-200 cursor-pointer hover:shadow-xl transition-shadow duration-300"
                onClick={handleOpenModal}
            >
                <div className="px-6 py-4 border-b border-blue-200 bg-lime-200 bg-opacity-70">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <h2 className="text-xl font-semibold text-gray-800">My Cases</h2>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <FileText className="text-lime-500" size={24} />
                        </div>
                    </div>
                </div>

                <div className="px-1 py-2 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {/* Account Receivable */}
                        <div className="bg-white rounded-lg p-1 border border-blue-200 shadow-sm">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1 bg-blue-100 rounded-md">
                                    <DollarSign className="h-4 w-4 text-blue-600" />
                                </div>
                                <h4 className="text-xs font-semibold text-blue-800">Account Receivable</h4>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-blue-700">                                    ${unbilledActivities.toFixed(2)}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">Total billed activities</p>
                            </div>
                        </div>

                        {/* Account Payable */}
                        <div className="bg-white rounded-lg p-1 border border-green-200 shadow-sm">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1 bg-green-100 rounded-md">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                </div>
                                <h4 className="text-xs font-semibold text-green-800">Account Payable</h4>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-green-700">${accountPayable.toFixed(2)}</p>
                                <p className="text-xs text-green-600 mt-1">No outstanding payments</p>
                            </div>
                        </div>

                        {/* Expenses */}
                        <div className="bg-white rounded-lg p-1 border border-pink-200 shadow-sm">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1 bg-pink-100 rounded-md">
                                    <DollarSign className="h-4 w-4 text-pink-600" />
                                </div>
                                <h4 className="text-xs font-semibold text-pink-800">Expenses</h4>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-pink-700">${totalExpenses.toFixed(2)}</p>
                                <p className="text-xs text-pink-600 mt-1">Total Expenses</p>
                            </div>
                        </div>

                        {/* Unbilled Activities */}
                        {/* <div className="bg-white rounded-lg p-1 border border-yellow-200 shadow-sm">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1 bg-yellow-100 rounded-md">
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                </div>
                                <h4 className="text-xs font-semibold text-yellow-800">Unbilled Work</h4>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-yellow-700">
                                    ${unbilledActivities.toFixed(2)}
                                </p>
                                <p className="text-xs text-yellow-600 mt-1">Pending billing</p>
                            </div>
                        </div> */}

                        {/* Net Profit */}
                        <div className="bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1 bg-gray-100 rounded-md">
                                    <DollarSign className="h-4 w-4 text-gray-600" />
                                </div>
                                <h4 className="text-xs font-semibold text-gray-800">Net Profit</h4>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-gray-700">
                                    ${(accountReceivable - accountPayable - totalExpenses).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">Receivable - Payable - Expenses</p>
                            </div>
                        </div>

                        {/* Gross Profit */}
                        <div className="bg-white rounded-lg p-1 border border-purple-200 shadow-sm">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1 bg-purple-100 rounded-md">
                                    <DollarSign className="h-4 w-4 text-purple-600" />
                                </div>
                                <h4 className="text-xs font-semibold text-purple-800">Gross Profit</h4>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-purple-700">
                                    ${(accountReceivable - accountPayable).toFixed(2)}
                                </p>
                                <p className="text-xs text-purple-600 mt-1">Receivable - Payable</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-lime-100 rounded-lg">
                                    <FileText className="h-6 w-6 text-lime-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Business Status Overview
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Comprehensive view of all cases, tasks, and billing information
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={fetchUserCases}
                                    disabled={loading}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Refresh"
                                >
                                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Account Receivable & Payable */}
                        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                {/* Account Receivable */}
                                <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <DollarSign className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-semibold text-blue-800">Account Receivable</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-blue-700">
                                            ${unbilledActivities.toFixed(2)}

                                        </p>
                                        <p className="text-sm text-blue-600 mt-1">
                                            Total billed activities
                                        </p>
                                    </div>
                                </div>

                                {/* Account Payable */}
                                <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <DollarSign className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-semibold text-green-800">Account Payable</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-green-700">
                                            ${accountPayable.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-green-600 mt-1">
                                            No outstanding payments
                                        </p>
                                    </div>
                                </div>

                                {/* Expenses */}
                                <div className="bg-white rounded-lg p-6 border border-pink-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-pink-100 rounded-lg">
                                                <DollarSign className="h-5 w-5 text-pink-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-semibold text-pink-800">Expenses</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-pink-700">
                                            ${totalExpenses.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-pink-600 mt-1">
                                            Total Expenses
                                        </p>
                                    </div>
                                </div>
                                {/* Unbilled Activities */}
                                {/* <div className="bg-white rounded-lg p-6 border border-yellow-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-yellow-100 rounded-lg">
                                                <Clock className="h-5 w-5 text-yellow-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-semibold text-yellow-800">Unbilled Work</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-yellow-700">
                                            ${unbilledActivities.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-yellow-600 mt-1">
                                            Work completed, pending billing
                                        </p>
                                    </div>
                                </div> */}

                                {/* Net Profit */}
                                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                <DollarSign className="h-5 w-5 text-gray-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-800"> Net Profit</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-gray-700">
                                            ${(unbilledActivities - accountPayable - totalExpenses).toFixed(2)}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Receivable - Payable - Expenses
                                        </p>
                                    </div>
                                </div>
                                {/* Gross Profit */}
                                <div className="bg-white rounded-lg p-6 border border-purple-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <DollarSign className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-semibold text-purple-800">Gross Profit</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-purple-700">
                                            ${(unbilledActivities - accountPayable).toFixed(2)}
                                        </p>
                                        <p className="text-sm text-purple-600 mt-1">
                                            Receivable - Payable
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* Cases List */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                                    <p className="mt-2 text-sm text-gray-500">Loading cases...</p>
                                </div>
                            ) : cases.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No cases found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        You haven't created any cases yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cases.map((caseItem, index) => (
                                        <div key={caseItem.project_id} className="border border-gray-200 rounded-lg p-4">
                                            {/* Case Header */}
                                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-700 font-semibold">
                                                        Case ID: {caseItem.project_id}
                                                    </span>
                                                    {caseItem.name && (
                                                        <span className="text-sm text-gray-500">
                                                            ({caseItem.name})
                                                        </span>
                                                    )}
                                                </div>

                                            </div>

                                            {/* Billing Summary */}
                                            {caseItem.billingSummary && caseItem.billingSummary.total > 0 && (
                                                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <DollarSign className="h-4 w-4 text-green-600" />
                                                            <span className="text-sm font-medium text-green-800">Billing Summary</span>
                                                        </div>
                                                        <span className="text-lg font-bold text-green-700">
                                                            ${caseItem.billingSummary.total.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                                        <div className="flex items-center space-x-1">
                                                            <FileText className="h-3 w-3 text-blue-600" />
                                                            <span className="text-gray-600">Task:</span>
                                                            <span className="font-medium text-blue-600">${caseItem.billingSummary.taskBased.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Clock className="h-3 w-3 text-green-600" />
                                                            <span className="text-gray-600">Hourly:</span>
                                                            <span className="font-medium text-green-600">${caseItem.billingSummary.hourly.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <CheckCircle className="h-3 w-3 text-purple-600" />
                                                            <span className="text-gray-600">Review:</span>
                                                            <span className="font-medium text-purple-600">${caseItem.billingSummary.review.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Users className="h-3 w-3 text-orange-600" />
                                                            <span className="text-gray-600">Meeting:</span>
                                                            <span className="font-medium text-orange-600">${caseItem.billingSummary.meeting.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Payable Summary */}
                                            {(() => {
                                                // Calculate payable for this case
                                                let casePayable = 0;
                                                const memberPayments = [];

                                                if (caseItem.memberRates && caseItem.memberRates.length > 0) {
                                                    caseItem.memberRates.forEach(rate => {
                                                        const completedTasksCount = caseItem.Tasks?.filter(task =>
                                                            task.status === 'DONE' &&
                                                            task.assignees?.some(assignee =>
                                                                assignee.user_id === rate.user_id ||
                                                                assignee.user?.user_id === rate.user_id
                                                            )

                                                        ).length || 0;

                                                        let memberPayment = 0;
                                                        if (rate.rate_type === 'HOURLY') {
                                                            memberPayment = parseFloat(rate.rate_value) * completedTasksCount; // Placeholder: 1 hour per task
                                                        } else {
                                                            memberPayment = parseFloat(rate.rate_value) * completedTasksCount;
                                                        }

                                                        casePayable += memberPayment;

                                                        if (completedTasksCount > 0) {
                                                            memberPayments.push({
                                                                name: rate.user?.name || `User ${rate.user_id}`,
                                                                rate: rate.rate_value,
                                                                rateType: rate.rate_type,
                                                                completedTasks: completedTasksCount,
                                                                payment: memberPayment
                                                            });
                                                        }
                                                    });
                                                }

                                                return casePayable > 0 ? (
                                                    <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center space-x-2">
                                                                <DollarSign className="h-4 w-4 text-red-600" />
                                                                <span className="text-sm font-medium text-red-800">Payable Summary</span>
                                                            </div>
                                                            <span className="text-lg font-bold text-red-700">
                                                                ${casePayable.toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2 text-xs">
                                                            {memberPayments.map((member, idx) => (
                                                                <div key={idx} className="flex items-center justify-between bg-white rounded p-2 border border-red-100">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Users className="h-3 w-3 text-red-600" />
                                                                        <span className="font-medium text-red-700">{member.name}</span>
                                                                        <span className="text-red-600">
                                                                            ({member.completedTasks} task{member.completedTasks !== 1 ? 's' : ''} × ${member.rate}/{member.rateType === 'HOURLY' ? 'hr' : 'task'})
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-bold text-red-700">
                                                                        ${member.payment.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })()}

                                            {/* Team Members and Rates */}
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <Users className="h-4 w-4" />
                                                    <span className="font-medium">Team Members & Rates:</span>
                                                </div>

                                                {caseItem.memberRates && caseItem.memberRates.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {caseItem.memberRates.map((rate) => {
                                                            // Calculate completed tasks count for this member
                                                            const completedTasksCount = caseItem.Tasks?.filter(task =>
                                                                task.status === 'DONE' &&
                                                                task.assignees?.some(assignee =>
                                                                    assignee.user_id === rate.user_id ||
                                                                    assignee.user?.user_id === rate.user_id
                                                                )
                                                            ).length || 0;

                                                            return (
                                                                <div key={rate.member_rate_id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center space-x-2">
                                                                                <span className="text-xs font-medium text-gray-700">
                                                                                    ID: {rate.user_id}
                                                                                </span>
                                                                                {rate.user && (
                                                                                    <span className="text-xs text-gray-500">
                                                                                        ({rate.user.name})
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center space-x-1 mt-1">
                                                                                <DollarSign className="h-3 w-3 text-green-500" />
                                                                                <span className="text-sm font-semibold text-green-600">
                                                                                    ${parseFloat(rate.rate_value).toFixed(2)}
                                                                                </span>
                                                                                <span className="text-xs text-gray-500">
                                                                                    {rate.rate_type === 'HOURLY' ? '/hr' : '/task'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center space-x-1 mt-1">
                                                                                <CheckCircle className="h-3 w-3 text-blue-500" />
                                                                                <span className="text-xs text-blue-600">
                                                                                    {completedTasksCount} completed task{completedTasksCount !== 1 ? 's' : ''}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-3 bg-gray-50 rounded-lg border border-gray-100">
                                                        <Users className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-500">No team member rates configured</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Completed Tasks with Billing */}
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <CheckCircle className="h-4 w-4" />
                                                    <span className="font-medium">Completed Tasks:</span>
                                                </div>

                                                {(() => {
                                                    // Filter completed tasks directly in the render for debugging
                                                    const completedTasks = caseItem.Tasks?.filter(task => task.status === 'DONE') || [];
                                                    console.log(`Rendering case ${caseItem.project_id} completed tasks:`, caseItem.completedTasks);
                                                    console.log(`Direct filter completed tasks:`, completedTasks);
                                                    console.log(`All tasks for case ${caseItem.project_id}:`, caseItem.Tasks);
                                                    return completedTasks.length > 0;
                                                })() ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {caseItem.Tasks?.filter(task => task.status === 'DONE').map((task) => {
                                                            // Find the task with billing data
                                                            const taskWithBilling = caseItem.completedTasks?.find(t => t.task_id === task.task_id);
                                                            const totalBillingAmount = taskWithBilling?.totalBillingAmount || 0;
                                                            const billingEntries = taskWithBilling?.billingEntries || [];

                                                            return (
                                                                <div key={task.task_id} className="bg-green-50 rounded-lg p-3 border border-green-100">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center space-x-2">
                                                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                                                <span className="text-xs font-medium text-gray-700">
                                                                                    Task ID: {task.task_id}
                                                                                </span>
                                                                            </div>
                                                                            <div className="mt-1">
                                                                                <p className="text-sm font-semibold text-gray-800">
                                                                                    {task.name}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                    {task.description}
                                                                                </p>
                                                                                <div className="flex items-center space-x-2 mt-1">
                                                                                    <span className="text-xs text-gray-500">
                                                                                        Phase: {task.phase}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-500">
                                                                                        Priority: {task.priority}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center space-x-1 mt-1">
                                                                                    <Clock className="h-3 w-3 text-blue-500" />
                                                                                    <span className="text-xs text-blue-600">
                                                                                        Completed: {new Date(task.updated_at).toLocaleDateString()}
                                                                                    </span>
                                                                                </div>

                                                                                {/* Assignees Information */}
                                                                                {task.assignees && task.assignees.length > 0 && (
                                                                                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                                                                        <div className="flex items-center space-x-1 mb-1">
                                                                                            <Users className="h-3 w-3 text-blue-600" />
                                                                                            <span className="text-xs font-medium text-blue-700">Assignees:</span>
                                                                                        </div>
                                                                                        <div className="space-y-1">
                                                                                            {task.assignees.map((assignee, idx) => (
                                                                                                <div key={idx} className="flex items-center space-x-2 text-xs">
                                                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                                                    <span className="text-blue-700">
                                                                                                        {assignee.user?.name || `User ID: ${assignee.user_id}`}
                                                                                                    </span>
                                                                                                    {assignee.user?.email && (
                                                                                                        <span className="text-blue-500">
                                                                                                            ({assignee.user.email})
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {/* Billing Information */}
                                                                                <div className="mt-2 p-2 bg-white rounded border border-green-200">
                                                                                    <div className="flex items-center justify-between mb-1">
                                                                                        <span className="text-xs font-medium text-gray-700">Billing Total:</span>
                                                                                        <span className="text-sm font-bold text-green-600">
                                                                                            ${totalBillingAmount.toFixed(2)}
                                                                                        </span>
                                                                                    </div>
                                                                                    {billingEntries.length > 0 && (
                                                                                        <div className="space-y-1">
                                                                                            {billingEntries.map((entry, idx) => (
                                                                                                <div key={idx} className="flex items-center justify-between text-xs">
                                                                                                    <div className="flex items-center space-x-1">
                                                                                                        {getBillingTypeIcon(entry.item_type)}
                                                                                                        <span className="text-gray-600">
                                                                                                            {getBillingTypeLabel(entry.item_type)}:
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <span className="font-medium text-gray-700">
                                                                                                        ${entry.total_amount?.toFixed(2) || '0.00'}
                                                                                                    </span>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                    {billingEntries.length === 0 && (
                                                                                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                                                            <AlertCircle className="h-3 w-3" />
                                                                                            <span>No billing entries yet</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-3 bg-gray-50 rounded-lg border border-gray-100">
                                                        <CheckCircle className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-500">
                                                            {caseItem.Tasks && caseItem.Tasks.length > 0
                                                                ? `No completed tasks (${caseItem.Tasks.length} total tasks available)`
                                                                : 'No tasks available'
                                                            }
                                                        </p>
                                                        {caseItem.Tasks && caseItem.Tasks.length > 0 && (
                                                            <div className="mt-2 text-xs text-gray-400">
                                                                Available task statuses: {caseItem.Tasks.map(t => t.status).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Billing Config Modal */}
            <BillingConfigModal
                isOpen={billingConfigModal.isOpen}
                onClose={handleCloseBillingConfig}
                caseId={billingConfigModal.caseId}
                caseName={billingConfigModal.caseName}
                onSuccess={handleBillingConfigSuccess}
            />
        </>
    );
};

export default BusinessStatus;