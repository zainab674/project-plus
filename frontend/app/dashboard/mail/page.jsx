"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ArchiveRestore,
    ArrowLeftToLine,
    ArrowRightToLine,
    Delete,
    Forward,
    Info,
    MoveLeft,
    Plus,
    Search,
    Settings,
    Trash,
    Trash2,
    UndoDot,
} from "lucide-react"
import { Select, SelectGroup, SelectLabel, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { constantMeeting } from "@/contstant/contantMeeting"
import RenderMail from "@/components/RenderMail"
import { constantMails } from "@/contstant/constantMail"
import AvatarCompoment from "@/components/AvatarCompoment"
import moment from "moment"
import SendMail from "@/components/SendMail"
import { getTaskEmailRequest } from "@/lib/http/task"
import { useUser } from "@/providers/UserProvider"
import { getRecentDatesWithLabels } from "@/utils/getRecentDatesWithLabels"
import SendMailClient from "@/components/SendMailClient"
import ConnectMailBox from "@/components/mail/ConnectMailBox"
import { formatEmailBody } from "@/components/formatEmail"
import DOMPurify from "dompurify"
import EmailNotificationService from "@/services/emailNotificationService"
import EmailBadge from "@/components/mail/EmailBadge"
import { showEmailNotificationToast } from "@/components/mail/EmailNotificationToast"
import { useEmailNotifications } from "@/providers/EmailNotificationProvider"
import { toast } from "react-toastify"

export default function Page() {
    const [sendMail, setSendMail] = useState(false);
    const [sendMailClient, setSendMailClient] = useState(false);
    const [connectMailOpen, setConnectMailOpen] = useState(false);
    const [selectedMail, setSelectedMail] = useState(null);
    const [mails, setMails] = useState([]);
    const [date, setDate] = useState(null);
    const [dates, setDates] = useState(getRecentDatesWithLabels(100));
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [hasNewEmails, setHasNewEmails] = useState(false);
    const { user } = useUser();
    
    // Use global email notification context
    const { 
        unreadCount, 
        isConnected, 
        emailService,
        markEmailAsRead,
        markEmailAsUnread,
        deleteEmail,
        archiveEmail
    } = useEmailNotifications();

    // Initialize email notification service
    useEffect(() => {
        if (user?.user_id) {
            // The EmailNotificationService is now managed globally by EmailNotificationProvider
            // No need to re-initialize or set up callbacks here unless specific global callbacks are needed.
            // The EmailNotificationProvider handles the onNewEmail and onEmailCountUpdate callbacks.
        }
    }, [user?.user_id]);

    // Listen for real-time email updates from global context
    useEffect(() => {
        console.log('🔍 Mail page: emailService changed:', emailService);
        console.log('🔍 Mail page: isConnected:', isConnected);
        
        if (emailService) {
            console.log('🔍 Mail page: Setting up new email listener');
            
            // Set up a listener for new emails that updates the local mail list
            const handleNewEmail = (notification) => {
                console.log('📧 Mail page received new email notification:', notification);
                
                if (notification.emails && notification.emails.length > 0) {
                    // Update mails list with new emails
                    setMails(prevMails => {
                        const newMails = [...notification.emails, ...prevMails];
                        // Remove duplicates based on email_id
                        const uniqueMails = newMails.filter((mail, index, self) => 
                            index === self.findIndex(m => m.email_id === mail.email_id)
                        );
                        return uniqueMails;
                    });
                    
                    // Set new email indicator
                    setHasNewEmails(true);
                    
                    // Clear the indicator after 5 seconds
                    setTimeout(() => {
                        setHasNewEmails(false);
                    }, 5000);
                    
                    // Automatically refresh the mail list to get the latest data
                    setTimeout(() => {
                        getAllMail();
                    }, 1000);
                }
            };

            // Add the listener to the email service
            emailService.onNewEmail(handleNewEmail);
            console.log('🔍 Mail page: New email listener set up successfully');

            return () => {
                // Clean up the listener
                if (emailService.removeListener) {
                    emailService.removeListener('new_emails', handleNewEmail);
                }
            };
        } else {
            console.log('⚠️ Mail page: No emailService available');
        }
    }, [emailService, getAllMail]);

    // Debug real-time connection status
    useEffect(() => {
        console.log('🔍 Mail page: Connection status changed:', isConnected);
        if (emailService) {
            console.log('🔍 Mail page: Email service connection status:', emailService.isConnected());
        }
    }, [isConnected, emailService]);

    const getAllMail = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await getTaskEmailRequest(date);
            setMails(res?.data?.emails || []);
            setLastUpdated(new Date());
            
            // Update unread count
            if (res?.data?.emails) {
                const unread = res.data.emails.filter(mail => !mail.is_read).length;
                // setUnreadCount(unread); // This is now managed by the global context
            }
        } catch (error) {
            console.log(error?.response?.data?.message || error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [date]);

    useEffect(() => {
        getAllMail();
    }, [date]);

    // Set up real-time refresh for emails
    useEffect(() => {
        if (user?.user_id) {
            // Refresh emails every 30 seconds to catch any missed real-time updates
            const refreshInterval = setInterval(() => {
                getAllMail();
            }, 30000); // 30 seconds

            return () => {
                clearInterval(refreshInterval);
            };
        }
    }, [user?.user_id, getAllMail]);

    // Handle viewing email from notification
    const handleViewEmailFromNotification = (notification) => {
        if (notification.emails && notification.emails.length > 0) {
            // Find the first email in the mails list
            const emailToView = mails.find(mail => 
                notification.emails.some(notifEmail => notifEmail.email_id === mail.email_id)
            );
            
            if (emailToView) {
                setSelectedMail(emailToView);
                // Mark as read
                if (!emailToView.is_read) {
                    markEmailAsRead(emailToView.email_id);
                }
            }
        }
    };

    // Handle email operations
    const handleEmailOperation = (operation, emailId) => {
        switch (operation) {
            case 'mark_read':
                markEmailAsRead(emailId);
                // Update local state immediately
                setMails(prev => prev.map(mail => 
                    mail.email_id === emailId 
                        ? { ...mail, is_read: true }
                        : mail
                ));
                break;
            case 'mark_unread':
                markEmailAsUnread(emailId);
                // Update local state immediately
                setMails(prev => prev.map(mail => 
                    mail.email_id === emailId 
                        ? { ...mail, is_read: false }
                        : mail
                ));
                break;
            case 'delete':
                deleteEmail(emailId);
                // Remove from local state
                setMails(prev => prev.filter(mail => mail.email_id !== emailId));
                if (selectedMail?.email_id === emailId) {
                    setSelectedMail(null);
                }
                break;
            case 'archive':
                archiveEmail(emailId);
                // Update local state immediately
                setMails(prev => prev.map(mail => 
                    mail.email_id === emailId 
                        ? { ...mail, is_archived: true }
                        : mail
                ));
                break;
        }
    };

    return (
        <>
            {/* Email badge in header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-gray-900">Mail</h1>
                    <EmailBadge 
                        count={unreadCount} 
                        variant="minimal"
                        className="ml-2"
                    />
                    {isLoading && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Updating...</span>
                        </div>
                    )}
                    {lastUpdated && !isLoading && (
                        <div className="text-sm text-gray-500">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}
                    {hasNewEmails && (
                        <div className="flex items-center space-x-2 text-sm text-green-600 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>New emails!</span>
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-gray-500">
                            {isConnected ? 'Live' : 'Offline'}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <Button 
                        onClick={() => setConnectMailOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Connect Mail
                    </Button>
                    <Button 
                        onClick={() => getAllMail()}
                        disabled={isLoading}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50"
                    >
                        <div className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        Refresh
                    </Button>
                    <Button 
                        onClick={() => {
                            // Test toast notification
                            showEmailNotificationToast({
                                count: 1,
                                emails: [{
                                    email_id: 'test',
                                    subject: 'Test Email',
                                    from: 'test@example.com',
                                    body: 'This is a test email notification'
                                }],
                                timestamp: new Date()
                            }, () => console.log('Test notification clicked'));
                        }}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50"
                    >
                        Test Toast
                    </Button>
                    <Button 
                        onClick={() => {
                            // Simple toast test
                            console.log('🔍 Testing simple toast...');
                            toast.info('Simple test toast!', {
                                position: "top-right",
                                autoClose: 3000,
                            });
                        }}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50"
                    >
                        Simple Toast
                    </Button>
                    <Button 
                        onClick={() => {
                            // Simulate real-time notification
                            console.log('🔍 Simulating real-time notification...');
                            if (emailService) {
                                // Simulate receiving a new email notification
                                const mockNotification = {
                                    count: 1,
                                    emails: [{
                                        email_id: 'simulated-' + Date.now(),
                                        subject: 'Simulated Real-time Email',
                                        from: 'system@test.com',
                                        body: 'This is a simulated real-time notification to test the system',
                                        date: new Date()
                                    }],
                                    timestamp: new Date()
                                };
                                
                                // Trigger the notification handler directly
                                emailService.onNewEmailCallback?.(mockNotification);
                                console.log('✅ Simulated notification sent');
                            } else {
                                console.log('❌ No email service available');
                            }
                        }}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50"
                    >
                        Test Real-time
                    </Button>
                    <Button 
                        onClick={() => {
                            // Debug current state
                            console.log('🔍 === DEBUG INFO ===');
                            console.log('User ID:', user?.user_id);
                            console.log('Email Service:', emailService);
                            console.log('Is Connected:', isConnected);
                            console.log('Unread Count:', unreadCount);
                            
                            if (emailService) {
                                console.log('Service Connection Status:', emailService.isConnected());
                                console.log('Service User ID:', emailService.userId);
                                console.log('Service IO:', emailService.io);
                                console.log('Service Callbacks:', {
                                    onNewEmail: !!emailService.onNewEmailCallback,
                                    onEmailCountUpdate: !!emailService.onEmailCountUpdateCallback
                                });
                            }
                            console.log('==================');
                        }}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50"
                    >
                        Debug Info
                    </Button>
                    <Button 
                        onClick={async () => {
                            // Test backend email polling
                            try {
                                console.log('🔄 Testing backend email polling...');
                                const response = await fetch('/test/email-poll');
                                const result = await response.json();
                                console.log('Backend response:', result);
                                
                                if (result.success) {
                                    toast.success('Backend email polling triggered!', {
                                        position: "top-right",
                                        autoClose: 3000,
                                    });
                                } else {
                                    toast.error('Backend email polling failed!', {
                                        position: "top-right",
                                        autoClose: 3000,
                                    });
                                }
                            } catch (error) {
                                console.error('Error testing backend:', error);
                                toast.error('Error testing backend!', {
                                    position: "top-right",
                                    autoClose: 3000,
                                });
                            }
                        }}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50"
                    >
                        Test Backend
                    </Button>
                    <Button 
                        onClick={() => setSendMail(true)}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Send Mail
                    </Button>
                </div>
            </div>

            {/* Date filter */}
            <div className="mb-6">
                <Select value={date} onValueChange={setDate}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                        {dates.map((dateItem) => (
                            <SelectItem key={dateItem.value} value={dateItem.value}>
                                {dateItem.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Email list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Email list */}
                <div className="lg:col-span-1">
                    <Card className="h-[600px] overflow-y-auto">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">Inbox</h3>
                                <span className="text-sm text-gray-500">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
                                </span>
                            </div>
                            <Input 
                                placeholder="Search emails..." 
                                className="w-full"
                            />
                        </div>
                        
                        <div className="divide-y">
                            {mails.map((mail) => (
                                <div
                                    key={mail.email_id || mail.id}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                        selectedMail?.email_id === mail.email_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                    } ${!mail.is_read ? 'bg-gray-50' : ''}`}
                                    onClick={() => {
                                        setSelectedMail(mail);
                                        // Mark as read when selected
                                        if (!mail.is_read) {
                                            markEmailAsRead(mail.email_id);
                                        }
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className={`font-medium ${!mail.is_read ? 'font-semibold' : ''}`}>
                                                    {mail.from || 'Unknown Sender'}
                                                </span>
                                                {!mail.is_read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                )}
                                            </div>
                                            <h4 className={`text-sm ${!mail.is_read ? 'font-semibold' : ''} text-gray-900 mb-1 truncate`}>
                                                {mail.subject || '(No Subject)'}
                                            </h4>
                                            <p className="text-xs text-gray-600 line-clamp-2">
                                                {mail.body ? mail.body.slice(0, 100) + (mail.body.length > 100 ? '...' : '') : 'No content'}
                                            </p>
                                        </div>
                                        <div className="text-xs text-gray-500 ml-2">
                                            {moment(mail.date).format("MMM DD")}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Email content */}
                <div className="lg:col-span-2">
                    {selectedMail ? (
                        <Card className="h-[600px] overflow-y-auto">
                            <div className="p-6">
                                {/* Email header */}
                                <div className="flex items-center justify-between mb-6">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setSelectedMail(null)}
                                        className="text-gray-600 hover:text-gray-800"
                                    >
                                        <MoveLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                    
                                    <div className="flex items-center space-x-2">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleEmailOperation('mark_unread', selectedMail.email_id)}
                                        >
                                            Mark Unread
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleEmailOperation('archive', selectedMail.email_id)}
                                        >
                                            Archive
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleEmailOperation('delete', selectedMail.email_id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>

                                {/* Email content */}
                                <div 
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(
                                            formatEmailBody(selectedMail.body, selectedMail.subject, {
                                                sender: selectedMail.from,
                                                date: selectedMail.date
                                            })
                                        )
                                    }}
                                />
                            </div>
                        </Card>
                    ) : (
                        <Card className="h-[600px] flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium">Select an email to read</p>
                                <p className="text-sm">Choose an email from the list to view its content</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ConnectMailBox 
                open={connectMailOpen} 
                onClose={() => setConnectMailOpen(false)}
                onConnectSuccess={() => {
                    getAllMail(); // Refresh emails after connection
                }}
            />
            
            <SendMail 
                open={sendMail} 
                onClose={() => setSendMail(false)}
            />
            
            <SendMailClient 
                open={sendMailClient} 
                onClose={() => setSendMailClient(false)}
            />
        </>
    )
}