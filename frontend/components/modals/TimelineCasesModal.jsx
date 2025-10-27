import React from 'react';
import { Clock, X, Search } from 'lucide-react';
import { Button } from '../ui/button';

// Timeline Cases Modal Component
export const TimelineCasesModal = ({
  isOpen,
  onClose,
  projects,
  projectsLoading,
  searchTerm,
  setSearchTerm,
  filteredProjects,
  onProjectSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-800">Select Case for Timeline</h2>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-h-[85vh] overflow-y-auto p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search cases..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Projects List */}
            {projectsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects?.map((project, index) => (
                  <button
                    key={`${project.project_id}-${index}`}
                    onClick={() => onProjectSelect(project)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                        {project.name}
                      </h3>
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${project.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        {project.status || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Client: {project.client_name || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {project.description ?
                        (project.description.length > 100
                          ? `${project.description.substring(0, 100)}...`
                          : project.description
                        ) : 'No description available'
                      }
                    </p>
                  </button>
                ))}
              </div>
            )}

            {!projectsLoading && filteredProjects?.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No cases found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
