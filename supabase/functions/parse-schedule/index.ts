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
}

interface ParsedTask {
  title: string;
  time: string;
  day: string;
  category: string;
  credits: number;
}

// Hebrew day name mapping (RTL aware)
const HEBREW_DAY_MAP: Record<string, string> = {
  'יום ראשון': 'sunday',
  'ראשון': 'sunday',
  'א': 'sunday',
  "א'": 'sunday',
  'יום שני': 'monday',
  'שני': 'monday',
  'ב': 'monday',
  "ב'": 'monday',
  'יום שלישי': 'tuesday',
  'שלישי': 'tuesday',
  'ג': 'tuesday',
  "ג'": 'tuesday',
  'יום רביעי': 'wednesday',
  'רביעי': 'wednesday',
  'ד': 'wednesday',
  "ד'": 'wednesday',
  'יום חמישי': 'thursday',
  'חמישי': 'thursday',
  'ה': 'thursday',
  "ה'": 'thursday',
  'יום שישי': 'friday',
  'שישי': 'friday',
  'ו': 'friday',
  "ו'": 'friday',
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

// Validate parsed lesson and log warnings for discarded items
function validateLesson(lesson: any, index: number): ParsedLesson | null {
  const day = lesson.day;
  const startTime = normalizeTime(lesson.start_time);
  const endTime = normalizeTime(lesson.end_time);
  const lessonName = lesson.lesson_name;
  
  // Must have day and start_time
  if (!day || !startTime) {
    console.warn(`[Validation] Discarding lesson at index ${index}: missing day or start_time`, JSON.stringify(lesson));
    return null;
  }
  
  return {
    day: normalizeDay(day),
    start_time: startTime,
    end_time: endTime,
    lesson_name: lessonName || null,
  };
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
    }));
}

