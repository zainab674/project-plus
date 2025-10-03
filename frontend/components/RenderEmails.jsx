import React from 'react'
import { Card, CardContent } from './ui/card'
import moment from 'moment'
import AvatarCompoment from './AvatarCompoment'

const RenderEmails = ({emails,handleSelectedMail}) => {
  return (
    <div className='space-y-4'>
        {
            emails?.map((mail) => (
                <Card onClick={() => handleSelectedMail(mail)} className='cursor-pointer' key={mail?.wmail_id}>
                    <CardContent className='px-4 py-3'>
                       <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <AvatarCompoment name={mail?.user?.name}/>
                            <h2 className='text-lg font-medium text-gray-900'>{mail?.user?.name}</h2>
                          </div>
                            <time className='font-light text-gray-700 text-sm'>{moment(mail?.created_at).calendar()}</time>
                       </div>
                          <h2 className='text-xl font-medium text-gray-900 mt-5 mb-1'>{mail?.subject}</h2>
                       <p className='text-gray-700 font-light leading-6 mt-1'>
                            {mail?.content?.slice(0,200)}...
                       </p>
                    </CardContent>
                </Card>
            ))
        }
    </div>
  )
}

export default RenderEmails