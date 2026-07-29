"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useStore } from "@/store/useStore";
import { FORMAT_CONFIGS, parseCustomRatio } from "@/lib/formats";
import type { ImageFormat } from "@/types";

const FORMAT_ORDER: ImageFormat[] = [
  "youtube-thumbnail",
  "instagram-post",
  "instagram-story",
  "twitter-banner",
  "blog-header",
  "custom",
];

const RATIO_PRESETS = ["16:9", "1:1", "9:16", "4:3", "3:2", "2:1", "3:1", "21:9"];

export default function FormatPicker() {
  const { format, setFormat, customRatio, setCustomRatio, status } = useStore();
  const [open, setOpen] = useState(false);
  const [ratioInput, setRatioInput] = useState(customRatio ?? "");
  const [ratioError, setRatioError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isGenerating = status === "generating";

  const currentConfig = FORMAT_CONFIGS[format];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFormatSelect = (f: ImageFormat) => {
    setFormat(f);
    if (f !== "custom") setOpen(false);
  };

  const handleRatioInput = (val: string) => {
    setRatioInput(val);
    setRatioError(false);
    if (val.includes(":")) {
      const resolved = parseCustomRatio(val);
      if (resolved !== "1:1" || val.trim() === "1:1") {
        setCustomRatio(resolved);
        setRatioError(false);
      }
    }
  };

  const handleRatioBlur = () => {
    if (ratioInput.trim()) {
      const resolved = parseCustomRatio(ratioInput);
      setCustomRatio(resolved);
      setRatioInput(resolved);
    }
  };

  const handlePresetRatio = (r: string) => {
    setRatioInput(r);
    setCustomRatio(r);
  };

  const displayLabel =
    format === "custom" && customRatio
      ? `Custom ${customRatio}`
      : currentConfig.shortLabel;

  return (
    <div className="relative shrink-0 max-w-[30vw] sm:max-w-none" ref={dropdownRef}>
      <button
        onClick={() => !isGenerating && setOpen((v) => !v)}
        disabled={isGenerating}
        className="flex max-w-full items-center gap-1.5 px-2.5 h-8 bg-zinc-800/60 hover:bg-zinc-700/60 rounded-lg text-xs font-medium text-zinc-300 transition-colors disabled:opacity-50 shrink-0"
      >
        <span className="max-w-[52px] truncate sm:max-w-[80px]">{displayLabel}</span>
        <ChevronDown
          size={12}
          className={`text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-56 max-w-[min(16rem,calc(100vw-2.5rem))] bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl shadow-black/30 z-50 overflow-hidden sm:max-w-none"
          >
            <div className="py-1.5">
              {FORMAT_ORDER.map((f) => {
                const cfg = FORMAT_CONFIGS[f];
                const isSelected = format === f;
                return (
                  <button
                    key={f}
                    onClick={() => handleFormatSelect(f)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium leading-tight">{cfg.label}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{cfg.description}</p>
                    </div>
                    {isSelected && <Check size={13} className="text-zinc-300 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {format === "custom" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-zinc-800"
                >
                  <div className="px-3 py-3">
                    <p className="text-[10px] text-zinc-500 mb-2">Aspect ratio</p>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {RATIO_PRESETS.map((r) => (
                        <button
                          key={r}
                          onClick={() => handlePresetRatio(r)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            customRatio === r
                              ? "bg-zinc-700 text-zinc-100"
                              : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={ratioInput}
                        onChange={(e) => handleRatioInput(e.target.value)}
                        onBlur={handleRatioBlur}
                        placeholder="e.g. 3:2"
                        className={`w-full bg-zinc-800 border rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:outline-none focus:ring-0 transition-colors ${
                          ratioError ? "border-red-500/50" : "border-zinc-700"
                        }`}
                      />
                      {ratioError && (
                        <p className="text-[10px] text-red-400 mt-1">
                          Invalid format - use W:H (e.g. 3:2)
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
