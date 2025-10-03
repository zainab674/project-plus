import React from 'react'


const options = [
  { id: 'requests', label: 'Requests and approvals' },
  { id: 'project', label: 'Project management' },
  { id: 'crm', label: 'CRM' },
  { id: 'portfolio', label: 'Portfolio management' },
  { id: 'goals', label: 'Goals and strategy' },
  { id: 'curriculum', label: 'Curriculum and Syllabus management' },
  { id: 'group', label: 'Group assignments' },
  { id: 'resource', label: 'Resource management' },
  { id: 'task', label: 'Task management' },
  { id: 'student', label: 'Student organizations' },
  { id: 'individual', label: 'Individual work' },
  { id: 'academic', label: 'Academic research' },
  { id: 'administrative', label: 'Administrative work' },
  { id: 'business', label: 'Business operations' },
  { id: 'other', label: 'Other' },
]
const Step4 = ({ selectedOptions, setSelectedOptions, setFormdata }) => {

  const toggleOption = (id) => {
    setSelectedOptions(prev => {
      const newprev = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      setFormdata(prev2 => ({ ...prev2, focus: newprev }));
      return newprev;
    }
    )
  }
  return (
    <>
      <h1 className="text-2xl font-bold mb-2 text-foreground-black">Select what you'd like to focus on first</h1>
      <p className="text-gray-600 mb-8">Help us tailor the best experience for you</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => toggleOption(option.id)}
            className={`p-3 rounded-full border text-left ${selectedOptions.includes(option.id)
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 hover:border-gray-400'
              }`}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border mr-3 flex-shrink-0 ${selectedOptions.includes(option.id)
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
                }`}>
                {selectedOptions.includes(option.id) && (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {option.label}
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

export default Step4