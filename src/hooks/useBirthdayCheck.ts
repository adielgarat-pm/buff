import { useState, useEffect, useCallback } from 'react';

interface UseBirthdayCheckOptions {
  birthDate: string | null | undefined;
  childName?: string;
}

export function useBirthdayCheck({ birthDate, childName }: UseBirthdayCheckOptions) {
  const [isBirthday, setIsBirthday] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    if (!birthDate) {
      setIsBirthday(false);
      return;
    }

    const today = new Date();
    const birth = new Date(birthDate);
    
    // Check if today is the birthday (same day and month)
    const isTodayBirthday = 
      today.getDate() === birth.getDate() && 
      today.getMonth() === birth.getMonth();

    setIsBirthday(isTodayBirthday);

    // Calculate current age
    if (isTodayBirthday) {
      const currentAge = today.getFullYear() - birth.getFullYear();
      setAge(currentAge);
    }

    // Check if we've already shown the celebration today
    if (isTodayBirthday) {
      const storageKey = `birthday_celebrated_${birthDate}_${today.getFullYear()}`;
      const alreadyCelebrated = localStorage.getItem(storageKey);
      
      if (!alreadyCelebrated) {
        // Show celebration after a short delay
        const timer = setTimeout(() => {
          setShowCelebration(true);
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [birthDate]);

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
    
    // Mark as celebrated for today
    if (birthDate) {
      const today = new Date();
      const storageKey = `birthday_celebrated_${birthDate}_${today.getFullYear()}`;
      localStorage.setItem(storageKey, 'true');
    }
  }, [birthDate]);

  return {
    isBirthday,
    showCelebration,
    dismissCelebration,
    age,
  };
}
