"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Clock, Play, Square, Search, X } from 'lucide-react';
import { useTimer } from '@/providers/TimerProvider';
import { useUser } from '@/providers/UserProvider';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';
import { getAllUserTasksRequest } from '@/lib/http/task';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function TimerPage() {
  const router = useRouter();
  const { user } = useUser();
  const { activeTimer, startTimer, stopTimer, loadingStart, loadingStop } = useTimer();
  const { selectedCase, setSelectedCase, projects: filterProjects } = useDashboardFilter();

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [workDescription, setWorkDescription] = useState('');

  // Get all projects from DashboardFilterProvider (already loaded centrally)
  const projects = useMemo(() => {
    return filterProjects || [];
  }, [filterProjects]);

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];
    if (!searchTerm) return projects;
    return projects.filter(project =>
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  // Filter tasks based on search term
  const filteredTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    if (!searchTerm) return tasks;
    return tasks.filter(task =>
      task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  // Fetch tasks for selected project
  const fetchTasksForProject = useCallback(async (projectId) => {
    if (!projectId) return;
    
    setLoadingTasks(true);
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

      // Filter tasks for the selected project
      const projectTasks = allTasks.filter(task => 
        task.project_id === projectId && 
        task.status !== 'DONE' // Only show non-completed tasks
      );
      
      setTasks(projectTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      toast.error('Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  // Handle project selection
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setSelectedTask(null);
    setShowProjectDropdown(false);
    setSearchTerm('');
    fetchTasksForProject(project.project_id);
    // Update global selected case to sync with top navigation
    setSelectedCase(project);
  };

  // Handle task selection
  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setShowTaskDropdown(false);
  };

  // Handle timer start
  const handleStartTimer = async () => {
    if (!selectedTask || !selectedProject) return;
    
    try {
      await startTimer(
        selectedTask.task_id,
        selectedTask.name,
        selectedProject.project_id,
        selectedProject.name
      );
      toast.success('Timer started successfully!');
      // Navigate back or clear selection
      setSelectedProject(null);
      setSelectedTask(null);
      setTasks([]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to start timer');
    }
  };

  // Handle timer stop
  const handleStopTimer = async () => {
    if (!activeTimer) return;
    
    try {
      await stopTimer(workDescription);
      setShowStopDialog(false);
      setWorkDescription('');
      toast.success('Timer stopped successfully!');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to stop timer');
    }
  };

  // Auto-select project if one is selected in top navigation (only when changed externally)
  useEffect(() => {
    if (selectedCase && projects.length > 0) {
      const project = projects.find(p => p.project_id === selectedCase.project_id);
      if (project && (!selectedProject || selectedProject.project_id !== project.project_id)) {
        // Don't update if we just set it ourselves (prevent loop)
        setSelectedProject(project);
        fetchTasksForProject(project.project_id);
      }
    }
  }, [selectedCase, projects, fetchTasksForProject, selectedProject]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = () => {
      setShowProjectDropdown(false);
      setShowTaskDropdown(false);
    };
    
    if (showProjectDropdown || showTaskDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showProjectDropdown, showTaskDropdown]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Timer</h1>
              <p className="text-gray-600">Select a project and task to start timing your work</p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Project Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Select Project
              </label>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProjectDropdown(!showProjectDropdown);
                  }}
                  className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm">
                    {selectedProject ? selectedProject.name : 'Choose a project...'}
                  </span>
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                </button>

                {showProjectDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden flex flex-col">
                    {/* Search */}
                    <div className="p-3 border-b bg-gray-50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search projects..."
                          value={searchTerm}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSearchTerm(e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Project List */}
                    <div className="overflow-y-auto max-h-64">
                      {filteredProjects.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          No projects found
                        </div>
                      ) : (
                        filteredProjects.map((project, index) => (
                          <button
                            key={`${project.project_id}-${index}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectSelect(project);
                            }}
                            className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-sm text-gray-900">{project.name}</div>
                            {project.client_name && (
                              <div className="text-xs text-gray-500">{project.client_name}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Task Selection */}
            {selectedProject && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Select Task
                </label>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTaskDropdown(!showTaskDropdown);
                    }}
                    disabled={loadingTasks}
                    className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <span className="text-sm">
                      {loadingTasks ? 'Loading tasks...' : 
                       selectedTask ? selectedTask.name : 'Choose a task...'}
                    </span>
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  </button>

                  {showTaskDropdown && !loadingTasks && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                      {filteredTasks.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          No tasks found for this project
                        </div>
                      ) : (
                        filteredTasks.map((task) => (
                          <button
                            key={task.task_id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskSelect(task);
                            }}
                            className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-sm text-gray-900">{task.name}</div>
                            <div className="text-xs text-gray-500">
                              {task.status} • {task.priority} Priority
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active Timer Info */}
            {activeTimer && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-blue-800">
                      Timer Running: {activeTimer.task_name}
                    </div>
                    <div className="text-xs text-blue-600">
                      Project: {activeTimer.project_name}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStopDialog(true)}
                    className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              {!activeTimer && (
                <Button
                  onClick={handleStartTimer}
                  disabled={!selectedTask || loadingStart === selectedTask?.task_id}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {loadingStart === selectedTask?.task_id ? 'Starting...' : 'Start Timer'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stop Timer Dialog */}
        <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Stop Timer</DialogTitle>
              <DialogDescription>
                Add a work description for the time spent on "{activeTimer?.task_name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Work Description (Optional)
                </label>
                <textarea
                  className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe what you worked on..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowStopDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStopTimer}
                disabled={loadingStop}
                className="bg-red-600 hover:bg-red-700"
              >
                {loadingStop ? 'Stopping...' : 'Stop Timer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


