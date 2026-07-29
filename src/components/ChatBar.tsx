"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, Plus, X, ImageIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { FORMAT_CONFIGS } from "@/lib/formats";
import FormatPicker from "./FormatPicker";
import ReasoningBlock from "./ReasoningBlock";

const COUNT_OPTIONS = [4, 8, 10];

interface Attachment {
  name: string;
  dataUrl: string;
  previewUrl: string;
}

export default function ChatBar() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const {
    generate,
    status,
    prompt: currentPrompt,
    reset,
    error,
    clearError,
    generationCount,
    setGenerationCount,
    format,
    history,
  } = useStore();

  const placeholder = FORMAT_CONFIGS[format]?.placeholder ?? "Describe the image you want...";
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isGenerating = status === "generating";
  const isIdle = status === "idle";

  const pastPrompts = history
    .map((r) => r.prompt)
    .filter((p, i, arr) => arr.indexOf(p) === i)
    .slice(0, 20);

  const filteredSuggestions = input.trim().length >= 2
    ? pastPrompts.filter((p) =>
        p.toLowerCase().includes(input.toLowerCase()) && p !== input
      ).slice(0, 6)
    : [];

  useEffect(() => { setInput(currentPrompt); }, [currentPrompt]);

  useEffect(() => {
    const handler = (e: CustomEvent<{ url: string; name: string }>) => {
      setAttachment({
        name: e.detail.name,
        dataUrl: e.detail.url,
        previewUrl: e.detail.url,
      });
    };
    window.addEventListener("pensil-set-ref", handler as EventListener);
    return () => window.removeEventListener("pensil-set-ref", handler as EventListener);
  }, []);

  useEffect(() => {
    const handler = () => inputRef.current?.focus();
    window.addEventListener("pensil-focus-input", handler);
    return () => window.removeEventListener("pensil-focus-input", handler);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showSuggestions) {
          setShowSuggestions(false);
          return;
        }
        if (!isIdle) reset();
        return;
      }
      if (
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isIdle, reset, showSuggestions]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(clearError, 4000);
      return () => clearTimeout(t);
    }
  }, [error, clearError]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAttachment({ name: file.name, dataUrl, previewUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    setShowSuggestions(false);
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    generate(trimmed, attachment?.dataUrl ?? null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIdx((i) => Math.min(i + 1, filteredSuggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIdx((i) => Math.max(i - 1, -1));
        return;
      }
      if (e.key === "Enter" && suggestionIdx >= 0) {
        e.preventDefault();
        setInput(filteredSuggestions[suggestionIdx]);
        setShowSuggestions(false);
        setSuggestionIdx(-1);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-full"
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="relative">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl transition-all focus-within:border-zinc-700">
          <AnimatePresence>
            {attachment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-wrap items-start gap-2 px-3 pt-2.5 pb-0 overflow-hidden"
              >
                <div className="w-8 h-8 rounded-md overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/50">
                  {attachment.previewUrl.startsWith("data:image") ? (
                    <img src={attachment.previewUrl} alt="Reference" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={14} className="text-zinc-500" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-zinc-400 truncate flex-1 min-w-0 sm:max-w-[200px]">{attachment.name}</span>
                <button
                  onClick={() => setAttachment(null)}
                  className="p-0.5 rounded text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
                <span
                  className="basis-full pl-10 text-[10px] leading-relaxed text-zinc-600 sm:basis-auto sm:pl-0"
                  title="Only color, lighting &amp; mood are borrowed - faces and subjects are not copied"
                >
                  style only | face not copied
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex min-w-0 items-center gap-1.5 px-3 py-3 sm:gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isGenerating}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-all shrink-0"
              title="Attach a reference image"
            >
              <Plus size={16} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(true);
                setSuggestionIdx(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isGenerating}
              className="min-w-0 flex-1 bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-zinc-100 placeholder:text-zinc-600 text-[15px] disabled:opacity-50"
              autoFocus
            />

            <FormatPicker />

            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isGenerating}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed transition-all shrink-0"
              aria-label="Generate"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-40 shadow-xl shadow-black/30"
            >
              {filteredSuggestions.map((s, i) => (
                <button
                  key={s}
                  onMouseDown={() => {
                    setInput(s);
                    setShowSuggestions(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors truncate ${
                    i === suggestionIdx
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ReasoningBlock />

      {isIdle && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex items-center justify-center gap-2 mt-2.5"
        >
          <span className="text-[11px] text-zinc-600 select-none">Variations</span>
          <div className="flex items-center gap-1">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setGenerationCount(n)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  generationCount === n
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/60"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {!isIdle && (
        <div className="flex justify-center mt-2">
          <button
            onClick={() => { reset(); setAttachment(null); }}
            className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <Plus size={12} className="rotate-45" />
            Start over
          </button>
        </div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-red-400/80 mt-2 pl-1"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
