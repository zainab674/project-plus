'use client'

import { usePathname } from 'next/navigation';
import { QuickActions } from './quickActions';

const ConditionalQuickActions = ({ children }) => {
  const pathname = usePathname();
  
  // Define authentication routes where QuickActions should be hidden
  const authRoutes = ['/sign-in', '/sign-up', '/forgot-password', '/verify'];
  
  // Check if current path is an authentication route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // If it's an auth route, render children without QuickActions wrapper
  if (isAuthRoute) {
    return (
      <>
        {children}
      </>
    );
  }
  
  // For all other routes, render with QuickActions wrapper
  return (
    <QuickActions>
      {children}
    </QuickActions>
  );
};

export default ConditionalQuickActions;
