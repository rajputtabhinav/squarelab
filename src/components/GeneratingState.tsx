"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";

const ASPECT_CLASS: Record<string, string> = {
  "youtube-thumbnail": "aspect-video",
  "instagram-post": "aspect-square",
  "instagram-story": "aspect-[9/16]",
  "twitter-banner": "aspect-[3/1]",
  "blog-header": "aspect-[2/1]",
  "custom": "aspect-video",
};

export default function GeneratingState() {
  const { generationCount, format } = useStore();
  const aspectClass = ASPECT_CLASS[format] ?? "aspect-video";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: generationCount }).map((_, i) => (
          <div
            key={i}
            className={`relative ${aspectClass} rounded-xl bg-zinc-900/20 border border-zinc-800/20 overflow-hidden backdrop-blur-sm`}
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
              style={{ animationDelay: `${(i % 8) * 150}ms` }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
