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
}

interface ParsedTask {
  title: string;
  time: string;
  day: string;
  category: string;
  credits: number;
  autoTime?: boolean;
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
function generateDefaultTime(lessonIndex: number): string {
  const LESSON_DURATION = 50;
  const BREAK_DURATION = 20;
  
  let currentMinutes = 8 * 60; // Start at 08:00
  
  for (let i = 0; i < lessonIndex; i++) {
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

// Determine category based on task title
function guessCategory(title: string): string {
  const lower = title.toLowerCase();
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
  return 'school';
}

// Determine credits based on estimated effort
function guessCredits(title: string): number {
  const lower = title.toLowerCase();
  if (lower.includes('homework') || lower.includes('study') || lower.includes('test') || 
      lower.includes('exam') || lower.includes('שיעורי בית') || lower.includes('מבחן')) {
    return 30;
  }
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

// Convert validated lessons to task format
function lessonsToTasks(lessons: ParsedLesson[]): ParsedTask[] {
  return lessons
    .filter(l => l.lesson_name && l.lesson_name.trim() !== '' && l.lesson_name !== 'null')
    .map(l => ({
      title: l.lesson_name!.replace(/\[\?\]$/, '').trim(),
      time: l.start_time,
      day: l.day,
      category: guessCategory(l.lesson_name!),
      credits: guessCredits(l.lesson_name!),
      autoTime: l.auto_time,
    }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, excelData, fileType, extractedText } = await req.json();
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

RULES:
1. Return ONLY valid JSON - no markdown, no explanation.
2. Israeli schools use a 6-DAY week (Sunday-Friday).
3. Hebrew days: ראשון/א'=Sunday, שני/ב'=Monday, שלישי/ג'=Tuesday, רביעי/ד'=Wednesday, חמישי/ה'=Thursday, שישי/ו'=Friday
4. Group lessons by day based on context clues in the text.
5. If time is missing, set start_time to null (we'll auto-fill later).
6. If a lesson seems unclear, include it with [?] suffix.

OUTPUT:
{"lessons":[{"day":"יום א","start_time":"08:00","lesson_name":"מתמטיקה"},...]}`
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
            validatedLessons.push({
              day,
              start_time: time || generateDefaultTime(index),
              end_time: null,
              lesson_name: l.lesson_name || null,
              auto_time: autoTime,
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
                content: `You are a PRECISION Hebrew school schedule OCR system. Extract data with STRICT column boundaries.

CRITICAL COLUMN-MAPPING RULES:
1. Hebrew tables are RTL: Rightmost column = Sunday (יום א'), second = Monday (יום ב'), etc.
2. STRICT VERTICAL ANCHOR: A subject belongs to a column ONLY if its text is STRICTLY within that column's X-coordinates.
3. DO NOT "fill" short subjects from neighboring columns. If a cell appears empty, leave it empty.
4. Column drift is FORBIDDEN: "מחשבים" in column 4 (Wednesday) must NOT appear in column 2 (Monday).

HEBREW SUBJECT DICTIONARY (prioritize recognition):
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
- חברה = Social Studies

EXTRACTION RULES:
1. For each cell, extract: day, row_index (1-based period number), start_time (HH:MM or null), lesson_name.
2. If a cell has short/unclear text, use dictionary matching. "חנ"ג" is VERY common.
3. If time is not visible, set start_time to null.
4. Return ONLY valid JSON, no explanations.

OUTPUT FORMAT: {"lessons":[{"day":"יום ב'","row_index":5,"start_time":null,"lesson_name":"חנ"ג"},...]}`
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract the school schedule with STRICT column boundaries. Each subject must be in its CORRECT day column. Return only JSON with lessons array."
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
            validatedLessons.push({
              day,
              start_time: time || generateDefaultTime(index),
              end_time: null,
              lesson_name: l.lesson_name || null,
              auto_time: autoTime,
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

RULES:
1. Return ONLY valid JSON.
2. 6-DAY Israeli week (Sunday-Friday).
3. Days: ראשון=Sunday, שני=Monday, שלישי=Tuesday, רביעי=Wednesday, חמישי=Thursday, שישי=Friday
4. If time missing, set start_time to null.

OUTPUT: {"lessons":[{"day":"יום א","start_time":"08:00","lesson_name":"מתמטיקה"},...]}`
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
            validatedLessons.push({
              day,
              start_time: time || generateDefaultTime(index),
              end_time: null,
              lesson_name: l.lesson_name || null,
              auto_time: autoTime,
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
