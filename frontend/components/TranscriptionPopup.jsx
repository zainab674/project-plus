import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Clock, User, MessageSquare, Download, Copy, Check } from 'lucide-react';
import moment from 'moment';
import { getMeetingTranscriptionsRequest } from '@/lib/http/transcription';

const TranscriptionPopup = ({ meeting, isOpen, onClose }) => {
    const [transcriptions, setTranscriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copiedText, setCopiedText] = useState('');

    useEffect(() => {
        if (isOpen && meeting?.meeting_id) {
            fetchTranscriptions();
        }
    }, [isOpen, meeting?.meeting_id]);

    const fetchTranscriptions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getMeetingTranscriptionsRequest(meeting.meeting_id);
            setTranscriptions(response.data.transcriptions || []);
        } catch (err) {
            console.error('Error fetching transcriptions:', err);
            setError('Failed to load transcriptions');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(text);
            setTimeout(() => setCopiedText(''), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    const downloadTranscriptions = () => {
        if (transcriptions.length === 0) return;

        const content = transcriptions.map(t => 
            `[${moment(t.created_at).format('HH:mm:ss')}] ${t.user?.name || 'Unknown'}: ${t.transcribe}`
        ).join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-transcriptions-${meeting.heading?.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${moment().format('YYYY-MM-DD')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PROCESSING': return 'bg-blue-500 text-white';
            case 'COMPLETED': return 'bg-green-500 text-white';
            case 'SCHEDULED': return 'bg-yellow-500 text-white';
            case 'CANCELED': return 'bg-red-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    if (!meeting) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                        Meeting Transcriptions
                    </DialogTitle>
                </DialogHeader>

                {/* Meeting Info Header */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{meeting.heading}</h3>
                        <Badge className={`px-3 py-1 ${getStatusColor(meeting.status)}`}>
                            {meeting.status}
                        </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{meeting.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{meeting.duration || 0} minutes</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{meeting.participants?.length || 0} participants</span>
                        </div>
                        <span>Created: {moment(meeting.created_at).format('MMM DD, YYYY HH:mm')}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mb-4">
                    <Button 
                        onClick={downloadTranscriptions}
                        disabled={transcriptions.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                    </Button>
                    <Button 
                        onClick={fetchTranscriptions}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </Button>
                </div>

                {/* Transcriptions Content */}
                <ScrollArea className="h-[400px] border rounded-lg">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="text-gray-500">Loading transcriptions...</div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="text-red-500">{error}</div>
                        </div>
                    ) : transcriptions.length === 0 ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="text-gray-500 text-center">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No transcriptions available for this meeting</p>
                                <p className="text-sm mt-1">Transcriptions will appear here when participants speak during the meeting</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 space-y-3">
                            {transcriptions.map((transcription, index) => (
                                <div key={transcription.meeting_transcribtion_id || index} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="font-medium text-gray-900">
                                                {transcription.user?.name || 'Unknown User'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">
                                                {moment(transcription.created_at).format('HH:mm:ss')}
                                            </span>
                                            <Button
                                                onClick={() => copyToClipboard(transcription.transcribe)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                            >
                                                {copiedText === transcription.transcribe ? (
                                                    <Check className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <Copy className="w-4 h-4 text-gray-400" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed pl-10">
                                        {transcription.transcribe}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-500">
                        {transcriptions.length > 0 && (
                            <span>{transcriptions.length} transcription{transcriptions.length !== 1 ? 's' : ''} found</span>
                        )}
                    </div>
                    <Button onClick={onClose} variant="outline">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TranscriptionPopup;
