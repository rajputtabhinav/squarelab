"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import type { GeneratedImage } from "@/types";
import { useStore } from "@/store/useStore";
import { FORMAT_CONFIGS } from "@/lib/formats";
import ResultCard from "./ResultCard";
import ImageLightbox from "./ImageLightbox";

interface Props {
  thumbnails: GeneratedImage[];
}

// Grid columns per format — tall formats need more columns to avoid overly large cards
const GRID_COLS: Record<string, string> = {
  "youtube-thumbnail": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  "instagram-post":    "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  "instagram-story":   "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  "twitter-banner":    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "blog-header":       "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "custom":            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

export default function ThumbnailGrid({ thumbnails }: Props) {
  const { format, selectedIds, thumbnails: allThumbs } = useStore();
  const label = FORMAT_CONFIGS[format]?.label ?? "Images";
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);

  const lightboxIdx = lightboxImage
    ? thumbnails.findIndex((t) => t.id === lightboxImage.id)
    : -1;

  const openLightbox = useCallback((img: GeneratedImage) => setLightboxImage(img), []);
  const closeLightbox = useCallback(() => setLightboxImage(null), []);
  const prevImage = useCallback(() => {
    if (lightboxIdx > 0) setLightboxImage(thumbnails[lightboxIdx - 1]);
  }, [lightboxIdx, thumbnails]);
  const nextImage = useCallback(() => {
    if (lightboxIdx < thumbnails.length - 1) setLightboxImage(thumbnails[lightboxIdx + 1]);
  }, [lightboxIdx, thumbnails]);

  // Cmd+S — download selected or lightbox image
  // Cmd+Shift+S — download all selected as ZIP (delegated to SelectionBar via event)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "s" && !e.shiftKey && lightboxImage) {
        // Handled inside lightbox
        return;
      }
      if (e.key === "S" && e.shiftKey && selectedIds.size > 0) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("pensil-download-zip"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxImage, selectedIds]);

  return (
    <>
      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 mb-4">
          {label}
          <span className="ml-2 text-zinc-600">{thumbnails.length}</span>
        </h2>

        <motion.div
          className={`grid gap-3 ${GRID_COLS[format] ?? GRID_COLS["youtube-thumbnail"]}`}
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {thumbnails.map((thumb) => (
            <ResultCard
              key={thumb.id}
              image={thumb}
              onOpenLightbox={openLightbox}
            />
          ))}
        </motion.div>
      </section>

      <ImageLightbox
        image={lightboxImage}
        onClose={closeLightbox}
        onPrev={prevImage}
        onNext={nextImage}
        hasPrev={lightboxIdx > 0}
        hasNext={lightboxIdx < thumbnails.length - 1}
      />
    </>
  );
}
