import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { callOpenRouter } from "@/lib/openrouter";
import { getFormatConfig } from "@/lib/formats";
import {
  BillingAccessError,
  beginGenerationSession,
  finalizeGenerationSession,
} from "@/lib/billing/service";
import type { GeneratedImage, ThumbnailSpec, ImageFormat, TextOverlay } from "@/types";

export const maxDuration = 180;

// ─── Rate limiter ─────────────────────────────────────────────────────────────
// In-memory store: maps key (userId or IP) → { count, resetAt }
const OPUS_MODEL = "anthropic/claude-opus-4.6";
const NANO_BANANA_MODEL = "google/gemini-3.1-flash-image-preview";
const NUM_OPUS_WORKERS = 12;
const MAX_GEMINI_CONCURRENT = 20;

// ─── Archetypes per format ────────────────────────────────────────────────────
interface Archetype {
  id: string;
  name: string;
  description: string;
  guidelines: string;
}

const YOUTUBE_ARCHETYPES: Archetype[] = [
  {
    id: "REACTION_FACE",
    name: "Reaction Close-Up",
    description: "Human face with extreme emotional expression fills 60–70% of the frame. Ultra-shallow depth of field.",
    guidelines: "Face slightly off-center. Mouth open or eyes wide. Background dissolved into bokeh. Leave darker zone on one side for text.",
  },
  {
    id: "ACTION_HERO",
    name: "Dynamic Action Shot",
    description: "Full or 3/4 body at peak action moment. Diagonal composition creates kinetic energy.",
    guidelines: "Subject on one third. Diagonal lines corner-to-corner. Explosive background. Bold text in quieter opposite corner.",
  },
  {
    id: "PERSON_POINTING",
    name: "Person Pointing at Callout",
    description: "Person gesturing toward a key text/number on the opposite side. Best for educational, lists, reveals.",
    guidelines: "Person on one third, key info on opposite third. Eyeline directs viewer to text.",
  },
  {
    id: "MYSTERY_DARK",
    name: "Mystery & Intrigue",
    description: "High-contrast dark atmospheric image. Shows just enough to spark curiosity.",
    guidelines: "Deep shadows with one bright focal point. One strong accent color. Cryptic minimal text.",
  },
  {
    id: "CINEMATIC_WIDE",
    name: "Cinematic Establishing Shot",
    description: "Wide shot with movie-poster composition. Subject in dramatic environment.",
    guidelines: "Subject center or lower third. Dramatic sky or environment above. Film-grade color grade.",
  },
  {
    id: "CLOSE_UP_REVEAL",
    name: "Dramatic Object / Detail",
    description: "Extreme close-up of key product, object, or concept. Dramatic rim/studio lighting.",
    guidelines: "Object centered, fills 40–60% of frame. Rim lighting creates separation. Dark gradient background.",
  },
  {
    id: "BEFORE_AFTER",
    name: "Before vs After Split",
    description: "Frame divided into two contrasting halves. Left = before/worse. Right = after/better.",
    guidelines: "Clear vertical split. Left: muted/dark. Right: vibrant/polished. Strong color contrast.",
  },
  {
    id: "EXPLOSIVE_COLLAGE",
    name: "High-Energy Collage",
    description: "Multiple overlapping elements in energetic layout with clear focal point.",
    guidelines: "Strong central focal point with supporting layers. Bold gradient background. Ultra-high saturation.",
  },
];

const INSTAGRAM_POST_ARCHETYPES: Archetype[] = [
  {
    id: "LIFESTYLE_SQUARE",
    name: "Lifestyle Centered",
    description: "Perfectly centered square composition. Subject fills the frame with rich, warm lifestyle lighting.",
    guidelines: "Dead-center composition. Negative space above for optional text. Clean background. Aspirational mood.",
  },
  {
    id: "EDITORIAL_SPLIT",
    name: "Editorial Split",
    description: "Bold typographic split. Half image, half color block. Magazine-cover energy.",
    guidelines: "Strong diagonal or vertical split. One half rich photography, other half bold flat color. Minimal text.",
  },
  {
    id: "TEXTURE_FLAT_LAY",
    name: "Flat Lay / Overhead",
    description: "Top-down overhead shot of objects, food, or products arranged artfully.",
    guidelines: "Perfect symmetry or deliberate asymmetry. All elements sharp. Neutral or linen background.",
  },
  {
    id: "PORTRAIT_MOOD",
    name: "Portrait Mood",
    description: "Close-up portrait with strong color grading and emotional depth.",
    guidelines: "Face centered or rule-of-thirds. Single strong backlight or rim. Cinematic color grade.",
  },
];

