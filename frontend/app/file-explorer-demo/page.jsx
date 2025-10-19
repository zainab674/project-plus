import React from 'react';
import WindowsFileExplorer from '../../components/WindowsFileExplorer';
import AdvancedWindowsFileExplorer from '../../components/AdvancedWindowsFileExplorer';
import ReactIconsFileExplorer from '../../components/ReactIconsFileExplorer';
import WindowsStyleFileExplorer from '../../components/WindowsStyleFileExplorer';

const FileExplorerDemo = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Windows-Style File Explorer</h1>
          <p className="text-gray-600">
            React components that mimic Windows Explorer interface with tree structure, context menus, and file management features.
          </p>
        </div>

        <div className="space-y-8">
          {/* Windows Style Version - MAIN FEATURE */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 Windows-Style File Explorer (Yellow Folders + Double-Click)</h2>
            <WindowsStyleFileExplorer />
          </div>

          {/* Basic Version */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic File Explorer (Heroicons)</h2>
            <WindowsFileExplorer />
          </div>

          {/* Advanced Version */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced File Explorer (Heroicons)</h2>
            <AdvancedWindowsFileExplorer />
          </div>

          {/* React Icons Version */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">File Explorer (React Icons)</h2>
            <ReactIconsFileExplorer />
          </div>
        </div>

        {/* Features List */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Features Implemented</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Core Functionality</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Tree-like folder structure</li>
                <li>• Expandable/collapsible folders</li>
                <li>• File and folder icons</li>
                <li>• File size display</li>
                <li>• Modified date information</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Interactive Features</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Right-click context menu</li>
                <li>• Hover action buttons</li>
                <li>• File selection</li>
                <li>• Search functionality</li>
                <li>• View mode toggle (list/grid)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Use</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>1. Import the component:</strong></p>
            <code className="block bg-blue-100 p-2 rounded text-xs font-mono">
              import WindowsFileExplorer from '../components/WindowsFileExplorer';
            </code>
            
            <p><strong>2. Use in your JSX:</strong></p>
            <code className="block bg-blue-100 p-2 rounded text-xs font-mono">
              &lt;WindowsFileExplorer /&gt;
            </code>
            
            <p><strong>3. Customize the data structure:</strong></p>
            <p>Modify the <code>fileSystem</code> object to match your data structure. Each item should have:</p>
            <ul className="ml-4 space-y-1">
              <li>• <code>name</code>: File/folder name</li>
              <li>• <code>type</code>: 'folder' or 'file'</li>
              <li>• <code>children</code>: Array of child items (for folders)</li>
              <li>• <code>size</code>: File size (for files)</li>
              <li>• <code>icon</code>: File type identifier</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileExplorerDemo;