// Strict JSON schema for image extraction
const IMAGE_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    lessons: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string", description: "Hebrew day name (e.g., יום ראשון, ראשון, א')" },
          start_time: { type: "string", description: "Lesson start time in HH:MM 24-hour format" },
          end_time: { type: ["string", "null"], description: "Lesson end time in HH:MM 24-hour format, or null if unknown" },
          lesson_name: { type: ["string", "null"], description: "Subject/lesson name in Hebrew, or null if cell is empty. Add [?] suffix if text is unclear" }
        },
        required: ["day", "start_time", "lesson_name"]
      }
    }
  },
  required: ["lessons"]
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, excelData, fileType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let parsedTasks: ParsedTask[] = [];

    if (fileType === 'excel' && excelData) {
      // Use AI to intelligently parse the Excel data structure
      console.log("Received Excel data:", JSON.stringify(excelData).substring(0, 1000));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 85000);
      
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
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are a Hebrew school timetable parser. Extract schedule data from spreadsheets.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no explanation, no conversation.
2. The spreadsheet may be RTL (Right-to-Left) Hebrew layout.
3. IMPORTANT: Israeli schools have a 6-DAY week (Sunday-Friday). Always check for 6 columns of days.
4. Hebrew day headers: ראשון/א'=Sunday, שני/ב'=Monday, שלישי/ג'=Tuesday, רביעי/ד'=Wednesday, חמישי/ה'=Thursday, שישי/ו'=Friday
5. If Friday (יום שישי / שישי / ו') exists in the data, it MUST be included in the output.
6. Times are typically in the first column or row headers in HH:MM format.
7. If a time is missing but inferable from grid position, infer it.
8. If lesson text is unclear, include it with [?] suffix.
9. If a cell is empty, set lesson_name to null but still include the row.

OUTPUT SCHEMA:
{"lessons":[{"day":"יום ראשון","start_time":"08:00","end_time":"08:45","lesson_name":"מתמטיקה"},...]}

Return ONLY the JSON object, nothing else.`
              },
              {
                role: "user",
                content: `Parse this Hebrew timetable into JSON:\n${JSON.stringify(excelData, null, 2)}`
              }
            ],
            max_tokens: 8000,
            response_format: { type: "json_object" }
          }),
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error("AI Excel processing timed out after 85 seconds");
          return new Response(JSON.stringify({ error: "עיבוד האקסל ארך יותר מדי זמן. נסו שוב או העלו קובץ קטן יותר." }), {
            status: 408,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw fetchError;
      }

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await response.text();
        console.error("AI gateway error for Excel:", response.status, errorText);
        throw new Error(`AI processing error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content || "{}";
      console.log("AI Excel parsing response:", content.substring(0, 500));
      
      try {
        const parsed = JSON.parse(content);
        const rawLessons = parsed.lessons || parsed || [];
        
        if (!Array.isArray(rawLessons)) {
          throw new Error("Response lessons is not an array");
        }
        
        // Validate each lesson and filter out invalid ones
        const validatedLessons: ParsedLesson[] = [];
        for (let i = 0; i < rawLessons.length; i++) {
          const validated = validateLesson(rawLessons[i], i);
          if (validated) {
            validatedLessons.push(validated);
          }
        }
        
        parsedTasks = lessonsToTasks(validatedLessons);
        console.log(`Successfully parsed ${parsedTasks.length} tasks from Excel (${rawLessons.length - validatedLessons.length} discarded)`);
      } catch (parseError) {
        console.error("Excel JSON parse error:", parseError);
        throw new Error("Could not parse Excel data. Please ensure the file contains a valid timetable.");
      }
    } else if (fileType === 'image' && imageBase64) {
      // Use AI with strict structured output for image extraction
      console.log("Processing schedule image...");
      
       // Set timeout for AI call (85s max to stay under function limit)
       const controller = new AbortController();
       const timeoutId = setTimeout(() => controller.abort(), 85000);
       
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
             model: "google/gemini-2.5-pro",
             messages: [
               {
                 role: "system",
               content: `You are a precise Hebrew school schedule OCR system. Extract timetable data from images with EXACT positioning accuracy.

CRITICAL TABLE STRUCTURE RULES:
1. Hebrew tables are RTL (Right-to-Left). The RIGHTMOST column is typically Sunday (יום א'), and columns go LEFT toward Friday (יום ו').
2. Israeli schools have a 6-DAY week (Sunday-Friday). Count the columns carefully - there should be 5 or 6 day columns.
3. The FIRST column (usually leftmost in RTL) often contains TIME values.
4. Each ROW represents ONE time slot. All cells in the same row share the SAME time.
5. Each COLUMN represents ONE specific day. All cells in the same column belong to the SAME day.

COLUMN-TO-DAY MAPPING (RTL - RIGHT TO LEFT):
- Rightmost day column = יום א' (Sunday)
- 2nd from right = יום ב' (Monday)
- 3rd from right = יום ג' (Tuesday)
- 4th from right = יום ד' (Wednesday)
- 5th from right = יום ה' (Thursday)
- 6th from right (leftmost day) = יום ו' (Friday) - if present

STRICT HORIZONTAL ALIGNMENT RULES (CRITICAL FOR LATE LESSONS):
- A lesson MUST be assigned to a day ONLY if its horizontal CENTER falls within that day's column boundaries.
- Draw imaginary vertical lines between each day header. A lesson belongs to the column it physically sits in.
- For rows with fewer cells (like a 7th period that only some days have), ONLY include entries for days that actually have a cell in that row.
- If a day's column is EMPTY in a row (no cell exists), DO NOT create an entry for that day+time. Skip it entirely.
- NEVER "fill in" missing slots by shifting lessons horizontally. Late lessons often appear in only 1-2 columns.

STEP-BY-STEP EXTRACTION PROCESS:
1. FIRST: Identify the day header row. Note the exact X-coordinate boundaries of each column.
2. SECOND: Identify time values in the time column (usually leftmost).
3. THIRD: For EACH cell, determine its horizontal center point. Match it to the column whose boundaries contain that center.
4. FOURTH: Map the column to the correct day using RTL ordering.
5. FIFTH: Assign the row's time to this cell's start_time.
6. SIXTH: If a row has fewer cells than days (common for 7th+ periods), only output entries for days that have cells.

VALIDATION RULES:
- Early rows (periods 1-5) typically have 5-6 entries (one per day).
- Later rows (periods 6-7+) may have only 1-4 entries. This is NORMAL - some days end earlier.
- NEVER assume a lesson belongs to Monday just because it's "the next column" - verify its actual position.
- If lesson text appears to span or straddle a column boundary, flag it with [?] and assign to the column containing most of the text.

TIME EXTRACTION:
- Times are in HH:MM 24-hour format
- Common school times: 08:00, 08:45, 09:30, 10:15, 11:00, 11:45, 12:30, 13:15, 14:00, 14:45
- Each row typically adds ~45-50 minutes from the previous row

LESSON NAME EXTRACTION:
- Extract Hebrew text exactly as shown
- Teacher names may appear after subject (e.g., "חשבון להט רות" = Math, teacher Lehat Rut)
- If text is blurry/unclear, provide best guess with [?] suffix
- If cell is completely empty or doesn't exist for that day, DO NOT include an entry

OUTPUT FORMAT (STRICTLY JSON):
{"lessons":[
  {"day":"יום א","start_time":"08:00","end_time":"08:45","lesson_name":"חשבון"},
  {"day":"יום ב","start_time":"08:00","end_time":"08:45","lesson_name":"שפה"},
  ...
],
"column_analysis": {
  "num_day_columns": 6,
  "days_detected": ["יום א", "יום ב", "יום ג", "יום ד", "יום ה", "יום ו"],
  "rows_per_day": {"יום א": 6, "יום ב": 7, "יום ג": 6, "יום ד": 7, "יום ה": 6, "יום ו": 4}
}}

FINAL CHECK: Count lessons per day. If one day has significantly more late-period lessons than others, verify the column alignment is correct. A 7th period lesson in column 3 (from right) MUST be assigned to יום ג (Tuesday), not יום ב.`
               },
               {
                 role: "user",
                 content: [
                   {
                     type: "text",
                  text: `Extract the complete school schedule from this image. 
                  
IMPORTANT: This is a Hebrew RTL table. Carefully identify:
1. How many day columns exist (5 or 6)
2. Which column corresponds to which day (rightmost = Sunday, leftmost = Friday if 6 days)
3. The time for each row

For EACH cell in the grid, create a lesson entry with the correct day based on its COLUMN position.
Return ONLY JSON.`
                   },
                   {
                     type: "image_url",
                     image_url: {
                       url: `data:image/jpeg;base64,${imageBase64}`
                     }
                   }
                 ]
               }
             ],
             max_tokens: 12000,
             response_format: { type: "json_object" }
           }),
         });
         clearTimeout(timeoutId);
       } catch (fetchError: any) {
         clearTimeout(timeoutId);
         if (fetchError.name === 'AbortError') {
           console.error("AI processing timed out after 85 seconds");
           return new Response(JSON.stringify({ error: "עיבוד התמונה ארך יותר מדי זמן. נסה שוב או העלה תמונה בעלת רזולוציה נמוכה יותר." }), {
             status: 408,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
         throw fetchError;
       }

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content || "{}";
      console.log("AI image parsing response length:", content.length);
      console.log("AI image parsing response preview:", content.substring(0, 500));
      
      try {
        const parsed = JSON.parse(content);
        const rawLessons = parsed.lessons || [];
        
        if (!Array.isArray(rawLessons)) {
          throw new Error("Response lessons is not an array");
        }
        
        console.log(`Raw lessons extracted: ${rawLessons.length}`);
        
        // Log column analysis if available (for debugging)
        if (parsed.column_analysis) {
          console.log("Column analysis:", JSON.stringify(parsed.column_analysis));
        }
        
        // Validate each lesson and filter out invalid ones
        const validatedLessons: ParsedLesson[] = [];
        for (let i = 0; i < rawLessons.length; i++) {
          const validated = validateLesson(rawLessons[i], i);
          if (validated) {
            validatedLessons.push(validated);
          }
        }
        
        console.log(`Validated lessons: ${validatedLessons.length}`);
        
        // Sanity check: detect potential misalignment by analyzing lesson distribution
        const lessonsByDay: Record<string, number> = {};
        const lateLessonsByDay: Record<string, number> = {}; // lessons after 11:45
        validatedLessons.forEach(l => {
          lessonsByDay[l.day] = (lessonsByDay[l.day] || 0) + 1;
          if (l.start_time >= '11:45') {
            lateLessonsByDay[l.day] = (lateLessonsByDay[l.day] || 0) + 1;
          }
        });
        console.log("Lessons per day:", JSON.stringify(lessonsByDay));
        console.log("Late lessons (after 11:45) per day:", JSON.stringify(lateLessonsByDay));
        
        // Flag potential misalignment: if one day has 3+ more late lessons than average
        const lateCounts = Object.values(lateLessonsByDay);
        if (lateCounts.length > 0) {
          const avgLate = lateCounts.reduce((a, b) => a + b, 0) / lateCounts.length;
          const maxLate = Math.max(...lateCounts);
          if (maxLate >= avgLate + 2) {
            console.warn("[SANITY CHECK] Potential column misalignment detected: one day has significantly more late lessons than others");
          }
        }
        
        parsedTasks = lessonsToTasks(validatedLessons);
        console.log(`Successfully parsed ${parsedTasks.length} tasks from image (${rawLessons.length - validatedLessons.length} discarded)`);
      } catch (parseError) {
        console.error("Image JSON parse error:", parseError);
        console.error("Raw content:", content.substring(0, 1000));
        throw new Error("Could not extract schedule. The image may be unclear or the format unrecognized. Please try a different image.");
      }
    }

    return new Response(JSON.stringify({ tasks: parsedTasks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("parse-schedule error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});