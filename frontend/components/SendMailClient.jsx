// import React, { useCallback, useState } from 'react'
// import BigDialog from './Dialogs/BigDialog'
// import { Label } from './ui/label'
// import { Input } from './ui/input'
// import { Textarea } from './ui/textarea'
// import { Button } from './Button'
// import { Select, SelectGroup, SelectLabel, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
// import { useUser } from '@/providers/UserProvider'
// import { sendEmailToClientRequest, sendTaskEmailRequest } from '@/lib/http/task'
// import { toast } from 'react-toastify'

// const SendMailClient = ({ open, onClose, getAllMail, project_id = null, clients, tasks }) => {
//     console.log()
//     const [isLoading, setIsLoading] = useState(false);
//     const [selectProject, setSelectProject] = useState(project_id);
//     const [selectTask, setSelectedTask] = useState(null);
//     const [selectClient, setSelectedClient] = useState(null);
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
//                 subject: subject,
//                 client_id: selectClient,
//             }

//             const res = await sendEmailToClientRequest(formData);
//             getAllMail();
//             toast.success(res?.data?.message);
//             onClose();
//         } catch (error) {
//             toast.error(error?.response?.data?.message || error?.message);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [selectTask, selectProject, subject, content, selectClient]);

//     return (
//         <BigDialog open={open} onClose={onClose}>
//             <div className='px-2 py-3'>
//                 <div className="w-full px-10 space-y-6 mt-5">
//                     <h1 className="text-3xl font-semibold text-black text-center">Send A Mail To Client</h1>
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
//                         <div className="space-y-2">
//                             <Label htmlFor="client" className="text-black">Client</Label>
//                             <Select onValueChange={(value) => setSelectedClient(value)} value={selectClient}>
//                                 <SelectTrigger className="w-full bg-white border-primary text-black">
//                                     <SelectValue placeholder="Select a client" />
//                                 </SelectTrigger>
//                                 <SelectContent className="bg-white border-primary">
//                                     <SelectGroup>
//                                         <SelectLabel className="text-gray-400">Clients</SelectLabel>
//                                         {
//                                             clients?.map((client, index) => (
//                                                 <SelectItem
//                                                     value={`${client.project_client_id}`}
//                                                     key={`${client.project_client_id}-${index}`}
//                                                     className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
//                                                 >
//                                                     {client?.user.name}
//                                                 </SelectItem>
//                                             ))
//                                         }
//                                     </SelectGroup>
//                                 </SelectContent>
//                             </Select>
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

// export default SendMailClient



import React, { useCallback, useState } from 'react';
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
import { sendEmailToClientRequest } from '@/lib/http/task';
import { toast } from 'react-toastify';

const SendMailClient = ({ open, onClose, getAllMail, project_id = null, clients, tasks }) => {
    console.log("tasks", tasks)
    const [isLoading, setIsLoading] = useState(false);
    const [selectTask, setSelectedTask] = useState(null);
    const [selectClient, setSelectedClient] = useState(null);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const { user } = useUser();

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formData = {
                task_id: selectTask,
                content,
                subject,
                client_id: selectClient,
            };

            const res = await sendEmailToClientRequest(formData);
            getAllMail?.();
            toast.success("Email sent to Client successfully");
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [selectTask, subject, content, selectClient]);

    return (
        <BigDialog open={open} onClose={onClose}>
            <div className='px-2 py-3'>
                <div className="w-full px-10 space-y-6 mt-5">
                    <h1 className="text-3xl font-semibold text-black text-center">Send A Mail To Client</h1>
                    <form onSubmit={handleSubmit} className="space-y-8">

                        <div className="space-y-2">
                            <Label htmlFor="task" className="text-black">Select Task</Label>
                            <Select onValueChange={setSelectedTask} value={selectTask}>
                                <SelectTrigger className="w-full bg-white border-primary text-black">
                                    <SelectValue placeholder="Select a task" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-primary">
                                    <SelectGroup>
                                        <SelectLabel className="text-gray-400">Tasks</SelectLabel>
                                        {tasks?.map((task) => (
                                            <SelectItem key={task.task_id} value={`${task.task_id}`}>
                                                {task.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="client" className="text-black">Select Client</Label>
                            <Select onValueChange={setSelectedClient} value={selectClient}>
                                <SelectTrigger className="w-full bg-white border-primary text-black">
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-primary">
                                    <SelectGroup>
                                        <SelectLabel className="text-gray-400">Clients</SelectLabel>
                                        {clients?.map((client, index) => (
                                            <SelectItem
                                                value={`${client.user.user_id}`}
                                                key={`${client.user.user_id}-${index}`}
                                            >
                                                {client?.user?.name || 'Unnamed Client'}
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
                                className="bg-white border-primary text-black placeholder:text-gray-400"
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
                                className="bg-white border-primary text-black placeholder:text-gray-400"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
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

export default SendMailClient;
