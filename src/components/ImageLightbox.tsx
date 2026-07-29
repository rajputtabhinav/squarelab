"use client";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Copy, Check, Loader2, RefreshCw, ImageIcon } from "lucide-react";
import type { GeneratedImage } from "@/types";
import { useStore } from "@/store/useStore";
import { FORMAT_CONFIGS } from "@/lib/formats";
import { compositeWithText, getOverlayCSSStyle, getOverlayFontSize } from "@/lib/canvasOverlay";

interface Props {
  image: GeneratedImage | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function ImageLightbox({ image, onClose, onPrev, onNext, hasPrev, hasNext }: Props) {
  const { generate, format } = useStore();
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useAsRefDone, setUseAsRefDone] = useState(false);
  const formatLabel = FORMAT_CONFIGS[format]?.label ?? "Image";

  const handleDownload = useCallback(async () => {
    if (!image || downloading) return;
    setDownloading(true);
    try {
      let finalUrl = image.url;

      if (image.textOverlay) {
        finalUrl = await compositeWithText(image.url, image.textOverlay, image.width, image.height);
      }

      if (finalUrl.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = finalUrl;
        a.download = `pensil-${image.id.slice(-6)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const res = await fetch(finalUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `pensil-${image.id.slice(-6)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  }, [image, downloading]);

  const handleCopy = useCallback(async () => {
    if (!image) return;
    await navigator.clipboard.writeText(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [image]);

  const handleUseAsRef = useCallback(() => {
    if (!image) return;
    window.dispatchEvent(new CustomEvent("pensil-set-ref", {
      detail: { url: image.url, name: `Generated: ${image.prompt.slice(0, 40)}` },
    }));
    setUseAsRefDone(true);
    setTimeout(() => {
      setUseAsRefDone(false);
      onClose();
    }, 1200);
  }, [image, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev?.();
      if (e.key === "ArrowRight" && hasNext) onNext?.();
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleDownload();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext, hasPrev, hasNext, handleDownload]);

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-5xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-xl overflow-hidden bg-zinc-900 shadow-2xl shadow-black/60">
              <img
                src={image.url}
                alt={image.prompt}
                className="w-full h-auto max-h-[75vh] object-contain"
              />

              {image.textOverlay && (
                <span
                  style={{
                    ...getOverlayCSSStyle(image.textOverlay, "lightbox"),
                    fontSize: getOverlayFontSize("lightbox"),
                  }}
                >
                  {image.textOverlay.text}
                </span>
              )}

              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <X size={16} />
              </button>

              {hasPrev && (
                <button
                  onClick={onPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
                </button>
              )}
              {hasNext && (
                <button
                  onClick={onNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 3l5 5-5 5"/></svg>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 px-1 md:flex-row md:items-start md:justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-400 truncate leading-relaxed">{image.prompt}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{formatLabel}</p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0 md:justify-end">
                <button
                  onClick={handleUseAsRef}
                  title="Use as reference for next generation"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                >
                  {useAsRefDone ? <Check size={13} /> : <ImageIcon size={13} />}
                  {useAsRefDone ? "Set!" : "Use as ref"}
                </button>

                <button
                  onClick={() => {
                    generate(image.prompt);
                    onClose();
                  }}
                  title="Regenerate with this prompt"
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  <RefreshCw size={14} />
                </button>

                <button
                  onClick={handleCopy}
                  title="Copy prompt"
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>

                <button
                  onClick={handleDownload}
                  title="Download (Ctrl/Cmd+S)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 text-xs font-medium hover:bg-white transition-colors"
                >
                  {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  Download
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
