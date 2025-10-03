import React, { useCallback, useState } from 'react'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Button } from './Button';

const AddWorkDescription = ({ handleStop, task_id, close }) => {
    const [description, setDescription] = useState('');

    const stopNow = useCallback((e) => {
        e.preventDefault();
        handleStop(task_id, description);
        close();
    }, [description])
    return (
        <form onSubmit={stopNow}>
            <div className="space-y-2">
                <Label htmlFor="description">Work Description</Label>
                <Textarea name='description' className="h-[19rem]" id='description' o placeholder="add description..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <Button
                type="submit"
                className="w-full h-12 bg-blue-500 text-white disabled:opacity-40 hover:bg-blue-600 mt-8"

            >
                STOP NOW
            </Button>
        </form>
    )
}

export default AddWorkDescription