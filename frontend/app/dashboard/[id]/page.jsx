// 'use client'
// import { Button } from '@/components/Button';
// import { getOverviewRequest, getPedingDocsByIdRequest, uploadDocumentRequest } from '@/lib/http/client';
// import { useUser } from '@/providers/UserProvider';
// import { getRecentDatesWithLabels } from '@/utils/getRecentDatesWithLabels';
// import { Info, Search } from 'lucide-react';
// import React, { use, useCallback, useEffect, useState } from 'react'
// import { Select, SelectGroup, SelectLabel, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
// import { Input } from '@/components/ui/input';
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table"
// import moment from 'moment';
// import Link from 'next/link';

// const ClientDashbaord = ({ params, searchParams }) => {
//     const [updates, setUpdates] = useState([]);
//     const [documents, setDocuments] = useState([]);
//     const [pendingDocuments, setPendingDocuments] = useState([]);
//     const [mails, setMails] = useState([]);
//     const [meetings, setMeetings] = useState([]);
//     const [calls, setCalls] = useState([]);
//     const [callDurations, setCallDurations] = useState("0");

//     const [dates, setDates] = useState(getRecentDatesWithLabels(20));
//     const [selectedDate, setSelectedDate] = useState(dates[0].date);

//     const { id } = use(params);
//     const { client_id } = use(searchParams);
//     const { user } = useUser();

//     const getOverview = useCallback(async () => {
//         try {
//             const res = await getOverviewRequest(selectedDate, user.user_id, id);
//             setUpdates(res.data.overview.updates);
//             setDocuments(res.data.overview.documents);
//             setMails(res.data.overview.mails);
//             setMeetings(res.data.overview.meetings);
//             setCalls(res.data.overview.calls);
//             setCallDurations(res.data.overview.callDurations);
//         } catch (error) {
//             console.log(error.message, error?.response?.data?.message)
//         }
//     }, [id, selectedDate, user]);

//     useEffect(() => {
//         if (user) {
//             getOverview()
//         }
//     }, [user, selectedDate]);



//     const getDocument = useCallback(async () => {

//         try {
//             const res = await getPedingDocsByIdRequest(id);
//             setPendingDocuments(res?.data);
//         } catch (error) {
//             toast.error(error?.response?.data?.message || error?.message);
//         }
//     }, [id]);

//     useEffect(() => {
//         getDocument();
//     }, [id]);




//     const hadleUpload = useCallback(async (e, document_id) => {
//         try {
//             const [file] = e.target.files;
//             const formdata = {
//                 file,
//                 document_id
//             }

//             const res = await uploadDocumentRequest(formdata);
//             toast.success(res.data.message)
//         } catch (error) {
//             toast.error(error.response?.data?.message || error.message);
//         } finally {
//             getDocument()
//         }
//     }, []);
//     return (
//         <div className="flex h-screen flex-col bg-white m-2 rounded-md overflow-y-auto">
//             <div className="flex flex-col gap-4 p-6">
//                 {/* Header */}
//                 <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                         <h1 className="text-2xl font-semibold">Overview</h1>
//                         <Info className="h-4 w-4 text-gray-400" />
//                     </div>
//                 </div>

//                 <div className="flex items-center justify-end">

//                     <div className="flex items-center gap-2 justify-end">

//                         <Select onValueChange={(value) => setSelectedDate(value)}>
//                             <SelectTrigger className="w-[180px]">
//                                 <SelectValue placeholder="Select a date" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectGroup>
//                                     <SelectLabel>Today</SelectLabel>
//                                     <SelectItem value={null}>ALL</SelectItem>
//                                     {
//                                         dates.map(date => (
//                                             <SelectItem value={date.date} key={date.date}>{date.label}</SelectItem>
//                                         ))
//                                     }

//                                 </SelectGroup>
//                             </SelectContent>
//                         </Select>
//                     </div>
//                 </div>
//             </div>

