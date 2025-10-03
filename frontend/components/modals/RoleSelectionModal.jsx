import React, { useState } from 'react';
import { X, User, Users, DollarSign, Building } from 'lucide-react';
import { Button } from '../Button';

const RoleSelectionModal = ({ isOpen, onClose, onDismiss, onRoleSelect, isLoading }) => {
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    {
      id: 'CLIENT',
      name: 'Client',
      description: 'I need legal services and want to manage my cases',
      icon: User,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      selectedColor: 'bg-blue-100 border-blue-400'
    },
    {
      id: 'PROVIDER',
      name: 'Law Firm Admin',
      description: 'I manage a law firm and want to oversee projects and teams',
      icon: Building,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      selectedColor: 'bg-purple-100 border-purple-400'
    },
    {
      id: 'TEAM',
      name: 'Team Member',
      description: 'I work as part of a legal team on cases and projects',
      icon: Users,
      color: 'bg-green-50 border-green-200 text-green-700',
      selectedColor: 'bg-green-100 border-green-400'
    },
    {
      id: 'BILLER',
      name: 'Biller',
      description: 'I handle billing, invoicing, and financial management',
      icon: DollarSign,
      color: 'bg-orange-50 border-orange-200 text-orange-700',
      selectedColor: 'bg-orange-100 border-orange-400'
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
    }
  };

  const handleDismiss = () => {
    onDismiss();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Choose Your Role</h2>
            <p className="text-gray-600 mt-1">Select the role that best describes your position</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Role Options */}
        <div className="p-6 space-y-4">
          {roles.map((role) => {
            const IconComponent = role.icon;
            const isSelected = selectedRole?.id === role.id;
            
            return (
              <div
                key={role.id}
                onClick={() => handleRoleSelect(role)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected 
                    ? `${role.selectedColor} border-2` 
                    : `${role.color} border-2 hover:border-opacity-60`
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-white' : 'bg-white bg-opacity-50'}`}>
                    <IconComponent size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{role.name}</h3>
                    <p className="text-sm mt-1 opacity-80">{role.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700"
          >
            Keep Current Role
          </Button>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!selectedRole || isLoading}
              isLoading={isLoading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal; 