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
      // Remove token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Debug: Check if token exists in localStorage
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
    }
  }, [searchParams]);

  return <Dashboard />;
}