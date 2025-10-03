import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock, FileText, Users, CheckCircle, AlertCircle, RefreshCw, Trash2, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import { getProjectBillingEntriesRequest, deleteBillingEntryRequest, updateBillingEntryRequest } from '@/lib/http/client';
import { toast } from 'react-toastify';
import moment from 'moment';

const BillingEntriesModal = ({ isOpen, onClose, projectId, projectName, onEntryDeleted }) => {
    const [billingEntries, setBillingEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deletingEntry, setDeletingEntry] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState(null);
    const [editingEntry, setEditingEntry] = useState(null);
    const [editForm, setEditForm] = useState({
        description: '',
        quantity: '',
        unit_rate: ''
    });
    const [summary, setSummary] = useState({
        total: 0,
        taskBased: 0,
        hourly: 0,
        review: 0,
        meeting: 0
    });
    const [groupedEntries, setGroupedEntries] = useState({});
    const [expandedTasks, setExpandedTasks] = useState(new Set());

    useEffect(() => {
        if (isOpen && projectId) {
            fetchBillingEntries();
        }
    }, [isOpen, projectId]);

    const fetchBillingEntries = async () => {
        setLoading(true);
        try {
            const response = await getProjectBillingEntriesRequest(projectId);
            console.log("these are billing entries", response.data.billingEntries)
            setBillingEntries(response.data.billingEntries || []);
            calculateSummary(response.data.billingEntries || []);
            groupEntriesByTask(response.data.billingEntries || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to fetch billing entries');
        } finally {
            setLoading(false);
        }
    };

    const groupEntriesByTask = (entries) => {
        const grouped = {};
        
        entries.forEach(entry => {
            if (entry.task && entry.task.task_id) {
                const taskId = entry.task.task_id;
                if (!grouped[taskId]) {
                    grouped[taskId] = {
                        task: entry.task,
                        entries: [],
                        totalAmount: 0
                    };
                }
                grouped[taskId].entries.push(entry);
                grouped[taskId].totalAmount += entry.total_amount || 0;
            } else {
                // For entries without task (like meetings, reviews, etc.)
                const key = `other_${entry.item_type}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        task: { name: `${entry.item_type} Activities`, task_id: key },
                        entries: [],
                        totalAmount: 0
                    };
                }
                grouped[key].entries.push(entry);
                grouped[key].totalAmount += entry.total_amount || 0;
            }
        });

        setGroupedEntries(grouped);
    };

    const toggleTaskExpansion = (taskId) => {
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedTasks(newExpanded);
    };

    const calculateSummary = (entries) => {
        const summary = {
            total: 0,
            taskBased: 0,
            hourly: 0,
            review: 0,
            meeting: 0
        };

        entries.forEach(entry => {
            summary.total += entry.total_amount || 0;

            switch (entry.item_type) {
                case 'TASK':
                    summary.taskBased += entry.total_amount || 0;
                    break;
                case 'TIME':
                    summary.hourly += entry.total_amount || 0;
                    break;
                case 'REVIEW':
                    summary.review += entry.total_amount || 0;
                    break;
                case 'MEETING':
                    summary.meeting += entry.total_amount || 0;
                    break;
            }
        });

        setSummary(summary);
    };

    const handleDeleteClick = (entry) => {
        setEntryToDelete(entry);
        setShowDeleteConfirm(true);
    };

    const handleEditClick = (entry) => {
        setEntryToEdit(entry);
        setEditForm({
            description: entry.description || '',
            quantity: entry.quantity?.toString() || '',
            unit_rate: entry.unit_rate?.toString() || ''
        });
        setShowEditModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!entryToDelete) return;

        setDeletingEntry(entryToDelete.line_item_id);
        try {
            await deleteBillingEntryRequest(entryToDelete.line_item_id);
            toast.success('Billing entry deleted successfully');

            // Remove the entry from the local state
            const updatedEntries = billingEntries.filter(entry => entry.line_item_id !== entryToDelete.line_item_id);
            setBillingEntries(updatedEntries);

            // Recalculate summary and grouped entries
            calculateSummary(updatedEntries);
            groupEntriesByTask(updatedEntries);

            // Notify parent component to refresh billing status
            if (onEntryDeleted) {
                onEntryDeleted(entryToDelete);
            }

        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete billing entry');
        } finally {
            setDeletingEntry(null);
            setShowDeleteConfirm(false);
            setEntryToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setEntryToDelete(null);
    };

    const handleEditConfirm = async () => {
        if (!entryToEdit) return;

        setEditingEntry(entryToEdit.line_item_id);
        try {
            const response = await updateBillingEntryRequest(entryToEdit.line_item_id, editForm);
            toast.success('Billing entry updated successfully');

            // Update the entry in the local state
            const updatedEntries = billingEntries.map(entry =>
                entry.line_item_id === entryToEdit.line_item_id
                    ? { ...entry, ...response.data.updatedEntry }
                    : entry
            );
            setBillingEntries(updatedEntries);

            // Recalculate summary and grouped entries
            calculateSummary(updatedEntries);
            groupEntriesByTask(updatedEntries);

            // Notify parent component to refresh billing status
            if (onEntryDeleted) {
                onEntryDeleted(entryToEdit);
            }

        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update billing entry');
        } finally {
            setEditingEntry(null);
            setShowEditModal(false);
            setEntryToEdit(null);
            setEditForm({
                description: '',
                quantity: '',
                unit_rate: ''
            });
        }
    };

    const handleEditCancel = () => {
        setShowEditModal(false);
        setEntryToEdit(null);
        setEditForm({
            description: '',
            quantity: '',
            unit_rate: ''
        });
    };

    const getBillingTypeIcon = (itemType) => {
        switch (itemType) {
            case 'TASK':
                return <FileText className="h-4 w-4 text-blue-600" />;
            case 'TIME':
                return <Clock className="h-4 w-4 text-green-600" />;
            case 'REVIEW':
                return <CheckCircle className="h-4 w-4 text-purple-600" />;
            case 'MEETING':
                return <Users className="h-4 w-4 text-orange-600" />;
            default:
                return <DollarSign className="h-4 w-4 text-gray-600" />;
        }
    };

    const getBillingTypeLabel = (itemType) => {
        switch (itemType) {
            case 'TASK':
                return 'Task-Based';
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

    const getBillingTypeColor = (itemType) => {
        switch (itemType) {
            case 'TASK':
                return 'bg-blue-100 text-blue-800';
            case 'TIME':
                return 'bg-green-100 text-green-800';
            case 'REVIEW':
                return 'bg-purple-100 text-purple-800';
            case 'MEETING':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleClose = () => {
        setBillingEntries([]);
        setGroupedEntries({});
        setExpandedTasks(new Set());
        setSummary({
            total: 0,
            taskBased: 0,
            hourly: 0,
            review: 0,
            meeting: 0
        });
        setDeletingEntry(null);
        setShowDeleteConfirm(false);
        setEntryToDelete(null);
        setShowEditModal(false);
        setEntryToEdit(null);
        setEditingEntry(null);
        setEditForm({
            description: '',
            quantity: '',
            unit_rate: ''
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Billing Entries
                            </h3>
                            <p className="text-sm text-gray-500">
                                Auto-generated billing for: {projectName}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={fetchBillingEntries}
                            disabled={loading}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        ${summary.total.toFixed(2)}
                                    </p>
                                </div>
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Task-Based</p>
                                    <p className="text-lg font-semibold text-blue-600">
                                        ${summary.taskBased.toFixed(2)}
                                    </p>
                                </div>
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Hourly</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        ${summary.hourly.toFixed(2)}
                                    </p>
                                </div>
                                <Clock className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Reviews</p>
                                    <p className="text-lg font-semibold text-purple-600">
                                        ${summary.review.toFixed(2)}
                                    </p>
                                </div>
                                <CheckCircle className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Meetings</p>
                                    <p className="text-lg font-semibold text-orange-600">
                                        ${summary.meeting.toFixed(2)}
                                    </p>
                                </div>
                                <Users className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Billing Entries List */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading billing entries...</p>
                        </div>
                    ) : billingEntries.length === 0 ? (
                        <div className="text-center py-8">
                            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No billing entries</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Billing entries will be generated automatically when tasks are completed, meetings are held, or reviews are submitted.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Header */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="text-sm text-gray-600">
                                            <span className="font-semibold">{Object.keys(groupedEntries).length}</span> tasks/activities
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <span className="font-semibold">{billingEntries.length}</span> total entries
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <span className="font-semibold">${summary.total.toFixed(2)}</span> total amount
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {Object.entries(groupedEntries).map(([key, group]) => (
                                    <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                                {String(group.task.task_id).startsWith('other_') ? (
                                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                                ) : (
                                                    <ChevronDown
                                                        className={`h-4 w-4 text-gray-500 cursor-pointer transition-transform ${expandedTasks.has(String(group.task.task_id)) ? 'rotate-90' : ''}`}
                                                        onClick={() => toggleTaskExpansion(String(group.task.task_id))}
                                                    />
                                                )}
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-gray-900">{group.task.name}</span>
                                                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                                        {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                                                    </span>
                                                    {!String(group.task.task_id).startsWith('other_') && group.task.status && (
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            group.task.status === 'DONE' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {group.task.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-sm text-gray-600">
                                                    Total: ${group.totalAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                        {expandedTasks.has(String(group.task.task_id)) && (
                                            <div className="pl-4 space-y-4">
                                                {group.entries.map((entry) => (
                                                    <div
                                                        key={entry.line_item_id}
                                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-3 mb-2">
                                                                    {getBillingTypeIcon(entry.item_type)}
                                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBillingTypeColor(entry.item_type)}`}>
                                                                        {getBillingTypeLabel(entry.item_type)}
                                                                    </span>
                                                                    <span className="text-sm text-gray-500">
                                                                        {moment(entry.created_at).format('MMM DD, YYYY HH:mm')}
                                                                    </span>
                                                                </div>

                                                                <h4 className="text-sm font-medium text-gray-900 mb-1">
                                                                    {entry.description}
                                                                </h4>

                                                                {entry.user && (
                                                                    <p className="text-sm text-gray-600 mb-2">
                                                                        By: {entry.user.name}
                                                                    </p>
                                                                )}

                                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                                    <span>Quantity: {entry.quantity}</span>
                                                                    <span>Rate: ${entry.unit_rate?.toFixed(2)}</span>
                                                                    <span className="font-medium text-green-600">
                                                                        Total: ${entry.total_amount?.toFixed(2)}
                                                                    </span>
                                                                </div>

                                                                {/* Related item details */}
                                                                {entry.task && (
                                                                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                                                                        Task: {entry.task.name} ({entry.task.status})
                                                                    </div>
                                                                )}
                                                                {entry.item_type === 'MEETING' && (
                                                                    <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-700">
                                                                        Meeting: {entry.description.replace('Meeting: ', '')}
                                                                    </div>
                                                                )}
                                                                {entry.item_type === 'REVIEW' && (
                                                                    <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-700">
                                                                        Review: {entry.description.replace('Review: ', '')}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="ml-4 flex space-x-2">
                                                                <button
                                                                    onClick={() => handleEditClick(entry)}
                                                                    disabled={editingEntry === entry.line_item_id}
                                                                    className={`p-2 rounded-lg transition-colors ${editingEntry === entry.line_item_id
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700'
                                                                        }`}
                                                                    title="Edit billing entry"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(entry)}
                                                                    disabled={deletingEntry === entry.line_item_id}
                                                                    className={`p-2 rounded-lg transition-colors ${deletingEntry === entry.line_item_id
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                                                                        }`}
                                                                    title="Delete billing entry"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && entryToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <Trash2 className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Delete Billing Entry
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-gray-700 mb-2">
                                    Are you sure you want to delete this billing entry?
                                </p>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm font-medium text-gray-900">
                                        {entryToDelete.description}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Amount: ${entryToDelete.total_amount?.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Type: {getBillingTypeLabel(entryToDelete.item_type)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={handleDeleteCancel}
                                    disabled={deletingEntry === entryToDelete.line_item_id}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={deletingEntry === entryToDelete.line_item_id}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    {deletingEntry === entryToDelete.line_item_id ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            <span>Delete</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Billing Entry Modal */}
            {showEditModal && entryToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Edit className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Edit Billing Entry
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Update billing entry details
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.description}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter description"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editForm.quantity}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter quantity"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit Rate ($)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editForm.unit_rate}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, unit_rate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter unit rate"
                                    />
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Current Total:</span> ${entryToEdit.total_amount?.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">New Total:</span> ${(parseFloat(editForm.quantity || 0) * parseFloat(editForm.unit_rate || 0)).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={handleEditCancel}
                                    disabled={editingEntry === entryToEdit.line_item_id}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditConfirm}
                                    disabled={editingEntry === entryToEdit.line_item_id || !editForm.description || !editForm.quantity || !editForm.unit_rate}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    {editingEntry === entryToEdit.line_item_id ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Edit className="h-4 w-4" />
                                            <span>Update</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingEntriesModal; 