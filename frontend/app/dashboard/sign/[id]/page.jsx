// 'use client'
// import React, { use, useCallback, useEffect, useState } from 'react'

// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table"


// import { useUser } from '@/providers/UserProvider';
// import { Button } from '@/components/Button';
// import BigDialog from '@/components/Dialogs/BigDialog';
// import { Label } from '@/components/ui/label';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { toast } from 'react-toastify';
// import { createSignRequest, getDocuemtnRequest, getSignedRequest, requestDocuemtnRequest, updateSignedStatusRequest, updateStatusRequest, uploadDocumentRequest, uploadSignRequest } from '@/lib/http/client';
// import Loader from '@/components/Loader';
// import moment from 'moment';
// import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
// import Link from 'next/link';

// const page = ({ params }) => {
//     const { id } = use(params);
//     const [open, setOpen] = useState(false);
//     const [documents, setDocuments] = useState([]);
//     const [submitLoading, setSubmitLoading] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [formdata, setFormdata] = useState({
//         name: '',
//         description: '',
//         file: '',
//         project_client_id: id
//     });

//     const { user } = useUser();
//     const getSignDocument = useCallback(async () => {
//         setLoading(true);
//         try {
//             const res = await getSignedRequest(id);
//             setDocuments(res?.data?.signed);
//         } catch (error) {
//             toast.error(error?.response?.data?.message || error?.message);
//         } finally {
//             setLoading(false);
//         }
//     }, [id]);

//     useEffect(() => {
//         getSignDocument();
//     }, [id]);

//     const handleFormChange = useCallback((e) => {
//         setFormdata(prev => ({ ...prev, [e.target.name]: e.target.value }));
//     }, []);


//     const handleDocumentRequest = useCallback(async (e) => {
//         e.preventDefault();
//         setSubmitLoading(true);
//         try {
//             const res = await createSignRequest(formdata);
//             toast.success(res.data?.message);
//         } catch (error) {
//             toast.error(error?.response?.data?.message || error?.message);
//         } finally {
//             setOpen(false);
//             setSubmitLoading(false);
//             getSignDocument();
//         }
//     }, [formdata]);

//     const hadleUpload = useCallback(async (e, signed_id) => {
//         try {
//             const [file] = e.target.files;
//             const formdata = {
//                 file,
//                 signed_id
//             }
//             const res = await uploadSignRequest(formdata);
//             toast.success(res.data.message)
//         } catch (error) {
//             toast.error(error.response?.data?.message || error.message);
//         } finally {
//             getSignDocument()
//         }
//     }, []);


//     const handleUpdateStatus = useCallback(async (status, signed_id) => {
//         try {
//             const formdata = {
//                 status,
//                 signed_id
//             }

//             const res = await updateSignedStatusRequest(formdata);
//             toast.success(res.data.message)
//         } catch (error) {
//             toast.error(error.response?.data?.message || error.message);
//         } finally {
//             getSignDocument();
//         }
//     }, []);


//     const handleFileChange = useCallback((e) => {
//         const [file] = e.target.files;
//         setFormdata(prev => ({ ...prev, file }));
//     }, []);


//     if (loading) {
//         return <>
//             <div className="h-screen bg-white m-2 rounded-md flex items-center justify-center">
//                 <Loader />
//             </div>
//         </>
//     }


//     return (
//         <>
//             <main className="flex-1 overflow-auto p-8 bg-white m-2 rounded-md">
//                 {
//                     user?.Role == "PROVIDER" &&
//                     <div className="mb-8 flex items-center justify-between">
//                         <h1 className="text-3xl font-semibold text-black">Signature Document</h1>
//                         <Button className='bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all' onClick={() => setOpen(true)}>
//                             Request Signature
//                         </Button>
//                     </div>
//                 }

