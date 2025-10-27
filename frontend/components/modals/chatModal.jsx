'use client';

import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Page from '../../app/dashboard/chat/page';
import ProjectChat from '../ProjectChat';
import { useContextDetection } from '@/hooks/useContextDetection';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

const ChatModal = ({ isOpen, onClose, project }) => {
    const { 
        context, 
        getProjectDetails, 
        getTaskDetails,
        hasProject,
        hasHighConfidence 
    } = useContextDetection();
    
    const [detectedProject, setDetectedProject] = useState(null);
    const [detectedTask, setDetectedTask] = useState(null);

    // Use detected context if no project is explicitly passed
    useEffect(() => {
        if (!project && hasProject) {
            const detected = getProjectDetails();
            setDetectedProject(detected);
            
            const task = getTaskDetails();
            setDetectedTask(task);
        } else {
            setDetectedProject(project);
            setDetectedTask(null);
        }
    }, [project, hasProject, getProjectDetails, getTaskDetails]);

    const getContextBadge = () => {
        if (!context) return null;
        
        const getConfidenceIcon = () => {
            switch (context.confidence) {
                case 'high': return <CheckCircle className="w-3 h-3 text-green-600" />;
                case 'medium': return <Clock className="w-3 h-3 text-yellow-600" />;
                case 'low': return <AlertCircle className="w-3 h-3 text-red-600" />;
                default: return <AlertCircle className="w-3 h-3 text-gray-600" />;
            }
        };

        const getConfidenceColor = () => {
            switch (context.confidence) {
                case 'high': return 'bg-green-100 text-green-800 border-green-200';
                case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                case 'low': return 'bg-red-100 text-red-800 border-red-200';
                default: return 'bg-gray-100 text-gray-800 border-gray-200';
            }
        };

        return (
            <Badge className={`${getConfidenceColor()} text-xs flex items-center gap-1`}>
                {getConfidenceIcon()}
                <span>Auto-detected from {context.source}</span>
            </Badge>
        );
    };

    const getModalTitle = () => {
        if (detectedProject) {
            return `Project Chat - ${detectedProject.name}`;
        }
        return 'System Chat';
    };

    const getContextInfo = () => {
        if (!context || !detectedProject) return null;
        
        const parts = [];
        if (detectedProject.name) {
            parts.push(detectedProject.name);
        }
        if (detectedTask?.name) {
            parts.push(detectedTask.name);
        }
        
        return parts.length > 0 ? parts.join(' • ') : null;
    };
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[70]" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        {/* Modal Panel */}
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex flex-col gap-2">
                                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                                            {getModalTitle()}
                                        </Dialog.Title>
                                        {getContextInfo() && (
                                            <div className="text-sm text-gray-600">
                                                {getContextInfo()}
                                            </div>
                                        )}
                                        {getContextBadge()}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-1 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="max-h-[80vh] overflow-hidden">
                                    {detectedProject ? (
                                        <ProjectChat project={detectedProject} />
                                    ) : (
                                        <Page />
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ChatModal;

