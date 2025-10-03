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
// import { getDocuemtnRequest, getUpdatesRequest, giveUpdateRequest, requestDocuemtnRequest, updateStatusRequest, uploadDocumentRequest } from '@/lib/http/client';
// import Loader from '@/components/Loader';
// import moment from 'moment';
// import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
// import Link from 'next/link';

// const page = ({ params }) => {
//     const { id } = use(params);
//     const [open, setOpen] = useState(false);
//     const [updates, setUpdates] = useState([]);
//     const [submitLoading, setSubmitLoading] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [formdata, setFormdata] = useState({
//         message: '',
//         project_client_id: id,
//         file: undefined,
//     });
//     const { user } = useUser();

//     const getUpdates = useCallback(async () => {
//         setLoading(true);
//         try {
//             const res = await getUpdatesRequest(id);
//             setUpdates(res?.data?.updates);
//         } catch (error) {
//             toast.error(error?.response?.data?.message || error?.message);
//         } finally {
//             setLoading(false);
//         }
//     }, [id]);

//     useEffect(() => {
//         getUpdates();
//     }, [id]);

//     const handleFormChange = useCallback((e) => {
//         setFormdata(prev => ({ ...prev, [e.target.name]: e.target.value }));
//     }, []);


//     const handleUpdatesRequest = useCallback(async (e) => {
//         e.preventDefault();
//         setSubmitLoading(true);
//         try {
//             const res = await giveUpdateRequest(formdata);
//             toast.success(res.data?.message);
//         } catch (error) {
//             toast.error(error?.response?.data?.message || error?.message);
//         } finally {
//             setOpen(false);
//             setSubmitLoading(false);
//             getUpdates();
//         }
//     }, [formdata]);



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
//                         <h1 className="text-3xl font-semibold text-black">Project Updates</h1>
//                         <Button className='bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all' onClick={() => setOpen(true)}>
//                             Give Update
//                         </Button>
//                     </div>
//                 }

//                 <div className="flex-1 overflow-auto">
//                     <Table className="border-collapse border border-primary rounded-md">
//                         <TableHeader className="border-b border-primary">
//                             <TableRow>
//                                 <TableHead className="!w-[80px] border-r border-primary last:border-r-0 text-black">#</TableHead>
//                                 <TableHead className="w-[300px] border-r border-primary last:border-r-0 text-black">Message</TableHead>
//                                 <TableHead className="border-r border-primary last:border-r-0 text-black">Date</TableHead>
//                                 <TableHead className="border-r border-primary last:border-r-0 text-black">File</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody className="divide-y divide-primary">
//                             {
//                                 updates.map((document, index) => (
//                                     <TableRow>
//                                         <TableCell className='border-r border-primary last:border-r-0 cursor-pointer text-black'>
//                                             {index + 1}
//                                         </TableCell>

//                                         <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                             {document.message}
//                                         </TableCell>
//                                         <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
//                                             {moment(document.created_at).format("DD MMM YYYY")}
//                                         </TableCell>
//                                         <TableCell className='border-r border-primary last:border-r-0 !p-1 text-black text-center relative cursor-pointer group'>
//                                             {
//                                                 document.filename ?
//                                                     (
//                                                         <Link href={document.file_url} className='text-tbutton-bg hover:text-tbutton-hover underline'>{document.filename}</Link>
//                                                     ) :
//                                                     "No File Attach"
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

//                 <form className='space-y-8 mt-20 px-5' onSubmit={handleUpdatesRequest}>

//                     <div className="space-y-2">
//                         <Label htmlFor="message" className="text-black">Message</Label>
//                         <Textarea
//                             id="message"
//                             type="text"
//                             name="message"
//                             placeholder="Update"
//                             value={formdata.message}
//                             onChange={handleFormChange}
//                             required
//                             className="bg-white border-primary text-black"
//                         />
//                     </div>