//             <div className='grid grid-cols-2 lg:grid-cols-3 p-8 gap-8'>
//                 <Link href={`/dashboard/updates/${client_id}`}>
//                     <div className='h-[15rem] rounded-md bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center flex-col gap-3 cursor-pointer'>
//                         <h3 className='text-white text-xl opacity-80'>Total Updates</h3>
//                         <h1 className='text-white text-9xl'>{updates.length}</h1>
//                     </div>
//                 </Link>
//                 <Link href={`/dashboard/documents/${client_id}`}>
//                     <div className='h-[15rem] rounded-md bg-gradient-to-r from-rose-400 to-red-500 flex items-center justify-center flex-col gap-3 cursor-pointer'>
//                         <h3 className='text-white text-xl opacity-80'>Total Documets</h3>
//                         <h1 className='text-white text-9xl'>{documents.length}</h1>
//                     </div>
//                 </Link>
//                 <Link href={`/dashboard/mail`}>
//                     <div className='h-[15rem] rounded-md bg-gradient-to-r from-amber-500 to-pink-500 flex items-center justify-center flex-col gap-3 cursor-pointer'>
//                         <h3 className='text-white text-xl opacity-80'>Total Mails</h3>
//                         <h1 className='text-white text-9xl'>{mails.length}</h1>
//                     </div>
//                 </Link>
//                 <Link href={`/dashboard/meeting`}>
//                     <div className='h-[15rem] rounded-md bg-gradient-to-r from-fuchsia-500 to-pink-500 flex items-center justify-center flex-col gap-3 cursor-pointer'>
//                         <h3 className='text-white text-xl opacity-80'>Total Meetings</h3>
//                         <h1 className='text-white text-9xl'>{meetings.length}</h1>
//                     </div>
//                 </Link>
//                 <div className='h-[15rem] rounded-md bg-gradient-to-r from-fuchsia-500 to-pink-500 flex items-center justify-center flex-col gap-3'>
//                     <h3 className='text-white text-xl opacity-80'>Total Calls</h3>
//                     <h1 className='text-white text-9xl'>{calls.length}</h1>
//                 </div>
//                 <div className='h-[15rem] rounded-md bg-gradient-to-r from-fuchsia-500 to-pink-500 flex items-center justify-center flex-col gap-3'>
//                     <h3 className='text-white text-xl opacity-80'>Total Call Duration</h3>
//                     <h1 className='text-white text-9xl flex items-end'>{callDurations} <span className='text-4xl mb-4'>min</span></h1>
//                 </div>
//             </div>


//             <div>
//                 <h2>Pending Documents</h2>
//                 <div className="flex-1 overflow-auto">
//                     <Table className="border-collapse border rounded-md">
//                         <TableHeader className="border-b">
//                             <TableRow>
//                                 <TableHead className="!w-[80px] border-r last:border-r-0">#</TableHead>

//                                 <TableHead className="w-[300px] border-r last:border-r-0">Name</TableHead>
//                                 <TableHead className="border-r last:border-r-0">Description</TableHead>
//                                 <TableHead className="border-r last:border-r-0">Date</TableHead>
//                                 <TableHead className="border-r last:border-r-0">Status</TableHead>
//                                 <TableHead className="border-r last:border-r-0">Action</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody className="divide-y">
//                             {
//                                 pendingDocuments && pendingDocuments.map((document, index) => (
//                                     <TableRow>
//                                         <TableCell className=' border-r last:border-r-0 cursor-pointer'>
//                                             {index + 1}
//                                         </TableCell>

//                                         <TableCell className={`border-r last:border-r-0 !p-0 text-center text-black cursor-pointer`}>
//                                             {document.name}
//                                         </TableCell>

