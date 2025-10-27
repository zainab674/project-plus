



import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarIcon, ChartNoAxesColumnIncreasing, ChevronDownIcon, FileIcon, Menu, TypeOutline, User2, UserCircle, Users, UsersIcon, X, Layers, Eye, Paperclip, Download, Upload, Trash2, FileText } from 'lucide-react'
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
import { getMediaByTaskIdRequest, uploadMediaRequest, deleteMediaRequest } from '@/lib/http/media'
import dynamic from 'next/dynamic'
import { useUser } from '@/providers/UserProvider'
import { Textarea } from '@headlessui/react'
import BigDialog from './BigDialog'
import moment from 'moment'
import InternalDocumentSelector from '../InternalDocumentSelector'
const JoditEditor = dynamic(
    () => import('jodit-react'),
    { ssr: false }
)

// Utility function to view files in new tab with proper filename
const viewFile = async (url, filename) => {
  try {
    
    // Check if it's a Cloudinary URL that might force download
    const isCloudinaryUrl = url.includes('cloudinary.com') && url.includes('raw/upload');
    
    if (isCloudinaryUrl) {
      // For Cloudinary URLs, try to open in new tab
      window.open(url, '_blank');
    } else {
      // For other URLs, try to open directly
      window.open(url, '_blank');
    }
  } catch (error) {
    console.error('Error viewing file:', error);
    // Fallback to opening URL directly
    window.open(url, '_blank');
  }
}

const InfoCard = ({ icon: Icon, title, children, className = "", gradient = "from-slate-50 to-gray-50" }) => (
    <div className={`bg-gradient-to-br ${gradient} border border-gray-200/60 rounded-lg p-3 transition-all duration-200 hover:shadow-sm ${className}`}>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-white/80 rounded">
                <Icon className="w-3 h-3 text-gray-600" />
            </div>
            <h4 className="font-semibold text-gray-800 text-xs">{title}</h4>
        </div>
        {children}
    </div>
)