const INSTAGRAM_STORY_ARCHETYPES: Archetype[] = [
  {
    id: "VERTICAL_HERO",
    name: "Vertical Hero Shot",
    description: "Full-bleed vertical image. Subject fills center. Top 20% and bottom 20% are safe zones for text/buttons.",
    guidelines: "Subject in center vertical third. Blurred or gradient top/bottom for safe zone. Bold single image.",
  },
  {
    id: "SWIPE_UP_REVEAL",
    name: "Swipe-Up Reveal",
    description: "Mysterious partial reveal with arrow/swipe-up CTA at bottom.",
    guidelines: "Content revealed from bottom. Gradient fade at bottom. Strong curiosity-inducing crop at center.",
  },
  {
    id: "BOLD_TEXT_STORY",
    name: "Bold Text Overlay",
    description: "Strong typographic story. Background image or gradient with large readable text.",
    guidelines: "Background darkened for text contrast. Max 5 words large. Bottom CTA zone clear.",
  },
];

const TWITTER_ARCHETYPES: Archetype[] = [
  {
    id: "PANORAMIC_BRAND",
    name: "Panoramic Brand Statement",
    description: "Ultra-wide 3:1 cinematic sweep. Identity visible across the full width.",
    guidelines: "Center safe zone for profile overlap. Decorative elements at edges. Brand name in center-left.",
  },
  {
    id: "GRADIENT_IDENTITY",
    name: "Gradient Identity",
    description: "Bold gradient background with geometric or abstract brand elements.",
    guidelines: "Smooth gradient left-to-right. Geometric shapes overlaid. Minimal centered text.",
  },
];

const BLOG_ARCHETYPES: Archetype[] = [
  {
    id: "EDITORIAL_WIDE",
    name: "Editorial Wide",
    description: "Cinematic 2:1 header. Rich photography on right, typography breathing room on left.",
    guidelines: "Subject right-aligned. Left third deliberately darker/simpler for headline text overlay.",
  },
  {
    id: "CONCEPT_ILLUSTRATION",
    name: "Concept Illustration",
    description: "Abstract or conceptual visual that metaphorically represents the blog topic.",
    guidelines: "Single strong central metaphor. Clean background. Illustrative or painterly style welcome.",
  },
  {
    id: "PHOTO_TYPOGRAPHIC",
    name: "Photo + Typographic",
    description: "Strong photography with generous space for title text.",
    guidelines: "Bottom third gradient overlay for text. Image fills top 2/3. Dramatic lighting.",
  },
];

const CUSTOM_ARCHETYPES: Archetype[] = [
  {
    id: "CINEMATIC_HERO",
    name: "Cinematic Hero",
    description: "Movie-poster quality composition with dramatic lighting and strong subject.",
    guidelines: "Rule of thirds. Dramatic depth. Professional color grading. Clear focal point.",
  },
  {
    id: "MINIMAL_CLEAN",
    name: "Minimal & Clean",
    description: "Restrained, high-end minimal composition with generous white space.",
    guidelines: "Single subject centered. Lots of breathing room. Muted palette. Premium feel.",
  },
  {
    id: "BOLD_GRAPHIC",
    name: "Bold Graphic",
    description: "High-contrast graphic design with strong shapes and vivid color.",
    guidelines: "Flat or semi-flat design. Bold color blocking. Strong geometric shapes.",
  },
  {
    id: "DOCUMENTARY_REAL",
    name: "Documentary Real",
    description: "Authentic photojournalistic feel. Candid, gritty, real.",
    guidelines: "Natural light. Slight imperfection. Environmental context. Human moment.",
  },
];

