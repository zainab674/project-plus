// 'use client'
// import { Button } from '@/components/Button'
// import { getHistoryRequest } from '@/lib/http/client';
// import moment from 'moment';
// import React, { useState, useEffect, use, useCallback } from 'react'
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table"
// import { toast } from 'react-toastify';
// import Loader from '@/components/Loader';
// import Link from 'next/link';

// const page = ({ params }) => {
//     const { id } = use(params);
//     const [documents, setDocuments] = useState([]);
//     const [updates, setUpdates] = useState([]);
//     const [filed, setFiled] = useState([]);
//     const [bills, setBilling] = useState([]);
//     const [signed, setSigned] = useState([]);
//     const [loading, setLoading] = useState(false);

//     const [selectedTab, setSelectedTab] = useState("document");

//     const getDocument = useCallback(async () => {
//         setLoading(true);
//         try {
//             const res = await getHistoryRequest(id);

//             setDocuments(res?.data?.documents);
//             setUpdates(res?.data?.updates);
//             setBilling(res?.data?.billings);
//             setSigned(res?.data?.signed);
//             setFiled(res?.data?.filed);
//         } catch (error) {
//             toast.error(error?.response?.data?.message || error?.message);
//         } finally {
//             setLoading(false);
//         }
//     }, [id]);

//     useEffect(() => {
//         getDocument();
//     }, [id]);


//     if (loading) {
//         return <>
//             <div className="h-screen bg-white m-2 rounded-md flex items-center justify-center">
//                 <Loader />
//             </div>
//         </>
//     }

//     return (
//         <div className="flex h-screen flex-col bg-white m-2 rounded-md overflow-y-auto items-start p-8">
//             <h1 className='text-3xl font-medium text-black'>Client History</h1>
//             <div className='flex items-center h-[3rem] rounded-md bg-white w-full mt-5 gap-2'>
//                 <Button
//                     className={`${selectedTab === "document" ? 'bg-tbutton-bg text-tbutton-text' : 'bg-white text-black hover:bg-tbutton-bg hover:text-tbutton-text'} transition-all`}
//                     onClick={() => setSelectedTab("document")}
//                 >
//                     Documents
//                 </Button>
//                 <Button
//                     className={`${selectedTab === "signed" ? 'bg-tbutton-bg text-tbutton-text' : 'bg-white text-black hover:bg-tbutton-bg hover:text-tbutton-text'} transition-all`}
//                     onClick={() => setSelectedTab("signed")}
//                 >
//                     Signature
//                 </Button>
//                 <Button
//                     className={`${selectedTab === "bill" ? 'bg-tbutton-bg text-tbutton-text' : 'bg-white text-black hover:bg-tbutton-bg hover:text-tbutton-text'} transition-all`}
//                     onClick={() => setSelectedTab("bill")}
//                 >
//                     Bills
//                 </Button>
//                 <Button
//                     className={`${selectedTab === "updates" ? 'bg-tbutton-bg text-tbutton-text' : 'bg-white text-black hover:bg-tbutton-bg hover:text-tbutton-text'} transition-all`}
//                     onClick={() => setSelectedTab("updates")}
//                 >
//                     Updates
//                 </Button>
//                 <Button
//                     className={`${selectedTab === "filed" ? 'bg-tbutton-bg text-tbutton-text' : 'bg-white text-black hover:bg-tbutton-bg hover:text-tbutton-text'} transition-all`}
//                     onClick={() => setSelectedTab("filed")}
//                 >
//                     Filed
//                 </Button>
//             </div>

