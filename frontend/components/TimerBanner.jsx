"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Square, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimer } from '@/providers/TimerProvider';
import Timer from '@/components/Timer';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TimerBanner = () => {
  const { activeTimer, stopTimer, loadingStop } = useTimer();
  const router = useRouter();
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [workDescription, setWorkDescription] = useState('');

  // Add/remove padding to body when timer is active
  useEffect(() => {
    if (activeTimer) {
      document.body.style.paddingTop = '60px';
    } else {
      document.body.style.paddingTop = '0px';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.paddingTop = '0px';
    };
  }, [activeTimer]);

  if (!activeTimer) return null;

  const handleTaskClick = () => {
    // Navigate to the case detail page
    router.push(`/dashboard/project/${activeTimer.project_id}`);
  };

  const handleStopTimer = async () => {
    await stopTimer(workDescription);
    setShowStopDialog(false);
    setWorkDescription('');
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-blue-800/30 rounded-lg px-3 py-2 transition-colors"
            onClick={handleTaskClick}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <div className="flex items-center gap-2">
                <span className="font-medium">Timer Running:</span>
                <Timer startTime={activeTimer.start_time} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-100">Task:</span>
              <span className="font-medium">{activeTimer.task_name}</span>
              <ExternalLink className="h-4 w-4" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => setShowStopDialog(true)}
              disabled={loadingStop}
            >
              <Square className="h-4 w-4 mr-1" />
              Stop Timer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={handleTaskClick}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stop Timer Dialog */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stop Timer</DialogTitle>
            <DialogDescription>
              Add a work description for the time spent on "{activeTimer.task_name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Work Description (Optional)
              </label>
              <textarea
                className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe what you worked on..."
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStopDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStopTimer}
              disabled={loadingStop}
              className="bg-red-600 hover:bg-red-700"
            >
              {loadingStop ? 'Stopping...' : 'Stop Timer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TimerBanner;
