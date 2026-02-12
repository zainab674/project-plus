"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';
import { useUser } from '@/providers/UserProvider';
import { getAllUserTasksRequest } from '@/lib/http/task';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  ChevronDown, 
  X, 
  Filter,
  Search,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  RotateCcw
} from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { getColorByFirstLetter } from '@/utils/getColorByFirstLetter';
import Loader from '@/components/Loader';
import Link from 'next/link';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

// Extend dayjs with isBetween plugin
dayjs.extend(isBetween);

export default function TasksPage() {
  const router = useRouter();
  const { selectedCase, projects } = useDashboardFilter();
  const { user } = useUser();
  
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  
  // Get all team members from tasks and projects
  const teamMembers = useMemo(() => {
    const membersMap = new Map();
    
    // Get members from tasks
    tasks.forEach(task => {
      if (task.assignees && Array.isArray(task.assignees)) {
        task.assignees.forEach(assignee => {
          if (assignee.user && !membersMap.has(assignee.user.user_id)) {
            membersMap.set(assignee.user.user_id, {
              id: assignee.user.user_id,
              name: assignee.user.name,
              email: assignee.user.email,
            });
          }
        });
      }
      // Also check assigned_to
      if (task.assigned_to && typeof task.assigned_to === 'object' && task.assigned_to.user_id) {
        if (!membersMap.has(task.assigned_to.user_id)) {
          membersMap.set(task.assigned_to.user_id, {
            id: task.assigned_to.user_id,
            name: task.assigned_to.name,
            email: task.assigned_to.email,
          });
        }
      }
    });
    
    // Get members from user's projects
    const userProjects = user?.Projects || [];
    const userCollaboration = user?.Collaboration || [];
    
    [...userProjects, ...userCollaboration].forEach(project => {
      if (project.Members && Array.isArray(project.Members)) {
        project.Members.forEach(member => {
          if (member.user && !membersMap.has(member.user.user_id)) {
            membersMap.set(member.user.user_id, {
              id: member.user.user_id,
              name: member.user.name,
              email: member.user.email,
            });
          }
        });
      }
    });
    
    return Array.from(membersMap.values());
  }, [tasks, user]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllUserTasksRequest();
      let allTasks = [];
      
      if (response?.data?.tasks && Array.isArray(response.data.tasks)) {
        allTasks = response.data.tasks;
      } else if (response?.tasks && Array.isArray(response.tasks)) {
        allTasks = response.tasks;
      } else if (Array.isArray(response)) {
        allTasks = response;
      }

      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filter by selected case
    if (selectedCase?.project_id) {
      filtered = filtered.filter(task => task.project_id === selectedCase.project_id);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(task => {
        if (!task.created_at && !task.last_date) return false;
        
        const taskDate = dayjs(task.last_date || task.created_at);
        const startDate = dateRange.start ? dayjs(dateRange.start) : null;
        const endDate = dateRange.end ? dayjs(dateRange.end) : null;
        
        if (startDate && endDate) {
          return taskDate.isBetween(startDate, endDate, 'day', '[]');
        } else if (startDate) {
          return taskDate.isAfter(startDate, 'day') || taskDate.isSame(startDate, 'day');
        } else if (endDate) {
          return taskDate.isBefore(endDate, 'day') || taskDate.isSame(endDate, 'day');
        }
        return true;
      });
    }

    // Filter by team member
    if (selectedTeamMembers.length > 0) {
      filtered = filtered.filter(task => {
        // Check assignees
        if (task.assignees && Array.isArray(task.assignees)) {
          const hasMember = task.assignees.some(assignee =>
            selectedTeamMembers.some(member => assignee.user?.user_id === member.id)
          );
          if (hasMember) return true;
        }
        // Check assigned_to
        if (task.assigned_to) {
          if (typeof task.assigned_to === 'object' && selectedTeamMembers.some(member => task.assigned_to.user_id === member.id)) {
            return true;
          }
          if (typeof task.assigned_to === 'number' && selectedTeamMembers.some(member => task.assigned_to === member.id)) {
            return true;
          }
        }
        return false;
      });
    }

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(task => selectedStatuses.includes(task.status));
    }

    return filtered;
  }, [tasks, selectedCase, searchTerm, dateRange, selectedTeamMembers, selectedStatuses]);

  // Get status options
  const statusOptions = ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'OVER_DUE'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'DONE': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'OVER_DUE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const hasActiveFilters = selectedCase || dateRange.start || dateRange.end || selectedTeamMembers.length > 0 || selectedStatuses.length > 0;

  const resetFilters = () => {
    setDateRange({ start: '', end: '' });
    setSelectedTeamMembers([]);
    setSelectedStatuses([]);
  };

  const toggleTeamMember = useCallback((member) => {
    setSelectedTeamMembers(prev => {
      const exists = prev.some(selected => selected.id === member.id);
      if (exists) {
        return prev.filter(selected => selected.id !== member.id);
      }
      return [...prev, member];
    });
  }, []);

  const toggleStatus = useCallback((status) => {
    setSelectedStatuses(prev => {
      const exists = prev.includes(status);
      if (exists) {
        return prev.filter(selected => selected !== status);
      }
      return [...prev, status];
    });
  }, []);

  const getTeamMemberLabel = () => {
    if (selectedTeamMembers.length === 0) return "All Members";
    if (selectedTeamMembers.length === 1) return selectedTeamMembers[0].name;
    return `${selectedTeamMembers[0].name} +${selectedTeamMembers.length - 1}`;
  };

  const getStatusLabel = () => {
    if (selectedStatuses.length === 0) return "All Status";
    if (selectedStatuses.length === 1) return selectedStatuses[0].replace('_', ' ');
    return `${selectedStatuses[0].replace('_', ' ')} +${selectedStatuses.length - 1}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Tasks</h1>
              <p className="text-gray-600 mt-1">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
                {selectedCase && ` for ${selectedCase.name}`}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  placeholder="Start Date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  placeholder="End Date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {(dateRange.start || dateRange.end) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange({ start: '', end: '' })}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Team Members Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-9 px-3 text-sm font-medium bg-white border-gray-300 hover:bg-gray-50"
                  >
                    <Users className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="truncate max-w-[140px]">
                      {getTeamMemberLabel()}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setSelectedTeamMembers([]);
                    }}
                    className={selectedTeamMembers.length === 0 ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                  >
                    Clear Selection
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {teamMembers.map((member) => (
                    <DropdownMenuCheckboxItem
                      key={member.id}
                      checked={selectedTeamMembers.some(selected => selected.id === member.id)}
                      onCheckedChange={() => toggleTeamMember(member)}
                      className={selectedTeamMembers.some(selected => selected.id === member.id) ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${getColorByFirstLetter(member.name)}`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{member.name}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-9 px-3 text-sm font-medium bg-white border-gray-300 hover:bg-gray-50"
                  >
                    <Filter className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="truncate max-w-[120px]">
                      {getStatusLabel()}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setSelectedStatuses([]);
                    }}
                    className={selectedStatuses.length === 0 ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                  >
                    Clear Selection
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {statusOptions.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                      className={selectedStatuses.includes(status) ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                    >
                      <span className="capitalize">{status.replace('_', ' ').toLowerCase()}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="h-9 px-3 text-sm text-gray-600 hover:text-gray-800 border-gray-300"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">
              {hasActiveFilters 
                ? "Try adjusting your filters to see more tasks"
                : "No tasks available at the moment"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Task Name</TableHead>
                  <TableHead className="font-semibold">Case</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Priority</TableHead>
                  <TableHead className="font-semibold">Assigned To</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const taskDetailUrl = task.project_id 
                    ? `/dashboard/project/${task.project_id}/task/${task.task_id}`
                    : `/dashboard/projects/tasks/${task.task_id}`;
                  
                  return (
                  <TableRow 
                    key={task.task_id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(taskDetailUrl)}
                  >
                    <TableCell>
                      <Link
                        href={taskDetailUrl}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {task.name || 'Untitled Task'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {task.project ? (
                        <Link
                          href={`/dashboard/project/${task.project_id}`}
                          className="text-gray-600 hover:text-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {task.project.name || `Case ${task.project_id}`}
                        </Link>
                      ) : (
                        <span className="text-gray-400">No case</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status?.replace('_', ' ') || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.priority && (
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {task.assignees && task.assignees.length > 0 ? (
                          <div className="flex -space-x-2">
                            {task.assignees.slice(0, 3).map((assignee, idx) => (
                              <div
                                key={idx}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white ${getColorByFirstLetter(assignee.user?.name || 'U')}`}
                                title={assignee.user?.name || 'Unknown'}
                              >
                                {assignee.user?.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            ))}
                            {task.assignees.length > 3 && (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-gray-400 text-white border-2 border-white">
                                +{task.assignees.length - 3}
                              </div>
                            )}
                          </div>
                        ) : task.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${getColorByFirstLetter(typeof task.assigned_to === 'object' ? task.assigned_to.name : 'U')}`}>
                              {typeof task.assigned_to === 'object' ? task.assigned_to.name?.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span className="text-sm text-gray-600">
                              {typeof task.assigned_to === 'object' ? task.assigned_to.name : 'Assigned'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.last_date ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(task.last_date)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {task.created_at ? formatDate(task.created_at) : 'N/A'}
                      </span>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

