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
// import { createFiledRequest, getFilledRequest, updateFiledStatusRequest, updateStatusRequest } from '@/lib/http/client';
// import Loader from '@/components/Loader';
// import moment from 'moment';
// import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
// import Link from 'next/link';

// const page = ({ params }) => {
//     const { id } = use(params);
//     const [open, setOpen] = useState(false);
//     const [filed, setFiled] = useState([]);
//     const [submitLoading, setSubmitLoading] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [formdata, setFormdata] = useState({
//         name: '',
//         description: '',
//         date: '',
//         progress: '',
//         project_client_id: id,
//         file: null,
//     });
//     const { user } = useUser();
//     const getFiled = useCallback(async () => {
//         setLoading(true);
//         try {
//             const res = await getFilledRequest(id);
//             setFiled(res?.data?.filed);
//         } catch (error) {
//             toast.error(error?.response?.data?.message || error?.message);
//         } finally {
//             setLoading(false);
//         }
//     }, [id]);

//     useEffect(() => {
//         getFiled();
//     }, [id]);

//     const handleFormChange = useCallback((e) => {
//         setFormdata(prev => ({ ...prev, [e.target.name]: e.target.value }));
//     }, []);


//     const handleCreateFiled = useCallback(async (e) => {
//         e.preventDefault();
//         setSubmitLoading(true);
//         try {
//             const res = await createFiledRequest(formdata);
//             toast.success(res.data?.message);
//         } catch (error) {
//             toast.error(error?.response?.data?.message || error?.message);
//         } finally {
//             setOpen(false);
//             setSubmitLoading(false);
//             getFiled();
//         }
//     }, [formdata]);




//     const handleUpdateStatus = useCallback(async (status, filled_id) => {
//         try {
//             const formdata = {
//                 status,
//                 filled_id
//             }

//             const res = await updateFiledStatusRequest(formdata);
//             toast.success(res.data.message)
//         } catch (error) {
//             toast.error(error.response?.data?.message || error.message);
//         } finally {
//             getFiled();
//         }
//     }, [])

//     const handleDocumentChange = useCallback((e) => {
//         const file = e.target.files[0];
//         setFormdata(prev => ({ ...prev, file }));
//     }, []);


//     if (loading) {
//         return <>
//             <div className="h-screen bg-whitee m-2 rounded-md flex items-center justify-center">
//                 <Loader />
//             </div>
//         </>
//     }


//     return (
//         <>
//             <main className="flex-1 overflow-auto p-8 bg-whitee m-2 rounded-md">
//                 {
//                     user?.Role == "PROVIDER" &&
//                     <div className="mb-8 flex items-center justify-between">
//                         <h1 className="text-3xl font-semibold text-black">Project Filed</h1>
//                         <Button className='bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all' onClick={() => setOpen(true)}>
//                             Create Filed
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
//                                 <TableHead className="border-r border-primary last:border-r-0 text-black">Progress</TableHead>
//                                 <TableHead className="border-r border-primary last:border-r-0 text-black">Status</TableHead>
//                                 <TableHead className="border-r border-primary last:border-r-0 text-black">Document</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody className="divide-y divide-primary">
//                             {
//                                 filed.map((file, index) => (
//                                     <TableRow>
//                                         <TableCell className='border-r border-primary last:border-r-0 cursor-pointer text-black'>
//                                             {index + 1}
//                                         </TableCell>

//                                         <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                             {file.name}
//                                         </TableCell>

//                                         <TableCell className="border-r border-primary last:border-r-0 !p-1 text-center text-black">
//                                             {file.description}
//                                         </TableCell>
//                                         <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                             {moment(file.date).format("DD MMM YYYY")}
//                                         </TableCell>
//                                         <TableCell className="border-r border-primary last:border-r-0 !p-1 text-center text-black">
//                                             {file.progress}
//                                         </TableCell>
//                                         <TableCell className='border-r border-primary last:border-r-0 !p-1 text-center text-black'>
//                                             {
//                                                 user?.Role == "PROVIDER" &&
//                                                 (
//                                                     <Select onValueChange={(status) => handleUpdateStatus(status, file.filled_id)} value={file.status} className='w-full'>
//                                                         <SelectTrigger className="w-full">
//                                                             <SelectValue placeholder="Select a status" />
//                                                         </SelectTrigger>
//                                                         <SelectContent>
//                                                             <SelectGroup>
//                                                                 <SelectLabel>Status</SelectLabel>
//                                                                 <SelectItem value="PENDING">PENDING</SelectItem>
//                                                                 <SelectItem value="COMPLETED">COMPLETED</SelectItem>
//                                                                 <SelectItem value="STUCK">STUCK</SelectItem>
//                                                                 <SelectItem value="PROCESSING">PROCESSING</SelectItem>
//                                                                 <SelectItem value="CANCELED">CANCELED</SelectItem>
//                                                             </SelectGroup>
//                                                         </SelectContent>
//                                                     </Select>
//                                                 )
//                                             }
//                                             {
//                                                 user?.Role == "CLIENT" &&
//                                                 (
//                                                     <span>{file.status}</span>
//                                                 )
//                                             }
//                                         </TableCell>

