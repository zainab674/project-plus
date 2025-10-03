import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import moment from 'moment'

const RenderConnectMail = ({mails, selectedMail, setSelectedMail} ) => {
  return (
    <div className='px-2 py-4 space-y-10'>
        {
            mails?.map((mail) => (
                <Card className=' border-none shadow-gray-50 cursor-pointer' onClick={() => setSelectedMail(mail)}>
                    <CardContent className='p-3'>
                        <div className='flex justify-between items-center'>
                            <h4 className='text-2xl'>{mail.from}</h4>
                            <time className='text-gray-400 text-sm ml-3'>{moment(mail.date).format("DD MMM YYYY")}</time>
                        </div>
                        <h3 className='text-lg text-gray-700 mt-4'>{mail.subject}</h3>
                        <p className="text-sm text-gray-800 break-words mt-4">{mail.body.slice(0,150)}</p>
                    </CardContent>
                </Card>
            ))
        }
    </div>
  )
}

export default RenderConnectMail