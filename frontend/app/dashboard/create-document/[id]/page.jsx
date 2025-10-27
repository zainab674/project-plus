'use client'
/**
 * Document Manager - User-Friendly Document Management
 * 
 * This component provides an intuitive, accessible interface for document management
 * designed for non-technical users. Features include:
 * - Large, clear buttons and icons
 * - Simple navigation with breadcrumbs
 * - Helpful tooltips and instructions
 * - Visual feedback for all actions
 * - No hidden right-click menus
 */
import React, { useState, useRef, useEffect } from 'react'
import { createFolderRequest, createFileRequest, getFilesRequest, sendToLawyerRequest, deleteFolderRequest, deleteFileRequest } from '@/lib/http/project'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation';
import { Folder, File, Plus, Upload, Edit, Send, Trash2, ChevronRight, ChevronDown, FolderOpen, FileText, MoreVertical, Home, ArrowLeft, HelpCircle, Info, Eye, Download } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';

const DocumentManager = () => {
  const [items, setItems] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [currentPath, setCurrentPath] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projectAttachments, setProjectAttachments] = useState([]);
  const [showProjectAttachments, setShowProjectAttachments] = useState(false);
  const router = useRouter()
  const { user } = useUser();
  const { selectedCase } = useDashboardFilter();

  useEffect(() => {
    fetchFiles();
    fetchProjectAttachments();
  }, [selectedCase]); // Re-fetch when selected case changes

  const fetchFiles = async () => {
    setIsLoading(true)
    try {
      // Get user's template document folders instead of project-specific
      const response = await getFilesRequest();
      if (response.data.success) {
        setItems(response.data.folders);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch files');
    } finally {
      setIsLoading(false)
    }
  };

  const fetchProjectAttachments = async () => {
    try {
      
      // Use comprehensive request which includes Media
      const { getAllProjectComprehensiveRequest } = await import('@/lib/http/project');
      const response = await getAllProjectComprehensiveRequest();
      
      if (response.data.success && Array.isArray(response.data.projects)) {
        
            // Collect all media from all projects
            let allAttachments = [];
            response.data.projects.forEach((project, index) => {
              
              // Filter by selected case if one is selected
              if (selectedCase && project.project_id !== selectedCase.project_id) {
                return; // Skip this project if it's not the selected one
              }
              
              if (project.Media && Array.isArray(project.Media)) {
                // Get project-level attachments (task_id is null)
                const projectMedia = project.Media
                  .filter(media => media.task_id === null || media.task_id === undefined)
                  .map(media => ({
                    ...media,
                    projectName: project.name,
                    projectId: project.project_id,
                    attachmentType: 'case' // project-level attachment
                  }));
                
                // Get task-level attachments
                const taskMedia = project.Media
                  .filter(media => media.task_id !== null && media.task_id !== undefined)
                  .map(media => ({
                    ...media,
                    projectName: project.name,
                    projectId: project.project_id,
                    attachmentType: 'task' // task-level attachment
                  }));
                
                allAttachments.push(...projectMedia, ...taskMedia);
              }
            });
        
        setProjectAttachments(allAttachments);
      } else {
      }
    } catch (error) {
      console.error('Failed to fetch project attachments:', error);
      console.error('Error details:', error.message, error.stack);
      // Don't show error toast as this is optional
    }
  };

  const createFolder = async (parentId = null) => {
    const name = prompt('What would you like to name your new folder?');
    if (name && name.trim()) {
      try {
        setIsLoading(true);
        const response = await createFolderRequest({
          name: name.trim(),
          parent_id: parentId
        });
        if (response.data.success) {
          toast.success('✅ Folder created successfully!');
          fetchFiles(); // Refresh the file tree
        }
      } catch (error) {
        console.error('Folder creation error:', error);
        toast.error(error?.response?.data?.message || '❌ Failed to create folder. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else if (name !== null) {
      toast.error('❌ Please enter a folder name');
    }
  };

  const uploadFile = async (parentId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*'; // Accept all file types
    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          setIsLoading(true);
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder_id', parentId);

          const response = await createFileRequest(formData);
          if (response.data.success) {
            toast.success('✅ File uploaded successfully!');
            fetchFiles(); // Refresh the file tree
          }
        } catch (error) {
          console.error('File upload error:', error);
          toast.error(error?.response?.data?.message || '❌ Failed to upload file. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    input.click();
  };

  const deleteItem = async (id, type, name) => {
    const itemType = type === 'folder' ? 'folder' : 'file';
    const confirmMessage = `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      try {
        setIsLoading(true);
        
        
        let response;
        if (type === 'folder') {
          response = await deleteFolderRequest(id);
        } else if (type === 'file') {
          response = await deleteFileRequest(id);
        }
        
        // Only show success if we get a successful response
        if (response?.data?.success) {
          toast.success(`✅ ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully`);
          fetchFiles(); // Refresh the file tree
        } else {
          toast.error(`❌ Failed to delete ${itemType}: ${response?.data?.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error(`Error deleting ${itemType}:`, error);
        console.error('Error response:', error?.response);
        toast.error(`❌ Failed to delete ${itemType}: ${error?.response?.data?.message || error?.message || 'Network error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };


  // Helper function to format file sizes
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const handleFileAction = async (file) => {
    try {
      setIsLoading(true);

      const description = window.prompt("Please enter a description for this file:");
      if (!description) {
        toast.error('❌ Description is required');
        return;
      }
      
      const formData = new FormData();
      formData.append("description", description);

      // Fetch file data from the file.path (which is a URL)
      const fileResponse = await fetch(file.path);
      const fileData = await fileResponse.arrayBuffer(); // or .blob()
      const blob = new Blob([fileData], { type: 'application/pdf' });

      formData.append("file", blob, file.name);

      const response = await sendToLawyerRequest(formData);

      if (response.data.success) {
        toast.success('✅ File sent to lawyer successfully!');
        fetchFiles(); // Refresh the file tree
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSend = async (file) => {
    // This is for template documents (File table)
    router.push(`/dashboard/edit-file/${file.file_id}?file=${file.path}`)
  };

  const handleEditMediaFile = async (attachment) => {
    // This is for Media table attachments (task/project files)
    router.push(`/dashboard/edit-file/${attachment.media_id}?file=${encodeURIComponent(attachment.file_url)}&media_id=${attachment.media_id}&filename=${encodeURIComponent(attachment.filename)}`)
  };

  // User-friendly folder/file rendering with large, clear action buttons
  const renderTree = (folders = items, level = 0) => {
    // First, group project attachments by project name and type
    const projectAttachmentsGrouped = projectAttachments.reduce((acc, attachment) => {
      const projectKey = attachment.projectName || 'Uncategorized';
      if (!acc[projectKey]) {
        acc[projectKey] = {
          case: [], // project-level attachments
          task: []  // task-level attachments
        };
      }
      if (attachment.attachmentType === 'case') {
        acc[projectKey].case.push(attachment);
      } else if (attachment.attachmentType === 'task') {
        acc[projectKey].task.push(attachment);
      }
      return acc;
    }, {});

    // Group folders by project_name, filtering by selected case
    const groupedByProject = folders.reduce((acc, folder) => {
      // If a case is selected, only show folders for that case
      if (selectedCase && folder.project_name && folder.project_name !== selectedCase.name) {
        return acc; // Skip this folder if it doesn't belong to the selected case
      }
      
      let groupKey;
      
      if (folder.project_name) {
        // Use project name as group key
        groupKey = folder.project_name;
      } else {
        // For folders without project name, group by folder name
        groupKey = `folder_${folder.name}`;
      }
      
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(folder);
      return acc;
    }, {});

    // Get all unique group keys from both folders and project attachments
    const allGroupKeys = new Set([
      ...Object.keys(groupedByProject),
      ...Object.keys(projectAttachmentsGrouped)
    ]);

    return Array.from(allGroupKeys).map((groupKey) => {
      const projectFolders = groupedByProject[groupKey] || [];
      const attachmentGroup = projectAttachmentsGrouped[groupKey] || { case: [], task: [] };
      const caseAttachments = attachmentGroup.case || [];
      const taskAttachments = attachmentGroup.task || [];
      const totalAttachments = caseAttachments.length + taskAttachments.length;
      
      // Determine the display name for the group
      const displayName = groupKey.startsWith('folder_') 
        ? (projectFolders[0]?.name || groupKey)
        : groupKey;

      // If this is a project with attachments but no folders
      if (totalAttachments > 0 && projectFolders.length === 0) {
        return (
          <div key={groupKey} className={`${level > 0 ? 'ml-8' : ''} mb-4`}>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setExpandedFolders(prev => ({
                        ...prev,
                        [groupKey]: !prev[groupKey]
                      }));
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={expandedFolders[groupKey] ? "Hide contents" : "Show contents"}
                  >
                    {expandedFolders[groupKey] ? (
                      <ChevronDown className="w-6 h-6 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-6 h-6 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setExpandedFolders(prev => ({
                        ...prev,
                        [groupKey]: !prev[groupKey]
                      }));
                    }}
                    className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                    title={expandedFolders[groupKey] ? "Hide contents" : "Show contents"}
                  >
                    <FolderOpen className="w-8 h-8 text-purple-500" />
                  </button>
                  <button
                    onClick={() => {
                      setExpandedFolders(prev => ({
                        ...prev,
                        [groupKey]: !prev[groupKey]
                      }));
                    }}
                    className="text-left hover:bg-gray-50 rounded-lg p-2 transition-colors flex-1"
                    title={expandedFolders[groupKey] ? "Hide contents" : "Show contents"}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 hover:text-purple-600 transition-colors">
                      {displayName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {caseAttachments.length > 0 && `${caseAttachments.length} case file${caseAttachments.length !== 1 ? 's' : ''}`}
                      {caseAttachments.length > 0 && taskAttachments.length > 0 && ' • '}
                      {taskAttachments.length > 0 && `${taskAttachments.length} task file${taskAttachments.length !== 1 ? 's' : ''}`}
                    </p>
                  </button>
                </div>
              </div>

              {/* Expanded Content - Show attachments */}
              {expandedFolders[groupKey] && (
                <div className="mt-4 space-y-3">
                  {/* Case-level attachments */}
                  {caseAttachments.length > 0 && (
                    <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm font-medium text-purple-800 mb-2">📎 Case Files ({caseAttachments.length})</p>
                      {caseAttachments.map((attachment, index) => (
                        <div key={`case-${attachment.media_id}-${index}`} className="bg-white border border-purple-200 rounded-lg p-3 mb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-medium text-gray-800 truncate">{attachment.filename || 'Unnamed Document'}</h4>
                                <p className="text-xs text-gray-500">
                                  {attachment.mimeType || 'Unknown type'} • {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {attachment.file_url && (
                                <>
                                  <button
                                    onClick={() => window.open(attachment.file_url, '_blank')}
                                    className="flex items-center space-x-1 bg-blue-200 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-300 transition-colors text-xs font-medium"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    onClick={() => handleEditMediaFile(attachment)}
                                    className="flex items-center space-x-1 bg-amber-200 text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-300 transition-colors text-xs font-medium"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = attachment.file_url;
                                      link.download = attachment.filename || 'document';
                                      link.click();
                                    }}
                                    className="flex items-center space-x-1 bg-green-200 text-green-700 px-2 py-1 rounded-lg hover:bg-green-300 transition-colors text-xs font-medium"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Get</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Task-level attachments */}
                  {taskAttachments.length > 0 && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">📋 Task Files ({taskAttachments.length})</p>
                      {taskAttachments.map((attachment, index) => (
                        <div key={`task-${attachment.media_id}-${index}`} className="bg-white border border-blue-200 rounded-lg p-3 mb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-medium text-gray-800 truncate">{attachment.filename || 'Unnamed Document'}</h4>
                                <p className="text-xs text-gray-500">
                                  {attachment.mimeType || 'Unknown type'} • {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                  {attachment.task_id && ` • Task #${attachment.task_id}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {attachment.file_url && (
                                <>
                                  <button
                                    onClick={() => window.open(attachment.file_url, '_blank')}
                                    className="flex items-center space-x-1 bg-blue-200 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-300 transition-colors text-xs font-medium"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    onClick={() => handleEditMediaFile(attachment)}
                                    className="flex items-center space-x-1 bg-amber-200 text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-300 transition-colors text-xs font-medium"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = attachment.file_url;
                                      link.download = attachment.filename || 'document';
                                      link.click();
                                    }}
                                    className="flex items-center space-x-1 bg-green-200 text-green-700 px-2 py-1 rounded-lg hover:bg-green-300 transition-colors text-xs font-medium"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Get</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      // Handle regular folders (existing logic)
      const shouldGroup = projectFolders.length > 1;

      if (!shouldGroup && projectFolders.length > 0) {
        // Single folder - show directly
        const folder = projectFolders[0];
        
        // Check if this folder also has project attachments
        const hasAttachments = totalAttachments > 0;
        return (
          <div key={folder.folder_id} className={`${level > 0 ? 'ml-8' : ''} mb-4`}>
            {/* Folder Card */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setExpandedFolders(prev => ({
                        ...prev,
                        [folder.folder_id]: !prev[folder.folder_id]
                      }));
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={expandedFolders[folder.folder_id] ? "Hide contents" : "Show contents"}
                  >
                    {expandedFolders[folder.folder_id] ? (
                      <ChevronDown className="w-6 h-6 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-6 h-6 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setExpandedFolders(prev => ({
                        ...prev,
                        [folder.folder_id]: !prev[folder.folder_id]
                      }));
                    }}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title={expandedFolders[folder.folder_id] ? "Hide contents" : "Show contents"}
                  >
                    <FolderOpen className="w-8 h-8 text-blue-500" />
                  </button>
                  <button
                    onClick={() => {
                      setExpandedFolders(prev => ({
                        ...prev,
                        [folder.folder_id]: !prev[folder.folder_id]
                      }));
                    }}
                    className="text-left hover:bg-gray-50 rounded-lg p-2 transition-colors flex-1"
                    title={expandedFolders[folder.folder_id] ? "Hide contents" : "Show contents"}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                      {folder.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {folder.files?.length || 0} files
                      {folder.subfolders?.length > 0 && ` • ${folder.subfolders.length} subfolders`}
                      {caseAttachments.length > 0 && ` • ${caseAttachments.length} case file${caseAttachments.length !== 1 ? 's' : ''}`}
                      {taskAttachments.length > 0 && ` • ${taskAttachments.length} task file${taskAttachments.length !== 1 ? 's' : ''}`}
                    </p>
                  </button>
                </div>
                
                {/* Folder Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => createFolder(folder.folder_id)}
                    className="flex items-center space-x-2 bg-emerald-300 text-emerald-800 px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors text-sm font-medium"
                    title="Create a new folder inside this folder"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Folder</span>
                  </button>
                  <button
                    onClick={() => uploadFile(folder.folder_id)}
                    className="flex items-center space-x-2 bg-cyan-300 text-cyan-800 px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors text-sm font-medium"
                    title="Upload a file to this folder"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload File</span>
                  </button>
                  <button
                    onClick={() => deleteItem(folder.folder_id, 'folder', folder.name)}
                    className="flex items-center space-x-2 bg-rose-300 text-rose-800 px-4 py-2 rounded-lg hover:bg-rose-400 transition-colors text-sm font-medium"
                    title="Delete this folder"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedFolders[folder.folder_id] && (
                <div className="mt-4 space-y-3">
                  {/* Case-level attachments */}
                  {caseAttachments.length > 0 && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm font-medium text-purple-800 mb-2">📎 Case Files ({caseAttachments.length})</p>
                      {caseAttachments.map((attachment, index) => (
                        <div key={`case-${attachment.media_id}-${index}`} className="bg-white border border-purple-200 rounded-lg p-3 mb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-medium text-gray-800 truncate">{attachment.filename || 'Unnamed Document'}</h4>
                                <p className="text-xs text-gray-500">
                                  {attachment.mimeType || 'Unknown type'} • {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {attachment.file_url && (
                                <>
                                  <button
                                    onClick={() => window.open(attachment.file_url, '_blank')}
                                    className="flex items-center space-x-1 bg-blue-200 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-300 transition-colors text-xs font-medium"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    onClick={() => handleEditMediaFile(attachment)}
                                    className="flex items-center space-x-1 bg-amber-200 text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-300 transition-colors text-xs font-medium"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = attachment.file_url;
                                      link.download = attachment.filename || 'document';
                                      link.click();
                                    }}
                                    className="flex items-center space-x-1 bg-green-200 text-green-700 px-2 py-1 rounded-lg hover:bg-green-300 transition-colors text-xs font-medium"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Get</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Task-level attachments */}
                  {taskAttachments.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">📋 Task Files ({taskAttachments.length})</p>
                      {taskAttachments.map((attachment, index) => (
                        <div key={`task-${attachment.media_id}-${index}`} className="bg-white border border-blue-200 rounded-lg p-3 mb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-medium text-gray-800 truncate">{attachment.filename || 'Unnamed Document'}</h4>
                                <p className="text-xs text-gray-500">
                                  {attachment.mimeType || 'Unknown type'} • {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                  {attachment.task_id && ` • Task #${attachment.task_id}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {attachment.file_url && (
                                <>
                                  <button
                                    onClick={() => window.open(attachment.file_url, '_blank')}
                                    className="flex items-center space-x-1 bg-blue-200 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-300 transition-colors text-xs font-medium"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    onClick={() => handleEditMediaFile(attachment)}
                                    className="flex items-center space-x-1 bg-amber-200 text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-300 transition-colors text-xs font-medium"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = attachment.file_url;
                                      link.download = attachment.filename || 'document';
                                      link.click();
                                    }}
                                    className="flex items-center space-x-1 bg-green-200 text-green-700 px-2 py-1 rounded-lg hover:bg-green-300 transition-colors text-xs font-medium"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Get</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Files in this folder */}
                  {folder.files && folder.files.map(file => (
                    <div
                      key={file.file_id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => {
                              // You can add file preview functionality here later
                              toast.info(`📄 ${file.name} - Click an action button to work with this file`);
                            }}
                            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Click to see file info"
                          >
                            <FileText className="w-6 h-6 text-gray-600 hover:text-blue-600 transition-colors" />
                          </button>
                          <button
                            onClick={() => {
                              // You can add file preview functionality here later
                              toast.info(`📄 ${file.name} - Click an action button to work with this file`);
                            }}
                            className="text-left hover:bg-gray-50 rounded-lg p-2 transition-colors flex-1"
                            title="Click to see file info"
                          >
                            <h4 className="text-base font-medium text-gray-800 hover:text-blue-600 transition-colors">
                              {file.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </button>
                        </div>
                        
                        {/* File Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditSend(file)}
                            className="flex items-center space-x-2 bg-amber-300 text-amber-800 px-3 py-2 rounded-lg hover:bg-amber-400 transition-colors text-sm font-medium"
                            title="Edit this file"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleFileAction(file)}
                            className="flex items-center space-x-2 bg-violet-300 text-violet-800 px-3 py-2 rounded-lg hover:bg-violet-400 transition-colors text-sm font-medium"
                            title="Send this file to your lawyer"
                          >
                            <Send className="w-4 h-4" />
                            <span>Send to Lawyer</span>
                          </button>
                          <button
                            onClick={() => deleteItem(file.file_id, 'file', file.name)}
                            className="flex items-center space-x-2 bg-pink-300 text-pink-800 px-3 py-2 rounded-lg hover:bg-pink-400 transition-colors text-sm font-medium"
                            title="Delete this file"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Subfolders recursively */}
                  {folder.subfolders && folder.subfolders.length > 0 &&
                    renderTree(folder.subfolders, level + 1)
                  }
                </div>
              )}
            </div>
          </div>
        );
      }

      // Multiple folders - show grouped with dropdown
      return (
        <div key={groupKey} className={`${level > 0 ? 'ml-8' : ''} mb-4`}>
          {/* Project Group Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
            <button
              onClick={() => {
                setExpandedFolders(prev => ({
                  ...prev,
                  [groupKey]: !prev[groupKey]
                }))
              }}
              className="flex items-center justify-between w-full hover:bg-blue-100 rounded-lg p-2 -m-2 transition-colors"
            >
              <div className="flex items-center space-x-4">
                {expandedFolders[groupKey] ? (
                  <ChevronDown className="w-6 h-6 text-blue-600" />
                ) : (
                  <ChevronRight className="w-6 h-6 text-blue-600" />
                )}
                <Folder className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {displayName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {projectFolders.length} folder{projectFolders.length !== 1 ? 's' : ''} • {projectFolders.reduce((total, folder) => total + (folder.files?.length || 0), 0)} files
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Expanded Project Folders */}
          {expandedFolders[groupKey] && (
            <div className="ml-8 mt-4 space-y-4">
              {projectFolders.map((folder, index) => (
                <div key={folder.folder_id} className="relative">
                  {/* Folder Card */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => {
                            setExpandedFolders(prev => ({
                              ...prev,
                              [folder.folder_id]: !prev[folder.folder_id]
                            }));
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title={expandedFolders[folder.folder_id] ? "Hide contents" : "Show contents"}
                        >
                          {expandedFolders[folder.folder_id] ? (
                            <ChevronDown className="w-6 h-6 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-6 h-6 text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setExpandedFolders(prev => ({
                              ...prev,
                              [folder.folder_id]: !prev[folder.folder_id]
                            }));
                          }}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title={expandedFolders[folder.folder_id] ? "Hide contents" : "Show contents"}
                        >
                          <FolderOpen className="w-8 h-8 text-blue-500" />
                        </button>
                        <button
                          onClick={() => {
                            setExpandedFolders(prev => ({
                              ...prev,
                              [folder.folder_id]: !prev[folder.folder_id]
                            }));
                          }}
                          className="text-left hover:bg-gray-50 rounded-lg p-2 transition-colors flex-1"
                          title={expandedFolders[folder.folder_id] ? "Hide contents" : "Show contents"}
                        >
                          <h4 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                            {folder.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {folder.phase_name && `Phase: ${folder.phase_name} • `}
                            {folder.files?.length || 0} files
                            {folder.subfolders?.length > 0 && ` • ${folder.subfolders.length} subfolders`}
                          </p>
                        </button>
                      </div>
                      
                      {/* Folder Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => createFolder(folder.folder_id)}
                          className="flex items-center space-x-2 bg-emerald-300 text-emerald-800 px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors text-sm font-medium"
                          title="Create a new folder inside this folder"
                        >
                          <Plus className="w-4 h-4" />
                          <span>New Folder</span>
                        </button>
                        <button
                          onClick={() => uploadFile(folder.folder_id)}
                          className="flex items-center space-x-2 bg-cyan-300 text-cyan-800 px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors text-sm font-medium"
                          title="Upload a file to this folder"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload File</span>
                        </button>
                        <button
                          onClick={() => deleteItem(folder.folder_id, 'folder', folder.name)}
                          className="flex items-center space-x-2 bg-rose-300 text-rose-800 px-4 py-2 rounded-lg hover:bg-rose-400 transition-colors text-sm font-medium"
                          title="Delete this folder"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedFolders[folder.folder_id] && (
                      <div className="mt-4 space-y-3">
                        {/* Files in this folder */}
                        {folder.files && folder.files.map(file => (
                          <div
                            key={file.file_id}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={() => {
                                    // You can add file preview functionality here later
                                    toast.info(`📄 ${file.name} - Click an action button to work with this file`);
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                  title="Click to see file info"
                                >
                                  <FileText className="w-6 h-6 text-gray-600 hover:text-blue-600 transition-colors" />
                                </button>
                                <button
                                  onClick={() => {
                                    // You can add file preview functionality here later
                                    toast.info(`📄 ${file.name} - Click an action button to work with this file`);
                                  }}
                                  className="text-left hover:bg-gray-50 rounded-lg p-2 transition-colors flex-1"
                                  title="Click to see file info"
                                >
                                  <h5 className="text-base font-medium text-gray-800 hover:text-blue-600 transition-colors">
                                    {file.name}
                                  </h5>
                                  <p className="text-sm text-gray-500">
                                    {formatFileSize(file.size)}
                                  </p>
                                </button>
                              </div>
                              
                              {/* File Action Buttons */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditSend(file)}
                                  className="flex items-center space-x-2 bg-amber-300 text-amber-800 px-3 py-2 rounded-lg hover:bg-amber-400 transition-colors text-sm font-medium"
                                  title="Edit this file"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleFileAction(file)}
                                  className="flex items-center space-x-2 bg-violet-300 text-violet-800 px-3 py-2 rounded-lg hover:bg-violet-400 transition-colors text-sm font-medium"
                                  title="Send this file to your lawyer"
                                >
                                  <Send className="w-4 h-4" />
                                  <span>Send to Lawyer</span>
                                </button>
                                <button
                                  onClick={() => deleteItem(file.file_id, 'file', file.name)}
                                  className="flex items-center space-x-2 bg-pink-300 text-pink-800 px-3 py-2 rounded-lg hover:bg-pink-400 transition-colors text-sm font-medium"
                                  title="Delete this file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Subfolders recursively */}
                        {folder.subfolders && folder.subfolders.length > 0 &&
                          renderTree(folder.subfolders, level + 1)
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  // No more context menu listeners needed

  return (
    <main className="flex-1 overflow-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📁 Document Manager</h1>
            <p className="text-lg text-gray-600 mb-2">Organize and manage your personal documents</p>
            {user && (
              <p className="text-base text-gray-500">Welcome, {user.name} 👋</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center space-x-2 bg-slate-300 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-400 transition-colors text-base font-medium"
              title="Show help and instructions"
            >
              <HelpCircle className="w-5 h-5" />
              <span>{showHelp ? 'Hide Help' : 'Show Help'}</span>
            </button>
            <button
              onClick={() => createFolder(null)}
              className="flex items-center space-x-2 bg-sky-300 text-sky-800 px-6 py-3 rounded-lg hover:bg-sky-400 transition-colors text-base font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Folder</span>
            </button>
          </div>
        </div>
        
        {/* Help Section */}
        {showHelp && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              How to Use This Document Manager
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-semibold mb-2">📁 Managing Folders:</h4>
                <ul className="space-y-1">
                  <li>• Click the arrow, folder icon, or folder name to show/hide contents</li>
                  <li>• Use "New Folder" to create folders inside other folders</li>
                  <li>• Use "Upload File" to add documents to folders</li>
                  <li>• Use "Delete" to remove folders (this will delete everything inside)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📄 Managing Files:</h4>
                <ul className="space-y-1">
                  <li>• Click the file icon or file name to see file information</li>
                  <li>• Use "Edit" to modify your files</li>
                  <li>• Use "Send to Lawyer" to share files with your attorney</li>
                  <li>• Use "Delete" to remove files</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-800">📂 Your Documents</h2>
             
             
            </div>
            <div className="flex items-center space-x-4">
              
              <button
                onClick={fetchFiles}
                className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
                title="Refresh your documents"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* File Tree */}
        <div
          ref={containerRef}
          className="p-6 relative min-h-[60vh]"
        >
          {isLoading && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-50 rounded-xl">
              <div className="flex items-center space-x-4 bg-white p-6 rounded-xl shadow-lg border">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-lg text-gray-600 font-medium">Loading your documents...</span>
              </div>
            </div>
          )}

          {items.length === 0 && !isLoading ? (
            <div className="text-center py-16">
              <div className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Folder className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No folders yet</h3>
              <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                Create your first folder to organize your personal documents and files
              </p>
              <p className="text-base text-gray-500 mb-8 max-w-lg mx-auto">
                This is your personal document space - you can organize files and folders however you like. 
                Everything is clearly labeled and easy to use!
              </p>
              <button
                onClick={() => createFolder(null)}
                className="flex items-center space-x-3 bg-sky-300 text-sky-800 px-8 py-4 rounded-xl hover:bg-sky-400 transition-colors mx-auto text-lg font-medium shadow-lg"
              >
                <Plus className="w-6 h-6" />
                <span>Create Your First Folder</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {renderTree()}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default DocumentManager;