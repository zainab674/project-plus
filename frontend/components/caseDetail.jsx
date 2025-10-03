


"use client"

import React, { useState } from 'react';
import { Calendar, User, FileText, Building, Tag, AlertCircle } from 'lucide-react';

const CaseDetail = ({ selectedCase }) => {
    { console.log("selectedCase", selectedCase) }
    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'text-green-600 bg-green-50 border-green-200';
            case 'Active': return 'text-green-600 bg-green-50 border-green-200';
            case 'Pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'Closed': return 'text-gray-600 bg-gray-50 border-gray-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="bg-white text-black">
            <div className="grid p-2 grid-cols-2 gap-8">
                <div className="space-y-2">
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-slate-600 rounded-md">
                                <FileText className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs text-slate-600 font-medium uppercase tracking-wide">Title</span>
                        </div>
                        <div className="font-semibold text-slate-900">{selectedCase.name}</div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-blue-600 rounded-md">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Client</span>
                        </div>
                        <div className="font-semibold text-blue-900">{selectedCase.client_name}</div>
                    </div>

                    <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-green-600 rounded-md">
                                <Calendar className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs text-green-600 font-medium uppercase tracking-wide">Filing Date</span>
                        </div>
                        <div className="font-semibold text-green-900">{selectedCase.filingDate.split('T')[0]}</div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-amber-600 rounded-md">
                                <FileText className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs text-amber-600 font-medium uppercase tracking-wide">Description</span>
                        </div>
                        <div className="font-medium text-amber-900 text-sm leading-relaxed">{selectedCase.description}</div>
                    </div>
                </div>

                <div className="space-y-2">


                    <div className="bg-rose-50 border border-rose-200 p-2 rounded-lg">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-rose-600 rounded-md">
                                <Building className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs text-rose-600 font-medium uppercase tracking-wide">Opposing Party</span>
                        </div>
                        <div className="font-semibold text-rose-900">{selectedCase.opposing}</div>
                    </div>

                    <div className="bg-white border border-slate-200 p-2 rounded-lg">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-slate-600 rounded-md">
                                <AlertCircle className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs text-slate-600 font-medium uppercase tracking-wide">Client Address</span>
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border `}>
                            {selectedCase.client_address}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseDetail;