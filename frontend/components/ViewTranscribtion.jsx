import React from 'react'
import { Button } from './Button'
import { MoveLeft } from 'lucide-react'
import moment from 'moment'
import AvatarCompoment from './AvatarCompoment'

const ViewTranscribtion = ({ transcribtion, handleUnSelectedTranscibtion }) => {
    if (!transcribtion) return
    return (
        <div className='px-2 py-3'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1'>
                    <Button variant="ghost" className={'text-gray-900'} onClick={handleUnSelectedTranscibtion}>
                        <MoveLeft />
                    </Button>
                    <AvatarCompoment name={transcribtion?.user?.name}/>
                    <h2 className='text-2xl font-medium text-gray-900 ml-1'>{transcribtion?.name}</h2>
                </div>

                <time className='font-light text-gray-700 text-sm'>{moment(transcribtion?.created_at).calendar()}</time>
            </div>

            <p className='text-gray-700 font-light leading-6 mt-3 px-8'>
                {transcribtion?.Transcibtion}
            </p>
        </div>
    )
}

export default ViewTranscribtion