//             {
//                 selectedTab == "document" &&
//                 <div className='mt-4 w-full'>
//                     <div className="flex-1 overflow-auto">
//                         <Table className="border-collapse border border-primary rounded-md">
//                             <TableHeader className="border-b border-primary">
//                                 <TableRow>
//                                     <TableHead className="!w-[80px] border-r border-primary last:border-r-0 text-black">#</TableHead>
//                                     <TableHead className="w-[300px] border-r border-primary last:border-r-0 text-black">Name</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Description</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Date</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Status</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Action</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody className="divide-y divide-primary">
//                                 {
//                                     documents.map((document, index) => (
//                                         <TableRow key={document.document_id}>
//                                             <TableCell className='border-r border-primary last:border-r-0 cursor-pointer text-black'>
//                                                 {index + 1}
//                                             </TableCell>

//                                             <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                                 {document.name}
//                                             </TableCell>

//                                             <TableCell className="border-r border-primary last:border-r-0 !p-1 text-center text-black">
//                                                 {document.description}
//                                             </TableCell>
//                                             <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                                 {moment(document.created_at).format("DD MMM YYYY")}
//                                             </TableCell>
//                                             <TableCell className='border-r border-primary last:border-r-0 !p-1 text-center text-black'>
//                                                 <span>{document.status}</span>
//                                             </TableCell>
//                                             <TableCell className='border-r border-primary last:border-r-0 !p-1 text-black text-center relative cursor-pointer group'>
//                                                 {
//                                                     document.filename &&
//                                                     <a target='__black' href={document.file_url} className='text-tbutton-bg hover:text-tbutton-hover underline'>{document.filename}</a>
//                                                 }

//                                                 {
//                                                     !document.filename &&
//                                                     <span>No Document Uploaded</span>
//                                                 }
//                                             </TableCell>
//                                         </TableRow>
//                                     ))
//                                 }
//                             </TableBody>
//                         </Table>
//                     </div>
//                 </div>
//             }

//             {
//                 selectedTab == "signed" &&
//                 <div className='mt-4 w-full'>
//                     <div className="flex-1 overflow-auto">
//                         <Table className="border-collapse border border-primary rounded-md">
//                             <TableHeader className="border-b border-primary">
//                                 <TableRow>
//                                     <TableHead className="!w-[80px] border-r border-primary last:border-r-0 text-black">#</TableHead>
//                                     <TableHead className="w-[300px] border-r border-primary last:border-r-0 text-black">Name</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Description</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Date</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Status</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Action</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody className="divide-y divide-primary">
//                                 {
//                                     signed.map((document, index) => (
//                                         <TableRow key={document.signed_id}>
//                                             <TableCell className='border-r border-primary last:border-r-0 cursor-pointer text-black'>
//                                                 {index + 1}
//                                             </TableCell>

//                                             <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                                 {document.name}
//                                             </TableCell>

//                                             <TableCell className="border-r border-primary last:border-r-0 !p-1 text-center text-black">
//                                                 {document.description}
//                                             </TableCell>
//                                             <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                                 {moment(document.created_at).format("DD MMM YYYY")}
//                                             </TableCell>
//                                             <TableCell className='border-r border-primary last:border-r-0 !p-1 text-center text-black'>
//                                                 <span>{document.status}</span>
//                                             </TableCell>
//                                             <TableCell className='border-r border-primary last:border-r-0 !p-1 text-black text-center relative cursor-pointer group'>
//                                                 {
//                                                     document.sign_file_url &&
//                                                     <>
//                                                         <a target='__black' href={document.sign_file_url} className='text-tbutton-bg hover:text-tbutton-hover underline mr-3'>OPEN</a>
//                                                         <Link href={`/dashboard/signature/${document.signed_id}?file=${document.sign_file_url ? document.sign_file_url : document.file_url}&type=${document.mimeType}`} className='text-tbutton-bg hover:text-tbutton-hover underline'>Signature</Link>
//                                                     </>
//                                                 }

//                                                 {
//                                                     !document.sign_file_url &&
//                                                     <span>NA</span>
//                                                 }
//                                             </TableCell>
//                                         </TableRow>
//                                     ))
//                                 }
//                             </TableBody>
//                         </Table>
//                     </div>
//                 </div>
//             }

