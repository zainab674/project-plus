import React, { useCallback } from 'react'


const teamSizeOptions = [
    'Only me',
    '2-5',
    '6-10',
    '11-15',
    '16-25',
    '26-50',
    '51-100',
    '101-500'
  ]
  
const Step3 = ({setFormdata,formdata}) => {
    const handleSelect = useCallback((size) => {
        setFormdata(prev => ({...prev,teams_member_count: size}));
    },[])
    return (
        <>
            <h1 className="text-2xl font-bold mb-8 text-foreground-black">How many people are on your team?</h1>
            <div className="grid grid-cols-3 gap-4">
                {teamSizeOptions.map((option) => (
                    <button
                        key={option}
                        className={`${formdata.teams_member_count == option ? 'ring-2 ring-blue-500 outline-none' : ''} py-2 px-4 border border-gray-300 rounded-full text-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        onClick={() => handleSelect(option)}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </>
    )
}

export default Step3