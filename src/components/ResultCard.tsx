"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, RefreshCw, Check, CheckCircle, Copy, ImageIcon, Pencil, X } from "lucide-react";
import type { GeneratedImage } from "@/types";
import { useStore } from "@/store/useStore";
import { FORMAT_CONFIGS } from "@/lib/formats";
import { compositeWithText, getOverlayCSSStyle, getOverlayFontSize } from "@/lib/canvasOverlay";

interface Props {
  image: GeneratedImage;
  onOpenLightbox: (image: GeneratedImage) => void;
}

async function downloadSingle(url: string, filename: string) {
  const finalUrl = url.startsWith("data:") ? url : await (async () => {
    const res = await fetch(url);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  })();
  const a = document.createElement("a");
  a.href = finalUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (!url.startsWith("data:")) URL.revokeObjectURL(finalUrl);
}

export default function ResultCard({ image, onOpenLightbox }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [editInput, setEditInput] = useState(image.prompt);

  const { selectedIds, toggleSelected, generate, format } = useStore();
  const isSelected = selectedIds.has(image.id);
  const formatLabel = FORMAT_CONFIGS[format]?.shortLabel ?? "Image";

  // Dynamic aspect ratio matching the selected format
  const aspectClass: Record<string, string> = {
    "youtube-thumbnail": "aspect-video",
    "instagram-post": "aspect-square",
    "instagram-story": "aspect-[9/16]",
    "twitter-banner": "aspect-[3/1]",
    "blog-header": "aspect-[2/1]",
    "custom": "aspect-video",
  };
  const cardAspect = aspectClass[format] ?? "aspect-video";

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      let finalUrl = image.url;
      if (image.textOverlay) {
        finalUrl = await compositeWithText(image.url, image.textOverlay, image.width, image.height);
      }
      await downloadSingle(finalUrl, `pensil-${image.id.slice(-6)}.png`);
    } finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  };

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [image.prompt]);

  const handleUseAsRef = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("pensil-set-ref", {
      detail: { url: image.url, name: `Generated: ${image.prompt.slice(0, 40)}` }
    }));
  }, [image]);

  const handleRegenerate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = editInput.trim() || image.prompt;
    generate(prompt);
    setEditingPrompt(false);
  }, [generate, editInput, image.prompt]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditInput(image.prompt);
    setEditingPrompt(true);
  };

  const handleCardClick = () => {
    if (editingPrompt) return;
    onOpenLightbox(image);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.97 },
        show: { opacity: 1, scale: 1 },
      }}
      onClick={handleCardClick}
      className={`group relative ${cardAspect} rounded-xl overflow-hidden bg-zinc-900 cursor-pointer transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/25 border ${
        isSelected
          ? "border-zinc-400 ring-1 ring-zinc-400/30"
          : "border-zinc-800/40"
      }`}
    >
      {/* Shimmer while loading */}
      {!imgLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/30 to-transparent animate-shimmer" />
      )}

      {/* Image */}
      <img
        src={image.url}
        alt={`${formatLabel}: ${image.prompt}`}
        className={`w-full h-full object-cover transition-[transform,opacity] duration-500 ease-out group-hover:scale-[1.03] ${
          imgLoaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          img.removeAttribute("onerror");
          img.src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' fill='%2327272a'%3E%3Crect width='640' height='360'/%3E%3Ctext x='320' y='185' text-anchor='middle' fill='%2352525b' font-size='14' font-family='system-ui'%3EFailed to load%3C/text%3E%3C/svg%3E";
          setImgLoaded(true);
        }}
      />

      {/* Text overlay preview */}
      {image.textOverlay && imgLoaded && (
        <span
          style={{
            ...getOverlayCSSStyle(image.textOverlay, "card"),
            fontSize: getOverlayFontSize("card"),
          }}
        >
          {image.textOverlay.text}
        </span>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-white flex items-center justify-center z-10">
          <CheckCircle size={14} className="text-zinc-900" />
        </div>
      )}

      {/* Format badge — top right */}
      <div
        className={`absolute top-2 right-2 transition-opacity duration-200 ${
          isSelected ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
        }`}
      >
        <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-medium text-zinc-400">
          {formatLabel}
        </span>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">

        {/* Prompt edit overlay */}
        {editingPrompt && (
          <div
            className="absolute inset-0 bg-black/80 flex flex-col justify-center p-3 gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              value={editInput}
              onChange={(e) => setEditInput(e.target.value)}
              autoFocus
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 resize-none outline-none focus:border-zinc-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRegenerate(e as unknown as React.MouseEvent); }
                if (e.key === "Escape") { setEditingPrompt(false); }
              }}
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleRegenerate}
                className="flex-1 flex items-center justify-center gap-1 py-1 bg-zinc-100 text-zinc-900 rounded text-[11px] font-medium hover:bg-white transition-colors"
              >
                <RefreshCw size={11} /> Regenerate
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingPrompt(false); }}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Bottom action bar */}
        {!editingPrompt && (
          <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-center justify-between pointer-events-auto">
            {/* Select toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleSelected(image.id); }}
              className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
              aria-label="Select"
            >
              <CheckCircle size={14} className={isSelected ? "text-white" : ""} />
            </button>

            <div className="flex gap-1">
              {/* Use as reference */}
              <button
                onClick={handleUseAsRef}
                title="Use as reference"
                className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ImageIcon size={13} />
              </button>

              {/* Copy prompt */}
              <button
                onClick={handleCopy}
                title="Copy prompt"
                className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              </button>

              {/* Edit & regenerate */}
              <button
                onClick={handleEditClick}
                title="Edit prompt & regenerate"
                className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Pencil size={13} />
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                title="Download"
                className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {downloading ? <Check size={13} /> : <Download size={13} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
