import React from 'react'
import AvatarCompoment from './AvatarCompoment'
import moment from 'moment'

const RenderMemberDetails = ({ members }) => {
    console.log(members)

    const getLegalRoleDisplay = (member) => {
        if (member.legalRole === 'CUSTOM' && member.customLegalRole) {
            return member.customLegalRole;
        }
        if (member.legalRole) {
            return member.legalRole.replace('_', ' '); // Convert TEAM_LEAD to "Team Lead"
        }
        return null;
    };

    return (
        <div className='space-y-5 overflow-x-auto h-[30rem]'>
            {
                members && members.map(member => (
                    <div key={member.project_member_id} className='flex items-center justify-between w-full shadow-md rounded-md border border-primary bg-white px-2'>
                        <div className='flex items-center gap-4 p-2'>
                            <AvatarCompoment name={member?.user?.name} className="!w-[4rem] !h-[4rem] text-3xl" />
                            <div>
                                <h2 className='text-black text-lg'>{member?.user?.name}</h2>
                                <div className='flex items-center gap-2 mt-1'>
                                    <h2 className='text-black text-sm uppercase'>{member?.role}</h2>
                                    {getLegalRoleDisplay(member) && (
                                        <>
                                            <span className='text-black text-sm'>•</span>
                                            <h2 className='text-black text-sm font-medium'>{getLegalRoleDisplay(member)}</h2>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className='text-black'>Joined on</p>
                            <time className='text-black text-sm'>{moment(member.added_at).format("DD MMM YYYY")}</time>
                        </div>
                    </div>
                ))
            }
        </div>
    )
}

export default RenderMemberDetails