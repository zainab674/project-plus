// Example: How to add Windows File Explorer to your existing project page

// 1. Import the component
import ProjectFileManager from '@/components/ProjectFileManager';

// 2. Add state for showing file manager
const [showFileManager, setShowFileManager] = useState(false);

// 3. Add a button to toggle file manager
<button 
  onClick={() => setShowFileManager(!showFileManager)}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
>
  <span>📁</span>
  <span>File Manager</span>
</button>

// 4. Conditionally render the file manager
{showFileManager && (
  <ProjectFileManager 
    projectId={projectId} 
    projectName={`Project ${projectId} Files`} 
  />
)}

// 5. Or add it as a tab/section in your existing layout
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'files', label: 'Files' }, // Add this tab
  { id: 'chat', label: 'Chat' }
];

// In your tab content:
{activeTab === 'files' && (
  <ProjectFileManager 
    projectId={projectId} 
    projectName={`Project ${projectId} Files`} 
  />
)}

