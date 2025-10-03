import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Phone, Clock, Calendar, User, FileText, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateCallDescription } from '@/lib/http/callContactApi';

const CallDetailsModal = ({ isOpen, onClose, call, onUpdate }) => {
    const [description, setDescription] = useState(call?.description || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!call?.call_id) {
            toast.error('No call ID found');
            return;
        }

        try {
            setIsLoading(true);
            const response = await updateCallDescription(call.call_id, { description });
            
            if (response.data.success) {
                toast.success('Call description updated successfully');
                onUpdate && onUpdate({ ...call, description });
                onClose();
            } else {
                toast.error('Failed to update call description');
            }
        } catch (error) {
            console.error('Error updating call description:', error);
            toast.error('Failed to update call description');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const formatDuration = (duration) => {
        if (!duration) return 'N/A';
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'text-green-600 bg-green-100';
            case 'ringing':
                return 'text-yellow-600 bg-yellow-100';
            case 'failed':
                return 'text-red-600 bg-red-100';
            case 'ended':
                return 'text-gray-600 bg-gray-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    if (!call) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Call Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Call Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Contact Name</Label>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{call.contact_name || call.name || 'Unknown'}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{call.to_number || call.number}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Call Type</Label>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    call.call_type === 'OUTGOING' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                    {call.call_type || 'OUTGOING'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Status</Label>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(call.status)}`}>
                                    {call.status || 'Unknown'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Start Time</Label>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{formatDate(call.start_time || call.timestamp)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Duration</Label>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{formatDuration(call.duration)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Call SID */}
                    {call.call_sid && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Call SID</Label>
                            <div className="p-2 bg-gray-50 rounded-md">
                                <span className="text-xs font-mono text-gray-600">{call.call_sid}</span>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {call.error_message && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-red-600">Error Message</Label>
                            <div className="p-2 bg-red-50 rounded-md">
                                <span className="text-sm text-red-800">{call.error_message}</span>
                            </div>
                        </div>
                    )}

                    {/* Recording URL */}
                    {call.recording_url && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Recording</Label>
                            <div className="p-2 bg-gray-50 rounded-md">
                                <a 
                                    href={call.recording_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                    Listen to Recording
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Transcript */}
                    {call.transcript && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Call Transcript</Label>
                            <div className="p-3 bg-gray-50 rounded-md max-h-40 overflow-y-auto">
                                <p className="text-sm text-gray-800 leading-relaxed">
                                    {call.transcript}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Call Description
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add notes about this call..."
                            className="min-h-[100px] resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Description
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CallDetailsModal;
