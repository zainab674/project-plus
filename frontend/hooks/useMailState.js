import { useState, useCallback } from 'react';
import { getConnectMailsRequest } from '../lib/http/task';

// Custom hook for mail functionality
export const useMailState = () => {
  const [mails, setMails] = useState([]);
  const [mailLoading, setMailLoading] = useState(false);
  const [selectedMail, setSelectedMail] = useState(null);
  const [currentCount, setCurrentCount] = useState(100);

  const fetchMails = useCallback(async (count = 100) => {
    // Don't fetch if already loading or if we have recent data
    if (mailLoading) return;
    
    setMailLoading(true);
    try {
      const res = await getConnectMailsRequest(count);
      // Filter emails to only show those containing mananrajpout258@gmail.com
      const filteredMails = res.data.mails.filter(mail => {
        const searchTerm = 'mananrajpout258@gmail.com';
        const from = mail.from?.toLowerCase() || '';
        const to = mail.to?.toLowerCase() || '';
        const subject = mail.subject?.toLowerCase() || '';
        const body = mail.body?.toLowerCase() || '';

        return from.includes(searchTerm) ||
            to.includes(searchTerm) ||
            subject.includes(searchTerm) ||
            body.includes(searchTerm);
      });
      setMails(filteredMails);
      setCurrentCount(count);
    } catch (error) {
      console.error('Error fetching connected mails:', error);
      setMails([]);
    } finally {
      setMailLoading(false);
    }
  }, [mailLoading]);

  const loadMoreMails = useCallback(async () => {
    setMailLoading(true);
    try {
      const newCount = currentCount + 100;
      const res = await getConnectMailsRequest(newCount);
      // Filter emails to only show those containing mananrajpout258@gmail.com
      const filteredMails = res.data.mails.filter(mail => {
        const searchTerm = 'mananrajpout258@gmail.com';
        const from = mail.from?.toLowerCase() || '';
        const to = mail.to?.toLowerCase() || '';
        const subject = mail.subject?.toLowerCase() || '';
        const body = mail.body?.toLowerCase() || '';

        return from.includes(searchTerm) ||
            to.includes(searchTerm) ||
            subject.includes(searchTerm) ||
            body.includes(searchTerm);
      });
      setMails(filteredMails);
      setCurrentCount(newCount);
    } catch (error) {
      console.error('Error loading more mails:', error);
    } finally {
      setMailLoading(false);
    }
  }, [currentCount]);

  const handleConnectMailSuccess = useCallback(() => {
    // Refresh mails after successful connection
    fetchMails();
  }, [fetchMails]);

  return {
    mails,
    setMails,
    mailLoading,
    setMailLoading,
    selectedMail,
    setSelectedMail,
    currentCount,
    setCurrentCount,
    fetchMails,
    loadMoreMails,
    handleConnectMailSuccess,
  };
};
