'use client'

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Dashboard from '@/components/dashboards/Dashboard';

export default function DashboardPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle token from Google OAuth redirect
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('authToken', token);
      console.log('🔑 Token from URL stored:', token.substring(0, 20) + '...');
      // Remove token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Debug: Check if token exists in localStorage
    const storedToken = localStorage.getItem('authToken');
    console.log('🔍 Dashboard - Token in localStorage:', storedToken ? 'Present' : 'Missing');
    if (storedToken) {
      console.log('🔑 Token value:', storedToken.substring(0, 20) + '...');
    }
  }, [searchParams]);

  return <Dashboard />;
}