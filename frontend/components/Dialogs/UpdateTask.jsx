



import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarIcon, ChartNoAxesColumnIncreasing, ChevronDownIcon, FileIcon, Menu, TypeOutline, User2, UserCircle, Users, UsersIcon, X, Layers } from 'lucide-react'
import { Button } from "@/components/Button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { getNameAvatar } from '@/utils/getNameAvatar'
import MultiSelect from "@/components/ui/multi-select";
import AvatarCompoment from '../AvatarCompoment'
import { toast } from 'react-toastify'
import { updateTaskRequest } from '@/lib/http/task'
import dynamic from 'next/dynamic'
import { useUser } from '@/providers/UserProvider'
import { Textarea } from '@headlessui/react'
import BigDialog from './BigDialog'
const JoditEditor = dynamic(
    () => import('jodit-react'),
    { ssr: false }
)


const UpdateTask = ({ project, task, onClose, isOpen, getProjectDetails }) => {
    console.log("heelo", task)
    const [selectedMember, setSelectedMember] = useState([]);
    const [isDisabled, setIsDiabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { loadUser } = useUser()
    const [formdata, setFormdata] = useState({
        task_id: task?.task_id,
        project_id: project?.project_id,
        name: task?.name || "New Task",
        description: task?.description || "",
        assigned_to: task?.assigned_to || -1,
        priority: task?.priority || "NONE",
        last_date: task?.last_date ? task.last_date.split('T')[0] : "",
        otherMember: [],
        status: task?.status || "TO_DO",
        phase: task?.phase || ""
    });

    // if (!isOpen || !task) return null;
    // Check if project has phases
    const hasPhases = useMemo(() => {
        return project?.phases && Array.isArray(project.phases) && project.phases.length > 0;
    }, [project]);

    // Initialize form data and selected members when task changes
    useEffect(() => {
        if (task) {
            setFormdata({
                task_id: task.task_id,
                project_id: project?.project_id,
                name: task.name || "New Task",
                description: task.description || "",
                assigned_to: task.assigned_to || -1,
                priority: task.priority || "NONE",
                last_date: task.last_date ? task.last_date.split('T')[0] : "",
                otherMember: [],
                status: task.status || "TO_DO",
                phase: task.phase || (hasPhases ? project.phases[0] : "")
            });

            // Set selected members (other members assigned to task)
            const otherMembers = task.otherMember || task.TaskMembers || [];
            setSelectedMember(otherMembers.map(member =>
                member.user_id || member.user?.user_id
            ));
        }
    }, [task, project, hasPhases]);

    const options = useMemo(() => (project?.Members?.filter(member => member.user_id != formdata.assigned_to).map(member => ({
        value: member?.user?.user_id, label: member?.user?.name, icon: (props) => <AvatarCompoment name={member?.user?.name} {...props} />
    }))), [project, formdata]);

    const handleUpdate = useCallback(async () => {
        setIsLoading(true);
        try {
            const updateData = {
                ...formdata,
                otherMember: selectedMember,
                project_id: project.project_id,
                last_date: formdata.last_date + 'T00:00:00Z'
            };

            const res = await updateTaskRequest(updateData, task.task_id,);

            toast.success(res?.data?.message || "Task updated successfully");
            loadUser();
            await getProjectDetails(project.project_id);
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false)
        }
    }, [selectedMember, formdata, project, task]);

    // Button disabled logic
    useEffect(() => {
        if (!formdata.name || formdata.assigned_to == -1 || !formdata.description || !formdata.last_date) {
            setIsDiabled(true);
            return
        }
        setIsDiabled(false);
    }, [JSON.stringify(formdata), selectedMember]);

    const config = useMemo(() => ({
        placeholder: "Add description",
    }), []);

    return (
        <BigDialog open={isOpen} onClose={onClose} width={70}>

            <div className="w-full">
                <div className="flex flex-row items-center justify-between pb-2">
                    <h1 className='text-black text-3xl font-semibold'>Update Task</h1>
                </div>
                <div className="grid gap-5 py-4 px-2">
                    <div className="grid grid-cols-[auto,1fr] gap-5 items-center">
                        <div className='flex items-center gap-2 w-[8rem]'>
                            <User2 className="h-5 w-5 text-black" />
                            <span className='text-black text-sm font-medium'>Name</span>
                        </div>
                        <Input
                            type="text"
                            className="w-full focus-visible:ring-0 focus-visible:ring-transparent bg-white border-primary text-black"
                            onChange={(e) => setFormdata(prev => ({ ...prev, name: e.target.value }))}
                            value={formdata.name}
                        />
                    </div>

                    {/* Phase Dropdown - Only show if project has phases */}
                    {hasPhases && (
                        <div className="grid grid-cols-[auto,1fr] gap-5 items-center">
                            <div className='flex items-center gap-2 w-[8rem]'>
                                <Layers className="h-5 w-5 text-black" />
                                <span className='text-black text-sm font-medium'>Phase</span>
                            </div>
                            <Select
                                value={formdata.phase}
                                onValueChange={(value) => setFormdata(prev => ({ ...prev, phase: value }))}
                            >
                                <SelectTrigger className="focus-visible:ring-0 focus-visible:ring-transparent outline-none bg-white border-primary text-black">
                                    <SelectValue placeholder="Select Phase" />
                                </SelectTrigger>
                                <SelectContent className="focus-visible:ring-0 focus-visible:ring-transparent bg-white border-primary">
                                    {project.phases.map((phase, index) => (
                                        <SelectItem key={index} value={phase}>
                                            <div className='flex items-center gap-4'>
                                                <span className='w-[1.4rem] h-[1.4rem] bg-purple-400 rounded-full'></span>
                                                <span className='text-black'>{phase}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-[auto,1fr] gap-5 items-center">
                        <div className='flex items-center gap-2 w-[8rem]'>
                            <Menu className="h-5 w-5 text-black" />
                            <span className='text-black text-sm font-medium'>Priority</span>
                        </div>
                        <Select value={formdata.priority} onValueChange={(value) => setFormdata(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger className="focus-visible:ring-0 focus-visible:ring-transparent outline-none bg-white border-primary text-black">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent className="focus-visible:ring-0 focus-visible:ring-transparent bg-white border-primary">
                                <SelectItem value="CRITICAL">
                                    <div className='flex items-center gap-4'>
                                        <span className='w-[1.4rem] h-[1.4rem] bg-red-950 rounded-full'></span>
                                        <span className='text-black'>Critical</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="HIGH">
                                    <div className='flex items-center gap-4'>
                                        <span className='w-[1.4rem] h-[1.4rem] bg-orange-700 rounded-full'></span>
                                        <span className='text-black'>High</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="MEDIUM">
                                    <div className='flex items-center gap-4'>
                                        <span className='w-[1.4rem] h-[1.4rem] bg-yellow-700 rounded-full'></span>
                                        <span className='text-black'>Medium</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="LOW">
                                    <div className='flex items-center gap-4'>
                                        <span className='w-[1.4rem] h-[1.4rem] bg-green-700 rounded-full'></span>
                                        <span className='text-black'>Low</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="NONE">
                                    <div className='flex items-center gap-4'>
                                        <span className='w-[1.4rem] h-[1.4rem] bg-blue-300 rounded-full'></span>
                                        <span className='text-black'>Very Low</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-[auto,1fr] gap-5 items-center">
                        <div className='flex items-center gap-2 w-[8rem]'>
                            <CalendarIcon className="h-5 w-5 text-black" />
                            <span className='text-black text-sm font-medium'>Last Date</span>
                        </div>
                        <Input
                            type="date"
                            className="w-full focus-visible:ring-0 focus-visible:ring-transparent bg-white border-primary text-black"
                            onChange={(e) => setFormdata(prev => ({ ...prev, last_date: e.target.value }))}
                            value={formdata.last_date}
                        />
                    </div>

                    <div className="grid grid-cols-[auto,1fr] gap-5 items-center">
                        <div className='flex items-center gap-2 w-[8rem]'>
                            <UserCircle className="h-5 w-5 text-black" />
                            <span className='text-black text-sm font-medium'>Leader</span>
                        </div>
                        <Select value={formdata.assigned_to?.toString()} onValueChange={(value) => setFormdata(prev => ({ ...prev, assigned_to: value }))}>
                            <SelectTrigger className="focus-visible:ring-0 focus-visible:ring-transparent outline-none bg-white border-primary text-black">
                                <SelectValue placeholder="Task Leader" />
                            </SelectTrigger>
                            <SelectContent className="focus-visible:ring-0 focus-visible:ring-transparent bg-white border-primary">
                                {
                                    project?.Members?.map(member => (
                                        <SelectItem value={member?.user?.user_id?.toString()} key={member?.user?.user_id}>
                                            <div className='flex items-center gap-3'>
                                                <Avatar className="w-[2rem] h-[2rem]">
                                                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                                                    <AvatarFallback className="bg-primary/10 text-black">{getNameAvatar(member?.user?.name)}</AvatarFallback>
                                                </Avatar>
                                                <span className='text-black'>{member?.user?.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-[auto,1fr] gap-5 items-center">
                        <div className="flex items-center gap-2 w-[8rem]">
                            <UsersIcon className="h-5 w-5 text-black" />
                            <span className="text-black text-sm font-medium">Members</span>
                        </div>

                        <MultiSelect
                            options={options || []}
                            className="text-black border-primary"
                            onValueChange={setSelectedMember}
                            defaultValue={selectedMember}
                            placeholder="Select Member"
                            variant="inverted"
                            animation={2}
                            maxCount={3}
                        />
                    </div>

                    <div className="grid grid-cols-[auto,1fr] gap-5 items-center">
                        <div className='flex items-center gap-2 w-[8rem]'>
                            <ChartNoAxesColumnIncreasing className="h-5 w-5 text-black" />
                            <span className='text-black text-sm font-medium'>Status</span>
                        </div>
                        <Select value={formdata.status} onValueChange={(value) => setFormdata(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger className="focus-visible:ring-0 focus-visible:ring-transparent outline-none bg-white border-primary text-black">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="focus-visible:ring-0 focus-visible:ring-transparent bg-white border-primary">
                                <SelectItem value="TO_DO">
                                    <div className='flex items-center gap-4'>
                                        <span className='w-[1.4rem] h-[1.4rem] bg-gray-400 rounded-full'></span>
                                        <span className='text-black'>TO DO</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="IN_PROGRESS">
                                    <div className='flex items-center gap-4'>
                                        <span className='w-[1.4rem] h-[1.4rem] bg-blue-400 rounded-full'></span>
                                        <span className='text-black'>IN PROGRESS</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="STUCK">
                                    <div className='flex items-center gap-4'>
                                        <span className='w-[1.4rem] h-[1.4rem] bg-yellow-400 rounded-full'></span>
                                        <span className='text-black'>STUCK</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="DONE">
                                    <div className='flex items-center gap-4'>
                                        <span className='w-[1.4rem] h-[1.4rem] bg-green-400 rounded-full'></span>
                                        <span className='text-black'>DONE</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-[auto,1fr] gap-5 items-center">
                        <div className='flex items-center gap-2 w-[8rem]'>
                            <TypeOutline className="h-5 w-5 text-black" />
                            <span className='text-black text-sm font-medium'>Description</span>
                        </div>
                        <div className="border border-primary rounded-md">
                            <Textarea
                                placeholder="Description"
                                onChange={(e) => setFormdata(prev => ({ ...prev, description: e.target.value }))}
                                value={formdata.description}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="text-black"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                        disabled={isLoading || isDisabled}
                        onClick={handleUpdate}
                        isLoading={isLoading}
                    >
                        Update Task
                    </Button>
                </div>
            </div>

        </BigDialog>
    )
}

export default UpdateTask