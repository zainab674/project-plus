"use client"

import React from 'react';
import { X, Calendar, FileText, Users, Clock, FolderOpen, Download, Eye } from 'lucide-react';
import { Button } from '../Button';

const TemplatePreviewModal = ({ template, onClose }) => {
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
                        
                        {/* Mock document structure */}
                        <div className="space-y-3">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center mb-2">
                                    <FolderOpen className="w-4 h-4 text-gray-500 mr-2" />
                                    <span className="font-medium text-gray-900">Initial Documents</span>
                                </div>
                                <div className="ml-6 space-y-1">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FileText className="w-3 h-3 mr-2" />
                                        Foreclosure Complaint Checklist.pdf
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FileText className="w-3 h-3 mr-2" />
                                        Client Intake Form.docx
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FileText className="w-3 h-3 mr-2" />
                                        Property Research Checklist.pdf
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center mb-2">
                                    <FolderOpen className="w-4 h-4 text-gray-500 mr-2" />
                                    <span className="font-medium text-gray-900">Legal Forms</span>
                                </div>
                                <div className="ml-6 space-y-1">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FileText className="w-3 h-3 mr-2" />
                                        Answer Template.docx
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FileText className="w-3 h-3 mr-2" />
                                        Motion to Dismiss Template.pdf
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FileText className="w-3 h-3 mr-2" />
                                        Discovery Request Template.docx
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center mb-2">
                                    <FolderOpen className="w-4 h-4 text-gray-500 mr-2" />
                                    <span className="font-medium text-gray-900">Settlement Documents</span>
                                </div>
                                <div className="ml-6 space-y-1">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FileText className="w-3 h-3 mr-2" />
                                        Settlement Agreement Template.docx
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FileText className="w-3 h-3 mr-2" />
                                        Release Form Template.pdf
                                    </div>
                                </div>
                            </div>
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


