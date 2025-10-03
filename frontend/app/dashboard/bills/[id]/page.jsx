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
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { DateRangePicker } from 'react-date-range';

import { useUser } from '@/providers/UserProvider';
import { Button } from '@/components/Button';
import BigDialog from '@/components/Dialogs/BigDialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
import { createBillingRequest, getBillingRequest, getByDateRange, getDocuemtnRequest, getUpdatesRequest, giveUpdateRequest, requestDocuemtnRequest, updateBillingStatusRequest, updateStatusRequest, uploadDocumentRequest } from '@/lib/http/client';
import Loader from '@/components/Loader';
import moment from 'moment';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Info, Plus } from 'lucide-react';
import { Calendar } from 'lucide-react';
import { getRecentDatesWithLabels } from '@/utils/getRecentDatesWithLabels';

const page = ({ params }) => {
    const { id } = use(params);
    const [open, setOpen] = useState(false);
    const [bills, setBills] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false)
    const [hour, setHours] = useState([]);
    const [totalHour, setTotalHour] = useState(0);
    const [dates, setDates] = React.useState(getRecentDatesWithLabels(90));
    const [formdata, setFormdata] = useState({
        description: '',
        project_client_id: id,
        calls: {
            count: 0,
            amount: 0,
            duration: 0
        },
        chats: {
            count: 0,
            amount: 0
        },
        meetings: {
            count: 0,
            amount: 0
        },
        mails: {
            count: 0,
            amount: 0
        },
        updates: {
            count: 0,
            amount: 0
        },
        documents: {
            count: 0,
            amount: 0
        },
        total: 0,
    });

    const [info, setInfo] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const { user } = useUser();

    const getBills = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getBillingRequest(id);
            setBills(res.data.billings)
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getBills();
    }, [id]);




    const handleCreateBill = useCallback(async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const formData = {
                project_client_id: id, start_date: startDate, end_date: endDate, amount: formdata.total, description: formdata.description
            }
            const res = await createBillingRequest(formData);
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message)
        } finally {
            setSubmitLoading(false);
            setOpen(false);
            getBills();
        }
    }, [formdata, id, startDate, endDate]);



    const getInfo = useCallback(async () => {
        try {
            const res = await getByDateRange(startDate, endDate, id);
            setInfo(res.data.info);
            const data = res.data.info;
            setFormdata(prev => ({ ...prev, calls: { count: data.calls.length, duration: data.callDurations, amount: 0 } }));
            setFormdata(prev => ({ ...prev, mails: { count: data.mails.length, amount: 0 } }));
            setFormdata(prev => ({ ...prev, meetings: { count: data.meetings.length, amount: 0 } }));
            setFormdata(prev => ({ ...prev, chats: { count: data.chats.length, amount: 0 } }));
            setFormdata(prev => ({ ...prev, documents: { count: data.documents.length, amount: 0 } }));
            setFormdata(prev => ({ ...prev, updates: { count: data.updates.length, amount: 0 } }));
            setHours(res.data.info.workingHours)
            setTotalHour(res.data.info.totalTimeStr)
        } catch (error) {
            console.log(error.response.data.message);
        }
    }, [id, startDate, endDate]);


    const handleUpdateStatus = useCallback(async (status, billing_id) => {
        try {
            const formdata = {
                status,
                billing_id
            }
            const res = await updateBillingStatusRequest(formdata);
            toast.success(res.data.message)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            getBills();
        }
    }, [])

    useEffect(() => {
        if (startDate && endDate && id) {
            getInfo();
        }
    }, [id, startDate, endDate]);


    useEffect(() => {
        const newTotal =
            +formdata.calls.amount +
            +formdata.chats.amount +
            +formdata.meetings.amount +
            +formdata.mails.amount +
            +formdata.updates.amount +
            +formdata.documents.amount;

        setFormdata(prevState => ({
            ...prevState,
            total: newTotal
        }));
    }, [formdata.calls.amount, formdata.chats.amount, formdata.meetings.amount, formdata.mails.amount, formdata.updates.amount, formdata.documents.amount]);


    if (loading) {
        return <>
            <div className=" h-screen bg-primary m-2 rounded-md flex items-center justify-center">
                <Loader />
            </div>
        </>
    }


    return (
        <>
            <main className="flex-1 overflow-auto p-8 bg-secondary m-2 rounded-md">
                {
                    user?.Role == "PROVIDER" &&
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold text-foreground-primary">Project Bills</h1>
                            <Info className="h-4 w-4 text-foreground-secondary" />
                        </div>
                        <Button
                            className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                            onClick={() => setOpen(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Bill
                        </Button>
                    </div>
                }

                <div className="flex-1 overflow-auto">
                    <Table className="border-collapse border border-primary rounded-md">
                        <TableHeader className="border-b border-primary bg-primary/10">
                            <TableRow>
                                <TableHead className="!w-[80px] border-r border-primary last:border-r-0 text-foreground-primary font-semibold">#</TableHead>
                                <TableHead className="w-[300px] border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Description</TableHead>
                                <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Date</TableHead>
                                <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Status</TableHead>
                                <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {
                                bills && bills.map((bill, index) => (
                                    <TableRow key={bill.billing_id} className="hover:bg-primary/5">
                                        <TableCell className="font-medium text-foreground-primary">{index + 1}</TableCell>
                                        <TableCell className="text-foreground-primary">{bill.description}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4 text-foreground-secondary" />
                                                <span className="text-foreground-primary">{bill.start_date} - {bill.end_date}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {
                                                user?.Role == "PROVIDER" &&
                                                (
                                                    <Select onValueChange={(status) => handleUpdateStatus(status, bill.billing_id)} value={bill.status}>
                                                        <SelectTrigger className="w-full bg-secondary border-primary text-foreground-primary">
                                                            <SelectValue placeholder="Select a status" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-secondary border-primary">
                                                            <SelectGroup>
                                                                <SelectLabel className="text-foreground-secondary">Status</SelectLabel>
                                                                <SelectItem value="PAID" className="text-foreground-primary hover:!bg-tbutton-bg hover:!text-tbutton-text">PAID</SelectItem>
                                                                <SelectItem value="UNPAID" className="text-foreground-primary hover:!bg-tbutton-bg hover:!text-tbutton-text">UNPAID</SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                )
                                            }
                                            {
                                                user?.Role == "CLIENT" &&
                                                (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bill.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {bill.status}
                                                    </span>
                                                )
                                            }
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground-primary">${bill.amount}</TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </div>
            </main>


            <BigDialog open={open} onClose={() => setOpen(false)} width={'38'}>
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className='text-2xl font-semibold text-foreground-primary'>Create Bill</h1>
                        <p className="text-sm text-foreground-secondary">Fill in the details to create a new bill</p>
                    </div>
                    <form className='space-y-6' onSubmit={handleCreateBill}>
                        <Select onValueChange={(value) => {setStartDate(value);setEndDate(value)}}>
                            <SelectTrigger className="w-full bg-white border-primary text-black">
                                <SelectValue placeholder={"End Date"} />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-primary">
                                <SelectGroup>
                                    <SelectLabel className="text-gray-400">Dates</SelectLabel>
                                    {
                                        dates.map(date => (
                                            <SelectItem
                                                value={date.date}
                                                key={date.date}
                                                className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                                            >
                                                {date.label}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-4">


                            {/* <div className="space-y-2">
                                <Label htmlFor="startDate" className="text-sm font-medium text-foreground-primary">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    name="startDate"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    className="bg-white border-primary text-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate" className="text-sm font-medium text-foreground-primary">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    name="endDate"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                    className="bg-white border-primary text-black"
                                />
                            </div> */}
                        </div>

                        <div className='space-y-4 p-4 rounded-lg border border-primary bg-secondary'>
                            <h3 className="text-lg font-medium text-foreground-primary">Bill Details</h3>
                            <div className='grid grid-cols-3 gap-4'>
                                <div className='space-y-2'>
                                    <Label className="text-sm font-medium text-foreground-primary">Calls</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="Amount"
                                            value={formdata.calls.amount}
                                            onChange={(e) => setFormdata(prev => ({ ...prev, calls: { ...formdata.calls, amount: e.target.value } }))}
                                            className="bg-white border-primary text-black"
                                        />
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-medium text-foreground-primary">{formdata.calls.count} calls</span>
                                            <span className="text-xs text-foreground-secondary">{formdata.calls.duration} min</span>
                                        </div>
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <Label className="text-sm font-medium text-foreground-primary">Mails</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="Amount"
                                            value={formdata.mails.amount}
                                            onChange={(e) => setFormdata(prev => ({ ...prev, mails: { ...formdata.mails, amount: e.target.value } }))}
                                            className="bg-white border-primary text-black"
                                        />
                                        <span className="text-xs font-medium text-foreground-primary">{formdata.mails.count} mails</span>
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <Label className="text-sm font-medium text-foreground-primary">Meetings</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="Amount"
                                            value={formdata.meetings.amount}
                                            onChange={(e) => setFormdata(prev => ({ ...prev, meetings: { ...formdata.meetings, amount: e.target.value } }))}
                                            className="bg-white border-primary text-black"
                                        />
                                        <span className="text-xs font-medium text-foreground-primary">{formdata.meetings.count} meetings</span>
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <Label className="text-sm font-medium text-foreground-primary">Chats</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="Amount"
                                            value={formdata.chats.amount}
                                            onChange={(e) => setFormdata(prev => ({ ...prev, chats: { ...formdata.chats, amount: e.target.value } }))}
                                            className="bg-white border-primary text-black"
                                        />
                                        <span className="text-xs font-medium text-foreground-primary">{formdata.chats.count} chats</span>
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <Label className="text-sm font-medium text-foreground-primary">Documents</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="Amount"
                                            value={formdata.documents.amount}
                                            onChange={(e) => setFormdata(prev => ({ ...prev, documents: { ...formdata.documents, amount: e.target.value } }))}
                                            className="bg-white border-primary text-black"
                                        />
                                        <span className="text-xs font-medium text-foreground-primary">{formdata.documents.count} documents</span>
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <Label className="text-sm font-medium text-foreground-primary">Updates</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="Amount"
                                            value={formdata.updates.amount}
                                            onChange={(e) => setFormdata(prev => ({ ...prev, updates: { ...formdata.updates, amount: e.target.value } }))}
                                            className="bg-white border-primary text-black"
                                        />
                                        <span className="text-xs font-medium text-foreground-primary">{formdata.updates.count} updates</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-primary">
                                <span className="text-lg font-medium text-foreground-primary">Total Amount</span>
                                <span className="text-2xl font-bold text-foreground-primary">${formdata.total}</span>
                            </div>
                        </div>

                        <div className='space-y-4 p-4 rounded-lg border border-primary bg-secondary'>
                            <h2 className='text-lg font-medium text-foreground-primary'>Working Hours</h2>
                            <div className="space-y-2">
                                {hour.map((h, index) => (
                                    <div key={index} className='flex justify-between items-center py-2 px-3 rounded-md hover:bg-primary/5'>
                                        <span className="text-foreground-primary">{h[0]}</span>
                                        <span className="text-foreground-primary font-medium">{h[2]}</span>
                                    </div>
                                ))}
                                <div className='flex justify-between items-center pt-3 border-t border-primary mt-2'>
                                    <span className="font-medium text-foreground-primary">Total Hours</span>
                                    <span className="font-bold text-foreground-primary">{totalHour}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-foreground-primary">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Enter bill description..."
                                value={formdata.description}
                                onChange={(e) => setFormdata(prev => ({ ...prev, description: e.target.value }))}
                                required
                                className="min-h-[100px] bg-white border-primary text-black"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                            disabled={submitLoading}
                        >
                            {submitLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Creating Bill...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Create Bill</span>
                                </div>
                            )}
                        </Button>
                    </form>
                </div>
            </BigDialog>
        </>
    )
}

export default page