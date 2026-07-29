import type { ImageFormat, FormatConfig } from "@/types";

export const FORMAT_CONFIGS: Record<ImageFormat, FormatConfig> = {
  "youtube-thumbnail": {
    label: "YouTube Thumbnail",
    shortLabel: "YouTube",
    aspectRatio: "16:9",
    width: 3840,
    height: 2160,
    placeholder: "What's this video about?",
    description: "16:9 · 3840×2160 · 4K",
  },
  "instagram-post": {
    label: "Instagram Post",
    shortLabel: "Instagram",
    aspectRatio: "1:1",
    width: 4096,
    height: 4096,
    placeholder: "What's this post about?",
    description: "1:1 · 4096×4096 · 4K",
  },
  "instagram-story": {
    label: "Instagram Story",
    shortLabel: "Story",
    aspectRatio: "9:16",
    width: 2160,
    height: 3840,
    placeholder: "What's this story about?",
    description: "9:16 · 2160×3840 · 4K",
  },
  "twitter-banner": {
    label: "Twitter/X Banner",
    shortLabel: "Twitter/X",
    aspectRatio: "3:1",
    width: 3840,
    height: 1280,
    placeholder: "Describe your Twitter/X banner...",
    description: "3:1 · 3840×1280 · 4K",
  },
  "blog-header": {
    label: "Blog Header",
    shortLabel: "Blog",
    aspectRatio: "2:1",
    width: 3840,
    height: 1920,
    placeholder: "What's this blog post about?",
    description: "2:1 · 3840×1920 · 4K",
  },
  custom: {
    label: "Custom",
    shortLabel: "Custom",
    aspectRatio: "1:1",
    width: 4096,
    height: 4096,
    placeholder: "Describe the image you want...",
    description: "Custom ratio · 4K",
  },
};

const SUPPORTED_RATIOS = ["21:9", "16:9", "9:16", "5:4", "4:5", "4:3", "3:4", "3:2", "2:3", "3:1", "2:1", "1:1"] as const;
type SupportedRatio = (typeof SUPPORTED_RATIOS)[number];

export function parseCustomRatio(input: string): SupportedRatio {
  const clean = input.trim().replace(/\s/g, "");
  if (SUPPORTED_RATIOS.includes(clean as SupportedRatio)) {
    return clean as SupportedRatio;
  }

  const parts = clean.split(":");
  if (parts.length === 2) {
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (!isNaN(w) && !isNaN(h) && h > 0) {
      const target = w / h;
      let best: SupportedRatio = "1:1";
      let bestDiff = Infinity;
      for (const r of SUPPORTED_RATIOS) {
        const [rw, rh] = r.split(":").map(Number);
        const diff = Math.abs(rw / rh - target);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = r;
        }
      }
      return best;
    }
  }

  return "1:1";
}

export function getFormatConfig(format: ImageFormat, customRatio?: string): FormatConfig {
  const config = { ...FORMAT_CONFIGS[format] };
  if (format === "custom" && customRatio) {
    config.aspectRatio = parseCustomRatio(customRatio);
    config.description = `${config.aspectRatio} · Custom`;
  }
  return config;
}
