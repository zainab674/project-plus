
"use client"

import React from 'react';
import { useUser } from '@/providers/UserProvider';
import RoleSelectionModal from './modals/RoleSelectionModal';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const RoleSelectionWrapper = ({ children }) => {
  const {
    showRoleSelection,
    setShowRoleSelection,
    updateUserRole,
    dismissRoleSelection,
    isLoading
  } = useUser();
  const router = useRouter();

  const handleRoleSelect = async (role) => {
    try {
      await updateUserRole(role.id);
      toast.success(`Role set to ${role.name} successfully!`);

      // Redirect based on role
      if (role.id === 'CLIENT') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to update role. Please try again.');
    }
  };

  const handleClose = () => {
    setShowRoleSelection(false);
  };

  const handleDismiss = () => {
    dismissRoleSelection();
  };

  return (
    <>
      {children}
      <RoleSelectionModal
        isOpen={showRoleSelection}
        onClose={handleClose}
        onDismiss={handleDismiss}
        onRoleSelect={handleRoleSelect}
        isLoading={isLoading}
      />
    </>
  );
};

export default RoleSelectionWrapper; 