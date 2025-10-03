import { getNameAvatar } from '@/utils/getNameAvatar'
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { getColorByFirstLetter } from '@/utils/getColorByFirstLetter'



const AvatarCompoment = ({ name,color,...props}) => {

    return (
        <Avatar  {...props} className={`!w-[2rem] !h-[2rem] ${props.className}`}>
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" /> 
            <AvatarFallback className={`text-white`} style={{background: getColorByFirstLetter(name)}}>
                {getNameAvatar(name)}
            </AvatarFallback>
        </Avatar>
    )
}

export default AvatarCompoment