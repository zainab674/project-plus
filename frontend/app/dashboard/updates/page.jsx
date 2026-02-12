'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useUser } from '@/providers/UserProvider'
import { useDashboardFilter } from '@/providers/DashboardFilterProvider'
import { getTaskUpdatesRequest, markTaskUpdatesAsReadRequest } from '@/lib/http/task'
import { getProjectRequest } from '@/lib/http/project'
import { getTeamMembersRequest } from '@/lib/http/auth'
import { toast } from 'react-toastify'
import Loader from '@/components/Loader'
import moment from 'moment'
import { MessageSquare, Paperclip, Briefcase, ListTodo, X, Users, ChevronDown, Eye, Download, CheckCheck, CircleDot } from 'lucide-react'
import AvatarCompoment from '@/components/AvatarCompoment'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { viewFile, downloadFile } from '@/utils/fileUtils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'

export default function TaskUpdatesPage() {
    const { user } = useUser()
    const { selectedCase } = useDashboardFilter()
    const [updates, setUpdates] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedTasks, setSelectedTasks] = useState([])
    const [tasks, setTasks] = useState([])
    const [loadingTasks, setLoadingTasks] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState([])
    const [teamMembers, setTeamMembers] = useState([])
    const [loadingMembers, setLoadingMembers] = useState(false)
    const [markingAll, setMarkingAll] = useState(false)
    const [markingIds, setMarkingIds] = useState([])

    const taskBadgeLabel = useMemo(() => {
        if (selectedTasks.length === 0) return null
        if (selectedTasks.length === 1) return selectedTasks[0].name
        return `${selectedTasks[0].name} +${selectedTasks.length - 1}`
    }, [selectedTasks])

    const userBadgeLabel = useMemo(() => {
        if (selectedUsers.length === 0) return null
        const firstName = selectedUsers[0].user?.name || selectedUsers[0].name
        if (selectedUsers.length === 1) return firstName
        return `${firstName} +${selectedUsers.length - 1}`
    }, [selectedUsers])

    const taskButtonLabel = useMemo(() => {
        if (!selectedCase) return 'Select a case first'
        if (loadingTasks) return 'Loading tasks...'
        if (selectedTasks.length === 0) return 'All Tasks'
        if (selectedTasks.length === 1) return selectedTasks[0].name
        return `${selectedTasks[0].name} +${selectedTasks.length - 1}`
    }, [selectedCase, loadingTasks, selectedTasks])

    const userButtonLabel = useMemo(() => {
        if (loadingMembers) return 'Loading team...'
        if (selectedUsers.length === 0) return 'Whole Team'
        const firstName = selectedUsers[0].user?.name || selectedUsers[0].name
        if (selectedUsers.length === 1) return firstName
        return `${firstName} +${selectedUsers.length - 1}`
    }, [loadingMembers, selectedUsers])

    const filterDescription = useMemo(() => {
        const caseName = selectedCase?.name
        const taskPhrase = selectedTasks.length === 0
            ? ''
            : selectedTasks.length === 1
                ? `task "${selectedTasks[0].name}"`
                : `${selectedTasks.length} tasks`
        const userPhrase = selectedUsers.length === 0
            ? ''
            : selectedUsers.length === 1
                ? (selectedUsers[0].user?.name || selectedUsers[0].name)
                : `${selectedUsers.length} team members`

        if (caseName && taskPhrase && userPhrase) {
            return `Viewing updates for ${taskPhrase} by ${userPhrase} in ${caseName}`
        }
        if (caseName && taskPhrase) {
            return `Viewing updates for ${taskPhrase} in ${caseName}`
        }
        if (caseName && userPhrase) {
            return `Viewing updates by ${userPhrase} in ${caseName}`
        }
        if (caseName) {
            return `Viewing updates for ${caseName}`
        }
        if (taskPhrase && userPhrase) {
            return `Viewing updates for ${taskPhrase} by ${userPhrase}`
        }
        if (taskPhrase) {
            return `Viewing updates for ${taskPhrase}`
        }
        if (userPhrase) {
            return `Viewing updates by ${userPhrase}`
        }
        return 'View and manage all task updates across your projects'
    }, [selectedCase, selectedTasks, selectedUsers])

    const emptyStateMessage = useMemo(() => {
        const caseName = selectedCase?.name
        const taskPhrase = selectedTasks.length === 0
            ? ''
            : selectedTasks.length === 1
                ? `task "${selectedTasks[0].name}"`
                : `${selectedTasks.length} selected tasks`
        const userPhrase = selectedUsers.length === 0
            ? ''
            : selectedUsers.length === 1
                ? (selectedUsers[0].user?.name || selectedUsers[0].name)
                : `${selectedUsers.length} selected members`

        if (caseName && taskPhrase && userPhrase) {
            return `No updates have been posted for ${taskPhrase} by ${userPhrase} in ${caseName} yet.`
        }
        if (caseName && taskPhrase) {
            return `No updates have been posted for ${taskPhrase} in ${caseName} yet.`
        }
        if (caseName && userPhrase) {
            return `No updates have been posted by ${userPhrase} in ${caseName} yet.`
        }
        if (caseName) {
            return `No updates have been posted for ${caseName} yet.`
        }
        if (taskPhrase && userPhrase) {
            return `No updates have been posted for ${taskPhrase} by ${userPhrase} yet.`
        }
        if (taskPhrase) {
            return `No updates have been posted for ${taskPhrase} yet.`
        }
        if (userPhrase) {
            return `No updates have been posted by ${userPhrase} yet.`
        }
        return 'No updates have been posted yet.'
    }, [selectedCase, selectedTasks, selectedUsers])

    const unreadCount = useMemo(() => {
        return updates.filter(update => !update.is_read).length
    }, [updates])

    const toggleTaskSelection = useCallback((task) => {
        setSelectedTasks(prev => {
            const exists = prev.some(selected => selected.task_id === task.task_id)
            if (exists) {
                return prev.filter(selected => selected.task_id !== task.task_id)
            }
            return [...prev, task]
        })
    }, [])

    const toggleUserSelection = useCallback((member) => {
        const memberId = member.user?.user_id || member.user_id
        if (!memberId) return

        setSelectedUsers(prev => {
            const exists = prev.some(selected => {
                const selectedId = selected.user?.user_id || selected.user_id
                return selectedId === memberId
            })
            if (exists) {
                return prev.filter(selected => {
                    const selectedId = selected.user?.user_id || selected.user_id
                    return selectedId !== memberId
                })
            }
            return [...prev, member]
        })
    }, [])

    const handleMarkUpdatesAsRead = useCallback(async (updateIds = []) => {
        if (!Array.isArray(updateIds) || updateIds.length === 0) return
        try {
            await markTaskUpdatesAsReadRequest(updateIds)
            const markedAt = new Date().toISOString()
            setUpdates(prev =>
                prev.map(update =>
                    updateIds.includes(update.update_id)
                        ? { ...update, is_read: true, read_at: update.read_at || markedAt }
                        : update
                )
            )
        } catch (error) {
            console.error('Error marking updates as read:', error)
            toast.error('Failed to mark updates as read')
            throw error
        }
    }, [])

    const handleMarkSingleUpdate = useCallback(async (updateId) => {
        if (!updateId) return
        setMarkingIds(prev => (prev.includes(updateId) ? prev : [...prev, updateId]))
        try {
            await handleMarkUpdatesAsRead([updateId])
        } catch (error) {
            // Error already handled inside handleMarkUpdatesAsRead
        } finally {
            setMarkingIds(prev => prev.filter(id => id !== updateId))
        }
    }, [handleMarkUpdatesAsRead])

    const handleMarkAllUpdatesAsRead = useCallback(async () => {
        const unreadIds = updates
            .filter(update => !update.is_read)
            .map(update => update.update_id)
        if (unreadIds.length === 0) return

        setMarkingAll(true)
        try {
            await handleMarkUpdatesAsRead(unreadIds)
        } catch (error) {
            // Error already surfaced by handleMarkUpdatesAsRead
        } finally {
            setMarkingAll(false)
        }
    }, [handleMarkUpdatesAsRead, updates])

    // Fetch tasks when a case is selected
    useEffect(() => {
        const fetchTasks = async () => {
            if (!selectedCase?.project_id) {
                setTasks([])
                setSelectedTasks([])
                return
            }

            setLoadingTasks(true)
            try {
                const response = await getProjectRequest(selectedCase.project_id)
                setTasks(response?.data?.project?.Tasks || [])
            } catch (error) {
                console.error('Error fetching tasks:', error)
                setTasks([])
            } finally {
                setLoadingTasks(false)
            }
        }

        fetchTasks()
    }, [selectedCase])

    // Fetch all team members (not restricted by project)
    useEffect(() => {
        const fetchMembers = async () => {
            setLoadingMembers(true)
            try {
                const response = await getTeamMembersRequest()
                setTeamMembers(response?.data?.teamMembers || [])
            } catch (error) {
                console.error('Error fetching team members:', error)
                setTeamMembers([])
            } finally {
                setLoadingMembers(false)
            }
        }

        fetchMembers()
    }, [])

    // Reset selected task when case changes (but keep user selection)
    useEffect(() => {
        setSelectedTasks([])
    }, [selectedCase])

    // Fetch updates with case, task, and user filter
    const fetchUpdates = useCallback(async () => {
        setLoading(true)
        try {
            const filters = {}
            if (selectedCase?.project_id) {
                filters.project_id = selectedCase.project_id
            }
            if (selectedTasks.length === 1) {
                filters.task_id = selectedTasks[0].task_id
            } else if (selectedTasks.length > 1) {
                filters.task_ids = selectedTasks
                    .map(task => task.task_id)
                    .filter(taskId => typeof taskId === 'number' || (typeof taskId === 'string' && taskId.trim() !== ''))
            }

            if (selectedUsers.length === 1) {
                const userId = selectedUsers[0].user?.user_id || selectedUsers[0].user_id
                if (userId) filters.user_id = userId
            } else if (selectedUsers.length > 1) {
                filters.user_ids = selectedUsers
                    .map(member => member.user?.user_id || member.user_id)
                    .filter(userId => typeof userId === 'number' || (typeof userId === 'string' && userId.trim() !== ''))
            }
            let fetchedUpdates = []
            const response = await getTaskUpdatesRequest(filters)
            fetchedUpdates = Array.isArray(response?.data?.updates) ? response.data.updates : []

            const unreadIds = fetchedUpdates
                .filter(update => !update.is_read && update.user?.user_id !== user?.user_id)
                .map(update => update.update_id)

            if (unreadIds.length > 0) {
                try {
                    await markTaskUpdatesAsReadRequest(unreadIds)
                    const markedAt = new Date().toISOString()
                    fetchedUpdates = fetchedUpdates.map(update =>
                        unreadIds.includes(update.update_id)
                            ? { ...update, is_read: true, read_at: update.read_at || markedAt }
                            : update
                    )
                } catch (markError) {
                    console.error('Error automatically marking updates as read:', markError)
                }
            }

            setUpdates(fetchedUpdates)
        } catch (error) {
            console.error('Error fetching updates:', error)
            const errorMessage = error?.response?.data?.message || 'Failed to load updates'
            toast.error(errorMessage)
            setUpdates([])
        } finally {
            setLoading(false)
        }
    }, [selectedCase, selectedTasks, selectedUsers, user?.user_id])

    useEffect(() => {
        fetchUpdates()
    }, [fetchUpdates])

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }


    if (loading && updates.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <MessageSquare className="w-6 h-6 text-green-600" />
                                </div>
                                Task Updates
                            </h1>
                            <p className="text-gray-600 mt-2">{filterDescription}</p>
                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                                {selectedCase && (
                                    <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                                        <Briefcase className="w-3 h-3" />
                                        <span>{selectedCase.name}</span>
                                    </Badge>
                                )}
                                {selectedTasks.length > 0 && taskBadgeLabel && (
                                    <Badge variant="outline" className="flex items-center gap-2 px-3 py-1 border-blue-300 text-blue-700 bg-blue-50">
                                        <ListTodo className="w-3 h-3" />
                                        <span>{taskBadgeLabel}</span>
                                    </Badge>
                                )}
                                {selectedUsers.length > 0 && userBadgeLabel && (
                                    <Badge variant="outline" className="flex items-center gap-2 px-3 py-1 border-purple-300 text-purple-700 bg-purple-50">
                                        <Users className="w-3 h-3" />
                                        <span>{userBadgeLabel}</span>
                                    </Badge>
                                )}
                                
                                {/* Task Filter Dropdown */}
                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="h-9 px-3 text-sm font-medium bg-white border-gray-300 hover:bg-gray-50"
                                                disabled={!selectedCase || loadingTasks}
                                            >
                                                <ListTodo className="w-4 h-4 text-gray-500" />
                                                <span className="truncate max-w-[160px]">{taskButtonLabel}</span>
                                                <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto z-[80]">
                                            {!selectedCase ? (
                                                <DropdownMenuItem disabled className="text-gray-400">
                                                    Please select a case first
                                                </DropdownMenuItem>
                                            ) : loadingTasks ? (
                                                <DropdownMenuItem disabled className="text-gray-400">
                                                    Loading tasks...
                                                </DropdownMenuItem>
                                            ) : tasks.length === 0 ? (
                                                <DropdownMenuItem disabled className="text-gray-400">
                                                    No tasks available
                                                </DropdownMenuItem>
                                            ) : (
                                                <>
                                                    <DropdownMenuItem
                                                        onSelect={(e) => {
                                                            e.preventDefault()
                                                            setSelectedTasks([])
                                                        }}
                                                        className={selectedTasks.length === 0 ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                                                    >
                                                        Clear Selection
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {tasks.map((task) => {
                                                        const isSelected = selectedTasks.some(selected => selected.task_id === task.task_id)
                                                        return (
                                                            <DropdownMenuCheckboxItem
                                                                key={task.task_id}
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleTaskSelection(task)}
                                                                className={isSelected ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                                                            >
                                                                {task.name}
                                                            </DropdownMenuCheckboxItem>
                                                        )
                                                    })}
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    {selectedTasks.length > 0 && (
                                        <button
                                            onClick={() => setSelectedTasks([])}
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                            title="Clear task filters"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    )}
                                </div>
                                
                                {/* User/Team Member Filter Dropdown */}
                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="h-9 px-3 text-sm font-medium bg-white border-gray-300 hover:bg-gray-50"
                                                disabled={loadingMembers}
                                            >
                                                <Users className="w-4 h-4 text-gray-500" />
                                                <span className="truncate max-w-[160px]">{userButtonLabel}</span>
                                                <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto z-[80]">
                                            {loadingMembers ? (
                                                <DropdownMenuItem disabled className="text-gray-400">
                                                    Loading members...
                                                </DropdownMenuItem>
                                            ) : teamMembers.length === 0 ? (
                                                <DropdownMenuItem disabled className="text-gray-400">
                                                    No members available
                                                </DropdownMenuItem>
                                            ) : (
                                                <>
                                                    <DropdownMenuItem
                                                        onSelect={(e) => {
                                                            e.preventDefault()
                                                            setSelectedUsers([])
                                                        }}
                                                        className={selectedUsers.length === 0 ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                                                    >
                                                        Clear Selection
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {teamMembers.map((member) => {
                                                        const userId = member.user?.user_id || member.user_id
                                                        const isSelected = selectedUsers.some(selected => {
                                                            const selectedId = selected.user?.user_id || selected.user_id
                                                            return selectedId === userId
                                                        })
                                                        return (
                                                            <DropdownMenuCheckboxItem
                                                                key={userId}
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleUserSelection(member)}
                                                                className={isSelected ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                                                            >
                                                                {member.user?.name || member.name}
                                                            </DropdownMenuCheckboxItem>
                                                        )
                                                    })}
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    {selectedUsers.length > 0 && (
                                        <button
                                            onClick={() => setSelectedUsers([])}
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                            title="Clear user filters"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right space-y-2">
                            <div>
                                <div className="text-2xl font-bold text-green-600">{updates.length}</div>
                                <div className="text-sm text-gray-500">
                                    {selectedCase || selectedTasks.length > 0 || selectedUsers.length > 0 ? 'Filtered Updates' : 'Total Updates'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={unreadCount === 0 || markingAll}
                                onClick={handleMarkAllUpdatesAsRead}
                            >
                                {markingAll ? 'Marking...' : 'Mark all as read'}
                            </Button>
                        </div>
                    </div>

                </div>

                {/* Updates List */}
                <div className="space-y-4">
                    {updates.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Updates Found</h3>
                            <p className="text-gray-600">
                                {emptyStateMessage}
                            </p>
                        </div>
                    ) : (
                        updates.map((update) => (
                            <div key={update.update_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <AvatarCompoment
                                        name={update?.user?.name}
                                        className="!w-12 !h-12 border-2 border-gray-100 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-900">
                                                        {update?.user?.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {moment(update?.created_at).format('MMM DD, YYYY HH:mm')}
                                                    </span>
                                                </div>
                                                {update.task && (
                                                    <Link
                                                        href={`/dashboard/project/${update.task.project_id}/task/${update.task.task_id}`}
                                                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                                    >
                                                        Task: {update.task.name}
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {update.is_read ? (
                                                    <span className="inline-flex items-center text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                                        <CheckCheck className="w-3 h-3 mr-1" />
                                                        Read
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                                        <CircleDot className="w-3 h-3 mr-1" />
                                                        Unread
                                                    </span>
                                                )}
                                                {!update.is_read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-sm text-blue-600"
                                                        onClick={() => handleMarkSingleUpdate(update.update_id)}
                                                        disabled={markingIds.includes(update.update_id)}
                                                    >
                                                        {markingIds.includes(update.update_id) ? 'Marking...' : 'Mark as read'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="text-gray-700 whitespace-pre-wrap mb-4">
                                            {update.content}
                                        </div>
                                        {update.is_read && update.read_at && (
                                            <p className="text-xs text-gray-500 mb-4">
                                                Viewed on {moment(update.read_at).format('MMM DD, YYYY HH:mm')}
                                            </p>
                                        )}

                                        {/* Attachments */}
                                        {update.Media && update.Media.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Paperclip className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Attachments ({update.Media.length})
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {update.Media.map((media, idx) => (
                                                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <Paperclip className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-blue-700 truncate">
                                                                            {media.filename}
                                                                        </p>
                                                                        {media.size && (
                                                                            <p className="text-xs text-blue-600">
                                                                                {formatFileSize(media.size)}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                                                    <button
                                                                        onClick={() => viewFile(media.file_url, media.filename)}
                                                                        className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                                                                        title="View file"
                                                                    >
                                                                        <Eye className="w-3 h-3" />
                                                                        View
                                                                    </button>
                                                                    <button
                                                                        onClick={() => downloadFile(media.file_url, media.filename)}
                                                                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                                                                        title="Download file"
                                                                    >
                                                                        <Download className="w-3 h-3" />
                                                                        Download
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

