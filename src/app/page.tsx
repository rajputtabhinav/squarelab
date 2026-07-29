"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { FORMAT_CONFIGS } from "@/lib/formats";
import ChatBar from "@/components/ChatBar";
import ThumbnailGrid from "@/components/ThumbnailGrid";
import SuggestionChips from "@/components/SuggestionChips";
import GeneratingState from "@/components/GeneratingState";
import SelectionBar from "@/components/SelectionBar";
import GradientBg from "@/components/GradientBg";

export default function Home() {
  const { status, isStreaming, thumbnails, format, prompt, generationCount } =
    useStore();
  const isIdle = status === "idle";
  const hasImages = thumbnails.length > 0;
  const formatLabel = FORMAT_CONFIGS[format]?.label ?? "Images";

  const resultsRef = useRef<HTMLDivElement>(null);

  // Nudge down just enough to show reasoning + peek at skeleton,
  // keeping the ChatBar visible at the top
  useEffect(() => {
    if (status === "generating") {
      setTimeout(() => {
        window.scrollTo({ top: window.innerHeight * 0.42, behavior: "smooth" });
      }, 80);
    } else if (status === "idle") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [status]);

  return (
    <main className="relative min-h-screen flex flex-col overflow-x-hidden">

      {/* ── Gradient background — always full opacity, fixed ── */}
      <GradientBg />

      {/* ── Hero section — always full height, always visible ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-zinc-900">
            pensil.io
          </h1>
          <p className="text-zinc-600 text-base">thinks before it creates</p>
        </motion.div>

        <div className="w-full max-w-2xl">
          <ChatBar />
        </div>

        {/* Suggestion chips — only shown when idle */}
        <AnimatePresence>
          {isIdle && (
            <motion.div
              key="chips"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SuggestionChips />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll hint — subtle arrow when generating */}
        <AnimatePresence>
          {!isIdle && (
            <motion.div
              key="scroll-hint"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="absolute bottom-8 flex flex-col items-center gap-1"
            >
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="w-4 h-4 text-zinc-400"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 3v10M4 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Results section — always in DOM, scrolled to when generation starts ── */}
      <section
        ref={resultsRef}
        className="min-h-screen px-4 md:px-8 pt-10 pb-24 flex flex-col"
      >
        <AnimatePresence mode="wait">
          {status === "generating" && !hasImages && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GeneratingState />
            </motion.div>
          )}

          {hasImages && (
            <motion.div
              key="images"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Streaming progress bar */}
              <AnimatePresence>
                {isStreaming && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 mb-5 max-w-6xl"
                  >
                    <Loader2 size={13} className="animate-spin text-zinc-500 shrink-0" />
                    <div className="flex-1 h-1 bg-zinc-800/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-zinc-600 rounded-full"
                        animate={{
                          width: `${Math.round((thumbnails.length / generationCount) * 100)}%`,
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 tabular-nums shrink-0">
                      {thumbnails.length}/{generationCount}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isStreaming && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-zinc-500 mb-5"
                >
                  {thumbnails.length} {formatLabel.toLowerCase()} for &ldquo;{prompt}&rdquo;
                  <span className="ml-2 text-zinc-600">&middot; click to select</span>
                </motion.p>
              )}

              <div className="max-w-6xl">
                <ThumbnailGrid thumbnails={thumbnails} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <SelectionBar />
    </main>
  );
}