function getArchetypes(format: ImageFormat): Archetype[] {
  switch (format) {
    case "youtube-thumbnail": return YOUTUBE_ARCHETYPES;
    case "instagram-post":    return INSTAGRAM_POST_ARCHETYPES;
    case "instagram-story":   return INSTAGRAM_STORY_ARCHETYPES;
    case "twitter-banner":    return TWITTER_ARCHETYPES;
    case "blog-header":       return BLOG_ARCHETYPES;
    case "custom":            return CUSTOM_ARCHETYPES;
  }
}

// ─── Async queue ──────────────────────────────────────────────────────────────
class SpecQueue {
  private items: ThumbnailSpec[] = [];
  private waiters: Array<(value: ThumbnailSpec | null) => void> = [];
  private closed = false;

  push(spec: ThumbnailSpec) {
    const waiter = this.waiters.shift();
    if (waiter) waiter(spec);
    else this.items.push(spec);
  }

  async take(): Promise<ThumbnailSpec | null> {
    if (this.items.length > 0) return this.items.shift()!;
    if (this.closed) return null;
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  close() {
    this.closed = true;
    for (const w of this.waiters.splice(0)) w(null);
  }
}

// ─── JSON extraction ──────────────────────────────────────────────────────────
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.search(/[{[]/);
  const end = raw.search(/[}\]]\s*$/);
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

// ─── Opus system prompt ───────────────────────────────────────────────────────
function buildSystemPrompt(
  format: ImageFormat,
  archetype: Archetype,
  previousSpecs: ThumbnailSpec[],
  config: { width: number; height: number; aspectRatio: string },
  index: number,
  total: number
): string {
  const prevContext =
    previousSpecs.length > 0
      ? `\nALREADY DESIGNED — DO NOT repeat these concepts, subjects, text, or colors:\n${previousSpecs
          .map((s, i) => `Spec ${i + 1}: "${s.imagePrompt.slice(0, 100)}..." | Text: "${s.textOverlay?.text ?? "none"}" | Style: ${s.style}`)
          .join("\n")}\n`
      : "";

  const canvasDesc = `${config.width}×${config.height} (${config.aspectRatio})`;

  const formatContext: Record<ImageFormat, string> = {
    "youtube-thumbnail": "YouTube thumbnail — must stop the scroll at 160×90px on mobile. CTR-optimized.",
    "instagram-post": "Instagram feed post — square canvas, highly visual, lifestyle/editorial quality.",
    "instagram-story": "Instagram Story — vertical full-bleed. Top 15% and bottom 20% are safe zones for UI.",
    "twitter-banner": "Twitter/X profile banner — ultra-wide panoramic. Center 60% most visible (avatar overlaps left).",
    "blog-header": "Blog article header — wide editorial image. Left or bottom area should have darker zone for title text overlay.",
    "custom": "Custom creative image — prioritize visual impact, clear composition, professional quality.",
  };

  return `You are a world-class visual art director and cinematographer. Design image spec ${index + 1} of ${total} for a generative AI image model.

FORMAT: ${formatContext[format]}
CANVAS: ${canvasDesc}
ARCHETYPE: ${archetype.name} — ${archetype.description}
Guidelines: ${archetype.guidelines}
${prevContext}
━━━ WRITING THE imagePrompt (TARGET: ~200 WORDS) ━━━
Follow Google's official template for photorealistic image generation:

1. INTENT (1 sentence): State the purpose — "A CTR-optimized YouTube thumbnail for [topic]..."
2. SHOT TYPE + SUBJECT (2-3 sentences): Exact shot type (extreme close-up, 3/4 body, wide establishing, overhead flat-lay, etc.) + hyper-specific subject description with micro-details (skin texture, clothing fabric, object material, expression nuance)
3. ACTION + EXPRESSION (1-2 sentences): What is happening at the exact frozen moment
4. ENVIRONMENT (2 sentences): Specific location with rich contextual detail — NOT "a room" but "a cluttered Tokyo neon-lit underground gaming den with RGB peripherals"
5. DEPTH LAYERS (1 sentence): Foreground element / midground subject / background atmosphere
6. TEXTURE EMPHASIS (1-2 sentences): Key surfaces — pores, sweat, fabric weave, reflections, imperfections that make it feel real
7. TEXT ZONE (1 sentence): Describe an intentionally darker/simpler area for text if relevant
8. MOOD TRIGGER (1 sentence): The visceral emotion that hits in 0.3 seconds

━━━ SEPARATE STRUCTURED FIELDS ━━━
lightingSetup: Named professional setup + position + quality (e.g. "Rembrandt lighting — hard key light from camera-left at 45°, deep fill shadow, warm practical rim from behind")
colorGrade: Specific film/cinematic grade (e.g. "teal-orange Hollywood blockbuster grade", "bleach bypass desaturated grit", "warm golden hour Kodak Portra 400")
cinemaReference: One specific cinematographer or film (e.g. "Roger Deakins — Blade Runner 2049", "Emmanuel Lubezki — Children of Men")
focalPoint: Exact zone where the eye lands first (e.g. "left eye of the subject, sharp at f/1.4")

━━━ NEGATIVE PROMPT (semantic — describe desired scene state) ━━━
Write what the scene IS (not what to avoid). E.g. instead of "no blur" → "every surface is tack-sharp with intentional cinematic depth". At least 30 words.

━━━ STANDARDS ━━━
- Commercial photography / magazine editorial quality — NOT stock photo, NOT AI-generic plastic look
- Every detail must be specific enough to paint — "red jacket" is banned, "faded crimson bomber jacket with worn-out cuffs" is correct
- Text overlay: 2–5 bold words maximum. Omit entirely if not appropriate for this format.

Output ONLY raw JSON, no markdown fences:
{"imagePrompt":"[~200 word narrative following the template above]","textOverlay":{"text":"BOLD WORDS","position":"top-left|top-center|top-right|center|bottom-left|bottom-center|bottom-right","color":"#FFFFFF","strokeColor":"#000000"},"lightingSetup":"[named professional setup]","colorGrade":"[specific cinematic grade]","cinemaReference":"[cinematographer — film]","focalPoint":"[exact focal zone]","negativePrompt":"[30+ word semantic description of desired scene state]","colorPalette":["#hex1","#hex2","#hex3","#hex4"],"composition":"[detailed spatial layout]","style":"[specific visual style]","targetType":"thumbnail"}

If no text overlay is appropriate, omit the textOverlay field entirely.`;
}

// ─── Thinking sentence builder ────────────────────────────────────────────────
function buildThinkingSentence(archetype: Archetype, spec: ThumbnailSpec, index: number): string {
  const openers = [
    `Opening shot —`,
    `Next concept —`,
    `Going darker here —`,
    `Switching energy —`,
    `Contrasting angle —`,
    `Pushing it further —`,
    `Bold pivot —`,
    `Different world —`,
    `Dialing up tension —`,
    `Final concept —`,
  ];
  const opener = openers[index] ?? `Concept ${index + 1} —`;

  const parts: string[] = [];

  // Lead with archetype identity
  parts.push(`${opener} ${archetype.name.toLowerCase()}.`);

  // Cinematic reference or style
  if (spec.cinemaReference) {
    parts.push(`Shooting ${spec.cinemaReference} style.`);
  } else if (spec.style) {
    parts.push(`${spec.style}.`);
  }

  // Lighting decision
  if (spec.lightingSetup) {
    // Shorten to first clause only (before "—" or comma)
    const lightShort = spec.lightingSetup.split(/[—,]/)[0].trim();
    parts.push(`${lightShort}.`);
  }

  // Color grade
  if (spec.colorGrade) {
    parts.push(`${spec.colorGrade} grade.`);
  }

  // Focal point or composition
  if (spec.focalPoint) {
    parts.push(`Eye lands on ${spec.focalPoint}.`);
  } else if (spec.composition) {
    const compShort = spec.composition.split(/[.,]/)[0].trim();
    parts.push(`${compShort}.`);
  }

  // Text overlay hint
  if (spec.textOverlay?.text) {
    parts.push(`"${spec.textOverlay.text}" in ${spec.textOverlay.fontFamily ?? "Anton"}.`);
  }

  return parts.join(" ") + " ";
}

function normalizeTextOverlay(raw: unknown): TextOverlay | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const t = raw as Record<string, unknown>;
  const text = typeof t.text === "string" ? t.text.trim() : "";
  if (!text) return undefined;
  return {
    text,
    position: typeof t.position === "string" ? t.position : "bottom-center",
    color: typeof t.color === "string" ? t.color : "#FFFFFF",
    strokeColor: typeof t.strokeColor === "string" ? t.strokeColor : undefined,
    fontFamily: typeof t.fontFamily === "string" ? t.fontFamily : undefined,
  };
}

