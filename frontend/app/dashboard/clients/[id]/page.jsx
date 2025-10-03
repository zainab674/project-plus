// "use client"
// import Loader from '@/components/Loader';
// import { getClientDocumentRequest } from '@/lib/http/client';
// import React, { useEffect, useState } from 'react'

// const FileIcon = () => (
//     <span style={{ marginRight: 8 }}>📄</span>
// );

// const page = ({ params }) => {
//     const { id } = params;
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(false)

//     const fetchDocuemnt = async () => {
//         setLoading(true)
//         try {
//             const res = await getClientDocumentRequest(id);
//             setData(res.data.data);
//         } catch (error) {
//             console.log("Getting An Error During Getting Document:", error.message);
//         } finally {
//             setLoading(false)
//         }
//     }

//     useEffect(() => {
//         fetchDocuemnt()
//     }, [])

//     if (loading) {
//         return <>
//             <div className=" h-screen bg-primary m-2 rounded-md flex items-center justify-center">
//                 <Loader />
//             </div>
//         </>
//     }

//     return (
//         <main className="flex-1 overflow-auto p-8 bg-secondary m-2 rounded-md">
//             <div style={{ padding: 24 }} className='text-white'>
//                 <h2>Client Files</h2>
//                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                     <thead>
//                         <tr style={{ borderBottom: '1px solid #ccc' }}>
//                             <th style={{ textAlign: 'left', padding: 8 }}>File</th>
//                             <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
//                             <th style={{ textAlign: 'left', padding: 8 }}>Size</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {data && data.length > 0 ? data.map((file, idx) => (
//                             <tr
//                                 key={idx}
//                                 style={{ cursor: 'pointer', borderBottom: '1px solid #eee' }}
//                                 onClick={() => file.file_url && window.open(file.file_url, '_blank')}
//                             >
//                                 <td style={{ padding: 8 }}><FileIcon /></td>
//                                 <td style={{ padding: 8 }}>{file.name || 'Untitled'}</td>
//                                 <td style={{ padding: 8 }}>{file.size ? `${(file.size / 1024).toFixed(1)} KB` : '-'}</td>
//                             </tr>
//                         )) : (
//                             <tr><td colSpan={3} style={{ padding: 8, textAlign: 'center' }}>No files found.</td></tr>
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </main>
//     )
// }

// export default page



"use client"
import Loader from '@/components/Loader';
import { getClientDocumentRequest } from '@/lib/http/client';
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    FileText,
    File,
    Image,
    FileImage,
    FileSpreadsheet,
    FileVideo,
    FileAudio,
    Download,
    Eye,
    Search,
    Filter,
    Grid3X3,
    List,
    Calendar,
    HardDrive,
    FolderOpen,
    ExternalLink
} from 'lucide-react'
import moment from 'moment'

const getFileIcon = (filename, size = 20) => {
    if (!filename) return <File size={size} className="text-gray-500" />

    const extension = filename.split('.').pop()?.toLowerCase()
    const iconClass = "text-gray-600"

    switch (extension) {
        case 'pdf':
            return <FileText size={size} className="text-red-500" />
        case 'doc':
        case 'docx':
            return <FileText size={size} className="text-blue-500" />
        case 'xls':
        case 'xlsx':
            return <FileSpreadsheet size={size} className="text-green-500" />
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
            return <FileImage size={size} className="text-purple-500" />
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'wmv':
            return <FileVideo size={size} className="text-orange-500" />
        case 'mp3':
        case 'wav':
        case 'flac':
            return <FileAudio size={size} className="text-pink-500" />
        default:
            return <File size={size} className={iconClass} />
    }
}

