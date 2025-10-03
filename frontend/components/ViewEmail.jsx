import React from 'react'
import { Button } from './Button'
import { MoveLeft } from 'lucide-react'
import moment from 'moment'
import AvatarCompoment from './AvatarCompoment'

const ViewEmail = ({ email, handleUnSelectedEmail }) => {
    if (!email) return
    return (
        <div className='px-2 py-3'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1'>
                    <Button 
                        variant="ghost" 
                        className="text-foreground-primary hover:bg-tbutton-bg hover:text-tbutton-text" 
                        onClick={handleUnSelectedEmail}
                    >
                        <MoveLeft />
                    </Button>
                    <AvatarCompoment name={email?.user?.name}/>
                    <h2 className='text-xl font-medium text-foreground-primary ml-1'>{email?.user?.name}</h2>
                </div>

                <time className='font-light text-foreground-secondary text-sm'>{moment(email?.created_at).calendar()}</time>
            </div>
            <h2 className='text-xl font-medium text-foreground-primary mt-6 mb-2 px-8'>{email?.subject}</h2>
            <p className='text-foreground-secondary font-light leading-6 mt-1 px-8'>
                {email?.content}
            </p>
        </div>
    )
}

export default ViewEmail