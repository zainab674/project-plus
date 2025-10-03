import React, { useState } from 'react';
import { AlertCircle, DollarSign, PieChart, Clock, CheckCircle, XCircle, User, FileText, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

const UnTake = () => {
    const [activeModal, setActiveModal] = useState(null);

    // Dummy data for client approvals
    const pendingClients = [
        {
            id: 1,
            name: "Margaret Chen",
            case: "Personal Injury - Motor Vehicle Accident",
            type: "Personal Injury",
            date: "2025-07-14",
            retainer: "$15,000",
            priority: "High",
            attorney: "Sarah Johnson",
            status: "Pending Review"
        },
        {
            id: 2,
            name: "Thompson Industries LLC",
            case: "Contract Dispute - Breach of Supply Agreement",
            type: "Commercial Litigation",
            date: "2025-07-13",
            retainer: "$25,000",
            priority: "Medium",
            attorney: "Michael Roberts",
            status: "Pending Review"
        },
        {
            id: 3,
            name: "David Martinez",
            case: "Employment Law - Wrongful Termination",
            type: "Employment Law",
            date: "2025-07-12",
            retainer: "$8,500",
            priority: "High",
            attorney: "Lisa Anderson",
            status: "Pending Review"
        },
        {
            id: 4,
            name: "Atlantic Real Estate Group",
            case: "Real Estate Transaction - Commercial Property",
            type: "Real Estate",
            date: "2025-07-11",
            retainer: "$12,000",
            priority: "Low",
            attorney: "Robert Kim",
            status: "Pending Review"
        },
        {
            id: 5,
            name: "Jennifer Walsh",
            case: "Family Law - Child Custody Modification",
            type: "Family Law",
            date: "2025-07-10",
            retainer: "$6,000",
            priority: "Medium",
            attorney: "Amanda Foster",
            status: "Pending Review"
        }
    ];


    const Modal = ({ title, onClose, children }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );

    const UntakeModal = () => (
        <Modal title="Client Intake Approvals" onClose={() => setActiveModal(null)}>
            <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Pending Client Approvals</h4>
                    <p className="text-blue-700">Review and approve new client intake requests. Each client requires partner approval before case initiation.</p>
                </div>

                <div className="space-y-4">
                    {pendingClients.map((client) => (
                        <div key={client.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <User className="text-blue-600" size={20} />
                                        <h3 className="text-lg font-semibold text-gray-800">{client.name}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.priority === 'High' ? 'bg-red-100 text-red-800' :
                                            client.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {client.priority} Priority
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="text-gray-500" size={16} />
                                            <span className="text-sm text-gray-600">Case Type:</span>
                                            <span className="text-sm font-medium">{client.type}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="text-gray-500" size={16} />
                                            <span className="text-sm text-gray-600">Date:</span>
                                            <span className="text-sm font-medium">{client.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="text-gray-500" size={16} />
                                            <span className="text-sm text-gray-600">Retainer:</span>
                                            <span className="text-sm font-medium text-green-600">{client.retainer}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="text-gray-500" size={16} />
                                            <span className="text-sm text-gray-600">Attorney:</span>
                                            <span className="text-sm font-medium">{client.attorney}</span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-1">Case Details:</p>
                                        <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{client.case}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    <CheckCircle size={16} />
                                    Approve Client
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                    <XCircle size={16} />
                                    Reject
                                </button>
                                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                                    Request More Info
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );


    return (
        <>

            {/* Untake */}
            <div className="bg-violet-300 p-6 rounded-lg shadow-sm border border-violet-200 bg-opacity-70">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Client Intake</h2>
                    <AlertCircle className="text-violet-500" size={24} />
                </div>
                <div
                    className="bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border"
                    onClick={() => setActiveModal('untake')}
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-medium">Pending Approvals</span>
                            <p className="text-sm text-gray-600">New client intake requests</p>
                        </div>
                        <span className="bg-violet-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {pendingClients.length}
                        </span>
                    </div>
                </div>
            </div>



            {/* Modals */}
            {activeModal === 'untake' && <UntakeModal />}

        </>
    );
};

export default UnTake;