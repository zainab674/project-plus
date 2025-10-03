import { taskProgress } from '@/contstant/taskProgressConstant'
import React, { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from './ui/card'
import AvatarCompoment from './AvatarCompoment'
import moment from 'moment'
import { getTaskProgressRequest } from '@/lib/http/task'

const RenderTaskProgress = ({task_id,date}) => {
  const [progress, setProgress] = useState([]);

  const getTaskProgress = useCallback(async () => {
    try {
      const res = await getTaskProgressRequest(task_id,date);
      setProgress(res.data.progresss);
    } catch (error) {
      console.log(error?.response?.data?.meesage || error?.meesage);
    }
  },[date]);


  useEffect(() => {
    getTaskProgress()
  },[date]);
  return (
    <div className='mt-8 p-2 space-y-7'>
        {
          progress.map(progress => (
            <Card className='cursor-pointer border-none shadow-gray-50'>
                    <CardContent className='p-3'>
                        <div className='flex justify-between items-center'>
                            
                            <div className='flex items-center gap-2'>
                                <AvatarCompoment name={progress.user.name}/>
                                <h3 className='text-gray-700 text-lg'>{progress.user.name}</h3>
                            </div>
                            <time className='font-light text-gray-700 text-sm'>{moment(progress.created_at).format("DD MMM YYYY")}</time>
                        </div>
                        <p className='text-gray-500 leading-5 mt-4 ml-2'>{progress.message}</p>
                    </CardContent>
                </Card>
          ))
        }

        {
          progress && progress.length == 0 &&
          <div className='flex items-center justify-center mt-10'>
            <h2 className='text-gray-600 text-lg'>No Progress on {date}</h2>
          </div>
        }
    </div>
  )
}

export default RenderTaskProgress