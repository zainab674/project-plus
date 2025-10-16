

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarIcon, ChartNoAxesColumnIncreasing, ChevronDownIcon, FileIcon, Menu, TypeOutline, User2, UserCircle, Users, UsersIcon, X, Layers, Upload, Paperclip } from 'lucide-react'
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
import { createTaskRequest } from '@/lib/http/task'
import dynamic from 'next/dynamic'
import { useUser } from '@/providers/UserProvider'
import { Textarea } from '../ui/textarea'
const JoditEditor = dynamic(
    () => import('jodit-react'),
    { ssr: false }
)


const CreateTask = ({ project, onClose, prefillData = {} }) => {
    const [selectedMember, setSelectedMember] = useState([]);
    const [isDisabled, setIsDiabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const { loadUser } = useUser()
    const [formdata, setFormdata] = useState({
        project_id: project?.project_id,
        name: "New Task",
        description: "",
        assigned_to: -1,
        priority: "NONE",
        last_date: "",
        otherMember: [],
        status: "TO_DO",
        phase: ""
    });

    // Check if project has phases
    const hasPhases = useMemo(() => {
        return project?.phases && Array.isArray(project.phases) && project.phases.length > 0;
    }, [project]);

    useEffect(() => {
        console.log('🔍 CreateTask: Project prop received:', project);
        setFormdata(prev => ({
            ...prev,
            project_id: project?.project_id,
            name: `Task ${project?.Tasks.length + 1}`,
            phase: hasPhases ? project.phases[0] : "" // Set first phase as default if phases exist
        }));
    }, [project, hasPhases]);

    // Handle prefill data from AI assistant
    useEffect(() => {
        if (prefillData && Object.keys(prefillData).length > 0) {
            console.log('🔍 CreateTask: Received prefillData:', prefillData);
            setFormdata(prev => {
                const newFormData = {
                    ...prev,
                    ...prefillData
                };
                console.log('🔍 CreateTask: Updated formdata:', newFormData);
                return newFormData;
            });
            
            // Also set selected members if provided
            if (prefillData.otherMember && Array.isArray(prefillData.otherMember)) {
                setSelectedMember(prefillData.otherMember);
            }
        }
    }, [prefillData]);

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    const options = useMemo(() => (project?.Members?.filter(member => member.user_id != formdata.assigned_to).map(member => ({
        value: member?.user?.user_id, label: member?.user?.name, icon: (props) => <AvatarCompoment name={member?.user?.name} {...props} />
    }))), [project, formdata]);

    const handleCreate = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log('🔍 CreateTask: Creating task with data:', { formdata, selectedMember, project, selectedFile });
            
            // Create FormData for file upload
            const formData = new FormData();
            
            // Add all task data fields
            formData.append('project_id', parseInt(project.project_id));
            formData.append('name', formdata.name);
            formData.append('description', formdata.description || '');
            formData.append('assigned_to', parseInt(formdata.assigned_to) || -1);
            formData.append('priority', formdata.priority);
            formData.append('status', formdata.status);
            formData.append('phase', formdata.phase || '');
            formData.append('last_date', formdata.last_date ? formdata.last_date + 'T00:00:00Z' : '');
            
            // Add other members as array (convert to numbers)
            const otherMemberNumbers = selectedMember.map(id => parseInt(id));
            formData.append('otherMember', JSON.stringify(otherMemberNumbers));
            
            // Add file if selected
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            console.log('🔍 CreateTask: Final form data:', {
                project_id: project.project_id,
                name: formdata.name,
                priority: formdata.priority,
                phase: formdata.phase,
                status: formdata.status,
                assigned_to: formdata.assigned_to,
                description: formdata.description,
                hasFile: !!selectedFile,
                fileName: selectedFile?.name
            });

            const res = await createTaskRequest(formData);
            setSelectedMember([]);
            setSelectedFile(null);
            setFormdata({
                project_id: project?.project_id,
                name: "New Task",
                description: "",
                assigned_to: -1,
                priority: "NONE",
                last_date: "",
                otherMember: [],
                status: "TO_DO",
                phase: hasPhases ? project.phases[0] : ""
            });
            toast.success(res?.data?.message);

            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false)
        }
    }, [selectedMember, formdata, project, hasPhases, selectedFile]);

    const config = useMemo(() => ({
        placeholder: "Add description",
    }), []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl border border-gray-200 m-4">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className='text-black text-3xl font-semibold'>{formdata.name}</h1>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>
            <div className="grid gap-6 py-4 px-4">
                <div className="grid grid-cols-[auto,1fr] gap-6 items-center">
                    <div className='flex items-center gap-2 w-[6rem]'>
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
                        <div className='flex items-center gap-2 w-[6rem]'>
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
                    <div className='flex items-center gap-2 w-[6rem]'>
                        <Menu className="h-5 w-5 text-black" />
                        <span className='text-black text-sm font-medium'>Priority</span>
                    </div>
                    <Select onValueChange={(value) => setFormdata(prev => ({ ...prev, priority: value }))}>
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
                    <div className='flex items-center gap-2 w-[6rem]'>
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
                    <div className='flex items-center gap-2 w-[6rem]'>
                        <UserCircle className="h-5 w-5 text-black" />
                        <span className='text-black text-sm font-medium'>Leader</span>
                    </div>
                    <Select onValueChange={(value) => setFormdata(prev => ({ ...prev, assigned_to: value }))}>
                        <SelectTrigger className="focus-visible:ring-0 focus-visible:ring-transparent outline-none bg-white border-primary text-black">
                            <SelectValue placeholder="Task Leader" />
                        </SelectTrigger>
                        <SelectContent className="focus-visible:ring-0 focus-visible:ring-transparent bg-white border-primary">
                            {
                                project?.Members?.map(member => (
                                    <SelectItem value={member?.user?.user_id} key={member?.user?.user_id}>
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
                    <div className="flex items-center gap-2 w-[6rem]">
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
                    <div className='flex items-center gap-2 w-[6rem]'>
                        <ChartNoAxesColumnIncreasing className="h-5 w-5 text-black" />
                        <span className='text-black text-sm font-medium'>Status</span>
                    </div>
                    <Select onValueChange={(value) => setFormdata(prev => ({ ...prev, status: value }))}>
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
                    <div className='flex items-center gap-2 w-[6rem]'>
                        <TypeOutline className="h-5 w-5 text-black" />
                        <span className='text-black text-sm font-medium'>Description</span>
                    </div>
                    <div className="border border-primary rounded-md">
                        <Textarea placeholder="Description"
                            onChange={(e) => setFormdata(prev => ({ ...prev, description: e.target.value }))}
                            value={formdata.description} >
                        </Textarea>
                    </div>
                </div>

                {/* File Attachment */}
                <div className="grid grid-cols-[auto,1fr] gap-5 items-center">
                    <div className='flex items-center gap-2 w-[6rem]'>
                        <Paperclip className="h-5 w-5 text-black" />
                        <span className='text-black text-sm font-medium'>Attachment</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                id="file-upload-create"
                                onChange={handleFileSelect}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.ppt,.pptx"
                            />
                            <label
                                htmlFor="file-upload-create"
                                className="flex items-center gap-2 px-4 py-2 border border-primary rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <Upload className="h-4 w-4 text-gray-600" />
                                <span className="text-sm text-gray-700">Choose File</span>
                            </label>
                            {selectedFile && (
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        {selectedFile && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FileIcon className="h-4 w-4" />
                                <span>{selectedFile.name}</span>
                                <span className="text-gray-400">
                                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                            </div>
                        )}
                        <p className="text-xs text-gray-500">
                            Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, XLSX, XLS, PPT, PPTX (Max 10MB)
                        </p>
                    </div>
                </div>

            </div>
            <div className="flex justify-end space-x-2 px-6 py-4 border-t border-gray-200">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="text-black "
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                    disabled={isLoading || isDisabled}
                    onClick={handleCreate}
                    isLoading={isLoading}
                >
                    Create Task
                </Button>
            </div>
        </div>
        </div>
    )
}

export default CreateTask