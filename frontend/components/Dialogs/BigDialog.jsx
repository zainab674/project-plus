import { X } from 'lucide-react'
import React from 'react'
import { Button } from '../ui/button'

const BigDialog = ({ onClose, children, open, width = 50, className }) => {
    if (!open) return null;

    return (
        <div className='fixed inset-0 z-50 p-5 bg-black/50 transition-all flex items-center justify-center'>
            <div className={`bg-white shadow-xl rounded-lg mx-auto p-4 relative border border-gray-200 max-h-[90vh] w-8/12 overflow-y-auto  `}>

                <div className='flex items-center justify-end'>
                    <Button
                        className="bg-transparent hover:bg-tbutton-bg text-black hover:text-tbutton-text transition-all"
                        onClick={onClose}
                    >
                        <X />
                    </Button>
                </div>
                <div className=''>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default BigDialog
