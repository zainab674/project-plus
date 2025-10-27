import { useState } from 'react';

// Custom hook for send mail functionality
export const useSendMailState = () => {
  const [sendMailLoading, setSendMailLoading] = useState(false);
  const [sendMailDataLoading, setSendMailDataLoading] = useState(false);
  const [sendMailForm, setSendMailForm] = useState({
    recipientType: '',
    recipientId: '',
    subject: '',
    content: '',
    taskId: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  return {
    sendMailLoading,
    setSendMailLoading,
    sendMailDataLoading,
    setSendMailDataLoading,
    sendMailForm,
    setSendMailForm,
    selectedFile,
    setSelectedFile,
  };
};