/** Coerce partial / malformed Opus JSON into a safe ThumbnailSpec (avoids runtime throws in buildGeminiPrompt). */
function normalizeThumbnailSpec(raw: unknown): ThumbnailSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const imagePrompt = typeof o.imagePrompt === "string" ? o.imagePrompt.trim() : "";
  if (!imagePrompt) return null;

  const str = (key: string, fallback: string) => {
    const v = o[key];
    return typeof v === "string" && v.trim() ? v.trim() : fallback;
  };

  let colorPalette: string[] = [];
  if (Array.isArray(o.colorPalette)) {
    colorPalette = o.colorPalette.filter((c): c is string => typeof c === "string" && c.trim().length > 0);
  }

  return {
    imagePrompt,
    textOverlay: normalizeTextOverlay(o.textOverlay),
    lightingSetup: str("lightingSetup", "Professional three-point lighting with cinematic separation"),
    colorGrade: str("colorGrade", "professional cinematic color grade"),
    cinemaReference: str("cinemaReference", ""),
    focalPoint: str("focalPoint", "center subject"),
    negativePrompt: str(
      "negativePrompt",
      "Every element is rendered with tack-sharp precision, authentic textures, and cinematic depth"
    ),
    colorPalette,
    composition: str("composition", "Balanced rule-of-thirds layout with clear focal hierarchy"),
    style: str("style", "High-end commercial photography"),
    targetType: "thumbnail",
  };
}

