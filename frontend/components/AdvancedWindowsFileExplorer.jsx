"use client"
import React, { useState, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  FolderIcon,
  DocumentIcon,
  PencilIcon,
  PaperAirplaneIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  ArrowUpIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

const AdvancedWindowsFileExplorer = () => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['Personal Space']));
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, item: null });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Enhanced data structure with more realistic content
  const fileSystem = {
    name: 'Personal Space',
    type: 'folder',
    children: [
      {
        name: 'Documents',
        type: 'folder',
        children: [
          {
            name: 'Project Proposal.docx',
            type: 'file',
            size: '2.3 MB',
            icon: 'word',
            modified: '2024-01-15',
            created: '2024-01-10'
          },
          {
            name: 'Budget Analysis.xlsx',
            type: 'file',
            size: '1.8 MB',
            icon: 'excel',
            modified: '2024-01-14',
            created: '2024-01-12'
          }
        ]
      },
      {
        name: 'Images',
        type: 'folder',
        children: [
          {
            name: 'Screenshot 2024-01-15.png',
            type: 'file',
            size: '4.2 MB',
            icon: 'image',
            modified: '2024-01-15',
            created: '2024-01-15'
          }
        ]
      },
      {
        name: 'yup',
        type: 'folder',
        children: [
          {
            name: 'Complete_Campaign_Data_All_Campaigns_2025-09-20 (1).xlsx',
            type: 'file',
            size: '0.04 MB',
            icon: 'excel',
            modified: '2024-01-15',
            created: '2024-01-15'
          }
        ]
      }
    ]
  };

  const toggleFolder = (folderName) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      item: item
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, item: null });
  };

  const toggleSelection = (itemName) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemName)) {
      newSelected.delete(itemName);
    } else {
      newSelected.add(itemName);
    }
    setSelectedItems(newSelected);
  };

  const getFileIcon = (fileType, fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (fileType) {
      case 'excel':
      case 'xlsx':
        return (
          <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
            <span className="text-green-600 text-xs font-bold">X</span>
          </div>
        );
      case 'word':
      case 'docx':
        return (
          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
            <span className="text-blue-600 text-xs font-bold">W</span>
          </div>
        );
      case 'pdf':
        return (
          <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
            <span className="text-red-600 text-xs font-bold">P</span>
          </div>
        );
      case 'image':
      case 'png':
      case 'jpg':
      case 'jpeg':
        return (
          <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
            <span className="text-purple-600 text-xs font-bold">📷</span>
          </div>
        );
      default:
        return <DocumentIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatFileSize = (size) => {
    return size;
  };

  const renderItem = (item, level = 0) => {
    const isExpanded = expandedFolders.has(item.name);
    const isFolder = item.type === 'folder';
    const isSelected = selectedItems.has(item.name);

    return (
      <div key={item.name}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-blue-50 rounded cursor-pointer group ${
            level > 0 ? 'ml-6' : ''
          } ${isSelected ? 'bg-blue-100' : ''}`}
          onContextMenu={(e) => handleContextMenu(e, item)}
          onClick={() => toggleSelection(item.name)}
        >
          {/* Expand/Collapse Icon */}
          {isFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.name);
              }}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          
          {!isFolder && <div className="w-6 mr-2" />} {/* Spacer for files */}

          {/* Folder/File Icon */}
          <div className="mr-3">
            {isFolder ? (
              <FolderIcon className="w-6 h-6 text-blue-500" />
            ) : (
              getFileIcon(item.icon, item.name)
            )}
          </div>

          {/* Name and Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-900 truncate">{item.name}</span>
              {!isFolder && item.size && (
                <span className="text-xs text-gray-500">{formatFileSize(item.size)}</span>
              )}
            </div>
            {item.modified && (
              <div className="text-xs text-gray-400">
                Modified: {new Date(item.modified).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* File count for folders */}
          {isFolder && item.children && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mr-2">
              {item.children.length} items
            </span>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isFolder && (
              <button className="p-1 hover:bg-gray-200 rounded">
                <EllipsisVerticalIcon className="w-4 h-4 text-gray-500" />
              </button>
            )}
            
            {!isFolder && (
              <>
                <button className="p-1 hover:bg-blue-100 rounded">
                  <PencilIcon className="w-4 h-4 text-blue-500" />
                </button>
                <button className="p-1 hover:bg-green-100 rounded">
                  <PaperAirplaneIcon className="w-4 h-4 text-green-500" />
                </button>
                <button className="p-1 hover:bg-red-100 rounded">
                  <TrashIcon className="w-4 h-4 text-red-500" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Render children if folder is expanded */}
        {isFolder && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">File Explorer</h2>
            <p className="text-sm text-gray-500">1 root folders</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Personal Space
            </span>
            
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>New Folder</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded">
              <ArrowUpIcon className="w-4 h-4 text-gray-500" />
            </button>
            
            <div className="flex items-center space-x-1 border border-gray-200 rounded">
              <button 
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <Bars3Icon className="w-4 h-4 text-gray-500" />
              </button>
              <button 
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Squares2X2Icon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="px-3 py-1 bg-yellow-50 text-yellow-700 text-sm rounded">
              Right-click anywhere to create folders or upload files
            </div>
            
            <button className="p-2 hover:bg-gray-100 rounded">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* File Tree */}
      <div className="p-4">
        {renderItem(fileSystem)}
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            New Folder
          </div>
          <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            Upload File
          </div>
          <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            Paste
          </div>
          <div className="border-t border-gray-100 my-1"></div>
          <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            Rename
          </div>
          <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            Properties
          </div>
          <div className="border-t border-gray-100 my-1"></div>
          <div className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
            Delete
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedWindowsFileExplorer;

