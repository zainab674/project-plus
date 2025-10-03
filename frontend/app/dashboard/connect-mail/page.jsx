'use client';
import { Button } from '@/components/Button';
import ConnectMailBox from '@/components/mail/ConnectMailBox';
import RenderConnectMail from '@/components/mail/RenderConnetMail';
import { getConnectMailsRequest } from '@/lib/http/task';
import { manualEmailPollRequest } from '@/lib/http/task';
import { useUser } from '@/providers/UserProvider'
import { ArchiveRestore, ArrowLeftToLine, ArrowRightToLine, Info, MoveLeft, Trash2, UndoDot } from 'lucide-react'
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify';

const page = () => {
    const [connectMailOpen, setConnectMailOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [mails, setMails] = useState([]);
    const [selectedMail, setSelectedMail] = useState(null);
    const [currentCount, setCurrentCount] = useState(100);
    const { user } = useUser();



    const getMails = useCallback(async (count = 100) => {
        setLoading(true);
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
            toast.error(error.response?.data.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMoreMails = useCallback(async () => {
        setLoadingMore(true);
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
            toast.error(error.response?.data.message);
        } finally {
            setLoadingMore(false);
        }
    }, [currentCount]);

    const handleManualPoll = useCallback(async () => {
        try {
            const res = await manualEmailPollRequest();
            toast.success(res.data.message);
            getMails(); // Refresh the email list
        } catch (error) {
            toast.error(error.response?.data.message || 'Failed to poll emails');
        }
    }, [getMails]);



    useEffect(() => {
        getMails()
    }, [user]);

    console.log(selectedMail)

    return (
        <>
            <div className="flex h-screen flex-col bg-white m-2 rounded-md overflow-auto">
                <div className="flex flex-col gap-4 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-4xl font-semibold">{"Connect Mail"}</h1>
                            <Info className="h-4 w-4 text-gray-400" />
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                Filtered: mananrajpout258@gmail.com ({mails.length} emails)
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={handleManualPoll}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                🔄 Manual Poll
                            </Button>
                        </div>

                        {
                            user?.connect_mail_hash &&
                            <Button className={'bg-blue-500 text-white hover:bg-blue-600'} onClick={() => setConnectMailOpen(true)}>
                                Connect New Mail
                            </Button>
                        }
                    </div>


                    {
                        selectedMail &&

                        <div className="flex h-screen w-full flex-col bg-white m-2 rounded-md overflow-y-auto items-start p-8">
                            <div className="flex items-center justify-between w-full">
                                <Button variant="ghost" className={'text-gray-900'} onClick={() => setSelectedMail(null)}>
                                    <MoveLeft size={40} />
                                </Button>

                                <div className="flex items-center gap-4">
                                    <Button size='icon' variant='ghost' className='text-gray-600'>
                                        <ArrowLeftToLine />
                                    </Button>
                                    <Button size='icon' variant='ghost' className='text-gray-600'>
                                        <UndoDot />
                                    </Button>
                                    <Button size='icon' variant='ghost' className='text-gray-600'>
                                        <ArrowRightToLine />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button variant='ghost' className='text-gray-600'>
                                        <ArchiveRestore />
                                        Move To...
                                    </Button>
                                    <Button size='icon' variant='ghost' className='text-gray-600'>
                                        <Trash2 />
                                    </Button>
                                </div>
                            </div>
                            <div className='flex justify-between items-center mt-8 w-full'>

                                <div className='flex items-center gap-2'>
                                    <h4 className='text-2xl'>{selectedMail.from}</h4>
                                </div>
                                <time className='text-gray-500 text-sm'>{moment(selectedMail.date).format("DD MMM YYYY")}</time>
                            </div>
                            <h2 className="mt-8 text-3xl to-gray-500 font-medium">{selectedMail?.subject?.toUpperCase()}</h2>
                            <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words mt-4">
                                {selectedMail?.body || "No Content Available"}
                            </pre>
                        </div>
                    }


                    {
                        loading &&
                        <div className='flex items-center justify-center h-[70vh]'>

                            <div class="flex-col gap-4 w-full flex items-center justify-center">
                                <div
                                    class="w-20 h-20 border-4 border-transparent text-blue-400 text-4xl animate-spin flex items-center justify-center border-t-blue-400 rounded-full"
                                >
                                    <div
                                        class="w-16 h-16 border-4 border-transparent text-red-400 text-2xl animate-spin flex items-center justify-center border-t-red-400 rounded-full"
                                    ></div>
                                </div>
                            </div>

                        </div>
                    }

                    {
                        !user?.connect_mail_hash && !loading && mails.length === 0 &&
                        <div className='flex items-center justify-center h-[70vh]'>
                            <Button className={'bg-blue-500 text-white hover:bg-blue-600'} onClick={() => setConnectMailOpen(true)}>
                                Connect Mail
                            </Button>
                        </div>
                    }


                    {
                        mails.length == 0 && !loading &&
                        <div className='flex items-center justify-center h-[70vh]'>
                            <h1 className='text-2xl'>No Email Found</h1>
                        </div>
                    }

                    {
                        mails.length != 0 && !selectedMail &&
                        <div className='mt-10'>
                            <RenderConnectMail mails={mails} selectedMail={selectedMail} setSelectedMail={setSelectedMail} />
                            
                            {/* Load More Button */}
                            <div className="mt-6 flex justify-center">
                                <Button 
                                    onClick={loadMoreMails}
                                    disabled={loadingMore}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                                >
                                    {loadingMore ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Loading More...
                                        </div>
                                    ) : (
                                        `Load More Emails (Currently showing ${mails.length} filtered emails)`
                                    )}
                                </Button>
                            </div>
                        </div>
                    }

                </div>
            </div>
            <ConnectMailBox open={connectMailOpen} onClose={() => setConnectMailOpen(false)} />
        </>
    )
}

export default page