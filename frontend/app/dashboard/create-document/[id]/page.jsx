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
import { Folder, File, Plus, Upload, Edit, Send, Trash2, ChevronRight, ChevronDown, FolderOpen, FileText, MoreVertical, Home, ArrowLeft, HelpCircle, Info } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';

const DocumentManager = () => {
  const [items, setItems] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [currentPath, setCurrentPath] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter()
  const { user } = useUser();

  useEffect(() => {
    fetchFiles();
  }, []);

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
        
        if (type === 'folder') {
          await deleteFolderRequest(id);
          toast.success('✅ Folder deleted successfully');
        } else if (type === 'file') {
          await deleteFileRequest(id);
          toast.success('✅ File deleted successfully');
        }
        
        fetchFiles(); // Refresh the file tree
      } catch (error) {
        toast.error(error?.response?.data?.message || '❌ Failed to delete item');
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
      console.log(file.path, "file.path")
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
    router.push(`/dashboard/edit-file/${file.file_id}?file=${file.path}`)
  };

  // User-friendly folder/file rendering with large, clear action buttons
  const renderTree = (folders = items, level = 0) => {
    // Group folders by project_name
    const groupedByProject = folders.reduce((acc, folder) => {
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

    return Object.entries(groupedByProject).map(([groupKey, projectFolders]) => {
      // Determine if this should be shown as a group
      const shouldGroup = projectFolders.length > 1;
      
      // Determine the display name for the group
      const displayName = groupKey.startsWith('folder_') 
        ? projectFolders[0].name 
        : groupKey;

      if (!shouldGroup) {
        // Single folder - show directly
        const folder = projectFolders[0];
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