//                 <div className="flex-1 overflow-auto">
//                     <Table className="border-collapse border border-primary rounded-md">
//                         <TableHeader className="border-b border-primary">
//                             <TableRow>
//                                 <TableHead className="!w-[80px] border-r border-primary last:border-r-0 text-black">#</TableHead>
//                                 <TableHead className="w-[300px] border-r border-primary last:border-r-0 text-black">Name</TableHead>
//                                 <TableHead className="border-r border-primary last:border-r-0 text-black">Description</TableHead>
//                                 <TableHead className="border-r border-primary last:border-r-0 text-black">Date</TableHead>
//                                 <TableHead className="border-r border-primary last:border-r-0 text-black">Status</TableHead>
//                                 <TableHead className="border-r border-primary last:border-r-0 text-black">Action</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody className="divide-y divide-primary">
//                             {
//                                 documents.map((document, index) => (
//                                     <TableRow>
//                                         <TableCell className='border-r border-primary last:border-r-0 cursor-pointer text-black'>
//                                             {index + 1}
//                                         </TableCell>

//                                         <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                             {document.name}
//                                         </TableCell>

//                                         <TableCell className="border-r border-primary last:border-r-0 !p-1 text-center text-black">
//                                             {document.description}
//                                         </TableCell>
//                                         <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                             {moment(document.created_at).format("DD MMM YYYY")}
//                                         </TableCell>
//                                         <TableCell className='border-r border-primary last:border-r-0 !p-1 text-center text-black'>
//                                             {
//                                                 user?.Role == "PROVIDER" &&
//                                                 (
//                                                     <Select onValueChange={(status) => handleUpdateStatus(status, document.signed_id)} value={document.status} className='w-full'>
//                                                         <SelectTrigger className="w-full">
//                                                             <SelectValue placeholder="Select a status" />
//                                                         </SelectTrigger>
//                                                         <SelectContent>
//                                                             <SelectGroup>
//                                                                 <SelectLabel>Status</SelectLabel>
//                                                                 <SelectItem value="PENDING">PENDING</SelectItem>
//                                                                 <SelectItem value="REJECTED">REJECTED</SelectItem>
//                                                                 <SelectItem value="APPROVED">APPROVED</SelectItem>
//                                                             </SelectGroup>
//                                                         </SelectContent>
//                                                     </Select>
//                                                 )
//                                             }
//                                             {
//                                                 user?.Role == "CLIENT" &&
//                                                 (
//                                                     <span>{document.status}</span>
//                                                 )
//                                             }
//                                         </TableCell>
//                                         <TableCell className='border-r border-primary last:border-r-0 !p-1 text-black text-center relative cursor-pointer group'>
//                                             {
//                                                 user?.Role == "PROVIDER" &&
//                                                 (
//                                                     <>
//                                                         {
//                                                             document.sign_file_url &&
//                                                             <>
//                                                                 <a target='__black' href={document.sign_file_url} className='text-tbutton-bg hover:text-tbutton-hover underline mr-3'>OPEN</a>
//                                                                 <Link href={`/dashboard/signature/${document.signed_id}?file=${document.sign_file_url ? document.sign_file_url : document.file_url}&type=${document.mimeType}`} className='text-tbutton-bg hover:text-tbutton-hover underline'>Signature</Link>
//                                                             </>
//                                                         }

//                                                         {
//                                                             !document.sign_file_url &&
//                                                             <span>NA</span>
//                                                         }
//                                                     </>
//                                                 )
//                                             }
//                                             {
//                                                 user?.Role == "CLIENT" &&
//                                                 (
//                                                     <div className='flex items-center gap-3'>
//                                                         {
//                                                             document.sign_file_url &&
//                                                             <a target='__black' href={document.sign_file_url} className='text-tbutton-bg hover:text-tbutton-hover underline'>OPEN</a>
//                                                         }
//                                                         <Link href={`/dashboard/signature/${document.signed_id}?file=${document.sign_file_url ? document.sign_file_url : document.file_url}&type=${document.mimeType}`} className='text-tbutton-bg hover:text-tbutton-hover underline'>Signature</Link>
//                                                     </div>
//                                                 )
//                                             }
//                                         </TableCell>
//                                     </TableRow>
//                                 ))
//                             }
//                         </TableBody>
//                     </Table>
//                 </div>
//             </main>

