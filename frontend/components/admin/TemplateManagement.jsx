"use client"

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, FolderOpen, FileText, Users, Calendar, Search, Filter } from 'lucide-react';
import { Button } from '../Button';
import CreateTemplateModal from './CreateTemplateModal';
import EditTemplateModal from './EditTemplateModal';
import TemplatePreviewModal from './TemplatePreviewModal';
import { 
    getAllCaseTemplatesRequest, 
    createCaseTemplateRequest, 
    updateCaseTemplateRequest, 
    deleteCaseTemplateRequest 
} from '@/lib/http/caseTemplate';
import { toast } from 'react-toastify';

const TemplateManagement = () => {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');


    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const response = await getAllCaseTemplatesRequest();
            if (response.data.success) {
                setTemplates(response.data.templates);
            } else {
                toast.error('Failed to fetch templates');
                setTemplates([]);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to fetch templates');
            setTemplates([]);
        } finally {
            setIsLoading(false);
        }
    };

    const categories = ['all', 'Real Estate', 'Personal Injury', 'Business Law', 'Criminal Law', 'Family Law'];

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            template.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const handleEditTemplate = (template) => {
        setSelectedTemplate(template);
        setShowEditModal(true);
    };

    const handlePreviewTemplate = (template) => {
        setSelectedTemplate(template);
        setShowPreviewModal(true);
    };

    const handleDeleteTemplate = async (templateId) => {
        if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
            try {
                const response = await deleteCaseTemplateRequest(templateId);
                if (response.data.success) {
                    setTemplates(prev => prev.filter(t => t.template_id !== templateId));
                    toast.success('Template deleted successfully');
                } else {
                    toast.error('Failed to delete template');
                }
            } catch (error) {
                console.error('Error deleting template:', error);
                toast.error('Failed to delete template');
            }
        }
    };

    const handleCreateTemplate = async (formData) => {
        try {
            const response = await createCaseTemplateRequest(formData);
            if (response.data.success) {
                setTemplates(prev => [...prev, response.data.template]);
                setShowCreateModal(false);
                toast.success('Template created successfully');
            } else {
                toast.error('Failed to create template');
            }
        } catch (error) {
            console.error('Error creating template:', error);
            toast.error('Failed to create template');
        }
    };

    const handleUpdateTemplate = async (formData) => {
        try {
            const response = await updateCaseTemplateRequest(selectedTemplate.template_id, formData);
            if (response.data.success) {
                setTemplates(prev => prev.map(t => 
                    t.template_id === selectedTemplate.template_id ? response.data.template : t
                ));
                setShowEditModal(false);
                setSelectedTemplate(null);
                toast.success('Template updated successfully');
            } else {
                toast.error('Failed to update template');
            }
        } catch (error) {
            console.error('Error updating template:', error);
            toast.error('Failed to update template');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading templates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Case Template Management</h1>
                            <p className="text-gray-600 mt-1">Create and manage case templates for your team</p>
                        </div>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-medium flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Template
                        </Button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category === 'all' ? 'All Categories' : category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Templates Grid */}
                {filteredTemplates.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <FileText className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                        <p className="text-gray-600 mb-6">
                            {searchTerm || filterCategory !== 'all' 
                                ? 'Try adjusting your search or filter criteria'
                                : 'Get started by creating your first case template'
                            }
                        </p>
                        {!searchTerm && filterCategory === 'all' && (
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create First Template
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map(template => (
                            <div key={template.template_id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    {/* Template Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                                {template.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {template.description}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    template.category === 'Real Estate' ? 'bg-green-100 text-green-800' :
                                                    template.category === 'Personal Injury' ? 'bg-red-100 text-red-800' :
                                                    template.category === 'Business Law' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {template.category}
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    template.default_priority === 'High' ? 'bg-red-100 text-red-800' :
                                                    template.default_priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {template.default_priority} Priority
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Template Stats */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-center mb-1">
                                                <Calendar className="w-4 h-4 text-blue-600 mr-1" />
                                                <span className="text-sm font-medium text-gray-700">Phases</span>
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {template.phases_count}
                                            </div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-center mb-1">
                                                <FileText className="w-4 h-4 text-green-600 mr-1" />
                                                <span className="text-sm font-medium text-gray-700">Documents</span>
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {template.documents_count}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Usage Stats */}
                                    <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <Users className="w-4 h-4 mr-1" />
                                            <span>{template.usage_count} cases used</span>
                                        </div>
                                        <span>{template.estimated_duration}</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => handlePreviewTemplate(template)}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 text-sm"
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            Preview
                                        </Button>
                                        <Button
                                            onClick={() => handleEditTemplate(template)}
                                            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 text-sm"
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteTemplate(template.template_id)}
                                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 text-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateTemplateModal
                    onClose={() => setShowCreateModal(false)}
                    onCreateTemplate={handleCreateTemplate}
                />
            )}

            {showEditModal && selectedTemplate && (
                <EditTemplateModal
                    template={selectedTemplate}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedTemplate(null);
                    }}
                    onUpdateTemplate={handleUpdateTemplate}
                />
            )}

            {showPreviewModal && selectedTemplate && (
                <TemplatePreviewModal
                    template={selectedTemplate}
                    onClose={() => {
                        setShowPreviewModal(false);
                        setSelectedTemplate(null);
                    }}
                />
            )}
        </div>
    );
};

export default TemplateManagement;



