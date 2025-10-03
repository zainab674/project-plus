'use client'

import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    Users,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Search,
    Filter,
    Calendar,
    Building,
    MessageSquare,
    UserPlus,
    Shield,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    getAdminDashboardStats,
    getAdminAllRequests,
    approveAdminRequest,
    rejectAdminRequest,
    getAdminAllUsers,
    getAdminUserDetails,
    updateAdminUserRole,
    createAdminUser,
    deleteAdminUser
} from '@/lib/http/auth';
import UserTreeView from '@/components/ui/tree';
import { UserContext } from '@/providers/UserProvider';
import { useRouter } from 'next/navigation';

const AdminPage = () => {
    const { user, isAuth, isLoading } = useContext(UserContext);
    const router = useRouter();

    // Role-based access control
    useEffect(() => {
        if (!isLoading && (!isAuth || !user)) {
            // User not authenticated, redirect to sign-in
            toast.error('Please sign in to access this page');
            router.push('/sign-in');
            return;
        }

        if (!isLoading && isAuth && user && user.Role !== 'ADMIN') {
            // User authenticated but not admin, redirect to dashboard
            toast.error('Access denied. Only administrators can access this page.');
            router.push('/dashboard');
            return;
        }
    }, [user, isAuth, isLoading, router]);

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking access permissions...</p>
                </div>
            </div>
        );
    }

    // Show access denied if not admin
    if (!isAuth || !user || user.Role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-6">
                        You don't have permission to access this page. Only administrators can view the admin dashboard.
                    </p>
                    <Button onClick={() => router.push('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
    });
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [activeTab, setActiveTab] = useState('requests');

    // User management states
    const [users, setUsers] = useState([]);
    const [userLoading, setUserLoading] = useState(false);
    const [userDetails, setUserDetails] = useState({});
    const [userDetailsLoading, setUserDetailsLoading] = useState({});
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userFilter, setUserFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userRole, setUserRole] = useState('');

    // Create admin states
    const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
    const [newAdminData, setNewAdminData] = useState({
        name: '',
        email: '',
        password: '',
        account_name: ''
    });
    const [creatingAdmin, setCreatingAdmin] = useState(false);

    // Delete user states
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Fetch dashboard stats
    const fetchStats = async () => {
        try {
            const response = await getAdminDashboardStats();
            if (response.data.success) {
                setStats(response.data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Fetch requests
    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = {
                status: filter,
                page: 1,
                limit: 10000 // Fetch all requests
            };

            const response = await getAdminAllRequests(params);

            if (response.data.success) {
                setRequests(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    // Fetch users
    const fetchUsers = async () => {
        try {
            setUserLoading(true);
            const response = await getAdminAllUsers({ page: 1, limit: 10000 }); // Fetch all users

            if (response.data.success) {
                const fetchedUsers = response.data.data.users || [];
                setUsers(fetchedUsers);
                // Only fetch user list, details will be fetched when "View Details" is clicked
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setUserLoading(false);
        }
    };

    const fetchUserDetails = async (userId) => {
        try {
            setUserDetailsLoading(prev => ({ ...prev, [userId]: true }));
            const response = await getAdminUserDetails(userId);
            if (response.data.success) {
                setUserDetails(prevDetails => ({
                    ...prevDetails,
                    [userId]: response.data.data
                }));
            }
        } catch (error) {
            console.error(`Error fetching details for user ${userId}:`, error);
            toast.error(`Failed to fetch details for user ${userId}`);
        } finally {
            setUserDetailsLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    // Update user role
    const handleUpdateUserRole = async (userId) => {
        try {
            const response = await updateAdminUserRole(userId, userRole);

            if (response.data.success) {
                toast.success('User role updated successfully');
                setUserRole('');
                fetchUsers(); // Refresh the users list
            } else {
                toast.error(response.data.message || 'Failed to update user role');
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            toast.error('Failed to update user role');
        }
    };

    // Create admin user
    const handleCreateAdmin = async () => {
        try {
            setCreatingAdmin(true);
            const response = await createAdminUser(newAdminData);

            if (response.data.success) {
                toast.success('Admin user created successfully');
                setShowCreateAdminModal(false);
                setNewAdminData({
                    name: '',
                    email: '',
                    password: '',
                    account_name: ''
                });
                fetchUsers(); // Refresh the users list
            } else {
                toast.error(response.data.message || 'Failed to create admin user');
            }
        } catch (error) {
            console.error('Error creating admin user:', error);
            toast.error(error.response?.data?.message || 'Failed to create admin user');
        } finally {
            setCreatingAdmin(false);
        }
    };

    // Delete user
    const handleDeleteUser = async (userId) => {
        try {
            const response = await deleteAdminUser(userId);
            if (response.data.success) {
                toast.success('User deleted successfully');
                setShowDeleteConfirmModal(false);
                setUserToDelete(null);
                fetchUsers();
            } else {
                toast.error(response.data.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
        }
    };

    // Get role badge
    const getRoleBadge = (role) => {
        switch (role) {
            case 'ADMIN':
                return <Badge variant="outline" className="bg-red-50 text-red-700">Admin</Badge>;
            case 'PROVIDER':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700">Provider</Badge>;
            case 'CLIENT':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700">Client</Badge>;
            case 'BILLER':
                return <Badge variant="outline" className="bg-orange-50 text-orange-700">Biller</Badge>;
            case 'TEAM':
                return <Badge variant="outline" className="bg-green-50 text-green-700">Team Member</Badge>;
            default:
                return <Badge variant="outline" className="bg-gray-50 text-gray-700">{role || 'No Role'}</Badge>;
        }
    };

    // Approve request
    const approveRequest = async (requestId) => {
        try {
            const response = await approveAdminRequest({
                request_id: requestId,
                admin_notes: adminNotes
            });

            if (response.data.success) {
                toast.success('Request approved successfully');
                setAdminNotes('');
                setSelectedRequest(null);
                fetchRequests();
                fetchStats();
            } else {
                toast.error(response.data.message || 'Failed to approve request');
            }
        } catch (error) {
            console.error('Error approving request:', error);
            toast.error('Failed to approve request');
        }
    };

    // Reject request
    const rejectRequest = async (requestId) => {
        try {
            const response = await rejectAdminRequest({
                request_id: requestId,
                admin_notes: adminNotes
            });

            if (response.data.success) {
                toast.success('Request rejected successfully');
                setAdminNotes('');
                setSelectedRequest(null);
                fetchRequests();
                fetchStats();
            } else {
                toast.error(response.data.message || 'Failed to reject request');
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast.error('Failed to reject request');
        }
    };



    // Get status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
            case 'APPROVED':
                return <Badge variant="outline" className="bg-green-50 text-green-700">Approved</Badge>;
            case 'REJECTED':
                return <Badge variant="outline" className="bg-red-50 text-red-700">Rejected</Badge>;
            default:
                return <Badge variant="outline" className="bg-gray-50 text-gray-700">{status}</Badge>;
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Filter requests based on search term
    const filteredRequests = requests.filter(request =>
        request.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewDetails = async (userId) => {
        setSelectedUser(userId);
        // Fetch user details only when "View Details" is clicked
        if (!userDetails[userId]) {
            await fetchUserDetails(userId);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                            <p className="text-gray-600">Manage user registration requests and system access</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                                <Shield className="h-5 w-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">Administrator</span>
                            </div>
                            <div className="text-sm text-gray-500">
                                Logged in as: <span className="font-medium text-gray-700">{user?.name}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { id: 'requests', name: 'Registration Requests', icon: UserPlus },
                                { id: 'users', name: 'User Management', icon: Users }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span>{tab.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Registration Requests Tab */}
                {activeTab === 'requests' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                                        </div>
                                        <Clock className="h-8 w-8 text-yellow-600" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Approved</p>
                                            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                                        </div>
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Rejected</p>
                                            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                                        </div>
                                        <XCircle className="h-8 w-8 text-red-600" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Requests</p>
                                            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                                        </div>
                                        <Users className="h-8 w-8 text-blue-600" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filters and Search */}
                        <Card className="mb-6">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-4 w-4 text-gray-500" />
                                            <Select value={filter} onValueChange={setFilter}>
                                                <SelectTrigger className="w-40">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">All Requests</SelectItem>
                                                    <SelectItem value="PENDING">Pending</SelectItem>
                                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Search className="h-4 w-4 text-gray-500" />
                                        <Input
                                            placeholder="Search by name, email, or company..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-64"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Requests Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    User Registration Requests
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="mt-2 text-gray-600">Loading requests...</p>
                                    </div>
                                ) : filteredRequests.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No requests found</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredRequests.map((request) => (
                                                    <tr key={request.request_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-4 px-4">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{request.name}</p>
                                                                <p className="text-sm text-gray-600">{request.email}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <Building className="h-4 w-4 text-gray-500" />
                                                                <span className="text-sm text-gray-700">{request.company_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="max-w-xs">
                                                                <p className="text-sm text-gray-700 truncate" title={request.reason}>
                                                                    {request.reason}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {getStatusBadge(request.status)}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                                <span className="text-sm text-gray-600">
                                                                    {formatDate(request.created_at)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex gap-2">
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => setSelectedRequest(request)}
                                                                        >
                                                                            <Eye className="h-4 w-4 mr-1" />
                                                                            View
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="max-w-2xl">
                                                                        <DialogHeader>
                                                                            <DialogTitle>Request Details</DialogTitle>
                                                                        </DialogHeader>
                                                                        <div className="space-y-4">
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <label className="text-sm font-medium text-gray-700">Name</label>
                                                                                    <p className="text-sm text-gray-900">{request.name}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-sm font-medium text-gray-700">Email</label>
                                                                                    <p className="text-sm text-gray-900">{request.email}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-sm font-medium text-gray-700">Company</label>
                                                                                    <p className="text-sm text-gray-900">{request.company_name}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-sm font-medium text-gray-700">Team Size</label>
                                                                                    <p className="text-sm text-gray-900">{request.team_size}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-sm font-medium text-gray-700">Reason for Access</label>
                                                                                <p className="text-sm text-gray-900 mt-1">{request.reason}</p>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-sm font-medium text-gray-700">Additional Notes</label>
                                                                                <p className="text-sm text-gray-900 mt-1">
                                                                                    {request.bring || 'No additional notes provided'}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-sm font-medium text-gray-700">Focus Areas</label>
                                                                                <div className="flex flex-wrap gap-2 mt-1">
                                                                                    {request.focus.map((item, index) => (
                                                                                        <Badge key={index} variant="outline">{item}</Badge>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-sm font-medium text-gray-700">Admin Notes</label>
                                                                                <Textarea
                                                                                    placeholder="Add notes about this request..."
                                                                                    value={adminNotes}
                                                                                    onChange={(e) => setAdminNotes(e.target.value)}
                                                                                    className="mt-1"
                                                                                />
                                                                            </div>
                                                                            {request.status === 'PENDING' && (
                                                                                <div className="flex gap-3 pt-4">
                                                                                    <Button
                                                                                        onClick={() => approveRequest(request.request_id)}
                                                                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                                                                    >
                                                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                                                        Approve
                                                                                    </Button>
                                                                                    <Button
                                                                                        onClick={() => rejectRequest(request.request_id)}
                                                                                        variant="destructive"
                                                                                        className="flex-1"
                                                                                    >
                                                                                        <XCircle className="h-4 w-4 mr-2" />
                                                                                        Reject
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}


                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* User Management Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        {/* User Management Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                                            <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                                        </div>
                                        <Users className="h-8 w-8 text-blue-600" />
                                    </div>
                                </CardContent>
                            </Card>
                            {/* <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Active Users</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {users.filter(user => user.status === 'active').length}
                                            </p>
                                        </div>
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                </CardContent>
                            </Card> */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">New This Week</p>
                                            <p className="text-2xl font-bold text-purple-600">
                                                {users.filter(user => {
                                                    const userDate = new Date(user.created_at);
                                                    const weekAgo = new Date();
                                                    weekAgo.setDate(weekAgo.getDate() - 7);
                                                    return userDate > weekAgo;
                                                }).length}
                                            </p>
                                        </div>
                                        <UserPlus className="h-8 w-8 text-purple-600" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* User Management Controls */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Users className="w-5 h-5" />
                                    <span>User Management</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Filters and Search */}
                                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Search users by name, email, or company..."
                                            value={userSearchTerm}
                                            onChange={(e) => setUserSearchTerm(e.target.value)}
                                            className="max-w-sm"
                                        />
                                    </div>
                                    <Select value={userFilter} onValueChange={setUserFilter}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Filter by role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Roles</SelectItem>
                                            <SelectItem value="ADMIN">Admins</SelectItem>
                                            <SelectItem value="PROVIDER">Providers</SelectItem>
                                            <SelectItem value="CLIENT">Clients</SelectItem>
                                            <SelectItem value="BILLER">Billers</SelectItem>
                                            <SelectItem value="TEAM">Team Members</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        onClick={fetchUsers}
                                        disabled={userLoading}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {userLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                <Users className="w-4 h-4 mr-2" />
                                                Refresh Users
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => setShowCreateAdminModal(true)}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Create Admin
                                    </Button>
                                </div>

                                {/* Users Table */}
                                <div className="space-y-4">
                                    {userLoading ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="text-gray-600 mt-2">Loading users...</p>
                                        </div>
                                    ) : users.length > 0 ? (
                                        users
                                            .filter(user =>
                                                user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                                user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                                user.company_name?.toLowerCase().includes(userSearchTerm.toLowerCase())
                                            )
                                            .filter(user => userFilter === 'all' || user.Role === userFilter)
                                            .map((user) => (
                                                <div key={user.user_id} className="border border-gray-200 rounded-lg p-4">
                                                    {console.log("user", user)}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                                <span className="text-white font-semibold text-lg">
                                                                    {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-gray-900">{user.name || 'Unknown User'}</h3>
                                                                <p className="text-sm text-gray-500">{user.email}</p>
                                                                {user.company_name && (
                                                                    <p className="text-sm text-gray-600">{user.company_name}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-3">
                                                            {getRoleBadge(user.Role)}
                                                            <Badge variant="outline" className="bg-green-50 text-green-700">
                                                                {user.status || 'Active'}
                                                            </Badge>
                                                            <span className="text-sm text-gray-500">
                                                                {formatDate(user.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-700">Role</label>
                                                            <p className="text-sm text-gray-900">{user.Role || 'Not assigned'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-700">Phone</label>
                                                            <p className="text-sm text-gray-900">{user.phone || 'Not provided'}</p>
                                                        </div>
                                                        {user.address && (
                                                            <div className="md:col-span-2">
                                                                <label className="text-sm font-medium text-gray-700">Address</label>
                                                                <p className="text-sm text-gray-900">{user.address}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="border-t border-gray-200 pt-4">
                                                        <div className="flex items-center space-x-3">

                                                            <Button variant="outline" size="sm"
                                                                onClick={() => handleViewDetails(user.user_id)}
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View Details
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    console.log('User ID:', user.user_id);

                                                                    setUserToDelete(user.user_id);
                                                                    setShowDeleteConfirmModal(true);
                                                                }}
                                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                                            >
                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                                            <p className="text-gray-600">
                                                {userSearchTerm || userFilter !== 'all'
                                                    ? 'Try adjusting your search or filter criteria'
                                                    : 'No users in the system yet'
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Modal for user details */}
                                {selectedUser && (
                                    <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>User Details</DialogTitle>
                                            </DialogHeader>

                                            <div className="space-y-4 overflow-y-auto">
                                                {userDetailsLoading[selectedUser] ? (
                                                    <div className="text-center py-8">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                                        <p className="text-gray-600 mt-2">Loading user details...</p>
                                                    </div>
                                                ) : userDetails[selectedUser] ? (
                                                    <>
                                                        {console.log("check", userDetails[selectedUser].user)}
                                                        <UserTreeView user={userDetails[selectedUser].user} />
                                                    </>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <p className="text-gray-600">Failed to load user details</p>
                                                    </div>
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}



                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Delete User Confirmation Modal */}
            <Dialog open={showDeleteConfirmModal} onOpenChange={(open) => {
                if (!open) {
                    setShowDeleteConfirmModal(false);
                    setUserToDelete(null);
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="text-center">
                            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Are you sure you want to delete this user?
                            </h3>
                            <p className="text-gray-600">
                                This action cannot be undone. The user  will be permanently removed from the system.
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDeleteConfirmModal(false);
                                    setUserToDelete(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    console.log("userToDelete", userToDelete)
                                    if (userToDelete) {
                                        handleDeleteUser(userToDelete);
                                    } else {
                                        toast.error('User ID not found');
                                    }
                                }}
                                variant="destructive"
                            >
                                Delete User
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Admin Modal */}
            <Dialog open={showCreateAdminModal} onOpenChange={setShowCreateAdminModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New Admin User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Name *</label>
                            <Input
                                placeholder="Enter full name"
                                value={newAdminData.name}
                                onChange={(e) => setNewAdminData(prev => ({ ...prev, name: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Email *</label>
                            <Input
                                type="email"
                                placeholder="Enter email address"
                                value={newAdminData.email}
                                onChange={(e) => setNewAdminData(prev => ({ ...prev, email: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Password *</label>
                            <Input
                                type="password"
                                placeholder="Enter password"
                                value={newAdminData.password}
                                onChange={(e) => setNewAdminData(prev => ({ ...prev, password: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Account Name (Optional)</label>
                            <Input
                                placeholder="Enter account name"
                                value={newAdminData.account_name}
                                onChange={(e) => setNewAdminData(prev => ({ ...prev, account_name: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowCreateAdminModal(false)}
                                disabled={creatingAdmin}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateAdmin}
                                disabled={creatingAdmin || !newAdminData.name || !newAdminData.email || !newAdminData.password}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {creatingAdmin ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    'Create Admin'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminPage;
