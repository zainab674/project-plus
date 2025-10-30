'use client';

import React, { Fragment, useState, useCallback, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Info, Search } from "lucide-react";
import { Select, SelectGroup, SelectLabel, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import RenderMeeting from "@/components/RenderMeeting";
import RenderScheduleMeeting from "@/components/RenderScheduleMeeting";
import CreateMeeting from "@/components/CreateMeeting";
import CreateMeetingClient from "@/components/CreateMeetingClient";
import { getsMeetingRequest } from "@/lib/http/meeting";
import { getAllProjectRequest } from "@/lib/http/project";
import { useUser } from "@/providers/UserProvider";
import { useRouter } from "next/navigation";

const MeetingModal = ({ isOpen, onClose, selectedProject: initialSelectedProject }) => {
    const [activeTab, setActiveTab] = useState('meetings');
    const [createMeeting, setCreateMeeting] = useState(false);
    const [createMeetingClient, setCreateMeetingClient] = useState(false);
    const [meetings, setMeetings] = useState([]);
    const [scheduledMeetings, setScheduledMeetings] = useState([]);
    const [selectedProject, setSelectedProject] = useState(initialSelectedProject);
    const [projects, setProjects] = useState([]);
    const { user } = useUser();
    const router = useRouter();
    
    // Update selected project when prop changes
    useEffect(() => {
        if (initialSelectedProject !== selectedProject) {
            setSelectedProject(initialSelectedProject);
        }
    }, [initialSelectedProject]);
    
    // Fetch projects when modal opens
    const fetchProjects = useCallback(async () => {
        try {
            const res = await getAllProjectRequest();
            const { projects, collaboratedProjects } = res.data;
            setProjects([...projects, ...collaboratedProjects]);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    }, []);

    const getMeetings = useCallback(async () => {
        try {
            const res = await getsMeetingRequest(false);
            setMeetings(res.data.meetings);
        } catch (error) {
        }
    }, []);

    const getScheduledMeetings = useCallback(async () => {
        try {
            const res = await getsMeetingRequest(true);
            setScheduledMeetings(res.data.meetings);
        } catch (error) {
        }
    }, []);

    const handleMeetingDeleted = useCallback((deletedMeetingId) => {
        setMeetings(prevMeetings => 
            prevMeetings.filter(meeting => meeting.meeting_id !== deletedMeetingId)
        );
        setScheduledMeetings(prevScheduledMeetings => 
            prevScheduledMeetings.filter(meeting => meeting.meeting_id !== deletedMeetingId)
        );
    }, []);

    useEffect(() => {
        if (isOpen) {
            getMeetings();
            getScheduledMeetings();
            if (!initialSelectedProject) {
                fetchProjects();
            }
        }
    }, [isOpen, getMeetings, getScheduledMeetings, fetchProjects, initialSelectedProject]);
    
    // Filter meetings by selected project
    const filteredMeetings = selectedProject 
        ? meetings.filter(m => m.project_id === selectedProject.project_id)
        : meetings;
    
    const filteredScheduledMeetings = selectedProject
        ? scheduledMeetings.filter(m => m.project_id === selectedProject.project_id)
        : scheduledMeetings;

    return (
        <>
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[70]" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out "
                    enterFrom="opacity-0"
                    enterTo="opacity-30"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-30"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black" aria-hidden="true" />
                </Transition.Child>

                <div className="fixed inset-0">
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
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all flex flex-col max-h-[90vh]">
                                <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-gray-200">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl font-semibold text-gray-900">Meetings</h2>
                                        {!initialSelectedProject && (
                                            <Select value={selectedProject?.project_id || 'all'} onValueChange={(value) => {
                                                if (value === 'all') {
                                                    setSelectedProject(null);
                                                } else {
                                                    const project = projects.find(p => p.project_id === parseInt(value));
                                                    setSelectedProject(project);
                                                }
                                            }}>
                                                <SelectTrigger className="w-[250px]">
                                                    <SelectValue placeholder="Select a project" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Projects</SelectItem>
                                                    {projects.map(project => (
                                                        <SelectItem key={project.project_id} value={project.project_id.toString()}>
                                                            {project.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        {selectedProject && (
                                            <span className="text-sm text-gray-600">({selectedProject.name})</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6" style={{
                                    msOverflowStyle: 'none',
                                    scrollbarWidth: 'none',
                                    WebkitScrollbar: { display: 'none' }
                                }}>
                                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                            <TabsList className="bg-white border border-primary mb-6">
                                                <TabsTrigger value="meetings" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">
                                                    All Meetings
                                                </TabsTrigger>
                                                <TabsTrigger value="scheduled" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">
                                                    Scheduled Meetings
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="meetings">
                                                <div className="flex flex-col gap-4">
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-semibold text-black">All Meetings</h3>
                                                            <Info className="h-4 w-4 text-black" />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {(user?.Role === "PROVIDER" || user?.Role === "TEAM") && (
                                                                <>
                                                                    <Button className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all" onClick={() => setCreateMeeting(true)}>
                                                                        <Plus className="mr-2 h-4 w-4" />
                                                                        New Meet For Team
                                                                    </Button>
                                                                    <Button className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all" onClick={() => setCreateMeetingClient(true)}>
                                                                        <Plus className="mr-2 h-4 w-4" />
                                                                        New Meet For Client
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Meetings Content */}
                                                    {filteredMeetings.length > 0 ? (
                                                        <RenderMeeting meetings={filteredMeetings} onMeetingDeleted={handleMeetingDeleted} />
                                                    ) : (
                                                        <div className="flex flex-col h-[400px] items-center justify-center text-black gap-4">
                                                            <p>No meetings</p>
                                                            {user?.Role === "PROVIDER" && (
                                                                <Button 
                                                                    className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                                                                    onClick={() => setCreateMeeting(true)}
                                                                >
                                                                    <Plus className="mr-2 h-4 w-4" />
                                                                    Add new meeting
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="scheduled">
                                                <div className="flex flex-col gap-4">
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-semibold text-black">Scheduled Meetings</h3>
                                                            <Info className="h-4 w-4 text-black" />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {(user?.Role === "PROVIDER" || user?.Role === "TEAM") && (
                                                                <>
                                                                    <Button
                                                                        className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                                                                        onClick={() => {
                                                                            onClose();
                                                                            const projectParam = selectedProject ? `&project=${selectedProject.project_id}` : '';
                                                                            router.push(`/dashboard/meeting/create?scheduled=true${projectParam}`);
                                                                        }}
                                                                    >
                                                                        Schedule Team Meeting
                                                                    </Button>
                                                                    <Button
                                                                        className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                                                                        onClick={() => {
                                                                            onClose();
                                                                            const projectParam = selectedProject ? `&project=${selectedProject.project_id}` : '';
                                                                            router.push(`/dashboard/meeting/create-client?scheduled=true${projectParam}`);
                                                                        }}
                                                                    >
                                                                        Schedule Client Meeting
                                                                    </Button>
                                                                </>
                                                            )}
                                                            <div className="relative">
                                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-black" />
                                                                <Input
                                                                    className="w-64 pl-8 bg-white border-primary text-black placeholder:text-gray-400"
                                                                    placeholder="Search"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Scheduled Meetings Content */}
                                                    <Tabs defaultValue="pending" className="w-full">
                                                        <TabsList className="bg-white border border-primary">
                                                            <TabsTrigger value="pending" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">Pending</TabsTrigger>
                                                            <TabsTrigger value="canceled" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">Canceled</TabsTrigger>
                                                            <TabsTrigger value="scheduled" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">Scheduled</TabsTrigger>
                                                        </TabsList>

                                                        <TabsContent value="pending">
                                                            {filteredScheduledMeetings?.filter(meeting => meeting.status == "PENDING").length > 0 ? (
                                                                <RenderScheduleMeeting 
                                                                    meetings={filteredScheduledMeetings?.filter(meeting => meeting.status == "PENDING")} 
                                                                    getMeetings={getScheduledMeetings}
                                                                    onMeetingDeleted={handleMeetingDeleted}
                                                                />
                                                            ) : (
                                                                <div className="flex h-[400px] items-center justify-center text-black">
                                                                    No pending meetings
                                                                </div>
                                                            )}
                                                        </TabsContent>
                                                        <TabsContent value="canceled">
                                                            {filteredScheduledMeetings?.filter(meeting => meeting.status == "CANCELED").length > 0 ? (
                                                                <RenderScheduleMeeting 
                                                                    meetings={filteredScheduledMeetings?.filter(meeting => meeting.status == "CANCELED")} 
                                                                    getMeetings={getScheduledMeetings}
                                                                    onMeetingDeleted={handleMeetingDeleted}
                                                                />
                                                            ) : (
                                                                <div className="flex h-[400px] items-center justify-center text-black">
                                                                    No canceled meetings
                                                                </div>
                                                            )}
                                                        </TabsContent>
                                                        <TabsContent value="scheduled">
                                                            {filteredScheduledMeetings?.filter(meeting => meeting.status == "SCHEDULED").length > 0 ? (
                                                                <RenderScheduleMeeting 
                                                                    meetings={filteredScheduledMeetings?.filter(meeting => meeting.status == "SCHEDULED")} 
                                                                    getMeetings={getScheduledMeetings}
                                                                    onMeetingDeleted={handleMeetingDeleted}
                                                                />
                                                            ) : (
                                                                <div className="flex h-[400px] items-center justify-center text-black">
                                                                    No scheduled meetings
                                                                </div>
                                                            )}
                                                        </TabsContent>
                                                    </Tabs>
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>

            {/* Meeting Creation Modals */}
            <CreateMeeting open={createMeeting} onClose={() => setCreateMeeting(false)} isScheduled={false} getMeetings={getMeetings} project_id={selectedProject?.project_id || null} />
            <CreateMeetingClient open={createMeetingClient} onClose={() => setCreateMeetingClient(false)} isScheduled={false} getMeetings={getMeetings} project_id={selectedProject?.project_id || null} />
        </>
    );
};

export default MeetingModal;