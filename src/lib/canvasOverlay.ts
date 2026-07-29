import type { TextOverlay } from "@/types";
import type { CSSProperties } from "react";

type PreviewSize = "card" | "lightbox";

// ─── CSS position map ─────────────────────────────────────────────────────────
const POSITION_STYLES: Record<string, CSSProperties> = {
  "top-left":      { top: "8%",  left: "5%",  textAlign: "left",   transform: "none" },
  "top-center":    { top: "8%",  left: "50%", textAlign: "center", transform: "translateX(-50%)" },
  "top-right":     { top: "8%",  right: "5%", textAlign: "right",  transform: "none" },
  "center-left":   { top: "50%", left: "5%",  textAlign: "left",   transform: "translateY(-50%)" },
  "center":        { top: "50%", left: "50%", textAlign: "center", transform: "translate(-50%, -50%)" },
  "center-right":  { top: "50%", right: "5%", textAlign: "right",  transform: "translateY(-50%)" },
  "bottom-left":   { bottom: "10%", left: "5%",  textAlign: "left",   transform: "none" },
  "bottom-center": { bottom: "10%", left: "50%", textAlign: "center", transform: "translateX(-50%)" },
  "bottom-right":  { bottom: "10%", right: "5%", textAlign: "right",  transform: "none" },
};

function resolvePosition(position: string): CSSProperties {
  const normalized = position.toLowerCase().replace(/\s+/g, "-");
  return POSITION_STYLES[normalized] ?? POSITION_STYLES["bottom-left"];
}

export function getOverlayCSSStyle(overlay: TextOverlay, _size: PreviewSize): CSSProperties {
  const pos = resolvePosition(overlay.position);
  return {
    ...pos,
    position: "absolute",
    color: overlay.color ?? "#ffffff",
    fontFamily: overlay.fontFamily ? `'${overlay.fontFamily}', sans-serif` : "Anton, sans-serif",
    WebkitTextStroke: overlay.strokeColor ? `2px ${overlay.strokeColor}` : undefined,
    textShadow: "2px 2px 8px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.7)",
    lineHeight: 1.1,
    maxWidth: "85%",
    pointerEvents: "none",
    zIndex: 10,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    letterSpacing: "0.01em",
  };
}

export function getOverlayFontSize(size: PreviewSize): string {
  return size === "lightbox"
    ? "clamp(1.5rem, 4vw, 3rem)"
    : "clamp(0.7rem, 2.8vw, 1.2rem)";
}

// ─── Canvas position helpers ───────────────────────────────────────────────────
function resolveCanvasXY(
  position: string,
  canvasW: number,
  canvasH: number
): { x: number; y: number; align: CanvasTextAlign; baseline: CanvasTextBaseline } {
  const norm = position.toLowerCase().replace(/\s+/g, "-");
  const mx = canvasW * 0.05;
  const my = canvasH * 0.08;

  const MAP: Record<string, { x: number; y: number; align: CanvasTextAlign; baseline: CanvasTextBaseline }> = {
    "top-left":      { x: mx,            y: my,              align: "left",   baseline: "top"    },
    "top-center":    { x: canvasW / 2,   y: my,              align: "center", baseline: "top"    },
    "top-right":     { x: canvasW - mx,  y: my,              align: "right",  baseline: "top"    },
    "center-left":   { x: mx,            y: canvasH / 2,     align: "left",   baseline: "middle" },
    "center":        { x: canvasW / 2,   y: canvasH / 2,     align: "center", baseline: "middle" },
    "center-right":  { x: canvasW - mx,  y: canvasH / 2,     align: "right",  baseline: "middle" },
    "bottom-left":   { x: mx,            y: canvasH - my,    align: "left",   baseline: "bottom" },
    "bottom-center": { x: canvasW / 2,   y: canvasH - my,    align: "center", baseline: "bottom" },
    "bottom-right":  { x: canvasW - mx,  y: canvasH - my,    align: "right",  baseline: "bottom" },
  };

  return MAP[norm] ?? MAP["bottom-left"];
}

// ─── Main composite function ───────────────────────────────────────────────────
export async function compositeWithText(
  imageUrl: string,
  overlay: TextOverlay,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = targetWidth  || img.naturalWidth;
      canvas.height = targetHeight || img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas 2D context unavailable")); return; }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const fontSize   = Math.round(canvas.width * 0.065);
      const fontFamily = overlay.fontFamily ?? "Anton";
      ctx.font         = `${fontSize}px '${fontFamily}', sans-serif`;

      const { x, y, align, baseline } = resolveCanvasXY(overlay.position, canvas.width, canvas.height);
      ctx.textAlign    = align;
      ctx.textBaseline = baseline;

      const lines  = overlay.text.split("\n");
      const lineH  = fontSize * 1.15;
      const totalH = (lines.length - 1) * lineH;

      // Drop shadow
      ctx.shadowColor   = "rgba(0,0,0,0.85)";
      ctx.shadowBlur    = 16;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;

      // Stroke pass
      if (overlay.strokeColor) {
        ctx.lineWidth   = Math.round(fontSize * 0.08);
        ctx.strokeStyle = overlay.strokeColor;
        ctx.lineJoin    = "round";
        lines.forEach((line, i) => {
          ctx.strokeText(line, x, y + i * lineH - totalH / 2);
        });
      }

      // Fill pass
      ctx.fillStyle = overlay.color ?? "#ffffff";
      lines.forEach((line, i) => {
        ctx.fillText(line, x, y + i * lineH - totalH / 2);
      });

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject(new Error("Failed to load image for compositing"));
    img.src = imageUrl;
  });
}
