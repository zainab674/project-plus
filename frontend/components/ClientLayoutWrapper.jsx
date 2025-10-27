'use client'
import { useState } from "react";
import { usePathname } from "next/navigation";
import TimerBanner from "@/components/TimerBanner";
import ConditionalAIChatbot from "@/components/ConditionalAIChatbot";
import ConditionalQuickActions from "@/components/ConditionalQuickActions";
import TopNavigation from "@/components/TopNavigation";
import UniversalChatWidget from "@/components/UniversalChatWidget";

export default function ClientLayoutWrapper({ children }) {
  const [isSidebarMode, setIsSidebarMode] = useState(false);
  const pathname = usePathname();

  // Define routes where TopNavigation should NOT be shown
  const hiddenRoutes = [
    '/sign-in',
    '/sign-up',
    '/sign-up-as-client',
    '/verify',
    '/forgot-password',
    '/reset-password',
  ];

  // Check if current route should hide navigation
  const shouldHideNavigation = hiddenRoutes.some(route => pathname?.startsWith(route));

  // Hide QuickActions, TimerBanner, AIChatbot, and UniversalChatWidget on auth pages too
  const isAuthPage = shouldHideNavigation;

  return (
    <>
      {!shouldHideNavigation && (
        <TopNavigation isSidebarMode={isSidebarMode} setIsSidebarMode={setIsSidebarMode} />
      )}
      {!isAuthPage ? (
        <ConditionalQuickActions isSidebarMode={isSidebarMode} setIsSidebarMode={setIsSidebarMode}>
          <TimerBanner />
          <div className="min-h-screen">
            {children}
          </div>
          <ConditionalAIChatbot />
        </ConditionalQuickActions>
      ) : (
        <div className="min-h-screen">
          {children}
        </div>
      )}
      {!isAuthPage && <UniversalChatWidget />}
    </>
  );
}