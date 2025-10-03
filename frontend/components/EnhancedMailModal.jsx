'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus, Send, Inbox, Archive, Trash2, User, Building, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getTaskEmailRequest, sendTaskEmailRequest, sendEmailToClientRequest } from '@/lib/http/task';
import { getAllProjectRequest } from '@/lib/http/project';
import { useUser } from '@/providers/UserProvider';
import { toast } from 'react-toastify';
import moment from 'moment';

const EnhancedMailModal = ({ isOpen, onClose }) => {
    const { user } = useUser();
    const [mails, setMails] = useState([]);
    const [selectedMail, setSelectedMail] = useState(null);
    const [mailLoading, setMailLoading] = useState(false);
    const [isSendMailModalOpen, setIsSendMailModalOpen] = useState(false);
    const [sendMailLoading, setSendMailLoading] = useState(false);
    const [projects, setProjects] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sendMailForm, setSendMailForm] = useState({
        recipientType: '',
        recipientId: '',
        subject: '',
        content: '',
        taskId: ''
    });

    // Fetch all mails
    const fetchMails = useCallback(async () => {
        setMailLoading(true);
        try {
            const res = await getTaskEmailRequest();
            setMails(res?.data?.emails || []);
        } catch (error) {
            console.log(error?.response?.data?.message || error?.message);
            setMails([]);
        } finally {
            setMailLoading(false);
        }
    }, []);

    // Fetch all projects
    const fetchProjects = useCallback(async () => {
        try {
            const res = await getAllProjectRequest();
            const { projects, collaboratedProjects } = res.data;
            setProjects([...projects, ...collaboratedProjects]);
        } catch (error) {
            console.log(error?.response?.data?.message || error?.message);
            setProjects(null);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchMails();
            fetchProjects();
        }
    }, [isOpen, fetchMails, fetchProjects]);

    // Get all team members from projects
    const getAllTeamMembers = useCallback(() => {
        if (!projects) return [];
        const teamMembers = new Map();

        projects.forEach(project => {
            project.Members?.forEach(member => {
                if (!teamMembers.has(member.user.user_id)) {
                    teamMembers.set(member.user.user_id, {
                        id: member.user.user_id,
                        name: member.user.name,
                        email: member.user.email,
                        type: 'team',
                        role: member.role,
                        projectName: project.name
                    });
                }
            });
        });

        return Array.from(teamMembers.values());
    }, [projects]);

    // Get all clients from projects
    const getAllClients = useCallback(() => {
        if (!projects) return [];
        const clients = new Map();

        projects.forEach(project => {
            project.Clients?.forEach(client => {
                if (!clients.has(client.project_client_id)) {
                    clients.set(client.project_client_id, {
                        id: client.project_client_id,
                        name: client.user.name,
                        email: client.user.email,
                        type: 'client',
                        projectName: project.name
                    });
                }
            });
        });

        return Array.from(clients.values());
    }, [projects]);

    // Get all tasks from projects
    const getAllTasks = useCallback(() => {
        if (!projects) return [];
        const tasks = [];

        projects.forEach(project => {
            project.Tasks?.forEach(task => {
                tasks.push({
                    id: task.task_id,
                    name: task.name,
                    projectName: project.name,
                    projectId: project.project_id
                });
            });
        });

        return tasks;
    }, [projects]);

    // Handle send mail
    const handleSendMail = useCallback(async (e) => {
        e.preventDefault();
        setSendMailLoading(true);

        try {
            const { recipientType, recipientId, subject, content, taskId } = sendMailForm;

            if (!recipientType || !recipientId || !subject || !content) {
                toast.error('Please fill in all required fields');
                return;
            }

            let formData;
            if (recipientType === 'client') {
                formData = {
                    task_id: taskId,
                    content,
                    subject,
                    client_id: recipientId
                };
                await sendEmailToClientRequest(formData);
            } else {
                formData = {
                    task_id: taskId,
                    content,
                    subject,
                    to_user: recipientId
                };
                await sendTaskEmailRequest(formData);
            }

            toast.success('Email sent successfully');
            setIsSendMailModalOpen(false);
            setSendMailForm({
                recipientType: '',
                recipientId: '',
                subject: '',
                content: '',
                taskId: ''
            });
            fetchMails(); // Refresh mails
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setSendMailLoading(false);
        }
    }, [sendMailForm, fetchMails]);

    // Filter mails based on user
    const inboxMails = mails.filter(mail => mail.to_user === user?.user_id);
    const sentMails = mails.filter(mail => mail.user_id === user?.user_id);

    // Filter mails based on search term
    const filteredMails = mails.filter(mail =>
        mail.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mail.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mail.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Send className="w-6 h-6 text-gray-600" />
                                <h2 className="text-xl font-semibold text-gray-800">Mail Center</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => setIsSendMailModalOpen(true)}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Mail
                                </Button>
                                <button
                                    onClick={onClose}
                                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-[85vh] overflow-y-auto p-6">
                        {selectedMail ? (
                            // Mail Detail View
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setSelectedMail(null)}
                                        className="flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Back to Inbox
                                    </Button>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Avatar>
                                            <AvatarFallback>{selectedMail.user?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold">{selectedMail.user?.name}</h3>
                                            <p className="text-sm text-gray-600">{selectedMail.user?.email}</p>
                                        </div>
                                        <div className="ml-auto text-sm text-gray-500">
                                            {moment(selectedMail.created_at).format('MMM DD, YYYY HH:mm')}
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-semibold mb-4">{selectedMail.subject}</h2>
                                    <div className="prose max-w-none">
                                        <p className="whitespace-pre-wrap">{selectedMail.content}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Mail List View
                            <div className="space-y-6">
                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search mails..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <Tabs defaultValue="all" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="all" className="flex items-center gap-2">
                                            <Inbox className="w-4 h-4" />
                                            All ({filteredMails.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="inbox" className="flex items-center gap-2">
                                            <Inbox className="w-4 h-4" />
                                            Inbox ({inboxMails.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="sent" className="flex items-center gap-2">
                                            <Send className="w-4 h-4" />
                                            Sent ({sentMails.length})
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="all" className="mt-6">
                                        {mailLoading ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                        ) : filteredMails.length > 0 ? (
                                            <div className="space-y-2">
                                                {filteredMails.map((mail) => (
                                                    <div
                                                        key={mail.email_id}
                                                        onClick={() => setSelectedMail(mail)}
                                                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                                    >
                                                        <Avatar>
                                                            <AvatarFallback>{mail.user?.name?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-medium truncate">{mail.user?.name}</h4>
                                                                <span className="text-sm text-gray-500">
                                                                    {moment(mail.created_at).format('MMM DD')}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 truncate">{mail.subject}</p>
                                                            <p className="text-xs text-gray-500 truncate">{mail.content}</p>
                                                        </div>
                                                        {mail.to_user === user?.user_id && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-gray-500">
                                                No mails found
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="inbox" className="mt-6">
                                        {mailLoading ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                        ) : inboxMails.length > 0 ? (
                                            <div className="space-y-2">
                                                {inboxMails.map((mail) => (
                                                    <div
                                                        key={mail.email_id}
                                                        onClick={() => setSelectedMail(mail)}
                                                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                                    >
                                                        <Avatar>
                                                            <AvatarFallback>{mail.user?.name?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-medium truncate">{mail.user?.name}</h4>
                                                                <span className="text-sm text-gray-500">
                                                                    {moment(mail.created_at).format('MMM DD')}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 truncate">{mail.subject}</p>
                                                            <p className="text-xs text-gray-500 truncate">{mail.content}</p>
                                                        </div>
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-gray-500">
                                                No incoming mails
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="sent" className="mt-6">
                                        {mailLoading ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                        ) : sentMails.length > 0 ? (
                                            <div className="space-y-2">
                                                {sentMails.map((mail) => (
                                                    <div
                                                        key={mail.email_id}
                                                        onClick={() => setSelectedMail(mail)}
                                                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                                    >
                                                        <Avatar>
                                                            <AvatarFallback>{mail.user?.name?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-medium truncate">{mail.user?.name}</h4>
                                                                <span className="text-sm text-gray-500">
                                                                    {moment(mail.created_at).format('MMM DD')}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 truncate">{mail.subject}</p>
                                                            <p className="text-xs text-gray-500 truncate">{mail.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-gray-500">
                                                No sent mails
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Send Mail Modal */}
            {isSendMailModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={() => setIsSendMailModalOpen(false)} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Send className="w-6 h-6 text-gray-600" />
                                        <h2 className="text-xl font-semibold text-gray-800">Send New Mail</h2>
                                    </div>
                                    <button
                                        onClick={() => setIsSendMailModalOpen(false)}
                                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleSendMail} className="space-y-6">
                                    {/* Recipient Type */}
                                    <div className="space-y-2">
                                        <Label htmlFor="recipientType">Recipient Type</Label>
                                        <Select
                                            value={sendMailForm.recipientType}
                                            onValueChange={(value) => setSendMailForm(prev => ({ ...prev, recipientType: value, recipientId: '' }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select recipient type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="team">Team Member</SelectItem>
                                                <SelectItem value="client">Client</SelectItem>
                                                <SelectItem value="new">New Recipient</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Recipient Selection */}
                                    {sendMailForm.recipientType === 'team' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="recipient">Select Team Member</Label>
                                            <Select
                                                value={sendMailForm.recipientId}
                                                onValueChange={(value) => setSendMailForm(prev => ({ ...prev, recipientId: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select team member" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>Team Members</SelectLabel>
                                                        {getAllTeamMembers().map((member) => (
                                                            <SelectItem key={member.id} value={member.id.toString()}>
                                                                <div className="flex items-center gap-2">
                                                                    <User className="w-4 h-4" />
                                                                    <span>{member.name}</span>
                                                                    <span className="text-xs text-gray-500">({member.projectName})</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {sendMailForm.recipientType === 'client' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="recipient">Select Client</Label>
                                            <Select
                                                value={sendMailForm.recipientId}
                                                onValueChange={(value) => setSendMailForm(prev => ({ ...prev, recipientId: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select client" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>Clients</SelectLabel>
                                                        {getAllClients().map((client) => (
                                                            <SelectItem key={client.id} value={client.id.toString()}>
                                                                <div className="flex items-center gap-2">
                                                                    <Building className="w-4 h-4" />
                                                                    <span>{client.name}</span>
                                                                    <span className="text-xs text-gray-500">({client.projectName})</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {sendMailForm.recipientType === 'new' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="recipient">Email Address</Label>
                                            <Input
                                                type="email"
                                                placeholder="Enter email address"
                                                value={sendMailForm.recipientId}
                                                onChange={(e) => setSendMailForm(prev => ({ ...prev, recipientId: e.target.value }))}
                                            />
                                        </div>
                                    )}

                                    {/* Task Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="task">Select Task (Optional)</Label>
                                        <Select
                                            value={sendMailForm.taskId}
                                            onValueChange={(value) => setSendMailForm(prev => ({ ...prev, taskId: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select task (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Tasks</SelectLabel>
                                                    {getAllTasks().map((task) => (
                                                        <SelectItem key={task.id} value={task.id.toString()}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{task.name}</span>
                                                                <span className="text-xs text-gray-500">({task.projectName})</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Subject */}
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            type="text"
                                            placeholder="Enter subject"
                                            value={sendMailForm.subject}
                                            onChange={(e) => setSendMailForm(prev => ({ ...prev, subject: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-2">
                                        <Label htmlFor="content">Message</Label>
                                        <Textarea
                                            id="content"
                                            placeholder="Enter your message"
                                            value={sendMailForm.content}
                                            onChange={(e) => setSendMailForm(prev => ({ ...prev, content: e.target.value }))}
                                            rows={6}
                                            required
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsSendMailModalOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={sendMailLoading}
                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            {sendMailLoading ? 'Sending...' : 'Send Mail'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedMailModal; 