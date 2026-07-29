"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import type { ImageFormat } from "@/types";

const SUGGESTIONS: Record<ImageFormat, string[]> = {
  "youtube-thumbnail": [
    "Cooking vlog with close-up food shots",
    "Minimalist tech review setup",
    "Before and after fitness transformation",
    "Cinematic travel montage",
    "Coding tutorial with dark IDE",
    "Product launch announcement",
  ],
  "instagram-post": [
    "Golden hour lifestyle coffee flat lay",
    "Minimal skincare product editorial",
    "Workout motivation portrait",
    "Aesthetic travel destination shot",
    "Food styling overhead pasta dish",
    "Fashion lookbook street style",
  ],
  "instagram-story": [
    "Bold sale announcement with countdown",
    "Behind-the-scenes studio sneak peek",
    "Q&A question sticker template",
    "New product drop teaser",
    "Motivational quote gradient story",
    "Event invitation vertical poster",
  ],
  "twitter-banner": [
    "Developer portfolio personal brand",
    "Startup company modern header",
    "Podcast brand wide banner",
    "Creator channel identity banner",
    "Agency services header",
    "Tech conference event banner",
  ],
  "blog-header": [
    "Beginner's guide to investing",
    "Ultimate productivity system",
    "How to build a morning routine",
    "Web development trends 2025",
    "Remote work home office setup",
    "Healthy meal prep for the week",
  ],
  "custom": [
    "Futuristic cityscape at night",
    "Cozy autumn reading corner",
    "Abstract geometric wallpaper",
    "Dramatic mountain landscape",
    "Neon-lit rainy street portrait",
    "Studio product on white background",
  ],
};

export default function SuggestionChips() {
  const { setPrompt, format } = useStore();
  const suggestions = SUGGESTIONS[format] ?? SUGGESTIONS["youtube-thumbnail"];

  const handleChipClick = (s: string) => {
    setPrompt(s);
    // Dispatch a focus event so ChatBar's input gets focused
    window.dispatchEvent(new CustomEvent("pensil-focus-input"));
  };

  return (
    <motion.div
      key={format}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="flex flex-wrap justify-center gap-2 mt-6 max-w-lg"
    >
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => handleChipClick(s)}
          className="px-3 py-1.5 text-xs text-zinc-700 bg-white/40 border border-zinc-400/30 rounded-lg hover:text-zinc-900 hover:bg-white/60 hover:border-zinc-400/50 backdrop-blur-sm transition-colors"
        >
          {s}
        </button>
      ))}
    </motion.div>
  );
}
