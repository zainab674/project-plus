import React from 'react'

const Step1 = ({ formdata, onFormDataChange }) => {
    return (
        <>
            <div className="flex items-center justify-center px-4 mx-auto bg-white rounded-md h-[40rem] mt-10">
                <div className="w-[35rem] space-y-6 bg-white rounded-md p-4">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-semibold text-purple-900">Create your account</h1>
                        <p className="text-purple-600">Get started - it's free. No credit card needed.</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                            <input
                                type="text"
                                id="fullName"
                                name='name'
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your full name"
                                value={formdata.name}
                                onChange={onFormDataChange}
                            />

                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                id="password"
                                name='password'
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter at least 8 characters"
                                value={formdata.password}
                                onChange={onFormDataChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Step1