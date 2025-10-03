import React, { useCallback } from 'react';


const options = [
    'Facebook / Instagram',
    'Audio ad',
    'Billboard / Public transit ad',
    'LinkedIn',
    'TV / Streaming',
    'YouTube',
    'Search engine',
    'Other'
]

const Step5 = ({setFormdata, formdata}) => {
    const handleCheck = useCallback((e,option) => {
        if(e.target.value == 'on'){
            setFormdata(prev => ({...prev,hear_about_as: option}));
        }else{
            setFormdata(prev => ({...prev,hear_about_as: ''}));
        }
    },[]);
    return (
        <>
            <h2 className="text-2xl font-semibold mb-6">One last question, how did you hear about us?</h2>
            <div className="space-y-4">
                {options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={formdata.hear_about_as == option}
                            onChange={(e) => handleCheck(e,option)}
                        />
                        <span className="text-gray-700">{option}</span>
                    </label>
                ))}
            </div>
        </>
    )
}

export default Step5