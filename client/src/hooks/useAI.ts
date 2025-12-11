import { useMutation } from "@tanstack/react-query";

interface CaptionData {
  captions: Array<{
    id: string;
    tone: string;
    text: string;
    hashtags: string[];
  }>;
  music: string[];
  stickers: string[];
}

interface GenerateCaptionsParams {
  contentDescription: string;
  category: string;
}

async function generateCaptions(params: GenerateCaptionsParams): Promise<CaptionData> {
  const response = await fetch("/api/generate-captions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error("Failed to generate captions");
  }
  return response.json();
}

interface AnalyticsQuery {
  query: string;
  analyticsData?: any;
}

async function analyzeContent(params: AnalyticsQuery): Promise<{ response: string }> {
  const response = await fetch("/api/analytics/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error("Failed to analyze content");
  }
  return response.json();
}

export function useGenerateCaptions() {
  return useMutation({
    mutationFn: generateCaptions,
  });
}

export function useAnalyzeContent() {
  return useMutation({
    mutationFn: analyzeContent,
  });
}
