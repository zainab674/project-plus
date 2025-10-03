"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Home, LayoutDashboard, MoreHorizontal, Plus, Search, Star, Briefcase, X, PanelRight, PanelLeft, PanelsTopLeft, MessageSquareMore, Presentation, Mail, CalendarCheck, Unplug, Mails, MessagesSquare, MessageCircleMore, Projector, Phone, View, Book, DollarSign, MapPinPlus, Megaphone, File, LayoutDashboardIcon, BookDashed, FileDiff, CheckCheck, TimerReset, Brain, Folder, User } from 'lucide-react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useCallback, useState, useRef, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import BigDialog from "./Dialogs/BigDialog"
import { useUser } from "@/providers/UserProvider"
import CreateCaseModal from "./cases/createCaseModal"

const Sidebar = ({ setSidebarOpen, sidebarOpen, className }) => {
    const [favoritesOpen, setFavoritesOpen] = useState(true);
    const [workspaceOpen, setWorkspaceOpen] = useState(true);
    const [openMail, setOpenMail] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [updateOpen, setUpdateOpen] = useState(false);
    const [billingOpen, setBillingOpen] = useState(false);
    const [overviewOpen, setOverviewOpen] = useState(false);
    const [documentOpen, setDocumentOpen] = useState(false);
    const [filedOpen, setFiledOpen] = useState(false);
    const [signedOpen, setSignedOpen] = useState(false);
    const [projectDialogOpen, setProjectDialogOpen] = useState(false);
    const [openMeeting, setOpenMeeting] = useState(false);
    const [showCallPopup, setShowCallPopup] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [clientOpen, setClientOpen] = useState(false);
    const timerRef = useRef(null);
    const pathname = usePathname();
    const { user } = useUser();

    const clients = useMemo(() => {
        if (!user) return [];
        const clients = user.Projects?.map(project => project.Clients[0]?.user).filter(c => c);
        return clients;
    }, [user])



    const connectWhatsapp = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.open('https://web.whatsapp.com', '_blank', 'width=800,height=600');
        }
    }, []);

    const startCall = () => {
        setShowCallPopup(true);
        // Start timer
        timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    const endCall = () => {
        setShowCallPopup(false);
        setCallDuration(0);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    // Cleanup timer on component unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <aside className={`
            fixed inset-y-0 left-0 z-50 flex h-[98%] w-64 flex-col bg-secondary shadow-lg transition-transform duration-300 ease-in-out m-2 rounded-md
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:relative lg:translate-x-0
            ${className}
          `}>
                <div className="flex items-center justify-between p-4 lg:hidden">
                    <span className="text-xl font-bold text-foreground-primary">flexywexy.com</span>
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                        <X className="h-6 w-6 text-foreground-primary" />
                    </Button>
                </div>
                <div className="flex flex-col gap-1 p-3">
                    {/* Home */}


                    {user?.Role !== 'TEAM' && (
                        <Link href={'/dashboard/template-documents'}>
                            <Button variant={pathname == '/dashboard/template-documents' ? 'secondary' : 'ghost'} className={`justify-start w-full ${pathname == '/dashboard/template-documents' ? 'bg-tbutton-bg text-white hover:bg-tbutton-hover' : 'text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text'}`}>
                                <Folder className="mr-2 h-4 w-4" />
                                Templates
                            </Button>
                        </Link>
                    )}



                    {
                        user?.Role == 'TEAM' && (<>
                            <Link href={'/dashboard'}>
                                <Button variant={pathname == '/dashboard' ? 'secondary' : 'ghost'} className={`justify-start w-full ${pathname == '/dashboard' ? 'bg-tbutton-bg text-white hover:bg-tbutton-hover' : 'text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text'}`}>
                                    <Home className="mr-2 h-4 w-4" />
                                    Home
                                </Button>
                            </Link>

                            <Collapsible open={chatOpen} onOpenChange={setChatOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                        <div className="flex items-center">
                                            <MessagesSquare className="mr-2 h-4 w-4" />
                                            Chat
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${chatOpen ? "rotate-180" : ""}`} />
                                    </Button>
                                </CollapsibleTrigger>

                                <CollapsibleContent className="px-4 py-2">
                                    <div className="flex flex-col gap-2">
                                        <Link href={'/dashboard/chat'}>
                                            <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                <MessageSquareMore className="mr-2 h-4 w-4" />
                                                System Chat
                                            </Button>
                                        </Link>

                                        <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text" onClick={connectWhatsapp}>
                                            <MessageCircleMore className="mr-2 h-4 w-4" />
                                            Connect Whatsapp
                                        </Button>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            <Link href={'/dashboard/mail'}>
                                <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Mail
                                </Button>
                            </Link>

                            <Collapsible open={openMeeting} onOpenChange={setOpenMeeting}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                        <div className="flex items-center">
                                            <Presentation className="mr-2 h-4 w-4" />
                                            Meetings
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMeeting ? "rotate-180" : ""}`} />
                                    </Button>
                                </CollapsibleTrigger>

                                <CollapsibleContent className="px-4 py-2">
                                    <div className="flex flex-col gap-2">
                                        <Link href={'/dashboard/meeting'}>
                                            <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                <Projector className="mr-2 h-4 w-4" />
                                                Instant Meet
                                            </Button>
                                        </Link>
                                        <Link href={'/dashboard/schedule-meet'}>
                                            <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                <CalendarCheck className="mr-2 h-4 w-4" />
                                                Schedule Meet
                                            </Button>
                                        </Link>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            <Link href={'/dashboard/timeline'}>
                                <Button variant={pathname == '/dashboard/timeline' ? 'secondary' : 'ghost'} className={`justify-start w-full ${pathname == '/dashboard/timeline' ? 'bg-tbutton-bg text-white hover:bg-tbutton-hover' : 'text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text'}`}>
                                    <TimerReset className="mr-2 h-4 w-4" />
                                    Timeline
                                </Button>
                            </Link>

                            {/* Favorites Section - Read Only for Team Members */}
                            <Collapsible open={favoritesOpen} onOpenChange={setFavoritesOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                        <div className="flex items-center">
                                            <Star className="mr-2 h-4 w-4" />
                                            Cases (View Only)
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${favoritesOpen ? "rotate-180" : ""}`} />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="px-4 py-2">
                                    <div className="flex flex-col gap-2">
                                        {
                                            user?.Projects?.map(project => (
                                                <Link href={`/dashboard/project/${project.project_id}`} key={project.project_id}>
                                                    <Button variant="ghost" className="justify-start flex items-center w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                        <PanelLeft className="mr-1" />
                                                        {project.name}
                                                    </Button>
                                                </Link>
                                            ))
                                        }
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </>
                        )
                    }

                    {
                        user?.Role == 'PROVIDER' && (<>
                            <Link href={'/dashboard'}>
                                <Button variant={pathname == '/dashboard' ? 'secondary' : 'ghost'} className={`justify-start w-full ${pathname == '/dashboard' ? 'bg-tbutton-bg text-white hover:bg-tbutton-hover' : 'text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text'}`}>
                                    <Home className="mr-2 h-4 w-4" />
                                    Home
                                </Button>
                            </Link>

                            <Collapsible open={clientOpen} onOpenChange={setClientOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                        <div className="flex items-center">
                                            <Mails className="mr-2 h-4 w-4" />
                                            Clients
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${clientOpen ? "rotate-180" : ""}`} />
                                    </Button>
                                </CollapsibleTrigger>

                                <CollapsibleContent className="px-4 py-2">
                                    <div className="flex flex-col gap-2">

                                        {
                                            clients.map((client) => (
                                                <Link href={`/dashboard/clients/${client.user_id}`}>
                                                    <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                        <User className="mr-2 h-4 w-4" />
                                                        {client?.name}
                                                    </Button>
                                                </Link>
                                            ))
                                        }

                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            <Collapsible open={chatOpen} onOpenChange={setChatOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                        <div className="flex items-center">
                                            <MessagesSquare className="mr-2 h-4 w-4" />
                                            Chat
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${chatOpen ? "rotate-180" : ""}`} />
                                    </Button>
                                </CollapsibleTrigger>

                                <CollapsibleContent className="px-4 py-2">
                                    <div className="flex flex-col gap-2">
                                        <Link href={'/dashboard/chat'}>
                                            <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                <MessageSquareMore className="mr-2 h-4 w-4" />
                                                System Chat
                                            </Button>
                                        </Link>

                                        <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text" onClick={connectWhatsapp}>
                                            <MessageCircleMore className="mr-2 h-4 w-4" />
                                            Connect Whatsapp
                                        </Button>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>


                            <Collapsible open={openMeeting} onOpenChange={setOpenMeeting}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                        <div className="flex items-center">
                                            <Presentation className="mr-2 h-4 w-4" />
                                            Meetings
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMeeting ? "rotate-180" : ""}`} />
                                    </Button>
                                </CollapsibleTrigger>

                                <CollapsibleContent className="px-4 py-2">
                                    <div className="flex flex-col gap-2">

                                        <Link href={'/dashboard/meeting'}>
                                            <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                <Projector className="mr-2 h-4 w-4" />
                                                Instant Meet
                                            </Button>
                                        </Link>
                                        <Link href={'/dashboard/schedule-meet'}>
                                            <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                <CalendarCheck className="mr-2 h-4 w-4" />
                                                Schedule Meet
                                            </Button>
                                        </Link>

                                    </div>
                                </CollapsibleContent>
                            </Collapsible>


                            <Link href={'/dashboard/mail'}>
                                <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Mail
                                </Button>
                            </Link>
                            {/* <Collapsible open={openMail} onOpenChange={setOpenMail}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                        <div className="flex items-center">
                                            <Mails className="mr-2 h-4 w-4" />
                                            MaiL
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMail ? "rotate-180" : ""}`} />
                                    </Button>
                                </CollapsibleTrigger>

                                <CollapsibleContent className="px-4 py-2">
                                    <div className="flex flex-col gap-2">

                                        <Link href={'/dashboard/mail'}>
                                            <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                <Mail className="mr-2 h-4 w-4" />
                                                Mail
                                            </Button>
                                        </Link>
                                        <Link href={'/dashboard/connect-mail'}>
                                            <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                <Unplug className="mr-2 h-4 w-4" />
                                                Connect Mail
                                            </Button>
                                        </Link>

                                    </div>
                                </CollapsibleContent>
                            </Collapsible> */}


                            {/* <Link href={'/dashboard/phone'}>
                                <Button variant={pathname == '/dashboard/phone' ? 'secondary' : 'ghost'} className={`justify-start w-full ${pathname == '/dashboard/phone' ? 'bg-tbutton-bg text-white hover:bg-tbutton-hover' : 'text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text'}`}>
                                    <Phone className="mr-2 h-4 w-4" />
                                    Phone
                                </Button>
                            </Link> */}

                            <Link href={'/dashboard/timeline'}>
                                <Button variant={pathname == '/dashboard/timeline' ? 'secondary' : 'ghost'} className={`justify-start w-full ${pathname == '/dashboard/timeline' ? 'bg-tbutton-bg text-white hover:bg-tbutton-hover' : 'text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text'}`}>
                                    <TimerReset className="mr-2 h-4 w-4" />
                                    Timeline
                                </Button>
                            </Link>


                            {/* <Link href={'/dashboard/projects'}>
                                <Button variant={pathname == '/dashboard/projects' ? 'secondary' : 'ghost'} className={`justify-start w-full ${pathname == '/dashboard/projects' ? 'bg-tbutton-bg text-white hover:bg-tbutton-hover' : 'text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text'}`}>
                                    <PanelsTopLeft className="mr-2 h-4 w-4" />
                                    My Project
                                </Button>
                            </Link> */}

                            <Button variant={'ghost'} className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text" onClick={() => setProjectDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Case
                            </Button>

                            {/* Favorites Section */}
                            <Collapsible open={favoritesOpen} onOpenChange={setFavoritesOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                        <div className="flex items-center">
                                            <Star className="mr-2 h-4 w-4" />
                                            Cases
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${favoritesOpen ? "rotate-180" : ""}`} />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="px-4 py-2">
                                    <div className="flex flex-col gap-2">
                                        {
                                            user?.Projects?.map(project => (
                                                <Link href={`/dashboard/project/${project.project_id}`} key={project.project_id}>
                                                    <Button variant="ghost" className="justify-start flex items-center w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                        <PanelLeft className="mr-1" />
                                                        {project.name}
                                                    </Button>
                                                </Link>
                                            ))
                                        }
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </>
                        )
                    }




                    {
                        user?.Role == 'CLIENT' && (
                            <>
                                <Collapsible open={overviewOpen} onOpenChange={setOverviewOpen}>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                            <div className="flex items-center">
                                                <LayoutDashboardIcon className="mr-2 h-4 w-4" />
                                                Overview
                                            </div>
                                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${overviewOpen ? "rotate-180" : ""}`} />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="px-4 py-2">
                                        <div className="flex flex-col gap-2">
                                            {
                                                user?.Services?.map(service => (
                                                    <Link href={`/dashboard/${service.project.project_id}?client_id=${service.project_client_id}`} key={service.project_client_id}>
                                                        <Button variant="ghost" className="justify-start flex items-center w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                            <BookDashed className="mr-1" />
                                                            {service.project.name}
                                                        </Button>
                                                    </Link>
                                                ))
                                            }
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>


                                <Link href={'/dashboard/chat'}>
                                    <Button variant={pathname == '/dashboard/chat' ? 'secondary' : 'ghost'} className={`justify-start w-full ${pathname == '/dashboard/chat' ? 'bg-tbutton-bg text-white hover:bg-tbutton-hover' : 'text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text'}`}>
                                        <MessageSquareMore className="mr-2 h-4 w-4" />
                                        Chat
                                    </Button>
                                </Link>

                                <Link href={'/dashboard/mail'}>
                                    <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                        <Mail className="mr-2 h-4 w-4" />
                                        Mail
                                    </Button>
                                </Link>

                                <Link href={'/dashboard/meeting'}>
                                    <Button variant="ghost" size="sm" className="justify-start w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                        <Projector className="mr-2 h-4 w-4" />
                                        Meetings
                                    </Button>
                                </Link>

                                <Collapsible open={documentOpen} onOpenChange={setDocumentOpen}>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                            <div className="flex items-center">
                                                <MapPinPlus className="mr-2 h-4 w-4" />
                                                Documents
                                            </div>
                                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${documentOpen ? "rotate-180" : ""}`} />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="px-4 py-2">
                                        <div className="flex flex-col gap-2">
                                            {
                                                user?.Services?.map(service => (
                                                    <Link href={`/dashboard/documents/${service.project_client_id}`} key={service.project_client_id}>
                                                        <Button variant="ghost" className="justify-start flex items-center w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                            <File className="mr-1" />
                                                            {service.project.name}
                                                        </Button>
                                                    </Link>
                                                ))
                                            }
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>

                                <Collapsible open={updateOpen} onOpenChange={setUpdateOpen}>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                            <div className="flex items-center">
                                                <Megaphone className="mr-2 h-4 w-4" />
                                                Updates
                                            </div>
                                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${updateOpen ? "rotate-180" : ""}`} />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="px-4 py-2">
                                        <div className="flex flex-col gap-2">
                                            {
                                                user?.Services?.map(service => (
                                                    <Link href={`/dashboard/updates/${service.project_client_id}`} key={service.project_client_id}>
                                                        <Button variant="ghost" className="justify-start flex items-center w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                            <PanelLeft className="mr-1" />
                                                            {service.project.name}
                                                        </Button>
                                                    </Link>
                                                ))
                                            }
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>



                                <Collapsible open={billingOpen} onOpenChange={setBillingOpen}>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                            <div className="flex items-center">
                                                <DollarSign className="mr-2 h-4 w-4" />
                                                Bills
                                            </div>
                                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${billingOpen ? "rotate-180" : ""}`} />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="px-4 py-2">
                                        <div className="flex flex-col gap-2">
                                            {
                                                user?.Services?.map(service => (
                                                    <Link href={`/dashboard/bills/${service.project_client_id}`} key={service.project_client_id}>
                                                        <Button variant="ghost" className="justify-start flex items-center w-full text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                                            <PanelLeft className="mr-1" />
                                                            {service.project.name}
                                                        </Button>
                                                    </Link>
                                                ))
                                            }
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>



                                <Collapsible open={filedOpen} onOpenChange={setFiledOpen}>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                            <div className="flex items-center">
                                                <FileDiff className="mr-2 h-4 w-4" />
                                                Filed
                                            </div>
                                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${filedOpen ? "rotate-180" : ""}`} />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="px-4 py-2">
                                        <div className="flex flex-col gap-2">
                                            {
                                                user?.Services?.map(service => (
                                                    <Link href={`/dashboard/filed/${service.project_client_id}`}>
                                                        <Button variant="ghost" className="justify-start flex items-center w-full">
                                                            <PanelLeft className="mr-1" />
                                                            {service.project.name}
                                                        </Button>
                                                    </Link>
                                                ))
                                            }
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>



                                <Collapsible open={signedOpen} onOpenChange={setSignedOpen}>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-between text-foreground-primary hover:bg-tbutton-hover hover:text-tbutton-text">
                                            <div className="flex items-center">
                                                <CheckCheck className="mr-2 h-4 w-4" />
                                                Signature Document
                                            </div>
                                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${signedOpen ? "rotate-180" : ""}`} />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="px-4 py-2">
                                        <div className="flex flex-col gap-2">
                                            {
                                                user?.Services?.map(service => (
                                                    <Link href={`/dashboard/sign/${service.project_client_id}`}>
                                                        <Button variant="ghost" className="justify-start flex items-center w-full">
                                                            <PanelLeft className="mr-1" />
                                                            {service.project.name}
                                                        </Button>
                                                    </Link>
                                                ))
                                            }
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </>
                        )
                    }
                </div>
            </aside>

            <BigDialog onClose={() => setProjectDialogOpen(false)} open={projectDialogOpen}>
                <CreateCaseModal onClose={() => setProjectDialogOpen(false)} />
            </BigDialog>


            <button
                className="absolute bottom-10 right-10 z-50"
                title="AI agent"
                onClick={startCall}
            >
                <img src="/assets/bot.jpg" className="h-[5rem] w-[5rem] rounded-full cursor-pointer" />
            </button>

            {showCallPopup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
                        <div className="flex flex-col items-center gap-4">
                            <img
                                src="/assets/bot.jpg"
                                className="h-20 w-20 rounded-full"
                                alt="AI Assistant"
                            />
                            <h3 className="text-xl font-semibold">AI Assistant</h3>
                            <p className="text-green-500">{formatTime(callDuration)}</p>
                            <button
                                onClick={endCall}
                                className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
                            >
                                <Phone className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>

    )
}

export default Sidebar