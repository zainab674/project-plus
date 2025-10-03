import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Send, Save, X, DollarSign, Calendar, User, Building } from 'lucide-react';
import { toast } from 'react-toastify';

const InvoicePreview = ({ invoice, onClose, onSave }) => {
    if (!invoice) return null;

    const handleDownload = () => {
        // In a real implementation, this would generate and download a PDF
        toast.info('PDF download functionality would be implemented here');
    };

    const handleSend = () => {
        // In a real implementation, this would send the invoice via email
        toast.info('Email functionality would be implemented here');
    };

    const handleSave = () => {
        if (onSave) {
            onSave(invoice, invoice.lineItems);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Invoice Preview</DialogTitle>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Invoice Header */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">INVOICE</h2>
                                    <p className="text-muted-foreground">#{invoice.invoice_id}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant={
                                        invoice.status === 'DRAFT' ? 'secondary' :
                                        invoice.status === 'SENT' ? 'default' :
                                        'outline'
                                    }>
                                        {invoice.status}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Project Details</h3>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex items-center">
                                            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span className="font-medium">{invoice.project_name}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span>Period: {formatDate(invoice.billing_period_start)} - {formatDate(invoice.billing_period_end)}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span>Issued: {formatDate(invoice.issued_date)}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span>Due: {formatDate(invoice.due_date)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Billing Information</h3>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex items-center">
                                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span>Biller ID: {invoice.biller_id}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span>Client ID: {invoice.client_id}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Line Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Line Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead className="text-right">Unit Rate</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.lineItems.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{item.description}</p>
                                                    {item.user_name && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.user_name}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {item.item_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.unit_rate)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(item.total_amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Invoice Summary */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal:</span>
                                        <span>{formatCurrency(invoice.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tax:</span>
                                        <span>{formatCurrency(0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Discount:</span>
                                        <span>{formatCurrency(0)}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                        <span>Total:</span>
                                        <span>{formatCurrency(invoice.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-2">
                        <Button variant="outline" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                        <Button variant="outline" onClick={handleSend}>
                            <Send className="h-4 w-4 mr-2" />
                            Send Email
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Invoice
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default InvoicePreview; 