//             {
//                 selectedTab == "bill" &&
//                 <div className='mt-4 w-full'>
//                     <div className="flex-1 overflow-auto">
//                         <Table className="border-collapse border border-primary rounded-md">
//                             <TableHeader className="border-b border-primary">
//                                 <TableRow>
//                                     <TableHead className="!w-[80px] border-r border-primary last:border-r-0 text-black">#</TableHead>
//                                     <TableHead className="w-[300px] border-r border-primary last:border-r-0 text-black">Description</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Date</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Status</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Amount</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody className="divide-y divide-primary">
//                                 {
//                                     bills && bills.map((bill, index) => (
//                                         <TableRow key={bill.billing_id}>
//                                             <TableCell className='border-r border-primary last:border-r-0 cursor-pointer text-black'>
//                                                 {index + 1}
//                                             </TableCell>

//                                             <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                                 {bill.description}
//                                             </TableCell>
//                                             <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                                 {bill.start_date} - {bill.end_date}
//                                             </TableCell>

//                                             <TableCell className='border-r border-primary last:border-r-0 !p-1 text-black text-center relative cursor-pointer group'>
//                                                 <span>{bill.status}</span>
//                                             </TableCell>

//                                             <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                                 {bill.amount}$
//                                             </TableCell>
//                                         </TableRow>
//                                     ))
//                                 }
//                             </TableBody>
//                         </Table>
//                     </div>
//                 </div>
//             }

//             {
//                 selectedTab == "updates" &&
//                 <div className='mt-4 w-full'>
//                     <div className="flex-1 overflow-auto">
//                         <Table className="border-collapse border border-primary rounded-md">
//                             <TableHeader className="border-b border-primary">
//                                 <TableRow>
//                                     <TableHead className="!w-[80px] border-r border-primary last:border-r-0 text-black">#</TableHead>
//                                     <TableHead className="w-[300px] border-r border-primary last:border-r-0 text-black">Message</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Date</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">File</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody className="divide-y divide-primary">
//                                 {
//                                     updates.map((document, index) => (
//                                         <TableRow key={document.update_id}>
//                                             <TableCell className='border-r border-primary last:border-r-0 cursor-pointer text-black'>
//                                                 {index + 1}
//                                             </TableCell>

//                                             <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                                 {document.message}
//                                             </TableCell>
//                                             <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                                 {moment(document.created_at).format("DD MMM YYYY")}
//                                             </TableCell>
//                                             <TableCell className='border-r border-primary last:border-r-0 !p-1 text-black text-center relative cursor-pointer group'>
//                                                 {
//                                                     document.filename ?
//                                                         (
//                                                             <Link href={document.file_url} className='text-tbutton-bg hover:text-tbutton-hover underline'>{document.filename}</Link>
//                                                         ) :
//                                                         "No File Attach"
//                                                 }
//                                             </TableCell>
//                                         </TableRow>
//                                     ))
//                                 }
//                             </TableBody>
//                         </Table>
//                     </div>
//                 </div>
//             }

//             {
//                 selectedTab == "filed" &&
//                 <div className='mt-4 w-full'>
//                     <div className="flex-1 overflow-auto">
//                         <Table className="border-collapse border border-primary rounded-md">
//                             <TableHeader className="border-b border-primary">
//                                 <TableRow>
//                                     <TableHead className="!w-[80px] border-r border-primary last:border-r-0 text-black">#</TableHead>
//                                     <TableHead className="w-[300px] border-r border-primary last:border-r-0 text-black">Name</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Description</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Date</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Progress</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Status</TableHead>
//                                     <TableHead className="border-r border-primary last:border-r-0 text-black">Document</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody className="divide-y divide-primary">
//                                 {
//                                     filed.map((file, index) => (
//                                         <TableRow key={file.filed_id}>
//                                             <TableCell className='border-r border-primary last:border-r-0 cursor-pointer text-black'>
//                                                 {index + 1}
//                                             </TableCell>

