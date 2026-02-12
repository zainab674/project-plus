'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/Button'
import {
    Select, SelectContent, SelectGroup, SelectItem,
    SelectLabel, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { X, Plus, Users, UserPlus, Mail, Shield, Calendar, MoreVertical, Edit, Trash2, Pencil, DollarSign, Copy, ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import { useUser } from '@/providers/UserProvider'
import { invitePeopleRequest, sendViaMailRequest } from '@/lib/http/project'
import { generateInvitation } from '@/utils/createInvitation'
import { getTeamMembersRequest, updateTeamMemberRequest, deleteTeamMemberRequest } from '@/lib/http/auth'
import { Textarea } from '@/components/ui/textarea'

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

// Invite Biller Component (inline in team page)
function InviteBillerSection({ onBack }) {
    const { user } = useUser()
    const [isLoading, setIsLoading] = useState(false)
    const [link, setLink] = useState(null)
    const [invitation, setInvitation] = useState('')
    const [sendViaMail, setSendViaMail] = useState(false)
    const [mail, setMail] = useState('')

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const formdata = {
                role: 'BILLER',
                projectId: null
            }
            const res = await invitePeopleRequest(formdata)
            setLink(res.data.link)
            const invitation = generateInvitation(
                res.data.link,
                'Billing System',
                user?.name,
                'Project Admin',
                'BILLER',
                "False",
                'Biller'
            )
            setInvitation(invitation)
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message)
        } finally {
            setIsLoading(false)
        }
    }, [user])

    const handleCopy = useCallback(() => {
        try {
            if (typeof window != 'undefined') {
                window.navigator.clipboard.writeText(invitation)
                toast.success("Biller Invitation Copied")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }, [invitation])

    const handleSendViaMail = useCallback(async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const formdata = {
                invitation,
                mail,
                projectId: null
            }
            const res = await sendViaMailRequest(formdata)
            toast.success(res.data.message)
            setSendViaMail(false)
            setMail('')
            setLink(null)
            setInvitation('')
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message)
        } finally {
            setIsLoading(false)
        }
    }, [invitation, mail])

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-8">
                {/* Header with back button */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Invite Biller</h2>
                            <p className="text-gray-600 mt-1">Invite a biller to handle billing and invoicing</p>
                        </div>
                    </div>
                </div>

                {sendViaMail ? (
                    <>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Send Biller Invitation Via Email</h3>
                        <form className="space-y-4" onSubmit={handleSendViaMail}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <Input
                                    type="email"
                                    placeholder="Enter biller's email address"
                                    value={mail}
                                    onChange={(e) => setMail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSendViaMail(false)}
                                    disabled={isLoading}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-green-600 text-white hover:bg-green-700"
                                    isLoading={isLoading}
                                    disabled={isLoading || !mail}
                                >
                                    Send Invitation
                                </Button>
                            </div>
                        </form>
                    </>
                ) : !link ? (
                    <>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">Create Biller Invitation</h3>
                            <p className="text-gray-600 max-w-xl mx-auto">
                                Generate an invitation link for a biller to join your team and handle billing operations.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <h4 className="font-medium text-blue-900 mb-3">Biller Permissions:</h4>
                                <ul className="text-sm text-blue-800 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        <span>Generate invoices and billing reports</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        <span>Manage client billing and payment tracking</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        <span>Access to billing dashboard and financial data</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        <span>Create and send invoices to clients</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={onBack}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    className="bg-green-600 text-white hover:bg-green-700"
                                    isLoading={isLoading}
                                    disabled={isLoading}
                                >
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Generate Invitation Link
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">Biller Invitation Created!</h3>
                            <p className="text-gray-600 max-w-xl mx-auto">
                                Share this invitation with the biller to grant them access to your billing system.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Invitation Link
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={link}
                                        readOnly
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleCopy}
                                        variant="outline"
                                        className="whitespace-nowrap"
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Template
                                </label>
                                <Textarea
                                    value={invitation}
                                    readOnly
                                    rows={8}
                                    className="resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setLink(null)
                                        setInvitation('')
                                    }}
                                    disabled={isLoading}
                                >
                                    Create New Link
                                </Button>
                                <Button
                                    onClick={() => setSendViaMail(true)}
                                    className="bg-green-600 text-white hover:bg-green-700"
                                    disabled={isLoading}
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Send Via Email
                                </Button>
                            </div>
                        </div>
                    </>
                )}
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
    const [showInviteBiller, setShowInviteBiller] = useState(false)

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
                role: m.role,                 // role from UserTeam (TEAM or BILLER)
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
                {showInviteBiller ? (
                    <InviteBillerSection onBack={() => setShowInviteBiller(false)} />
                ) : (
                    <>
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
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => setShowInviteBiller(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-6 py-3"
                                >
                                    <DollarSign className="w-4 h-4" />
                                    Invite Biller
                                </Button>
                                <Button
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-3"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Add Team Member
                                </Button>
                            </div>
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
                                            Member / Biller
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
                                    {team.map((member, idx) => {
                                        const isBiller = member.role === 'BILLER';
                                        return (
                                        <tr key={`${member.team_member_id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`w-10 h-10 ${isBiller ? 'bg-green-100' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                                                        {isBiller ? (
                                                            <DollarSign className={`w-5 h-5 ${isBiller ? 'text-green-600' : 'text-blue-600'}`} />
                                                        ) : (
                                                            <span className={`${isBiller ? 'text-green-600' : 'text-blue-600'} font-medium text-sm`}>
                                                                {(member.name || member.email)?.charAt(0)?.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {member.name || 'Pending Invitation'}
                                                            </span>
                                                            {isBiller && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                    Biller
                                                                </span>
                                                            )}
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
                                                    {isBiller ? 'Biller' : getRoleDisplayName(member.legalRole, member.customLegalRole)}
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
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                        {/* Footer */}
                        {team.length > 0 && (() => {
                            const teamMembers = team.filter(m => m.role !== 'BILLER');
                            const billers = team.filter(m => m.role === 'BILLER');
                            return (
                                <div className="mt-6 text-sm text-gray-600">
                                    {teamMembers.length} team member{teamMembers.length === 1 ? '' : 's'}
                                    {billers.length > 0 && (
                                        <> and {billers.length} biller{billers.length === 1 ? '' : 's'}</>
                                    )}
                                    {' '}total
                                </div>
                            );
                        })()}
                    </>
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