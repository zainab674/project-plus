"use client"

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, FolderPlus, FileText, Calendar, Save, Eye } from 'lucide-react';
import { Button } from '../Button';

const EditTemplateModal = ({ template, onClose, onUpdateTemplate }) => {
    const normalizeTemplate = (t) => ({
        template_id: t?.template_id || '',
        name: t?.name || '',
        description: t?.description || '',
        category: t?.category || 'Real Estate',
        default_priority: t?.default_priority || 'Medium',
        estimated_duration: t?.estimated_duration || '',
        phases_count: Array.isArray(t?.phases) ? t.phases.length : (t?.phases_count || 0),
        documents_count: typeof t?.documents_count === 'number' ? t.documents_count : 0,
        folders: Array.isArray(t?.folders) ? t.folders : [],
        phases: Array.isArray(t?.phases) ? t.phases : [],
        usage_count: t?.usage_count || 0,
        is_active: typeof t?.is_active === 'boolean' ? t.is_active : true,
        created_at: t?.created_at || null,
        updated_at: t?.updated_at || null,
    });

    const [templateData, setTemplateData] = useState(normalizeTemplate(template));
    const [newPhase, setNewPhase] = useState({ name: '', description: '', estimated_days: '' });
    const [newFolder, setNewFolder] = useState({ name: '', description: '', parent_id: null, phase_id: null });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const categories = ['Real Estate', 'Personal Injury', 'Business Law', 'Criminal Law', 'Family Law', 'Employment Law'];

    useEffect(() => {
        setTemplateData(normalizeTemplate(template));
    }, [template]);

    const handleAddPhase = () => {
        if (newPhase.name.trim()) {
            setTemplateData(prev => ({
                ...prev,
                phases: [...(prev.phases || []), {
                    ...newPhase,
                    order: (prev.phases ? prev.phases.length : 0) + 1,
                    estimated_days: parseInt(newPhase.estimated_days) || 0
                }]
            }));
            setNewPhase({ name: '', description: '', estimated_days: '' });
        }
    };

    const handleRemovePhase = (index) => {
        setTemplateData(prev => ({
            ...prev,
            phases: (prev.phases || []).filter((_, i) => i !== index)
        }));
    };

    const handleCreateFolder = () => {
        if (newFolder.name.trim()) {
            setTemplateData(prev => ({
                ...prev,
                folders: [...(prev.folders || []), {
                    ...newFolder,
                    folder_id: Date.now().toString(),
                    files: []
                }]
            }));
            setNewFolder({ name: '', description: '', parent_id: null, phase_id: null });
        }
    };

    const handleDeleteFolder = (folderId) => {
        setTemplateData(prev => ({
            ...prev,
            folders: (prev.folders || []).filter(folder => folder.folder_id !== folderId)
        }));
    };

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const handleRemoveFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveTemplate = async () => {
        setIsLoading(true);
        try {
            // Create FormData for file upload
            const formData = new FormData();
            
            // Add template basic info
            formData.append('name', templateData.name);
            formData.append('description', templateData.description);
            formData.append('category', templateData.category);
            formData.append('default_priority', templateData.default_priority);
            formData.append('estimated_duration', templateData.estimated_duration);
            
            // Add phases
            formData.append('phases', JSON.stringify((templateData.phases || []).map((phase, index) => ({
                name: phase.name,
                description: phase.description,
                order: index + 1,
                estimated_days: parseInt(phase.estimated_days) || 0
            }))));
            
            // Add folders
            formData.append('folders', JSON.stringify((templateData.folders || []).map(folder => ({
                name: folder.name,
                description: folder.description,
                parent_id: folder.parent_id,
                phase_id: folder.phase_id,
                order: folder.order || 0,
                temp_id: folder.folder_id || folder.temp_id // Include temporary ID for file-folder mapping
            }))));
            
            // Add new files with folder associations
            selectedFiles.forEach((file, index) => {
                formData.append('files', file);
                // Add folder association if a folder is selected
                if (selectedFolder) {
                    formData.append(`file_${index}_folder_id`, selectedFolder);
                }
            });
            
            onUpdateTemplate(formData);
        } catch (error) {
            console.error('Error updating template:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                            Edit Template: {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Modify template details, phases, and documents
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Basic Info & Phases */}
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                Basic Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Template Name
                                    </label>
                                    <input
                                        type="text"
                                            value={templateData.name}
                                        onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                            value={templateData.description}
                                        onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows="3"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category
                                        </label>
                                        <select
                                            value={templateData.category}
                                            onChange={(e) => setTemplateData(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {categories.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Default Priority
                                        </label>
                                        <select
                                            value={templateData.default_priority}
                                            onChange={(e) => setTemplateData(prev => ({ ...prev, default_priority: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Estimated Duration
                                    </label>
                                    <input
                                        type="text"
                                            value={templateData.estimated_duration}
                                        onChange={(e) => setTemplateData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Phases Management */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Template Phases
                            </h3>

                            {/* Add New Phase */}
                            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">Add New Phase</h4>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={newPhase.name}
                                        onChange={(e) => setNewPhase(prev => ({ ...prev, name: e.target.value }))}
                                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Phase name"
                                    />
                                    <input
                                        type="number"
                                        value={newPhase.estimated_days}
                                        onChange={(e) => setNewPhase(prev => ({ ...prev, estimated_days: e.target.value }))}
                                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Days"
                                    />
                                    <Button
                                        onClick={handleAddPhase}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add
                                    </Button>
                                </div>
                                <textarea
                                    value={newPhase.description}
                                    onChange={(e) => setNewPhase(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows="2"
                                    placeholder="Phase description (optional)"
                                />
                            </div>

                            {/* Existing Phases */}
                            <div className="space-y-2">
                                {(templateData.phases || []).map((phase, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                                                {phase.order}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{phase.name}</div>
                                                {phase.description && (
                                                    <div className="text-sm text-gray-600">{phase.description}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">{phase.estimated_days} days</span>
                                            <Button
                                                onClick={() => handleRemovePhase(index)}
                                                className="bg-red-100 hover:bg-red-200 text-red-700 p-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Documents */}
                    <div className="space-y-6">
                        {/* Create Folder */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <FolderPlus className="w-4 h-4 mr-2" />
                                Create Folder
                            </h3>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={newFolder.name}
                                    onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Folder name"
                                />
                                <select
                                    value={newFolder.phase_id || ''}
                                    onChange={(e) => setNewFolder(prev => ({ ...prev, phase_id: e.target.value || null }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Phase (Optional)</option>
                                    {(templateData.phases || []).map(phase => (
                                        <option key={phase.order} value={phase.order}>
                                            {phase.name}
                                        </option>
                                    ))}
                                </select>
                                <textarea
                                    value={newFolder.description}
                                    onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows="2"
                                    placeholder="Folder description (optional)"
                                />
                                <Button
                                    onClick={handleCreateFolder}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <FolderPlus className="w-4 h-4 mr-2" />
                                    Create Folder
                                </Button>
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Files
                            </h3>
                            <div className="space-y-3">
                                <select
                                    value={selectedFolder}
                                    onChange={(e) => setSelectedFolder(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select folder to upload to</option>
                                    {(templateData.folders || []).map(folder => (
                                        <option key={folder.folder_id} value={folder.folder_id}>
                                            {folder.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 mb-2">Choose files to upload</p>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="file-upload-edit"
                                    />
                                    <label
                                        htmlFor="file-upload-edit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg cursor-pointer text-sm inline-block"
                                    >
                                        Choose Files
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Selected Files */}
                        {selectedFiles.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">New Files to Upload</h3>
                                <div className="space-y-2">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                                            <div className="flex items-center">
                                                <FileText className="w-4 h-4 text-gray-400 mr-2" />
                                                <span className="text-sm text-gray-900">{file.name}</span>
                                                <span className="text-xs text-gray-500 ml-2">
                                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                </span>
                                            </div>
                                            <Button
                                                onClick={() => handleRemoveFile(index)}
                                                className="bg-red-100 hover:bg-red-200 text-red-700 p-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Existing Folders */}
                        {templateData.folders.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Template Folders</h3>
                                <div className="space-y-2">
                                    {templateData.folders.map(folder => {
                                        const phase = templateData.phases.find(p => p.order === folder.phase_id);
                                        return (
                                            <div key={folder.folder_id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                                <div className="flex items-center">
                                                    <FolderPlus className="w-4 h-4 text-gray-400 mr-2" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{folder.name}</div>
                                                        {folder.description && (
                                                            <div className="text-sm text-gray-600">{folder.description}</div>
                                                        )}
                                                        {phase && (
                                                            <div className="text-xs text-blue-600 mt-1">
                                                                Phase: {phase.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">{folder.files?.length || 0} files</span>
                                                    <Button className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-1">
                                                        <Eye className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteFolder(folder.folder_id)}
                                                        className="bg-red-100 hover:bg-red-200 text-red-700 p-1"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                    <Button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveTemplate}
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EditTemplateModal;

