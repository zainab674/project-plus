import React, { useCallback, useState } from 'react'
import { Button } from './Button'
import { MoveLeft } from 'lucide-react'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { toast } from 'react-toastify'
import { addTaskTranscribtionRequest } from '@/lib/http/task'

const FormTranscribtion = ({ handleCloseTranscibtionForm,task,getTaskById }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formdata, setFormdata] = useState({
        name: '',
        file: null,
        task_id: task?.task_id
    });

    const handleFormChange = useCallback((e) => {
        setFormdata(prev => ({...prev,[e.target.name]: e.target.value}));
    },[]);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        setFormdata(prev => ({...prev,file: file}));
    },[]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            formdata['task_id'] = task?.task_id;
            console.log(formdata)
            const res = await addTaskTranscribtionRequest(formdata);
            await getTaskById();
            toast.success(res?.data?.message);
            handleCloseTranscibtionForm();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        }finally{
            setIsLoading(false);
        }
    },[formdata,task]);
    return (
        <div className='px-2 py-3'>
            <div className='flex items-center justify-between'>
                <Button variant="ghost" className={'text-gray-900'} onClick={handleCloseTranscibtionForm}>
                    <MoveLeft />
                </Button>
            </div>

            <div className="w-full px-10 space-y-6 mt-5">
                <h1 className="text-3xl font-semibold text-gray-800 text-center">Add Transcibtion</h1>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            name="name"
                            placeholder="Enter your transcibtion name"
                            value={formdata.name}
                            onChange={handleFormChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="file">Audio File</Label>
                        <Input
                            id="file"
                            type="file"
                            name="file"
                            onChange={handleFileChange}
                            required
                        />
                    </div>
                    
                    <Button
                        type="submit"
                        className="w-full h-12 bg-blue-500 text-white disabled:opacity-40 hover:bg-blue-600"
                        disabled={isLoading}
                        isLoading={isLoading}
                    >
                        Add
                    </Button>
                </form>

            </div>
        </div>
    )
}

export default FormTranscribtion