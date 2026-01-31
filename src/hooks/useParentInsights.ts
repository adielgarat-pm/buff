import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Phase, getPhaseForTime, PHASES } from '@/types/phase';

export interface TaskInsight {
  taskId: string;
  taskTitle: string;
  phase: Phase;
  completionRate: number;
  totalDays: number;
  completedDays: number;
}

export interface PhaseInsight {
  phase: Phase;
  phaseLabel: string;
  phaseIcon: string;
  avgCompletionRate: number;
  taskCount: number;
  lowPerformingTasks: TaskInsight[];
}

export interface InsightCard {
  id: string;
  type: 'phase' | 'task' | 'general';
  severity: 'info' | 'suggestion' | 'attention';
  title: string;
  titleHe: string;
  description: string;
  descriptionHe: string;
  suggestion: string;
  suggestionHe: string;
  strategyType?: 'environmental' | 'task-based' | 'self-regulation';
  icon: string;
  relatedPhase?: Phase;
  completionRate?: number;
}

const INSIGHT_TEMPLATES: Record<string, Omit<InsightCard, 'id' | 'completionRate'>> = {
  'morning-low': {
    type: 'phase',
    severity: 'suggestion',
    title: 'Morning Routine Challenge',
    titleHe: 'אתגר בשגרת הבוקר',
    description: 'Morning tasks have been challenging lately. This is very common with ADHD - mornings require a lot of transitions.',
    descriptionHe: 'משימות הבוקר היו מאתגרות לאחרונה. זה נפוץ מאוד עם ADHD - בקרים דורשים הרבה מעברים.',
    suggestion: 'Try an "Environmental Strategy": Pick out clothes and pack the bag together the night before. Small preparations reduce morning decision fatigue.',
    suggestionHe: 'נסו "אסטרטגיה סביבתית": הכינו בגדים ותיק יחד בערב שלפני. הכנות קטנות מפחיתות עייפות החלטות בבוקר.',
    strategyType: 'environmental',
    icon: '🌅',
    relatedPhase: 'morning',
  },
  'school-low': {
    type: 'phase',
    severity: 'suggestion',
    title: 'School Day Focus',
    titleHe: 'ריכוז ביום הלימודים',
    description: 'School day completion is lower than usual. Sustained attention during long school hours is genuinely hard.',
    descriptionHe: 'השלמת יום הלימודים נמוכה מהרגיל. קשב מתמשך במהלך שעות לימוד ארוכות זה באמת קשה.',
    suggestion: 'Ask your child: "Which lesson feels hardest? What would make it 10% easier?" Sometimes a small fidget tool or movement breaks help.',
    suggestionHe: 'שאלו את הילד: "איזה שיעור מרגיש הכי קשה? מה יכול להקל ב-10%?" לפעמים כלי פידג\'ט קטן או הפסקות תנועה עוזרים.',
    strategyType: 'self-regulation',
    icon: '📚',
    relatedPhase: 'school',
  },
  'afternoon-low': {
    type: 'phase',
    severity: 'suggestion',
    title: 'Afternoon Transition',
    titleHe: 'מעבר אחר הצהריים',
    description: 'Afternoons show lower task completion. After a full school day, executive function is often depleted.',
    descriptionHe: 'אחר הצהריים מראים השלמת משימות נמוכה יותר. אחרי יום לימודים מלא, התפקוד הניהולי מותש.',
    suggestion: 'Build in a "Recharge Window" before homework. 20-30 minutes of physical activity or a snack can restore focus capacity.',
    suggestionHe: 'הכניסו "חלון טעינה" לפני שיעורי בית. 20-30 דקות פעילות גופנית או חטיף יכולים לשחזר את יכולת הריכוז.',
    strategyType: 'self-regulation',
    icon: '📖',
    relatedPhase: 'afternoon',
  },
  'evening-low': {
    type: 'phase',
    severity: 'suggestion',
    title: 'Evening Wind-Down',
    titleHe: 'רגיעת הערב',
    description: 'Evening routines are showing some struggles. Transitioning to bedtime can be hard when the brain is still buzzing.',
    descriptionHe: 'שגרת הערב מראה כמה קשיים. מעבר לשינה יכול להיות קשה כשהמוח עדיין פעיל.',
    suggestion: 'Create a predictable "Shutdown Ritual": Same order every night (shower → meds → relaxation). Predictability reduces resistance.',
    suggestionHe: 'צרו "טקס סגירה" צפוי: אותו סדר כל ערב (מקלחת ← תרופות ← הרגעה). צפיות מפחיתה התנגדות.',
    strategyType: 'environmental',
    icon: '🌙',
    relatedPhase: 'evening',
  },
  'self-care-low': {
    type: 'task',
    severity: 'suggestion',
    title: 'Self-Care Reminder',
    titleHe: 'תזכורת לטיפול עצמי',
    description: 'Self-care tasks like medication, hygiene, or nutrition have been challenging.',
    descriptionHe: 'משימות טיפול עצמי כמו תרופות, היגיינה או תזונה היו מאתגרות.',
    suggestion: 'Link self-care to existing habits. Visual cues and timers can help build consistency.',
    suggestionHe: 'קשרו טיפול עצמי להרגלים קיימים. רמזים חזותיים וטיימרים יכולים לעזור לבנות עקביות.',
    strategyType: 'environmental',
    icon: '✨',
  },
  'learning-low': {
    type: 'task',
    severity: 'suggestion',
    title: 'Learning Initiation Challenge',
    titleHe: 'אתגר התחלת למידה',
    description: 'Starting homework or study sessions has been difficult. Task initiation is one of the biggest ADHD challenges.',
    descriptionHe: 'התחלת שיעורי בית או למידה הייתה קשה. התחלת משימות היא אחד האתגרים הגדולים של ADHD.',
    suggestion: 'Ask: "What\'s one tiny 5-minute step we can start with?" Breaking the first barrier makes everything easier.',
    suggestionHe: 'שאלו: "מה צעד קטן של 5 דקות שאפשר להתחיל איתו?" לשבור את המחסום הראשון מקל על הכל.',
    strategyType: 'task-based',
    icon: '📚',
  },
  'organization-low': {
    type: 'task',
    severity: 'suggestion',
    title: 'Organization Support',
    titleHe: 'תמיכה בהתארגנות',
    description: 'Organization tasks like packing bags or preparing for the next day need support.',
    descriptionHe: 'משימות התארגנות כמו אריזת תיק או הכנה ליום למחרת צריכות תמיכה.',
    suggestion: 'Create visual checklists. A dedicated "launch pad" for school items reduces morning stress.',
    suggestionHe: 'צרו רשימות ויזואליות. "משטח שיגור" ייעודי לציוד בית ספר מפחית לחץ בבוקר.',
    strategyType: 'environmental',
    icon: '📅',
  },
  'positive-streak': {
    type: 'general',
    severity: 'info',
    title: 'Great Progress! 🎉',
    titleHe: 'התקדמות מצוינת! 🎉',
    description: 'Completion rates have been strong this week. The strategies are working!',
    descriptionHe: 'שיעורי ההשלמה היו חזקים השבוע. האסטרטגיות עובדות!',
    suggestion: 'Celebrate this win together! Ask what\'s been helping and reinforce those patterns.',
    suggestionHe: 'חגגו את ההצלחה יחד! שאלו מה עזר וחזקו את הדפוסים האלה.',
    icon: '⭐',
  },
};

