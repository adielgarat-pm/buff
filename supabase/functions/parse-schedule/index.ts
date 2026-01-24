import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedTask {
  title: string;
  time: string;
  day: string;
  category: string;
  credits: number;
}

// Determine category based on task title
function guessCategory(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('med') || lower.includes('pill') || lower.includes('tablet')) {
    return 'medication';
  }
  if (lower.includes('shower') || lower.includes('brush') || lower.includes('wash') || lower.includes('bath')) {
    return 'hygiene';
  }
  if (lower.includes('breakfast') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('snack') || lower.includes('eat') || lower.includes('food')) {
    return 'nutrition';
  }
  return 'school';
}

// Determine credits based on estimated effort
function guessCredits(title: string): number {
  const lower = title.toLowerCase();
  if (lower.includes('homework') || lower.includes('study') || lower.includes('test') || lower.includes('exam')) {
    return 30;
  }
  if (lower.includes('shower') || lower.includes('breakfast') || lower.includes('dinner')) {
    return 20;
  }
  if (lower.includes('meds') || lower.includes('pill') || lower.includes('brush')) {
    return 5;
  }
  return 10;
}

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
      // Parse Excel data (already parsed on client side)
      parsedTasks = excelData.map((row: any) => ({
        title: row.title || row.subject || row.task || 'Untitled Task',
        time: row.time || row.startTime || '09:00',
        day: row.day || row.weekday || 'sunday',
        category: guessCategory(row.title || row.subject || ''),
        credits: guessCredits(row.title || row.subject || ''),
      }));
    } else if (fileType === 'image' && imageBase64) {
      // Use AI to parse timetable image
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            {
              role: "system",
              content: `You are an expert at reading school timetables and schedules from images.
Extract all subjects, classes, or tasks visible in the timetable.
For each item, identify:
- title: The subject or task name
- time: The start time in HH:MM format (24-hour)
- day: The day of week in lowercase (sunday, monday, tuesday, wednesday, thursday, friday, saturday)

Return ONLY a valid JSON array of objects with these exact fields. No markdown, no explanation.
Example: [{"title":"Math","time":"08:00","day":"sunday"},{"title":"English","time":"09:00","day":"sunday"}]`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please analyze this school timetable image and extract all the subjects with their times and days. Return as JSON array."
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
          max_tokens: 4000,
        }),
      });

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
      const content = aiResponse.choices?.[0]?.message?.content || "[]";
      
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      try {
        const aiParsedItems = JSON.parse(jsonStr);
        parsedTasks = aiParsedItems.map((item: any) => ({
          title: item.title || 'Untitled',
          time: item.time || '09:00',
          day: (item.day || 'sunday').toLowerCase(),
          category: guessCategory(item.title || ''),
          credits: guessCredits(item.title || ''),
        }));
      } catch (parseError) {
        console.error("Failed to parse AI response:", content);
        throw new Error("Failed to parse schedule from image. Please try a clearer image.");
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
