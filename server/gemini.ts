import { GoogleGenAI } from "@google/genai";

const replitKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
const userKey = process.env.GEMINI_API_KEY;
const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

const apiKey = replitKey || userKey;

if (!apiKey) {
  throw new Error("No Gemini API key available. Please add GEMINI_API_KEY to secrets.");
}

const useReplitIntegration = !!replitKey;

export const genAI = new GoogleGenAI({ 
  apiKey,
  httpOptions: useReplitIntegration && baseUrl ? { baseUrl, apiVersion: "" } : undefined,
});

const MODEL = useReplitIntegration ? "gemini-2.5-flash" : "gemini-1.5-flash";

const VOICE_GUIDELINES = `
VOICE & STYLE RULES (MUST FOLLOW):
- Voice: Masculine, hardworking, no ego, with wit and humor
- Keep captions SHORT and CONCISE with witty hashtags
- Use emojis when warranted but don't overdo it
- For Family/Parenting posts: Sound like a loving, caring father who prioritizes his sons. Super proud to lead by example. Makes life choices for his kids.

AVOID LLM SLOP - STRICT RULES:
- NEVER use em dashes (--). Replace with semicolons, commas, or sentence breaks
- NEVER start with "Great question" or "Let me help you"
- NEVER use "Let's dive into..." or "In today's fast-paced digital world"
- NEVER use "it's not just [x], it's [y]" patterns
- NEVER use "In conclusion," "Overall," "To summarize," or high-school essay closers
- NEVER use "Hope this helps!" or similar closers
- NEVER overuse "Furthermore," "Additionally," "Moreover"
- NEVER use hedge words like "might," "perhaps," "potentially" unless uncertainty is real
- NEVER stack hedging phrases like "may potentially" or "it's important to note that"
- NEVER create perfectly symmetrical paragraphs or numbered lists starting with "Firstly..." "Secondly..."
- Use '' instead of backticks
- Keep it REAL and AUTHENTIC, not polished corporate speak
`;

export async function generateCaptions(contentDescription: string, category: string) {
  const isFamilyCategory = ["Family", "Parenting"].includes(category);
  
  const prompt = `You are writing Instagram captions in a specific voice. Generate 3 caption variations.

Content Description: ${contentDescription}
Category: ${category}

${VOICE_GUIDELINES}

${isFamilyCategory ? `
FAMILY POST VOICE:
- Sound like a proud, loving father
- Show you prioritize your sons and lead by example
- Warm but not cheesy, genuine pride without bragging
` : ''}

Generate exactly 3 captions. Each caption needs: tone label, short text (under 50 words), and 3 hashtags.
Also include: one extended post (100 words max), 3 music suggestions, 3 sticker ideas.

Return ONLY valid JSON with no markdown:
{"captions":[{"id":"c1","tone":"tone","text":"caption","hashtags":["#tag1","#tag2","#tag3"]},{"id":"c2","tone":"tone","text":"caption","hashtags":["#tag1","#tag2","#tag3"]},{"id":"c3","tone":"tone","text":"caption","hashtags":["#tag1","#tag2","#tag3"]}],"extendedPost":"extended content","music":["song1","song2","song3"],"stickers":["sticker1","sticker2","sticker3"]}`;

  const result = await genAI.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.8,
      maxOutputTokens: 4096,
    }
  });
  
  const text = result.text || "";
  
  let cleanedText = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Raw Gemini response:", text);
    throw new Error("Failed to extract JSON from Gemini response");
  }
  
  let jsonStr = jsonMatch[0]
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');
  
  try {
    return JSON.parse(jsonStr);
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    console.error("Attempted to parse:", jsonStr.substring(0, 500));
    
    return {
      captions: [
        { id: "c1", tone: "Quick & Witty", text: "Content ready to share! 💪", hashtags: ["#content", "#creator"] },
        { id: "c2", tone: "Real Talk", text: "Another day, another win.", hashtags: ["#grind", "#hustle"] },
        { id: "c3", tone: "Authentic", text: "Making moves, one step at a time.", hashtags: ["#progress", "#growth"] }
      ],
      extendedPost: "Check out what I've been working on...",
      music: ["Upbeat hip-hop", "Motivational instrumental", "Lo-fi beats"],
      stickers: ["Fire emoji", "100 emoji", "Checkmark"]
    };
  }
}

export async function analyzeContent(query: string, analyticsData: any) {
  const prompt = `You are a content strategy analyst. The user is asking: "${query}"

Here is their recent analytics data:
${JSON.stringify(analyticsData, null, 2)}

${VOICE_GUIDELINES}

Provide a helpful, concise response. Keep it conversational and actionable. No corporate speak.`;

  const result = await genAI.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  });
  
  return result.text || "";
}
