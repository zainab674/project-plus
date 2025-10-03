import React, { useCallback, useState } from 'react'
import BigDialog from './Dialogs/BigDialog'
import RenderEmails from './RenderEmails';
import { Button } from './Button';
import ViewEmail from './ViewEmail';
import FormEmail from './FromEmial';

const TaskEmails = ({open,onClose,emails,task,getTaskById }) => {
  const [activeSection,setActiveSection] = useState("list");
  const [selectedEmail, setSelectedEmail] = useState(null);

  const handleSelectedMail = useCallback((transcribtion) => {
    setSelectedEmail(transcribtion);
    setActiveSection("view");
  },[]);

  const handleUnSelectedEmail = useCallback(() => {
    setSelectedEmail(null);
    setActiveSection("list");
  },[]);


  const handleOpenMailForm = useCallback(() => {
    setSelectedEmail(null);
    setActiveSection("form");
  },[]);

  const handleCloseMailForm = useCallback(() => {
    setSelectedEmail(null);
    setActiveSection("list");
  },[]);
  return (
    <BigDialog open={open} onClose={onClose}>
        <div className='absolute top-0 left-0 py-4 px-4'>
          <Button className={'bg-transparent border bg-blue-500 text-white hover:bg-blue-600'} onClick={handleOpenMailForm}>
            Send Mail
          </Button>
        </div>
        <div className='h-[35rem] overflow-y-auto mt-2'>
        {
            activeSection == "list" &&
            <RenderEmails emails={emails} handleSelectedMail={handleSelectedMail}/>
        }
        {
            activeSection == "view" &&
            <ViewEmail email={selectedEmail} handleUnSelectedEmail={handleUnSelectedEmail}/>
        }
        {
            activeSection == "form" &&
            <FormEmail handleCloseMailForm={handleCloseMailForm} task={task} getTaskById={getTaskById}/>
        }
        </div>
    </BigDialog>
  )
}

export default TaskEmails