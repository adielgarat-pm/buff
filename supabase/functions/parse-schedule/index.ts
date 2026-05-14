import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParsedLesson {
  day: string;
  start_time: string;
  end_time: string | null;
  lesson_name: string | null;
  auto_time?: boolean; // Flag for auto-filled time
  row_index?: number; // 1-based lesson number (1-10)
}

interface ParsedTask {
  title: string;
  time: string;
  day: string;
  category: string;
  credits: number;
  autoTime?: boolean;
  missingSubject?: boolean;
  lessonNumber?: number; // Lesson slot number (1-10)
  teacher?: string | null; // Extracted teacher name
  adhdCategory?: string; // ADHD coaching category: Core, Physical, Creative, Social
}

// Hebrew day name mapping (RTL aware)
const HEBREW_DAY_MAP: Record<string, string> = {
  'יום ראשון': 'sunday',
  'ראשון': 'sunday',
  'א': 'sunday',
  "א'": 'sunday',
  'יום א': 'sunday',
  'יום שני': 'monday',
  'שני': 'monday',
  'ב': 'monday',
  "ב'": 'monday',
  'יום ב': 'monday',
  'יום שלישי': 'tuesday',
  'שלישי': 'tuesday',
  'ג': 'tuesday',
  "ג'": 'tuesday',
  'יום ג': 'tuesday',
  'יום רביעי': 'wednesday',
  'רביעי': 'wednesday',
  'ד': 'wednesday',
  "ד'": 'wednesday',
  'יום ד': 'wednesday',
  'יום חמישי': 'thursday',
  'חמישי': 'thursday',
  'ה': 'thursday',
  "ה'": 'thursday',
  'יום ה': 'thursday',
  'יום שישי': 'friday',
  'שישי': 'friday',
  'ו': 'friday',
  "ו'": 'friday',
  'יום ו': 'friday',
};

