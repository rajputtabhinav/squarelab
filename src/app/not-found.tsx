"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import GradientBg from "@/components/GradientBg";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <GradientBg />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <p className="text-8xl font-bold text-zinc-900/10 select-none mb-4">404</p>
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Page not found</h1>
        <p className="text-zinc-600 text-sm mb-8">This page doesn&apos;t exist or was moved.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-zinc-50 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          Back to pensil.io
        </Link>
      </motion.div>
    </div>
  );
}
