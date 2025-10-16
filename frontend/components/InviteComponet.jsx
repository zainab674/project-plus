import React, { useCallback, useEffect, useState } from 'react'
import BigDialog from './Dialogs/BigDialog'
import { Button } from './Button'
import { invitePeopleRequest, sendViaMailRequest } from '@/lib/http/project';
import { toast } from 'react-toastify';
import { Textarea } from './ui/textarea';
import { generateInvitation } from '@/utils/createInvitation';
import { useUser } from '@/providers/UserProvider';
import { Input } from './ui/input';

const InviteComponet = ({ open, onClose, project, isClient = true }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [link, setLink] = useState(null);
    const [invitation, setInvitation] = useState('');
    const { user } = useUser();
    const [sendViaMail, setSendViaMail] = useState(false);
    const [mail, setMail] = useState('');

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formdata = {
                role: isClient ? 'CLIENT' : 'TEAM',
                projectId: project.project_id
            }
            const res = await invitePeopleRequest(formdata);
            setLink(res.data.link);
            const invitation = generateInvitation(
                res.data.link,
                project.name,
                user?.name,
                'Project Admin',
                isClient ? 'CLIENT' : 'TEAM',
                isClient ? "True" : "False",
                isClient ? 'Client' : 'Team Member'
            );
            setInvitation(invitation);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [isClient, project, user]);

    const handleCopy = useCallback(() => {
        try {
            if (typeof window != 'undefined') {
                window.navigator.clipboard.writeText(invitation);
                toast.success(`${isClient ? 'Client' : 'Team Member'} Invitation Copied`);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [invitation, isClient]);

    const handleSendViaMail = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formdata = {
                invitation,
                mail,
                projectId: project.project_id
            }
            const res = await sendViaMailRequest(formdata);
            toast.success(res.data.message);
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [invitation, mail])

    return (
        <BigDialog open={open} onClose={onClose}>
            {
                sendViaMail &&
                <>
                    <h2 className='text-center font-medium text-2xl text-gray-700'>Send {isClient ? 'Client' : 'Team Member'} Invitation Via Mail</h2>
                    <form className='mt-16 space-y-6 mx-auto max-w-2xl flex-col' onSubmit={handleSendViaMail}>
                        <Input
                            type="email"
                            placeholder={`Enter ${isClient ? 'Client' : 'Team Member'} Email`}
                            value={mail}
                            onChange={(e) => setMail(e.target.value)}
                        />

                        <Button className="bg-blue-600 text-white hover:bg-blue-700 w-full" isLoading={isLoading} disabled={isLoading || !mail}>
                            Send {isClient ? 'Client' : 'Team Member'} Invitation
                        </Button>
                    </form>
                </>
            }

            {
                !link &&
                <>
                    <h2 className='text-center font-medium text-2xl text-gray-700'>Create {isClient ? 'Client' : 'Team Member'} Invitation Link</h2>
                    <form className='mt-16 space-y-6 mx-auto max-w-2xl flex-col' onSubmit={handleSubmit}>
                        <div className='text-center text-gray-600 mb-4'>
                            <p>This will create an invitation link for {isClient ? 'clients' : 'team members'} to join the project.</p>
                        </div>

                        <Button className="bg-blue-600 text-white hover:bg-blue-700 w-full" isLoading={isLoading} disabled={isLoading}>
                            Create {isClient ? 'Client' : 'Team Member'} Invitation Link
                        </Button>
                    </form>
                </>
            }

            {
                link &&
                <>
                    <h2 className='text-center font-medium text-2xl text-gray-700'>{isClient ? 'Client' : 'Team Member'} Invitation Link</h2>
                    <div className='mt-16 space-y-6 mx-auto max-w-2xl flex-col'>
                        <Textarea
                            value={invitation}
                            readOnly
                            className='min-h-[200px]'
                        />

                        <div className='flex gap-3'>
                            <Button onClick={handleCopy} className="flex-1 bg-green-600 text-white hover:bg-green-700">
                                Copy {isClient ? 'Client' : 'Team Member'} Invitation
                            </Button>
                            <Button onClick={() => setSendViaMail(true)} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
                                Send Via Mail
                            </Button>
                        </div>
                    </div>
                </>
            }
        </BigDialog>
    )
}

export default InviteComponet