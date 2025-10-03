


import React, { useCallback, useState, useEffect } from 'react';
import { Plus, X, Calendar, User, FileText, AlertCircle, Briefcase, Edit, Layers, Users, ChevronDown } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import { updateProjectRequest } from '@/lib/http/project';
import { toast } from 'react-toastify';
import Loader from '../Loader';
import { getTeamMembersRequest } from '@/lib/http/auth';
import { Avatar } from '@radix-ui/react-avatar';
import { AvatarFallback } from '../ui/avatar';
import { getNameAvatar } from '@/utils/getNameAvatar';
import { Checkbox } from '../ui/checkbox';

const UpdateCaseModal = ({ onClose, caseToUpdate }) => {
    console.log("casetoupdae", caseToUpdate.project_id)
    const [isLoading, setIsLoading] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [caseData, setCaseData] = useState({
        name: '',
        opposing: '',
        client_name: '',
        client_address: '',
        status: 'Pending',
        budget: 0,
        priority: 'Medium',
        filingDate: new Date().toISOString(),
        description: '',
        phases: []
    });
    const [phaseInput, setPhaseInput] = useState('');

    // Initialize form with existing case data
    useEffect(() => {
        if (caseToUpdate) {
            setCaseData({
                name: caseToUpdate.name || '',
                opposing: caseToUpdate.opposing || '',
                client_name: caseToUpdate.client_name || '',
                client_address: caseToUpdate.client_address || '',
                status: caseToUpdate.status || 'Pending',
                budget: caseToUpdate.budget || 0,
                priority: caseToUpdate.priority || 'Medium',
                filingDate: caseToUpdate.filingDate || new Date().toISOString(),
                description: caseToUpdate.description || '',
                phases: caseToUpdate.phases || []
            });
        }
    }, [caseToUpdate]);


    // Load all team members
    const loadTeamMembers = useCallback(async () => {
        try {
            const res = await getTeamMembersRequest();
            console.log('Team members response:', res.data.teamMembers);
            setTeamMembers(res.data.teamMembers || []);

            // Set preselected members from caseToUpdate.Members
            const selectedIds = (caseToUpdate?.Members || []).map(m => m.user_id);
            console.log('Preselected members:', selectedIds);
            setSelectedTeamMembers(selectedIds);
        } catch (err) {
            console.error('Error loading team members', err);
        }
    }, [caseToUpdate?.Members]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            console.log('Submitting with selectedTeamMembers:', selectedTeamMembers);
            const res = await updateProjectRequest({ ...caseData, selectedTeamMembers }, caseToUpdate.project_id);
            toast.success('Case updated successfully');
            onClose();
        } catch (error) {
            console.error('Update error:', error);
            toast.error(error?.response?.data?.message || error?.message || 'Failed to update case');
        } finally {
            setIsLoading(false);
        }
    }, [caseData, selectedTeamMembers, caseToUpdate?.project_id, onClose]);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-700 border-red-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Settled': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Format date for input field
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const addPhase = () => {
        if (phaseInput.trim() && !caseData.phases.includes(phaseInput.trim())) {
            setCaseData(prev => ({
                ...prev,
                phases: [...prev.phases, phaseInput.trim()]
            }));
            setPhaseInput('');
        }
    };

    const removePhase = (indexToRemove) => {
        setCaseData(prev => ({
            ...prev,
            phases: prev.phases.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handlePhaseInputKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addPhase();
        }
    };

    useEffect(() => {
        loadTeamMembers();
    }, [loadTeamMembers]);

    const handleTeamMemberToggle = (memberId) => {
        console.log('Toggling member:', memberId);
        setSelectedTeamMembers(prev => {
            const newSelection = prev.includes(memberId) 
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId];
            console.log('New selection:', newSelection);
            return newSelection;
        });
    };

    const getSelectedMembersText = () => {
        if (selectedTeamMembers.length === 0) {
            return "Select team members";
        }
        if (selectedTeamMembers.length === 1) {
            const member = teamMembers.find(m => m.user.user_id === selectedTeamMembers[0]);
            return member ? member.user.name : "1 member selected";
        }
        return `${selectedTeamMembers.length} members selected`;
    };

    return (
        <Modal title="Update Case" onClose={onClose}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="flex items-center text-base font-semibold text-slate-700 mb-2">
                            <FileText className="w-4 h-4 mr-2 text-slate-500" />
                            Case Title
                        </label>
                        <input
                            type="text"
                            value={caseData.name}
                            onChange={(e) => setCaseData({ ...caseData, name: e.target.value })}
                            className="w-full p-3 border border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors bg-white"
                            placeholder="Enter case title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center text-base font-semibold text-slate-700 mb-2">
                            <User className="w-4 h-4 mr-2 text-slate-500" />
                            Client Name
                        </label>
                        <input
                            type="text"
                            value={caseData.client_name}
                            onChange={(e) => setCaseData({ ...caseData, client_name: e.target.value })}
                            className="w-full p-3 border border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors bg-white"
                            placeholder="Enter client name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center text-base font-semibold text-slate-700 mb-2">
                            <User className="w-4 h-4 mr-2 text-slate-500" />
                            Client Address
                        </label>
                        <input
                            type="text"
                            value={caseData.client_address}
                            onChange={(e) => setCaseData({ ...caseData, client_address: e.target.value })}
                            className="w-full p-3 border border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors bg-white"
                            placeholder="Enter client Address"
                            required
                        />
                    </div>



                    <div className="space-y-2">
                        <label className="flex items-center text-base font-semibold text-slate-700 mb-2">
                            <User className="w-4 h-4 mr-2 text-slate-500" />
                            Opposing Party
                        </label>
                        <input
                            type="text"
                            value={caseData.opposing}
                            onChange={(e) => setCaseData({ ...caseData, opposing: e.target.value })}
                            className="w-full p-3 border border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors bg-white"
                            placeholder="Enter opposing party name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center text-base font-semibold text-slate-700 mb-2">
                            <AlertCircle className="w-4 h-4 mr-2 text-slate-500" />
                            Priority Level
                        </label>
                        <select
                            value={caseData.priority}
                            onChange={(e) => setCaseData({ ...caseData, priority: e.target.value })}
                            className="w-full p-3 border text-sm font-medium border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors bg-white"
                        >
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                        </select>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(caseData.priority)}`}>
                            {caseData.priority} Priority
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center text-base font-semibold text-slate-700 mb-2">
                            <AlertCircle className="w-4 h-4 mr-2 text-slate-500" />
                            Case Status
                        </label>
                        <select
                            value={caseData.status}
                            onChange={(e) => setCaseData({ ...caseData, status: e.target.value })}
                            className="w-full p-3 border text-sm font-medium border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors bg-white"
                        >
                            <option>Pending</option>
                            <option>Active</option>
                            <option>Settled</option>
                        </select>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseData.status)}`}>
                            {caseData.status} Status
                        </div>
                    </div>

                    <div className="space-y-2 ">
                        <label className="flex items-center text-base font-semibold text-slate-700 mb-2">
                            <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                            Filing Date
                        </label>
                        <input
                            type="date"
                            value={formatDateForInput(caseData.filingDate)}
                            onChange={(e) => {
                                // Convert selected date (YYYY-MM-DD) to full ISO format
                                const selectedDate = new Date(e.target.value).toISOString();
                                setCaseData({ ...caseData, filingDate: selectedDate });
                            }}
                            className="w-full p-3 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors bg-white"
                            required
                        />
                    </div>



                    {teamMembers.length > 0 && (
                        <div className="space-y-2">
                            <label className="flex items-center text-base font-semibold text-slate-700 mb-2">
                                <Users className="w-4 h-4 mr-2 text-slate-500" />
                                Team Members (Optional)
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full p-3 border border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors bg-white text-left flex items-center justify-between"
                                >
                                    <span className="text-slate-700">{getSelectedMembersText()}</span>
                                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        <div className="p-3 border-b border-slate-200">
                                            <p className="text-sm text-slate-600">Select team members to add to this case:</p>
                                        </div>
                                        <div className="p-2">
                                            {(() => {
                                                const filteredMembers = teamMembers.filter(mem => mem.role === 'TEAM');
                                                console.log('All team members:', teamMembers);
                                                console.log('Filtered team members:', filteredMembers);
                                                return filteredMembers.map((member) => (
                                                    <div
                                                        key={member.user.user_id}
                                                        className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-md cursor-pointer"
                                                        onClick={() => handleTeamMemberToggle(member.user.user_id)}
                                                    >
                                                        <Checkbox
                                                            checked={selectedTeamMembers.includes(member.user.user_id)}
                                                            onChange={() => handleTeamMemberToggle(member.user.user_id)}
                                                            className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500"
                                                        />
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                                                {getNameAvatar(member.user.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-slate-700">
                                                                {member.user.name}
                                                            </div>
                                                            <div className="text-xs text-slate-500 capitalize">{member.role}</div>
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Display selected members as tags */}
                            {selectedTeamMembers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {selectedTeamMembers.map((memberId) => {
                                        const member = teamMembers.find(m => m.user.user_id === memberId);
                                        if (!member) return null;

                                        return (
                                            <div
                                                key={memberId}
                                                className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200"
                                            >
                                                <Avatar className="w-5 h-5 mr-2">
                                                    <AvatarFallback className="bg-blue-200 text-blue-700 text-xs">
                                                        {getNameAvatar(member.user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>{member.user.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTeamMemberToggle(memberId)}
                                                    className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    {/* Phases Field */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center text-base font-semibold text-slate-700 mb-2">
                            <Layers className="w-4 h-4 mr-2 text-slate-500" />
                            Case Phases
                        </label>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={phaseInput}
                                    onChange={(e) => setPhaseInput(e.target.value)}
                                    onKeyPress={handlePhaseInputKeyPress}
                                    className="flex-1 p-3 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors bg-white"
                                    placeholder="Enter a phase (e.g., Discovery, Trial Preparation, Settlement)"
                                />
                                <button
                                    type="button"
                                    onClick={addPhase}
                                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                    disabled={!phaseInput.trim()}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Display existing phases */}
                            {caseData.phases.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {caseData.phases.map((phase, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200"
                                        >
                                            <span>{phase}</span>
                                            <button
                                                type="button"
                                                onClick={() => removePhase(index)}
                                                className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {caseData.phases.length === 0 && (
                                <p className="text-slate-500 text-sm">No phases added yet. Add phases to organize your case workflow.</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center text-base font-semibold text-slate-700 mb-2">
                            <FileText className="w-4 h-4 mr-2 text-slate-500" />
                            Case Description
                        </label>
                        <textarea
                            value={caseData.description}
                            onChange={(e) => setCaseData({ ...caseData, description: e.target.value })}
                            className="w-full p-3 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors bg-white resize-none"
                            rows="4"
                            placeholder="Provide a detailed description of the case, including key facts, issues, and objectives..."
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Updating...' : 'Update Case'}
                    </button>
                </div>
            </div>
            {isLoading && (
                <Loader />
            )}
        </Modal>
    );
};

const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-500">
                <h3 className="text-xl font-semibold text-slate-800 flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <Edit className="w-4 h-4 text-green-600" />
                    </div>
                    {title}
                </h3>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
            {children}
        </div>
    </div>
);

export default UpdateCaseModal;