"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

// Characters per interval tick — tune for feel
const CHARS_PER_TICK = 3;
const TICK_MS = 18; // ~167 chars/sec

export default function ReasoningBlock() {
  const { reasoningText, status } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // displayedText is the animated subset of reasoningText
  const [displayedText, setDisplayedText] = useState("");
  const targetRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep targetRef in sync with the latest reasoningText
  useEffect(() => {
    targetRef.current = reasoningText;
  }, [reasoningText]);

  // Start / continue the typewriter whenever reasoningText grows
  useEffect(() => {
    // Reset on new generation (reasoningText goes back to "")
    if (reasoningText === "") {
      setDisplayedText("");
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Only start a new ticker if we don't have one running
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      setDisplayedText((current) => {
        const target = targetRef.current;
        if (current.length >= target.length) {
          // Caught up — stop ticking
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return current;
        }
        return target.slice(0, current.length + CHARS_PER_TICK);
      });
    }, TICK_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reasoningText]);

  // When new text arrives while ticker has stopped (e.g. second spec arrives),
  // restart the ticker
  useEffect(() => {
    if (
      reasoningText.length > displayedText.length &&
      !timerRef.current
    ) {
      timerRef.current = setInterval(() => {
        setDisplayedText((current) => {
          const target = targetRef.current;
          if (current.length >= target.length) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return current;
          }
          return target.slice(0, current.length + CHARS_PER_TICK);
        });
      }, TICK_MS);
    }
  }, [reasoningText, displayedText]);

  // Auto-scroll to bottom as displayed text grows
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [displayedText]);

  const isThinking = status === "generating";
  const hasText = reasoningText.length > 0;
  const isTyping = displayedText.length < reasoningText.length;
  const visible = hasText || isThinking;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 12 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full max-w-2xl overflow-hidden"
        >
          <div className="border-l-2 border-zinc-800 pl-3">
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] text-zinc-600 italic tracking-wide">
                thinking
              </span>
              {(isThinking || isTyping) && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block w-1 h-1 rounded-full bg-zinc-600"
                />
              )}
            </div>

            {/* Scrollable typewriter text */}
            <div
              ref={scrollRef}
              className="max-h-28 overflow-y-auto scrollbar-hide"
            >
              <p className="text-[13px] leading-relaxed text-zinc-500 font-light">
                {hasText ? (
                  <>
                    {displayedText}
                    {/* Blinking cursor — shown while typing or still generating */}
                    {(isTyping || isThinking) && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                        className="inline-block w-[2px] h-[13px] bg-zinc-500 ml-[1px] align-middle"
                      />
                    )}
                  </>
                ) : (
                  <motion.span
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-zinc-700"
                  >
                    Designing concepts...
                  </motion.span>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
