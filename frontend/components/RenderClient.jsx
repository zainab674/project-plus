


import React from 'react'
import moment from 'moment'
import { Button } from './Button'
import Link from 'next/link'
import AvatarCompoment from './AvatarCompoment'

const RenderClient = ({ members }) => {
    const actionButtons = [
        { label: 'Filed', path: 'filed' },
        { label: 'Updates', path: 'updates' },
        { label: 'Documents', path: 'documents' },
        { label: 'Signature', path: 'sign' },
        { label: 'History', path: 'history' }
    ]

    if (!members || members.length === 0) {
        return (
            <div className="flex items-center justify-center h-[30rem] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="text-center">
                    <div className="text-gray-400 text-lg mb-2">No clients found</div>
                    <div className="text-gray-500 text-sm">Add clients to get started</div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Client Management</h3>
                <p className="text-sm text-gray-600 mt-1">Manage your clients and access their information</p>
            </div>

            <div className="overflow-y-auto max-h-[28rem] custom-scrollbar">
                <div className="divide-y divide-gray-100">
                    {members.map((member, index) => (
                        <div
                            key={member?.project_client_id || index}
                            className="p-6 hover:bg-gray-50 transition-colors duration-200"
                        >
                            {/* Client Info Section */}
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
                                    <AvatarCompoment
                                        name={member?.user?.name}
                                        className="!w-14 !h-14 text-xl font-medium shadow-sm"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-lg font-semibold text-gray-900 truncate">
                                            {member?.user?.name || 'Unknown Client'}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <time className="text-sm text-gray-500">
                                                Added {moment(member.added_at).format("MMM DD, YYYY")}
                                            </time>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2 lg:gap-3">
                                    {actionButtons.map((action) => (
                                        <Link
                                            key={action.path}
                                            href={`/dashboard/${action.path}/${member?.project_client_id}`}
                                            className="group"
                                        >
                                            <Button className="
                                                bg-white text-gray-700 border border-gray-300
                                                hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900
                                                focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                                px-4 py-2 text-sm font-medium
                                                transition-all duration-200 ease-in-out
                                                shadow-sm hover:shadow-md
                                                group-hover:scale-105
                                                min-w-[85px] text-center
                                            ">
                                                {action.label}
                                            </Button>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default RenderClient