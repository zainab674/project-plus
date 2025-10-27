"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronDown, Clock, Play, Square, Search, X } from 'lucide-react';
import { useTimer } from '@/providers/TimerProvider';
import { getAllUserTasksRequest } from '@/lib/http/task';
import { toast } from 'sonner';

const TimerModal = ({ isOpen, onClose, projects = [] }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [workDescription, setWorkDescription] = useState('');

  const { activeTimer, startTimer, stopTimer, loadingStart, loadingStop } = useTimer();



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
  const fetchTasksForProject = async (projectId) => {
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
  };

  // Handle project selection
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setSelectedTask(null);
    setShowProjectDropdown(false);
    setSearchTerm('');
    fetchTasksForProject(project.project_id);
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
      onClose();
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

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProject(null);
      setSelectedTask(null);
      setTasks([]);
      setSearchTerm('');
      setShowProjectDropdown(false);
      setShowTaskDropdown(false);
      setWorkDescription('');
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Start Timer
            </DialogTitle>
            <DialogDescription>
              Select a project and task to start timing your work
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select Project
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-sm">
                    {selectedProject ? selectedProject.name : 'Choose a project...'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {showProjectDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {/* Search */}
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search projects..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Project List */}
                    {filteredProjects.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        No projects found
                      </div>
                    ) : (
                      filteredProjects.map((project, index) => (
                        <button
                          key={`${project.project_id}-${index}`}
                          onClick={() => handleProjectSelect(project)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-sm">{project.name}</div>
                          {project.client_name && (
                            <div className="text-xs text-gray-500">{project.client_name}</div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Task Selection */}
            {selectedProject && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Task
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                    disabled={loadingTasks}
                    className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="text-sm">
                      {loadingTasks ? 'Loading tasks...' : 
                       selectedTask ? selectedTask.name : 'Choose a task...'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                  {showTaskDropdown && !loadingTasks && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {filteredTasks.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          No tasks found for this project
                        </div>
                      ) : (
                        filteredTasks.map((task) => (
                          <button
                            key={task.task_id}
                            onClick={() => handleTaskSelect(task)}
                            className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-sm">{task.name}</div>
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
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-800">
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
                    <Square className="h-4 w-4 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {!activeTimer && (
              <Button
                onClick={handleStartTimer}
                disabled={!selectedTask || loadingStart === selectedTask?.task_id}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-4 w-4 mr-2" />
                {loadingStart === selectedTask?.task_id ? 'Starting...' : 'Start Timer'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </>
  );
};

export default TimerModal;