//             <BigDialog open={open} onClose={() => setOpen(false)} width={'38'}>
//                 <form className='space-y-8 mt-20 px-5' onSubmit={handleDocumentRequest}>
//                     <div className="space-y-2">
//                         <Label htmlFor="name" className="text-black">Name</Label>
//                         <Input
//                             id="name"
//                             type="text"
//                             name="name"
//                             placeholder="Document Name"
//                             value={formdata.name}
//                             onChange={handleFormChange}
//                             required
//                             className="bg-white border-primary text-black"
//                         />
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="description" className="text-black">Description</Label>
//                         <Textarea
//                             id="description"
//                             type="text"
//                             name="description"
//                             placeholder="Document Description"
//                             value={formdata.description}
//                             onChange={handleFormChange}
//                             required
//                             className="bg-white border-primary text-black"
//                         />
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="file" className="text-black">Document</Label>
//                         <Input
//                             id="file"
//                             type="file"
//                             name="file"
//                             onChange={handleFileChange}
//                             required
//                             accept="application/pdf, image/png, image/jpeg, image/jpg"
//                             className="bg-white border-primary text-black"
//                         />
//                     </div>
//                     <Button className='bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all w-full disabled:opacity-40' isLoading={submitLoading} disabled={submitLoading}>
//                         {submitLoading ? "Loading..." : "Request"}
//                     </Button>
//                 </form>
//             </BigDialog>
//         </>
//     )
// }

// export default page




'use client'
import React, { use, useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    PenTool,
    Plus,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Search,
    Filter,
    User,
    Activity,
    Download,
    Eye,
    Upload,
    FileSignature,
    ExternalLink,
    FilePlus
} from 'lucide-react'
import { useUser } from '@/providers/UserProvider';
import { Button } from '@/components/Button';
import BigDialog from '@/components/Dialogs/BigDialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
import { createSignRequest, getDocuemtnRequest, getSignedRequest, requestDocuemtnRequest, updateSignedStatusRequest, updateStatusRequest, uploadDocumentRequest, uploadSignRequest } from '@/lib/http/client';
import Loader from '@/components/Loader';
import moment from 'moment';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

const getStatusIcon = (status) => {
    switch (status) {
        case 'APPROVED':
        case 'SIGNED':
            return <CheckCircle className="h-4 w-4 text-emerald-600" />
        case 'REJECTED':
            return <XCircle className="h-4 w-4 text-red-600" />
        case 'PENDING':
        default:
            return <Clock className="h-4 w-4 text-amber-600" />
    }
}

const getStatusColor = (status) => {
    switch (status) {
        case 'APPROVED':
        case 'SIGNED':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case 'REJECTED':
            return 'bg-red-50 text-red-700 border-red-200'
        case 'PENDING':
        default:
            return 'bg-amber-50 text-amber-700 border-amber-200'
    }
}

