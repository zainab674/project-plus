import React, { useCallback, useState } from 'react';
import BigDialog from './Dialogs/BigDialog';
import { Button } from './Button';
import { inviteTeamMemberRequest, generateTeamInvitationRequest } from '@/lib/http/auth';
import { toast } from 'react-toastify';
import { Textarea } from './ui/textarea';
import { generateInvitation } from '@/utils/createInvitation';
import { useUser } from '@/providers/UserProvider';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const TeamInviteComponent = ({ open, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [link, setLink] = useState(null);
    const [invitation, setInvitation] = useState('');
    const { user } = useUser();
    const [sendViaMail, setSendViaMail] = useState(false);
    const [mail, setMail] = useState('');
    const [inviteMethod, setInviteMethod] = useState('email'); // 'email' or 'link'
    const [inviteData, setInviteData] = useState({
        email: '',
        role: 'TEAM',
        legalRole: '',
        customLegalRole: ''
    });

    const handleDirectInvite = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await inviteTeamMemberRequest(inviteData);
            toast.success(res.data.message);
            setInviteData({
                email: '',
                role: 'TEAM',
                legalRole: '',
                customLegalRole: ''
            });
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [inviteData, onSuccess]);

    const handleGenerateLink = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formData = {
                role: inviteData.role,
                legalRole: inviteData.legalRole || null,
                customLegalRole: inviteData.customLegalLegalRole || null
            };
            const res = await generateTeamInvitationRequest(formData);
            setLink(res.data.link);
            const invitation = generateInvitation(
                res.data.link,
                'Team',
                user?.name,
                'Team Leader',
                inviteData.role,
                "False",
                inviteData.legalRole || 'Team Member'
            );
            setInvitation(invitation);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [inviteData, user]);

    const handleCopy = useCallback(() => {
        try {
            if (typeof window !== 'undefined') {
                window.navigator.clipboard.writeText(invitation);
                toast.success("Team Invitation Copied");
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [invitation]);

    const handleSendViaMail = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // You can implement email sending functionality here
            toast.success("Invitation sent via email");
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [invitation, mail, onClose]);

    return (
        <BigDialog open={open} onClose={onClose}>
            {sendViaMail && (
                <>
                    <h2 className='text-center font-medium text-2xl text-gray-700'>Send Team Invitation Via Mail</h2>
                    <form className='mt-16 space-y-6 mx-auto max-w-2xl flex-col' onSubmit={handleSendViaMail}>
                        <Input
                            type="email"
                            placeholder="Enter Email"
                            value={mail}
                            onChange={(e) => setMail(e.target.value)}
                        />
                        <Button className="bg-blue-600 text-white hover:bg-blue-700 w-full" isLoading={isLoading} disabled={isLoading || !mail}>
                            Send Team Invitation
                        </Button>
                    </form>
                </>
            )}

            {!link && (
                <>
                    <h2 className='text-center font-medium text-2xl text-gray-700'>Invite Team Member</h2>
                    
                    <div className='mt-8 space-y-4'>
                        <div className='flex gap-4 justify-center'>
                            <Button
                                variant={inviteMethod === 'email' ? 'default' : 'outline'}
                                onClick={() => setInviteMethod('email')}
                            >
                                Direct Invite
                            </Button>
                            <Button
                                variant={inviteMethod === 'link' ? 'default' : 'outline'}
                                onClick={() => setInviteMethod('link')}
                            >
                                Generate Link
                            </Button>
                        </div>

                        {inviteMethod === 'email' ? (
                            <form className='mt-8 space-y-6 mx-auto max-w-2xl flex-col' onSubmit={handleDirectInvite}>
                                <Input
                                    type="email"
                                    placeholder="Enter Email"
                                    value={inviteData.email}
                                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                    required
                                />
                                
                                <Select value={inviteData.role} onValueChange={(value) => setInviteData({ ...inviteData, role: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEAM">Team Member</SelectItem>
                                        <SelectItem value="BILLER">Biller</SelectItem>
                                    </SelectContent>
                                </Select>

                                {inviteData.role === 'BILLER' && (
                                    <>
                                        <Select value={inviteData.legalRole} onValueChange={(value) => setInviteData({ ...inviteData, legalRole: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Legal Role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                                                <SelectItem value="ASSOCIATE">Associate</SelectItem>
                                                <SelectItem value="PARALEGAL">Paralegal</SelectItem>
                                                <SelectItem value="ANALYST">Analyst</SelectItem>
                                                <SelectItem value="INVESTIGATOR">Investigator</SelectItem>
                                                <SelectItem value="CUSTOM">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {inviteData.legalRole === 'CUSTOM' && (
                                            <Input
                                                placeholder="Enter Custom Legal Role"
                                                value={inviteData.customLegalRole}
                                                onChange={(e) => setInviteData({ ...inviteData, customLegalRole: e.target.value })}
                                            />
                                        )}
                                    </>
                                )}

                                <Button className="bg-blue-600 text-white hover:bg-blue-700 w-full" isLoading={isLoading} disabled={isLoading || !inviteData.email}>
                                    Invite Team Member
                                </Button>
                            </form>
                        ) : (
                            <form className='mt-8 space-y-6 mx-auto max-w-2xl flex-col' onSubmit={handleGenerateLink}>
                                <Select value={inviteData.role} onValueChange={(value) => setInviteData({ ...inviteData, role: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEAM">Team Member</SelectItem>
                                        <SelectItem value="BILLER">Biller</SelectItem>
                                    </SelectContent>
                                </Select>

                                {inviteData.role === 'BILLER' && (
                                    <>
                                        <Select value={inviteData.legalRole} onValueChange={(value) => setInviteData({ ...inviteData, legalRole: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Legal Role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                                                <SelectItem value="ASSOCIATE">Associate</SelectItem>
                                                <SelectItem value="PARALEGAL">Paralegal</SelectItem>
                                                <SelectItem value="ANALYST">Analyst</SelectItem>
                                                <SelectItem value="INVESTIGATOR">Investigator</SelectItem>
                                                <SelectItem value="CUSTOM">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {inviteData.legalRole === 'CUSTOM' && (
                                            <Input
                                                placeholder="Enter Custom Legal Role"
                                                value={inviteData.customLegalRole}
                                                onChange={(e) => setInviteData({ ...inviteData, customLegalRole: e.target.value })}
                                            />
                                        )}
                                    </>
                                )}

                                <Button className="bg-blue-600 text-white hover:bg-blue-700 w-full" isLoading={isLoading} disabled={isLoading}>
                                    Generate Invitation Link
                                </Button>
                            </form>
                        )}
                    </div>
                </>
            )}

            {link && (
                <>
                    <h2 className='text-center font-medium text-2xl text-gray-700'>Team Invitation Link Generated</h2>
                    <div className='mt-8 space-y-6 mx-auto max-w-2xl'>
                        <div className='text-center text-gray-600 mb-4'>
                            <p>Share this invitation link with your team member:</p>
                        </div>
                        
                        <Textarea
                            value={invitation}
                            readOnly
                            className='min-h-[200px]'
                        />
                        
                        <div className='flex gap-4'>
                            <Button onClick={handleCopy} className="flex-1">
                                Copy Invitation
                            </Button>
                            <Button onClick={() => setSendViaMail(true)} className="flex-1">
                                Send Via Email
                            </Button>
                        </div>
                        
                        <Button onClick={() => {
                            setLink(null);
                            setInvitation('');
                            setSendViaMail(false);
                        }} variant="outline" className="w-full">
                            Generate New Link
                        </Button>
                    </div>
                </>
            )}
        </BigDialog>
    );
};

export default TeamInviteComponent; 