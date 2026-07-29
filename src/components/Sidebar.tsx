"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Clock, Info, DollarSign, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import CreditStatusCard from "./CreditStatusCard";

const navItems = [
  { href: "/", label: "Generate", icon: Sparkles },
  { href: "/history", label: "History", icon: Clock },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/about", label: "About", icon: Info },
];

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useStore();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-60 bg-zinc-900 border-r border-zinc-800/50 flex flex-col transform transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="px-4 py-5 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-100 tracking-tight">
          pensil.io
        </span>
        <button
          onClick={() => setSidebarOpen(false)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                isActive
                  ? "bg-zinc-800/80 text-zinc-100 font-medium"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <CreditStatusCard />

      <div className="px-4 pb-5 pt-3 border-t border-zinc-800/50">
        <div className="flex items-center gap-3 mb-2.5">
          {footerLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
        <a
          href="mailto:abhinav@pensil.io"
          className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors block"
        >
          abhinav@pensil.io
        </a>
        <p className="text-[10px] text-zinc-700 mt-1.5">(c) {new Date().getFullYear()} Raptorvoid Private Limited</p>
      </div>
    </aside>
  );
}
