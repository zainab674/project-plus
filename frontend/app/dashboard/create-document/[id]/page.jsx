'use client'
/**
 * Document Manager - User-Based Document Management
 * 
 * This component has been modified to work with user-based document management
 * instead of project-based management. Users can now:
 * - Create and manage personal folders and files
 * - Organize documents in their own template document space
 * - Access documents regardless of project membership
 * 
 * The backend now creates folders in user-specific TemplateDocument records
 * rather than project-specific locations.
 */
import React, { useState, useRef, useEffect } from 'react'
import { createFolderRequest, createFileRequest, getFilesRequest, sendToLawyerRequest, deleteFolderRequest, deleteFileRequest } from '@/lib/http/project'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation';
import { Folder, File, Plus, Upload, Edit, Send, Trash2, ChevronRight, ChevronDown, FolderOpen, FileText, MoreVertical } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';

const DocumentManager = () => {
  const [items, setItems] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
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
    const name = prompt('Enter folder name:');
    if (name && name.trim()) {
      try {
        setIsLoading(true);
        const response = await createFolderRequest({
          name: name.trim(),
          parent_id: parentId
        });
        if (response.data.success) {
          toast.success('Folder created successfully');
          fetchFiles(); // Refresh the file tree
        }
      } catch (error) {
        console.error('Folder creation error:', error);
        toast.error(error?.response?.data?.message || 'Failed to create folder. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else if (name !== null) {
      toast.error('Please enter a valid folder name');
    }
    setContextMenu(null);
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
            toast.success('File uploaded successfully');
            fetchFiles(); // Refresh the file tree
          }
        } catch (error) {
          console.error('File upload error:', error);
          toast.error(error?.response?.data?.message || 'Failed to upload file. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    input.click();
    setContextMenu(null);
  };

  const deleteItem = async (id, type) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        setIsLoading(true);
        
        if (type === 'folder') {
          await deleteFolderRequest(id);
          toast.success('Folder deleted successfully');
        } else if (type === 'file') {
          await deleteFileRequest(id);
          toast.success('File deleted successfully');
        }
        
        fetchFiles(); // Refresh the file tree
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to delete item');
      } finally {
        setIsLoading(false);
      }
    }
    setContextMenu(null);
  };


  // Replace your handleRightClick function with this improved version:

  const handleRightClick = (e, item = null) => {
    e.stopPropagation();
    e.preventDefault();

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Context menu dimensions (approximate)
    const menuWidth = 200;
    const menuHeight = item?.file_type === "FOLDER" ? 140 : item?.file_type === "FILE" ? 120 : 80;

    // Calculate position
    let x = e.pageX;
    let y = e.pageY;

    // Adjust horizontal position if menu would go off-screen
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10; // 10px padding from edge
    }

    // Adjust vertical position if menu would go off-screen
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10; // 10px padding from edge
    }

    // Ensure minimum distance from edges
    x = Math.max(10, x);
    y = Math.max(10, y);

    setContextMenu({
      x,
      y,
      item
    });
  };

  const handleFileAction = async (file) => {
    try {
      setIsLoading(true);

      const description = window.prompt("Description");
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
        toast.success(response.data.message);
        fetchFiles(); // Refresh the file tree
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
      setContextMenu(null);
    }
  };

  const handleEditSend = async (file) => {
    router.push(`/dashboard/edit-file/${file.file_id}?file=${file.path}`)
  };

  // Fixed renderTree function to handle nested structure
  const renderTree = (folders = items, level = 0) => {
    return folders.map(folder => (
      <div key={folder.folder_id} className={`${level > 0 ? 'ml-6' : ''} mb-1`}>
        {/* Render folder */}
        <div
          className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
          onContextMenu={(e) => handleRightClick(e, folder)}
        >
          <div className="flex items-center space-x-3">
            {expandedFolders[folder.folder_id] ? (
              <ChevronDown
                className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => {
                  setExpandedFolders(prev => ({
                    ...prev,
                    [folder.folder_id]: !prev[folder.folder_id]
                  }));
                }}
              />
            ) : (
              <ChevronRight
                className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => {
                  setExpandedFolders(prev => ({
                    ...prev,
                    [folder.folder_id]: !prev[folder.folder_id]
                  }));
                }}
              />
            )}
            <FolderOpen className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-700">{folder.name}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {folder.files?.length || 0} files
            </span>
          </div>
          <div className="opacity-100 transition-opacity">


            <button
              onClick={(e) => {
                e.stopPropagation();

                // Get button position relative to viewport
                const rect = e.currentTarget.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const menuWidth = 200;
                const menuHeight = 140; // Approximate height for folder menu

                let x = rect.right + 5; // Position to the right of the button with 5px gap
                let y = rect.top;

                // If menu would go off-screen to the right, position to the left of the button
                if (x + menuWidth > viewportWidth) {
                  x = rect.left - menuWidth - 5;
                }

                // If menu would go off-screen downward, adjust upward
                if (y + menuHeight > viewportHeight) {
                  y = viewportHeight - menuHeight - 10;
                }

                // Ensure minimum distance from edges
                x = Math.max(10, x);
                y = Math.max(10, y);

                setContextMenu({
                  x,
                  y,
                  item: folder
                });
              }}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Render expanded content */}
        {expandedFolders[folder.folder_id] && (
          <div className="ml-6 mt-2 space-y-1">
            {/* Render files in this folder */}
            {folder.files && folder.files.map(file => (
              <div
                key={file.file_id}
                className="group"
                onContextMenu={(e) => handleRightClick(e, file)}
              >
                <div
                  className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenu({
                      x: e.pageX,
                      y: e.pageY,
                      item: file
                    });
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-400">
                      {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                    </span>
                  </div>
                  <div className="opacity-100 transition-opacity flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSend(file);
                      }}
                      className="p-1 hover:bg-blue-100 rounded text-blue-600"
                      title="Edit File"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileAction(file);
                      }}
                      className="p-1 hover:bg-green-100 rounded text-green-600"
                      title="Send to Lawyer"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(file.file_id, 'file');
                      }}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      title="Delete File"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Render subfolders recursively */}
            {folder.subfolders && folder.subfolders.length > 0 &&
              renderTree(folder.subfolders, level + 1)
            }
          </div>
        )}
      </div>
    ));
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  return (
    <main className="flex-1 overflow-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Manager</h1>
            <p className="text-gray-600 mt-1">Organize and manage your personal documents</p>
            {user && (
              <p className="text-sm text-gray-500 mt-1">Welcome, {user.name}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => createFolder(null)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Folder</span>
            </button>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-800">File Explorer</h2>
              <span className="text-sm text-gray-500">
                {items.length} root folders
              </span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                Personal Space
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-lg border">
                💡 Right-click anywhere to create folders or upload files
              </div>
              <button
                onClick={fetchFiles}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Refresh"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* File Tree */}
        <div
          ref={containerRef}
          className="p-6 relative min-h-[60vh]"
          onContextMenu={(e) => handleRightClick(e, null)}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading files...</span>
              </div>
            </div>
          )}

          {items.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No folders yet</h3>
              <p className="text-gray-500 mb-6">Create your first folder to organize your personal documents and files</p>
              <p className="text-sm text-gray-400 mb-6">This is your personal document space - organize files and folders as you need</p>
              <button
                onClick={() => createFolder(null)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Folder</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {renderTree()}
            </div>
          )}

          {/* Context Menu */}
          {contextMenu && (
            <div
              className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-lg py-2 text-sm min-w-[200px] max-w-[200px]"
              style={{
                top: `${contextMenu.y}px`,
                left: `${contextMenu.x}px`,
                transform: 'translateZ(0)' // Force GPU acceleration for better positioning
              }}
            >
              {!contextMenu.item && (
                <div className="space-y-1">
                  <button
                    onClick={() => createFolder(null)}
                    className="flex items-center space-x-3 w-full text-left hover:bg-gray-50 px-4 py-2 transition-colors text-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Folder</span>
                  </button>
                  <button
                    onClick={() => uploadFile(null)}
                    className="flex items-center space-x-3 w-full text-left hover:bg-gray-50 px-4 py-2 transition-colors text-gray-700"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload File</span>
                  </button>
                </div>
              )}

              {contextMenu.item?.file_type === "FOLDER" && (
                <div className="space-y-1">
                  <button
                    onClick={() => createFolder(contextMenu.item.folder_id)}
                    className="flex items-center space-x-3 w-full text-left hover:bg-gray-50 px-4 py-2 transition-colors text-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Subfolder</span>
                  </button>
                  <button
                    onClick={() => uploadFile(contextMenu.item.folder_id)}
                    className="flex items-center space-x-3 w-full text-left hover:bg-gray-50 px-4 py-2 transition-colors text-gray-700"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload File</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => deleteItem(contextMenu.item.folder_id, 'folder')}
                    className="flex items-center space-x-3 w-full text-left hover:bg-red-50 px-4 py-2 transition-colors text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Folder</span>
                  </button>
                </div>
              )}

              {contextMenu.item?.file_type === "FILE" && (
                <div className="space-y-1">
                  <button
                    onClick={() => handleEditSend(contextMenu.item)}
                    className="flex items-center space-x-3 w-full text-left hover:bg-gray-50 px-4 py-2 transition-colors text-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit File</span>
                  </button>
                  <button
                    onClick={() => handleFileAction(contextMenu.item)}
                    className="flex items-center space-x-3 w-full text-left hover:bg-gray-50 px-4 py-2 transition-colors text-gray-700"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send to Lawyer</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => deleteItem(contextMenu.item.file_id, 'file')}
                    className="flex items-center space-x-3 w-full text-left hover:bg-red-50 px-4 py-2 transition-colors text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete File</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default DocumentManager;