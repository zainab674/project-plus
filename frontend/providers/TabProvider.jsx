'use client';
import { createContext, useContext, useState, useCallback, useRef, useEffect, startTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const TabContext = createContext({
  tabs: [],
  activeTabId: null,
  openTab: () => {},
  closeTab: () => {},
  setActiveTab: () => {},
  updateTabTitle: () => {},
});

// Route to title mapping
const routeTitles = {
  '/dashboard': 'Dashboard',
  '/dashboard/home': 'Home',
  '/dashboard/chat': 'Chat',
  '/dashboard/meeting': 'Meetings',
  '/dashboard/timeline': 'Timeline',
  '/dashboard/time-tracking-analytics': 'Time Tracking Analytics',
  '/dashboard/case-workflow': 'Case Workflow',
  '/dashboard/flowchart': 'Flowchart',
  '/dashboard/tasks': 'Tasks',
  '/dashboard/cases': 'Cases',
  '/dashboard/ai-assistant': 'AI Assistant',
  '/dashboard/case-assignment': 'Case Assignment',
  '/dashboard/invite-biller': 'Invite Biller',
  '/dashboard/team': 'Team',
  '/dashboard/template-documents': 'Templates',
  '/dashboard/project': 'Project',
  '/dashboard/notes': 'Notes',
  '/dashboard/timer': 'Timer',
  '/ai-legal-doc': 'AI Legal Doc',
};

// Get title from route
const getTitleFromRoute = (pathname) => {
  // Check exact matches first
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }
  
  // Check pattern matches
  if (pathname.startsWith('/dashboard/project/')) {
    const parts = pathname.split('/');
    if (parts.length > 3) {
      return `Project ${parts[3]}`;
    }
    return 'Project';
  }
  
  if (pathname.startsWith('/dashboard/cases/')) {
    return 'Case Details';
  }
  
  // Default: capitalize route segments
  const segments = pathname.split('/').filter(Boolean);
  return segments.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') || 'Dashboard';
};

export const TabProvider = ({ children }) => {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const tabIdCounter = useRef(0);
  const previousPathnameRef = useRef(pathname);

  // Initialize with current route as first tab
  useEffect(() => {
    if (tabs.length === 0 && pathname && (pathname.startsWith('/dashboard') || pathname.startsWith('/ai-legal-doc'))) {
      const initialTab = {
        id: `tab-${tabIdCounter.current++}`,
        path: pathname,
        title: getTitleFromRoute(pathname),
      };
      setTabs([initialTab]);
      setActiveTabId(initialTab.id);
      previousPathnameRef.current = pathname;
    }
  }, [pathname]);
  
  // Sync active tab with pathname changes and auto-create tabs for new routes
  useEffect(() => {
    if (!pathname || (!pathname.startsWith('/dashboard') && !pathname.startsWith('/ai-legal-doc'))) {
      return; // Only handle dashboard and ai-legal-doc routes
    }

    // Skip if pathname hasn't actually changed
    if (previousPathnameRef.current === pathname) {
      return;
    }

    // Don't auto-create tabs if we're still initializing (tabs is empty)
    // The initialization effect will handle the first tab
    let tabToActivate = null;
    let newTabToCreate = null;

    setTabs(prevTabs => {
      if (prevTabs.length === 0) {
        return prevTabs; // Let initialization effect handle it
      }

      // Check if pathname matches any existing tab
      const matchingTab = prevTabs.find(tab => tab.path === pathname);
      
      if (matchingTab) {
        // Tab exists, just activate it
        tabToActivate = matchingTab.id;
        previousPathnameRef.current = pathname;
        return prevTabs;
      }

      // New route - create a new tab automatically
      // This handles cases where router.push is called directly without useTabNavigation
      newTabToCreate = {
        id: `tab-${tabIdCounter.current++}`,
        path: pathname,
        title: getTitleFromRoute(pathname),
      };

      previousPathnameRef.current = pathname;
      return [...prevTabs, newTabToCreate];
    });

    // Update active tab outside of setTabs callback
    if (tabToActivate) {
      startTransition(() => {
        setActiveTabId(tabToActivate);
      });
    } else if (newTabToCreate) {
      startTransition(() => {
        setActiveTabId(newTabToCreate.id);
      });
    }
  }, [pathname]);

  const openTab = useCallback((path, title = null) => {
    // Don't open tabs for external URLs or special routes
    if (path.startsWith('http') || path.startsWith('//')) {
      window.open(path, '_blank');
      return;
    }

    let tabToActivate = null;
    let newTabToCreate = null;

    setTabs(prevTabs => {
      // Check if tab with this path already exists
      const existingTab = prevTabs.find(tab => tab.path === path);
      if (existingTab) {
        // Tab exists, just activate it
        tabToActivate = existingTab.id;
        return prevTabs;
      }

      // Create new tab
      newTabToCreate = {
        id: `tab-${tabIdCounter.current++}`,
        path: path,
        title: title || getTitleFromRoute(path),
      };

      return [...prevTabs, newTabToCreate];
    });

    // Update state and navigate outside of setTabs callback
    if (tabToActivate) {
      startTransition(() => {
        setActiveTabId(tabToActivate);
        router.push(path);
      });
    } else if (newTabToCreate) {
      startTransition(() => {
        setActiveTabId(newTabToCreate.id);
        router.push(path);
      });
    }
  }, [router]);

  const closeTab = useCallback((tabId) => {
    let pathToNavigate = null;
    let newActiveId = null;

    setTabs(prevTabs => {
      if (prevTabs.length <= 1) {
        // Don't close the last tab
        return prevTabs;
      }

      const tabIndex = prevTabs.findIndex(tab => tab.id === tabId);
      if (tabIndex === -1) return prevTabs;

      const updatedTabs = prevTabs.filter(tab => tab.id !== tabId);
      
      // If closing active tab, switch to another tab
      if (activeTabId === tabId) {
        let newActiveIndex = tabIndex;
        // If closed tab was last, switch to previous
        if (newActiveIndex >= updatedTabs.length) {
          newActiveIndex = updatedTabs.length - 1;
        }
        // If no tabs left (shouldn't happen due to check above), but just in case
        if (updatedTabs.length > 0) {
          const newActiveTab = updatedTabs[newActiveIndex];
          newActiveId = newActiveTab.id;
          pathToNavigate = newActiveTab.path;
        }
      }

      return updatedTabs;
    });

    // Navigate after state update
    if (newActiveId && pathToNavigate) {
      setActiveTabId(newActiveId);
      startTransition(() => {
        router.push(pathToNavigate);
      });
    }
  }, [activeTabId, router]);

  const setActiveTab = useCallback((tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
      startTransition(() => {
        router.push(tab.path);
      });
    }
  }, [tabs, router]);

  const updateTabTitle = useCallback((tabId, title) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId ? { ...tab, title } : tab
      )
    );
  }, []);

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeTabId,
        openTab,
        closeTab,
        setActiveTab,
        updateTabTitle,
      }}
    >
      {children}
    </TabContext.Provider>
  );
};

export const useTab = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTab must be used within a TabProvider');
  }
  return context;
};

