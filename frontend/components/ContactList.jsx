import React from 'react'
import { Input } from './ui/input'
import AvatarCompoment from './AvatarCompoment'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSubContent,
    DropdownMenuTrigger,
    DropdownMenuPortal,
    DropdownMenuSubTrigger,
    DropdownMenuSub
} from "@/components/ui/dropdown-menu";
import { Clock, Delete, Edit, MoreVertical, PhoneCall, Trash } from 'lucide-react';

const ContactList = ({ contact, makeCall, setToNumber, setCallInfo }) => {
   
    return (
       
            <div className='space-y-5 mt-8'>
                {
                    contact && contact.map(con => (
                        <div key={con.contact_id || con.name} className='flex items-center justify-between w-full shadow-md rounded-md border border-gray-50'>
                            <div className='flex items-center gap-4 p-2'>
                                <AvatarCompoment name={con.name} className="!w-[4rem] !h-[4rem] text-3xl" />
                                <div>
                                    <h2 className='opacity-80 text-lg'>{con.name}</h2>
                                    <h2 className='opacity-50 text-sm mt-1'>{con.phone_number}</h2>
                                    {con.company && (
                                        <h3 className='opacity-40 text-xs mt-1'>{con.company}</h3>
                                    )}
                                    {con.is_favorite && (
                                        <span className='text-yellow-500 text-xs'>⭐ Favorite</span>
                                    )}
                                </div>
                            </div>


                            <DropdownMenu>
                                <DropdownMenuTrigger asChild className='hover:bg-transparent'>

                                    <MoreVertical size={20} />

                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 mr-2 mt-2">
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem className="cursor-pointer" onClick={() =>  makeCall(con.name, con.phone_number)}>
                                            <PhoneCall />
                                            <span className='text-black/70'>Call</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <Clock />
                                            <span className='text-black/70'>Call History</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <Edit />
                                            <span className='text-black/70'>Rename</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <Trash />
                                            <span className='text-black/70'>Delete</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                        </div>
                    ))
                }


            </div>
        
    )
}

export default ContactList