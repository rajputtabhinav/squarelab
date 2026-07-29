"use client";

import { type ReactNode, useEffect } from "react";
import { Menu } from "lucide-react";
import { Show, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import { clerkAppearance } from "@/lib/clerkAppearance";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useStore();
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <div className="min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {!isAuthRoute && <Sidebar />}

      {/* Menu toggle */}
      {!isAuthRoute && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-20 p-2 rounded-lg bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Auth controls — top right */}
      <div className={`fixed top-4 right-4 z-20 flex items-center gap-2 ${isAuthRoute ? "hidden" : ""}`}>
        <Show when="signed-out">
          <SignInButton mode="redirect">
            <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 hover:border-zinc-700 transition-colors">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="redirect">
            <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-900 bg-zinc-100 hover:bg-white transition-colors">
              Sign up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton
            appearance={{
              ...clerkAppearance,
              elements: {
                ...(clerkAppearance.elements ?? {}),
                avatarBox: "w-8 h-8",
              },
            }}
            userProfileProps={{
              appearance: clerkAppearance,
            }}
          />
        </Show>
      </div>

      <div className="min-h-screen">{children}</div>
    </div>
  );
}