//                                         <TableCell className='border-r border-primary last:border-r-0 !p-1 text-center text-black'>
//                                             {
//                                                 file.filename &&
//                                                 <a target='__black' href={file.file_url} className='text-tbutton-bg hover:text-tbutton-hover underline'>{file.filename}</a>
//                                             }
//                                             {
//                                                 !file.filename &&
//                                                 <span>NA</span>
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
//                 <form className='space-y-8 mt-5 px-5' onSubmit={handleCreateFiled}>
//                     <div className="space-y-2">
//                         <Label htmlFor="name" className="text-black">Name</Label>
//                         <Input
//                             id="name"
//                             type="text"
//                             name="name"
//                             placeholder="Name"
//                             value={formdata.name}
//                             onChange={handleFormChange}
//                             required
//                             className="bg-white border-primary text-black"
//                         />
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="date" className="text-black">Date</Label>
//                         <Input
//                             id="date"
//                             type="date"
//                             name="date"
//                             placeholder="Date"
//                             value={formdata.date}
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
//                             placeholder="Description"
//                             value={formdata.description}
//                             onChange={handleFormChange}
//                             required
//                             className="bg-white border-primary text-black"
//                         />
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="progress" className="text-black">Progress</Label>
//                         <Textarea
//                             id="progress"
//                             type="text"
//                             name="progress"
//                             placeholder="Progress"
//                             value={formdata.progress}
//                             onChange={handleFormChange}
//                             required
//                             className="bg-white border-primary text-black"
//                         />
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="document" className="text-black">Document (optional)</Label>
//                         <Input
//                             id="document"
//                             type="file"
//                             name="document"
//                             placeholder="document"
//                             onChange={handleDocumentChange}
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
    FileText,
    Plus,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Search,
    Filter,
    User,
    Activity,
    Download,
    Eye,
    Upload,
    Briefcase,
    TrendingUp,
    Pause,
    Play,
    Ban
} from 'lucide-react'
import { useUser } from '@/providers/UserProvider';
import { Button } from '@/components/Button';
import BigDialog from '@/components/Dialogs/BigDialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
import { createFiledRequest, getFilledRequest, updateFiledStatusRequest, updateStatusRequest } from '@/lib/http/client';
import Loader from '@/components/Loader';
import moment from 'moment';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

const getStatusIcon = (status) => {
    switch (status) {
        case 'COMPLETED':
            return <CheckCircle className="h-4 w-4 text-emerald-600" />
        case 'PROCESSING':
            return <Play className="h-4 w-4 text-blue-600" />
        case 'STUCK':
            return <AlertTriangle className="h-4 w-4 text-red-600" />
        case 'CANCELED':
            return <Ban className="h-4 w-4 text-gray-600" />
        case 'PENDING':
        default:
            return <Clock className="h-4 w-4 text-amber-600" />
    }
}

const getStatusColor = (status) => {
    switch (status) {
        case 'COMPLETED':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case 'PROCESSING':
            return 'bg-blue-50 text-blue-700 border-blue-200'
        case 'STUCK':
            return 'bg-red-50 text-red-700 border-red-200'
        case 'CANCELED':
            return 'bg-gray-50 text-gray-700 border-gray-200'
        case 'PENDING':
        default:
            return 'bg-amber-50 text-amber-700 border-amber-200'
    }
}

const getProgressColor = (progress) => {
    const progressText = progress?.toLowerCase() || ''
    if (progressText.includes('complete') || progressText.includes('done') || progressText.includes('finished')) {
        return 'text-emerald-600'
    } else if (progressText.includes('progress') || progressText.includes('working') || progressText.includes('ongoing')) {
        return 'text-blue-600'
    } else if (progressText.includes('stuck') || progressText.includes('issue') || progressText.includes('problem')) {
        return 'text-red-600'
    } else {
        return 'text-gray-600'
    }
}

