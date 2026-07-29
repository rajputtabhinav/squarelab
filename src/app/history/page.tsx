"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { timeAgo } from "@/lib/utils";
import { FORMAT_CONFIGS } from "@/lib/formats";
import GradientBg from "@/components/GradientBg";

export default function HistoryPage() {
  const { history, generate } = useStore();
  const router = useRouter();

  const handleReuse = (prompt: string) => {
    generate(prompt);
    router.push("/");
  };

  return (
    <div className="relative min-h-screen">
      <GradientBg />

      <div className="pt-16 md:pt-8 px-4 md:px-8 pb-12 max-w-3xl mx-auto">
        <h1 className="text-lg font-semibold text-zinc-900 mb-6">History</h1>

        {history.length === 0 ? (
          <div className="flex flex-col items-center py-24">
            <Clock size={28} className="text-zinc-400 mb-3" />
            <p className="text-zinc-600 text-sm">Nothing here yet</p>
            <Link
              href="/"
              className="text-sm text-zinc-700 hover:text-zinc-900 transition-colors underline underline-offset-4 mt-4"
            >
              Create something
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {history.map((record, i) => (
              <motion.button
                key={record.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.5) }}
                onClick={() => handleReuse(record.prompt)}
                className="flex items-center gap-4 w-full text-left bg-white/50 backdrop-blur-sm rounded-lg border border-zinc-200/60 p-3 hover:bg-white/70 hover:border-zinc-300/60 transition-colors"
              >
                <div className="w-14 h-9 rounded overflow-hidden bg-zinc-800 shrink-0">
                  {record.previewUrl && (
                    <img
                      src={record.previewUrl}
                      alt={`Preview: ${record.prompt}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-900 truncate">
                    {record.prompt}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {record.imageCount ?? (record as unknown as { thumbnailCount?: number }).thumbnailCount ?? 0} images
                    {" | "}
                    {FORMAT_CONFIGS[record.format]?.label ?? record.format}
                  </p>
                </div>
                <span className="text-[11px] text-zinc-500 shrink-0">
                  {timeAgo(record.createdAt)}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
