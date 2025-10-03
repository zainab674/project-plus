import React, { useState, useEffect, useCallback } from 'react';
import { X, DollarSign, Users, CheckCircle, AlertCircle, Search, Filter, Briefcase } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'react-toastify';
import { useUser } from '@/providers/UserProvider';
import { getAllProjectRequest } from '@/lib/http/project';
import { assignCaseToBillerRequest, getBillerAssignedCasesRequest } from '@/lib/http/billing';
import Loader from '../Loader';
import { getTeamMembersRequest } from '@/lib/http/auth';

const CaseAssignmentModal = ({ isOpen, onClose }) => {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedBiller, setSelectedBiller] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [assignedCases, setAssignedCases] = useState([]);
    const [viewMode, setViewMode] = useState('assign'); // 'assign' or 'view'

    // Fetch user's projects (cases)
    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getAllProjectRequest();
            const { projects, collaboratedProjects } = response.data;
            const allProjects = [...projects, ...collaboratedProjects];
            setProjects(allProjects);
        } catch (error) {
            toast.error('Failed to fetch projects');
            setProjects([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch team members who are billers
    const loadTeamMembers = async () => {
        try {
            const response = await getTeamMembersRequest();
            const allMembers = response.data.teamMembers || [];
            console.log("allmembers", allMembers)
            const billersOnly = allMembers.filter(member => member.role === 'BILLER'); // ✅ Only BILLERs
            setTeamMembers(billersOnly);
        } catch (error) {
            console.error('Error loading team members:', error);
        }
    };


    // Fetch cases already assigned to billers
    const fetchAssignedCases = useCallback(async () => {
        try {
            console.log('🔍 CaseAssignmentModal - Fetching assigned cases...');
            const response = await getBillerAssignedCasesRequest();
            console.log('🔍 CaseAssignmentModal - Response:', response);

            if (response.data.success) {
                console.log('✅ CaseAssignmentModal - Setting assigned cases:', response.data.assignedCases);
                setAssignedCases(response.data.assignedCases);
            } else {
                console.log('⚠️ CaseAssignmentModal - Response not successful:', response.data);
                setAssignedCases([]);
            }
        } catch (error) {
            console.error('❌ CaseAssignmentModal - Error fetching assigned cases:', error);
            setAssignedCases([]);
        }
    }, []);

    useEffect(() => {
        console.log("bhiller", user)
        if (isOpen) {
            fetchProjects();
            loadTeamMembers();
            fetchAssignedCases();
        }
    }, [isOpen]);

    // Filter projects based on search and status
    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.client_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'assigned' && assignedCases.some(ac => ac.project_id === project.project_id)) ||
            (filterStatus === 'unassigned' && !assignedCases.some(ac => ac.project_id === project.project_id));

        return matchesSearch && matchesStatus;
    });

    // Handle case assignment
    const handleAssignCase = async () => {
        if (!selectedProject || !selectedBiller) {
            toast.error('Please select both a case and a biller');
            return;
        }

        setIsLoading(true);
        try {
            const response = await assignCaseToBillerRequest({
                project_id: selectedProject.project_id,
                biller_id: selectedBiller.user_id
            });

            if (response.data.success) {
                toast.success('Case assigned to biller successfully');
                setSelectedProject(null);
                setSelectedBiller(null);
                fetchAssignedCases(); // Refresh assigned cases
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to assign case');
        } finally {
            setIsLoading(false);
        }
    };

    // Check if a project is already assigned
    const isProjectAssigned = (projectId) => {
        return assignedCases.some(ac => ac.project_id === projectId);
    };

    // Get assigned biller for a project
    const getAssignedBiller = (projectId) => {
        const assignedCase = assignedCases.find(ac => ac.project_id === projectId);
        return assignedCase ? teamMembers.find(tm => tm.user_id === assignedCase.biller_id) : null;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900">Case Assignment to Billers</h2>
                            <p className="text-gray-600 mt-1">Assign cases to billers for billing management</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Mode Toggle */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Button
                                variant={viewMode === 'assign' ? 'default' : 'outline'}
                                onClick={() => setViewMode('assign')}
                                className="flex items-center gap-2"
                            >
                                <Briefcase className="w-4 h-4" />
                                Assign Cases
                            </Button>
                            <Button
                                variant={viewMode === 'view' ? 'default' : 'outline'}
                                onClick={() => setViewMode('view')}
                                className="flex items-center gap-2"
                            >
                                <Users className="w-4 h-4" />
                                View Assignments
                            </Button>
                        </div>
                    </div>

                    {viewMode === 'assign' ? (
                        <>
                            {/* Assignment Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Case Selection */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Briefcase className="w-5 h-5" />
                                            Select Case
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Search Cases
                                                </label>
                                                <Input
                                                    placeholder="Search by case name or client..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Filter by Status
                                                </label>
                                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Cases</SelectItem>
                                                        <SelectItem value="assigned">Assigned Cases</SelectItem>
                                                        <SelectItem value="unassigned">Unassigned Cases</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Biller Selection */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <DollarSign className="w-5 h-5" />
                                            Select Biller
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <p className="text-sm text-gray-600">
                                                Choose a biller from your team to assign the case to:
                                            </p>
                                            <div className="space-y-2">
                                                {teamMembers.length > 0 ? (
                                                    teamMembers.map((member) => (
                                                        <div
                                                            key={member.user_id}
                                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedBiller?.user_id === member.user_id
                                                                ? 'border-green-500 bg-green-50'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                            onClick={() => setSelectedBiller(member)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarImage src="/placeholder.svg" />
                                                                    <AvatarFallback className="bg-green-100 text-green-600">
                                                                        {member.user?.name?.charAt(0) || 'B'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <div className="font-medium text-gray-900">
                                                                        {member.user?.name || 'Unknown User'}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {member.user?.email || 'No email'}
                                                                    </div>
                                                                </div>
                                                                {selectedBiller?.user_id === member.user_id && (
                                                                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Billers Found</h3>
                                                        <p className="text-gray-500">
                                                            You don't have any billers in your team. Invite billers first.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Cases List */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Available Cases</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader />
                                        </div>
                                    ) : filteredProjects.length > 0 ? (
                                        <div className="space-y-3">
                                            {filteredProjects.map((project) => {
                                                const isAssigned = isProjectAssigned(project.project_id);
                                                const assignedBiller = getAssignedBiller(project.project_id);

                                                return (
                                                    <div
                                                        key={project.project_id}
                                                        className={`p-4 border rounded-lg transition-colors ${selectedProject?.project_id === project.project_id
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : isAssigned
                                                                ? 'border-gray-200 bg-gray-50'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        onClick={() => !isAssigned && setSelectedProject(project)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 className="font-medium text-gray-900">
                                                                            {project.name}
                                                                        </h4>
                                                                        {isAssigned && (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                Assigned
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-600">
                                                                        Client: {project.client_name || 'No client'}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        Status: {project.status || 'No status'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {isAssigned && assignedBiller && (
                                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                        <span>Assigned to:</span>
                                                                        <Avatar className="w-6 h-6">
                                                                            <AvatarImage src="/placeholder.svg" />
                                                                            <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                                                                                {assignedBiller.user?.name?.charAt(0) || 'B'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="font-medium">
                                                                            {assignedBiller.user?.name}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {selectedProject?.project_id === project.project_id && (
                                                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Cases Found</h3>
                                            <p className="text-gray-500">
                                                {searchTerm ? 'No cases match your search criteria.' : 'You don\'t have any cases yet.'}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Assignment Action */}
                            {selectedProject && selectedBiller && (
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-blue-900">Ready to Assign</h4>
                                            <p className="text-sm text-blue-700">
                                                Assign "{selectedProject.name}" to {selectedBiller.user?.name}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleAssignCase}
                                            disabled={isLoading}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isLoading ? 'Assigning...' : 'Assign Case'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* View Assignments Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Current Case Assignments</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {assignedCases.length > 0 ? (
                                        <div className="space-y-4">
                                            {assignedCases.map((assignment) => {
                                                const project = projects.find(p => p.project_id === assignment.project_id);
                                                const biller = teamMembers.find(tm => tm.user_id === assignment.biller_id);

                                                return (
                                                    <div key={assignment.assignment_id} className="p-4 border border-gray-200 rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div>
                                                                    <h4 className="font-medium text-gray-900">
                                                                        {project?.name || 'Unknown Case'}
                                                                    </h4>
                                                                    <p className="text-sm text-gray-600">
                                                                        Client: {project?.client_name || 'No client'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-600">Assigned to:</span>
                                                                    <Avatar className="w-8 h-8">
                                                                        <AvatarImage src="/placeholder.svg" />
                                                                        <AvatarFallback className="bg-green-100 text-green-600">
                                                                            {biller?.user?.name?.charAt(0) || 'B'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="font-medium text-gray-900">
                                                                        {biller?.user?.name || 'Unknown Biller'}
                                                                    </span>
                                                                </div>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {new Date(assignment.assigned_at).toLocaleDateString()}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments</h3>
                                            <p className="text-gray-500">
                                                No cases have been assigned to billers yet.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CaseAssignmentModal; 