const page = ({ params }) => {
    const { id } = use(params);
    const [open, setOpen] = useState(false);
    const [filed, setFiled] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [formdata, setFormdata] = useState({
        name: '',
        description: '',
        date: '',
        progress: '',
        project_client_id: id,
        file: null,
    });
    const { user } = useUser();

    const getFiled = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getFilledRequest(id);
            setFiled(res?.data?.filed);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getFiled();
    }, [id]);

    const handleFormChange = useCallback((e) => {
        setFormdata(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleCreateFiled = useCallback(async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const res = await createFiledRequest(formdata);
            toast.success(res.data?.message);
            setFormdata({
                name: '',
                description: '',
                date: '',
                progress: '',
                project_client_id: id,
                file: null,
            });
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setOpen(false);
            setSubmitLoading(false);
            getFiled();
        }
    }, [formdata, id]);

    const handleUpdateStatus = useCallback(async (status, filled_id) => {
        try {
            const formdata = {
                status,
                filled_id
            }

            const res = await updateFiledStatusRequest(formdata);
            toast.success(res.data.message)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            getFiled();
        }
    }, [getFiled]);

    const handleDocumentChange = useCallback((e) => {
        const file = e.target.files[0];
        setFormdata(prev => ({ ...prev, file }));
    }, []);

    // Filter filings based on search and status
    const filteredFilings = filed.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.progress.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || file.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate statistics
    const stats = {
        total: filed.length,
        pending: filed.filter(file => file.status === 'PENDING').length,
        processing: filed.filter(file => file.status === 'PROCESSING').length,
        completed: filed.filter(file => file.status === 'COMPLETED').length,
        stuck: filed.filter(file => file.status === 'STUCK').length,
        canceled: filed.filter(file => file.status === 'CANCELED').length,
        withDocuments: filed.filter(file => file.filename).length
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader />
                    <p className="text-gray-600 mt-4">Loading project filings...</p>
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
                                        <Briefcase className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold text-gray-900">Project Filings</h1>
                                        <p className="text-lg text-gray-600 mt-2">
                                            {user?.Role === "PROVIDER" ? "Manage and track all project filings" : "View your project filing status"}
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
                                        <span>Create Filing</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-8">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8">
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-purple-900">Total Filings</CardTitle>
                                    <Briefcase className="h-5 w-5 text-purple-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-purple-900">{stats.total}</div>
                                    <p className="text-sm text-purple-700">All filings</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-amber-900">Pending</CardTitle>
                                    <Clock className="h-5 w-5 text-amber-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-amber-900">{stats.pending}</div>
                                    <p className="text-sm text-amber-700">Awaiting action</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-blue-900">Processing</CardTitle>
                                    <Play className="h-5 w-5 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-900">{stats.processing}</div>
                                    <p className="text-sm text-blue-700">In progress</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-emerald-900">Completed</CardTitle>
                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-emerald-900">{stats.completed}</div>
                                    <p className="text-sm text-emerald-700">Successfully done</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-red-900">Stuck</CardTitle>
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-red-900">{stats.stuck}</div>
                                    <p className="text-sm text-red-700">Need attention</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-gray-900">Canceled</CardTitle>
                                    <Ban className="h-5 w-5 text-gray-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-gray-900">{stats.canceled}</div>
                                    <p className="text-sm text-gray-700">Terminated</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-indigo-900">With Docs</CardTitle>
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-indigo-900">{stats.withDocuments}</div>
                                    <p className="text-sm text-indigo-700">Have attachments</p>
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
                                                placeholder="Search filings by name, description, or progress..."
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
                                            <option value="PROCESSING">Processing</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="STUCK">Stuck</option>
                                            <option value="CANCELED">Canceled</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Filings Table */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-semibold">Filing Records</CardTitle>
                                    <Badge variant="outline" className="bg-gray-50">
                                        {filteredFilings.length} {filteredFilings.length === 1 ? 'filing' : 'filings'}
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
                                                    <TableHead className="font-semibold text-gray-700">Filing Name</TableHead>
                                                    <TableHead className="font-semibold text-gray-700">Description</TableHead>
                                                    <TableHead className="w-32 font-semibold text-gray-700">Date</TableHead>
                                                    <TableHead className="font-semibold text-gray-700">Progress</TableHead>
                                                    <TableHead className="w-32 text-center font-semibold text-gray-700">Status</TableHead>
                                                    <TableHead className="w-40 text-center font-semibold text-gray-700">Document</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredFilings.length > 0 ? filteredFilings.map((file, index) => (
                                                    <TableRow key={file.filled_id} className="hover:bg-gray-50 transition-colors">
                                                        <TableCell className="text-center font-medium text-gray-600">
                                                            {filed.indexOf(file) + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center space-x-3">
                                                                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                                                                    <Briefcase className="h-4 w-4 text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{file.name}</p>
                                                                    <p className="text-xs text-gray-500">Filed: {moment(file.created_at).fromNow()}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="max-w-xs">
                                                                <p className="text-gray-700 line-clamp-2" title={file.description}>
                                                                    {file.description}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-gray-600 text-sm">
                                                            <div className="flex items-center space-x-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>{moment(file.date).format("MMM DD, YYYY")}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="max-w-xs">
                                                                <p className={`text-sm font-medium ${getProgressColor(file.progress)}`}>
                                                                    {file.progress}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {user?.Role === "PROVIDER" ? (
                                                                <Select
                                                                    onValueChange={(status) => handleUpdateStatus(status, file.filled_id)}
                                                                    value={file.status}
                                                                >
                                                                    <SelectTrigger className="w-32 h-8">
                                                                        <div className="flex items-center space-x-2">
                                                                            {getStatusIcon(file.status)}
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
                                                                            <SelectItem value="PROCESSING">
                                                                                <div className="flex items-center space-x-2">
                                                                                    <Play className="h-4 w-4 text-blue-600" />
                                                                                    <span>Processing</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="COMPLETED">
                                                                                <div className="flex items-center space-x-2">
                                                                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                                                                    <span>Completed</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="STUCK">
                                                                                <div className="flex items-center space-x-2">
                                                                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                                                                    <span>Stuck</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="CANCELED">
                                                                                <div className="flex items-center space-x-2">
                                                                                    <Ban className="h-4 w-4 text-gray-600" />
                                                                                    <span>Canceled</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        </SelectGroup>
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : (
                                                                <Badge className={`${getStatusColor(file.status)} border flex items-center space-x-1 justify-center`}>
                                                                    {getStatusIcon(file.status)}
                                                                    <span>{file.status}</span>
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center justify-center">
                                                                {file.filename ? (
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => window.open(file.file_url, '_blank')}
                                                                            className="h-8 px-3"
                                                                        >
                                                                            <Eye className="h-3 w-3 mr-1" />
                                                                            View
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => {
                                                                                const link = document.createElement('a')
                                                                                link.href = file.file_url
                                                                                link.download = file.filename
                                                                                link.click()
                                                                            }}
                                                                            className="h-8 px-3"
                                                                        >
                                                                            <Download className="h-3 w-3 mr-1" />
                                                                            Download
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        No document
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="py-12">
                                                            <div className="text-center">
                                                                <div className="flex flex-col items-center space-y-3">
                                                                    <Briefcase className="h-12 w-12 text-gray-300" />
                                                                    <p className="text-gray-500 font-medium">No filings found</p>
                                                                    <p className="text-gray-400 text-sm">
                                                                        {searchTerm || statusFilter !== 'ALL'
                                                                            ? 'Try adjusting your search or filter criteria'
                                                                            : user?.Role === "PROVIDER"
                                                                                ? 'Click "Create Filing" to add a new project filing'
                                                                                : 'No filings have been created yet'
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

            {/* Create Filing Dialog */}
            <BigDialog open={open} onClose={() => setOpen(false)} width={'40'}>
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                            <Plus className="h-8 w-8 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Create New Filing</h2>
                        <p className="text-gray-600 mt-2">Add a new project filing with details and optional document</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleCreateFiled}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                    Filing Name *
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    name="name"
                                    placeholder="Enter filing name..."
                                    value={formdata.name}
                                    onChange={handleFormChange}
                                    required
                                    className="h-10"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                                    Filing Date *
                                </Label>
                                <Input
                                    id="date"
                                    type="date"
                                    name="date"
                                    value={formdata.date}
                                    onChange={handleFormChange}
                                    required
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                Description *
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Provide a detailed description of the filing..."
                                value={formdata.description}
                                onChange={handleFormChange}
                                required
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="progress" className="text-sm font-medium text-gray-700">
                                Progress Notes *
                            </Label>
                            <Textarea
                                id="progress"
                                name="progress"
                                placeholder="Enter current progress status or notes..."
                                value={formdata.progress}
                                onChange={handleFormChange}
                                required
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="document" className="text-sm font-medium text-gray-700">
                                Supporting Document <span className="text-gray-500">(optional)</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="document"
                                    type="file"
                                    onChange={handleDocumentChange}
                                    className="h-10"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <Upload className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">Attach any relevant documents or forms</p>
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
                                        <Plus className="h-4 w-4" />
                                        <span>Create Filing</span>
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