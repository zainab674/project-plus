import React, { useState, useEffect } from 'react';
import { X, DollarSign, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { setBillingConfigRequest, getBillingConfigRequest } from '@/lib/http/client';
import { toast } from 'react-toastify';

const BillingConfigModal = ({ isOpen, onClose, caseId, caseName, onSuccess }) => {
    const [billingMethod, setBillingMethod] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentConfig, setCurrentConfig] = useState(null);
    const [fetchingConfig, setFetchingConfig] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!billingMethod) {
            toast.error('Please select how the client will be billed');
            return;
        }

        if (billingMethod !== 'HOURLY' && (!amount || parseFloat(amount) <= 0)) {
            toast.error('Please enter a valid amount the client will pay');
            return;
        }

        setLoading(true);
        try {
            const formData = {
                case_id: caseId,
                billingMethod,
                amount: billingMethod === 'HOURLY' ? amount || 0 : amount
            };

            const response = await setBillingConfigRequest(formData);
            toast.success(response.data.message || 'Client billing setup successfully');

            // Reset form
            setBillingMethod('');
            setAmount('');

            // Close modal and refresh data
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to set client billing');
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentConfig = async () => {
        if (!caseId) return;

        setFetchingConfig(true);
        try {
            const response = await getBillingConfigRequest(caseId);
            const config = response.data.billingConfig;

            if (config) {
                setCurrentConfig(config);

                // Map boolean flags to billing method
                let method = '';
                if (config.is_taskbase) {
                    method = 'PER_TASK';
                    setAmount(config.task_amount || '');
                } else if (config.is_fullcase) {
                    method = 'PER_CASE';
                    setAmount(config.project_fee || '');
                } else if (config.is_hourly) {
                    method = 'HOURLY';
                    setAmount(config.hourly_rate || '');
                }

                setBillingMethod(method);
            }
        } catch (error) {
            // If no config found, that's fine - it means we're setting up for the first time
            console.log('No existing billing configuration found');
        } finally {
            setFetchingConfig(false);
        }
    };

    useEffect(() => {
        if (isOpen && caseId) {
            fetchCurrentConfig();
        }
    }, [isOpen, caseId]);

    const handleClose = () => {
        setBillingMethod('');
        setAmount('');
        setCurrentConfig(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Settings className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {currentConfig ? 'Update Client Billing' : 'Set Client Billing'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Configure how much client pays for: {caseName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Current Configuration Display */}
                {currentConfig && (
                    <div className="px-6 py-4 bg-green-50 border-b overflow-y-auto border-green-200">
                        <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                                <h4 className="text-sm font-medium text-green-800">Current Client Billing Setup</h4>
                                <div className="mt-1 text-sm text-green-700">
                                    <p><strong>Billing Type:</strong> {
                                        currentConfig.is_taskbase ? 'Per Task' :
                                            currentConfig.is_fullcase ? 'Per Case' :
                                                currentConfig.is_hourly ? 'Hourly' : 'Not Set'
                                    }</p>
                                    {currentConfig.is_taskbase && currentConfig.task_amount && (
                                        <p><strong>Client Pays Per Task:</strong> ${currentConfig.task_amount}</p>
                                    )}
                                    {currentConfig.is_fullcase && currentConfig.project_fee && (
                                        <p><strong>Client Pays:</strong> ${currentConfig.project_fee}</p>
                                    )}
                                    {currentConfig.is_hourly && currentConfig.hourly_rate && (
                                        <p><strong>Hourly Rate:</strong> ${currentConfig.hourly_rate}/hour</p>
                                    )}
                                    {currentConfig.memberRates && currentConfig.memberRates.length > 0 && (
                                        <p><strong>Team Members:</strong> {currentConfig.memberRates.length} will receive payments</p>
                                    )}
                                    <p><strong>Last Updated:</strong> {new Date(currentConfig.updated_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form */}
                {fetchingConfig ? (
                    <div className="p-6 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading current configuration...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Billing Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                How Client Will Be Billed *
                            </label>
                            <select
                                value={billingMethod}
                                onChange={(e) => setBillingMethod(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                required
                            >
                                <option value="">Select how client will be charged</option>
                                <option value="PER_TASK">Per Task - Client pays for each completed task</option>
                                <option value="PER_CASE">Per Case - Client pays fixed amount for entire case</option>
                                <option value="HOURLY">Hourly - Client pays based on time spent</option>
                            </select>
                        </div>

                        {/* Amount Input */}
                        {billingMethod && billingMethod !== 'HOURLY' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {billingMethod === 'PER_TASK' ? 'Amount Client Will Pay Per Task *' : 'Amount Client Will Pay *'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder={billingMethod === 'PER_TASK' ? "Enter amount client will pay per task" : "Enter amount client will pay"}
                                        min="0"
                                        step="0.01"
                                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Hourly Rate Input */}
                        {billingMethod === 'HOURLY' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Default Hourly Rate (Optional)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter default hourly rate for team members"
                                        min="0"
                                        step="0.01"
                                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                    />
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    This is the default rate. Individual team members can have different rates set later.
                                </p>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Client Billing Options:</p>
                                    <ul className="space-y-1 text-xs">
                                        <li><strong>Per Task:</strong> Client pays a fixed amount for each completed task</li>
                                        <li><strong>Per Case:</strong> Client pays one fixed amount for the entire case</li>
                                        <li><strong>Hourly:</strong> Client pays based on actual time spent by team members</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || fetchingConfig}
                                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Setting...' : fetchingConfig ? 'Loading...' : (currentConfig ? 'Update Client Billing' : 'Set Client Billing')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default BillingConfigModal; 