import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set. Please add your Gemini API key to secrets.");
}

export const genAI = new GoogleGenAI({ 
  apiKey,
  httpOptions: process.env.GEMINI_API_KEY ? undefined : (baseUrl ? { baseUrl, apiVersion: "" } : undefined),
});

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

FOR EACH CAPTION:
1. A tone label (e.g., "Quick & Witty", "Proud Dad Moment", "Real Talk")
2. The caption text (short, punchy, with a witty hashtag)
3. 3-5 relevant hashtags (make at least one witty/custom)

ALSO CREATE ONE "EXTENDED POST" with:
- A relatable or humorous hook
- Vivid description of the experience
- An educational tip or insight
- A personal moment of struggle or victory
- End with a fun question or call to action for engagement

Return as valid JSON:
{
  "captions": [
    {
      "id": "c1",
      "tone": "tone label",
      "text": "caption text here",
      "hashtags": ["#hashtag1", "#wittyhashtag", "#hashtag3"]
    }
  ],
  "extendedPost": "The full extended post content here...",
  "music": ["track 1", "track 2", "track 3"],
  "stickers": ["sticker idea 1", "sticker idea 2", "sticker idea 3"]
}`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  });
  
  const text = result.text || "";
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to extract JSON from Gemini response");
  }
  
  return JSON.parse(jsonMatch[0]);
}

export async function analyzeContent(query: string, analyticsData: any) {
  const prompt = `You are a content strategy analyst. The user is asking: "${query}"

Here is their recent analytics data:
${JSON.stringify(analyticsData, null, 2)}

${VOICE_GUIDELINES}

Provide a helpful, concise response. Keep it conversational and actionable. No corporate speak.`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  });
  
  return result.text || "";
}