//                                         <TableCell className="border-r last:border-r-0 !p-1 text-center">
//                                             {document.description}
//                                         </TableCell>
//                                         <TableCell className={`border-r last:border-r-0 !p-0 text-center text-black cursor-pointer`}>
//                                             {moment(document.created_at).format("DD MMM YYYY")}
//                                         </TableCell>
//                                         <TableCell className={`border-r last:border-r-0 !p-1 text-center`}>
//                                             <span>{document.status}</span>
//                                         </TableCell>
//                                         <TableCell className={`border-r last:border-r-0 !p-1 text-black text-center relative cursor-pointer group`}>
//                                             <div className='flex items-center gap-3'>
//                                                 {
//                                                     document.filename &&
//                                                     <a target='__black' href={document.file_url} className='text-blue-500 underline'>{document.filename}</a>
//                                                 }
//                                                 <Input
//                                                     type="file"
//                                                     onChange={(e) => hadleUpload(e, document.document_id)}
//                                                 />
//                                             </div>
//                                         </TableCell>
//                                     </TableRow>
//                                 ))
//                             }

//                         </TableBody>
//                     </Table>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default ClientDashbaord




'use client'
import { Button } from '@/components/Button';
import { getOverviewRequest, getPedingDocsByIdRequest, uploadDocumentRequest } from '@/lib/http/client';
import { useUser } from '@/providers/UserProvider';
import { getRecentDatesWithLabels } from '@/utils/getRecentDatesWithLabels';
import { Info, Search, FileText, Mail, Calendar, Phone, Clock, Upload, DollarSign } from 'lucide-react';
import React, { use, useCallback, useEffect, useState } from 'react'
import { Select, SelectGroup, SelectLabel, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import moment from 'moment';
import Link from 'next/link';

const ClientDashbaord = ({ params, searchParams }) => {
    const [updates, setUpdates] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [pendingDocuments, setPendingDocuments] = useState([]);
    const [mails, setMails] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [calls, setCalls] = useState([]);
    const [callDurations, setCallDurations] = useState("0");

    const [dates, setDates] = useState(getRecentDatesWithLabels(20));
    const [selectedDate, setSelectedDate] = useState(dates[0].date);

    const { id } = use(params);
    const { client_id } = use(searchParams);
    const { user } = useUser();

    const getOverview = useCallback(async () => {
        try {
            const res = await getOverviewRequest(selectedDate, user.user_id, id);
            setUpdates(res.data.overview.updates);
            setDocuments(res.data.overview.documents);
            setMails(res.data.overview.mails);
            setMeetings(res.data.overview.meetings);
            setCalls(res.data.overview.calls);
            setCallDurations(res.data.overview.callDurations);
        } catch (error) {
            console.log(error.message, error?.response?.data?.message)
        }
    }, [id, selectedDate, user]);

    useEffect(() => {
        if (user) {
            getOverview()
        }
    }, [user, selectedDate]);

    const getDocument = useCallback(async () => {
        try {
            const res = await getPedingDocsByIdRequest(id);
            setPendingDocuments(res?.data);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        }
    }, [id]);

    useEffect(() => {
        getDocument();
    }, [id]);

    const hadleUpload = useCallback(async (e, document_id) => {
        try {
            const [file] = e.target.files;
            const formdata = {
                file,
                document_id
            }

            const res = await uploadDocumentRequest(formdata);
            toast.success(res.data.message)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            getDocument()
        }
    }, []);

    const dashboardCards = [
        {
            title: "Updates",
            count: updates.length,
            icon: Info,
            href: `/dashboard/updates/${client_id}`,
            gradient: "from-blue-600 to-blue-700",
            description: "Recent updates"
        },
        {
            title: "Documents",
            count: documents.length,
            icon: FileText,
            href: `/dashboard/documents/${client_id}`,
            gradient: "from-emerald-600 to-emerald-700",
            description: "Total documents"
        },
        {
            title: "Filed",
            count: mails.length,
            icon: Mail,
            href: `/dashboard/filed/${client_id}`,
            gradient: "from-purple-600 to-purple-700",
            description: "Filed "
        },
        {
            title: "Bills",
            count: meetings.length,
            icon: DollarSign,
            href: `/dashboard/billing`,
            gradient: "from-orange-600 to-orange-700",
            description: "Billing & Payments"
        },
        {
            title: "Signature",
            count: calls.length,
            icon: Phone,
            href: `/dashboard/sign/${client_id}`,
            gradient: "from-rose-600 to-rose-700",
            description: "Total Signatures"
        },
        {
            title: "History",
            count: callDurations,
            unit: "min",
            icon: Clock,
            href: `/dashboard/history/${client_id}`,
            gradient: "from-indigo-600 to-indigo-700",
            description: "Complete History"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="px-6 py-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                                    <Info className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
                                    <p className="text-sm text-gray-500 mt-1">Comprehensive overview of client activities</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex flex-col items-end">
                                    <label className="text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
                                    <Select onValueChange={(value) => setSelectedDate(value)}>
                                        <SelectTrigger className="w-48 h-10 bg-white border border-gray-300 shadow-sm">
                                            <SelectValue placeholder="Select date range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Range</SelectLabel>
                                                <SelectItem value={null} className="font-medium">All Time</SelectItem>
                                                {dates.map(date => (
                                                    <SelectItem value={date.date} key={date.date}>
                                                        {date.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="px-6 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {dashboardCards.map((card, index) => {
                            const IconComponent = card.icon;
                            const CardContent = (
                                <div className={`relative h-40 rounded-xl bg-gradient-to-br ${card.gradient} p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}>
                                    <div className="flex items-start justify-between h-full">
                                        <div className="flex flex-col justify-between h-full">
                                            <div>
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <IconComponent className="h-5 w-5 text-white/80" />
                                                    <p className="text-white/80 text-sm font-medium">{card.description}</p>
                                                </div>
                                                <h3 className="text-lg font-semibold text-white/90">{card.title}</h3>
                                            </div>

                                        </div>
                                        <div className="opacity-20 group-hover:opacity-30 transition-opacity">
                                            <IconComponent className="h-16 w-16" />
                                        </div>
                                    </div>
                                    {card.href && (
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                                    )}
                                </div>
                            );

                            return card.href ? (
                                <Link href={card.href} key={index} className="block">
                                    {CardContent}
                                </Link>
                            ) : (
                                <div key={index}>
                                    {CardContent}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pending Documents Section */}
                    {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-lg">
                                        <FileText className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">Pending Documents</h2>
                                        <p className="text-sm text-gray-500">Documents requiring action or upload</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-medium">
                                        {pendingDocuments.length} pending
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50">
                                        <TableHead className="w-16 text-center font-semibold text-gray-700">#</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Document Name</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Description</TableHead>
                                        <TableHead className="w-32 font-semibold text-gray-700">Date Created</TableHead>
                                        <TableHead className="w-24 text-center font-semibold text-gray-700">Status</TableHead>
                                        <TableHead className="w-48 text-center font-semibold text-gray-700">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingDocuments && pendingDocuments.map((document, index) => (
                                        <TableRow key={document.document_id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="text-center font-medium text-gray-600">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-900">
                                                {document.name}
                                            </TableCell>
                                            <TableCell className="text-gray-600 max-w-xs">
                                                <div className="truncate" title={document.description}>
                                                    {document.description}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600 text-sm">
                                                {moment(document.created_at).format("MMM DD, YYYY")}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${document.status === 'pending'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {document.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center space-x-3">
                                                    {document.filename && (
                                                        <a
                                                            target="_blank"
                                                            href={document.file_url}
                                                            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm underline decoration-1 underline-offset-2"
                                                        >
                                                            {document.filename}
                                                        </a>
                                                    )}
                                                    <div className="relative">
                                                        <Input
                                                            type="file"
                                                            onChange={(e) => hadleUpload(e, document.document_id)}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center space-x-2 h-8 px-3 text-xs font-medium"
                                                        >
                                                            <Upload className="h-3 w-3" />
                                                            <span>Upload</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {pendingDocuments.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12">
                                                <div className="flex flex-col items-center space-y-3">
                                                    <FileText className="h-12 w-12 text-gray-300" />
                                                    <p className="text-gray-500 font-medium">No pending documents</p>
                                                    <p className="text-gray-400 text-sm">All documents are up to date</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    )
}

export default ClientDashbaord