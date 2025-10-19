"use client"

import React, { useState, useEffect } from 'react';

const WindowsStyleFileExplorer = () => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['Personal Space']));
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, item: null });
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [viewMode, setViewMode] = useState('icons'); // 'icons' or 'list'

  // Sample data structure
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
            modified: '2024-01-15'
          },
          {
            name: 'Budget Analysis.xlsx',
            type: 'file',
            size: '1.8 MB',
            icon: 'excel',
            modified: '2024-01-14'
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
            modified: '2024-01-15'
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
            modified: '2024-01-15'
          }
        ]
      }
    ]
  };

  const toggleFolder = (folderName) => {
    console.log('Toggling folder:', folderName);
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
      console.log('Closing folder:', folderName);
    } else {
      newExpanded.add(folderName);
      console.log('Opening folder:', folderName);
    }
    setExpandedFolders(newExpanded);
    console.log('Expanded folders:', Array.from(newExpanded));
  };

  const handleDoubleClick = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item.type === 'folder') {
      console.log('Double-clicked folder:', item.name);
      toggleFolder(item.name);
    } else {
      // Handle file double-click (open file)
      console.log('Opening file:', item.name);
    }
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
    console.log('Selecting item:', itemName);
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemName)) {
      newSelected.delete(itemName);
    } else {
      newSelected.add(itemName);
    }
    setSelectedItems(newSelected);
  };

  const handleClick = (e, item) => {
    // Simple click handling - just select the item
    toggleSelection(item.name);
  };

  // Windows-style yellow folder icon
  const WindowsFolderIcon = ({ isOpen = false }) => (
    <div className="relative">
      <div className="w-16 h-12 relative">
        {/* Folder body */}
        <div className={`absolute inset-0 ${isOpen ? 'bg-yellow-300' : 'bg-yellow-400'} rounded-b-lg shadow-sm`}>
          {/* Folder front */}
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-b-lg border border-yellow-600">
            {/* Folder tab */}
            <div className="absolute -top-1 left-2 w-8 h-3 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-t-lg border-l border-r border-t border-yellow-600"></div>
            {/* Folder opening effect when open */}
            {isOpen && (
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-200 to-yellow-400 rounded-b-lg">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-yellow-200 to-yellow-300"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Windows-style file icons
  const getFileIcon = (fileType, fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (fileType) {
      case 'excel':
      case 'xlsx':
        return (
          <div className="w-12 h-16 relative">
            <div className="absolute inset-0 bg-green-100 border border-green-300 rounded shadow-sm">
              <div className="absolute top-1 left-1 right-1 h-2 bg-green-200 rounded-t"></div>
              <div className="absolute top-3 left-2 right-2 bottom-2 bg-white rounded">
                <div className="flex items-center justify-center h-full">
                  <span className="text-green-600 text-lg font-bold">X</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'word':
      case 'docx':
        return (
          <div className="w-12 h-16 relative">
            <div className="absolute inset-0 bg-blue-100 border border-blue-300 rounded shadow-sm">
              <div className="absolute top-1 left-1 right-1 h-2 bg-blue-200 rounded-t"></div>
              <div className="absolute top-3 left-2 right-2 bottom-2 bg-white rounded">
                <div className="flex items-center justify-center h-full">
                  <span className="text-blue-600 text-lg font-bold">W</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'pdf':
        return (
          <div className="w-12 h-16 relative">
            <div className="absolute inset-0 bg-red-100 border border-red-300 rounded shadow-sm">
              <div className="absolute top-1 left-1 right-1 h-2 bg-red-200 rounded-t"></div>
              <div className="absolute top-3 left-2 right-2 bottom-2 bg-white rounded">
                <div className="flex items-center justify-center h-full">
                  <span className="text-red-600 text-lg font-bold">P</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'image':
      case 'png':
      case 'jpg':
      case 'jpeg':
        return (
          <div className="w-12 h-16 relative">
            <div className="absolute inset-0 bg-purple-100 border border-purple-300 rounded shadow-sm">
              <div className="absolute top-1 left-1 right-1 h-2 bg-purple-200 rounded-t"></div>
              <div className="absolute top-3 left-2 right-2 bottom-2 bg-white rounded">
                <div className="flex items-center justify-center h-full">
                  <span className="text-purple-600 text-lg">📷</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="w-12 h-16 relative">
            <div className="absolute inset-0 bg-gray-100 border border-gray-300 rounded shadow-sm">
              <div className="absolute top-1 left-1 right-1 h-2 bg-gray-200 rounded-t"></div>
              <div className="absolute top-3 left-2 right-2 bottom-2 bg-white rounded">
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-600 text-lg">📄</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderItem = (item, level = 0) => {
    const isExpanded = expandedFolders.has(item.name);
    const isFolder = item.type === 'folder';
    const isSelected = selectedItems.has(item.name);

    if (viewMode === 'icons') {
      return (
        <div key={item.name} className="inline-block">
           <div
             className={`w-20 p-2 m-1 rounded cursor-pointer hover:bg-blue-100 transition-colors ${
               isSelected ? 'bg-blue-200' : ''
             } ${isFolder ? 'hover:shadow-md' : ''}`}
             onDoubleClick={(e) => handleDoubleClick(e, item)}
            onContextMenu={(e) => handleContextMenu(e, item)}
             onClick={(e) => handleClick(e, item)}
          >
            {/* Icon */}
            <div className="flex justify-center mb-1">
              {isFolder ? (
                <WindowsFolderIcon isOpen={isExpanded} />
              ) : (
                getFileIcon(item.icon, item.name)
              )}
            </div>
            
            {/* Name */}
            <div className="text-xs text-center text-gray-800 break-words leading-tight">
              {item.name}
            </div>
            
             {/* File count for folders */}
             {isFolder && item.children && (
               <div className="text-xs text-center text-gray-500 mt-1">
                 {item.children.length} items {isExpanded ? '(Open)' : '(Closed)'}
               </div>
             )}
          </div>
        </div>
      );
    } else {
      // List view
      return (
        <div key={item.name}>
          <div
            className={`flex items-center py-1 px-2 hover:bg-blue-50 rounded cursor-pointer group ${
              level > 0 ? 'ml-6' : ''
            } ${isSelected ? 'bg-blue-100' : ''}`}
             onDoubleClick={(e) => handleDoubleClick(e, item)}
            onContextMenu={(e) => handleContextMenu(e, item)}
             onClick={(e) => handleClick(e, item)}
          >
            {/* Folder/File Icon */}
            <div className="mr-3">
              {isFolder ? (
                <WindowsFolderIcon isOpen={isExpanded} />
              ) : (
                <div className="scale-75">
                  {getFileIcon(item.icon, item.name)}
                </div>
              )}
            </div>

            {/* Name and Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900 truncate">{item.name}</span>
                {!isFolder && item.size && (
                  <span className="text-xs text-gray-500">{item.size}</span>
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
          </div>

          {/* Render children if folder is expanded */}
          {isFolder && isExpanded && item.children && (
            <div>
              {item.children.map(child => renderItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }
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
            <h2 className="text-lg font-semibold text-gray-900">Windows File Explorer</h2>
            <p className="text-sm text-gray-500">1 root folders</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Personal Space
            </span>
            
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <span>+</span>
              <span>New Folder</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded">
              <span className="text-gray-500">↑</span>
            </button>
            
            <div className="flex items-center space-x-1 border border-gray-200 rounded">
              <button 
                className={`p-2 ${viewMode === 'icons' ? 'bg-gray-100' : ''}`}
                onClick={() => setViewMode('icons')}
              >
                <span className="text-gray-500">⊞</span>
              </button>
              <button 
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <span className="text-gray-500">☰</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-yellow-50 text-yellow-700 text-sm rounded">
              Double-click folders to open • Right-click for menu
            </div>
          </div>
        </div>
      </div>

       {/* File Tree */}
       <div className="p-4">
         {viewMode === 'icons' ? (
           <div className="flex flex-wrap">
             {renderItem(fileSystem)}
             {expandedFolders.has('Personal Space') && fileSystem.children?.map(child => (
               <div key={child.name} className="inline-block">
                 {renderItem(child)}
                 {expandedFolders.has(child.name) && child.children?.map(grandChild => (
                   <div key={grandChild.name} className="inline-block">
                     {renderItem(grandChild)}
                   </div>
                 ))}
               </div>
             ))}
           </div>
         ) : (
           renderItem(fileSystem)
         )}
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

export default WindowsStyleFileExplorer;

