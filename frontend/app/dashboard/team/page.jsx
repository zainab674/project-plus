'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/Button'
import {
    Select, SelectContent, SelectGroup, SelectItem,
    SelectLabel, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { X, Plus, Users, UserPlus, Mail, Shield, Calendar, MoreVertical, Edit, Trash2, Pencil } from 'lucide-react'
import { toast } from 'react-toastify'
import { useUser } from '@/providers/UserProvider'
import { invitePeopleRequest, sendViaMailRequest } from '@/lib/http/project'
import { generateInvitation } from '@/utils/createInvitation'
import { getTeamMembersRequest, updateTeamMemberRequest, deleteTeamMemberRequest } from '@/lib/http/auth'

// Edit Team Member Modal Component
function EditTeamMemberModal({ isOpen, onClose, member, onSuccess }) {
    const [formData, setFormData] = useState({
        legalRole: 'TEAM_LEAD',
        customLegalRole: '',
        role: 'TEAM'
    })
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (member) {
            setFormData({
                legalRole: member.legalRole || 'TEAM_LEAD',
                customLegalRole: member.customLegalRole || '',
                role: member.role || 'TEAM'
            })
        }
    }, [member])

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await updateTeamMemberRequest(member.team_member_id, formData)
            toast.success('Team member updated successfully')
            onSuccess()
            onClose()
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message)
        } finally {
            setIsLoading(false)
        }
    }, [formData, member, onClose, onSuccess])

    if (!isOpen || !member) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Edit className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Edit Team Member</h2>
                            <p className="text-gray-600 text-sm">Update {member.name || member.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Legal Role *
                        </label>
                        <Select
                            value={formData.legalRole}
                            onValueChange={val => setFormData(prev => ({ ...prev, legalRole: val }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select legal role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Legal Roles</SelectLabel>
                                    <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                                    <SelectItem value="ASSOCIATE">Associate</SelectItem>
                                    <SelectItem value="PARALEGAL">Paralegal</SelectItem>
                                    <SelectItem value="ANALYST">Analyst</SelectItem>
                                    <SelectItem value="INVESTIGATOR">Investigator</SelectItem>
                                    <SelectItem value="CUSTOM">Custom Role</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.legalRole === 'CUSTOM' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Custom Role *
                            </label>
                            <Input
                                type="text"
                                placeholder="Enter custom role"
                                value={formData.customLegalRole}
                                onChange={e => setFormData(prev => ({ ...prev, customLegalRole: e.target.value }))}
                                className="w-full"
                                required={formData.legalRole === 'CUSTOM'}
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            isLoading={isLoading}
                            disabled={isLoading}
                        >
                            Update Member
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Add Team Member Modal Component
function AddTeamMemberModal({ isOpen, onClose, onSuccess }) {
    const { user } = useUser()
    const [teamMembers, setTeamMembers] = useState([
        { email: '', role: 'TEAM', legalRole: 'TEAM_LEAD', customLegalRole: '' }
    ])
    const [isLoading, setIsLoading] = useState(false)

    const addTeamMember = () => {
        setTeamMembers([...teamMembers, { email: '', role: 'TEAM', legalRole: 'TEAM_LEAD', customLegalRole: '' }])
    }

    const removeTeamMember = (i) => {
        if (teamMembers.length > 1) {
            setTeamMembers(tm => tm.filter((_, idx) => idx !== i))
        }
    }

    const updateTeamMember = (i, field, val) => {
        setTeamMembers(tm => {
            const copy = [...tm]
            copy[i] = { ...copy[i], [field]: val }
            return copy
        })
    }

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            for (const { email, role, legalRole, customLegalRole } of teamMembers) {
                const { data } = await invitePeopleRequest({
                    role,
                    legalRole,
                    customLegalRole: legalRole === 'CUSTOM' ? customLegalRole : undefined
                })
                const link = data.link
                const invitation = generateInvitation(
                    link,
                    " ",
                    user.name,
                    'Project Admin',
                    role,
                    false,
                    legalRole === 'CUSTOM' ? customLegalRole : legalRole
                )
                await sendViaMailRequest({
                    invitation,
                    mail: email,
                })
                toast.success(`Invitation sent to ${email}`)
            }
            onSuccess()
            onClose()
            // Reset form
            setTeamMembers([{ email: '', role: 'TEAM', legalRole: 'TEAM_LEAD', customLegalRole: '' }])
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message)
        } finally {
            setIsLoading(false)
        }
    }, [teamMembers, user, onClose, onSuccess])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <UserPlus className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Invite Team Members</h2>
                            <p className="text-gray-600 mt-1">Add new members to your legal team</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {teamMembers.map((member, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-4 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <Input
                                            type="email"
                                            placeholder="colleague@lawfirm.com"
                                            value={member.email}
                                            onChange={e => updateTeamMember(idx, 'email', e.target.value)}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    {teamMembers.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeTeamMember(idx)}
                                            className="mt-7 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Legal Role *
                                        </label>
                                        <Select
                                            value={member.legalRole}
                                            onValueChange={val => updateTeamMember(idx, 'legalRole', val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select legal role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Legal Roles</SelectLabel>
                                                    <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                                                    <SelectItem value="ASSOCIATE">Associate</SelectItem>
                                                    <SelectItem value="PARALEGAL">Paralegal</SelectItem>
                                                    <SelectItem value="ANALYST">Analyst</SelectItem>
                                                    <SelectItem value="INVESTIGATOR">Investigator</SelectItem>
                                                    <SelectItem value="CUSTOM">Custom Role</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {member.legalRole === 'CUSTOM' && (
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Custom Role *
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="Enter custom role"
                                                value={member.customLegalRole}
                                                onChange={e => updateTeamMember(idx, 'customLegalRole', e.target.value)}
                                                className="w-full"
                                                required={member.legalRole === 'CUSTOM'}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addTeamMember}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium py-2 px-4 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Another Team Member
                    </button>

                    <div className="flex gap-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 py-3"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                            isLoading={isLoading}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending Invitations...' : 'Send Invitations'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Team Management Page Component
export default function TeamManagementPage() {
    const [team, setTeam] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedMember, setSelectedMember] = useState(null)

    const loadTeamMembers = async () => {
        setIsLoading(true);
        try {
            const res = await getTeamMembersRequest();
            const raw = res.data?.teamMembers || res.teamMembers || [];
            const normalized = raw.map(m => ({
                ...m,
                name: m.user.name,
                email: m.user.email,
                status: m.user.status,        // if present
                created_at: m.created_at,     // or m.user.joinedAt, however your API names it
                legalRole: m.legalRole,       // legal role from UserTeam
                customLegalRole: m.customLegalRole // custom legal role from UserTeam
            }));
            setTeam(normalized);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadTeamMembers()
    }, [])

    const handleAddSuccess = () => {
        loadTeamMembers() // Refresh the team list
    }

    const handleEditSuccess = () => {
        loadTeamMembers() // Refresh the team list
    }

    const handleEditMember = (member) => {
        setSelectedMember(member)
        setShowEditModal(true)
    }

    const handleDeleteMember = async (member) => {
        if (window.confirm(`Are you sure you want to remove ${member.name || member.email} from the team?`)) {
            try {
                await deleteTeamMemberRequest(member.team_member_id)
                toast.success('Team member removed successfully')
                loadTeamMembers() // Refresh the team list
            } catch (err) {
                toast.error(err?.response?.data?.message || err?.message)
            }
        }
    }

    const getRoleDisplayName = (legalRole, customLegalRole) => {
        if (!legalRole) return 'Not Assigned'
        if (legalRole === 'CUSTOM') return customLegalRole || 'Custom Role'
        return legalRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            'ACTIVE': { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
            'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            'INACTIVE': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' }
        }
        const config = statusConfig[status] || statusConfig['PENDING']
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                            <p className="text-gray-600 mt-1">Manage your legal team members and their roles</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-3"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Team Member
                    </Button>
                </div>

                {/* Team Members Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading team members...</p>
                            </div>
                        </div>
                    ) : team.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Team Members Yet</h3>
                            <p className="text-gray-600 mb-6 max-w-md">
                                Start building your legal team by inviting colleagues to collaborate on your projects.
                            </p>
                            <Button
                                onClick={() => setShowAddModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Invite Your First Team Member
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                            Team Member
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                            Legal Role
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                            Access Level
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                            Edit
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                            Delete
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {team.map((member, idx) => (
                                        <tr key={`${member.team_member_id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 font-medium text-sm">
                                                            {(member.name || member.email)?.charAt(0)?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {member.name || 'Pending Invitation'}
                                                        </div>
                                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {getRoleDisplayName(member.legalRole, member.customLegalRole)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Shield className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900 capitalize">
                                                        {member.role?.toLowerCase() || 'Member'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                                                    onClick={() => handleEditMember(member)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                                                    onClick={() => handleDeleteMember(member)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {team.length > 0 && (
                    <div className="mt-6 text-sm text-gray-600">
                        {team.length} team member{team.length === 1 ? '' : 's'} total
                    </div>
                )}
            </div>

            {/* Add Team Member Modal */}
            <AddTeamMemberModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleAddSuccess}
            />

            {/* Edit Team Member Modal */}
            <EditTeamMemberModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false)
                    setSelectedMember(null)
                }}
                member={selectedMember}
                onSuccess={handleEditSuccess}
            />
        </div>
    )
} 