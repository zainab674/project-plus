import React from 'react'
import { Card, CardContent } from './ui/card'
import moment from 'moment'
import AvatarCompoment from './AvatarCompoment'

const RenderTranscribtion = ({transcribtions,handleSelectedTranscibtion}) => {
  console.log(transcribtions,"transcribtions000000000")
  return (
    <div className='space-y-4'>
        {
            transcribtions?.map((transcribtion) => (
                <Card onClick={() => handleSelectedTranscibtion(transcribtion)} className='cursor-pointer' key={transcribtion?.transcribtion_id}>
                    <CardContent className='px-4 py-3'>
                       <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <AvatarCompoment name={transcribtion?.user?.name}/>
                            <h2 className='text-lg font-medium text-gray-900'>{transcribtion?.user?.name}</h2>
                          </div>
                            <time className='font-light text-gray-700 text-sm'>{moment(transcribtion?.created_at).calendar()}</time>
                       </div>
                          <h2 className='text-xl font-medium text-gray-900 my-2'>{transcribtion?.name}</h2>
                       <p className='text-gray-700 font-light leading-6 mt-3'>
                            {transcribtion?.Transcibtion?.slice(0,200)}...
                       </p>
                    </CardContent>
                </Card>
            ))
        }
    </div>
  )
}

export default RenderTranscribtion