export function useParentInsights(childId: string | null) {
  const { familyId } = useAuth();
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [phaseInsights, setPhaseInsights] = useState<PhaseInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const analyzeCompletionPatterns = useCallback(async () => {
    if (!familyId || !childId) {
      setLoading(false);
      return;
    }

    try {
      // Get last 7 days of data
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      // Fetch tasks for this child
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .or(`assigned_to.is.null,assigned_to.eq.${childId}`);

      if (!tasksData || tasksData.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch progress for last 7 days
      const { data: progressData } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('family_id', familyId)
        .in('date', dates)
        .or(`child_id.is.null,child_id.eq.${childId}`);

      // Analyze task completion rates
      const taskInsights: TaskInsight[] = tasksData.map(task => {
        const taskProgress = progressData?.filter(p => p.task_id === task.id) || [];
        const completedDays = taskProgress.filter(p => p.completed).length;
        const totalDays = Math.min(dates.length, 5); // Exclude weekends for school tasks
        
        return {
          taskId: task.id,
          taskTitle: task.title,
          phase: getPhaseForTime(task.time),
          completionRate: totalDays > 0 ? (completedDays / totalDays) * 100 : 0,
          totalDays,
          completedDays,
        };
      });

      // Group by phase
      const phaseData: PhaseInsight[] = PHASES.map(phase => {
        const phaseTasks = taskInsights.filter(t => t.phase === phase.id);
        const avgRate = phaseTasks.length > 0
          ? phaseTasks.reduce((sum, t) => sum + t.completionRate, 0) / phaseTasks.length
          : 100;
        
        return {
          phase: phase.id,
          phaseLabel: phase.label,
          phaseIcon: phase.icon,
          avgCompletionRate: avgRate,
          taskCount: phaseTasks.length,
          lowPerformingTasks: phaseTasks.filter(t => t.completionRate < 50),
        };
      });

      setPhaseInsights(phaseData);

      // Generate insight cards
      const generatedInsights: InsightCard[] = [];

      // Check each phase
      phaseData.forEach(phase => {
        if (phase.avgCompletionRate < 50 && phase.taskCount > 0) {
          const templateKey = `${phase.phase}-low`;
          const template = INSIGHT_TEMPLATES[templateKey];
          if (template) {
            generatedInsights.push({
              ...template,
              id: `insight-${phase.phase}`,
              completionRate: Math.round(phase.avgCompletionRate),
            });
          }
        }
      });

      // Check specific task categories
      const medicationTasks = taskInsights.filter(t => 
        t.taskTitle.toLowerCase().includes('med') || t.taskTitle.toLowerCase().includes('תרופ')
      );
      if (medicationTasks.some(t => t.completionRate < 60)) {
        generatedInsights.push({
          ...INSIGHT_TEMPLATES['medication-low'],
          id: 'insight-medication',
          completionRate: Math.round(
            medicationTasks.reduce((sum, t) => sum + t.completionRate, 0) / medicationTasks.length
          ),
        });
      }

      const hygieneTasks = taskInsights.filter(t => 
        t.taskTitle.toLowerCase().includes('shower') || 
        t.taskTitle.toLowerCase().includes('מקלחת') ||
        t.taskTitle.toLowerCase().includes('hygiene')
      );
      if (hygieneTasks.some(t => t.completionRate < 50)) {
        generatedInsights.push({
          ...INSIGHT_TEMPLATES['hygiene-low'],
          id: 'insight-hygiene',
          completionRate: Math.round(
            hygieneTasks.reduce((sum, t) => sum + t.completionRate, 0) / hygieneTasks.length
          ),
        });
      }

      const homeworkTasks = taskInsights.filter(t => 
        t.taskTitle.toLowerCase().includes('homework') || 
        t.taskTitle.toLowerCase().includes('study') ||
        t.taskTitle.toLowerCase().includes('שיעורי בית') ||
        t.taskTitle.toLowerCase().includes('למידה')
      );
      if (homeworkTasks.some(t => t.completionRate < 50)) {
        generatedInsights.push({
          ...INSIGHT_TEMPLATES['homework-low'],
          id: 'insight-homework',
          completionRate: Math.round(
            homeworkTasks.reduce((sum, t) => sum + t.completionRate, 0) / homeworkTasks.length
          ),
        });
      }

      // If everything is going well, add positive insight
      const overallRate = taskInsights.length > 0
        ? taskInsights.reduce((sum, t) => sum + t.completionRate, 0) / taskInsights.length
        : 0;
      
      if (overallRate >= 70 && generatedInsights.length === 0) {
        generatedInsights.push({
          ...INSIGHT_TEMPLATES['positive-streak'],
          id: 'insight-positive',
          completionRate: Math.round(overallRate),
        });
      }

      // Limit to 4 most relevant insights
      setInsights(generatedInsights.slice(0, 4));
    } catch (error) {
      console.error('Error analyzing insights:', error);
    } finally {
      setLoading(false);
    }
  }, [familyId, childId]);

  useEffect(() => {
    analyzeCompletionPatterns();
  }, [analyzeCompletionPatterns]);

  return { insights, phaseInsights, loading, refetch: analyzeCompletionPatterns };
}
