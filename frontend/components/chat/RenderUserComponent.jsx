import React, { useCallback } from 'react'
import AvatarCompoment from '../AvatarCompoment'
import { Badge } from '../ui/badge'

const RenderUserComponent = ({ users, handleSelectChat, searchUser, query, setUser, setQuery, searchLoading }) => {
    const handleSelectUser = useCallback((user) => {
        setUser(prev => [...prev, user]);
        handleSelectChat(user);
        setQuery("");
    }, [])

    const getRoleBadge = (user) => {
        if (user.role && user.memberType) {
            let roleColor = 'bg-gray-100 text-gray-800';
            let roleText = user.role;
            
            if (user.role === 'LEADER') {
                roleColor = 'bg-blue-100 text-blue-800';
            } else if (user.role === 'MEMBER') {
                roleColor = 'bg-green-100 text-green-800';
            }
            
            return (
                <Badge className={`text-xs ${roleColor}`}>
                    {roleText}
                </Badge>
            );
        }
        return null;
    };

    const renderUser = (user, onClickHandler) => (
        <div 
            key={user.email} 
            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100" 
            onClick={onClickHandler}
        >
            <AvatarCompoment name={user.name} />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    {getRoleBadge(user)}
                </div>
                <p className="text-sm text-gray-600">{user.active_status || 'Online'}</p>
            </div>
        </div>
    );

    return (
        <>
            {
                query && searchUser.length != 0 && searchUser?.map((user) => 
                    renderUser(user, () => handleSelectUser(user))
                )
            }

            {
                !searchLoading && query && searchUser.length == 0 &&
                <div className='h-full flex items-center justify-center'>
                    <h2 className='text-xl font-normal text-gray-700'>NO USER FOUND</h2>
                </div>
            }

            {
                searchLoading && query && searchUser.length == 0 &&
                <div className='h-full flex items-center justify-center'>
                    <h2 className='text-xl font-normal text-gray-700'>Searching...</h2>
                </div>
            }

            {
                !query && users?.map((user) => 
                    renderUser(user, () => handleSelectChat(user))
                )
            }

            {
                !query && users.length == 0 &&
                <div className='h-full flex items-center justify-center'>
                    <h2 className='text-xl font-normal text-gray-700'>NO CHAT FOUND SEARCH USER AND START CHAT</h2>
                </div>
            }
        </>
    )
}

export default RenderUserComponent