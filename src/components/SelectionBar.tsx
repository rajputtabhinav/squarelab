"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, CheckSquare, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import JSZip from "jszip";
import { compositeWithText } from "@/lib/canvasOverlay";

export default function SelectionBar() {
  const { selectedIds, clearSelection, selectAll, thumbnails } =
    useStore();
  const [zipping, setZipping] = useState(false);
  const count = selectedIds.size;

  // Listen for Cmd+Shift+S shortcut from ThumbnailGrid
  useEffect(() => {
    const handler = () => { if (count > 0) handleDownloadZip(); };
    window.addEventListener("pensil-download-zip", handler);
    return () => window.removeEventListener("pensil-download-zip", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, selectedIds]);

  const handleDownloadZip = async () => {
    if (zipping || count === 0) return;
    setZipping(true);

    try {
      const zip = new JSZip();
      const selected = thumbnails.filter((img) => selectedIds.has(img.id));

      await Promise.all(
        selected.map(async (img, i) => {
          try {
            const ext = img.type === "banner" ? "banner" : "thumb";
            const filename = `pensil-${ext}-${String(i + 1).padStart(2, "0")}.png`;

            // Bake text overlay into the image before zipping
            let finalUrl = img.url;
            if (img.textOverlay) {
              finalUrl = await compositeWithText(img.url, img.textOverlay, img.width, img.height);
            }

            if (finalUrl.startsWith("data:")) {
              const base64 = finalUrl.split(",")[1];
              if (base64) zip.file(filename, base64, { base64: true });
            } else {
              const res = await fetch(finalUrl);
              const blob = await res.blob();
              zip.file(filename, blob);
            }
          } catch {
            /* skip failed entries */
          }
        })
      );

      // STORE (no re-compression) since PNGs are already compressed
      const content = await zip.generateAsync({ type: "blob", compression: "STORE" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pensil-${count}-images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto z-30 flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap sm:gap-3 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 shadow-2xl shadow-black/50"
        >
          <span className="text-sm text-zinc-200 font-medium">
            {count} selected
          </span>

          <div className="w-px h-5 bg-zinc-700" />

          <button
            onClick={selectAll}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <CheckSquare size={14} />
            All
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={zipping}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 transition-colors"
          >
            {zipping ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Download ZIP
          </button>

          <button
            onClick={clearSelection}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Clear selection"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
