'use client';
import { useRouter as useNextRouter } from 'next/navigation';
import { useTab } from '@/providers/TabProvider';

/**
 * Custom hook that intercepts Next.js router.push and opens pages in tabs
 * Usage: const router = useTabNavigation(); router.push('/dashboard/chat');
 */
export function useTabNavigation() {
  const nextRouter = useNextRouter();
  const { openTab } = useTab();

  const router = {
    push: (path, options) => {
      // Open in tab instead of direct navigation
      openTab(path);
      // Don't call nextRouter.push here as openTab handles it
    },
    replace: (path, options) => {
      // For replace, we still use tab system but close current tab and open new one
      openTab(path);
      // Note: This doesn't truly "replace" but opens in new tab
      // If you want true replace behavior, we'd need to close current tab first
      nextRouter.replace(path);
    },
    back: () => {
      nextRouter.back();
    },
    forward: () => {
      nextRouter.forward();
    },
    refresh: () => {
      nextRouter.refresh();
    },
    prefetch: (path) => {
      return nextRouter.prefetch(path);
    },
  };

  return router;
}

