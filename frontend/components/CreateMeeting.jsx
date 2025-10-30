import React, { useCallback, useEffect, useState, useMemo } from 'react'
import BigDialog from './Dialogs/BigDialog'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './Button'
import { Select, SelectGroup, SelectLabel, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useUser } from '@/providers/UserProvider'
import { useDashboardFilter } from '@/providers/DashboardFilterProvider'
import { toast } from 'react-toastify'
import { createMeetingRequest } from '@/lib/http/meeting'
import { getProjectRequest } from '@/lib/http/project'
import { useRouter } from 'next/navigation'

const CreateMeeting = ({ open, onClose, isScheduled, getMeetings, project_id = null }) => {
    const { user } = useUser();
    const { selectedCase, setSelectedCase, projects: filterProjects } = useDashboardFilter();
    const [selectProject, setSelectedProject] = useState(project_id || '');
    const [selectTask, setSelectedTask] = useState('');
    const [heading, setHeading] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [specificProject, setSpecificProject] = useState(null);

    // Fetch specific project when project_id is provided
    useEffect(() => {
        if (project_id && !specificProject) {
            getProjectRequest(project_id).then(res => {
                setSpecificProject(res.data.project);
            }).catch(error => {
                console.error('CreateMeeting - Error fetching specific project:', error);
            });
        }
    }, [project_id]);

    // Get projects from DashboardFilterProvider (already loaded centrally)
    const projects = useMemo(() => {
        if (specificProject) {
            return [specificProject];
        }
        
        // Use projects from DashboardFilterProvider instead of user.Projects
        return filterProjects || [];
    }, [filterProjects, specificProject]);

    // Auto-select project from top navigation if one is selected globally
    useEffect(() => {
        if (open && selectedCase && !selectProject && !specificProject) {
            const project = projects.find(p => p.project_id === selectedCase.project_id);
            if (project) {
                setSelectedProject(project.project_id);
            }
        }
    }, [open, selectedCase, projects, specificProject, selectProject]);

    const router = useRouter();

    // Update selected project when project_id prop changes
    useEffect(() => {
        if (project_id) {
            setSelectedProject(project_id);
        }
    }, [project_id]);

    // Reset task selection when project changes and sync with top navigation
    useEffect(() => {
        setSelectedTask('');
        setHeading('');
        
        // Update global selected case when project changes
        if (selectProject && projects.length > 0) {
            const project = projects.find(p => p.project_id === selectProject);
            if (project) {
                setSelectedCase(project);
            }
        }
    }, [selectProject, projects, setSelectedCase]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formdata = {
                heading,
                description,
                task_id: selectTask,
                isScheduled,
            }

            if (date && time) {
                formdata['date'] = `${date}T${time}:00Z`;
                formdata['time'] = `${date}T${time}:00Z`;
            }

            const res = await createMeetingRequest(formdata);
            if (!isScheduled) {
                router.push(`/meeting/${res.data.meeting.meeting_id}`)
            }
            toast.success(`${res.data.message} - Meeting links have been sent to all team members via email.`);
            await getMeetings()
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false)
        }
    }, [heading, description, selectTask, date, time, isScheduled]);

    useEffect(() => {
        if (selectTask && selectProject && projects.length > 0) {
            const project = projects.find(p => p?.project_id == selectProject);
            const task = project?.Tasks?.find(t => t.task_id == selectTask);
            if (!heading && task) {
                setHeading(task.name);
            }
        }
    }, [selectTask, selectProject, heading, projects]);

    // Get current project details
    const currentProject = projects.find(project => project?.project_id == selectProject);

    // Show loading only if we're waiting for user data
    if (!user) {
        return (
            <BigDialog open={open} onClose={onClose}>
                <div className='px-2 py-3'>
                    <div className="w-full px-10 space-y-6 mt-5">
                        <h1 className="text-3xl font-semibold text-black text-center">Create A New Meeting</h1>
                        <div className="flex items-center justify-center h-32">
                            <p className="text-gray-500">Loading...</p>
                        </div>
                    </div>
                </div>
            </BigDialog>
        );
    }

    return (
        <BigDialog open={open} onClose={onClose}>
            <div className='px-2 py-3'>
                <div className="w-full px-10 space-y-6 mt-5">
                    <h1 className="text-3xl font-semibold text-black text-center">Create A New Meeting</h1>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <Label htmlFor="project" className="text-black">Project (Optional)</Label>
                            <Select 
                                onValueChange={(value) => setSelectedProject(value)} 
                                value={selectProject || ''}
                            >
                                <SelectTrigger className="w-full bg-white border-primary text-black">
                                    <SelectValue placeholder="Select a project (optional)" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-primary z-[9999]">
                                    <SelectGroup>
                                        <SelectLabel className="text-gray-400">Projects ({projects.length})</SelectLabel>
                                        {projects.map((project, index) => (
                                            <SelectItem value={`${project.project_id}`} key={`${project.project_id}-${index}`} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">
                                                {project?.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="task" className="text-black">Task (Optional)</Label>
                            <Select onValueChange={(value) => setSelectedTask(value)} value={selectTask} disabled={!selectProject}>
                                <SelectTrigger className="w-full bg-white border-primary text-black">
                                    <SelectValue placeholder={selectProject ? "Select a task (optional)" : "Please select a project first"} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-primary z-[9999]">
                                    <SelectGroup>
                                        <SelectLabel className="text-gray-400">Tasks</SelectLabel>
                                        {(currentProject?.Tasks || []).map((task, index) => (
                                            <SelectItem value={`${task.task_id}`} key={`${task.task_id}-${index}`} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">
                                                {task?.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="heading" className="text-black">Heading</Label>
                            <Input
                                id="heading"
                                type="text"
                                name="heading"
                                placeholder="Heading"
                                required
                                value={heading}
                                onChange={(e) => setHeading(e.target.value)}
                                className="bg-white border-primary text-black placeholder:text-gray-400"
                            />
                        </div>

                        {
                            isScheduled &&
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="date" className="text-black">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        name="date"
                                        placeholder="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-white border-primary text-black placeholder:text-gray-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="time" className="text-black">Time</Label>
                                    <Input
                                        id="time"
                                        type="time"
                                        name="time"
                                        placeholder="time"
                                        required
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="bg-white border-primary text-black placeholder:text-gray-400"
                                    />
                                </div>
                            </>
                        }

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-black">Describtion</Label>
                            <Textarea
                                name='description'
                                id='description'
                                placeholder="add description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-white border-primary text-black placeholder:text-gray-400 resize-none"
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-blue-800 text-sm">
                                <strong>Note:</strong> {isScheduled 
                                    ? 'Meeting invitations will be sent to all team members via email.' 
                                    : 'Meeting links will be sent to all team members via email.'
                                }
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-tbutton-bg text-tbutton-text disabled:opacity-40 hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                            disabled={isLoading || !heading || !description}
                            isLoading={isLoading}
                        >
                            Create Now
                        </Button>
                    </form>
                </div>
            </div>
        </BigDialog>
    )
}

export default CreateMeeting
