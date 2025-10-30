'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTab } from '@/providers/TabProvider';

// Route to color mapping based on quick action buttons
const routeToColor = {
  '/dashboard': 'bg-slate-200',
  '/dashboard/home': 'bg-slate-200',
  '/dashboard/cases': 'bg-purple-200',
  '/dashboard/tasks': 'bg-blue-200',
  '/dashboard/tasks/add': 'bg-blue-200',
  '/dashboard/timer': 'bg-green-200',
  '/dashboard/timeline': 'bg-orange-200',
  '/dashboard/meeting': 'bg-pink-200',
  '/dashboard/meeting/create': 'bg-pink-200',
  '/dashboard/meeting/create-client': 'bg-pink-200',
  '/dashboard/chat': 'bg-yellow-200',
  '/dashboard/notes': 'bg-emerald-200',
  '/dashboard/team': 'bg-emerald-200',
  '/dashboard/template-documents': 'bg-indigo-200',
  '/dashboard/flowchart': 'bg-cyan-200',
  '/dashboard/phone': 'bg-teal-200',
  '/dashboard/invite-biller': 'bg-green-200',
  '/dashboard/case-assignment': 'bg-indigo-200',
  '/dashboard/ai-assistant': 'bg-green-500',
};

// Get color for a route path
const getRouteColor = (path) => {
  // Check exact matches first
  if (routeToColor[path]) {
    return routeToColor[path];
  }
  
  // Check pattern matches
  if (path.startsWith('/dashboard/project/')) {
    return 'bg-purple-200'; // Projects use cases color
  }
  
  if (path.startsWith('/dashboard/cases/')) {
    return 'bg-purple-200';
  }
  
  // Default color
  return 'bg-slate-200';
};

// Convert Tailwind color class to hex color
const tailwindColorToHex = (colorClass) => {
  const colorMap = {
    'bg-slate-200': '#e2e8f0',
    'bg-green-500': '#22c55e',
    'bg-green-200': '#bbf7d0',
    'bg-orange-200': '#fed7aa',
    'bg-yellow-200': '#fef08a',
    'bg-blue-200': '#bfdbfe',
    'bg-purple-200': '#e9d5ff',
    'bg-pink-200': '#fbcfe8',
    'bg-red-200': '#fecaca',
    'bg-emerald-200': '#a7f3d0',
    'bg-indigo-200': '#c7d2fe',
    'bg-violet-200': '#e9d5ff',
    'bg-cyan-200': '#a5f3fc',
    'bg-teal-200': '#99f6e4',
  };
  return colorMap[colorClass] || '#e2e8f0';
};

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTab();
  const tabBarRef = useRef(null);

  // Auto scroll to active tab
  useEffect(() => {
    if (tabBarRef.current && activeTabId) {
      const activeTabElement = tabBarRef.current.querySelector(`[data-tab-id="${activeTabId}"]`);
      if (activeTabElement) {
        activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTabId]);

  if (tabs.length === 0) return null;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  const handleCloseTab = (e, tabId) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  return (
    <div className="bg-white sticky top-16 z-30">
      <div
        ref={tabBarRef}
        className="flex-1 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className="flex items-end h-8 bg-white">
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTabId;
            const isFirst = index === 0;
            const isLast = index === tabs.length - 1;
            const prevTab = index > 0 ? tabs[index - 1] : null;
            const nextTab = index < tabs.length - 1 ? tabs[index + 1] : null;
            const nextTabIsActive = nextTab?.id === activeTabId;
            const prevTabIsActive = prevTab?.id === activeTabId;
            const tabColor = getRouteColor(tab.path);
            const tabColorHex = tailwindColorToHex(tabColor);
            const nextTabColorClass = nextTab ? getRouteColor(nextTab.path) : null;
            const nextTabColorHex = nextTabIsActive ? '#ffffff' : (nextTabColorClass ? tailwindColorToHex(nextTabColorClass) : '#ffffff');
            const prevTabColorClass = prevTab ? getRouteColor(prevTab.path) : null;
            const prevTabColorHex = prevTabIsActive ? '#ffffff' : (prevTabColorClass ? tailwindColorToHex(prevTabColorClass) : '#ffffff');
            
            // For inactive tabs: left edge diagonal cut (upward slope), right edge diagonal cut (downward slope)
            // For active tab: rounded corners, subtle right diagonal cut
            const inactiveClipPath = isLast 
              ? 'polygon(18px 0, 100% 0, 100% 100%, 0 100%)' // Last tab: only left cut
              : 'polygon(18px 0, calc(100% - 18px) 0, 100% 100%, 0 100%)'; // Middle tabs: both cuts
            
            return (
              <div
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  group relative flex items-center h-8
                  cursor-pointer
                  transition-all duration-200
                  min-w-[120px] max-w-[240px]
                  ${isActive ? 'bg-white z-10' : `${tabColor} z-0`}
                `}
                style={{
                  clipPath: isActive ? 'none' : inactiveClipPath,
                  marginLeft: isActive && !isFirst 
                    ? '-18px' 
                    : isActive && isFirst 
                      ? '0' 
                      : !isFirst 
                        ? '-18px' 
                        : '0',
                  borderRadius: isActive ? '8px 8px 0 0' : '0',
                  paddingLeft: isActive ? '16px' : (isFirst ? '16px' : '24px'),
                  paddingRight: isActive ? '16px' : (isLast ? '16px' : '24px'),
                }}
                title={tab.title}
              >
                {/* Left diagonal cut for inactive tabs (pronounced upward slope) */}
                {!isActive && !isFirst && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 pointer-events-none"
                    style={{
                      width: '18px',
                      clipPath: 'polygon(0 100%, 18px 0, 0 0)',
                      background: prevTabIsActive ? '#ffffff' : prevTabColorHex || tabColorHex,
                      zIndex: -1,
                    }}
                  />
                )}

                {/* Right diagonal cut for inactive tabs (downward slope) */}
                {!isActive && !isLast && (
                  <div 
                    className="absolute right-0 top-0 bottom-0 pointer-events-none z-10"
                    style={{
                      width: '18px',
                      clipPath: 'polygon(calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%)',
                      background: nextTabColorHex,
                    }}
                  />
                )}

                {/* Active tab subtle diagonal cut on right side */}
                {isActive && !isLast && (
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-6 pointer-events-none"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                      background: 'linear-gradient(to bottom right, transparent 0%, rgba(229, 231, 235, 0.3) 50%, transparent 100%)',
                      transform: 'skewX(-15deg)',
                      transformOrigin: 'right',
                    }}
                  />
                )}

                {/* Close button for inactive tabs - positioned on the LEFT */}
                {!isActive && (
                  <button
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className={`
                      flex-shrink-0 w-4 h-4 mr-2
                      flex items-center justify-center
                      transition-opacity duration-200
                      hover:opacity-70
                      ${tabs.length === 1 ? 'opacity-0 cursor-default' : 'opacity-100'}
                    `}
                    disabled={tabs.length === 1}
                    title={tabs.length === 1 ? 'Cannot close the last tab' : 'Close tab'}
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                )}

                {/* Tab title */}
                <span
                  className={`
                    text-sm truncate flex-1 text-center
                    ${isActive ? 'text-gray-500 font-medium' : 'text-white font-medium'}
                  `}
                >
                  {tab.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

