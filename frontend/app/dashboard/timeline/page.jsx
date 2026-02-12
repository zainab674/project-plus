"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Clock, Users, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import LawFirmTimeline from '@/components/dashboards/timeLine';
import Loader from '@/components/Loader';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';
import { ChevronDown } from 'lucide-react';

export default function TimelinePage() {
  const {
    selectedCase,
    filteredTimelineData,
    fetchTimelineData,
    isLoading,
    projects
  } = useDashboardFilter();

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState([]);

  // Fetch timeline data when component mounts or when selected case changes
  useEffect(() => {
    fetchTimelineData();
  }, [selectedCase, fetchTimelineData]);

  // Extract unique users from timeline data and team members from projects
  const availableUsers = useMemo(() => {
    const userSet = new Set();
    
    // First, extract users from timeline activities
    if (filteredTimelineData) {
      const { times, progress, documents, caseComments, taskComments, reviews } = filteredTimelineData;

      // Extract users from time entries
      times?.forEach(project => {
        project.Time?.forEach(entry => {
          if (entry.user?.name) userSet.add(entry.user.name);
        });
      });

      // Extract users from progress entries
      progress?.forEach(project => {
        project.Tasks?.forEach(task => {
          task.Progress?.forEach(progress => {
            if (progress.user?.name) userSet.add(progress.user.name);
          });
        });
      });

      // Extract users from case comments
      caseComments?.forEach(project => {
        project.Comments?.forEach(comment => {
          if (comment.user?.name) userSet.add(comment.user.name);
        });
      });

      // Extract users from task comments
      taskComments?.forEach(project => {
        project.Tasks?.forEach(task => {
          task.Comments?.forEach(comment => {
            if (comment.user?.name) userSet.add(comment.user.name);
          });
        });
      });

      // Extract users from reviews
      reviews?.forEach(project => {
        project.Tasks?.forEach(task => {
          task.inReview?.forEach(review => {
            if (review.submitted_by?.name) userSet.add(review.submitted_by.name);
            if (review.acted_by?.name) userSet.add(review.acted_by.name);
          });
        });
      });
    }

    // Also extract team members from projects (even if they have no activities)
    if (projects && Array.isArray(projects)) {
      projects.forEach(project => {
        // If a case is selected, only include members from that case
        if (selectedCase && project.project_id !== selectedCase.project_id) {
          return;
        }
        
        // Extract team members from project
        if (project.Members && Array.isArray(project.Members)) {
          project.Members.forEach(member => {
            if (member.user?.name) {
              userSet.add(member.user.name);
            }
          });
        }
      });
    }

    return Array.from(userSet).sort();
  }, [filteredTimelineData, selectedCase, projects]);

  // Activity type options
  const activityTypes = [
    { value: null, label: 'All Activities' },
    { value: 'case_comment', label: 'Case Notes' },
    { value: 'task_comment', label: 'Task Notes' },
    { value: 'progress', label: 'Progress Updates' },
    { value: 'meeting', label: 'Meetings' },
    { value: 'review', label: 'Reviews' },
    { value: 'time', label: 'Time Tracking' },
    { value: 'document', label: 'Documents' },
  ];

  // Toggle user selection
  const toggleUser = (user) => {
    setSelectedUsers(prev => 
      prev.includes(user) 
        ? prev.filter(u => u !== user)
        : [...prev, user]
    );
  };

  // Toggle activity type selection
  const toggleActivityType = (activityType) => {
    setSelectedActivityTypes(prev => 
      prev.includes(activityType) 
        ? prev.filter(a => a !== activityType)
        : [...prev, activityType]
    );
  };

  // Clear filters
  const handleClearFilters = () => {
    setSelectedUsers([]);
    setSelectedActivityTypes([]);
  };

  const hasActiveFilters = selectedUsers.length > 0 || selectedActivityTypes.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-gray-600" />
              <h1 className="text-2xl font-semibold text-gray-800">
                {selectedCase ? `Timeline: ${selectedCase.name}` : 'Timeline Activities'}
              </h1>
            </div>
            <Button
              onClick={fetchTimelineData}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-gray-300 hover:bg-gray-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
              Refresh
            </Button>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* User Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-9 px-3 text-sm font-medium bg-white border-gray-300 hover:bg-gray-50"
                >
                  <Users className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="truncate max-w-[120px]">
                    {selectedUsers.length === 0 
                      ? "All Users" 
                      : selectedUsers.length === 1 
                        ? selectedUsers[0]
                        : `${selectedUsers.length} Users`}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 max-h-96 overflow-y-auto bg-white border border-gray-200 shadow-lg"
                align="start"
              >
                <div className="px-3 py-2 border-b border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900">Filter by User</h4>
                </div>
                <DropdownMenuItem 
                  onClick={() => setSelectedUsers([])}
                  className={`px-3 py-2 cursor-pointer ${
                    selectedUsers.length === 0
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === 0}
                      onChange={() => setSelectedUsers([])}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>All Users</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableUsers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No users found
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <DropdownMenuItem
                      key={user}
                      onClick={() => toggleUser(user)}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-50"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user)}
                          onChange={() => toggleUser(user)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className={selectedUsers.includes(user) ? 'font-medium text-blue-700' : ''}>
                          {user}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Activity Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-9 px-3 text-sm font-medium bg-white border-gray-300 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="truncate max-w-[140px]">
                    {selectedActivityTypes.length === 0
                      ? "All Activities"
                      : selectedActivityTypes.length === 1
                        ? activityTypes.find(t => t.value === selectedActivityTypes[0])?.label || "1 Activity"
                        : `${selectedActivityTypes.length} Activities`}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-white border border-gray-200 shadow-lg"
                align="start"
              >
                <div className="px-3 py-2 border-b border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900">Filter by Activity</h4>
                </div>
                {activityTypes.map((type) => (
                  <DropdownMenuItem
                    key={type.value || 'all'}
                    onClick={() => {
                      if (type.value === null) {
                        setSelectedActivityTypes([]);
                      } else {
                        toggleActivityType(type.value);
                      }
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-50"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={type.value === null 
                          ? selectedActivityTypes.length === 0
                          : selectedActivityTypes.includes(type.value)}
                        onChange={() => {
                          if (type.value === null) {
                            setSelectedActivityTypes([]);
                          } else {
                            toggleActivityType(type.value);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className={
                        (type.value === null && selectedActivityTypes.length === 0) ||
                        (type.value !== null && selectedActivityTypes.includes(type.value))
                          ? 'font-medium text-blue-700' 
                          : ''
                      }>
                        {type.label}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="h-9 px-3 text-sm text-gray-600 hover:text-gray-800 border-gray-300"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading timeline data...</p>
            </div>
          </div>
        ) : filteredTimelineData ? (
          <LawFirmTimeline
            selectedProjectForTimeline={selectedCase}
            timelineData={filteredTimelineData}
            timelineLoading={isLoading}
            selectedUsers={selectedUsers}
            selectedActivityTypes={selectedActivityTypes}
          />
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No Timeline Data Available
            </h3>
            <p className="text-gray-500">
              {selectedCase 
                ? `No timeline data found for ${selectedCase.name}.` 
                : 'No timeline data found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
