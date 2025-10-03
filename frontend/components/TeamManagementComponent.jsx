import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './Button';
import { getTeamMembersRequest, deleteTeamMemberRequest } from '@/lib/http/auth';
import { toast } from 'react-toastify';
import TeamInviteComponent from './TeamInviteComponent';
import { UserPlus, Users, Trash2 } from 'lucide-react';
import AvatarCompoment from './AvatarCompoment';

const TeamManagementComponent = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const fetchTeamMembers = async () => {
        try {
            const response = await getTeamMembersRequest();
            setTeamMembers(response.data.teamMembers);
        } catch (error) {
            toast.error('Failed to fetch team members');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const handleDeleteMember = async (teamMemberId, memberName) => {
        if (window.confirm(`Are you sure you want to remove ${memberName} from your team?`)) {
            try {
                await deleteTeamMemberRequest(teamMemberId);
                toast.success('Team member removed successfully');
                fetchTeamMembers();
            } catch (error) {
                toast.error(error?.response?.data?.message || 'Failed to remove team member');
            }
        }
    };

    const getRoleDisplayName = (role, legalRole, customLegalRole) => {
        if (role === 'BILLER') {
            if (legalRole === 'CUSTOM' && customLegalRole) {
                return customLegalRole;
            }
            return legalRole ? legalRole.replace('_', ' ') : 'Biller';
        }
        return role === 'TEAM' ? 'Team Member' : role;
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <CardTitle>Team Members</CardTitle>
                    </div>
                    <Button 
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2"
                    >
                        <UserPlus className="h-4 w-4" />
                        Invite Member
                    </Button>
                </CardHeader>
                <CardContent>
                    {teamMembers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No team members yet</p>
                            <p className="text-sm">Invite team members to start collaborating</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {teamMembers.map((member) => (
                                <div 
                                    key={member.team_member_id} 
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <AvatarCompoment 
                                            name={member.user.name} 
                                            size="md"
                                        />
                                        <div>
                                            <h3 className="font-medium">{member.user.name}</h3>
                                            <p className="text-sm text-gray-500">{member.user.email}</p>
                                            <p className="text-xs text-blue-600 font-medium">
                                                {getRoleDisplayName(member.role, member.legalRole, member.customLegalRole)}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteMember(member.team_member_id, member.user.name)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <TeamInviteComponent 
                open={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onSuccess={() => {
                    fetchTeamMembers();
                    setShowInviteModal(false);
                }}
            />
        </div>
    );
};

export default TeamManagementComponent; 