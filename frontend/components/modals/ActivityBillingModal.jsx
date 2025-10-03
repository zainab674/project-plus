'use client';

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock, FileText, CheckCircle, Users, Calculator, Save, AlertTriangle } from 'lucide-react';
import { createCustomBillingLineItemRequest, checkProjectBillingReadinessRequest } from '@/lib/http/client';
import { toast } from 'react-toastify';
import moment from 'moment';

const ActivityBillingModal = ({ isOpen, onClose, activity, activityType, projectId, projectName, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [billingReadiness, setBillingReadiness] = useState(null);
    const [billingData, setBillingData] = useState({
        description: '',
        quantity: 1,
        unit_rate: 0,
        total_amount: 0
    });

    useEffect(() => {
        if (isOpen && projectId) {
            initializeBillingData();
            checkBillingReadiness();
        }
    }, [isOpen, activity, activityType, projectId]);

    const checkBillingReadiness = async () => {
        try {
            const response = await checkProjectBillingReadinessRequest(projectId);
            setBillingReadiness(response.data);
        } catch (error) {
            console.error('Failed to check billing readiness:', error);
            setBillingReadiness({
                ready: false,
                message: 'Failed to check billing readiness',
                missing: ['unknown']
            });
        }
    };

    const initializeBillingData = () => {
        let description = '';
        let quantity = 1;
        let unit_rate = 0;

        switch (activityType) {
            case 'TASK':
                description = `Task: ${activity.name}`;
                quantity = 1;
                unit_rate = 150; // Default task rate
                break;
            case 'TIME':
                const startTime = moment(activity.start);
                const endTime = moment(activity.end);
                const duration = endTime.diff(startTime, 'hours', true);
                description = `Time: ${activity.work_description}`;
                quantity = Math.max(0.1, duration); // Minimum 0.1 hours
                unit_rate = 200; // Default hourly rate
                break;
            case 'PROGRESS':
                description = `Progress: ${activity.message}`;
                quantity = 1;
                unit_rate = 50; // Default progress rate
                break;
            case 'REVIEW':
                description = `Review: ${activity.submissionDesc}`;
                quantity = 1;
                unit_rate = 100; // Default review rate
                break;
            default:
                description = 'Activity Billing';
                quantity = 1;
                unit_rate = 100;
        }

        const total_amount = quantity * unit_rate;

        setBillingData({
            description,
            quantity,
            unit_rate,
            total_amount
        });
    };

    const handleInputChange = (field, value) => {
        const newData = { ...billingData, [field]: value };

        // Recalculate total amount
        if (field === 'quantity' || field === 'unit_rate') {
            newData.total_amount = newData.quantity * newData.unit_rate;
        }

        setBillingData(newData);
    };

    const getActivityIcon = () => {
        switch (activityType) {
            case 'TASK':
                return <FileText className="h-6 w-6 text-blue-600" />;
            case 'TIME':
                return <Clock className="h-6 w-6 text-green-600" />;
            case 'PROGRESS':
                return <CheckCircle className="h-6 w-6 text-purple-600" />;
            case 'REVIEW':
                return <Users className="h-6 w-6 text-orange-600" />;
            default:
                return <DollarSign className="h-6 w-6 text-gray-600" />;
        }
    };

    const getActivityTypeLabel = () => {
        switch (activityType) {
            case 'TASK':
                return 'Task Billing';
            case 'TIME':
                return 'Time Billing';
            case 'PROGRESS':
                return 'Progress Billing';
            case 'REVIEW':
                return 'Review Billing';
            default:
                return 'Activity Billing';
        }
    };

    const getActivityTypeColor = () => {
        switch (activityType) {
            case 'TASK':
                return 'bg-blue-100 text-blue-800';
            case 'TIME':
                return 'bg-green-100 text-green-800';
            case 'PROGRESS':
                return 'bg-purple-100 text-purple-800';
            case 'REVIEW':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Check billing readiness first
            if (!billingReadiness?.ready) {
                const missingItems = billingReadiness?.missing || [];
                let message = 'Project is not ready for billing. ';

                if (missingItems.includes('biller')) {
                    message += 'A biller must be assigned to the project. ';
                }

                toast.error(message);
                setLoading(false);
                return;
            }

            const billingPayload = {
                project_id: projectId,
                item_type: activityType,
                description: billingData.description,
                quantity: billingData.quantity,
                unit_rate: billingData.unit_rate,
                total_amount: billingData.total_amount,
                user_id: activity?.user?.user_id || activity?.user_id,
                task_id: activity?.task_id || null,
                time_entries: activityType === 'TIME' ? [activity?.time_id] : []
            };

            const response = await createCustomBillingLineItemRequest(billingPayload);
            toast.success('Billing entry created successfully!');

            if (onSuccess) {
                const activityId = activityType === 'TASK' ? activity?.task_id :
                                  activityType === 'PROGRESS' ? activity?.progress_id :
                                  activityType === 'TIME' ? activity?.time_id :
                                  activityType === 'REVIEW' ? activity?.review_id : null;
                onSuccess(activityType, activityId);
            }

            onClose();
        } catch (error) {
            console.error('Error creating billing entry:', error);
            const errorMessage = error?.response?.data?.message || 'Failed to create billing entry';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setBillingData({
            description: '',
            quantity: 1,
            unit_rate: 0,
            total_amount: 0
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white overflow-y-auto rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Bill {activityType} Activity
                            </h3>
                            <p className="text-sm text-gray-500">
                                {projectName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Billing Readiness Status */}
                {billingReadiness && (
                    <div className={`px-6 py-3 border-b ${billingReadiness.ready
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-center space-x-2">
                            {billingReadiness.ready ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${billingReadiness.ready ? 'text-green-800' : 'text-red-800'
                                }`}>
                                {billingReadiness.message}
                            </span>
                        </div>
                        {!billingReadiness.ready && billingReadiness.missing && (
                            <div className="mt-1 text-xs text-red-600">
                                Missing: {billingReadiness.missing.join(', ')}
                            </div>
                        )}
                    </div>
                )}

                {/* Activity Details */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActivityTypeColor()}`}>
                            {getActivityTypeLabel()}
                        </span>
                        <span className="text-sm text-gray-500">
                            {moment(activity?.created_at).format('MMM DD, YYYY HH:mm')}
                        </span>
                    </div>

                    <div className="space-y-2 text-sm">
                        {activityType === 'TASK' && (
                            <>
                                <p><strong>Task:</strong> {activity.name}</p>
                                <p><strong>Status:</strong> {activity.status}</p>
                                <p><strong>Priority:</strong> {activity.priority}</p>
                                <p><strong>Phase:</strong> {activity.phase}</p>
                            </>
                        )}
                        {activityType === 'TIME' && (
                            <>
                                <p><strong>Work Description:</strong> {activity.work_description}</p>
                                <p><strong>Duration:</strong> {moment(activity.start).format('LT')} - {moment(activity.end).format('LT')}</p>
                                <p><strong>Date:</strong> {moment(activity.created_at).format('LL')}</p>
                            </>
                        )}
                        {activityType === 'PROGRESS' && (
                            <>
                                <p><strong>Message:</strong> {activity.message}</p>
                                <p><strong>Type:</strong> {activity.type}</p>
                            </>
                        )}
                        {activityType === 'REVIEW' && (
                            <>
                                <p><strong>Submission:</strong> {activity.submissionDesc}</p>
                                <p><strong>Action:</strong> {activity.action || 'N/A'}</p>
                            </>
                        )}
                        <p><strong>User:</strong> {activity.user?.name || activity.submitted_by?.name || activity.creator?.name}</p>
                    </div>
                </div>

                {/* Billing Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={billingData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                rows={3}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    value={billingData.quantity}
                                    onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    step="0.1"
                                    min="0"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unit Rate ($)
                                </label>
                                <input
                                    type="number"
                                    value={billingData.unit_rate}
                                    onChange={(e) => handleInputChange('unit_rate', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-800">Total Amount:</span>
                                <span className="text-lg font-semibold text-green-900">
                                    ${billingData.total_amount.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !billingReadiness?.ready}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            <span>
                                {loading ? 'Creating...' :
                                    !billingReadiness?.ready ? 'Project Not Ready for Billing' :
                                        'Create Billing Entry'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ActivityBillingModal; 