// import React, { useCallback, useState } from 'react'
// import BigDialog from './Dialogs/BigDialog'
// import { Label } from './ui/label'
// import { Input } from './ui/input'
// import { Textarea } from './ui/textarea'
// import { Button } from './Button'
// import { Select, SelectGroup, SelectLabel, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
// import { useUser } from '@/providers/UserProvider'
// import { sendTaskEmailRequest } from '@/lib/http/task'
// import { toast } from 'react-toastify'

// const SendMail = ({ open, onClose, getAllMail, project_id = null }) => {
//     const [isLoading, setIsLoading] = useState(false);
//     const [selectProject, setSelectProject] = useState(project_id);
//     const [selectTask, setSelectedTask] = useState(null);
//     const [subject, setSubject] = useState('');
//     const [content, setContent] = useState('');
//     const { user } = useUser();

//     const handleSubmit = useCallback(async (e) => {
//         e.preventDefault();
//         setIsLoading(true);
//         try {
//             const formData = {
//                 task_id: selectTask,
//                 content: content,
//                 subject: subject
//             }

//             const res = await sendTaskEmailRequest(formData);
//             getAllMail();
//             toast.success(res?.data?.message);
//             onClose();
//         } catch (error) {
//             toast.error(error?.response?.data?.message || error?.message);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [selectTask, selectProject, subject, content]);

//     return (
//         <BigDialog open={open} onClose={onClose}>
//             <div className='px-2 py-3'>
//                 <div className="w-full px-10 space-y-6 mt-5">
//                     <h1 className="text-3xl font-semibold text-black text-center">Send A Mail</h1>
//                     <form onSubmit={handleSubmit} className="space-y-8">
//                         <div className="space-y-2">
//                             <Label htmlFor="subject" className="text-black">Subject</Label>
//                             <Input
//                                 id="subject"
//                                 type="text"
//                                 name="subject"
//                                 placeholder="Subject"
//                                 required
//                                 value={subject}
//                                 onChange={(e) => setSubject(e.target.value)}
//                                 className="bg-white border-primary text-black placeholder:text-gray-400"
//                             />
//                         </div>
//                         <div className="space-y-2">
//                             <Label htmlFor="content" className="text-black">Content</Label>
//                             <Textarea
//                                 name='content'
//                                 id='content'
//                                 placeholder="add content..."
//                                 value={content}
//                                 onChange={(e) => setContent(e.target.value)}
//                                 className="bg-white border-primary text-black placeholder:text-gray-400"
//                             />
//                         </div>
//                         <Button
//                             type="submit"
//                             className="w-full bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
//                             disabled={isLoading}
//                         >
//                             {isLoading ? 'Sending...' : 'Send Mail'}
//                         </Button>
//                     </form>
//                 </div>
//             </div>
//         </BigDialog>
//     )
// }

// export default SendMail






import React, { useCallback, useState, useEffect } from 'react';
import BigDialog from './Dialogs/BigDialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './Button';
import {
    Select,
    SelectGroup,
    SelectLabel,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "@/components/ui/select";
import { useUser } from '@/providers/UserProvider';
import { sendTaskEmailRequest } from '@/lib/http/task';
import { getProjectTasksRequest } from '@/lib/http/task'; // Make sure you have this endpoint
import { toast } from 'react-toastify';

const SendMail = ({ open, onClose, getAllMail, tasks }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectTask, setSelectedTask] = useState(null);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    //   const [tasks, setTasks] = useState([]);

    const { user } = useUser();

    //   useEffect(() => {
    //     const fetchTasks = async () => {
    //       try {
    //         if (project_id) {
    //           const res = await getProjectTasksRequest(project_id);
    //           setTasks(res?.data?.tasks || []);
    //         }
    //       } catch (error) {
    //         console.error('Error fetching tasks:', error);
    //       }
    //     };
    //     fetchTasks();
    //   }, [project_id]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formData = {
                task_id: selectTask,
                content,
                subject,
            };
            const res = await sendTaskEmailRequest(formData);
            getAllMail?.();
            toast.success(res?.data?.message);
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [selectTask, subject, content]);

    return (
        <BigDialog open={open} onClose={onClose}>
            <div className='px-2 py-3'>
                <div className="w-full px-10 space-y-6 mt-5">
                    <h1 className="text-3xl font-semibold text-black text-center">Send A Mail</h1>
                    <form onSubmit={handleSubmit} className="space-y-8">

                        <div className="space-y-2">
                            <Label htmlFor="task" className="text-black">Select Task</Label>
                            <Select onValueChange={setSelectedTask}>
                                <SelectTrigger className="bg-white border-primary text-black">
                                    <SelectValue placeholder="Select task..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Tasks</SelectLabel>
                                        {tasks?.map((task) => (
                                            <SelectItem key={task.task_id} value={task.task_id.toString()}>
                                                {task.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-black">Subject</Label>
                            <Input
                                id="subject"
                                type="text"
                                name="subject"
                                placeholder="Subject"
                                required
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="bg-white border-primary text-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content" className="text-black">Content</Label>
                            <Textarea
                                name='content'
                                id='content'
                                placeholder="Add content..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="bg-white border-primary text-black"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send Mail'}
                        </Button>
                    </form>
                </div>
            </div>
        </BigDialog>
    );
};

export default SendMail;
