"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StickyNote, FileIcon, ChevronDown, Search } from 'lucide-react';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';
import { useUser } from '@/providers/UserProvider';
import { useProjectState } from '@/hooks/useProjectState';
import NotesDisplay from '@/components/NotesDisplay';

const NotesModal = ({ isOpen, onClose }) => {
  const { selectedCase, setSelectedCase, projects: filterProjects } = useDashboardFilter();
  const { user, loadUserWithProjects } = useUser();
  const projectState = useProjectState(user, loadUserWithProjects || (() => Promise.resolve()));
  
  const [selectedNotesProject, setSelectedNotesProject] = useState(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const hasFetchedProjects = useRef(false);

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

  // Auto-select project if one is selected in top navigation
  useEffect(() => {
    if (isOpen && selectedCase && projects.length > 0) {
      const project = projects.find(p => p.project_id === selectedCase.project_id);
      if (project && (!selectedNotesProject || selectedNotesProject.project_id !== project.project_id)) {
        setSelectedNotesProject(project);
      }
    }
  }, [isOpen, selectedCase, projects, selectedNotesProject]);

  // Load projects on mount - only once
  useEffect(() => {
    if (isOpen && !hasFetchedProjects.current && !projectState.projects && !projectState.projectsLoading) {
      hasFetchedProjects.current = true;
      projectState.fetchProjects();
    }
  }, [isOpen, projectState.projects, projectState.projectsLoading, projectState]);

  // Handle project selection
  const handleProjectSelect = useCallback((project) => {
    setSelectedNotesProject(project);
    setShowProjectDropdown(false);
    setSearchTerm('');
    // Update global selected case to sync with top navigation
    setSelectedCase(project);
  }, [setSelectedCase]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedNotesProject(null);
      setSearchTerm('');
      setShowProjectDropdown(false);
      hasFetchedProjects.current = false;
    }
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      setShowProjectDropdown(false);
    };
    
    if (showProjectDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showProjectDropdown]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <StickyNote className="h-4 w-4 text-emerald-600" />
            Notes
          </DialogTitle>
          <DialogDescription className="text-xs">
            View and manage notes for your projects
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Project Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">
              Select Project
            </label>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProjectDropdown(!showProjectDropdown);
                }}
                className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-xs">
                  {selectedNotesProject ? selectedNotesProject.name : 'Choose a project...'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </button>

              {showProjectDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-hidden flex flex-col">
                  {/* Search */}
                  <div className="p-1.5 border-b bg-gray-50">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSearchTerm(e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Project List */}
                  <div className="overflow-y-auto max-h-36">
                    {filteredProjects.length === 0 ? (
                      <div className="p-2 text-xs text-gray-500 text-center">
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
                          className="w-full text-left p-2 hover:bg-emerald-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-xs text-gray-900">{project.name}</div>
                          {project.client_name && (
                            <div className="text-[10px] text-gray-500">{project.client_name}</div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes Display */}
          {selectedNotesProject ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileIcon className="w-4 h-4 text-gray-600" />
                  <h2 className="text-sm font-semibold text-gray-800">{selectedNotesProject.name}</h2>
                </div>
                {selectedNotesProject.client_name && (
                  <p className="text-xs text-gray-600">{selectedNotesProject.client_name}</p>
                )}
                <button
                  onClick={() => setSelectedNotesProject(null)}
                  className="mt-1 text-xs text-emerald-600 hover:text-emerald-700 underline"
                >
                  Change Project
                </button>
              </div>
              <NotesDisplay
                projectId={selectedNotesProject.project_id}
                taskId={null}
                showAddButton={true}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-center py-4">
                <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-600 font-medium">Select a project to view notes</p>
                <p className="text-[10px] text-gray-500 mt-1">Notes are specific to projects</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotesModal;


