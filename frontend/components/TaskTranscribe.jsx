import React, { useCallback, useState } from 'react'
import BigDialog from './Dialogs/BigDialog'
import RenderTranscribtion from './RenderTranscribtion';
import ViewTranscribtion from './ViewTranscribtion';
import { Button } from './Button';
import FormTranscribtion from './FormTranscribtion';

const TaskTranscibe = ({open,onClose,transcribtions,task,getTaskById}) => {
    // list,view,form 
  const [activeSection,setActiveSection] = useState("list");
  const [selectedTranscibtion, setSelectedTranscribtion] = useState(null);

  const handleSelectedTranscibtion = useCallback((transcribtion) => {
    setSelectedTranscribtion(transcribtion);
    setActiveSection("view");
  },[]);

  const handleUnSelectedTranscibtion = useCallback(() => {
    setSelectedTranscribtion(null);
    setActiveSection("list");
  },[]);


  const handleOpenTranscibtionForm = useCallback(() => {
    setSelectedTranscribtion(null);
    setActiveSection("form");
  },[]);

  const handleCloseTranscibtionForm = useCallback(() => {
    setSelectedTranscribtion(null);
    setActiveSection("list");
  },[]);


  return (
    <BigDialog open={open} onClose={onClose}>
        <div className='absolute top-0 left-0 py-4 px-4'>
          <Button className={'bg-transparent border bg-blue-500 text-white hover:bg-blue-600'} onClick={handleOpenTranscibtionForm}>
            Transcibtion
          </Button>
        </div>
        <div className='h-[35rem] overflow-y-auto mt-2'>
        {
            activeSection == "list" &&
            <RenderTranscribtion transcribtions={transcribtions} handleSelectedTranscibtion={handleSelectedTranscibtion}/>
        }
        {
            activeSection == "view" &&
            <ViewTranscribtion transcribtion={selectedTranscibtion} handleUnSelectedTranscibtion={handleUnSelectedTranscibtion}/>
        }
        {
            activeSection == "form" &&
            <FormTranscribtion handleCloseTranscibtionForm={handleCloseTranscibtionForm} task={task} getTaskById={getTaskById}/>
        }
        </div>
        
    </BigDialog>
  )
}

export default TaskTranscibe