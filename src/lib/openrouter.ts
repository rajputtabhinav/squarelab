const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export interface OpenRouterImageConfig {
  aspect_ratio?: "21:9" | "16:9" | "9:16" | "5:4" | "4:5" | "4:3" | "3:4" | "3:2" | "2:3" | "1:1" | "3:1" | "2:1";
  image_size?: "0.5K" | "1K" | "2K" | "4K";
}

export interface OpenRouterOptions {
  model: string;
  messages: OpenRouterMessage[];
  modalities?: ("text" | "image")[];
  response_format?: { type: "json_object" };
  temperature?: number;
  image_config?: OpenRouterImageConfig;
}

export interface OpenRouterImageResult {
  image_url: { url: string };
}

export interface OpenRouterResponse {
  choices: {
    message: {
      content?: string;
      images?: OpenRouterImageResult[];
    };
  }[];
}

export async function callOpenRouter(
  options: OpenRouterOptions
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const body: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
  };

  if (options.modalities) {
    body.modalities = options.modalities;
  }
  if (options.response_format) {
    body.response_format = options.response_format;
  }
  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  if (options.image_config) {
    body.image_config = options.image_config;
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://pensil.io",
      "X-Title": "pensil.io",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    if (res.status === 401) throw new Error("OpenRouter: Invalid API key");
    if (res.status === 402) throw new Error("OpenRouter: Insufficient credits");
    if (res.status === 429) throw new Error("OpenRouter: Rate limit exceeded");
    throw new Error(`OpenRouter error ${res.status}: ${errorText}`);
  }

  return res.json() as Promise<OpenRouterResponse>;
}
