"use client";

import React, { useState, useCallback } from 'react';
import { X, Search, GitBranch, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import CaseComprehensiveView from '../case/CaseComprehensiveView';

// Utility function to download files with proper filename
const downloadFile = async (url, filename) => {
  try {
    console.log('Downloading file:', { url, filename });
    
    // Always prioritize the provided filename over URL extraction
    let finalFilename = filename;
    
    // Only extract from URL if no filename is provided at all
    if (!finalFilename && url) {
      const urlParts = url.split('/');
      finalFilename = urlParts[urlParts.length - 1];
      // Remove query parameters if any
      finalFilename = finalFilename.split('?')[0];
    }
    
    console.log('Final filename:', finalFilename);
    
    // First try the blob approach
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
    });
    
    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      // Fallback to direct link approach
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename || 'document';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    
  } catch (error) {
    console.error('Download error:', error);
    // Fallback to direct link approach
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError);
      // Last resort - open in new tab
      window.open(url, '_blank');
    }
  }
};

const FlowchartModal = ({
    isOpen,
    onClose,
    projects,
    projectsLoading,
    searchTerm,
    setSearchTerm,
    selectedProjectForTimeline,
    setSelectedProjectForTimeline
}) => {
    const [showComprehensiveView, setShowComprehensiveView] = useState(false);
    if (!isOpen) return null;

    // Filter projects based on search term
    const filteredProjects = projects?.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <GitBranch className="w-6 h-6 text-gray-600" />
                                <h2 className="text-xl font-semibold text-gray-800">Project Flowchart</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[85vh] overflow-y-auto p-6">
                        {!selectedProjectForTimeline ? (
                            // Project Selection View
                            <>
                                {/* Search Bar */}
                                <div className="mb-6">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search projects..."
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Projects List */}
                                {projectsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredProjects?.map((project) => (
                                            <button
                                                key={project.project_id}
                                                onClick={() => setSelectedProjectForTimeline(project)}
                                                className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                                                        {project.name}
                                                    </h3>
                                                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${project.status === 'Active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {project.status || 'Unknown'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    Client: {project.client_name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {project.description ?
                                                        (project.description.length > 100
                                                            ? `${project.description.substring(0, 100)}...`
                                                            : project.description
                                                        ) : 'No description available'
                                                    }
                                                </p>
                                                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                                    <span>📋 {project.Tasks?.length || 0} Tasks</span>
                                                    <span>👥 {project.Members?.length || 0} Members</span>
                                                    <span>🏢 {project.Clients?.length || 0} Clients</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!projectsLoading && filteredProjects?.length === 0 && (
                                    <div className="text-center py-12">
                                        <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No projects found.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            // Flowchart View
                            <div className="space-y-6">
                                {/* Back Button */}
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setSelectedProjectForTimeline(null)}
                                        className="flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Back to Projects
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                            Project: <span className="font-semibold">{selectedProjectForTimeline.name}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Project Overview */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <h3 className="font-semibold text-gray-800 mb-2">Project Info</h3>
                                            <div className="space-y-2 text-sm">
                                                <p><span className="font-medium">Status:</span>
                                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${selectedProjectForTimeline.status === 'Active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {selectedProjectForTimeline.status || 'Unknown'}
                                                    </span>
                                                </p>
                                                <p><span className="font-medium">Client:</span> {selectedProjectForTimeline.client_name || 'N/A'}</p>
                                                <p><span className="font-medium">Description:</span> {selectedProjectForTimeline.description || 'No description'}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <h3 className="font-semibold text-gray-800 mb-2">Team Members</h3>
                                            <div className="space-y-2">
                                                {selectedProjectForTimeline.Members && selectedProjectForTimeline.Members.length > 0 ? (
                                                    selectedProjectForTimeline.Members.map((member, index) => (
                                                        <div key={index} className="flex items-center gap-2 text-sm">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                            <span>{member.user?.name || 'Unknown'}</span>
                                                            <span className="text-gray-500">({member.role})</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-500 text-sm">No team members</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <h3 className="font-semibold text-gray-800 mb-2">Clients</h3>
                                            <div className="space-y-2">
                                                {selectedProjectForTimeline.Clients && selectedProjectForTimeline.Clients.length > 0 ? (
                                                    selectedProjectForTimeline.Clients.map((client, index) => (
                                                        <div key={index} className="flex items-center gap-2 text-sm">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            <span>{client.user?.name || 'Unknown'}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-500 text-sm">No clients</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <h3 className="font-semibold text-gray-800 mb-2">Quick Stats</h3>
                                            <div className="space-y-2 text-sm">
                                                <p><span className="font-medium">Tasks:</span> {selectedProjectForTimeline.Tasks?.length || 0}</p>
                                                <p><span className="font-medium">Documents:</span> {selectedProjectForTimeline.Media?.length || 0}</p>
                                                <p><span className="font-medium">Time Entries:</span> {selectedProjectForTimeline.Time?.length || 0}</p>
                                                <p><span className="font-medium">Comments:</span> {selectedProjectForTimeline.Comments?.length || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>



                                {/* Comprehensive Case Details Section */}
                                <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                            📋 Complete Case Details
                                            <span className="text-sm font-normal text-gray-500">({selectedProjectForTimeline.name})</span>
                                        </h3>
                                        <Button
                                            onClick={() => setShowComprehensiveView(true)}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Comprehensive Case
                                        </Button>
                                    </div>

                                    {/* Case Information Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                        {/* Basic Case Information */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                📄 Case Information
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Case ID:</span>
                                                    <span className="text-gray-800">{selectedProjectForTimeline.project_id}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Case Name:</span>
                                                    <span className="text-gray-800">{selectedProjectForTimeline.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Status:</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${selectedProjectForTimeline.status === 'Active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {selectedProjectForTimeline.status || 'Unknown'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Client:</span>
                                                    <span className="text-gray-800">{selectedProjectForTimeline.client_name || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Created:</span>
                                                    <span className="text-gray-800">
                                                        {selectedProjectForTimeline.created_at ?
                                                            new Date(selectedProjectForTimeline.created_at).toLocaleDateString() :
                                                            'N/A'
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Last Updated:</span>
                                                    <span className="text-gray-800">
                                                        {selectedProjectForTimeline.updated_at ?
                                                            new Date(selectedProjectForTimeline.updated_at).toLocaleDateString() :
                                                            'N/A'
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Description:</span>
                                                    <span className="text-gray-800 text-right max-w-xs">
                                                        {selectedProjectForTimeline.description || 'No description available'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Team & Stakeholders */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                👥 Team & Stakeholders
                                            </h4>
                                            <div className="space-y-3">
                                                {/* Team Members */}
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-700 mb-2">Team Members ({selectedProjectForTimeline.Members?.length || 0})</h5>
                                                    <div className="space-y-1">
                                                        {selectedProjectForTimeline.Members && selectedProjectForTimeline.Members.length > 0 ? (
                                                            selectedProjectForTimeline.Members.map((member, index) => (
                                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                    <span className="text-gray-800">{member.user?.name || 'Unknown'}</span>
                                                                    <span className="text-gray-500">({member.role})</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-gray-500 text-sm">No team members assigned</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Clients */}
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-700 mb-2">Clients ({selectedProjectForTimeline.Clients?.length || 0})</h5>
                                                    <div className="space-y-1">
                                                        {selectedProjectForTimeline.Clients && selectedProjectForTimeline.Clients.length > 0 ? (
                                                            selectedProjectForTimeline.Clients.map((client, index) => (
                                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                    <span className="text-gray-800">{client.user?.name || 'Unknown'}</span>
                                                                    <span className="text-gray-500">({client.user?.email || 'No email'})</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-gray-500 text-sm">No clients assigned</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Sections */}
                                    <div className="space-y-6">
                                        {/* Tasks Section */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                ✅ Tasks & Milestones ({selectedProjectForTimeline.Tasks?.length || 0})
                                            </h4>
                                            {selectedProjectForTimeline.Tasks && selectedProjectForTimeline.Tasks.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {selectedProjectForTimeline.Tasks.map((task, index) => (
                                                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h5 className="font-medium text-gray-800 text-sm">{task.name}</h5>
                                                                <span className={`px-2 py-1 rounded-full text-xs ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                    task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {task.status || 'pending'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 mb-2">{task.description || 'No description'}</p>
                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                                                                <span>Priority: {task.priority || 'Medium'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">No tasks found for this case</p>
                                            )}
                                        </div>

                                        {/* Documents Section */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                📄 Documents & Files ({selectedProjectForTimeline.Media?.length || 0})
                                            </h4>
                                            {selectedProjectForTimeline.Media && selectedProjectForTimeline.Media.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {selectedProjectForTimeline.Media.map((doc, index) => (
                                                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h5 className="font-medium text-gray-800 text-sm">{doc.filename || 'Unnamed Document'}</h5>
                                                                <span className="text-xs text-gray-500">
                                                                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown date'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <span>Type: {doc.mimeType || 'Unknown'}</span>
                                                                <span>Size: {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</span>
                                                            </div>
                                                            {doc.file_url && (
                                                                <div className="flex gap-2 mt-2">
                                                                    <button
                                                                        onClick={() => downloadFile(doc.file_url, doc.filename)}
                                                                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                                                                    >
                                                                        Download
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">No documents found for this case</p>
                                            )}
                                        </div>

                                        {/* Time Entries Section */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                ⏱️ Time Entries ({selectedProjectForTimeline.Time?.length || 0})
                                            </h4>
                                            {selectedProjectForTimeline.Time && selectedProjectForTimeline.Time.length > 0 ? (
                                                <div className="space-y-3">
                                                    {selectedProjectForTimeline.Time.map((timeEntry, index) => (
                                                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h5 className="font-medium text-gray-800 text-sm">{timeEntry.task?.name || 'General Time Entry'}</h5>
                                                                <span className={`px-2 py-1 rounded-full text-xs ${timeEntry.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                                                                    timeEntry.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                        'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {timeEntry.status || 'unknown'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 mb-2">By: {timeEntry.user?.name || 'Unknown user'}</p>
                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                <span>Start: {timeEntry.start ? new Date(timeEntry.start).toLocaleString() : 'No start time'}</span>
                                                                <span>End: {timeEntry.end ? new Date(timeEntry.end).toLocaleString() : 'Ongoing'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">No time entries found for this case</p>
                                            )}
                                        </div>

                                        {/* Comments & Notes Section */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                💬 Comments & Notes ({selectedProjectForTimeline.Comments?.length || 0})
                                            </h4>
                                            {selectedProjectForTimeline.Comments && selectedProjectForTimeline.Comments.length > 0 ? (
                                                <div className="space-y-3">
                                                    {selectedProjectForTimeline.Comments.map((comment, index) => (
                                                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h5 className="font-medium text-gray-800 text-sm">Comment by {comment.user?.name || 'Unknown user'}</h5>
                                                                <span className="text-xs text-gray-500">
                                                                    {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600">{comment.content || 'No content'}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">No comments found for this case</p>
                                            )}
                                        </div>

                                        {/* Case Statistics Summary */}
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                📊 Case Statistics Summary
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-blue-600">{selectedProjectForTimeline.Tasks?.length || 0}</div>
                                                    <div className="text-sm text-gray-600">Total Tasks</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {selectedProjectForTimeline.Tasks?.filter(t => t.status === 'completed').length || 0}
                                                    </div>
                                                    <div className="text-sm text-gray-600">Completed Tasks</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-purple-600">{selectedProjectForTimeline.Media?.length || 0}</div>
                                                    <div className="text-sm text-gray-600">Documents</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-orange-600">{selectedProjectForTimeline.Time?.length || 0}</div>
                                                    <div className="text-sm text-gray-600">Time Entries</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showComprehensiveView && selectedProjectForTimeline && (
                <CaseComprehensiveView
                    project={selectedProjectForTimeline}
                    onClose={() => setShowComprehensiveView(false)}
                />
            )}
        </div>
    );
};

export default FlowchartModal;
