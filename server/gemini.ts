import { GoogleGenerativeAI } from "@google/genai";

const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

if (!apiKey) {
  throw new Error("AI_INTEGRATIONS_GEMINI_API_KEY is not set");
}

export const genAI = new GoogleGenerativeAI(apiKey);

export async function generateCaptions(contentDescription: string, category: string) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  });

  const prompt = `You are a professional social media caption writer. Generate 3 caption variations for the following content:

Content Description: ${contentDescription}
Category: ${category}
Vibe/Tone: Engaging, authentic, and optimized for social media engagement
Goal: Drive engagement, encourage saves/shares, and build audience connection

For each caption variation, provide:
1. A tone label (e.g., "Inspirational & Epic", "Short & Punchy", "Question/Engagement")
2. The caption text (compelling, concise, with emojis where appropriate)
3. 3-5 relevant hashtags

Additionally, suggest:
- 3 music/audio pairing options (popular tracks or sounds that match the vibe)
- 3 sticker/sharing ideas (interactive elements to boost engagement)

Return the response as a valid JSON object with this exact structure:
{
  "captions": [
    {
      "id": "c1",
      "tone": "tone label",
      "text": "caption text here",
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
    }
  ],
  "music": ["track 1", "track 2", "track 3"],
  "stickers": ["sticker idea 1", "sticker idea 2", "sticker idea 3"]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to extract JSON from Gemini response");
  }
  
  return JSON.parse(jsonMatch[0]);
}

export async function analyzeContent(query: string, analyticsData: any) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  });

  const prompt = `You are a content strategy analyst. The user is asking: "${query}"

Here is their recent analytics data:
${JSON.stringify(analyticsData, null, 2)}

Provide a helpful, concise response. If they ask for captions, format them as a structured list with tone labels. If they ask for trends or analysis, provide clear insights with specific numbers.

Keep your response conversational and actionable.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
