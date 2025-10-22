"use client"

import React, { useState } from 'react';
import { X, Calendar, FileText, Users, Clock, FolderOpen, Download, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../Button';

const TemplatePreviewModal = ({ template, onClose }) => {
    const [expandedPhases, setExpandedPhases] = useState({});

    const togglePhase = (phaseId) => {
        setExpandedPhases(prev => ({
            ...prev,
            [phaseId]: !prev[phaseId]
        }));
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-800 border-red-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'Real Estate': return 'bg-green-100 text-green-800';
            case 'Personal Injury': return 'bg-red-100 text-red-800';
            case 'Business Law': return 'bg-blue-100 text-blue-800';
            case 'Criminal Law': return 'bg-purple-100 text-purple-800';
            case 'Family Law': return 'bg-pink-100 text-pink-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                            Template Preview: {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Review template details before using
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Template Overview */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{template.name}</h2>
                                <p className="text-gray-700 mb-4">{template.description}</p>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(template.category)}`}>
                                        {template.category}
                                    </span>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(template.default_priority)}`}>
                                        {template.default_priority} Priority
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-600">Created</div>
                                <div className="font-medium text-gray-900">
                                    {new Date(template.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {/* Template Stats */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                                <div className="flex items-center justify-center mb-1">
                                    <Calendar className="w-4 h-4 text-blue-600 mr-1" />
                                    <span className="text-sm font-medium text-gray-700">Phases</span>
                                </div>
                                <div className="text-xl font-bold text-gray-900">{template.phases_count}</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                                <div className="flex items-center justify-center mb-1">
                                    <FileText className="w-4 h-4 text-green-600 mr-1" />
                                    <span className="text-sm font-medium text-gray-700">Documents</span>
                                </div>
                                <div className="text-xl font-bold text-gray-900">{template.documents_count}</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                                <div className="flex items-center justify-center mb-1">
                                    <Users className="w-4 h-4 text-purple-600 mr-1" />
                                    <span className="text-sm font-medium text-gray-700">Used</span>
                                </div>
                                <div className="text-xl font-bold text-gray-900">{template.usage_count}</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                                <div className="flex items-center justify-center mb-1">
                                    <Clock className="w-4 h-4 text-orange-600 mr-1" />
                                    <span className="text-sm font-medium text-gray-700">Duration</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">{template.estimated_duration}</div>
                            </div>
                        </div>
                    </div>

                    {/* Phases Section */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                            Template Phases
                        </h3>
                        <div className="space-y-3">
                            {template.phases.map((phase, index) => (
                                <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                                        {phase.order}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{phase.name}</div>
                                        {phase.description && (
                                            <div className="text-sm text-gray-600 mt-1">{phase.description}</div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">Estimated</div>
                                        <div className="font-medium text-gray-900">{phase.estimated_days} days</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Documents Section */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-green-600" />
                            Template Documents
                        </h3>
                        
                        {/* Document Summary */}
                        {template.phases && template.phases.length > 0 && (
                            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                                    Document Summary by Phase
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {template.phases.map((phase) => {
                                        const phaseFolders = template.folders?.filter(folder => folder.phase_id === phase.phase_id) || [];
                                        const totalDocuments = phaseFolders.reduce((total, folder) => total + (folder.files?.length || 0), 0);
                                        return (
                                            <div key={phase.phase_id} className="bg-white p-3 rounded-lg border border-blue-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{phase.name}</div>
                                                        <div className="text-sm text-gray-600">{phaseFolders.length} folder{phaseFolders.length !== 1 ? 's' : ''}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-blue-600">{totalDocuments}</div>
                                                        <div className="text-xs text-gray-500">documents</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Real template documents organized by phases */}
                        <div className="space-y-4">
                            {/* Group folders by phases */}
                            {template.phases && template.phases.length > 0 ? (
                                template.phases.map((phase, phaseIndex) => {
                                    const phaseFolders = template.folders?.filter(folder => folder.phase_id === phase.phase_id) || [];
                                    const foldersWithoutPhase = template.folders?.filter(folder => !folder.phase_id) || [];
                                    
                                    return (
                                        <div key={phaseIndex} className="space-y-3">
                                            {/* Phase Header */}
                                            <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => togglePhase(phase.phase_id)}>
                                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                                    {phase.order}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900">{phase.name}</h4>
                                                    {phase.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-sm text-gray-500">
                                                        {phaseFolders.length} folder{phaseFolders.length !== 1 ? 's' : ''}
                                                        {phaseFolders.length > 0 && (
                                                            <span className="ml-2">
                                                                • {phaseFolders.reduce((total, folder) => total + (folder.files?.length || 0), 0)} document{phaseFolders.reduce((total, folder) => total + (folder.files?.length || 0), 0) !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {expandedPhases[phase.phase_id] ? (
                                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Folders for this phase */}
                                            {expandedPhases[phase.phase_id] && (
                                                <div className="space-y-3">
                                                    {phaseFolders.length > 0 ? (
                                                        phaseFolders.map((folder, folderIndex) => (
                                                    <div key={folderIndex} className="p-4 bg-gray-50 rounded-lg border border-gray-200 ml-4">
                                                        <div className="flex items-center mb-2">
                                                            <FolderOpen className="w-4 h-4 text-gray-500 mr-2" />
                                                            <span className="font-medium text-gray-900">{folder.name}</span>
                                                            {folder.description && (
                                                                <span className="text-sm text-gray-500 ml-2">- {folder.description}</span>
                                                            )}
                                                        </div>
                                                        {folder.files && folder.files.length > 0 ? (
                                                            <div className="ml-6 space-y-1">
                                                                {folder.files.map((file, fileIndex) => (
                                                                    <div key={fileIndex} className="flex items-center text-sm text-gray-600">
                                                                        <FileText className="w-3 h-3 mr-2" />
                                                                        <span>{file.name}</span>
                                                                        {file.file_size && (
                                                                            <span className="text-xs text-gray-400 ml-2">
                                                                                ({Math.round(file.file_size / 1024)} KB)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="ml-6 text-sm text-gray-400 italic">No files in this folder</div>
                                                        )}
                                                        
                                                        {/* Render subfolders recursively */}
                                                        {folder.subfolders && folder.subfolders.length > 0 && (
                                                            <div className="ml-6 mt-2 space-y-2">
                                                                {folder.subfolders.map((subfolder, subIndex) => (
                                                                    <div key={subIndex} className="p-3 bg-white rounded border border-gray-200">
                                                                        <div className="flex items-center mb-1">
                                                                            <FolderOpen className="w-3 h-3 text-gray-400 mr-2" />
                                                                            <span className="text-sm font-medium text-gray-800">{subfolder.name}</span>
                                                                            {subfolder.description && (
                                                                                <span className="text-xs text-gray-500 ml-1">- {subfolder.description}</span>
                                                                            )}
                                                                        </div>
                                                                        {subfolder.files && subfolder.files.length > 0 ? (
                                                                            <div className="ml-5 space-y-1">
                                                                                {subfolder.files.map((file, fileIndex) => (
                                                                                    <div key={fileIndex} className="flex items-center text-xs text-gray-600">
                                                                                        <FileText className="w-2 h-2 mr-1" />
                                                                                        <span>{file.name}</span>
                                                                                        {file.file_size && (
                                                                                            <span className="text-xs text-gray-400 ml-1">
                                                                                                ({Math.round(file.file_size / 1024)} KB)
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="ml-5 text-xs text-gray-400 italic">No files</div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                                    ) : (
                                                        <div className="ml-4 text-sm text-gray-400 italic">No folders assigned to this phase</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : null}

                            {/* Folders without phase assignment */}
                            {template.folders && template.folders.some(folder => !folder.phase_id) && (
                                <div className="space-y-3">
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                            ?
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">General Documents</h4>
                                            <p className="text-sm text-gray-600 mt-1">Documents not assigned to specific phases</p>
                                        </div>
                                    </div>
                                    
                                    {template.folders.filter(folder => !folder.phase_id).map((folder, folderIndex) => (
                                        <div key={folderIndex} className="p-4 bg-gray-50 rounded-lg border border-gray-200 ml-4">
                                            <div className="flex items-center mb-2">
                                                <FolderOpen className="w-4 h-4 text-gray-500 mr-2" />
                                                <span className="font-medium text-gray-900">{folder.name}</span>
                                                {folder.description && (
                                                    <span className="text-sm text-gray-500 ml-2">- {folder.description}</span>
                                                )}
                                            </div>
                                            {folder.files && folder.files.length > 0 ? (
                                                <div className="ml-6 space-y-1">
                                                    {folder.files.map((file, fileIndex) => (
                                                        <div key={fileIndex} className="flex items-center text-sm text-gray-600">
                                                            <FileText className="w-3 h-3 mr-2" />
                                                            <span>{file.name}</span>
                                                            {file.file_size && (
                                                                <span className="text-xs text-gray-400 ml-2">
                                                                    ({Math.round(file.file_size / 1024)} KB)
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="ml-6 text-sm text-gray-400 italic">No files in this folder</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Render root files (files not in folders) */}
                            {template.files && template.files.length > 0 && (
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center mb-2">
                                        <FileText className="w-4 h-4 text-gray-500 mr-2" />
                                        <span className="font-medium text-gray-900">Root Files</span>
                                    </div>
                                    <div className="ml-6 space-y-1">
                                        {template.files.map((file, fileIndex) => (
                                            <div key={fileIndex} className="flex items-center text-sm text-gray-600">
                                                <FileText className="w-3 h-3 mr-2" />
                                                <span>{file.name}</span>
                                                {file.file_size && (
                                                    <span className="text-xs text-gray-400 ml-2">
                                                        ({Math.round(file.file_size / 1024)} KB)
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Show message if no documents at all */}
                            {(!template.folders || template.folders.length === 0) && 
                             (!template.files || template.files.length === 0) && (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No documents in this template</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Usage Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-purple-600" />
                            Usage Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Total Cases Created</div>
                                <div className="text-2xl font-bold text-gray-900">{template.usage_count}</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Last Used</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {template.usage_count > 0 ? '2 days ago' : 'Never'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                    <Button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Close Preview
                    </Button>
                    <Button
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Use This Template
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TemplatePreviewModal;



