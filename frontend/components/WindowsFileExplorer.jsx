"use client"

import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  FolderIcon,
  DocumentIcon,
  PencilIcon,
  PaperAirplaneIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const WindowsFileExplorer = () => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, item: null });

  // Sample data structure
  const fileSystem = {
    name: 'Personal Space',
    type: 'folder',
    children: [
      {
        name: 'yup',
        type: 'folder',
        children: [
          {
            name: 'Complete_Campaign_Data_All_Campaigns_2025-09-20 (1).xlsx',
            type: 'file',
            size: '0.04 MB',
            icon: 'excel'
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

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'excel':
        return (
          <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
            <span className="text-green-600 text-xs font-bold">X</span>
          </div>
        );
      case 'word':
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
      default:
        return <DocumentIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const renderItem = (item, level = 0) => {
    const isExpanded = expandedFolders.has(item.name);
    const isFolder = item.type === 'folder';

    return (
      <div key={item.name}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-50 rounded cursor-pointer group ${
            level > 0 ? 'ml-6' : ''
          }`}
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          {/* Expand/Collapse Icon */}
          {isFolder && (
            <button
              onClick={() => toggleFolder(item.name)}
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
              getFileIcon(item.icon)
            )}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-900 truncate">{item.name}</span>
            {!isFolder && item.size && (
              <span className="ml-2 text-xs text-gray-500">{item.size}</span>
            )}
          </div>

          {/* File count for folders */}
          {isFolder && item.children && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mr-2">
              {item.children.length} files
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">File Explorer</h2>
            <p className="text-sm text-gray-500">1 root folders</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Personal Space
            </span>
            
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-yellow-50 text-yellow-700 text-sm rounded">
                Right-click anywhere to create folders or upload files
              </div>
              <button className="p-2 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>New Folder</span>
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
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={closeContextMenu}
        >
          <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            New Folder
          </div>
          <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            Upload File
          </div>
          <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            Rename
          </div>
          <div className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
            Delete
          </div>
        </div>
      )}
    </div>
  );
};

export default WindowsFileExplorer;