//                     <div className="space-y-2">
//                         <Label htmlFor="message" className="text-black">File (Optional)</Label>
//                         <Input
//                             type="file"
//                             onChange={handleFileChange}
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
    MessageSquare,
    Plus,
    Calendar,
    FileText,
    Paperclip,
    Search,
    Filter,
    User,
    Activity,
    Download,
    Eye,
    Upload,
    Send,
    Clock,
    TrendingUp
} from 'lucide-react'
import { useUser } from '@/providers/UserProvider';
import { Button } from '@/components/Button';
import BigDialog from '@/components/Dialogs/BigDialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
import { getDocuemtnRequest, getUpdatesRequest, giveUpdateRequest, requestDocuemtnRequest, updateStatusRequest, uploadDocumentRequest } from '@/lib/http/client';
import Loader from '@/components/Loader';
import moment from 'moment';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

const page = ({ params }) => {
    const { id } = use(params);
    const [open, setOpen] = useState(false);
    const [updates, setUpdates] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('ALL');
    const [formdata, setFormdata] = useState({
        message: '',
        project_client_id: id,
        file: undefined,
    });
    const { user } = useUser();

    const getUpdates = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getUpdatesRequest(id);
            setUpdates(res?.data?.updates || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getUpdates();
    }, [id]);

    const handleFormChange = useCallback((e) => {
        setFormdata(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleUpdatesRequest = useCallback(async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const res = await giveUpdateRequest(formdata);
            toast.success(res.data?.message);
            setFormdata({
                message: '',
                project_client_id: id,
                file: undefined,
            });
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setOpen(false);
            setSubmitLoading(false);
            getUpdates();
        }
    }, [formdata, id]);

    const handleFileChange = useCallback((e) => {
        const [file] = e.target.files;
        setFormdata(prev => ({ ...prev, file }));
    }, []);

    // Filter updates based on search and date
    const filteredUpdates = updates.filter(update => {
        const matchesSearch = update.message.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesDate = true;
        if (dateFilter !== 'ALL') {
            const updateDate = moment(update.created_at);
            const now = moment();

            switch (dateFilter) {
                case 'TODAY':
                    matchesDate = updateDate.isSame(now, 'day');
                    break;
                case 'WEEK':
                    matchesDate = updateDate.isAfter(now.subtract(7, 'days'));
                    break;
                case 'MONTH':
                    matchesDate = updateDate.isAfter(now.subtract(30, 'days'));
                    break;
                default:
                    matchesDate = true;
            }
        }

        return matchesSearch && matchesDate;
    });

    // Calculate statistics
    const stats = {
        total: updates.length,
        withFiles: updates.filter(update => update.filename).length,
        today: updates.filter(update => moment(update.created_at).isSame(moment(), 'day')).length,
        thisWeek: updates.filter(update => moment(update.created_at).isAfter(moment().subtract(7, 'days'))).length,
        thisMonth: updates.filter(update => moment(update.created_at).isAfter(moment().subtract(30, 'days'))).length
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader />
                    <p className="text-gray-600 mt-4">Loading project updates...</p>
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
                                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                                        <MessageSquare className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold text-gray-900">Project Updates</h1>
                                        <p className="text-lg text-gray-600 mt-2">
                                            {user?.Role === "PROVIDER" ? "Share updates and communicate with clients" : "Stay informed about your project progress"}
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
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
                                    >
                                        <Plus className="h-5 w-5" />
                                        <span>Post Update</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-8">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-blue-900">Total Updates</CardTitle>
                                    <MessageSquare className="h-5 w-5 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
                                    <p className="text-sm text-blue-700">All communications</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-emerald-900">With Files</CardTitle>
                                    <Paperclip className="h-5 w-5 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-emerald-900">{stats.withFiles}</div>
                                    <p className="text-sm text-emerald-700">Have attachments</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-amber-900">Today</CardTitle>
                                    <Clock className="h-5 w-5 text-amber-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-amber-900">{stats.today}</div>
                                    <p className="text-sm text-amber-700">Posted today</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-purple-900">This Week</CardTitle>
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-purple-900">{stats.thisWeek}</div>
                                    <p className="text-sm text-purple-700">Recent activity</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-rose-900">This Month</CardTitle>
                                    <Calendar className="h-5 w-5 text-rose-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-rose-900">{stats.thisMonth}</div>
                                    <p className="text-sm text-rose-700">Monthly updates</p>
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
                                                placeholder="Search updates by message content..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 h-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Filter className="h-4 w-4 text-gray-500" />
                                        <select
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                                        >
                                            <option value="ALL">All Time</option>
                                            <option value="TODAY">Today</option>
                                            <option value="WEEK">This Week</option>
                                            <option value="MONTH">This Month</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Updates Display - Timeline Style */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-semibold">Project Timeline</CardTitle>
                                    <Badge variant="outline" className="bg-gray-50">
                                        {filteredUpdates.length} {filteredUpdates.length === 1 ? 'update' : 'updates'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {filteredUpdates.length > 0 ? (
                                    <div className="space-y-6">
                                        {filteredUpdates.map((update, index) => (
                                            <div key={update.update_id} className="relative">
                                                {/* Timeline connector */}
                                                {index !== filteredUpdates.length - 1 && (
                                                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                                                )}

                                                <div className="flex items-start space-x-4">
                                                    {/* Timeline dot */}
                                                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full border-4 border-white shadow-md flex-shrink-0">
                                                        <MessageSquare className="h-5 w-5 text-blue-600" />
                                                    </div>

                                                    {/* Update content */}
                                                    <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center space-x-3">
                                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                    Update #{updates.indexOf(update) + 1}
                                                                </Badge>
                                                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                                    <Calendar className="h-3 w-3" />
                                                                    <span>{moment(update.created_at).format("MMM DD, YYYY [at] h:mm A")}</span>
                                                                </div>
                                                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>{moment(update.created_at).fromNow()}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-4">
                                                            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                                                                {update.message}
                                                            </p>
                                                        </div>

                                                        {update.filename && (
                                                            <div className="border-t border-gray-100 pt-4">
                                                                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                                                    <div className="flex items-center space-x-3">
                                                                        <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-lg">
                                                                            <Paperclip className="h-4 w-4 text-gray-600" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-900">Attachment</p>
                                                                            <p className="text-xs text-gray-500">{update.filename}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => window.open(update.file_url, '_blank')}
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
                                                                                link.href = update.file_url
                                                                                link.download = update.filename
                                                                                link.click()
                                                                            }}
                                                                            className="h-8 px-3"
                                                                        >
                                                                            <Download className="h-3 w-3 mr-1" />
                                                                            Download
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <div className="flex flex-col items-center space-y-3">
                                            <MessageSquare className="h-12 w-12 text-gray-300" />
                                            <p className="text-gray-500 font-medium">No updates found</p>
                                            <p className="text-gray-400 text-sm">
                                                {searchTerm || dateFilter !== 'ALL'
                                                    ? 'Try adjusting your search or filter criteria'
                                                    : user?.Role === "PROVIDER"
                                                        ? 'Click "Post Update" to share the first project update'
                                                        : 'No updates have been posted yet'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Post Update Dialog */}
            <BigDialog open={open} onClose={() => setOpen(false)} width={'40'}>
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                            <Send className="h-8 w-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Post Update</h2>
                        <p className="text-gray-600 mt-2">Share important information and progress with your client</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleUpdatesRequest}>
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                                Update Message *
                            </Label>
                            <Textarea
                                id="message"
                                name="message"
                                placeholder="Share your update, progress, or important information here..."
                                value={formdata.message}
                                onChange={handleFormChange}
                                required
                                rows={6}
                                className="resize-none"
                            />
                            <p className="text-xs text-gray-500">Be specific and clear about the progress or information you're sharing</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="file" className="text-sm font-medium text-gray-700">
                                Attachment <span className="text-gray-500">(optional)</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="file"
                                    type="file"
                                    onChange={handleFileChange}
                                    className="h-10"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <Upload className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">Attach supporting documents, images, or files related to this update</p>
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
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={submitLoading}
                            >
                                {submitLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Posting...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <Send className="h-4 w-4" />
                                        <span>Post Update</span>
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