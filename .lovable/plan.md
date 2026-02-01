
# תיקון מסך שלב 2 באונבורדינג - תחומי מיקוד

## הבעיות שזוהו

### בעיה 1: התחומים נחתכים ולא נראים במלואם
- הדיאלוג ב-`ParentView.tsx` מגביל את הגובה ל-`max-h-[95vh]` עם `overflow-hidden`
- הקונטיינר ב-`ParentOnboarding.tsx` משתמש ב-`overflow-hidden` בשורה 70
- שילוב ההגבלות גורם לחיתוך של הכרטיסיות בתחתית

### בעיה 2: לחיצה על תחום לא מעבירה לשלב 3
- הכפתור "המשך" מושבת (`disabled`) עד שנבחר תחום
- כשהכרטיסיות חתוכות, המשתמש לא יכול לראות את כפתור ההמשך
- הלוגיקה עצמה תקינה, אבל הממשק לא מציג נכון את האלמנטים

---

## פתרון מוצע

### שלב 1: תיקון Layout בדיאלוג האב
**קובץ:** `src/components/ParentView.tsx`

שינוי ה-DialogContent להיות גמיש יותר:
- הסרת `overflow-hidden` מהדיאלוג
- החלפת `max-h-[95vh]` ב-`h-[85vh]` קבוע שמבטיח מספיק מקום

### שלב 2: תיקון הקונטיינר הראשי
**קובץ:** `src/components/onboarding/ParentOnboarding.tsx`

- שינוי מ-`min-h-[100dvh]` ל-`h-full` כדי להתאים לדיאלוג
- שינוי ה-wrapper של התוכן מ-`overflow-hidden` ל-`overflow-y-auto min-h-0`

### שלב 3: ייעול הכרטיסיות בשלב 2
**קובץ:** `src/components/onboarding/steps/Step2FocusArea.tsx`

- הקטנת הריווח בין הכרטיסיות
- הקטנת ה-padding בכרטיסיות
- הקטנת גודל האייקון והטקסט בכותרת

### שלב 4: הקטנת הכרטיסיות עצמן
**קובץ:** `src/components/onboarding/OnboardingCard.tsx`

- הקטנת ה-padding מ-`p-4` ל-`p-3`
- הקטנת גודל האימוג'י

---

## סיכום השינויים

```text
+------------------------------------------+
|         DialogContent (ParentView)       |
|  h-[85vh] במקום max-h-[95vh]              |
|  הסרת overflow-hidden                    |
+------------------------------------------+
              |
              v
+------------------------------------------+
|        ParentOnboarding Container        |
|  h-full במקום min-h-[100dvh]             |
+------------------------------------------+
              |
              v
+------------------------------------------+
|         Step Content Wrapper             |
|  overflow-y-auto min-h-0                 |
|  במקום overflow-hidden                   |
+------------------------------------------+
              |
              v
+------------------------------------------+
|           Step2FocusArea                 |
|  ריווחים מוקטנים                          |
|  כרטיסיות קומפקטיות                       |
+------------------------------------------+
```

### קבצים לעריכה:
1. `src/components/ParentView.tsx` - תיקון הדיאלוג
2. `src/components/onboarding/ParentOnboarding.tsx` - תיקון הקונטיינר
3. `src/components/onboarding/steps/Step2FocusArea.tsx` - ייעול הריווחים
4. `src/components/onboarding/OnboardingCard.tsx` - הקטנת הכרטיסיות