const AttachmentsCard = ({ task, media, loadingMedia, onMediaUpdate }) => {
    const [showAttachments, setShowAttachments] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(null)
    const [showInternalDocSelector, setShowInternalDocSelector] = useState(false)
    
    // Get attachments from task media or separate media object
    const getAttachments = (task, media) => {
        // Check if media is passed as a separate prop (from API response)
        if (media) {
            // Handle API response structure where media might be an object with media data
            if (media.media) {
                // If media has a nested media property, use that
                if (Array.isArray(media.media)) {
                    return media.media
                } else if (media.media && typeof media.media === 'object') {
                    return [media.media]
                }
            }
            
            // Handle both single media object and array of media objects
            if (Array.isArray(media)) {
                return media
            } else if (media && typeof media === 'object') {
                // Single media object - wrap in array
                return [media]
            }
        }
        
        // Check if task has media data embedded (from API response structure)
        if (task.media) {
            if (Array.isArray(task.media)) {
                return task.media
            } else if (task.media && typeof task.media === 'object') {
                return [task.media]
            }
        }
        
        // Fallback to task.Media for backward compatibility
        return task.Media || []
    }

    const attachments = getAttachments(task, media)

    // Show loading state
    if (loadingMedia) {
        return (
            <InfoCard
                icon={Paperclip}
                title="Attachments"
                gradient="from-blue-50 to-indigo-50"
            >
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Loading attachments...
                </div>
            </InfoCard>
        )
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getFileIcon = (mimeType) => {
        if (mimeType?.includes('pdf')) return '📄'
        if (mimeType?.includes('image')) return '🖼️'
        if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝'
        if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊'
        if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return '📽️'
        return '📎'
    }

    const handleDownload = (attachment) => {
        window.open(attachment.file_url, '_blank')
    }

    const handleFileUpload = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('task_id', task.task_id)
            formData.append('project_id', task.project_id)

            const response = await uploadMediaRequest(formData)
            toast.success('File uploaded successfully')
            
            // Refresh media data
            if (onMediaUpdate) {
                onMediaUpdate()
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to upload file')
        } finally {
            setUploading(false)
            // Reset file input
            event.target.value = ''
        }
    }

    const handleInternalDocUpload = async (internalDoc) => {
        setUploading(true)
        try {
            // Fetch the internal document file data
            const fileResponse = await fetch(internalDoc.path)
            const fileData = await fileResponse.arrayBuffer()
            const blob = new Blob([fileData], { type: 'application/pdf' })
            
            const formData = new FormData()
            formData.append('file', blob, internalDoc.name)
            formData.append('task_id', task.task_id)
            formData.append('project_id', task.project_id)

            const response = await uploadMediaRequest(formData)
            toast.success('Internal document uploaded successfully')
            
            // Refresh media data
            if (onMediaUpdate) {
                onMediaUpdate()
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to upload internal document')
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteAttachment = async (attachment) => {
        if (!window.confirm(`Are you sure you want to delete "${attachment.filename}"?`)) {
            return
        }

        setDeleting(attachment.media_id)
        try {
            await deleteMediaRequest(attachment.media_id)
            toast.success('Attachment deleted successfully')
            
            // Refresh media data
            if (onMediaUpdate) {
                onMediaUpdate()
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete attachment')
        } finally {
            setDeleting(null)
        }
    }

    return (
        <InfoCard
            icon={Paperclip}
            title="Attachments"
            gradient="from-blue-50 to-indigo-50"
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {attachments.length} {attachments.length === 1 ? 'attachment' : 'attachments'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* File Upload Button */}
                        <label className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors cursor-pointer">
                            <Upload className="w-3 h-3" />
                            {uploading ? 'Uploading...' : 'Upload'}
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </label>
                        
                        {/* Internal Document Button */}
                        <button
                            onClick={() => setShowInternalDocSelector(true)}
                            disabled={uploading}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            <FileText className="w-3 h-3" />
                            Select Document
                        </button>
                        
                        {attachments.length > 0 && (
                            <button
                                onClick={() => setShowAttachments(!showAttachments)}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                            >
                                <Eye className="w-3 h-3" />
                                {showAttachments ? 'Hide' : 'View'} Details
                            </button>
                        )}
                    </div>
                </div>

                {showAttachments && attachments.length > 0 && (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                        {attachments.map((attachment, index) => (
                            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="text-lg">{getFileIcon(attachment.mimeType)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-blue-700 truncate">
                                                {attachment.filename}
                                            </p>
                                            <p className="text-xs text-blue-600">
                                                {formatFileSize(attachment.size)} • {moment(attachment.created_at).format('MMM DD, YYYY')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                // Use viewFile to open in new tab with proper filename
                                                viewFile(attachment.file_url, attachment.filename);
                                            }}
                                            className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                                        >
                                            <Eye className="w-3 h-3" />
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleDownload(attachment)}
                                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                                        >
                                            <Download className="w-3 h-3" />
                                            Download
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAttachment(attachment)}
                                            disabled={deleting === attachment.media_id}
                                            className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                                        >
                                            {deleting === attachment.media_id ? (
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                            ) : (
                                                <Trash2 className="w-3 h-3" />
                                            )}
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                
                                {attachment.user && (
                                    <div className="text-xs text-blue-600">
                                        Uploaded by {attachment.user.name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {attachments.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                        No attachments yet. Click "Upload" to add files from PC or "Internal Doc" to select from existing documents.
                    </div>
                )}
            </div>
            
            {/* Internal Document Selector */}
            <InternalDocumentSelector
                isOpen={showInternalDocSelector}
                onClose={() => setShowInternalDocSelector(false)}
                onSelect={handleInternalDocUpload}
                phase={task.phase}
                projectId={task.project_id}
            />
        </InfoCard>
    )
}

const UpdateTask = ({ project, task, onClose, isOpen, getProjectDetails }) => {
    const [selectedMember, setSelectedMember] = useState([]);
    const [isDisabled, setIsDiabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [taskMedia, setTaskMedia] = useState(null);
    const [loadingMedia, setLoadingMedia] = useState(false);
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

    // Function to refresh media data
    const refreshMediaData = useCallback(async () => {
        if (task && task.task_id) {
            setLoadingMedia(true)
            try {
                const response = await getMediaByTaskIdRequest(task.task_id)
                setTaskMedia(response.data)
            } catch (error) {
                setTaskMedia(null)
            } finally {
                setLoadingMedia(false)
            }
        }
    }, [task]);

    // Fetch media data when modal opens
    useEffect(() => {
        if (isOpen && task && task.task_id) {
            refreshMediaData()
        }
    }, [isOpen, task, refreshMediaData]);

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

                    {/* Attachments Section */}
                    <div className="grid grid-cols-[auto,1fr] gap-5 items-start">
                        <div className='flex items-center gap-2 w-[8rem]'>
                            <Paperclip className="h-5 w-5 text-black" />
                            <span className='text-black text-sm font-medium'>Attachments</span>
                        </div>
                        <div className="w-full">
                            <AttachmentsCard task={task} media={taskMedia} loadingMedia={loadingMedia} onMediaUpdate={refreshMediaData} />
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