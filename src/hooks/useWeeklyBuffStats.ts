import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Phase, getPhaseForTime, PHASES } from '@/types/phase';

export interface LessonReflection {
  id: string;
  date: string;
  lesson_key: string;
  subject: string | null;
  reflection: string | null;
  difficulty_rating: number | null;
}

export interface DailyStats {
  date: string;
  dayName: string;
  tasksCompleted: number;
  tasksTotal: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  buffPoints: number;
}

export interface SubjectTrend {
  subject: string;
  completionRate: number;
  totalLessons: number;
  completedLessons: number;
  avgDifficulty: number | null;
  trend: 'improving' | 'declining' | 'stable';
}

export interface WeeklyBuffStats {
  totalBuffPoints: number;
  questsConquered: number;
  totalQuests: number;
  lessonsConquered: number;
  totalLessons: number;
  dailyStats: DailyStats[];
  subjectTrends: SubjectTrend[];
  reflections: LessonReflection[];
  streakDays: number;
  topPhase: Phase | null;
  strugglePhase: Phase | null;
}

const DAY_KEYS = ['day.sun', 'day.mon', 'day.tue', 'day.wed', 'day.thu', 'day.fri', 'day.sat'];

export function useWeeklyBuffStats(childId: string | null) {
  const { familyId } = useAuth();
  const [stats, setStats] = useState<WeeklyBuffStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeeklyStats = useCallback(async () => {
    if (!familyId || !childId) {
      setLoading(false);
      return;
    }

    try {
      // Get last 7 days
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      // Fetch tasks for this child
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .eq('assigned_to', childId);

      // Fetch daily progress for last 7 days
      const { data: progressData } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('family_id', familyId)
        .eq('child_id', childId)
        .in('date', dates);

      // Fetch lesson progress for last 7 days
      const { data: lessonProgressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('family_id', familyId)
        .eq('child_id', childId)
        .in('date', dates);

      // Fetch reflections
      const { data: reflectionsData } = await supabase
        .from('lesson_reflections')
        .select('*')
        .eq('family_id', familyId)
        .eq('child_id', childId)
        .in('date', dates)
        .order('date', { ascending: false });

      // Fetch timetable for subject info
      const { data: timetableData } = await supabase
        .from('timetables')
        .select('data')
        .eq('family_id', familyId)
        .eq('assigned_to', childId)
        .maybeSingle();

      const timetable = timetableData?.data as Record<string, { subject: string; startTime: string }[]> || {};

      // Calculate daily stats
      const dailyStats: DailyStats[] = dates.map(date => {
        const dayDate = new Date(date);
        const dayIndex = dayDate.getDay();
        const dayProgress = progressData?.filter(p => p.date === date) || [];
        const dayLessons = lessonProgressData?.filter(l => l.date === date) || [];
        
        const tasksCompleted = dayProgress.filter(p => p.completed).length;
        const lessonsCompleted = dayLessons.filter(l => l.completed).length;
        
        const taskCredits = dayProgress.filter(p => p.completed).length * 10; // Approximate
        const lessonCredits = lessonsCompleted * 10;

        return {
          date,
          dayName: DAY_KEYS[dayIndex],
          tasksCompleted,
          tasksTotal: tasksData?.length || 0,
          lessonsCompleted,
          lessonsTotal: 8,
          buffPoints: taskCredits + lessonCredits,
        };
      });

      // Calculate totals
      const totalBuffPoints = dailyStats.reduce((sum, d) => sum + d.buffPoints, 0);
      const questsConquered = dailyStats.reduce((sum, d) => sum + d.tasksCompleted, 0);
      const totalQuests = dailyStats.reduce((sum, d) => sum + d.tasksTotal, 0);
      const lessonsConquered = dailyStats.reduce((sum, d) => sum + d.lessonsCompleted, 0);
      const totalLessons = dailyStats.reduce((sum, d) => sum + d.lessonsTotal, 0);

      // Calculate streak
      let streakDays = 0;
      for (let i = dailyStats.length - 1; i >= 0; i--) {
        const day = dailyStats[i];
        if (day.tasksCompleted > 0 || day.lessonsCompleted > 0) {
          streakDays++;
        } else {
          break;
        }
      }

      // Calculate subject trends
      const subjectMap = new Map<string, { completed: number; total: number; difficulties: number[] }>();
      
      Object.entries(timetable).forEach(([day, periods]) => {
        periods.forEach((period, idx) => {
          if (period.subject) {
            const existing = subjectMap.get(period.subject) || { completed: 0, total: 0, difficulties: [] };
            existing.total++;
            
            // Check if this lesson was completed
            const lessonKey = `lesson${idx + 1}`;
            const completed = lessonProgressData?.some(
              l => l.lesson_key === lessonKey && l.completed
            );
            if (completed) existing.completed++;

            // Get difficulty from reflections
            const reflection = reflectionsData?.find(
              r => r.lesson_key === lessonKey && r.subject === period.subject
            );
            if (reflection?.difficulty_rating) {
              existing.difficulties.push(reflection.difficulty_rating);
            }

            subjectMap.set(period.subject, existing);
          }
        });
      });

      const subjectTrends: SubjectTrend[] = Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
        totalLessons: data.total,
        completedLessons: data.completed,
        avgDifficulty: data.difficulties.length > 0 
          ? data.difficulties.reduce((a, b) => a + b, 0) / data.difficulties.length 
          : null,
        trend: 'stable' as const, // Simplified for now
      }));

      // Find top/struggle phases
      const phaseStats = PHASES.map(phase => {
        const phaseTasks = tasksData?.filter(t => getPhaseForTime(t.time) === phase.id) || [];
        const phaseCompleted = progressData?.filter(p => 
          p.completed && phaseTasks.some(t => t.id === p.task_id)
        ).length || 0;
        return {
          phase: phase.id,
          rate: phaseTasks.length > 0 ? (phaseCompleted / phaseTasks.length) * 100 : 0,
        };
      });

      const sortedPhases = [...phaseStats].sort((a, b) => b.rate - a.rate);
      const topPhase = sortedPhases[0]?.rate > 0 ? sortedPhases[0].phase : null;
      const strugglePhase = sortedPhases[sortedPhases.length - 1]?.rate < 70 
        ? sortedPhases[sortedPhases.length - 1].phase 
        : null;

      setStats({
        totalBuffPoints,
        questsConquered,
        totalQuests,
        lessonsConquered,
        totalLessons,
        dailyStats,
        subjectTrends,
        reflections: (reflectionsData || []) as LessonReflection[],
        streakDays,
        topPhase,
        strugglePhase,
      });
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    } finally {
      setLoading(false);
    }
  }, [familyId, childId]);

  useEffect(() => {
    fetchWeeklyStats();
  }, [fetchWeeklyStats]);

  return { stats, loading, refetch: fetchWeeklyStats };
}