//                                             <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                                 {file.name}
//                                             </TableCell>

//                                             <TableCell className="border-r border-primary last:border-r-0 !p-1 text-center text-black">
//                                                 {file.description}
//                                             </TableCell>
//                                             <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                                 {moment(file.date).format("DD MMM YYYY")}
//                                             </TableCell>
//                                             <TableCell className="border-r border-primary last:border-r-0 !p-1 text-center text-black">
//                                                 {file.progress}
//                                             </TableCell>
//                                             <TableCell className='border-r border-primary last:border-r-0 !p-1 text-center text-black'>
//                                                 <span>{file.status}</span>
//                                             </TableCell>

//                                             <TableCell className='border-r border-primary last:border-r-0 !p-1 text-center text-black'>
//                                                 {
//                                                     file.filename &&
//                                                     <a target='__black' href={file.file_url} className='text-tbutton-bg hover:text-tbutton-hover underline'>{file.filename}</a>
//                                                 }

//                                                 {
//                                                     !file.filename &&
//                                                     <span>NA</span>
//                                                 }
//                                             </TableCell>
//                                         </TableRow>
//                                     ))
//                                 }
//                             </TableBody>
//                         </Table>
//                     </div>
//                 </div>
//             }
//         </div>
//     )
// }

// export default page



'use client'
import { Button } from '@/components/Button'
import { getHistoryRequest } from '@/lib/http/client';
import moment from 'moment';
import React, { useState, useEffect, use, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    FileText,
    PenTool,
    DollarSign,
    MessageSquare,
    Briefcase,
    Search,
    Calendar,
    Eye,
    Download,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    History,
    Activity,
    Filter,
    ExternalLink,
    Ban,
    Play
} from 'lucide-react'
import { toast } from 'react-toastify';
import Loader from '@/components/Loader';
import Link from 'next/link';

const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
        case 'APPROVED':
        case 'COMPLETED':
        case 'PAID':
            return <CheckCircle className="h-4 w-4 text-emerald-600" />
        case 'REJECTED':
        case 'CANCELED':
        case 'OVERDUE':
            return <XCircle className="h-4 w-4 text-red-600" />
        case 'PROCESSING':
            return <Play className="h-4 w-4 text-blue-600" />
        case 'STUCK':
            return <AlertTriangle className="h-4 w-4 text-red-600" />
        case 'PENDING':
        case 'UNPAID':
        default:
            return <Clock className="h-4 w-4 text-amber-600" />
    }
}

const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
        case 'APPROVED':
        case 'COMPLETED':
        case 'PAID':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case 'REJECTED':
        case 'CANCELED':
        case 'OVERDUE':
            return 'bg-red-50 text-red-700 border-red-200'
        case 'PROCESSING':
            return 'bg-blue-50 text-blue-700 border-blue-200'
        case 'STUCK':
            return 'bg-red-50 text-red-700 border-red-200'
        case 'PENDING':
        case 'UNPAID':
        default:
            return 'bg-amber-50 text-amber-700 border-amber-200'
    }
}

const TabButton = ({ active, onClick, children, icon: Icon, count }) => (
    <Button
        className={`${active
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200'
            } transition-all duration-200 flex items-center space-x-2 px-4 py-2 rounded-lg font-medium`}
        onClick={onClick}
    >
        <Icon className="h-4 w-4" />
        <span>{children}</span>
        {count !== undefined && (
            <Badge variant={active ? "secondary" : "outline"} className={`ml-1 ${active ? 'bg-blue-500 text-white' : ''}`}>
                {count}
            </Badge>
        )}
    </Button>
)