// Normalize Hebrew day to English lowercase
function normalizeDay(day: string): string {
  if (!day) return 'sunday';
  const trimmed = day.trim();
  
  // Check Hebrew mapping first
  const mapped = HEBREW_DAY_MAP[trimmed];
  if (mapped) return mapped;
  
  // Check English days
  const lower = trimmed.toLowerCase();
  if (['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(lower)) {
    return lower;
  }
  
  // Partial match for Hebrew
  for (const [hebrew, english] of Object.entries(HEBREW_DAY_MAP)) {
    if (trimmed.includes(hebrew) || hebrew.includes(trimmed)) {
      return english;
    }
  }
  
  return 'sunday';
}

// Validate and normalize time format (HH:MM)
function normalizeTime(time: string | null | undefined): string | null {
  if (!time) return null;
  
  const trimmed = time.trim();
  
  // Match HH:MM or H:MM patterns
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }
  
  // Try to extract time from string like "8:00" or "08:00"
  const extracted = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (extracted) {
    const hours = parseInt(extracted[1], 10);
    const minutes = parseInt(extracted[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }
  
  return null;
}

// Generate default time using "Buff Standard" algorithm
// Supports up to 10 lessons per day
function generateDefaultTime(lessonIndex: number): string {
  // Cap at lesson 10 (index 9) to prevent runaway times
  const cappedIndex = Math.min(lessonIndex, 9);
  const LESSON_DURATION = 50;
  const BREAK_DURATION = 20;
  
  let currentMinutes = 8 * 60; // Start at 08:00
  
  for (let i = 0; i < cappedIndex; i++) {
    currentMinutes += LESSON_DURATION;
    const lessonNumber = i + 1;
    if (lessonNumber % 2 === 0) {
      currentMinutes += BREAK_DURATION;
    }
  }
  
  const hours = Math.floor(currentMinutes / 60);
  const mins = currentMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Common Hebrew school subjects for teacher name detection
const COMMON_SUBJECTS = new Set([
  'מתמטיקה', 'חשבון', 'אנגלית', 'עברית', 'מדעים', 'היסטוריה', 'גאוגרפיה',
  'מחשבים', 'אמנות', 'ציור', 'מוזיקה', 'תנ"ך', 'ספרות', 'חברה', 'שעת חברה',
  'חנ"ג', 'חינוך גופני', 'ספורט', 'טכנולוגיה', 'מולדת', 'תורה', 'משנה',
  'גמרא', 'פרשת שבוע', 'פרשה', 'הלכה', 'תפילה', 'עברית שפה', 'הבעה',
  'כתיבה', 'קריאה', 'חשבון מספרים', 'גיאומטריה', 'פיזיקה', 'כימיה', 'ביולוגיה',
  'אזרחות', 'סוציולוגיה', 'פילוסופיה', 'כלכלה', 'משפטים', 'פסיכולוגיה',
  'ערבית', 'צרפתית', 'רוסית', 'ספרדית', 'סינית', 'יפנית',
  'math', 'english', 'hebrew', 'science', 'history', 'geography', 'art', 'music', 'pe',
  'תורת הארץ', 'מורשת', 'ידיעת הארץ', 'חקלאות', 'רובוטיקה', 'דרמה', 'תיאטרון',
  // Additional subjects
  'קונג פו', 'כדורגל', 'כדורסל', 'שחייה', 'התעמלות', 'יוגה',
  'מדעי המחשב', 'תכנות', 'רובוטיקה',
]);

// Day header strings to filter out (Header Guard)
const DAY_HEADERS = new Set([
  'יום ראשון', 'ראשון', 'א', "א'", 'יום א', 'sunday', 'sun',
  'יום שני', 'שני', 'ב', "ב'", 'יום ב', 'monday', 'mon',
  'יום שלישי', 'שלישי', 'ג', "ג'", 'יום ג', 'tuesday', 'tue',
  'יום רביעי', 'רביעי', 'ד', "ד'", 'יום ד', 'wednesday', 'wed',
  'יום חמישי', 'חמישי', 'ה', "ה'", 'יום ה', 'thursday', 'thu',
  'יום שישי', 'שישי', 'ו', "ו'", 'יום ו', 'friday', 'fri',
]);

// ADHD Category mapping for school subjects
type ADHDCategory = 'Core' | 'Physical' | 'Creative' | 'Social' | 'school';

const SUBJECT_CATEGORIES: Record<string, ADHDCategory> = {
  // Core subjects (Math, Language, Science)
  'מתמטיקה': 'Core', 'חשבון': 'Core', 'math': 'Core', 'mathematics': 'Core',
  'אנגלית': 'Core', 'english': 'Core',
  'עברית': 'Core', 'hebrew': 'Core', 'עברית שפה': 'Core', 'הבעה': 'Core', 'כתיבה': 'Core', 'קריאה': 'Core',
  'מדעים': 'Core', 'science': 'Core', 'פיזיקה': 'Core', 'כימיה': 'Core', 'ביולוגיה': 'Core',
  'היסטוריה': 'Core', 'history': 'Core',
  'גאוגרפיה': 'Core', 'geography': 'Core',
  'תנ"ך': 'Core', 'ספרות': 'Core', 'literature': 'Core',
  'גיאומטריה': 'Core', 'אזרחות': 'Core',
  'ערבית': 'Core', 'צרפתית': 'Core', 'רוסית': 'Core', 'ספרדית': 'Core',
  
  // Physical subjects (PE, Sports)
  'חנ"ג': 'Physical', 'חינוך גופני': 'Physical', 'pe': 'Physical', 'ספורט': 'Physical', 'sport': 'Physical',
  'קונג פו': 'Physical', 'כדורגל': 'Physical', 'כדורסל': 'Physical', 'שחייה': 'Physical',
  'התעמלות': 'Physical', 'יוגה': 'Physical',
  
  // Creative/Extracurricular (Music, Art, Computers)
  'מוזיקה': 'Creative', 'music': 'Creative',
  'אמנות': 'Creative', 'ציור': 'Creative', 'art': 'Creative',
  'מחשבים': 'Creative', 'computer': 'Creative', 'מדעי המחשב': 'Creative', 'תכנות': 'Creative', 'רובוטיקה': 'Creative',
  'טכנולוגיה': 'Creative', 'דרמה': 'Creative', 'תיאטרון': 'Creative',
  
  // Social/Wellbeing (Education, Moreshet)
  'חברה': 'Social', 'שעת חברה': 'Social',
  'חינוך': 'Social', 'מורשת': 'Social', 'תורה': 'Social', 'משנה': 'Social', 'גמרא': 'Social',
  'פרשת שבוע': 'Social', 'פרשה': 'Social', 'הלכה': 'Social', 'תפילה': 'Social',
  'תורת הארץ': 'Social', 'ידיעת הארץ': 'Social', 'מולדת': 'Social',
};

// Check if text looks like a teacher name (not a common subject)
function isLikelyTeacherName(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  
  // Skip empty or too short
  if (trimmed.length < 2) return false;
  
  // If it's a known subject, it's not a teacher name
  const lower = trimmed.toLowerCase();
  if (COMMON_SUBJECTS.has(trimmed) || COMMON_SUBJECTS.has(lower)) return false;
  
  // Teacher names are usually 2-3 words with Hebrew name patterns
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  
  // Check if it looks like a name (Hebrew names often have 2-3 parts)
  // Names usually don't contain numbers, special chars, or common subject keywords
  const hasNumbers = /\d/.test(trimmed);
  const hasSpecialSubjectChars = /["']/.test(trimmed) && (trimmed.includes('חנ"ג') || trimmed.includes('תנ"ך'));
  
  if (hasNumbers || hasSpecialSubjectChars) return false;
  
  // Common Hebrew name patterns (first name + last name)
  // Names are usually short words (2-8 chars each)
  const allWordsAreName = words.every(w => w.length >= 2 && w.length <= 12);
  
  return allWordsAreName;
}

// HEADER GUARD: Remove day header if it appears at the start of cell content
function applyHeaderGuard(text: string): string {
  if (!text) return text;
  
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return text;
  
  // Check if the first line is a day header
  const firstLine = lines[0].toLowerCase();
  if (DAY_HEADERS.has(firstLine) || DAY_HEADERS.has(lines[0])) {
    // Remove the header and return the rest
    return lines.slice(1).join('\n').trim();
  }
  
  return text.trim();
}

// Extract subject and teacher from cell content
interface ExtractedContent {
  subject: string;
  teacher: string | null;
}

function extractSubjectAndTeacher(rawText: string): ExtractedContent {
  if (!rawText) return { subject: '', teacher: null };
  
  // Apply header guard first
  const text = applyHeaderGuard(rawText);
  if (!text) return { subject: '', teacher: null };
  
  // Split by newlines or multiple spaces (common OCR pattern for stacked text)
  const parts = text.split(/[\n\r]+|\s{2,}/).map(p => p.trim()).filter(Boolean);
  
  if (parts.length === 0) return { subject: '', teacher: null };
  if (parts.length === 1) return { subject: parts[0], teacher: null };
  
  // Find which part is the subject and which is the teacher
  let subject = '';
  let teacher: string | null = null;
  
  for (const part of parts) {
    if (COMMON_SUBJECTS.has(part) || COMMON_SUBJECTS.has(part.toLowerCase())) {
      subject = part;
    } else if (isLikelyTeacherName(part)) {
      teacher = part;
    } else if (!subject) {
      // First non-teacher part is likely the subject (visual hierarchy: top/bold = subject)
      subject = part;
    }
  }
  
  // Handle multiple teachers (e.g., 'Galia/Intisar')
  if (teacher && teacher.includes('/')) {
    // Keep the slash format as-is for display
  }
  
  return { subject: subject || parts[0], teacher };
}

// Merge subject and teacher name if they appear together
function mergeSubjectAndTeacher(lessonName: string): string {
  if (!lessonName) return lessonName;
  
  const { subject, teacher } = extractSubjectAndTeacher(lessonName);
  
  // If we found both subject and teacher, merge them
  if (subject && teacher) {
    return `${subject} (${teacher})`;
  }
  
  return subject || lessonName.trim();
}

// Determine ADHD-friendly category based on subject
function guessCategory(title: string): string {
  if (!title) return 'school';
  
  const lower = title.toLowerCase();
  
  // Check medication/hygiene/nutrition first (for task-type detection)
  if (lower.includes('med') || lower.includes('pill') || lower.includes('tablet') || lower.includes('תרופ')) {
    return 'medication';
  }
  if (lower.includes('shower') || lower.includes('brush') || lower.includes('wash') || lower.includes('bath') || 
      lower.includes('מקלחת') || lower.includes('צחצוח') || lower.includes('רחצ')) {
    return 'hygiene';
  }
  if (lower.includes('breakfast') || lower.includes('lunch') || lower.includes('dinner') || 
      lower.includes('snack') || lower.includes('eat') || lower.includes('food') ||
      lower.includes('ארוחת') || lower.includes('אוכל')) {
    return 'nutrition';
  }
  
  // Check ADHD subject categories
  for (const [keyword, category] of Object.entries(SUBJECT_CATEGORIES)) {
    if (lower.includes(keyword.toLowerCase()) || title.includes(keyword)) {
      // Map ADHD categories to storage format (we store as 'school' but include context)
      return 'school'; // Keep school for DB compatibility, frontend can use ADHD category
    }
  }
  
  return 'school';
}

// Get ADHD-specific category for coaching logic
function getADHDCategory(title: string): ADHDCategory {
  if (!title) return 'school';
  
  const lower = title.toLowerCase();
  
  for (const [keyword, category] of Object.entries(SUBJECT_CATEGORIES)) {
    if (lower.includes(keyword.toLowerCase()) || title.includes(keyword)) {
      return category;
    }
  }
  
  return 'school';
}

// Determine credits based on estimated effort
function guessCredits(title: string): number {
  const lower = title.toLowerCase();
  
  // Higher effort tasks
  if (lower.includes('homework') || lower.includes('study') || lower.includes('test') || 
      lower.includes('exam') || lower.includes('שיעורי בית') || lower.includes('מבחן')) {
    return 30;
  }
  
  // Core subjects get more points (require more focus for ADHD)
  const adhdCategory = getADHDCategory(title);
  if (adhdCategory === 'Core') {
    return 15;
  }
  
  // Physical activities - good for ADHD, moderate points
  if (adhdCategory === 'Physical') {
    return 10;
  }
  
  // Creative activities
  if (adhdCategory === 'Creative') {
    return 10;
  }
  
  // Social/wellbeing
  if (adhdCategory === 'Social') {
    return 10;
  }
  
  // Daily routine tasks
  if (lower.includes('shower') || lower.includes('breakfast') || lower.includes('dinner') ||
      lower.includes('מקלחת') || lower.includes('ארוחת')) {
    return 20;
  }
  if (lower.includes('meds') || lower.includes('pill') || lower.includes('brush') ||
      lower.includes('תרופ') || lower.includes('צחצוח')) {
    return 5;
  }
  
  return 10;
}

// CLEANUP & DEDUPLICATION using LESSON NUMBER as unique identifier
// Rule 1: Only one entry per (day, lesson_number) - keep the one with a subject
// Rule 2: Purge rows with empty/null/whitespace subjects AFTER deduplication
// Rule 3: Re-apply Buff Standard times based on lesson_number
// Rule 4: Max 10 lessons per day
function cleanupAndDeduplicateLessons(lessons: ParsedLesson[]): ParsedLesson[] {
  // Group by day
  const byDay: Record<string, ParsedLesson[]> = {};
  lessons.forEach(l => {
    if (!byDay[l.day]) byDay[l.day] = [];
    byDay[l.day].push(l);
  });
  
  const cleanedLessons: ParsedLesson[] = [];
  
  Object.entries(byDay).forEach(([day, dayLessons]) => {
    // Deduplicate by lesson_number (row_index)
    // If multiple entries share the same slot, keep the one with a subject
    const slotMap: Record<number, ParsedLesson & { row_index?: number }> = {};
    
    dayLessons.forEach((lesson, index) => {
      // Use row_index if available, otherwise use array position + 1
      const rawLessonNumber = (lesson as any).row_index ?? (index + 1);
      const lessonNumber = Number(rawLessonNumber);
      if (!Number.isFinite(lessonNumber) || lessonNumber < 1 || lessonNumber > 10) {
        // Constraint: do not allow more than 10 lessons per day
        return;
      }
      
      const hasValidSubject = lesson.lesson_name && 
        lesson.lesson_name.trim() !== '' && 
        lesson.lesson_name !== 'null' &&
        lesson.lesson_name !== '[שיעור ללא שם]';
      
      const existing = slotMap[lessonNumber];
      
      if (!existing) {
        slotMap[lessonNumber] = { ...lesson, row_index: lessonNumber };
      } else {
        const existingHasSubject = existing.lesson_name && 
          existing.lesson_name.trim() !== '' && 
          existing.lesson_name !== 'null' &&
          existing.lesson_name !== '[שיעור ללא שם]';
        
        if (hasValidSubject && !existingHasSubject) {
          slotMap[lessonNumber] = { ...lesson, row_index: lessonNumber };
        }
      }
    });
    
    // Filter out empty subjects and re-apply Buff Standard times
    Object.entries(slotMap)
      .filter(([_, lesson]) => {
        const subj = lesson.lesson_name;
        return subj && subj.trim() !== '' && subj !== 'null' && subj !== '[שיעור ללא שם]';
      })
      .forEach(([lessonNum, lesson]) => {
        const idx = parseInt(lessonNum) - 1;
        cleanedLessons.push({
          ...lesson,
          day,
          start_time: generateDefaultTime(idx),
          auto_time: true,
          row_index: parseInt(lessonNum),
        });
      });
  });
  
  return cleanedLessons;
}

// Convert validated lessons to task format
// ZERO DATA LOSS POLICY: Keep rows with Subject OR Time (not both required)
// Empty slots are marked as "Free Period" / "שעה פנויה"
function lessonsToTasks(lessons: ParsedLesson[], applyCleanup: boolean = true): ParsedTask[] {
  const processedLessons = applyCleanup ? cleanupAndDeduplicateLessons(lessons) : lessons;
  
  return processedLessons
    .filter(l => {
      const hasSubject = l.lesson_name && l.lesson_name.trim() !== '' && l.lesson_name !== 'null';
      const hasTime = l.start_time && l.start_time.trim() !== '';
      return hasSubject || hasTime;
    })
    .map(l => {
      const rawSubject = l.lesson_name?.trim() || '';
      const isEmpty = !rawSubject || rawSubject === 'null' || rawSubject === '[שיעור ללא שם]';
      
      // Extract subject and teacher separately
      const { subject: extractedSubject, teacher } = extractSubjectAndTeacher(rawSubject);
      
      // If empty slot, mark as Free Period
      let displayTitle: string;
      if (isEmpty) {
        displayTitle = 'שעה פנויה'; // "Free Period" in Hebrew
      } else {
        // Build display title with optional teacher
        displayTitle = teacher ? `${extractedSubject} (${teacher})` : extractedSubject;
        // Clean up any [?] markers
        displayTitle = displayTitle.replace(/\[\?\]$/, '').trim();
      }
      
      const adhdCategory = getADHDCategory(extractedSubject);
      
      return {
        title: displayTitle,
        time: l.start_time,
        day: l.day,
        category: guessCategory(extractedSubject),
        credits: isEmpty ? 0 : guessCredits(extractedSubject),
        autoTime: l.auto_time,
        missingSubject: isEmpty,
        lessonNumber: (l as any).row_index || 0,
        teacher: teacher,
        adhdCategory: adhdCategory,
      };
    });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth check ──
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { imageBase64, excelData, fileType, extractedText } = body;

    // ── Input validation ──
    const MAX_IMAGE_SIZE = 10_000_000; // ~10MB base64
    const MAX_EXCEL_ROWS = 100;
    const MAX_FIELD_LENGTH = 500;

    if (imageBase64 && typeof imageBase64 === "string" && imageBase64.length > MAX_IMAGE_SIZE) {
      return new Response(JSON.stringify({ error: "Image too large (max ~7MB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (excelData && Array.isArray(excelData) && excelData.length > MAX_EXCEL_ROWS) {
      return new Response(JSON.stringify({ error: `Too many rows (max ${MAX_EXCEL_ROWS})` }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (extractedText && typeof extractedText === "string" && extractedText.length > 50_000) {
      return new Response(JSON.stringify({ error: "Text too long (max 50K chars)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let parsedTasks: ParsedTask[] = [];

    // STEP 1: Handle TEXT-ONLY parsing (lightweight - used when OCR text is provided)
    if (fileType === 'text' && extractedText) {
      console.log("Processing extracted text (lightweight mode)...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s for text parsing
      
      let response;
      try {
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite", // Fast, lightweight model for text
            messages: [
              {
                role: "system",
                content: `You are a Hebrew school schedule parser. Parse extracted OCR text into a structured schedule.

CRITICAL: ISRAELI 6-DAY SCHOOL WEEK (Sunday-Friday)
Friday (יום ו' / שישי) is a STANDARD school day - often shorter with 4-5 lessons. Do NOT skip Friday lessons!

RULES:
1. Return ONLY valid JSON - no markdown, no explanation.
2. Hebrew days: ראשון/א'=Sunday, שני/ב'=Monday, שלישי/ג'=Tuesday, רביעי/ד'=Wednesday, חמישי/ה'=Thursday, שישי/ו'=Friday
3. Friday variants: ו', יום ו, יום שישי, שישי, ו
4. Group lessons by day based on context clues in the text.
5. If time is missing, set start_time to null (we'll auto-fill later).
6. Include ALL Friday lessons even if fewer than other days.

OUTPUT:
{"lessons":[{"day":"יום א","start_time":"08:00","lesson_name":"מתמטיקה"},{"day":"יום ו","start_time":"08:00","lesson_name":"אנגלית"},...]}`
              },
              {
                role: "user",
                content: `Parse this extracted Hebrew schedule text into JSON:\n\n${extractedText}`
              }
            ],
            max_tokens: 4000,
            response_format: { type: "json_object" }
          }),
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error("Text parsing timed out");
          return new Response(JSON.stringify({ error: "עיבוד הטקסט ארך יותר מדי זמן." }), {
            status: 408,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw fetchError;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI text parsing error:", response.status, errorText);
        throw new Error(`AI processing error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content || "{}";
      
      try {
        const parsed = JSON.parse(content);
        const rawLessons = parsed.lessons || [];
        
        // Group by day and assign default times if missing
        const lessonsByDay: Record<string, any[]> = {};
        rawLessons.forEach((l: any) => {
          const day = normalizeDay(l.day || 'sunday');
          if (!lessonsByDay[day]) lessonsByDay[day] = [];
          lessonsByDay[day].push(l);
        });
        
        const validatedLessons: ParsedLesson[] = [];
        Object.entries(lessonsByDay).forEach(([day, lessons]) => {
          lessons.forEach((l, index) => {
            const time = normalizeTime(l.start_time);
            const autoTime = !time;
            const rawRowIndex = l.row_index ?? (index + 1);
            const rowIndexNum = Number(rawRowIndex);
            const row_index = (Number.isFinite(rowIndexNum) && rowIndexNum >= 1 && rowIndexNum <= 10)
              ? rowIndexNum
              : Math.min(index + 1, 10);
            validatedLessons.push({
              day,
              start_time: time || generateDefaultTime(row_index - 1),
              end_time: null,
              lesson_name: l.lesson_name || null,
              auto_time: autoTime,
              row_index,
            });
          });
        });
        
        parsedTasks = lessonsToTasks(validatedLessons);
        console.log(`Successfully parsed ${parsedTasks.length} tasks from text`);
      } catch (parseError) {
        console.error("Text JSON parse error:", parseError);
        throw new Error("לא הצלחנו לפענח את הטקסט. נסו להעתיק את הטקסט ידנית.");
      }
    }
    // STEP 2: Handle IMAGE with lightweight OCR-first approach
    else if (fileType === 'image' && imageBase64) {
      console.log("Processing image with precision OCR approach...");
      
      // Use a fast model with strict column-mapping rules
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout
      
      let response;
      try {
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash", // Fast model for image OCR
            messages: [
              {
                role: "system",
                content: `You are a Hebrew school schedule OCR system with a ZERO DATA LOSS policy. Extract ALL visible data.

CRITICAL: ISRAELI 6-DAY SCHOOL WEEK
Israeli schools operate Sunday through Friday (6 days). Friday (יום ו' / שישי) is a STANDARD school day - typically shorter with 4-5 lessons but MUST be extracted. Do NOT skip Friday!

COLUMN MAPPING (RTL - Right to Left):
- Column 1 (rightmost): יום א' / Sunday
- Column 2: יום ב' / Monday  
- Column 3: יום ג' / Tuesday
- Column 4: יום ד' / Wednesday
- Column 5: יום ה' / Thursday
- Column 6 (leftmost): יום ו' / Friday - THIS IS OFTEN THE LAST/LEFTMOST COLUMN!

FRIDAY EXTRACTION (CRITICAL):
1. Look for the LEFTMOST column - it's usually Friday (יום ו' / שישי).
2. Friday often has FEWER lessons (4-5) compared to other days (6-8) - this is NORMAL.
3. Even if Friday's column appears narrower or has fewer entries, EXTRACT ALL ITS LESSONS.
4. Common Friday labels: ו', יום ו, יום שישי, שישי, Friday, ו

ZERO DATA LOSS RULES:
1. If you find a Subject OR a Time, KEEP THE ROW. Do NOT discard rows missing one value.
2. If subject text is unclear, include it with a [?] suffix. Better to include than lose data.
3. If time is not visible, set start_time to null (system will auto-fill).
4. If a row has a time but no subject, include it with lesson_name as empty string "".

RELAXED COLUMN MAPPING:
1. If a text block is MOSTLY under a day's column (>50% overlap), assign it to that day.
2. For small/short text like "חנ"ג", assign to the column it's most centered under.
3. Do NOT leave cells empty if there's any visible text - include it with [?] if uncertain.

HEBREW SUBJECT DICTIONARY:
- חנ"ג / חינוך גופני = Physical Education
- מתמטיקה / חשבון = Math
- אנגלית = English
- עברית = Hebrew
- מדעים = Science
- היסטוריה = History
- גאוגרפיה = Geography
- מחשבים = Computer Science
- אמנות / ציור = Art
- מוזיקה = Music
- תנ"ך = Bible Studies
- ספרות = Literature
- חברה / שעת חברה = Social Studies

EXTRACTION FORMAT:
1. For each cell with ANY content: extract day, row_index (1-based), start_time (HH:MM or null), lesson_name.
2. Support up to 10 lessons per day (row_index 1-10).
3. ALWAYS include Friday lessons even if the column has fewer entries than other days.
4. Return ONLY valid JSON, no explanations.

OUTPUT: {"lessons":[{"day":"יום ב'","row_index":5,"start_time":null,"lesson_name":"חנ"ג"},{"day":"יום ו'","row_index":1,"start_time":null,"lesson_name":"אנגלית"},...]}`
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract the school schedule with ZERO DATA LOSS. Include ALL visible subjects and times. If uncertain about a cell, include it with [?]. Better to include extra data than miss something. Return only JSON with lessons array."
                  },
                  {
                    type: "image_url",
                    image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
                  }
                ]
              }
            ],
            max_tokens: 6000,
            response_format: { type: "json_object" }
          }),
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error("Image OCR timed out after 45 seconds");
          return new Response(JSON.stringify({ 
            error: "העיבוד לוקח קצת זמן. אפשר להעתיק את הטקסט ידנית או לנסות תמונה ברורה יותר.",
            timeout: true
          }), {
            status: 408,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw fetchError;
      }

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "יש הרבה בקשות כרגע. נסו שוב בעוד דקה." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "נגמרו הקרדיטים. אנא הוסיפו קרדיטים." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content || "{}";
      console.log("OCR response length:", content.length);
      
      try {
        const parsed = JSON.parse(content);
        const rawLessons = parsed.lessons || [];
        
        // Group by day and assign default times if missing
        const lessonsByDay: Record<string, any[]> = {};
        rawLessons.forEach((l: any) => {
          const day = normalizeDay(l.day || 'sunday');
          if (!lessonsByDay[day]) lessonsByDay[day] = [];
          lessonsByDay[day].push(l);
        });
        
        // Sort each day's lessons by time if available, then assign defaults
        const validatedLessons: ParsedLesson[] = [];
        Object.entries(lessonsByDay).forEach(([day, lessons]) => {
          // Sort by existing time
          lessons.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
          
          lessons.forEach((l, index) => {
            const time = normalizeTime(l.start_time);
            const autoTime = !time;
            const rawRowIndex = l.row_index ?? (index + 1);
            const rowIndexNum = Number(rawRowIndex);
            const row_index = (Number.isFinite(rowIndexNum) && rowIndexNum >= 1 && rowIndexNum <= 10)
              ? rowIndexNum
              : Math.min(index + 1, 10);
            validatedLessons.push({
              day,
              start_time: time || generateDefaultTime(row_index - 1),
              end_time: null,
              lesson_name: l.lesson_name || null,
              auto_time: autoTime,
              row_index,
            });
          });
        });
        
        parsedTasks = lessonsToTasks(validatedLessons);
        
        // Log summary
        const autoTimeCount = parsedTasks.filter(t => t.autoTime).length;
        console.log(`Parsed ${parsedTasks.length} tasks (${autoTimeCount} with auto-filled times)`);
        
      } catch (parseError) {
        console.error("Image parse error:", parseError);
        throw new Error("לא הצלחנו לחלץ את המערכת. נסו תמונה ברורה יותר או העתיקו ידנית.");
      }
    }
    // STEP 3: Handle Excel/CSV
    else if (fileType === 'excel' && excelData) {
      console.log("Processing Excel data...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      let response;
      try {
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `Parse Hebrew school schedule from spreadsheet data.

CRITICAL: ISRAELI 6-DAY SCHOOL WEEK (Sunday-Friday)
Friday (יום ו' / שישי) is a STANDARD school day. Include ALL Friday lessons even if fewer entries!

RULES:
1. Return ONLY valid JSON.
2. Days: ראשון=Sunday, שני=Monday, שלישי=Tuesday, רביעי=Wednesday, חמישי=Thursday, שישי=Friday
3. Friday variants: ו', יום ו, יום שישי, שישי, ו
4. If time missing, set start_time to null.
5. Always extract Friday column (often leftmost in RTL layout).

OUTPUT: {"lessons":[{"day":"יום א","start_time":"08:00","lesson_name":"מתמטיקה"},{"day":"יום ו","start_time":"08:00","lesson_name":"אנגלית"},...]}`
              },
              {
                role: "user",
                content: `Parse this timetable:\n${JSON.stringify(excelData, null, 2)}`
              }
            ],
            max_tokens: 6000,
            response_format: { type: "json_object" }
          }),
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          return new Response(JSON.stringify({ error: "עיבוד האקסל ארך יותר מדי זמן." }), {
            status: 408,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw fetchError;
      }

      if (!response.ok) {
        throw new Error(`AI error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content || "{}";
      
      try {
        const parsed = JSON.parse(content);
        const rawLessons = parsed.lessons || [];
        
        const lessonsByDay: Record<string, any[]> = {};
        rawLessons.forEach((l: any) => {
          const day = normalizeDay(l.day || 'sunday');
          if (!lessonsByDay[day]) lessonsByDay[day] = [];
          lessonsByDay[day].push(l);
        });
        
        const validatedLessons: ParsedLesson[] = [];
        Object.entries(lessonsByDay).forEach(([day, lessons]) => {
          lessons.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
          lessons.forEach((l, index) => {
            const time = normalizeTime(l.start_time);
            const autoTime = !time;
            const rawRowIndex = l.row_index ?? (index + 1);
            const rowIndexNum = Number(rawRowIndex);
            const row_index = (Number.isFinite(rowIndexNum) && rowIndexNum >= 1 && rowIndexNum <= 10)
              ? rowIndexNum
              : Math.min(index + 1, 10);
            validatedLessons.push({
              day,
              start_time: time || generateDefaultTime(row_index - 1),
              end_time: null,
              lesson_name: l.lesson_name || null,
              auto_time: autoTime,
              row_index,
            });
          });
        });
        
        parsedTasks = lessonsToTasks(validatedLessons);
        console.log(`Parsed ${parsedTasks.length} tasks from Excel`);
      } catch (parseError) {
        console.error("Excel parse error:", parseError);
        throw new Error("לא הצלחנו לפענח את הקובץ. ודאו שהפורמט תקין.");
      }
    }

    return new Response(JSON.stringify({ tasks: parsedTasks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("parse-schedule error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "שגיאה לא צפויה" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
