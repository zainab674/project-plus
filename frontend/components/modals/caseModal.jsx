


'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import CaseManagementSystem from '../cases/page';

const CaseModal = ({ isOpen, onClose }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out "
                    enterFrom="opacity-0"
                    enterTo="opacity-30"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-30"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black" aria-hidden="true" />
                </Transition.Child>

                <div className="fixed inset-0">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        {/* Modal Panel */}
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all flex flex-col max-h-[90vh]">
                                <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-gray-200">
                                    <button
                                        onClick={onClose}
                                        className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6">
                                    <CaseManagementSystem />
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CaseModal;
