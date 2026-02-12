'use client'
import React, { useEffect, useState } from 'react'
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
import { toast } from 'react-toastify';
import Loader from '@/components/Loader';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { getPendingDocumentsRequest, acceptDocumentRequest, rejectDocumentRequest } from '@/lib/http/review';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const LawyerDocumentsPage = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();
    const router = useRouter();
    const [processingIds, setProcessingIds] = useState([]);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await getPendingDocumentsRequest();
            if (res.data.success) {
                setDocuments(res.data.documents || []);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleAccept = async (docId) => {
        if (!window.confirm('Are you sure you want to accept this document?')) {
            return;
        }

        setProcessingIds(prev => [...prev, docId]);
        try {
            await acceptDocumentRequest(docId);
            toast.success('✅ Document approved successfully');
            fetchDocuments(); // Refresh the list
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to approve document');
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== docId));
        }
    };

    const handleRejectClick = (doc) => {
        setSelectedDoc(doc);
        setRejectionReason('');
        setShowRejectDialog(true);
    };

    const handleConfirmReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        if (!selectedDoc) return;

        setProcessingIds(prev => [...prev, selectedDoc.t_document_id]);
        try {
            await rejectDocumentRequest(selectedDoc.t_document_id, rejectionReason);
            toast.success('❌ Document rejected');
            setShowRejectDialog(false);
            setSelectedDoc(null);
            setRejectionReason('');
            fetchDocuments(); // Refresh the list
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to reject document');
        } finally {
            setProcessingIds(prev => prev.filter(id => id !== selectedDoc.t_document_id));
        }
    };

    const handleViewDocument = (doc) => {
        const params = new URLSearchParams({
            file: doc.file_url || '',
            filename: doc.filename || 'document'
        });
        router.push(`/dashboard/review-document/${doc.t_document_id}?${params.toString()}`);
    };

    if (loading) {
        return (
            <main className="flex-1 overflow-auto p-8 bg-white m-2 rounded-md">
                <div className="flex items-center justify-center h-64">
                    <Loader />
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-auto p-8 bg-white m-2 rounded-md">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Pending Reviews</h1>
                <p className="text-gray-600">Documents waiting for your review and approval</p>
            </div>

            <div className="flex-1 overflow-auto">
                {documents.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No documents pending review.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table className="border-collapse border border-gray-300 rounded-md">
                            <TableHeader className="border-b border-gray-300 bg-gray-50">
                                <TableRow>
                                    <TableHead className="!w-[60px] border-r border-gray-300 last:border-r-0 text-black font-semibold">#</TableHead>
                                    <TableHead className="border-r border-gray-300 last:border-r-0 text-black font-semibold">Filename</TableHead>
                                    <TableHead className="border-r border-gray-300 last:border-r-0 text-black font-semibold">Description</TableHead>
                                    <TableHead className="border-r border-gray-300 last:border-r-0 text-black font-semibold">Submitted By</TableHead>
                                    <TableHead className="border-r border-gray-300 last:border-r-0 text-black font-semibold">Date</TableHead>
                                    <TableHead className="border-r border-gray-300 last:border-r-0 text-black font-semibold">Status</TableHead>
                                    <TableHead className="border-r border-gray-300 last:border-r-0 text-black font-semibold text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-200">
                                {documents.map((doc, index) => (
                                    <TableRow key={doc.t_document_id} className="hover:bg-gray-50">
                                        <TableCell className='border-r border-gray-300 last:border-r-0 text-black'>
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className='border-r border-gray-300 last:border-r-0 text-black font-medium'>
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-500" />
                                                <span className="truncate max-w-[200px]" title={doc.filename}>
                                                    {doc.filename}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className='border-r border-gray-300 last:border-r-0 text-black'>
                                            <span className="truncate max-w-[250px] block" title={doc.description || '-'}>
                                                {doc.description || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className='border-r border-gray-300 last:border-r-0 text-black'>
                                            {doc.user?.name || 'Unknown User'}
                                        </TableCell>
                                        <TableCell className='border-r border-gray-300 last:border-r-0 text-black'>
                                            {moment(doc.created_at).format("DD MMM YYYY")}
                                        </TableCell>
                                        <TableCell className='border-r border-gray-300 last:border-r-0 text-black'>
                                            <Badge className={
                                                doc.status === 'SENT_TO_LAWYER' 
                                                    ? 'bg-yellow-100 text-yellow-800' 
                                                    : doc.status === 'APPROVED'
                                                        ? 'bg-green-100 text-green-800'
                                                        : doc.status === 'REJECTED'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-gray-100 text-gray-800'
                                            }>
                                                {doc.status?.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className='border-r border-gray-300 last:border-r-0 text-black'>
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    onClick={() => handleViewDocument(doc)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm flex items-center gap-1"
                                                    title="View Document"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Button>
                                                <Button
                                                    onClick={() => handleAccept(doc.t_document_id)}
                                                    disabled={processingIds.includes(doc.t_document_id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm flex items-center gap-1 disabled:opacity-50"
                                                    title="Accept Document"
                                                >
                                                    {processingIds.includes(doc.t_document_id) ? (
                                                        <Loader />
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" />
                                                            Accept
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    onClick={() => handleRejectClick(doc)}
                                                    disabled={processingIds.includes(doc.t_document_id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm flex items-center gap-1 disabled:opacity-50"
                                                    title="Reject Document"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Reject Document</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this document. The user will be notified with this reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>Document:</strong> {selectedDoc?.filename}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                            <Textarea
                                id="rejection-reason"
                                placeholder="Enter the reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                className="w-full"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRejectDialog(false);
                                setSelectedDoc(null);
                                setRejectionReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmReject}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={!rejectionReason.trim() || processingIds.includes(selectedDoc?.t_document_id)}
                        >
                            {processingIds.includes(selectedDoc?.t_document_id) ? 'Rejecting...' : 'Confirm Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

export default LawyerDocumentsPage