// ─── Spec builders ────────────────────────────────────────────────────────────
async function buildSingleSpec(
  prompt: string,
  format: ImageFormat,
  archetype: Archetype,
  previousSpecs: ThumbnailSpec[],
  config: { width: number; height: number; aspectRatio: string },
  index: number,
  total: number,
  onThinking?: (text: string) => void,
  referenceImage?: string | null
): Promise<ThumbnailSpec | null> {
  try {
    // Build user message — include reference image as vision attachment if provided
    const userContent = referenceImage
      ? ([
          {
            type: "image_url",
            image_url: { url: referenceImage },
          },
          {
            type: "text",
            text: `Create an image for: ${prompt}\n\nReference image attached above — extract ONLY the abstract visual qualities: color palette, lighting style, overall mood, and atmospheric energy. DO NOT describe, reference, or incorporate any people, faces, body features, or identifiable subjects from the reference image. Your imagePrompt must describe entirely original subjects and scenes. Only the color palette, lighting tone, and general visual mood should be inspired by the reference.`,
          },
        ] as import("@/lib/openrouter").ContentPart[])
      : `Create an image for: ${prompt}`;

    const response = await callOpenRouter({
      model: OPUS_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(format, archetype, previousSpecs, config, index, total) },
        { role: "user", content: userContent },
      ],
      temperature: 0.9,
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch {
      console.error(`Opus spec ${index}: invalid JSON from model`);
      return null;
    }
    const spec = normalizeThumbnailSpec(parsed);
    if (!spec) {
      console.error(`Opus spec ${index}: could not normalize spec`);
      return null;
    }
    spec.targetType = "thumbnail";
    onThinking?.(buildThinkingSentence(archetype, spec, index));
    return spec;
  } catch (e) {
    console.error(`Opus spec ${index} failed:`, e);
    return null;
  }
}

