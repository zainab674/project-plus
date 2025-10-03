import React, { useCallback, useState } from 'react'
import { Button } from './Button'
import { MoveLeft } from 'lucide-react'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { toast } from 'react-toastify'
import { addTaskTranscribtionRequest, sendTaskEmailRequest } from '@/lib/http/task'
import { Textarea } from './ui/textarea'

const FormEmail = ({ handleCloseMailForm,task,getTaskById }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formdata, setFormdata] = useState({
        subject: '',
        content: '',
        task_id: task?.task_id
    });

    const handleFormChange = useCallback((e) => {
        setFormdata(prev => ({...prev,[e.target.name]: e.target.value}));
    },[]);



    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            formdata['task_id'] = task?.task_id;
            const res = await sendTaskEmailRequest(formdata);
            await getTaskById();
            toast.success(res?.data?.message);
            handleCloseMailForm();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        }finally{
            setIsLoading(false);
        }
    },[formdata,task]);

    console.log(formdata)
    return (
        <div className='px-2 py-3'>
            <div className='flex items-center justify-between'>
                <Button variant="ghost" className={'text-gray-900'} onClick={handleCloseMailForm}>
                    <MoveLeft />
                </Button>
            </div>

            <div className="w-full px-10 space-y-6 mt-5">
                <h1 className="text-3xl font-semibold text-gray-800 text-center">Send Mail</h1>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Name</Label>
                        <Input
                            id="subject"
                            type="text"
                            name="subject"
                            placeholder="Subject"
                            value={formdata.subject}
                            onChange={handleFormChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea value={formdata.content} name='content' id='content' onChange={handleFormChange} placeholder="write something..."/>
                    </div>
                    
                    <Button
                        type="submit"
                        className="w-full h-12 bg-blue-500 text-white disabled:opacity-40 hover:bg-blue-600"
                        disabled={isLoading || !formdata.subject || !formdata.content}
                        isLoading={isLoading}
                    >
                        Send
                    </Button>
                </form>

            </div>
        </div>
    )
}

export default FormEmail