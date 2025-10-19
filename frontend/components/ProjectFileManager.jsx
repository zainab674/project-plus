import React, { useState } from 'react';
import WindowsStyleFileExplorer from '../WindowsStyleFileExplorer';

const ProjectFileManager = ({ projectId, projectName = "Project Files" }) => {
  // This would typically fetch from your API
  const projectFileSystem = {
    name: projectName,
    type: 'folder',
    children: [
      {
        name: 'Documents',
        type: 'folder',
        children: [
          {
            name: 'Project Brief.docx',
            type: 'file',
            size: '1.2 MB',
            icon: 'word',
            modified: '2024-01-15'
          },
          {
            name: 'Budget Analysis.xlsx',
            type: 'file',
            size: '0.8 MB',
            icon: 'excel',
            modified: '2024-01-14'
          },
          {
            name: 'Contract.pdf',
            type: 'file',
            size: '2.1 MB',
            icon: 'pdf',
            modified: '2024-01-13'
          }
        ]
      },
      {
        name: 'Assets',
        type: 'folder',
        children: [
          {
            name: 'logo.png',
            type: 'file',
            size: '2.1 MB',
            icon: 'image',
            modified: '2024-01-13'
          },
          {
            name: 'banner.jpg',
            type: 'file',
            size: '3.4 MB',
            icon: 'image',
            modified: '2024-01-12'
          }
        ]
      },
      {
        name: 'Reports',
        type: 'folder',
        children: [
          {
            name: 'Monthly Report.xlsx',
            type: 'file',
            size: '1.5 MB',
            icon: 'excel',
            modified: '2024-01-15'
          }
        ]
      }
    ]
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📁 {projectName}</h1>
        <p className="text-gray-600">Manage and organize your project documents with Windows-style file explorer</p>
      </div>
      
      <WindowsStyleFileExplorer fileSystem={projectFileSystem} />
    </div>
  );
};

export default ProjectFileManager;