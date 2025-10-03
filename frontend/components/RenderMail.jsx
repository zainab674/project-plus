import React from 'react'
import { Card, CardContent } from './ui/card'
import RenderMembers from './RenderMembers'
import moment from 'moment'
import { Clock } from 'lucide-react'
import RenderTranscibtionChat from './RenderTranscibtionChat'
import AvatarCompoment from './AvatarCompoment'

const RenderMail = ({mails, selectedMail, setSelectedMail} ) => {
  return (
    <div className='px-2 py-4 space-y-6'>
        {
            mails?.map((mail) => (
                <Card 
                    className='border border-primary bg-primary hover:shadow-md transition-all duration-300 cursor-pointer' 
                    onClick={() => setSelectedMail(mail)}
                >
                    <CardContent className='p-6'>
                        <div className='flex justify-between items-center'>
                            <div className='flex items-center gap-2'>
                                <AvatarCompoment name={mail.user.name}/>
                                <h3 className='text-foreground-primary text-md font-medium'>{mail.user.name}</h3>
                            </div>
                            <time className='text-foreground-secondary text-sm ml-3'>{moment(mail.created_at).format("DD MMM YYYY")}</time>
                        </div>
                        <h3 className='text-xl text-foreground-primary mt-4'>{mail.subject}</h3>
                        <p className='text-foreground-secondary leading-5 mt-2 text-md'>{mail.content.slice(0,200)}</p>
                    </CardContent>
                </Card>
            ))
        }
    </div>
  )
}

export default RenderMail