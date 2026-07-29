"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import GradientBg from "@/components/GradientBg";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <GradientBg />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <p className="text-8xl font-bold text-zinc-900/10 select-none mb-4">!</p>
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Something went wrong</h1>
        <p className="text-zinc-600 text-sm mb-8">
          An unexpected error occurred. Please try again or head back home.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-zinc-900 text-zinc-50 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 bg-zinc-900/10 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-900/15 transition-colors"
          >
            Go home
          </a>
        </div>
      </motion.div>
    </div>
  );
}