// ─── Parallel Opus workers ────────────────────────────────────────────────────
async function runOpusWorkers(
  prompt: string,
  format: ImageFormat,
  count: number,
  config: { width: number; height: number; aspectRatio: string },
  queue: SpecQueue,
  onThinking?: (text: string) => void,
  referenceImage?: string | null
): Promise<void> {
  const archetypes = getArchetypes(format);
  const numWorkers = Math.min(NUM_OPUS_WORKERS, count);

  await Promise.all(
    Array.from({ length: numWorkers }, async (_, w) => {
      const start = Math.floor((w * count) / numWorkers);
      const end = Math.floor(((w + 1) * count) / numWorkers);
      const archetypeOffset = w;
      const workerSpecs: ThumbnailSpec[] = [];

      for (let i = start; i < end; i++) {
        const archetypeIdx = (archetypeOffset + (i - start)) % archetypes.length;
        const spec = await buildSingleSpec(
          prompt,
          format,
          archetypes[archetypeIdx],
          workerSpecs,
          config,
          i,
          count,
          onThinking,
          referenceImage
        );
        if (spec) {
          workerSpecs.push(spec);
          queue.push(spec);
        }
      }
    })
  );
}

// ─── Concurrent Gemini workers ────────────────────────────────────────────────
async function runGeminiWorkers(
  queue: SpecQueue,
  prompt: string,
  aspectRatio: string,
  onImage: (image: GeneratedImage) => void,
  maxConcurrent: number,
  referenceImage?: string | null
): Promise<void> {
  let specIdx = 0;

  const worker = async () => {
    while (true) {
      const spec = await queue.take();
      if (!spec) break;
      const idx = specIdx++;
      const image = await generateImage(spec, prompt, aspectRatio, idx, referenceImage);
      if (image) onImage(image);
    }
  };

  await Promise.all(Array.from({ length: maxConcurrent }, worker));
}

// ─── Gemini prompt builder ────────────────────────────────────────────────────
function buildGeminiPrompt(spec: ThumbnailSpec, aspectRatio: string): string {
  const textBlock = spec.textOverlay
    ? `\nTEXT RENDERING: Render the exact text "${spec.textOverlay.text}" in the ${spec.textOverlay.position} zone. Bold condensed sans-serif, large and clearly readable. Fill color: ${spec.textOverlay.color}. Stroke/outline: ${spec.textOverlay.strokeColor ?? "#000000"} at 4px for legibility. Text must be crisp, not blurry.`
    : "";

  const paletteLine =
    Array.isArray(spec.colorPalette) && spec.colorPalette.length > 0
      ? spec.colorPalette.join(", ")
      : "cohesive palette aligned with the color grade above";

  return `Create a hyper-realistic, cinematic ${aspectRatio} image at 4K resolution.

━━━ VISUAL NARRATIVE ━━━
${spec.imagePrompt || ""}
${textBlock}

━━━ LIGHTING ━━━
${spec.lightingSetup || "Professional three-point lighting with cinematic separation"}

━━━ CINEMATIC REFERENCE ━━━
${spec.cinemaReference ? `Render in the visual style of ${spec.cinemaReference}` : "Commercial photography quality"}

━━━ COLOR GRADE ━━━
Apply a ${spec.colorGrade || "professional cinematic color grade"} to the final image.

━━━ COLOR PALETTE ━━━
Dominant colors: ${paletteLine}

━━━ COMPOSITION & FOCAL POINT ━━━
Layout: ${spec.composition || "Balanced rule-of-thirds layout with clear focal hierarchy"}
Primary focal point: ${spec.focalPoint || "center subject"}

━━━ STYLE ━━━
${spec.style || "High-end commercial photography"}

━━━ SCENE QUALITY ━━━
${spec.negativePrompt || "Every element is rendered with tack-sharp precision, authentic textures, and cinematic depth"}

━━━ RENDERING STANDARD ━━━
Ultra-sharp 4K. Authentic imperfections preserved (skin texture, material grain, environmental depth). No flat lighting. No plastic AI look. No watermarks. Premium commercial/editorial quality.`;
}