const formatFileSize = (bytes) => {
    if (!bytes) return '-'

    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
    }

    return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`
}

const getFileType = (filename) => {
    if (!filename) return 'Unknown'
    const extension = filename.split('.').pop()?.toLowerCase()

    const typeMap = {
        'pdf': 'PDF Document',
        'doc': 'Word Document',
        'docx': 'Word Document',
        'xls': 'Excel Spreadsheet',
        'xlsx': 'Excel Spreadsheet',
        'jpg': 'JPEG Image',
        'jpeg': 'JPEG Image',
        'png': 'PNG Image',
        'gif': 'GIF Image',
        'mp4': 'MP4 Video',
        'avi': 'AVI Video',
        'mov': 'MOV Video',
        'mp3': 'MP3 Audio',
        'wav': 'WAV Audio',
        'txt': 'Text File',
        'zip': 'ZIP Archive',
        'rar': 'RAR Archive'
    }

    return typeMap[extension] || extension?.toUpperCase() + ' File' || 'Unknown'
}

const page = ({ params }) => {
    const { id } = params;
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
    const [sortBy, setSortBy] = useState('name') // 'name', 'size', 'date'

    const fetchDocuemnt = async () => {
        setLoading(true)
        try {
            const res = await getClientDocumentRequest(id);
            setData(res.data.data);
        } catch (error) {
            console.log("Getting An Error During Getting Document:", error.message);
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDocuemnt()
    }, [])

    // Filter and sort data
    const filteredData = data
        .filter(file =>
            file.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getFileType(file.name).toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'size':
                    return (b.size || 0) - (a.size || 0)
                case 'date':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0)
                default:
                    return (a.name || '').localeCompare(b.name || '')
            }
        })

    const totalSize = data.reduce((sum, file) => sum + (file.size || 0), 0)
    const totalFiles = data.length

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader />
                    <p className="text-gray-600 mt-4">Loading your files...</p>
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
                                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                                    <FolderOpen className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900">My Files</h1>
                                    <p className="text-lg text-gray-600 mt-2">
                                        Access and manage all your case documents
                                    </p>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center space-x-6">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">{totalFiles}</p>
                                    <p className="text-sm text-gray-600">Total Files</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{formatFileSize(totalSize)}</p>
                                    <p className="text-sm text-gray-600">Total Size</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-blue-900">Total Files</CardTitle>
                                <File className="h-5 w-5 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-900">{totalFiles}</div>
                                <p className="text-sm text-blue-700">Documents available</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-emerald-900">Storage Used</CardTitle>
                                <HardDrive className="h-5 w-5 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-emerald-900">{formatFileSize(totalSize)}</div>
                                <p className="text-sm text-emerald-700">Total file size</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-purple-900">File Types</CardTitle>
                                <FileText className="h-5 w-5 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-900">
                                    {new Set(data.map(file => getFileType(file.name))).size}
                                </div>
                                <p className="text-sm text-purple-700">Different formats</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-amber-900">Recent Files</CardTitle>
                                <Calendar className="h-5 w-5 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-amber-900">
                                    {data.filter(file => moment(file.created_at).isAfter(moment().subtract(7, 'days'))).length}
                                </div>
                                <p className="text-sm text-amber-700">Added this week</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Controls Section */}
                    <Card className="mb-8">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                                <div className="flex items-center space-x-4">
                                    <div className="relative flex-1 md:w-80">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Search files by name or type..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 h-10"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                                    >
                                        <option value="name">Sort by Name</option>
                                        <option value="size">Sort by Size</option>
                                        <option value="date">Sort by Date</option>
                                    </select>

                                    <div className="flex border border-gray-300 rounded-md">
                                        <Button
                                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setViewMode('list')}
                                            className="rounded-r-none"
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setViewMode('grid')}
                                            className="rounded-l-none"
                                        >
                                            <Grid3X3 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Files Display */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-semibold">Document Library</CardTitle>
                                <Badge variant="outline" className="bg-gray-50">
                                    {filteredData.length} {filteredData.length === 1 ? 'file' : 'files'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {viewMode === 'list' ? (
                                // List View
                                <div className="overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200 bg-gray-50">
                                                    <th className="text-left py-4 px-4 font-semibold text-gray-700">File</th>
                                                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Name</th>
                                                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Type</th>
                                                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Size</th>
                                                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Modified</th>
                                                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredData.length > 0 ? filteredData.map((file, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                                                                {getFileIcon(file.name, 20)}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="font-medium text-gray-900">
                                                                {file.name || 'Untitled'}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <Badge variant="secondary" className="text-xs">
                                                                {getFileType(file.name)}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-4 px-4 text-gray-600">
                                                            {formatFileSize(file.size)}
                                                        </td>
                                                        <td className="py-4 px-4 text-gray-600 text-sm">
                                                            {file.created_at ? moment(file.created_at).format('MMM DD, YYYY') : '-'}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex space-x-2">
                                                                {file.file_url && (
                                                                    <>
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
                                                                                link.download = file.name || 'document'
                                                                                link.click()
                                                                            }}
                                                                            className="h-8 px-3"
                                                                        >
                                                                            <Download className="h-3 w-3 mr-1" />
                                                                            Download
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={6} className="py-12 text-center">
                                                            <div className="flex flex-col items-center space-y-3">
                                                                <File className="h-12 w-12 text-gray-300" />
                                                                <p className="text-gray-500 font-medium">No files found</p>
                                                                <p className="text-gray-400 text-sm">
                                                                    {searchTerm ? 'Try adjusting your search terms' : 'No documents have been uploaded yet'}
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                // Grid View
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredData.length > 0 ? filteredData.map((file, idx) => (
                                        <Card key={idx} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                                            <CardContent className="pt-6">
                                                <div className="flex flex-col items-center space-y-4">
                                                    <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors">
                                                        {getFileIcon(file.name, 32)}
                                                    </div>
                                                    <div className="text-center space-y-2 w-full">
                                                        <h4 className="font-medium text-gray-900 truncate w-full" title={file.name}>
                                                            {file.name || 'Untitled'}
                                                        </h4>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {getFileType(file.name)}
                                                        </Badge>
                                                        <p className="text-sm text-gray-600">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                        {file.created_at && (
                                                            <p className="text-xs text-gray-500">
                                                                {moment(file.created_at).format('MMM DD, YYYY')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {file.file_url && (
                                                        <div className="flex space-x-2 w-full">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => window.open(file.file_url, '_blank')}
                                                                className="flex-1 h-8"
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
                                                                    link.download = file.name || 'document'
                                                                    link.click()
                                                                }}
                                                                className="flex-1 h-8"
                                                            >
                                                                <Download className="h-3 w-3 mr-1" />
                                                                Download
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )) : (
                                        <div className="col-span-full py-12 text-center">
                                            <div className="flex flex-col items-center space-y-3">
                                                <File className="h-12 w-12 text-gray-300" />
                                                <p className="text-gray-500 font-medium">No files found</p>
                                                <p className="text-gray-400 text-sm">
                                                    {searchTerm ? 'Try adjusting your search terms' : 'No documents have been uploaded yet'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default page