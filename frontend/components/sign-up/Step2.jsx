import React, { useCallback } from 'react'

const categories = ['Work', 'Personal', 'School', 'Nonprofits']
const roleOptions = {
    Work: ['Business owner', 'Team leader', 'Team member', 'Freelancer', 'Director', 'C-Level', 'VP'],
    Personal: ['Student', 'Homemaker', 'Freelancer', 'Other'],
    School: ['Teacher', 'Student', 'Administrator', 'Other'],
    Nonprofits: ['Executive', 'Manager', 'Volunteer', 'Other']
}

const Step2 = ({selectedCategory,setSelectedCategory,setFormdata,formdata}) => {
  const handleSelect = useCallback((role) => {
    setFormdata(prev => ({...prev,bring: role}));
  },[])
  return (
    <>
        <h2 className="text-2xl font-bold mb-6 text-foreground-black">Hey there, what brings you here today?</h2>
          <div className="flex flex-wrap gap-3 mb-12">
            {categories.map((category) => (
              <button 
                key={category} 
                className={`px-4 py-2 rounded-full border ${
                  selectedCategory === category ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                } text-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {selectedCategory && (
            <>
              <h2 className="text-2xl font-bold mb-6">What best describes your current role?</h2>
              <div className="flex flex-wrap gap-3">
                {roleOptions[selectedCategory].map((role) => (
                  <button key={role} className={`${formdata.bring == role ? 'ring-2 ring-blue-500 outline-none':''} px-4 py-2 rounded-full border border-gray-300 text-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`} onClick={() => handleSelect(role)}>
                    {role}
                  </button>
                ))}
              </div>
            </>
          )}
    </>
  )
}

export default Step2