const page = ({ params }) => {
    const { id } = use(params);
    const [open, setOpen] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [formdata, setFormdata] = useState({
        name: '',
        description: '',
        file: '',
        project_client_id: id
    });

    const { user } = useUser();

    const getSignDocument = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getSignedRequest(id);
            setDocuments(res?.data?.signed || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getSignDocument();
    }, [id]);

    const handleFormChange = useCallback((e) => {
        setFormdata(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleDocumentRequest = useCallback(async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const res = await createSignRequest(formdata);
            toast.success(res.data?.message);
            setFormdata({
                name: '',
                description: '',
                file: '',
                project_client_id: id
            });
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setOpen(false);
            setSubmitLoading(false);
            getSignDocument();
        }
    }, [formdata, id]);

    const hadleUpload = useCallback(async (e, signed_id) => {
        try {
            const [file] = e.target.files;
            if (!file) return;

            const formdata = {
                file,
                signed_id
            }
            const res = await uploadSignRequest(formdata);
            toast.success(res.data.message)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            getSignDocument()
        }
    }, [getSignDocument]);

    const handleUpdateStatus = useCallback(async (status, signed_id) => {
        try {
            const formdata = {
                status,
                signed_id
            }

            const res = await updateSignedStatusRequest(formdata);
            toast.success(res.data.message)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            getSignDocument();
        }
    }, [getSignDocument]);

    const handleFileChange = useCallback((e) => {
        const [file] = e.target.files;
        setFormdata(prev => ({ ...prev, file }));
    }, []);

    // Filter documents based on search and status
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate statistics
    const stats = {
        total: documents.length,
        pending: documents.filter(doc => doc.status === 'PENDING').length,
        approved: documents.filter(doc => doc.status === 'APPROVED' || doc.status === 'SIGNED').length,
        rejected: documents.filter(doc => doc.status === 'REJECTED').length,
        signed: documents.filter(doc => doc.sign_file_url).length
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader />
                    <p className="text-gray-600 mt-4">Loading signature documents...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-7xl">
                    {/* Header Section */}
                    <div className="bg-white shadow-sm border-b border-gray-200">
                        <div className="px-6 py-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg">
                                        <PenTool className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold text-gray-900">Signature Documents</h1>
                                        <p className="text-lg text-gray-600 mt-2">
                                            {user?.Role === "PROVIDER" ? "Manage signature requests and track document signing" : "View and sign your documents"}
                                        </p>
                                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                            <span className="flex items-center space-x-1">
                                                <User className="h-4 w-4" />
                                                <span>Role: {user?.Role === "PROVIDER" ? "Attorney" : "Client"}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <Activity className="h-4 w-4" />
                                                <span>Last updated: {moment().format('MMM DD, YYYY [at] h:mm A')}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {user?.Role === "PROVIDER" && (
                                    <Button
                                        onClick={() => setOpen(true)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
                                    >
                                        <Plus className="h-5 w-5" />
                                        <span>Request Signature</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-8">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-purple-900">Total Documents</CardTitle>
                                    <FileSignature className="h-5 w-5 text-purple-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-purple-900">{stats.total}</div>
                                    <p className="text-sm text-purple-700">All signature requests</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-amber-900">Pending</CardTitle>
                                    <Clock className="h-5 w-5 text-amber-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-amber-900">{stats.pending}</div>
                                    <p className="text-sm text-amber-700">Awaiting signature</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-emerald-900">Approved</CardTitle>
                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-emerald-900">{stats.approved}</div>
                                    <p className="text-sm text-emerald-700">Successfully signed</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-red-900">Rejected</CardTitle>
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-red-900">{stats.rejected}</div>
                                    <p className="text-sm text-red-700">Need revision</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-blue-900">Signed Files</CardTitle>
                                    <PenTool className="h-5 w-5 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-900">{stats.signed}</div>
                                    <p className="text-sm text-blue-700">With signatures</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filters and Search */}
                        <Card className="mb-8">
                            <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="relative flex-1 md:w-80">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                placeholder="Search signature documents..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 h-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Filter className="h-4 w-4 text-gray-500" />
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                                        >
                                            <option value="ALL">All Status</option>
                                            <option value="PENDING">Pending</option>
                                            <option value="APPROVED">Approved</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Documents Table */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-semibold">Signature Requests</CardTitle>
                                    <Badge variant="outline" className="bg-gray-50">
                                        {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50 hover:bg-gray-50">
                                                    <TableHead className="w-16 text-center font-semibold text-gray-700">#</TableHead>
                                                    <TableHead className="font-semibold text-gray-700">Document Name</TableHead>
                                                    <TableHead className="font-semibold text-gray-700">Description</TableHead>
                                                    <TableHead className="w-32 font-semibold text-gray-700">Date Created</TableHead>
                                                    <TableHead className="w-32 text-center font-semibold text-gray-700">Status</TableHead>
                                                    <TableHead className="w-48 text-center font-semibold text-gray-700">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredDocuments.length > 0 ? filteredDocuments.map((document, index) => (
                                                    <TableRow key={document.signed_id} className="hover:bg-gray-50 transition-colors">
                                                        <TableCell className="text-center font-medium text-gray-600">
                                                            {documents.indexOf(document) + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center space-x-3">
                                                                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                                                                    <PenTool className="h-4 w-4 text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{document.name}</p>
                                                                    {document.sign_file_url && (
                                                                        <p className="text-xs text-emerald-600 font-medium">✓ Signed</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="max-w-xs">
                                                                <p className="text-gray-700 line-clamp-2" title={document.description}>
                                                                    {document.description}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-gray-600 text-sm">
                                                            <div className="flex items-center space-x-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>{moment(document.created_at).format("MMM DD, YYYY")}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {user?.Role === "PROVIDER" ? (
                                                                <Select
                                                                    onValueChange={(status) => handleUpdateStatus(status, document.signed_id)}
                                                                    value={document.status}
                                                                >
                                                                    <SelectTrigger className="w-32 h-8">
                                                                        <div className="flex items-center space-x-2">
                                                                            {getStatusIcon(document.status)}
                                                                            <SelectValue />
                                                                        </div>
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectGroup>
                                                                            <SelectLabel>Update Status</SelectLabel>
                                                                            <SelectItem value="PENDING">
                                                                                <div className="flex items-center space-x-2">
                                                                                    <Clock className="h-4 w-4 text-amber-600" />
                                                                                    <span>Pending</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="APPROVED">
                                                                                <div className="flex items-center space-x-2">
                                                                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                                                                    <span>Approved</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="REJECTED">
                                                                                <div className="flex items-center space-x-2">
                                                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                                                    <span>Rejected</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        </SelectGroup>
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : (
                                                                <Badge className={`${getStatusColor(document.status)} border flex items-center space-x-1 justify-center`}>
                                                                    {getStatusIcon(document.status)}
                                                                    <span>{document.status}</span>
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center justify-center space-x-2">
                                                                {user?.Role === "PROVIDER" ? (
                                                                    <>
                                                                        {document.sign_file_url ? (
                                                                            <div className="flex items-center space-x-2">
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
                                                                                        Review
                                                                                    </Button>
                                                                                </Link>
                                                                            </div>
                                                                        ) : (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                Not signed yet
                                                                            </Badge>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <div className="flex items-center space-x-2">
                                                                        {document.sign_file_url && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => window.open(document.sign_file_url, '_blank')}
                                                                                className="h-8 px-3"
                                                                            >
                                                                                <Eye className="h-3 w-3 mr-1" />
                                                                                View
                                                                            </Button>
                                                                        )}
                                                                        <Link href={`/dashboard/signature/${document.signed_id}?file=${document.sign_file_url || document.file_url}&type=${document.mimeType}`}>
                                                                            <Button size="sm" className="h-8 px-3 bg-purple-600 hover:bg-purple-700">
                                                                                <PenTool className="h-3 w-3 mr-1" />
                                                                                {document.sign_file_url ? 'View Signature' : 'Sign Document'}
                                                                            </Button>
                                                                        </Link>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="py-12">
                                                            <div className="text-center">
                                                                <div className="flex flex-col items-center space-y-3">
                                                                    <PenTool className="h-12 w-12 text-gray-300" />
                                                                    <p className="text-gray-500 font-medium">No signature documents found</p>
                                                                    <p className="text-gray-400 text-sm">
                                                                        {searchTerm || statusFilter !== 'ALL'
                                                                            ? 'Try adjusting your search or filter criteria'
                                                                            : user?.Role === "PROVIDER"
                                                                                ? 'Click "Request Signature" to create a new signature request'
                                                                                : 'No signature requests have been created yet'
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Request Signature Dialog */}
            <BigDialog open={open} onClose={() => setOpen(false)} width={'40'}>
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                            <FilePlus className="h-8 w-8 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Request Signature</h2>
                        <p className="text-gray-600 mt-2">Create a new signature request for document signing</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleDocumentRequest}>
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                Document Name *
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                name="name"
                                placeholder="Enter document name..."
                                value={formdata.name}
                                onChange={handleFormChange}
                                required
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                Description *
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Provide details about what needs to be signed..."
                                value={formdata.description}
                                onChange={handleFormChange}
                                required
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="file" className="text-sm font-medium text-gray-700">
                                Document File *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="file"
                                    type="file"
                                    name="file"
                                    onChange={handleFileChange}
                                    required
                                    accept="application/pdf, image/png, image/jpeg, image/jpg"
                                    className="h-10"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <Upload className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">Supported formats: PDF, PNG, JPEG, JPG</p>
                        </div>

                        <div className="flex space-x-3 pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="flex-1"
                                disabled={submitLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                                disabled={submitLoading}
                            >
                                {submitLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Creating...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <PenTool className="h-4 w-4" />
                                        <span>Create Request</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </BigDialog>
        </>
    )
}

export default page