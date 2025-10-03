import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Button } from './Button'
import { toast } from 'react-toastify';
import { createProjectRequest } from '@/lib/http/project';
import { getTeamMembersRequest } from '@/lib/http/auth';
import { useUser } from '@/providers/UserProvider';
import { Avatar, AvatarFallback } from './ui/avatar';
import { getNameAvatar } from '@/utils/getNameAvatar';
import { Checkbox } from './ui/checkbox';
import { Users } from 'lucide-react';

import dynamic from 'next/dynamic'
import { Textarea } from './ui/textarea';
const JoditEditor = dynamic(
    () => import('jodit-react'),
    { ssr: false }
)

const CreateProject = ({ onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
    const [formdata, setFormdata] = useState({
        name: '',
        description: '',
        opposing: '',
        client_name: '',
        client_address: ''
    });
    const { loadUser } = useUser();

    const editor = useRef(null);
    const config = useMemo(() => ({
        placeholder: "Add description",
        height: 300,
        theme: 'default',
        buttons: [
            'source', '|',
            'bold', 'italic', 'underline', 'strikethrough', '|',
            'font', 'fontsize', 'brush', 'paragraph', '|',
            'image', 'table', 'link', '|',
            'align', '|',
            'undo', 'redo', '|',
            'hr', 'eraser', 'copyformat', '|',
            'symbol', 'fullsize', 'print', 'about'
        ],
        style: {
            background: 'white',
            color: 'black'
        }
    }), []);

    // Load team members on component mount
    useEffect(() => {
        const loadTeamMembers = async () => {
            try {
                const response = await getTeamMembersRequest();
                setTeamMembers(response.data.teamMembers || []);
            } catch (error) {
                console.error('Error loading team members:', error);
            }
        };
        loadTeamMembers();
    }, []);

    const handleFormChange = useCallback((e) => {
        setFormdata(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const contentFieldChanaged = (data) => {
        setFormdata(prev => ({ ...prev, description: data }))
    }

    const handleTeamMemberToggle = (memberId) => {
        setSelectedTeamMembers(prev => {
            if (prev.includes(memberId)) {
                return prev.filter(id => id !== memberId);
            } else {
                return [...prev, memberId];
            }
        });
    };

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const projectData = {
                ...formdata,
                selectedTeamMembers
            };
            const res = await createProjectRequest(projectData);
            toast.success(res?.data?.message);
            await loadUser();
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [formdata, selectedTeamMembers]);

    return (
        <div className="flex-1 flex items-center justify-center px-4">
            <div className="w-full space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-semibold text-foreground-primary">Create New Cases</h1>
                    <p className="text-foreground-secondary">Create a new case to manage your client legal matters.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground-primary">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            name="name"
                            placeholder="Enter your project name"
                            value={formdata.name}
                            onChange={handleFormChange}
                            required
                            className="bg-white border-primary text-black placeholder:text-gray-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground-primary">Client Name</Label>
                        <Input
                            id="client_name"
                            type="text"
                            name="client_name"
                            placeholder="Enter client name"
                            value={formdata.client_name}
                            onChange={handleFormChange}
                            required
                            className="bg-white border-primary text-black placeholder:text-gray-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground-primary">Client Address</Label>
                        <Input
                            id="client_address"
                            type="text"
                            name="client_address"
                            placeholder="Enter your project name"
                            value={formdata.client_address}
                            onChange={handleFormChange}
                            required
                            className="bg-white border-primary text-black placeholder:text-gray-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground-primary">Opposing Party</Label>
                        <Input
                            id="name"
                            type="text"
                            name="opposing"
                            placeholder="Enter your project name"
                            value={formdata.opposing}
                            onChange={handleFormChange}
                            required
                            className="bg-white border-primary text-black placeholder:text-gray-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-foreground-primary">Description</Label>
                        <div className="border border-primary rounded-md overflow-hidden">
                            <Textarea
                                className="bg-white border-primary text-black placeholder:text-gray-400"
                                placeholder="Case Description"
                                value={formdata.description}
                                onChange={handleFormChange}
                                name="description"
                            >
                            </Textarea>
                        </div>
                    </div>

                    {/* Team Members Selection */}
                    {teamMembers.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-foreground-primary flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Add Team Members (Optional)
                            </Label>
                            <div className="border border-primary rounded-md p-4 bg-white">
                                <p className="text-sm text-gray-600 mb-3">
                                    Select team members to add to this project:
                                </p>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {teamMembers.map((member) => (
                                        <div key={member.user.user_id} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`member-${member.user.user_id}`}
                                                checked={selectedTeamMembers.includes(member.user.user_id)}
                                                onCheckedChange={() => handleTeamMemberToggle(member.user.user_id)}
                                            />
                                            <Avatar className="w-8 h-8">
                                                <AvatarFallback className="bg-primary/10 text-black">
                                                    {getNameAvatar(member.user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <label
                                                    htmlFor={`member-${member.user.user_id}`}
                                                    className="text-sm font-medium text-black cursor-pointer"
                                                >
                                                    {member.user.name}
                                                </label>
                                                <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all disabled:opacity-40"
                        disabled={isLoading}
                        isLoading={isLoading}
                    >
                        Create
                    </Button>
                </form>
            </div>
        </div>
    )
}

export default CreateProject