// ─── Image generator ──────────────────────────────────────────────────────────
async function generateImage(
  spec: ThumbnailSpec,
  prompt: string,
  aspectRatio: string,
  index: number,
  referenceImage?: string | null
): Promise<GeneratedImage | null> {
  try {
    // When a reference image is provided, send it alongside the text prompt
    // so Gemini can use it as a visual style/composition anchor
    const geminiContent = referenceImage
      ? ([
          {
            type: "image_url",
            image_url: { url: referenceImage },
          },
          {
            type: "text",
            text: buildGeminiPrompt(spec, aspectRatio) +
              "\n\nSTYLE REFERENCE ONLY — DO NOT COPY SUBJECTS: The image above is provided ONLY as an abstract visual reference for color palette, lighting mood, and atmosphere. DO NOT reproduce, replicate, or reference any people, faces, body features, skin tones, or identifiable subjects from this image. DO NOT treat this as an 'edit this image' instruction. Generate a completely ORIGINAL scene per the detailed specs above — only inherit the abstract qualities: color temperature, lighting feel, and general mood. The resulting image must contain entirely new subjects and composition.",
          },
        ] as import("@/lib/openrouter").ContentPart[])
      : buildGeminiPrompt(spec, aspectRatio);

    const response = await callOpenRouter({
      model: NANO_BANANA_MODEL,
      messages: [{ role: "user", content: geminiContent }],
      modalities: ["image", "text"],
      image_config: {
        aspect_ratio: aspectRatio as "16:9" | "1:1" | "9:16" | "3:1" | "2:1" | "21:9" | "5:4" | "4:5" | "4:3" | "3:4" | "3:2" | "2:3",
        image_size: "4K",
      },
    });

    const msg = response.choices[0]?.message;
    const images = msg?.images ?? [];
    const first = images[0] as unknown as Record<string, unknown> | undefined;
    if (!first) return null;

    const snake = first["image_url"] as { url?: string } | undefined;
    const camel = first["imageUrl"] as { url?: string } | undefined;
    const imageUrl = snake?.url ?? camel?.url;
    if (!imageUrl) return null;

    return {
      id: `img-${Date.now()}-${index}`,
      url: imageUrl,
      prompt,
      type: "thumbnail",
      width: 0,
      height: 0,
    };
  } catch (err) {
    console.error(`Gemini image ${index} failed:`, err);
    return null;
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── Auth + rate limit ────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in and activate a paid plan before generating." },
      { status: 401 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const fingerprint =
    req.headers.get("x-pensil-fingerprint") ??
    req.headers.get("user-agent") ??
    "unknown-device";

  const { prompt, format, customRatio, count, referenceImage } = (await req.json()) as {
    prompt: string;
    format: ImageFormat;
    customRatio?: string;
    count?: number;
    referenceImage?: string | null;
  };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  // Validate API key is configured
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not set");
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  const config = getFormatConfig(format ?? "youtube-thumbnail", customRatio);
  const generationCount = Math.min(Math.max(count ?? 4, 1), 10);
  let session;

  try {
    session = await beginGenerationSession({
      userId,
      ip,
      fingerprint,
      prompt,
      generationCount,
    });
  } catch (error) {
    if (error instanceof BillingAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let generatedCount = 0;
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* client disconnected */ }
      };

      try {
        send({ type: "billing", balance: session.balance });
        const queue = new SpecQueue();
        const maxGemini = Math.min(MAX_GEMINI_CONCURRENT, generationCount);

        const geminiDone = runGeminiWorkers(queue, prompt, config.aspectRatio, (image) => {
          generatedCount += 1;
          send({ type: "image", image });
        }, maxGemini, referenceImage);

        await runOpusWorkers(prompt, format ?? "youtube-thumbnail", generationCount, config, queue, (text) => {
          send({ type: "thinking", text });
        }, referenceImage);
        queue.close();
        await geminiDone;

        const updatedStatus = await finalizeGenerationSession({
          eventId: session.usageEvent.id,
          userId,
          actualImageCount: generatedCount,
        });
        send({ type: "billing", balance: updatedStatus.balance });
        send({ type: "done" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Generation failed";
        console.error("Pipeline error:", msg);
        const updatedStatus = await finalizeGenerationSession({
          eventId: session.usageEvent.id,
          userId,
          actualImageCount: generatedCount,
          failureReason: msg,
        }).catch(() => null);
        if (updatedStatus?.balance) {
          send({ type: "billing", balance: updatedStatus.balance });
        }
        send({ type: "error", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Credit-Reserved": String(session.estimatedCredits),
      "X-Credit-Remaining": String(session.balance.remainingCredits),
    },
  });
}
