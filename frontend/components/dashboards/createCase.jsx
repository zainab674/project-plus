import React, { useState } from 'react';
import { Plus, X, Calendar, User, FileText, AlertCircle, Briefcase } from 'lucide-react';
import CreateCaseModal from '../cases/createCaseModal';

const CreateCase = () => {
    const [activeModal, setActiveModal] = useState(null);


    return (
        <>
            <div className="p-6 rounded-xl shadow-sm border border-blue-100">


                <button
                    onClick={() => setActiveModal('createCase')}
                    className="w-full bg-blue-400 text-white py-3.5 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md font-medium"
                >
                    <Plus size={20} />
                    <span>Create New Case</span>
                </button>
            </div>

            {activeModal === 'createCase' && < CreateCaseModal onClose={() => setActiveModal(null)} />
            }
        </>
    );
};

export default CreateCase;