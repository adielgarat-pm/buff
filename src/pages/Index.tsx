import { useState, useEffect, useMemo } from 'react';
import { useSyncedTaskStore } from '@/hooks/useSyncedTaskStore';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { WeeklySummary } from '@/components/WeeklySummary';
import { useWeeklySummary, isSaturday } from '@/hooks/useWeeklySummary';
import { ChildView } from '@/components/ChildView';
import { ParentView } from '@/components/ParentView';
import { Loader2 } from 'lucide-react';
import { WeekDay } from '@/types/task';

const Index = () => {
  const { profile } = useAuth();
  const [weeklySummaryOpen, setWeeklySummaryOpen] = useState(false);
  const [weeklySummaryDismissed, setWeeklySummaryDismissed] = useState(() => {
    const dismissed = localStorage.getItem('weeklySummaryDismissed');
    if (dismissed) {
      const { date } = JSON.parse(dismissed);
      return date === new Date().toISOString().split('T')[0];
    }
    return false;
  });
  
  const {
    loading,
    tasks,
    storeRewards,
    completeTask,
    todaySchedule,
    lessonRemindersEnabled,
    bagPrepEnabled,
    bagPrepCompleted,
    bagPrepCredits,
    isCurrentlyWeekend,
    timetable,
    fridayEnabled,
  } = useSyncedTaskStore();

  // Notification system
  const {
    permission,
    scheduleTaskNotifications,
    scheduleLessonNotifications,
    scheduleGearMasterNotification,
  } = useNotifications();

  // Weekly summary data
  const weeklySummaryData = useWeeklySummary(tasks, storeRewards);
  const showWeeklySummary = isSaturday() && !weeklySummaryDismissed;

  const handleDismissWeeklySummary = () => {
    setWeeklySummaryDismissed(true);
    localStorage.setItem('weeklySummaryDismissed', JSON.stringify({
      date: new Date().toISOString().split('T')[0]
    }));
  };

  // Schedule notifications when tasks change or permission is granted
  useEffect(() => {
    if (permission === 'granted' && tasks.length > 0) {
      scheduleTaskNotifications(tasks);
    }
  }, [permission, tasks, scheduleTaskNotifications]);

  // Schedule lesson notifications
  useEffect(() => {
    if (permission === 'granted' && lessonRemindersEnabled && todaySchedule.length > 0) {
      scheduleLessonNotifications(todaySchedule, lessonRemindersEnabled);
    }
  }, [permission, todaySchedule, lessonRemindersEnabled, scheduleLessonNotifications]);

  // Smart Context Guard: Check if tomorrow has a schedule
  const tomorrowHasSchedule = useMemo(() => {
    const today = new Date();
    const todayIndex = today.getDay();
    const tomorrowIndex = (todayIndex + 1) % 7;
    
    const dayMap: Record<number, WeekDay | null> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: fridayEnabled ? 'friday' : null,
      6: null, // Saturday
    };
    
    const tomorrowDay = dayMap[tomorrowIndex];
    if (!tomorrowDay || !timetable) return false;
    
    const tomorrowLessons = (timetable[tomorrowDay] || []).filter(
      (p: { subject?: string }) => p.subject && p.subject.trim() !== ''
    );
    return tomorrowLessons.length > 0;
  }, [timetable, fridayEnabled]);

  // Schedule Gear Master evening notification (19:00) - only on school days with schedule
  useEffect(() => {
    if (permission === 'granted' && !isCurrentlyWeekend) {
      scheduleGearMasterNotification(bagPrepEnabled, bagPrepCompleted, bagPrepCredits, tomorrowHasSchedule);
    }
  }, [permission, bagPrepEnabled, bagPrepCompleted, bagPrepCredits, isCurrentlyWeekend, tomorrowHasSchedule, scheduleGearMasterNotification]);

  // Listen for task completion from service worker
  useEffect(() => {
    const handleSwCompleteTask = (event: CustomEvent<{ taskId: string }>) => {
      completeTask(event.detail.taskId);
    };

    window.addEventListener('sw-complete-task', handleSwCompleteTask as EventListener);
    return () => {
      window.removeEventListener('sw-complete-task', handleSwCompleteTask as EventListener);
    };
  }, [completeTask]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">טוען את המשימות שלך...</p>
        </div>
      </div>
    );
  }

  // Show Weekly Summary on Saturday (auto) or manually opened (for children only)
  const isChild = profile?.role === 'child';
  if (isChild && (showWeeklySummary || weeklySummaryOpen)) {
    return (
      <WeeklySummary 
        data={weeklySummaryData} 
        onClose={() => {
          setWeeklySummaryOpen(false);
          if (isSaturday()) {
            handleDismissWeeklySummary();
          }
        }} 
      />
    );
  }

  const isParent = profile?.role === 'parent';

  // Strict view separation
  if (isParent) {
    return <ParentView />;
  }

  // Default to child view
  return <ChildView />;
};

export default Index;
