'use client'
import AnimatedUploadButton from '@/components/AnimatedUploadButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/Button'
import { getProjectRequest } from '@/lib/http/project'
import { Cloud, CloudUpload, Info } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getMediaByProjectIdRequest, uploadMediaRequest } from '@/lib/http/media'
import BigDialog from '@/components/Dialogs/BigDialog'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { toast } from 'react-toastify'

const bytesToMB = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2);
};
const page = ({ params }) => {
    const [project, setProject] = useState(null);
    const [isLoading, setLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [media, setMedia] = useState([]);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [formSelectedTask, setFormSelectedTask] = useState('');
    const [formLoading, setFormLoading] = useState(false)
    const [downloadLoading, setDownLoading] = useState(null);


    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        setFile(file);
    }, []);

    const uploadSubmit = useCallback(async (e) => {
        e.preventDefault();
        setFormLoading(true)
        try {
            const formdata = new FormData();
            formdata.append('file', file);
            formdata.append('task_id', formSelectedTask);
            formdata.append('project_id', params.id);

            const res = await uploadMediaRequest(formdata);
            getProjectDetails();
            setFile(null);
            setFormSelectedTask('');
            setUploadOpen(false);
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setFormLoading(false);
        }
    }, [file, selectedTask, params]);

    const getProjectDetails = useCallback(async () => {
        setLoading(true);
        try {
            const [projectRes, mediaRes] = await Promise.all([
                getProjectRequest(params.id),
                getMediaByProjectIdRequest(params.id)
            ]);

            setProject(projectRes?.data?.project);
            setMedia(mediaRes?.data?.media);
        } catch (error) {
            setProject(null);
            console.log(error?.response?.data?.message || error?.message);
        } finally {
            setLoading(false);
        }
    }, []);



    const filterMedia = useMemo(() => (media?.filter(m => selectedTask ? m.task_id == selectedTask : true)), [selectedTask, media]);



    const downloadMedia = useCallback(async (uri, fileName, media_id) => {
        setDownLoading(media_id);
        try {
            const response = await fetch(uri);

            if (!response.ok) {
                throw new Error(`Failed to fetch media: ${response.statusText}`);
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            toast.error(`Error downloading media ${error.message}`);
        } finally {
            setDownLoading(null);
        }
    }, []);

    useEffect(() => {
        getProjectDetails();
    }, []);
    return (
        <>
            <div className="flex h-screen flex-col bg-white m-2 rounded-md overflow-auto">
                <div className="flex flex-col gap-4 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-4xl font-semibold">{project?.name || "Project Media"}</h1>
                            <Info className="h-4 w-4 text-gray-400" />
                        </div>

                    </div>
                </div>

                <div className='mt-5 px-6'>
                    <div className='flex items-center justify-end'>
                        <Button className={'bg-blue-500 hover:bg-blue-600 text-white'} onClick={() => setUploadOpen(true)}>
                            Upload
                        </Button>
                    </div>

                    <div className="flex items-center justify-start my-4 gap-4 bg-neutral-100 overflow-x-auto rounded-md">
                        <Button variant={selectedTask == null ? "default" : "ghost"} className={selectedTask == null ? 'text-white bg-blue-500 hover:bg-blue-600' : 'text-black/70'} onClick={() => setSelectedTask(null)}>
                            All
                        </Button>
                        {
                            project && project.Tasks?.map((task) => (
                                <Button variant={selectedTask == task?.task_id ? "default" : "ghost"} className={selectedTask == task?.task_id ? 'text-white bg-blue-500 hover:bg-blue-600' : 'text-black/70'} onClick={() => setSelectedTask(task.task_id)}>
                                    {task.name}
                                </Button>
                            ))
                        }
                    </div>

                    <div>
                        <Table>
                            <TableCaption>All Media</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Mimetype</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    filterMedia && filterMedia.map((media) => (
                                        <TableRow key={media.media_id}>
                                            <TableCell className="font-medium">{media.filename}</TableCell>
                                            <TableCell>{bytesToMB(media.size)}Mb</TableCell>
                                            <TableCell>{media.mimeType}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size='icon' variant="ghost" className={'bg-gray-100'} onClick={() => downloadMedia(media.file_url, media.filename, media.media_id)} isLoading={downloadLoading == media.media_id} disabled={downloadLoading == media.media_id}>
                                                    {downloadLoading != media.media_id && <CloudUpload />}

                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>

                        </Table>
                    </div>
                </div>


            </div>

            <BigDialog open={uploadOpen} onClose={() => setUploadOpen(false)} width={'35'}>

                <form className='space-y-8 mt-20 px-5' onSubmit={uploadSubmit}>
                    <div className='space-y-1'>
                        <span className='text-black/80 text-md font-normal'>Select Task</span>
                        <Select value={formSelectedTask} onValueChange={(value) => setFormSelectedTask(value)}>
                            <SelectTrigger className="focus-visible:ring-0 focus-visible:ring-transparent outline-none">
                                <SelectValue placeholder="Select Task" />
                            </SelectTrigger>
                            <SelectContent className="focus-visible:ring-0 focus-visible:ring-transparent">
                                {
                                    project && project.Tasks?.map((task) => (
                                        <SelectItem value={task.task_id?.toString()}>
                                            {task.name}
                                        </SelectItem>
                                    ))
                                }

                            </SelectContent>
                        </Select>
                    </div>


                    <div className='space-y-1'>
                        <span className='text-black/80 text-md font-normal'>Choose File</span>
                        <Input type='file' required={true} onChange={handleFileChange} />
                    </div>

                    <Button className={`bg-blue-500 hover:bg-blue-600 w-full disabled:opacity-40`} isLoading={formLoading} disabled={formLoading}>
                        Upload
                    </Button>
                </form>
            </BigDialog>
        </>
    )
}

export default page