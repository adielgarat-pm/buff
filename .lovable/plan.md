
# תוכנית הטמעה: מערכת וידאו הדרכת התקנה

## סקירה כללית
הטמעת מערכת הדרכת התקנה המבוססת על סרטון וידאו ב-3 נקודות מגע:
1. **מסך Welcome & Install** - למשתמשים חדשים/לא מחוברים
2. **אזור עזרה להורים** - בתוך ה-Parent Dashboard
3. **באנר תזכורת חכם** - כשמשתמשים בדפדפן במקום PWA

---

## רכיבים ליצירה

### 1. InstallVideoModal - קומפוננטה לנגן הוידאו
רכיב modal מודרני להצגת הסרטון עם:
- נגן וידאו מוטמע עם `autoplay muted` ופקדי play/pause/volume
- מסגרת נקייה ומודרנית
- כפתור סגירה

### 2. WelcomeSetupPage - מסך נחיתה ראשון
דף חדש (`/install`) שמוצג למשתמשים חדשים:

**תוכן המסך:**
- כותרת: "ברוכים הבאים ל-BUFF! בואו נתקין את האפליקציה"
- הסרטון כאלמנט מרכזי (45 שניות)
- כותרת משנה: "צפו בסרטון הקצר כדי לדעת איך להתקין"
- כפתור CTA בולט: "הבנתי, בואו נתחיל!" - מוביל ל-Auth
- רשימת 3 נקודות עיקריות מתחת לכפתור (סיכום שלבי ההתקנה)

**רשימת הסיכום:**
1. לחצו על כפתור השיתוף/תפריט
2. בחרו "הוסף למסך הבית"
3. לחצו "הוסף" וזהו!

### 3. ParentHelpSection - אזור עזרה בהגדרות ההורה
הוספת section חדש ב-ParentSettings:

**תוכן:**
- כותרת: "עזרה והתקנה"
- הסרטון זמין תמיד לצפייה
- כפתור "שלח מדריך התקנה לילד" עם אפשרויות:
  - שיתוף דרך WhatsApp
  - שיתוף דרך Email
  - העתקת לינק

### 4. BrowserDetectionBanner - באנר חכם
באנר קטן בראש המסך כשהאפליקציה רצה בדפדפן:

**לוגיקה:**
- בדיקה אם לא ב-PWA standalone mode
- הצגת באנר דיסקרטי עם טקסט: "להתקנה מהירה וגישה קלה, לחצו כאן"
- לחיצה פותחת mini-modal עם הסרטון

---

## שינויים בקבצים קיימים

### App.tsx
- הוספת route חדש: `/install` -> WelcomeSetupPage

### ParentSettings.tsx
- הוספת "עזרה והתקנה" section עם הסרטון וכפתורי שיתוף

### ChildView.tsx / ParentView.tsx
- הוספת BrowserDetectionBanner בראש העמוד

---

## קבצים חדשים

```text
src/
├── components/
│   ├── InstallVideoModal.tsx      // נגן הוידאו במודל
│   ├── BrowserDetectionBanner.tsx // באנר תזכורת PWA
│   └── ParentHelpSection.tsx      // אזור עזרה להורים
├── pages/
│   └── InstallGuide.tsx           // מסך Welcome & Install
```

---

## תרשים זרימת משתמש

```text
┌─────────────────────────────────────────────────────────────────┐
│                     משתמש חדש/לא מחובר                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      Landing Page (/)         │
              │   כפתור "התחל" מוביל ל-       │
              │        /install               │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   WelcomeSetupPage (/install) │
              │   - צפייה בסרטון (45 שניות)   │
              │   - סיכום שלבי ההתקנה          │
              │   - כפתור "הבנתי, בואו נתחיל" │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │        Auth Page (/auth)      │
              │      הרשמה/התחברות            │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   Dashboard (/dashboard)      │
              │  + BrowserDetectionBanner     │
              │    (אם לא מותקן כ-PWA)        │
              └───────────────────────────────┘
```

---

## פרטים טכניים

### העתקת קובץ הוידאו
```text
user-uploads://WhatsApp_Video_2026-01-31_at_11.19.03.mp4
                         ↓
public/videos/install-guide.mp4
```

הסרטון יועתק לתיקיית `public/videos/` כדי שיהיה נגיש ב-URL ישיר לשיתוף.

### נגן הוידאו
```typescript
<video
  src="/videos/install-guide.mp4"
  autoPlay
  muted
  playsInline
  controls
  className="rounded-xl w-full"
/>
```

### לוגיקת Browser Detection
```typescript
function isRunningInBrowser(): boolean {
  // בדיקה אם לא ב-PWA mode
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;
  
  return !isStandalone;
}
```

### פונקציית שיתוף
```typescript
const shareInstallGuide = (method: 'whatsapp' | 'email' | 'copy') => {
  const url = `${window.location.origin}/install`;
  const message = 'צפו בסרטון הקצר כדי להתקין את BUFF על הטלפון 📱';
  
  switch (method) {
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`);
      break;
    case 'email':
      window.open(`mailto:?subject=התקנת BUFF&body=${encodeURIComponent(message + '\n\n' + url)}`);
      break;
    case 'copy':
      navigator.clipboard.writeText(url);
      break;
  }
};
```

---

## UI/UX

### WelcomeSetupPage
- רקע כהה עם גרדיאנט עדין
- הסרטון במרכז עם מסגרת מעוגלת ונקייה
- כפתור CTA גדול ובולט בצבע accent
- רשימת הסיכום עם אייקונים

### BrowserDetectionBanner
- באנר דק בראש המסך
- צבע רקע עדין (primary/10)
- טקסט קצר וברור
- אייקון Download
- אפשרות לסגירה (dismiss ל-24 שעות)

### ParentHelpSection
- כרטיס עם אייקון HelpCircle
- הסרטון מוטמע בתוך הכרטיס
- כפתורי שיתוף עם אייקונים (WhatsApp, Email, Copy)
