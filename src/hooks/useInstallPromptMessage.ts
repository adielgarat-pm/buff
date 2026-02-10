import { useMemo } from 'react';
import { useFamilyMembers } from './useFamilyMembers';
import { useLanguage } from '@/contexts/LanguageContext';

export type MessageType = 'personalized' | 'generic';

/**
 * Formats children names for display
 */
function formatChildrenNames(names: string[], isRTL: boolean): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  const conjunction = isRTL ? ' ו' : ' and ';
  if (names.length === 2) return `${names[0]}${conjunction}${names[1]}`;
  
  const allButLast = names.slice(0, -1).join(', ');
  const last = names[names.length - 1];
  return isRTL ? `${allButLast} ו${last}` : `${allButLast}, and ${last}`;
}

export function useInstallPromptMessage(): {
  message: string;
  isPersonalized: boolean;
  messageType: MessageType;
  templateIndex: number;
  childrenCount: number;
} {
  const { children, loading } = useFamilyMembers();
  const { t, isRTL } = useLanguage();

  const randomIndex = useMemo(() => ({
    personalized: Math.floor(Math.random() * 4),
    generic: Math.floor(Math.random() * 4),
  }), []);

  const result = useMemo(() => {
    if (loading) {
      return {
        message: t(`install.generic.${randomIndex.generic}`),
        isPersonalized: false,
        messageType: 'generic' as MessageType,
        templateIndex: randomIndex.generic,
        childrenCount: 0,
      };
    }

    const childNames = children.map(c => c.displayName);
    
    if (childNames.length > 0) {
      const formattedNames = formatChildrenNames(childNames, isRTL);
      const message = t(`install.personalized.${randomIndex.personalized}`).replace('{names}', formattedNames);
      return {
        message,
        isPersonalized: true,
        messageType: 'personalized' as MessageType,
        templateIndex: randomIndex.personalized,
        childrenCount: childNames.length,
      };
    }

    return {
      message: t(`install.generic.${randomIndex.generic}`),
      isPersonalized: false,
      messageType: 'generic' as MessageType,
      templateIndex: randomIndex.generic,
      childrenCount: 0,
    };
  }, [children, loading, randomIndex, t, isRTL]);

  return result;
}
