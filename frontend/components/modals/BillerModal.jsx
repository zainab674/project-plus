import React, { useCallback, useEffect, useState } from 'react';
import { X, UserPlus, Mail, Copy, DollarSign, Users, Trash2, Edit3 } from 'lucide-react';
import { Button } from '../Button';
import { invitePeopleRequest, sendViaMailRequest } from '@/lib/http/project';
import { toast } from 'react-toastify';
import { Textarea } from '../ui/textarea';
import { generateInvitation } from '@/utils/createInvitation';
import { useUser } from '@/providers/UserProvider';
import { Input } from '../ui/input';

const BillerModal = ({ isOpen, onClose }) => {
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
                role: 'BILLER',
                projectId: null // For general biller invitation, not project-specific
            }
            const res = await invitePeopleRequest(formdata);
            setLink(res.data.link);
            const invitation = generateInvitation(
                res.data.link,
                'Billing System',
                user?.name,
                'Project Admin',
                'BILLER',
                "False",
                'Biller'
            );
            setInvitation(invitation);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const handleCopy = useCallback(() => {
        try {
            if (typeof window != 'undefined') {
                window.navigator.clipboard.writeText(invitation);
                toast.success("Biller Invitation Copied");
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [invitation]);

    const handleSendViaMail = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formdata = {
                invitation,
                mail,
                projectId: null
            }
            const res = await sendViaMailRequest(formdata);
            toast.success(res.data.message);
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [invitation, mail, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900">Invite Biller</h2>
                            <p className="text-gray-600 mt-1">Invite a biller to handle billing and invoicing</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {sendViaMail ? (
                        <>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Send Biller Invitation Via Email</h3>
                            <form className="space-y-4" onSubmit={handleSendViaMail}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="Enter biller's email address"
                                        value={mail}
                                        onChange={(e) => setMail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setSendViaMail(false)}
                                        disabled={isLoading}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-green-600 text-white hover:bg-green-700"
                                        isLoading={isLoading}
                                        disabled={isLoading || !mail}
                                    >
                                        Send Invitation
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : !link ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <DollarSign className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Create Biller Invitation</h3>
                                <p className="text-gray-600">
                                    Generate an invitation link for a biller to join your team and handle billing operations.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-2">Biller Permissions:</h4>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Generate invoices and billing reports</li>
                                        <li>• Manage client billing and payment tracking</li>
                                        <li>• Access to billing dashboard and financial data</li>
                                        <li>• Create and send invoices to clients</li>
                                    </ul>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        className="bg-green-600 text-white hover:bg-green-700"
                                        isLoading={isLoading}
                                        disabled={isLoading}
                                    >
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        Generate Invitation Link
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <DollarSign className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Biller Invitation Created!</h3>
                                <p className="text-gray-600">
                                    Share this invitation with the biller to grant them access to your billing system.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Invitation Link
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={link}
                                            readOnly
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={handleCopy}
                                            variant="outline"
                                            className="whitespace-nowrap"
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Template
                                    </label>
                                    <Textarea
                                        value={invitation}
                                        readOnly
                                        rows={8}
                                        className="resize-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setLink(null);
                                            setInvitation('');
                                        }}
                                        disabled={isLoading}
                                    >
                                        Create New Link
                                    </Button>
                                    <Button
                                        onClick={() => setSendViaMail(true)}
                                        className="bg-green-600 text-white hover:bg-green-700"
                                        disabled={isLoading}
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        Send Via Email
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillerModal; 