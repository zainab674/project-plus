'use client'
import React, { useState, useEffect } from 'react'
import { getFilesRequest } from '@/lib/http/project'
import { toast } from 'react-toastify'
import { 
  Folder, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  FolderOpen, 
  Search,
  X,
  Check
} from 'lucide-react'

const InternalDocumentSelector = ({ isOpen, onClose, onSelect, selectedFile, phase, projectId }) => {
  const [documents, setDocuments] = useState([])
  const [expandedFolders, setExpandedFolders] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [filteredDocuments, setFilteredDocuments] = useState([])

  useEffect(() => {
    if (isOpen) {
      fetchDocuments()
    }
  }, [isOpen, phase, projectId])

  useEffect(() => {
    if (searchTerm) {
      const filtered = filterDocuments(documents, searchTerm.toLowerCase())
      setFilteredDocuments(filtered)
    } else {
      setFilteredDocuments(documents)
    }
  }, [searchTerm, documents])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      // Build query parameters
      const params = {}
      if (phase) {
        params.phase = phase
      }
      if (projectId) {
        params.id = projectId
      }
      
      const response = await getFilesRequest(params)
      if (response.data.success) {
        setDocuments(response.data.folders)
        setFilteredDocuments(response.data.folders)
      }
    } catch (error) {
      toast.error('Failed to fetch documents')
    } finally {
      setIsLoading(false)
    }
  }

  const filterDocuments = (folders, term) => {
    const result = []
    
    folders.forEach(folder => {
      const filteredFolder = { ...folder }
      
      // Filter files in current folder
      if (folder.files) {
        filteredFolder.files = folder.files.filter(file => 
          file.name.toLowerCase().includes(term)
        )
      }
      
      // Filter subfolders recursively
      if (folder.subfolders && folder.subfolders.length > 0) {
        filteredFolder.subfolders = filterDocuments(folder.subfolders, term)
      }
      
      // Include folder if it has matching files/subfolders or if folder name matches
      if (
        filteredFolder.files.length > 0 || 
        (filteredFolder.subfolders && filteredFolder.subfolders.length > 0) ||
        folder.name.toLowerCase().includes(term)
      ) {
        result.push(filteredFolder)
      }
    })
    
    return result
  }

  const handleFileSelect = (file) => {
    onSelect(file)
    onClose()
  }

  const renderDocuments = (folders = filteredDocuments, level = 0) => {
    return folders.map(folder => (
      <div key={folder.folder_id} className={`${level > 0 ? 'ml-6' : ''} mb-2`}>
        {/* Folder */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setExpandedFolders(prev => ({
                    ...prev,
                    [folder.folder_id]: !prev[folder.folder_id]
                  }))
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {expandedFolders[folder.folder_id] ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
              <FolderOpen className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">
                {folder.name}
              </span>
              <span className="text-xs text-gray-500">
                ({folder.files?.length || 0} files)
              </span>
            </div>
          </div>

          {/* Expanded Content */}
          {expandedFolders[folder.folder_id] && (
            <div className="mt-3 space-y-2">
              {/* Files */}
              {folder.files && folder.files.map(file => (
                <div
                  key={file.file_id}
                  className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                    selectedFile?.file_id === file.file_id 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleFileSelect(file)}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  </div>
                  {selectedFile?.file_id === file.file_id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              ))}

              {/* Subfolders */}
              {folder.subfolders && folder.subfolders.length > 0 &&
                renderDocuments(folder.subfolders, level + 1)
              }
            </div>
          )}
        </div>
      </div>
    ))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Select Internal Document
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {phase ? `Documents for phase: ${phase}` : 'Choose from your existing documents'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading documents...</span>
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No documents found' : 'No documents available'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Upload some documents first to use this feature'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {renderDocuments()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          {selectedFile && (
            <button
              onClick={() => {
                onSelect(selectedFile)
                onClose()
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Select Document
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default InternalDocumentSelector