const page = ({ params }) => {
    const { id } = use(params);
    const [documents, setDocuments] = useState([]);
    const [updates, setUpdates] = useState([]);
    const [filed, setFiled] = useState([]);
    const [bills, setBilling] = useState([]);
    const [signed, setSigned] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState("document");

    const getDocument = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getHistoryRequest(id);
            setDocuments(res?.data?.documents || []);
            setUpdates(res?.data?.updates || []);
            setBilling(res?.data?.billings || []);
            setSigned(res?.data?.signed || []);
            setFiled(res?.data?.filed || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getDocument();
    }, [id]);

    // Filter data based on search term
    const filterData = (data, searchFields) => {
        if (!searchTerm) return data;
        return data.filter(item =>
            searchFields.some(field =>
                item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    };

    const filteredDocuments = filterData(documents, ['name', 'description']);
    const filteredSigned = filterData(signed, ['name', 'description']);
    const filteredBills = filterData(bills, ['description']);
    const filteredUpdates = filterData(updates, ['message']);
    const filteredFiled = filterData(filed, ['name', 'description', 'progress']);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader />
                    <p className="text-gray-600 mt-4">Loading client history...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="px-6 py-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl shadow-lg">
                                    <History className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900">Client History</h1>
                                    <p className="text-lg text-gray-600 mt-2">
                                        Complete timeline of all client activities and interactions
                                    </p>
                                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                        <span className="flex items-center space-x-1">
                                            <Activity className="h-4 w-4" />
                                            <span>Last updated: {moment().format('MMM DD, YYYY [at] h:mm A')}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center space-x-6">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-indigo-600">
                                        {documents.length + signed.length + bills.length + updates.length + filed.length}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Records</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-blue-900">Documents</CardTitle>
                                <FileText className="h-5 w-5 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-900">{documents.length}</div>
                                <p className="text-sm text-blue-700">Total documents</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-purple-900">Signatures</CardTitle>
                                <PenTool className="h-5 w-5 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-900">{signed.length}</div>
                                <p className="text-sm text-purple-700">Signature requests</p>
                            </CardContent>
                        </Card>



                        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-amber-900">Updates</CardTitle>
                                <MessageSquare className="h-5 w-5 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-amber-900">{updates.length}</div>
                                <p className="text-sm text-amber-700">Status updates</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-rose-900">Filings</CardTitle>
                                <Briefcase className="h-5 w-5 text-rose-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-rose-900">{filed.length}</div>
                                <p className="text-sm text-rose-700">Project filings</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search and Navigation */}
                    <Card className="mb-8">
                        <CardContent className="pt-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                                <div className="flex items-center space-x-4">
                                    <div className="relative flex-1 lg:w-80">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Search across all records..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 h-10"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <TabButton
                                        active={selectedTab === "document"}
                                        onClick={() => setSelectedTab("document")}
                                        icon={FileText}
                                        count={documents.length}
                                    >
                                        Documents
                                    </TabButton>
                                    <TabButton
                                        active={selectedTab === "signed"}
                                        onClick={() => setSelectedTab("signed")}
                                        icon={PenTool}
                                        count={signed.length}
                                    >
                                        Signatures
                                    </TabButton>

                                    <TabButton
                                        active={selectedTab === "updates"}
                                        onClick={() => setSelectedTab("updates")}
                                        icon={MessageSquare}
                                        count={updates.length}
                                    >
                                        Updates
                                    </TabButton>
                                    <TabButton
                                        active={selectedTab === "filed"}
                                        onClick={() => setSelectedTab("filed")}
                                        icon={Briefcase}
                                        count={filed.length}
                                    >
                                        Filings
                                    </TabButton>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents Tab */}
                    {selectedTab === "document" && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        <span>Document History</span>
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-gray-50">
                                        {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                                <TableHead className="w-16 text-center font-semibold text-gray-700">#</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Document Name</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Description</TableHead>
                                                <TableHead className="w-32 font-semibold text-gray-700">Date</TableHead>
                                                <TableHead className="w-24 text-center font-semibold text-gray-700">Status</TableHead>
                                                <TableHead className="w-32 text-center font-semibold text-gray-700">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredDocuments.length > 0 ? filteredDocuments.map((document, index) => (
                                                <TableRow key={document.document_id} className="hover:bg-gray-50 transition-colors">
                                                    <TableCell className="text-center font-medium text-gray-600">
                                                        {documents.indexOf(document) + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                                                                <FileText className="h-4 w-4 text-blue-600" />
                                                            </div>
                                                            <span className="font-medium text-gray-900">{document.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-700 max-w-xs truncate" title={document.description}>
                                                        {document.description}
                                                    </TableCell>
                                                    <TableCell className="text-gray-600 text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{moment(document.created_at).format("MMM DD, YYYY")}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge className={`${getStatusColor(document.status)} border flex items-center space-x-1 justify-center`}>
                                                            {getStatusIcon(document.status)}
                                                            <span>{document.status}</span>
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {document.filename ? (
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => window.open(document.file_url, '_blank')}
                                                                    className="h-8 px-3"
                                                                >
                                                                    <Eye className="h-3 w-3 mr-1" />
                                                                    View
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">
                                                                No file
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-12 text-center">
                                                        <div className="flex flex-col items-center space-y-3">
                                                            <FileText className="h-12 w-12 text-gray-300" />
                                                            <p className="text-gray-500 font-medium">No documents found</p>
                                                            <p className="text-gray-400 text-sm">
                                                                {searchTerm ? 'Try adjusting your search terms' : 'No document history available'}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Signatures Tab */}
                    {selectedTab === "signed" && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                                        <PenTool className="h-5 w-5 text-purple-600" />
                                        <span>Signature History</span>
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-gray-50">
                                        {filteredSigned.length} {filteredSigned.length === 1 ? 'signature' : 'signatures'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                                <TableHead className="w-16 text-center font-semibold text-gray-700">#</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Document Name</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Description</TableHead>
                                                <TableHead className="w-32 font-semibold text-gray-700">Date</TableHead>
                                                <TableHead className="w-24 text-center font-semibold text-gray-700">Status</TableHead>
                                                <TableHead className="w-40 text-center font-semibold text-gray-700">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSigned.length > 0 ? filteredSigned.map((document, index) => (
                                                <TableRow key={document.signed_id} className="hover:bg-gray-50 transition-colors">
                                                    <TableCell className="text-center font-medium text-gray-600">
                                                        {signed.indexOf(document) + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                                                                <PenTool className="h-4 w-4 text-purple-600" />
                                                            </div>
                                                            <span className="font-medium text-gray-900">{document.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-700 max-w-xs truncate" title={document.description}>
                                                        {document.description}
                                                    </TableCell>
                                                    <TableCell className="text-gray-600 text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{moment(document.created_at).format("MMM DD, YYYY")}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge className={`${getStatusColor(document.status)} border flex items-center space-x-1 justify-center`}>
                                                            {getStatusIcon(document.status)}
                                                            <span>{document.status}</span>
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {document.sign_file_url ? (
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => window.open(document.sign_file_url, '_blank')}
                                                                    className="h-8 px-3"
                                                                >
                                                                    <Eye className="h-3 w-3 mr-1" />
                                                                    View
                                                                </Button>
                                                                <Link href={`/dashboard/signature/${document.signed_id}?file=${document.sign_file_url || document.file_url}&type=${document.mimeType}`}>
                                                                    <Button size="sm" className="h-8 px-3 bg-purple-600 hover:bg-purple-700">
                                                                        <PenTool className="h-3 w-3 mr-1" />
                                                                        Sign
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">
                                                                No document
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-12 text-center">
                                                        <div className="flex flex-col items-center space-y-3">
                                                            <PenTool className="h-12 w-12 text-gray-300" />
                                                            <p className="text-gray-500 font-medium">No signatures found</p>
                                                            <p className="text-gray-400 text-sm">
                                                                {searchTerm ? 'Try adjusting your search terms' : 'No signature history available'}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}



                    {/* Updates Tab */}
                    {selectedTab === "updates" && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                                        <MessageSquare className="h-5 w-5 text-amber-600" />
                                        <span>Updates History</span>
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-gray-50">
                                        {filteredUpdates.length} {filteredUpdates.length === 1 ? 'update' : 'updates'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                                <TableHead className="w-16 text-center font-semibold text-gray-700">#</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Message</TableHead>
                                                <TableHead className="w-32 font-semibold text-gray-700">Date</TableHead>
                                                <TableHead className="w-32 text-center font-semibold text-gray-700">Attachment</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUpdates.length > 0 ? filteredUpdates.map((update, index) => (
                                                <TableRow key={update.update_id} className="hover:bg-gray-50 transition-colors">
                                                    <TableCell className="text-center font-medium text-gray-600">
                                                        {updates.indexOf(update) + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-start space-x-3">
                                                            <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-lg mt-1">
                                                                <MessageSquare className="h-4 w-4 text-amber-600" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-gray-900 leading-relaxed">{update.message}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600 text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{moment(update.created_at).format("MMM DD, YYYY")}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {update.filename ? (
                                                            <Link href={update.file_url} target="_blank">
                                                                <Button size="sm" variant="outline" className="h-8 px-3">
                                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                                    View File
                                                                </Button>
                                                            </Link>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">
                                                                No attachment
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="py-12 text-center">
                                                        <div className="flex flex-col items-center space-y-3">
                                                            <MessageSquare className="h-12 w-12 text-gray-300" />
                                                            <p className="text-gray-500 font-medium">No updates found</p>
                                                            <p className="text-gray-400 text-sm">
                                                                {searchTerm ? 'Try adjusting your search terms' : 'No update history available'}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Filed Tab */}
                    {selectedTab === "filed" && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                                        <Briefcase className="h-5 w-5 text-rose-600" />
                                        <span>Filing History</span>
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-gray-50">
                                        {filteredFiled.length} {filteredFiled.length === 1 ? 'filing' : 'filings'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                                <TableHead className="w-16 text-center font-semibold text-gray-700">#</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Filing Name</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Description</TableHead>
                                                <TableHead className="w-32 font-semibold text-gray-700">Date</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Progress</TableHead>
                                                <TableHead className="w-24 text-center font-semibold text-gray-700">Status</TableHead>
                                                <TableHead className="w-32 text-center font-semibold text-gray-700">Document</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredFiled.length > 0 ? filteredFiled.map((file, index) => (
                                                <TableRow key={file.filed_id} className="hover:bg-gray-50 transition-colors">
                                                    <TableCell className="text-center font-medium text-gray-600">
                                                        {filed.indexOf(file) + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex items-center justify-center w-8 h-8 bg-rose-100 rounded-lg">
                                                                <Briefcase className="h-4 w-4 text-rose-600" />
                                                            </div>
                                                            <span className="font-medium text-gray-900">{file.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-700 max-w-xs truncate" title={file.description}>
                                                        {file.description}
                                                    </TableCell>
                                                    <TableCell className="text-gray-600 text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{moment(file.date).format("MMM DD, YYYY")}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-700 max-w-xs truncate" title={file.progress}>
                                                        {file.progress}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge className={`${getStatusColor(file.status)} border flex items-center space-x-1 justify-center`}>
                                                            {getStatusIcon(file.status)}
                                                            <span>{file.status}</span>
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {file.filename ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => window.open(file.file_url, '_blank')}
                                                                className="h-8 px-3"
                                                            >
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                View
                                                            </Button>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">
                                                                No document
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="py-12 text-center">
                                                        <div className="flex flex-col items-center space-y-3">
                                                            <Briefcase className="h-12 w-12 text-gray-300" />
                                                            <p className="text-gray-500 font-medium">No filings found</p>
                                                            <p className="text-gray-400 text-sm">
                                                                {searchTerm ? 'Try adjusting your search terms' : 'No filing history available'}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

export default page