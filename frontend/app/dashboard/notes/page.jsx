"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StickyNote, FileIcon } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';
import { useProjectState } from '@/hooks/useProjectState';
import NotesDisplay from '@/components/NotesDisplay';

export default function NotesPage() {
  const router = useRouter();
  const { user, loadUserWithProjects } = useUser();
  const { selectedCase, setSelectedCase } = useDashboardFilter();
  const projectState = useProjectState(user, loadUserWithProjects || (() => Promise.resolve()));
  
  const [selectedNotesProject, setSelectedNotesProject] = useState(null);
  const hasFetchedProjects = useRef(false);

  // Auto-select project if one is selected in top navigation
  useEffect(() => {
    if (selectedCase && projectState.projects) {
      const project = projectState.projects.find(
        p => p.project_id === selectedCase.project_id
      );
      if (project && (!selectedNotesProject || selectedNotesProject.project_id !== project.project_id)) {
        setSelectedNotesProject(project);
      }
    }
  }, [selectedCase, projectState.projects, selectedNotesProject]);

  // Load projects on mount - only once
  useEffect(() => {
    if (!hasFetchedProjects.current && !projectState.projects && !projectState.projectsLoading) {
      hasFetchedProjects.current = true;
      projectState.fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectState.projects, projectState.projectsLoading]);

  // Handle project selection
  const handleProjectSelect = useCallback((project) => {
    setSelectedNotesProject(project);
    // Update global selected case to sync with top navigation
    setSelectedCase(project);
  }, [setSelectedCase]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <StickyNote className="w-8 h-8 text-emerald-600" />
                  <h1 className="text-3xl font-semibold text-gray-900">Notes</h1>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto my-6 px-6">
              {selectedNotesProject ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileIcon className="w-5 h-5 text-gray-600" />
                      <h2 className="text-lg font-semibold text-gray-800">{selectedNotesProject.name}</h2>
                    </div>
                    {selectedNotesProject.client_name && (
                      <p className="text-sm text-gray-600">{selectedNotesProject.client_name}</p>
                    )}
                    <button
                      onClick={() => setSelectedNotesProject(null)}
                      className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 underline"
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <StickyNote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Select a project to view notes</p>
                      <p className="text-sm text-gray-500 mt-2">Notes are specific to projects</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Select Project</h3>
                      {projectState.projectsLoading ? (
                        <div className="text-center py-4 text-gray-500">
                          Loading projects...
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {projectState.projects && projectState.projects.length > 0 ? (
                            projectState.projects.map((project) => (
                              <button
                                key={project.project_id}
                                onClick={() => handleProjectSelect(project)}
                                className="w-full p-3 rounded-lg border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                              >
                                <div className="font-medium text-gray-900">{project.name}</div>
                                {project.client_name && (
                                  <div className="text-sm text-gray-500">{project.client_name}</div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              No projects available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

