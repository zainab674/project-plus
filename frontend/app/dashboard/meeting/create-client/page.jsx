"use client";

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/Button'
import { Select, SelectGroup, SelectLabel, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useUser } from '@/providers/UserProvider'
import { useDashboardFilter } from '@/providers/DashboardFilterProvider'
import { toast } from 'react-toastify'
import { createMeetingClientRequest } from '@/lib/http/meeting'
import { getProjectRequest } from '@/lib/http/project'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CreateClientMeetingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const project_id = searchParams.get('project');
    const isScheduled = searchParams.get('scheduled') === 'true';

    const { user } = useUser();
    const { selectedCase, setSelectedCase, projects: filterProjects } = useDashboardFilter();
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectTask, setSelectedTask] = useState('');
    const [selectClient, setSelectedClient] = useState('');
    const [heading, setHeading] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fetchedClients, setFetchedClients] = useState([]);

    // Get projects from DashboardFilterProvider (already loaded centrally)
    const projects = useMemo(() => {
        return filterProjects || [];
    }, [filterProjects]);

    // Handle project selection - sync with top navigation and fetch clients
    const handleProjectSelect = useCallback((projectId) => {
        const projectIdNum = parseInt(projectId, 10);
        const project = projects.find(p => p.project_id === projectIdNum || p.project_id === projectId);
        if (project) {
            setSelectedProject(project);
            setSelectedTask('');
            setHeading('');
            setSelectedClient('');
            setFetchedClients([]);
            
            // Update global selected case to sync with top navigation
            setSelectedCase(project);
            
            // Fetch clients for the selected project
            if (project.project_id) {
                getProjectRequest(project.project_id).then(res => {
                    setFetchedClients(res.data.project?.Clients || []);
                }).catch(error => {
                    console.error('Error fetching project clients:', error);
                    setFetchedClients([]);
                });
            }
        }
    }, [projects, setSelectedCase]);

    // Handle project selection from URL
    useEffect(() => {
        if (project_id && projects.length > 0) {
            const projectIdNum = parseInt(project_id, 10);
            const project = projects.find(p => p.project_id === projectIdNum || p.project_id === project_id);
            if (project) {
                setSelectedProject(project);
                setSelectedCase(project);
                
                // Fetch clients for the selected project
                getProjectRequest(project.project_id).then(res => {
                    setFetchedClients(res.data.project?.Clients || []);
                }).catch(error => {
                    console.error('Error fetching project clients:', error);
                    setFetchedClients([]);
                });
            }
        }
    }, [project_id, projects, setSelectedCase]);

    // Auto-select project if one is selected in top navigation (only when changed externally)
    useEffect(() => {
        if (selectedCase && projects.length > 0) {
            const project = projects.find(p => p.project_id === selectedCase.project_id);
            if (project && (!selectedProject || selectedProject.project_id !== project.project_id)) {
                // Don't update if we just set it ourselves (prevent loop)
                setSelectedProject(project);
                
                // Fetch clients for the selected project
                if (project.project_id) {
                    getProjectRequest(project.project_id).then(res => {
                        setFetchedClients(res.data.project?.Clients || []);
                    }).catch(error => {
                        console.error('Error fetching project clients:', error);
                        setFetchedClients([]);
                    });
                }
            }
        }
    }, [selectedCase, projects, selectedProject]);

    // Auto-populate heading from task
    useEffect(() => {
        if (selectTask && selectedProject && selectedProject.Tasks) {
            const task = selectedProject.Tasks.find(t => t.task_id === selectTask);
            if (!heading && task) {
                setHeading(task.name);
            }
        }
    }, [selectTask, selectedProject, heading]);

    // Get current project details
    const currentProject = selectedProject;
    const availableClients = fetchedClients;

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formdata = {
                heading,
                description,
                task_id: selectTask,
                isScheduled,
                client_id: selectClient
            }

            if (date && time) {
                formdata['date'] = `${date}T${time}:00Z`;
                formdata['time'] = `${date}T${time}:00Z`;
            }

            const res = await createMeetingClientRequest(formdata);
            if (!isScheduled) {
                router.push(`/meeting/${res.data.meeting.meeting_id}`)
            } else {
                toast.success(`${res.data.message} - Meeting ${isScheduled ? 'invitation' : 'link'} has been sent to the client via email.`);
                router.push('/dashboard/meeting');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false)
        }
    }, [selectTask, selectClient, heading, description, isScheduled, date, time, router]);

    // Show loading only if we're waiting for user data
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Create A New Meeting For Client
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {isScheduled 
                            ? 'Schedule a meeting with your client for later'
                            : 'Start an instant meeting with your client'
                        }
                    </p>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="project" className="text-gray-700 font-semibold">Project (Optional)</Label>
                            <Select 
                                onValueChange={(value) => handleProjectSelect(value)} 
                                value={selectedProject ? String(selectedProject.project_id) : ''}
                            >
                                <SelectTrigger className="w-full bg-white border-gray-300 text-black hover:border-gray-400">
                                    <SelectValue placeholder="Select a project (optional)" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-300">
                                    <SelectGroup>
                                        <SelectLabel className="text-gray-500">Projects ({projects.length})</SelectLabel>
                                        {projects.map((project, index) => (
                                            <SelectItem value={String(project.project_id)} key={`${project.project_id}-${index}`} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">
                                                {project?.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="task" className="text-gray-700 font-semibold">Task (Optional)</Label>
                            <Select onValueChange={(value) => setSelectedTask(value)} value={selectTask} disabled={!selectedProject}>
                                <SelectTrigger className="w-full bg-white border-gray-300 text-black hover:border-gray-400">
                                    <SelectValue placeholder={selectedProject ? "Select a task (optional)" : "Please select a project first"} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-300">
                                    <SelectGroup>
                                        <SelectLabel className="text-gray-500">Tasks</SelectLabel>
                                        {(currentProject?.Tasks || []).map((task, index) => (
                                            <SelectItem value={task.task_id.toString()} key={`${task.task_id}-${index}`} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">
                                                {task?.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="client" className="text-gray-700 font-semibold">Client (Optional)</Label>
                            <Select onValueChange={(value) => setSelectedClient(value)} value={selectClient}>
                                <SelectTrigger className="w-full bg-white border-gray-300 text-black hover:border-gray-400">
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-300">
                                    <SelectGroup>
                                        <SelectLabel className="text-gray-500">Clients</SelectLabel>
                                        {(availableClients || []).map((client, index) => (
                                            <SelectItem value={client.user.user_id.toString()} key={`${client.user.user_id}-${index}`} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">
                                                {client?.user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {(!availableClients || availableClients.length === 0) && (
                                <p className="text-sm text-gray-500 mt-1">
                                    No clients are currently associated with this project. Please invite clients to the project first.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="heading" className="text-gray-700 font-semibold">Meeting Title *</Label>
                            <Input
                                id="heading"
                                type="text"
                                name="heading"
                                placeholder="Enter meeting title"
                                required
                                value={heading}
                                onChange={(e) => setHeading(e.target.value)}
                                className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        {
                            isScheduled &&
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date" className="text-gray-700 font-semibold">Date *</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            name="date"
                                            required
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="time" className="text-gray-700 font-semibold">Time *</Label>
                                        <Input
                                            id="time"
                                            type="time"
                                            name="time"
                                            required
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </>
                        }

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-gray-700 font-semibold">Description *</Label>
                            <Textarea
                                name='description'
                                id='description'
                                placeholder="Describe the purpose of this meeting..."
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                                className="bg-white border-gray-300 text-black placeholder:text-gray-400 resize-none focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-blue-800 text-sm">
                                <strong>Note:</strong> {isScheduled 
                                    ? 'Meeting invitation will be sent to the client via email.' 
                                    : 'Meeting link will be sent to the client via email.'
                                }
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/dashboard/meeting')}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-12 bg-tbutton-bg text-tbutton-text disabled:opacity-40 hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                                disabled={isLoading || !heading || !description}
                                isLoading={isLoading}
                            >
                                {isLoading ? 'Creating...' : isScheduled ? 'Schedule Meeting' : 'Start Meeting'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

