import { useMemo } from 'react';
import { useFamilyMembers } from './useFamilyMembers';

// Personalized templates with {names} placeholder
const personalizedTemplates = [
  "הופכים את הבוקר של {names} לסיפור הצלחה. הוסיפו את Buff למסך הבית.",
  "כי ל-{names} מגיע להתחיל את היום בחיוך. שימו את Buff בקדמת המסך.",
  "מוכנים לבוקר רגוע עם {names}? התקינו את האפליקציה לגישה מהירה.",
  "הגשר של {names} לעצמאות מתחיל כאן. הוסיפו אותנו למסך הבית.",
];

// Generic templates for families without children
const genericTemplates = [
  "הופכים את הבוקר לרגוע בלחיצה אחת. הוסיפו את Buff למסך הבית.",
  "בוקר של הצלחות מתחיל כאן. שימו את הכלים שלכם במרכז המסך.",
  "אל תחפשו אותנו בדפדפן בכל בוקר. Buff מחכה לכם על מסך הבית.",
  "גישה מהירה לבוקר שפוי. התקינו את האפליקציה עכשיו.",
];

/**
 * Formats children names for Hebrew display
 * Single child: "איתי"
 * Two children: "איתי ואמי"
 * Three or more: "איתי, אמי ודני"
 */
function formatChildrenNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} ו${names[1]}`;
  
  // For 3+, join all but last with commas, then add "ו" before last
  const allButLast = names.slice(0, -1).join(', ');
  const last = names[names.length - 1];
  return `${allButLast} ו${last}`;
}

/**
 * Hook that returns a personalized or generic install prompt message
 * - Selects randomly on mount (stable during session via useMemo)
 * - Personalizes with children's names if available
 */
export function useInstallPromptMessage(): {
  message: string;
  isPersonalized: boolean;
  childrenCount: number;
} {
  const { children, loading } = useFamilyMembers();

  // Use useMemo with empty deps to select index once per mount
  // This ensures the message stays stable during the session
  const randomIndex = useMemo(() => ({
    personalized: Math.floor(Math.random() * personalizedTemplates.length),
    generic: Math.floor(Math.random() * genericTemplates.length),
  }), []);

  const result = useMemo(() => {
    // While loading, return a generic message
    if (loading) {
      return {
        message: genericTemplates[randomIndex.generic],
        isPersonalized: false,
        childrenCount: 0,
      };
    }

    // Check if we have children
    const childNames = children.map(c => c.displayName);
    
    if (childNames.length > 0) {
      // Personalized branch
      const template = personalizedTemplates[randomIndex.personalized];
      const formattedNames = formatChildrenNames(childNames);
      return {
        message: template.replace('{names}', formattedNames),
        isPersonalized: true,
        childrenCount: childNames.length,
      };
    }

    // Generic branch
    return {
      message: genericTemplates[randomIndex.generic],
      isPersonalized: false,
      childrenCount: 0,
    };
  }, [children, loading, randomIndex]);

  return result;
}
