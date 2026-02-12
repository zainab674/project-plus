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
import React, { useState, useRef, useEffect, Suspense } from 'react'
import { createFolderRequest, createFileRequest, getFilesRequest, sendToLawyerRequest, deleteFolderRequest, deleteFileRequest } from '@/lib/http/project'
import { getMySubmissionsRequest } from '@/lib/http/review'
import { toast } from 'react-toastify'
import { useRouter, useSearchParams } from 'next/navigation';
import { Folder, File, Plus, Upload, Edit, Send, Trash2, ChevronRight, ChevronDown, FolderOpen, FileText, MoreVertical, Home, ArrowLeft, HelpCircle, Info, Eye, Download, AlertCircle, Clock, ArrowRight, X } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';
import DocumentEditorModal from '@/components/modals/DocumentEditorModal';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import { saveDocument } from '@/lib/utils/documentUtils';
import { downloadFile } from '@/utils/fileUtils';

const DocumentManager = () => {
  const [items, setItems] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [currentPath, setCurrentPath] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projectAttachments, setProjectAttachments] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]); // Store tasks grouped by project
  const [projectPhases, setProjectPhases] = useState({}); // Store phases by project name
  const [showProjectAttachments, setShowProjectAttachments] = useState(false);
  const router = useRouter()
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { selectedCase } = useDashboardFilter();
  const [editingDocument, setEditingDocument] = useState(null);
  const [reviewedDocuments, setReviewedDocuments] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [highlightedMediaId, setHighlightedMediaId] = useState(null);
  const highlightedRef = useRef(null);
  const [seenDocumentUpdates, setSeenDocumentUpdates] = useState(new Set());

  useEffect(() => {
    fetchFiles();
    fetchProjectAttachments();
    fetchReviewedDocuments();
    
    // Load seen document updates from localStorage
    const storedSeen = localStorage.getItem('seenDocumentUpdates');
    if (storedSeen) {
      try {
        const seenArray = JSON.parse(storedSeen);
        setSeenDocumentUpdates(new Set(seenArray));
      } catch (error) {
        console.error('Error loading seen document updates:', error);
      }
    }
    
    // Check if we need to highlight a specific attachment
    const highlightMediaId = searchParams.get('highlightMediaId');
    if (highlightMediaId) {
      setHighlightedMediaId(highlightMediaId);
    }
    
    // Set up polling to check for new status updates every 30 seconds
    const pollInterval = setInterval(() => {
      fetchReviewedDocuments();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [selectedCase, searchParams]); // Re-fetch when selected case changes

  const fetchReviewedDocuments = async () => {
    setLoadingReviews(true);
    try {
      const response = await getMySubmissionsRequest();
      if (response.data.success) {
        setReviewedDocuments(response.data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching reviewed documents:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

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

      // Use comprehensive request which includes Media and Tasks
      const { getAllProjectComprehensiveRequest } = await import('@/lib/http/project');
      const response = await getAllProjectComprehensiveRequest();

      if (response.data.success) {
        // Merge owned projects and collaborated projects to include all projects user has access to
        const allProjects = [
          ...(Array.isArray(response.data.projects) ? response.data.projects : []),
          ...(Array.isArray(response.data.collaboratedProjects) ? response.data.collaboratedProjects : [])
        ];

        // Collect all media from all projects
        let allAttachments = [];
        let allTasks = [];
        let phasesByProject = {};
        
        allProjects.forEach((project, index) => {

          // Filter by selected case if one is selected
          if (selectedCase && project.project_id !== selectedCase.project_id) {
            return; // Skip this project if it's not the selected one
          }

          // Store phases for this project
          if (project.phases && Array.isArray(project.phases) && project.phases.length > 0) {
            phasesByProject[project.name] = project.phases;
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

          // Collect tasks for this project
          if (project.Tasks && Array.isArray(project.Tasks)) {
            const projectTasks = project.Tasks.map(task => ({
              ...task,
              projectName: project.name,
              projectId: project.project_id,
              phases: project.phases || []
            }));
            allTasks.push(...projectTasks);
          }
        });

        setProjectAttachments(allAttachments);
        setProjectTasks(allTasks);
        setProjectPhases(phasesByProject);
        
        // After attachments are loaded, check if we need to highlight and expand
        const highlightMediaId = searchParams.get('highlightMediaId');
        if (highlightMediaId && allAttachments.length > 0) {
          const targetAttachment = allAttachments.find(att => 
            (att.media_id && String(att.media_id) === String(highlightMediaId)) ||
            (att.id && String(att.id) === String(highlightMediaId))
          );
          
          if (targetAttachment) {
            // Expand the project folder
            const projectKey = targetAttachment.projectName || 'Uncategorized';
            setExpandedFolders(prev => ({
              ...prev,
              [projectKey]: true
            }));
            
            // Scroll to the attachment after a short delay to ensure DOM is ready
            setTimeout(() => {
              const element = document.getElementById(`attachment-${highlightMediaId}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Remove highlight after 5 seconds
                setTimeout(() => {
                  setHighlightedMediaId(null);
                  // Clean up URL param
                  const newUrl = window.location.pathname;
                  router.replace(newUrl);
                }, 5000);
              }
            }, 500);
          }
        }
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
    // Check if file is editable (text/html/docx)
    const isEditable = file.mimeType?.includes('text') ||
      file.mimeType?.includes('json') ||
      file.mimeType?.includes('wordprocessingml') ||
      file.name?.endsWith('.html') ||
      file.name?.endsWith('.txt') ||
      file.name?.endsWith('.json') ||
      file.name?.endsWith('.docx');

    if (isEditable) {
      // Navigate to standalone editor page
      router.push(`/dashboard/edit-document/${file.file_id}?file=${encodeURIComponent(file.path)}&filename=${encodeURIComponent(file.name)}&file_id=${file.file_id}`);
    } else {
      // Fallback to existing behavior (PDFTron)
      router.push(`/dashboard/edit-file/${file.file_id}?file=${file.path}`)
    }
  };

  const handleEditMediaFile = async (attachment) => {
    // Check if file is editable (text/html/docx)
    const isEditable = attachment.mimeType?.includes('text') ||
      attachment.mimeType?.includes('json') ||
      attachment.mimeType?.includes('wordprocessingml') ||
      attachment.filename?.endsWith('.html') ||
      attachment.filename?.endsWith('.txt') ||
      attachment.filename?.endsWith('.json') ||
      attachment.filename?.endsWith('.docx');

    if (isEditable) {
      // Navigate to standalone editor page
      router.push(`/dashboard/edit-document/${attachment.media_id}?file=${encodeURIComponent(attachment.file_url)}&filename=${encodeURIComponent(attachment.filename)}&media_id=${attachment.media_id}`);
    } else {
      // Fallback to existing behavior (PDFTron)
      router.push(`/dashboard/edit-file/${attachment.media_id}?file=${encodeURIComponent(attachment.file_url)}&media_id=${attachment.media_id}&filename=${encodeURIComponent(attachment.filename)}`)
    }
  };

  const handleSaveDocument = async (content) => {
    if (!editingDocument) return;

    setIsLoading(true);
    
    const success = await saveDocument({
      content,
      editingDocument,
      onSuccess: () => {
        setEditingDocument(null);
        // Refresh lists to show updated document everywhere
        fetchFiles();
        fetchProjectAttachments();
      },
      onError: () => {
        // Error handling is done in saveDocument
      }
    });

    setIsLoading(false);
  };

  // User-friendly folder/file rendering with large, clear action buttons
  const handleReviewClick = async (doc) => {
    // Fetch the latest document data from server to ensure we have the most recent file_url
    try {
      const response = await getMySubmissionsRequest();
      if (response.data.success && response.data.documents) {
        // Find the latest version of this document
        const latestDoc = response.data.documents.find(d => d.t_document_id === doc.t_document_id);
        if (latestDoc) {
          // Use the latest document data
          doc = latestDoc;
        }
      }
    } catch (error) {
      console.error('Error fetching latest document data:', error);
      // Continue with the doc we have if fetch fails
    }
    
    // Build query params with all necessary document info
    const params = new URLSearchParams({
      status: doc.status || '',
      rejection_reason: doc.rejection_reason || ''
    });
    
    // Always include t_document_id so the edit page can fetch fresh data
    if (doc.t_document_id) {
      params.append('t_document_id', doc.t_document_id);
    }
    
    // Note: We intentionally don't pass file_url in params
    // The edit-document page will fetch fresh data from the server
    // This ensures the user always sees the latest version
    
    // Navigate to edit-document page which handles status display
    router.push(`/dashboard/edit-document/${doc.t_document_id}?${params.toString()}`);
  };

  // Helper function to render a single attachment
  const renderAttachment = (attachment, attachmentType, index) => {
    const isHighlighted = highlightedMediaId && (
      (attachment.media_id && String(attachment.media_id) === String(highlightedMediaId)) ||
      (attachment.id && String(attachment.id) === String(highlightedMediaId))
    );
    const bgColor = attachmentType === 'case' ? 'purple' : 'blue';
    const textColor = attachmentType === 'case' ? 'purple' : 'blue';
    
    return (
      <div 
        key={`${attachmentType}-${attachment.media_id || attachment.id}-${index}`} 
        id={`attachment-${attachment.media_id || attachment.id}`}
        className={`bg-white border rounded-lg p-3 mb-2 transition-all duration-300 ${
          isHighlighted 
            ? `border-${bgColor}-500 border-4 shadow-lg ring-4 ring-${bgColor}-200 bg-${bgColor}-50` 
            : `border-${bgColor}-200`
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <FileText className={`w-5 h-5 text-${textColor}-600 flex-shrink-0`} />
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
                  onClick={() => downloadFile(attachment.file_url, attachment.filename)}
                  className="flex items-center space-x-1 bg-green-200 text-green-700 px-2 py-1 rounded-lg hover:bg-green-300 transition-colors text-xs font-medium"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTree = (folders = items, level = 0) => {
    // Group project attachments by project name and task_id
    const projectAttachmentsGrouped = projectAttachments.reduce((acc, attachment) => {
      const projectKey = attachment.projectName || 'Uncategorized';
      if (!acc[projectKey]) {
        acc[projectKey] = {
          case: [], // project-level attachments (task_id is null)
          byTask: {} // task-level attachments grouped by task_id
        };
      }
      if (attachment.attachmentType === 'case' || !attachment.task_id) {
        acc[projectKey].case.push(attachment);
      } else {
        const taskId = attachment.task_id;
        if (!acc[projectKey].byTask[taskId]) {
          acc[projectKey].byTask[taskId] = [];
        }
        acc[projectKey].byTask[taskId].push(attachment);
      }
      return acc;
    }, {});

    // Group tasks by project and phase
    const tasksByProjectAndPhase = projectTasks.reduce((acc, task) => {
      const projectKey = task.projectName || 'Uncategorized';
      if (!acc[projectKey]) {
        acc[projectKey] = {};
      }
      const phaseName = task.phase || 'Unassigned';
      if (!acc[projectKey][phaseName]) {
        acc[projectKey][phaseName] = [];
      }
      acc[projectKey][phaseName].push(task);
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
        acc[groupKey] = {
          mainFolders: [], // Folders without phase_name (main case folders)
          phaseFolders: {} // Folders with phase_name, grouped by phase
        };
      }
      
      if (folder.phase_name) {
        // This is a phase folder
        if (!acc[groupKey].phaseFolders[folder.phase_name]) {
          acc[groupKey].phaseFolders[folder.phase_name] = [];
        }
        acc[groupKey].phaseFolders[folder.phase_name].push(folder);
      } else {
        // This is a main folder
        acc[groupKey].mainFolders.push(folder);
      }
      return acc;
    }, {});

    // Only show groups that have folders - attachments will be shown inside folders
    const allGroupKeys = Object.keys(groupedByProject);

    return Array.from(allGroupKeys).map((groupKey) => {
      const projectFolderData = groupedByProject[groupKey] || { mainFolders: [], phaseFolders: {} };
      const mainFolders = projectFolderData.mainFolders || [];
      const phaseFoldersMap = projectFolderData.phaseFolders || {};
      const attachmentGroup = projectAttachmentsGrouped[groupKey] || { case: [], byTask: {} };
      const caseAttachments = attachmentGroup.case || [];
      const tasksByPhase = tasksByProjectAndPhase[groupKey] || {};
      
      // Determine the display name for the group
      const displayName = groupKey.startsWith('folder_')
        ? (mainFolders[0]?.name || groupKey)
        : groupKey;

      // Get all phase names from:
      // 1. Project phases (all phases defined for the project)
      // 2. Phase folders (phases that have folders)
      // 3. Tasks by phase (phases that have tasks)
      const projectPhasesList = projectPhases[groupKey] || [];
      const allPhaseNames = new Set([
        ...projectPhasesList, // Include all phases from the project
        ...Object.keys(phaseFoldersMap),
        ...Object.keys(tasksByPhase)
      ]);

      // Render main folder (case folder) - show case files and phase folders
      if (mainFolders.length > 0) {
        const mainFolder = mainFolders[0]; // Take first main folder as the case folder
        
        return (
          <div key={mainFolder.folder_id} className={level > 0 ? 'ml-8 mb-4' : 'mb-4'}>
            {/* Main Case Folder Card */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setExpandedFolders(prev => ({
                        ...prev,
                        [mainFolder.folder_id]: !prev[mainFolder.folder_id]
                      }));
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={expandedFolders[mainFolder.folder_id] ? "Hide contents" : "Show contents"}
                  >
                    {expandedFolders[mainFolder.folder_id] ? (
                      <ChevronDown className="w-6 h-6 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-6 h-6 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setExpandedFolders(prev => ({
                        ...prev,
                        [mainFolder.folder_id]: !prev[mainFolder.folder_id]
                      }));
                    }}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title={expandedFolders[mainFolder.folder_id] ? "Hide contents" : "Show contents"}
                  >
                    <FolderOpen className="w-8 h-8 text-blue-500" />
                  </button>
                  <button
                    onClick={() => {
                      setExpandedFolders(prev => ({
                        ...prev,
                        [mainFolder.folder_id]: !prev[mainFolder.folder_id]
                      }));
                    }}
                    className="text-left hover:bg-gray-50 rounded-lg p-2 transition-colors flex-1"
                    title={expandedFolders[mainFolder.folder_id] ? "Hide contents" : "Show contents"}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                      {mainFolder.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {mainFolder.files?.length || 0} files
                      {caseAttachments.length > 0 && ` • ${caseAttachments.length} case file${caseAttachments.length !== 1 ? 's' : ''}`}
                      {allPhaseNames.size > 0 && ` • ${allPhaseNames.size} phase${allPhaseNames.size !== 1 ? 's' : ''}`}
                    </p>
                  </button>
                </div>

                {/* Folder Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => createFolder(mainFolder.folder_id)}
                    className="flex items-center space-x-2 bg-emerald-300 text-emerald-800 px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors text-sm font-medium"
                    title="Create a new folder inside this folder"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Folder</span>
                  </button>
                  <button
                    onClick={() => uploadFile(mainFolder.folder_id)}
                    className="flex items-center space-x-2 bg-cyan-300 text-cyan-800 px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors text-sm font-medium"
                    title="Upload a file to this folder"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload File</span>
                  </button>
                  <button
                    onClick={() => deleteItem(mainFolder.folder_id, 'folder', mainFolder.name)}
                    className="flex items-center space-x-2 bg-rose-300 text-rose-800 px-4 py-2 rounded-lg hover:bg-rose-400 transition-colors text-sm font-medium"
                    title="Delete this folder"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Expanded Content - Show case files and phase folders */}
              {expandedFolders[mainFolder.folder_id] && (
                <div className="mt-4 space-y-3">
                  {/* Case-level attachments */}
                  {caseAttachments.length > 0 && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm font-medium text-purple-800 mb-2">📎 Case Files ({caseAttachments.length})</p>
                      {caseAttachments.map((attachment, index) => renderAttachment(attachment, 'case', index))}
                    </div>
                  )}

                  {/* Files in main folder */}
                  {mainFolder.files && mainFolder.files.map(file => (
                    <div
                      key={file.file_id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <FileText className="w-6 h-6 text-gray-600 hover:text-blue-600 transition-colors" />
                          <div className="text-left flex-1">
                            <h4 className="text-base font-medium text-gray-800 hover:text-blue-600 transition-colors">
                              {file.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
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

                  {/* Phase Folders - Show each phase with its tasks */}
                  {Array.from(allPhaseNames).map((phaseName) => {
                    const phaseFolders = phaseFoldersMap[phaseName] || [];
                    const phaseFolder = phaseFolders[0]; // Take first phase folder if exists
                    const phaseTasks = tasksByPhase[phaseName] || [];
                    const phaseTaskIds = new Set(phaseTasks.map(t => t.task_id));
                    const phaseTaskAttachments = Object.entries(attachmentGroup.byTask || {})
                      .filter(([taskId]) => phaseTaskIds.has(parseInt(taskId)))
                      .flatMap(([, attachments]) => attachments);

                    return (
                      <div key={`phase-${phaseName}`} className="mb-4">
                        {/* Phase Folder Card */}
                        <div className="bg-white border-2 border-indigo-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => {
                                  const phaseKey = `phase-${groupKey}-${phaseName}`;
                                  setExpandedFolders(prev => ({
                                    ...prev,
                                    [phaseKey]: !prev[phaseKey]
                                  }));
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                {expandedFolders[`phase-${groupKey}-${phaseName}`] ? (
                                  <ChevronDown className="w-6 h-6 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-6 h-6 text-gray-600" />
                                )}
                              </button>
                              <FolderOpen className="w-8 h-8 text-indigo-500" />
                              <div className="text-left flex-1">
                                <h4 className="text-lg font-semibold text-gray-800">
                                  {phaseName}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Phase • {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                                  {phaseTaskAttachments.length > 0 && ` • ${phaseTaskAttachments.length} file${phaseTaskAttachments.length !== 1 ? 's' : ''}`}
                                </p>
                              </div>
                            </div>

                            {/* Phase Folder Action Buttons */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => createFolder(phaseFolder?.folder_id || mainFolder.folder_id)}
                                className="flex items-center space-x-2 bg-emerald-300 text-emerald-800 px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors text-sm font-medium"
                                title="Create a new folder inside this phase"
                              >
                                <Plus className="w-4 h-4" />
                                <span>New Folder</span>
                              </button>
                              <button
                                onClick={() => uploadFile(phaseFolder?.folder_id || mainFolder.folder_id)}
                                className="flex items-center space-x-2 bg-cyan-300 text-cyan-800 px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors text-sm font-medium"
                                title="Upload a file to this phase"
                              >
                                <Upload className="w-4 h-4" />
                                <span>Upload File</span>
                              </button>
                            </div>
                          </div>

                          {/* Expanded Phase Content - Show task folders */}
                          {expandedFolders[`phase-${groupKey}-${phaseName}`] && (
                            <div className="mt-4 space-y-3 ml-4">
                              {/* Phase folder files if any */}
                              {phaseFolder && phaseFolder.files && phaseFolder.files.length > 0 && (
                                <div className="mb-3">
                                  {phaseFolder.files.map(file => (
                                    <div
                                      key={file.file_id}
                                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          <FileText className="w-5 h-5 text-gray-600" />
                                          <div>
                                            <h5 className="text-sm font-medium text-gray-800">{file.name}</h5>
                                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => handleEditSend(file)}
                                            className="flex items-center space-x-1 bg-amber-200 text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-300 transition-colors text-xs font-medium"
                                          >
                                            <Edit className="w-3 h-3" />
                                            <span>Edit</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Show empty state if phase has no tasks, files, or attachments */}
                              {phaseTasks.length === 0 && 
                               (!phaseFolder || !phaseFolder.files || phaseFolder.files.length === 0) && 
                               phaseTaskAttachments.length === 0 && (
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                  <p className="text-sm text-gray-500 italic text-center">
                                    This phase is empty. No tasks or files yet.
                                  </p>
                                </div>
                              )}

                              {/* Task Folders */}
                              {phaseTasks.map((task) => {
                                const taskAttachments = attachmentGroup.byTask[task.task_id] || [];
                                const taskKey = `task-${groupKey}-${phaseName}-${task.task_id}`;
                                
                                return (
                                  <div key={taskKey} className="mb-3">
                                    {/* Task Folder Card */}
                                    <div className="bg-white border-2 border-green-200 rounded-lg p-3 hover:border-green-300 transition-all">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          <button
                                            onClick={() => {
                                              setExpandedFolders(prev => ({
                                                ...prev,
                                                [taskKey]: !prev[taskKey]
                                              }));
                                            }}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                          >
                                            {expandedFolders[taskKey] ? (
                                              <ChevronDown className="w-5 h-5 text-gray-600" />
                                            ) : (
                                              <ChevronRight className="w-5 h-5 text-gray-600" />
                                            )}
                                          </button>
                                          <Folder className="w-6 h-6 text-green-500" />
                                          <div className="text-left flex-1">
                                            <h5 className="text-base font-semibold text-gray-800">{task.name}</h5>
                                            <p className="text-xs text-gray-500">
                                              Task • {taskAttachments.length} file{taskAttachments.length !== 1 ? 's' : ''}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Expanded Task Content - Show task files */}
                                      {expandedFolders[taskKey] && (
                                        <div className="mt-3 ml-8 space-y-2">
                                          {taskAttachments.length > 0 ? (
                                            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                              {taskAttachments.map((attachment, index) => renderAttachment(attachment, 'task', index))}
                                            </div>
                                          ) : (
                                            <p className="text-sm text-gray-400 italic p-2">No files in this task</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Regular subfolders (if any) */}
                  {mainFolder.subfolders && mainFolder.subfolders.length > 0 &&
                    renderTree(mainFolder.subfolders, level + 1)
                  }
                </div>
              )}
            </div>
          </div>
        );
      }

      // If no main folders, return null (shouldn't happen but handle gracefully)
      return null;

      // If we reach here, there are no main folders to display
      return null;
    });
  };

  // No more context menu listeners needed

  // Count reviewed documents (APPROVED or REJECTED)
  const reviewedDocumentsCount = reviewedDocuments.filter(doc => 
    doc.status === 'APPROVED' || doc.status === 'REJECTED'
  ).length;

  // Count new status changes (reviewed in last 24 hours, excluding seen ones)
  const newStatusChangesCount = reviewedDocuments.filter(doc => 
    (doc.status === 'APPROVED' || doc.status === 'REJECTED') &&
    doc.reviewed_at &&
    dayjs(doc.reviewed_at).isAfter(dayjs().subtract(24, 'hours')) &&
    !seenDocumentUpdates.has(doc.t_document_id)
  ).length;

  // Mark document update as seen
  const markUpdateAsSeen = (docId) => {
    setSeenDocumentUpdates(prev => {
      const newSet = new Set(prev);
      newSet.add(docId);
      // Persist to localStorage
      localStorage.setItem('seenDocumentUpdates', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  // Get new status changes for banner (excluding seen ones)
  const newStatusChanges = reviewedDocuments.filter(doc => 
    (doc.status === 'APPROVED' || doc.status === 'REJECTED') &&
    doc.reviewed_at &&
    dayjs(doc.reviewed_at).isAfter(dayjs().subtract(24, 'hours')) &&
    !seenDocumentUpdates.has(doc.t_document_id)
  ).slice(0, 3); // Show max 3 in banner

  return (
    <main className="flex-1 overflow-auto p-6 bg-gray-50 min-h-screen">
      {/* Notification Banner for New Status Changes */}
      {newStatusChangesCount > 0 && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-blue-600 animate-pulse" />
              <h3 className="text-lg font-bold text-blue-900">
                {newStatusChangesCount} New Document Status Update{newStatusChangesCount > 1 ? 's' : ''}!
              </h3>
            </div>
            <button
              onClick={() => {
                const firstDoc = newStatusChanges[0];
                if (firstDoc) handleReviewClick(firstDoc);
              }}
              className="text-sm text-blue-700 hover:text-blue-900 font-medium underline"
            >
              View Details →
            </button>
          </div>
          <div className="space-y-2">
            {newStatusChanges.map((doc) => (
              <div
                key={doc.t_document_id}
                className={`p-3 rounded-lg border-2 transition-all hover:shadow-md relative ${
                  doc.status === 'APPROVED'
                    ? 'bg-green-50 border-green-300 hover:border-green-400'
                    : 'bg-red-50 border-red-300 hover:border-red-400'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markUpdateAsSeen(doc.t_document_id);
                  }}
                  className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  title="Mark as seen"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                <div
                  onClick={() => handleReviewClick(doc)}
                  className="cursor-pointer pr-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {doc.status === 'APPROVED' ? (
                        <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-700" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-red-700" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{doc.filename}</p>
                        <p className="text-xs text-gray-600">
                          {doc.status === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}
                          {doc.reviewed_at && ` • ${dayjs(doc.reviewed_at).format('MMM D, h:mm A')}`}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                  {doc.status === 'REJECTED' && doc.rejection_reason && (
                    <p className="text-sm text-red-700 mt-2 ml-11 line-clamp-1">
                      Reason: {doc.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              onClick={() => router.push('/dashboard/template-documents')}
              className="flex items-center space-x-2 bg-green-300 text-green-800 px-6 py-3 rounded-lg hover:bg-green-400 transition-colors text-base font-medium"
              title="Send to client"
            >
              <Send className="w-5 h-5" />
              <span>Send to Client</span>
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
              {renderTree(items)}
            </div>
          )}
        </div>
      </div>

      {/* Document Editor Modal */}
      {editingDocument && (
        <DocumentEditorModal
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
          onSave={handleSaveDocument}
        />
      )}
    </main>
  );
};

export default DocumentManager;