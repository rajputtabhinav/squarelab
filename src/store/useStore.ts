import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  BillingStatusResponse,
  GeneratedImage,
  ImageFormat,
  AppStatus,
  GenerationRecord,
} from "@/types";

let abortController: AbortController | null = null;
const LEGACY_STORAGE_KEY = "amatic-store";
const STORAGE_KEY = "pensil-store";

function getClientFingerprint() {
  if (typeof window === "undefined") return "server";
  const key = "pensil-client-fingerprint";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = `fp-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  window.localStorage.setItem(key, created);
  return created;
}

interface AppStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  history: GenerationRecord[];

  format: ImageFormat;
  customRatio: string;
  setFormat: (format: ImageFormat) => void;
  setCustomRatio: (ratio: string) => void;
  generationCount: number;
  setGenerationCount: (count: number) => void;
  status: AppStatus;
  isStreaming: boolean;
  prompt: string;
  thumbnails: GeneratedImage[];
  error: string | null;
  genStage: string;
  reasoningText: string;
  billingStatus: BillingStatusResponse | null;
  billingLoading: boolean;
  selectedIds: Set<string>;
  setStatus: (status: AppStatus) => void;
  setPrompt: (prompt: string) => void;
  generate: (prompt: string, referenceImage?: string | null) => Promise<void>;
  refreshBillingStatus: () => Promise<void>;
  reset: () => void;
  clearError: () => void;
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      history: [],

      format: "youtube-thumbnail",
      customRatio: "1:1",
      setFormat: (format) => set({ format }),
      setCustomRatio: (ratio) => set({ customRatio: ratio }),
      generationCount: 4,
      setGenerationCount: (count) => set({ generationCount: count }),
      status: "idle",
      isStreaming: false,
      prompt: "",
      thumbnails: [],
      error: null,
      genStage: "",
      reasoningText: "",
      billingStatus: null,
      billingLoading: false,
      selectedIds: new Set(),

      setStatus: (status) => set({ status }),
      setPrompt: (prompt) => set({ prompt }),
      clearError: () => set({ error: null }),
      refreshBillingStatus: async () => {
        set({ billingLoading: true });
        try {
          const res = await fetch("/api/billing/status", { cache: "no-store" });
          if (!res.ok) throw new Error("Unable to load billing status.");
          const data = (await res.json()) as BillingStatusResponse;
          set({ billingStatus: data, billingLoading: false });
        } catch {
          set({ billingLoading: false });
        }
      },
      toggleSelected: (id) =>
        set((s) => {
          const next = new Set(s.selectedIds);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { selectedIds: next };
        }),
      clearSelection: () => set({ selectedIds: new Set() }),
      selectAll: () =>
        set((s) => {
          const all = s.thumbnails.map((i) => i.id);
          return { selectedIds: new Set(all) };
        }),

      generate: async (prompt: string, referenceImage?: string | null) => {
        if (get().status === "generating" || get().isStreaming) {
          abortController?.abort();
        }

        abortController = new AbortController();
        const { format, customRatio, generationCount } = get();

        set({
          status: "generating",
          isStreaming: false,
          prompt,
          thumbnails: [],
          error: null,
          selectedIds: new Set(),
          genStage: `Designing ${generationCount} concepts...`,
          reasoningText: "",
        });

        const opusEstimateMs = Math.ceil(generationCount / 8) * 4500;
        const stageTimer = setTimeout(() => {
          if (get().status === "generating") {
            set({ genStage: "Generating images..." });
          }
        }, opusEstimateMs);

        try {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Pensil-Fingerprint": getClientFingerprint(),
            },
            body: JSON.stringify({ prompt, format, customRatio, count: generationCount, referenceImage: referenceImage ?? null }),
            signal: abortController.signal,
          });

          clearTimeout(stageTimer);

          if (res.status === 402 || res.status === 429 || res.status === 401) {
            const data = await res.json() as { error?: string };
            throw new Error(data.error ?? "Rate limit reached. Please wait before generating again.");
          }
          if (!res.ok || !res.body) throw new Error("Generation failed");

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              let event: {
                type: string;
                image?: GeneratedImage;
                text?: string;
                message?: string;
                balance?: BillingStatusResponse["balance"];
              };
              try {
                event = JSON.parse(line.slice(6)) as typeof event;
              } catch {
                continue;
              }

              if (event.type === "thinking" && event.text) {
                set((s) => ({ reasoningText: s.reasoningText + event.text }));
              } else if (event.type === "billing") {
                set((s) => ({
                  billingStatus: s.billingStatus
                    ? { ...s.billingStatus, balance: event.balance ?? s.billingStatus.balance }
                    : s.billingStatus,
                }));
              } else if (event.type === "image" && event.image) {
                const img = event.image;
                set((s) => {
                  const newThumbs = [...s.thumbnails, img];
                  return {
                    status: "results",
                    isStreaming: true,
                    thumbnails: newThumbs,
                    genStage: `${newThumbs.length} / ${generationCount} generated`,
                  };
                });
              } else if (event.type === "done") {
                set({ isStreaming: false, genStage: "" });
              } else if (event.type === "error") {
                throw new Error(event.message ?? "Generation failed");
              }
            }
          }

          const { thumbnails: imgs } = get();
          await get().refreshBillingStatus();

          // Compress first image to a tiny ~80px wide JPEG for history preview
          let previewUrl = "";
          const firstUrl = imgs[0]?.url;
          if (firstUrl) {
            try {
              await new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                  const canvas = document.createElement("canvas");
                  const scale = 80 / img.naturalWidth;
                  canvas.width = 80;
                  canvas.height = Math.round(img.naturalHeight * scale);
                  const ctx = canvas.getContext("2d");
                  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                  previewUrl = canvas.toDataURL("image/jpeg", 0.6);
                  resolve();
                };
                img.onerror = () => resolve();
                img.src = firstUrl;
              });
            } catch { /* skip preview on error */ }
          }

          const record: GenerationRecord = {
            id: `gen-${Date.now()}`,
            prompt,
            format,
            imageCount: imgs.length,
            createdAt: new Date().toISOString(),
            previewUrl,
          };
          set((s) => ({ history: [record, ...s.history].slice(0, 100) }));
        } catch (err) {
          clearTimeout(stageTimer);
          if (err instanceof DOMException && err.name === "AbortError") return;
          const message =
            err instanceof Error ? err.message : "Generation failed. Please try again.";
          set({
            status: "idle",
            isStreaming: false,
            genStage: "",
            error: message,
          });
        } finally {
          abortController = null;
        }
      },

      reset: () => {
        abortController?.abort();
        abortController = null;
        set({
          status: "idle",
          isStreaming: false,
          prompt: "",
          thumbnails: [],
          error: null,
          genStage: "",
          reasoningText: "",
          selectedIds: new Set(),
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        history: state.history,
        format: state.format,
        customRatio: state.customRatio,
        generationCount: state.generationCount,
      }),
      storage: {
        getItem: (name) => {
          let str = localStorage.getItem(name);
          if (!str && name === STORAGE_KEY) {
            const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (legacy) {
              str = legacy;
              try {
                localStorage.setItem(STORAGE_KEY, legacy);
                localStorage.removeItem(LEGACY_STORAGE_KEY);
              } catch {
                // Ignore migration failures and keep using the legacy payload.
              }
            }
          }
          if (!str) return null;
          const parsed = JSON.parse(str);
          if (parsed?.state?.selectedIds) {
            parsed.state.selectedIds = new Set();
          }
          return parsed;
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch {
            try {
              const trimmed = {
                ...value,
                state: {
                  ...(value as Record<string, unknown> & { state: Record<string, unknown> }).state,
                  history: ((value as Record<string, unknown> & { state: { history: unknown[] } }).state.history ?? []).slice(0, 10),
                },
              };
              localStorage.setItem(name, JSON.stringify(trimmed));
            } catch {
              localStorage.removeItem(name);
            }
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
