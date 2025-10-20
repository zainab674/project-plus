"use client"

import React, { useState } from 'react';
import { X, Plus, Trash2, Upload, FolderPlus, FileText, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../Button';

const CreateTemplateModal = ({ onClose, onCreateTemplate }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [templateData, setTemplateData] = useState({
        name: '',
        description: '',
        category: '',
        default_priority: 'Medium',
        estimated_duration: '',
        phases: [],
        folders: [],
        files: []
    });
    const [newPhase, setNewPhase] = useState({ name: '', description: '', estimated_days: '' });
    const [newFolder, setNewFolder] = useState({ name: '', description: '', parent_id: null });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState('');

    const categories = ['Real Estate', 'Personal Injury', 'Business Law', 'Criminal Law', 'Family Law', 'Employment Law'];

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleAddPhase = () => {
        if (newPhase.name.trim()) {
            setTemplateData(prev => ({
                ...prev,
                phases: [...prev.phases, {
                    ...newPhase,
                    order: prev.phases.length + 1,
                    estimated_days: parseInt(newPhase.estimated_days) || 0
                }]
            }));
            setNewPhase({ name: '', description: '', estimated_days: '' });
        }
    };

    const handleRemovePhase = (index) => {
        setTemplateData(prev => ({
            ...prev,
            phases: prev.phases.filter((_, i) => i !== index)
        }));
    };

    const handleCreateFolder = () => {
        if (newFolder.name.trim()) {
            setTemplateData(prev => ({
                ...prev,
                folders: [...prev.folders, {
                    ...newFolder,
                    folder_id: Date.now().toString(),
                    files: []
                }]
            }));
            setNewFolder({ name: '', description: '', parent_id: null });
        }
    };

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const handleRemoveFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveTemplate = () => {
        const finalTemplate = {
            ...templateData,
            template_id: Date.now().toString(),
            phases_count: templateData.phases.length,
            documents_count: selectedFiles.length,
            usage_count: 0,
            is_active: true,
            created_at: new Date().toISOString()
        };
        onCreateTemplate(finalTemplate);
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Basic Template Information</h2>
                <p className="text-gray-600 mt-2">Provide basic details about your case template</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Name *
                    </label>
                    <input
                        type="text"
                        value={templateData.name}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Foreclosure Defense"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        value={templateData.description}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Describe what this template is used for..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category *
                        </label>
                        <select
                            value={templateData.category}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Select Category</option>
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
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 6-12 months"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Define Template Phases</h2>
                <p className="text-gray-600 mt-2">Create the workflow phases for this case type</p>
            </div>

            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Add New Phase</h3>
                    <div className="grid grid-cols-3 gap-3 mb-3">
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
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Phase
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

                <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Template Phases</h3>
                    {templateData.phases.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No phases added yet. Add phases to organize your case workflow.</p>
                        </div>
                    ) : (
                        templateData.phases.map((phase, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
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
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Upload Template Documents</h2>
                <p className="text-gray-600 mt-2">Create folders and upload documents for this template</p>
            </div>

            <div className="space-y-4">
                {/* Create Folder */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Create Folder</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                            type="text"
                            value={newFolder.name}
                            onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Folder name"
                        />
                        <Button
                            onClick={handleCreateFolder}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <FolderPlus className="w-4 h-4 mr-1" />
                            Create Folder
                        </Button>
                    </div>
                    <textarea
                        value={newFolder.description}
                        onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="2"
                        placeholder="Folder description (optional)"
                    />
                </div>

                {/* File Upload */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Upload Files</h3>
                    <div className="mb-3">
                        <select
                            value={selectedFolder}
                            onChange={(e) => setSelectedFolder(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select folder to upload to</option>
                            {templateData.folders.map(folder => (
                                <option key={folder.folder_id} value={folder.folder_id}>
                                    {folder.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-3">Drag and drop files here, or click to select</p>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block"
                        >
                            Choose Files
                        </label>
                    </div>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-medium text-gray-900">Selected Files</h3>
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
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
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Created Folders */}
                {templateData.folders.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-medium text-gray-900">Template Folders</h3>
                        {templateData.folders.map(folder => (
                            <div key={folder.folder_id} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg">
                                <FolderPlus className="w-4 h-4 text-gray-400 mr-2" />
                                <div>
                                    <div className="font-medium text-gray-900">{folder.name}</div>
                                    {folder.description && (
                                        <div className="text-sm text-gray-600">{folder.description}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                            Create New Template
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Step {currentStep} of 3
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {step}
                                </div>
                                {step < 3 && (
                                    <div className={`w-16 h-1 mx-2 ${
                                        step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="mb-6">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                    <Button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Back
                    </Button>
                    <div className="flex gap-3">
                        <Button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </Button>
                        {currentStep < 3 ? (
                            <Button
                                onClick={handleNext}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSaveTemplate}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Create Template
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTemplateModal;


