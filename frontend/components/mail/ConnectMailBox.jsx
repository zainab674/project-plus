import React, { useCallback, useState } from 'react'
import BigDialog from '../Dialogs/BigDialog'
import { Input } from '../ui/input';
import { Info } from 'lucide-react';
import { Button } from '../Button';
import { useUser } from '@/providers/UserProvider';
import { toast } from 'react-toastify';
import { connectMailRequest } from '@/lib/http/auth';

const ConnectMailBox = ({ open, onClose, onConnectSuccess }) => {
    const [mail, setMail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false)
    const {setUser} = useUser();

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const formdata = {
                connect_mail_password: password.replaceAll(" ",''),
                connect_mail: mail.trim()
            }
            const res = await connectMailRequest(formdata);
            toast.success(res.data.message);
            setUser(res.data.user);
            
            // Call the success callback if provided
            if (onConnectSuccess) {
                onConnectSuccess();
            }
            
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message);
        }finally{
            setLoading(false)
        }

    }, [mail,password]);
    return (
        <BigDialog open={open} onClose={onClose} width={35}>
            <form onSubmit={handleSubmit} className='mt-20 space-y-8 px-6'>
                <div className='space-y-2'>
                    <span className='text-black/80 text-md font-normal'>Gmail</span>
                    <Input type='email' value={mail} onChange={(e) => setMail(e.target.value)} required={true} placeholder="Enter Your Gmail"/>
                </div>
                <div className='space-y-2'>
                    <span className='text-black/80 text-md font-normal flex items-center gap-2'>
                        App Password
                        <Info size={16}/> 
                    </span>
                    <Input type='password' value={password} onChange={(e) => setPassword(e.target.value)} required={true}  placeholder="Gmail App Password"/>
                    <p>If you don't know about app password ? <a href='https://youtu.be/hXiPshHn9Pw?si=ucYDD1YrBZHI40C2' target='__black' className='text-blue-400 underline font-normal cursor-pointer'>Click Here</a></p>
                </div>

                <Button className={'bg-blue-500 hover:bg-blue-600 w-full disabled:opacity-40'} isLoading={loading} disabled={loading}>
                    Connect Now
                </Button>
            </form>
        </BigDialog>
    )
}

export default ConnectMailBox