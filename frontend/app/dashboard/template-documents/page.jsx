'use client'
import React, { use, useCallback, useEffect, useState } from 'react'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"


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
import { useRouter } from 'next/navigation';
import { Upload, Plus } from 'lucide-react';
import { getTemplateFileRequest, sendToClientRequest, updateLawyerSendedDocumentRequest } from '@/lib/http/project';

// Utility function to download files with proper filename
const downloadFile = async (url, filename) => {
  try {
    console.log('Downloading file:', { url, filename });
    
    // Always prioritize the provided filename over URL extraction
    let finalFilename = filename;
    
    // Only extract from URL if no filename is provided at all
    if (!finalFilename && url) {
      const urlParts = url.split('/');
      finalFilename = urlParts[urlParts.length - 1];
      // Remove query parameters if any
      finalFilename = finalFilename.split('?')[0];
    }
    
    console.log('Final filename:', finalFilename);
    
    // First try the blob approach
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
    });
    
    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      // Fallback to direct link approach
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename || 'document';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    
  } catch (error) {
    console.error('Download error:', error);
    // Fallback to direct link approach
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError);
      // Last resort - open in new tab
      window.open(url, '_blank');
    }
  }
};

const page = ({ params }) => {
    const { id } = params;
    const [open, setOpen] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formdata, setFormdata] = useState({
        name: '',
        description: '',
        file: '',
        project_client_id: id
    });
    const [clients, setClients] = useState([]);
    const [selectFile, setSelectedFile] = useState(null);
    const [selectedClient, setSelectedClient] = useState('');
    const [description, setDescription] = useState('');
    const [sendingLoading, setSendingLoading] = useState(false);

    const { user } = useUser();
    const router = useRouter();
    const getDoucment = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getTemplateFileRequest();
            setDocuments(res?.data?.documents);
            setClients(res?.data?.clients)
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getDoucment();
    }, [id]);








    const handleUpdateStatus = useCallback(async (status, t_document_id) => {
        try {
            const formdata = {
                status
            }
            const res = await updateLawyerSendedDocumentRequest(t_document_id, formdata);
            toast.success(res.data.message)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            getDoucment();
        }
    }, []);

    const handleSendToClient = async () => {
        if (!selectedClient) {
            toast.error('Please select a client');
            return;
        }
        if (!description) {
            toast.error('Please enter a description');
            return;
        }

        setSendingLoading(true);
        try {
            // Add your API call here to send the document to client

            const formData = new FormData();
            formData.append("description", description);

            const fileResponse = await fetch(selectFile.file_url);
            const fileData = await fileResponse.arrayBuffer(); // or .blob()
            const blob = new Blob([fileData], { type: 'application/pdf' });

            formData.append("file", blob, selectFile.filename);
            formData.append("user_id", selectedClient);

            const response = await sendToClientRequest(formData);
            toast.success(response.data.message);
            setSelectedFile(null);
            setSelectedClient('');
            setDescription('');
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setSendingLoading(false);
        }
    };

    const handleUploadTemplate = () => {
        // Navigate to the document manager page for uploading templates
        // Using a default project ID of 1, but this could be dynamic based on user's current project
        router.push('/dashboard/create-document/1');
    };

    if (loading) {
        return <>
            <div className="h-screen bg-white m-2 rounded-md flex items-center justify-center">
                <Loader />
            </div>
        </>
    }


    return (
        <>
            <main className="flex-1 overflow-auto p-8 bg-white m-2 rounded-md">
                {/* Header Section with Upload Button */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Template Documents</h1>
                            <p className="text-gray-600">Manage and organize your template documents</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button 
                                onClick={handleUploadTemplate}
                                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Upload Template</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <Table className="border-collapse border border-primary rounded-md">
                        <TableHeader className="border-b border-primary">
                            <TableRow>
                                <TableHead className="!w-[80px] border-r border-primary last:border-r-0 text-black">#</TableHead>
                                <TableHead className="w-[300px] border-r border-primary last:border-r-0 text-black">Description</TableHead>
                                <TableHead className="border-r border-primary last:border-r-0 text-black">Date</TableHead>
                                <TableHead className="border-r border-primary last:border-r-0 text-black">Status</TableHead>
                                <TableHead className="border-r border-primary last:border-r-0 text-black">File</TableHead>
                                {
                                    user?.Role != "CLIENT" &&
                                    <TableHead className="border-r border-primary last:border-r-0 text-black">Action</TableHead>
                                }
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-primary">
                            {
                                documents.map((document, index) => (
                                    <TableRow>
                                        <TableCell className='border-r border-primary last:border-r-0 cursor-pointer text-black'>
                                            {index + 1}
                                        </TableCell>

                                        <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
                                            {document.description}
                                        </TableCell>

                                        <TableCell className='border-r border-primary last:border-r-0 !p-0 text-center text-black cursor-pointer'>
                                            {moment(document.created_at).format("DD MMM YYYY")}
                                        </TableCell>
                                        <TableCell className='border-r border-primary last:border-r-0 !p-1 text-center text-black'>
                                            <Select onValueChange={(status) => handleUpdateStatus(status, document.t_document_id)} value={document.status} className='w-full'>
                                                <SelectTrigger className="w-full text-black">
                                                    <SelectValue placeholder="Select a status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>Status</SelectLabel>
                                                        <SelectItem value="PENDING">PENDING</SelectItem>
                                                        <SelectItem value="REJECTED">REJECTED</SelectItem>
                                                        <SelectItem value="APPROVED">APPROVED</SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className='border-r border-primary last:border-r-0 !p-1 text-black text-center relative cursor-pointer group'>
                                            {document.file_url ? (
                                                <div className="flex items-center gap-2 justify-center">
                                                    <a target='__black' href={document.file_url} className='text-tbutton-bg hover:text-tbutton-hover underline'>
                                                        {document.filename || 'View File'}
                                                    </a>
                                                    <button
                                                        onClick={() => downloadFile(document.file_url, document.filename)}
                                                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">No file</span>
                                            )}
                                        </TableCell>
                                        {
                                            user?.Role != "CLIENT" &&
                                            <TableCell className='border-r border-primary last:border-r-0 !p-1 text-black text-center relative cursor-pointer group'>
                                                <Button onClick={() => setSelectedFile(document)}>Send To Client</Button>
                                            </TableCell>
                                        }
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </div>
            </main>


            <BigDialog open={!!selectFile} onClose={() => setSelectedFile(null)}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4 text-black">Send Document to Client</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="client" className="text-black">Select Client</Label>
                            <Select value={selectedClient} onValueChange={setSelectedClient}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {clients.map((client) => (
                                            <SelectItem key={client.user_id} value={client.user_id}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-black">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Enter description"
                                className="w-full text-black"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setSelectedFile(null)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSendToClient} disabled={sendingLoading}>
                                {sendingLoading ? 'Sending...' : 'Send to Client'}
                            </Button>
                        </div>
                    </div>
                </div>
            </BigDialog>
        </>
    )
}

export default page