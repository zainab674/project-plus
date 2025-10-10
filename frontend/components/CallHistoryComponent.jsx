import React from 'react'
import { Button } from './Button';
import AvatarCompoment from './AvatarCompoment';
import { Phone, UserPlus, Eye, FileText } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

const CallHistoryComponent = ({ history, makeCall, onSaveAsContact, contacts = [], onViewDetails }) => {
    // Helper function to check if a phone number exists in contacts
    const isNumberInContacts = (phoneNumber) => {
        return contacts.some(contact => contact.phone_number === phoneNumber);
    };

    return (
        <div className='space-y-5 mt-8'>

            {
                history && history.map((call, index) => {
                    const phoneNumber = call.to_number || call.number;
                    const hasContactName = call.contact_name && call.contact_name !== "Unknown";
                    const isInContacts = isNumberInContacts(phoneNumber);
                    
                    return (
                        <div key={`${call.call_id || call.timestamp || Date.now()}-${phoneNumber}-${index}`} className='flex items-center justify-between w-full shadow-md rounded-md border border-gray-50 px-2'>
                            <div 
                                className='flex items-center gap-4 p-2 flex-1 cursor-pointer hover:bg-gray-50 rounded-md transition-colors'
                                onClick={() => onViewDetails && onViewDetails(call)}
                            >
                                <AvatarCompoment name={call.contact_name || call.name || phoneNumber} className="!w-[4rem] !h-[4rem] text-3xl" />
                                <div className="flex-1">
                                    <h2 className='opacity-80 text-lg'>{call.contact_name || call.name || phoneNumber}</h2>
                                    <h2 className='opacity-50 text-sm mt-1'>{phoneNumber}</h2>
                                    <div className='flex items-center gap-2 mt-1'>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            call.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            call.status === 'ringing' ? 'bg-yellow-100 text-yellow-800' :
                                            call.status === 'failed' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {call.status || 'Unknown'}
                                        </span>
                                        {call.duration && (
                                            <span className='text-xs text-gray-500'>
                                                {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                                            </span>
                                        )}
                                        {call.description && (
                                            <span className='text-xs text-blue-500 flex items-center gap-1'>
                                                <Eye className="h-3 w-3" />
                                                Has notes
                                            </span>
                                        )}
                                        {call.transcript && (
                                            <span className='text-xs text-green-500 flex items-center gap-1'>
                                                <FileText className="h-3 w-3" />
                                                Transcribed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => makeCall(call.contact_name || call.name, phoneNumber)}>
                                    <Phone/>
                                </Button>
                                
                                {/* Only show "Save as Contact" if the number is not already in contacts and doesn't have a contact name */}
                                {!hasContactName && !isInContacts && onSaveAsContact && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuGroup>
                                                <DropdownMenuItem onClick={() => onSaveAsContact(phoneNumber)}>
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    Save as Contact
                                                </DropdownMenuItem>
                                            </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    );
                })
            }
        </div>

    )
}

export default CallHistoryComponent