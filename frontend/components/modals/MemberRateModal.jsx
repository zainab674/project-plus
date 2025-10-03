import React, { useState, useEffect } from 'react';
import { X, DollarSign, Users, AlertCircle, Plus, Edit } from 'lucide-react';
import { setMemberRateRequest, getMemberRatesRequest } from '@/lib/http/client';
import { toast } from 'react-toastify';

const MemberRateModal = ({ isOpen, onClose, caseId, caseName, teamMembers, onSuccess }) => {
    const [memberRates, setMemberRates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingRates, setFetchingRates] = useState(false);
    const [editingRate, setEditingRate] = useState(null);

    // Form state for new/edit rate
    const [formData, setFormData] = useState({
        member_id: '',
        rateType: '',
        rateValue: ''
    });

    // Fetch existing member rates when modal opens
    useEffect(() => {
        if (isOpen && caseId) {
            console.log('MemberRateModal opened with caseId:', caseId);
            console.log('Team members received:', teamMembers);
            console.log('Team members structure:', teamMembers?.map(m => ({ user_id: m.user_id, name: m.name, email: m.email })));
            fetchMemberRates();
        }
    }, [isOpen, caseId, teamMembers]);

    const fetchMemberRates = async () => {
        setFetchingRates(true);
        try {
            const response = await getMemberRatesRequest(caseId);
            setMemberRates(response.data.memberRates || []);
        } catch (error) {
            console.error('Failed to fetch member rates:', error);
        } finally {
            setFetchingRates(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.member_id || !formData.rateType || !formData.rateValue) {
            toast.error('Please fill all required fields');
            return;
        }

        if (parseFloat(formData.rateValue) <= 0) {
            toast.error('Rate value must be greater than 0');
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                case_id: caseId,
                member_id: formData.member_id,
                rateType: formData.rateType,
                rateValue: formData.rateValue
            };

            const response = await setMemberRateRequest(requestData);
            toast.success(response.data.message || 'Member rate set successfully');

            // Reset form
            setFormData({
                member_id: '',
                rateType: '',
                rateValue: ''
            });
            setEditingRate(null);

            // Refresh member rates
            await fetchMemberRates();

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to set member rate');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rate) => {
        setEditingRate(rate);
        setFormData({
            member_id: rate.user_id.toString(),
            rateType: rate.rate_type,
            rateValue: rate.rate_value.toString()
        });
    };

    const handleCancelEdit = () => {
        setEditingRate(null);
        setFormData({
            member_id: '',
            rateType: '',
            rateValue: ''
        });
    };

    const handleClose = () => {
        setFormData({
            member_id: '',
            rateType: '',
            rateValue: ''
        });
        setEditingRate(null);
        setMemberRates([]);
        onClose();
    };

    const getMemberName = (memberId) => {
        console.log('Looking for member with ID:', memberId, 'in team members:', teamMembers);
        const member = teamMembers?.find(m => m.user_id === memberId || m.user_id?.toString() === memberId?.toString());
        console.log('Found member:', member);
        return member ? member.name : 'Unknown Member';
    };

    const getRateTypeLabel = (rateType) => {
        return rateType === 'HOURLY' ? 'Hourly Rate' : 'Per Task Rate';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white overflow-y-auto rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Member Rates Configuration
                            </h3>
                            <p className="text-sm text-gray-500">
                                Set rates for team members: {caseName}
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

                <div className="flex h-[calc(90vh-120px)]">
                    {/* Left Side - Add/Edit Form */}
                    <div className="w-1/2 p-6 border-r border-gray-200">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">
                            {editingRate ? 'Edit Member Rate' : 'Add New Member Rate'}
                        </h4>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Member Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Team Member *
                                </label>
                                <select
                                    value={formData.member_id}
                                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    required
                                    disabled={editingRate || !teamMembers || teamMembers.length === 0}
                                >
                                    <option value="">
                                        {!teamMembers || teamMembers.length === 0
                                            ? "No team members available"
                                            : "Select team member"
                                        }
                                    </option>
                                    {teamMembers?.map((member) => (
                                        <option key={member.user_id} value={member.user_id}>
                                            {member.name} {member.email ? `(${member.email})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {(!teamMembers || teamMembers.length === 0) && (
                                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start space-x-2">
                                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-red-700">
                                                <p className="font-medium">No team members found</p>
                                                <p className="text-xs mt-1">
                                                    Please check if the case has team members assigned.
                                                    You may need to add team members to this case before configuring rates.
                                                </p>
                                                <div className="mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onClose();
                                                            // You can add navigation logic here if needed
                                                            toast.info('Please add team members to this case through the case settings before configuring rates.');
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                                    >
                                                        Close & Add Team Members
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <p className="mt-1 text-sm text-gray-500">
                                    Team members available: {teamMembers?.length || 0}
                                </p>
                            </div>

                            {/* Rate Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rate Type *
                                </label>
                                <select
                                    value={formData.rateType}
                                    onChange={(e) => setFormData({ ...formData, rateType: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    required
                                >
                                    <option value="">Select rate type</option>
                                    <option value="HOURLY">Hourly Rate</option>
                                    <option value="PER_TASK">Per Task Rate</option>
                                </select>
                            </div>

                            {/* Rate Value */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rate Value *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={formData.rateValue}
                                        onChange={(e) => setFormData({ ...formData, rateValue: e.target.value })}
                                        placeholder="Enter rate value"
                                        min="0"
                                        step="0.01"
                                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    {formData.rateType === 'HOURLY' ? 'Amount per hour' : 'Amount per task'}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end space-x-3 pt-4">
                                {editingRate && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Saving...' : (editingRate ? 'Update Rate' : 'Add Rate')}
                                </button>
                            </div>
                        </form>

                        {/* Info Box */}
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Rate Type Details:</p>
                                    <ul className="space-y-1 text-xs">
                                        <li><strong>Hourly Rate:</strong> Bill based on time spent on tasks</li>
                                        <li><strong>Per Task Rate:</strong> Fixed amount for each completed task</li>
                                    </ul>
                                    {(!teamMembers || teamMembers.length === 0) && (
                                        <div className="mt-3 pt-3 border-t border-blue-200">
                                            <p className="font-medium text-orange-700">No Team Members Found</p>
                                            <p className="text-xs text-orange-600 mt-1">
                                                To configure member rates, you need to first add team members to this case.
                                                Go to the case settings and add team members before returning here.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Existing Rates */}
                    <div className="w-1/2 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-md font-semibold text-gray-900">
                                Current Member Rates
                            </h4>
                            {fetchingRates && (
                                <div className="text-sm text-gray-500">Loading...</div>
                            )}
                        </div>

                        {memberRates.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    {(!teamMembers || teamMembers.length === 0)
                                        ? "No team members available"
                                        : "No rates configured"
                                    }
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {(!teamMembers || teamMembers.length === 0)
                                        ? "Add team members to this case to configure their rates."
                                        : "Add rates for team members to get started."
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[calc(90vh-300px)] overflow-y-auto">
                                {memberRates.map((rate) => (
                                    <div
                                        key={rate.member_rate_id}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h5 className="text-sm font-medium text-gray-900">
                                                    {getMemberName(rate.user_id)}
                                                </h5>
                                                <p className="text-xs text-gray-500">
                                                    {getRateTypeLabel(rate.rate_type)}
                                                </p>
                                                <p className="text-sm font-semibold text-green-600">
                                                    ${parseFloat(rate.rate_value).toFixed(2)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleEdit(rate)}
                                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Edit rate"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberRateModal; 