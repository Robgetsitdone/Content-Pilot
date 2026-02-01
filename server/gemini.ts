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
    // Throw error instead of returning generic fallback
    throw new Error("Failed to parse AI response - please try again");
  }
}

const CATEGORIES = [
  "Family", "Parenting", "Fitness", "Gym + Life + Fitness", "Travel",
  "Business", "Lifestyle", "Education", "Entertainment", "Food", "General"
];

// Concurrency limiter for parallel API calls
const CONCURRENCY_LIMIT = 3;

function createConcurrencyLimiter(limit: number) {
  let running = 0;
  const queue: Array<() => void> = [];

  return async function<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = async () => {
        running++;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          running--;
          if (queue.length > 0) {
            const next = queue.shift();
            next?.();
          }
        }
      };

      if (running < limit) {
        run();
      } else {
        queue.push(run);
      }
    });
  };
}

export interface ImageAnalysisResult {
  filename: string;
  category: string;
  captions: Array<{
    id: string;
    tone: string;
    text: string;
    hashtags: string[];
  }>;
  extendedPost: string;
  music: string[];
  error?: string; // Present when AI analysis failed
  stickers: string[];
}

async function analyzeWithRetry(base64: string, filename: string, maxRetries = 5, generationNote?: string): Promise<ImageAnalysisResult> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await analyzeSingleImage(base64, filename, generationNote);
      if (attempt > 1) {
        console.log(`[Gemini Vision] Retry ${attempt} succeeded for ${filename}`);
      }
      return result;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || String(error);
      console.log(`[Gemini Vision] Attempt ${attempt}/${maxRetries} failed for ${filename}: ${errorMsg}`);
      
      // Check if this is a rate limit error (429) or server error (5xx) - worth retrying
      const isRetryable = errorMsg.includes('429') || errorMsg.includes('500') || 
                          errorMsg.includes('503') || errorMsg.includes('rate') ||
                          errorMsg.includes('quota') || errorMsg.includes('temporarily');
      
      if (attempt < maxRetries) {
        // Exponential backoff with jitter: 2s, 4s, 8s, 16s base delays
        const baseDelay = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        console.log(`[Gemini Vision] Waiting ${Math.round(delay)}ms before retry... (${isRetryable ? 'retryable error' : 'unknown error'})`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export async function analyzeImageBatch(images: Array<{ base64: string; filename: string }>): Promise<ImageAnalysisResult[]> {
  const limiter = createConcurrencyLimiter(CONCURRENCY_LIMIT);

  console.log(`[Gemini Vision] Starting parallel analysis of ${images.length} images (max ${CONCURRENCY_LIMIT} concurrent)`);
  const startTime = Date.now();

  const analysisPromises = images.map((image, index) =>
    limiter(async () => {
      try {
        const result = await analyzeWithRetry(image.base64, image.filename, 5);
        console.log(`[Gemini Vision] [${index + 1}/${images.length}] Successfully analyzed ${image.filename}: ${result.category}`);
        return result;
      } catch (error: any) {
        console.error(`[Gemini Vision] [${index + 1}/${images.length}] ALL RETRIES FAILED for ${image.filename}:`);
        console.error(`[Gemini Vision] Final error:`, error?.message || error);
        // Return error result instead of generic fallback
        return {
          filename: image.filename,
          category: "General",
          captions: [],
          extendedPost: "",
          music: [],
          stickers: [],
          error: `AI analysis failed: ${error?.message || 'Unknown error'}. Please try uploading this file again.`
        } as ImageAnalysisResult;
      }
    })
  );

  const results = await Promise.all(analysisPromises);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Gemini Vision] Completed ${results.length} images in ${elapsed}s (parallel processing)`);

  return results;
}

async function analyzeSingleImage(base64: string, filename: string, generationNote?: string): Promise<ImageAnalysisResult> {
  let cleanBase64 = base64;
  let mimeType = "image/jpeg";
  
  if (base64.startsWith('data:')) {
    const match = base64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      cleanBase64 = match[2];
    } else {
      cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
    }
  }

  const contextSection = generationNote ? `
USER CONTEXT/THEME: "${generationNote}"
Use this context to inform the tone and theme of ALL captions. The captions should still be unique to the image content, but incorporate the user's intended theme or purpose. For example, if the user says "wife's birthday celebration", the captions should have a celebratory, appreciative tone even if the image itself doesn't explicitly show a party.

` : '';
  
  const prompt = `Analyze this specific image carefully for an Instagram content creator. Describe what you see in the image and create unique, personalized captions based on the actual visual content.
${contextSection}
${VOICE_GUIDELINES}

Categories to choose from: ${CATEGORIES.join(", ")}

IMPORTANT: Your response must be unique to THIS specific image. Look at the people, setting, activities, and mood in the image.${generationNote ? ` Incorporate the user's theme/context into the captions while keeping them relevant to the image.` : ''}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "category": "detected category from the list above based on image content",
  "captions": [
    {"id": "c1", "tone": "tone name", "text": "unique caption under 50 words describing THIS image", "hashtags": ["#relevant1", "#relevant2", "#relevant3"]},
    {"id": "c2", "tone": "different tone", "text": "different unique caption under 50 words", "hashtags": ["#different1", "#different2", "#different3"]},
    {"id": "c3", "tone": "third tone", "text": "third unique caption under 50 words", "hashtags": ["#unique1", "#unique2", "#unique3"]}
  ],
  "extendedPost": "extended caption under 100 words specifically about this image",
  "music": ["song that fits this image", "another fitting song", "third song option"],
  "stickers": ["relevant emoji", "another emoji", "third emoji"]
}`;

  console.log(`[Gemini Vision] Analyzing image: ${filename}, mimeType: ${mimeType}, base64 length: ${cleanBase64.length}`);
  
  const result = await genAI.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { 
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          }
        ]
      }
    ],
    config: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  });
  
  const text = result.text || "";
  console.log(`[Gemini Vision] Raw response for ${filename}:`, text.substring(0, 300));
  
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (parseError: any) {
    console.error(`[Gemini Vision] JSON parse error for ${filename}:`, parseError.message);
    
    let cleanedText = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0]
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      
      try {
        parsed = JSON.parse(jsonStr);
        console.log(`[Gemini Vision] Fallback parsing succeeded for ${filename}`);
      } catch (e) {
        console.error(`[Gemini Vision] Fallback parsing also failed for ${filename}`);
        throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
      }
    } else {
      throw new Error(`No JSON found in Gemini response: ${parseError.message}`);
    }
  }
  
  return {
    filename,
    category: CATEGORIES.includes(parsed.category) ? parsed.category : "General",
    captions: parsed.captions || [],
    extendedPost: parsed.extendedPost || "",
    music: parsed.music || [],
    stickers: parsed.stickers || []
  };
}

// Streaming version that yields results as they complete
export async function* analyzeImageBatchStreaming(
  images: Array<{ base64: string; filename: string }>,
  generationNote?: string
): AsyncGenerator<{ index: number; total: number; result: ImageAnalysisResult }> {
  const limiter = createConcurrencyLimiter(CONCURRENCY_LIMIT);
  const total = images.length;

  console.log(`[Gemini Vision] Starting streaming analysis of ${total} images (max ${CONCURRENCY_LIMIT} concurrent)${generationNote ? ` with note: "${generationNote.substring(0, 30)}..."` : ""}`);
  const startTime = Date.now();

  // Create array to track completion order
  const completionQueue: Array<{ index: number; result: ImageAnalysisResult }> = [];
  let nextToYield = 0;
  let resolveWait: (() => void) | null = null;

  // Start all analyses
  const analysisPromises = images.map((image, index) =>
    limiter(async () => {
      try {
        const result = await analyzeWithRetry(image.base64, image.filename, 5, generationNote);
        console.log(`[Gemini Vision] [${index + 1}/${total}] Completed ${image.filename}: ${result.category}`);
        return { index, result };
      } catch (error: any) {
        console.error(`[Gemini Vision] [${index + 1}/${total}] FAILED ${image.filename}:`, error?.message);
        // Return error result instead of generic fallback - let user know analysis failed
        return {
          index,
          result: {
            filename: image.filename,
            category: "General",
            captions: [],
            extendedPost: "",
            music: [],
            stickers: [],
            error: `AI analysis failed: ${error?.message || 'Unknown error'}. Please try uploading this file again.`
          } as ImageAnalysisResult & { error?: string }
        };
      }
    }).then((completed) => {
      completionQueue.push(completed);
      completionQueue.sort((a, b) => a.index - b.index);
      if (resolveWait) resolveWait();
    })
  );

  // Yield results in order as they complete
  while (nextToYield < total) {
    // Check if we have the next result ready
    const readyIndex = completionQueue.findIndex(item => item.index === nextToYield);
    if (readyIndex !== -1) {
      const { index, result } = completionQueue.splice(readyIndex, 1)[0];
      yield { index, total, result };
      nextToYield++;
    } else {
      // Wait for more results
      await new Promise<void>((resolve) => {
        resolveWait = resolve;
      });
    }
  }

  // Wait for all to complete
  await Promise.all(analysisPromises);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Gemini Vision] Streaming complete: ${total} images in ${elapsed}s`);
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
