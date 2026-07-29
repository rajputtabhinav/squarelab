import type { ReactNode } from "react";
import Link from "next/link";
import GradientBg from "./GradientBg";

export default function AuthFrame({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <GradientBg />

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-900">
            pensil.io
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/60 bg-white/60 px-4 py-2 text-xs font-medium text-zinc-700 backdrop-blur-md transition-colors hover:bg-white/80 hover:text-zinc-900"
          >
            Back home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
