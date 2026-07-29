"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Loader2, Wallet } from "lucide-react";
import { useStore } from "@/store/useStore";

function formatRenewalDate(value: string | null) {
  if (!value) return "No renewal date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function CreditStatusCard() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const { billingStatus, billingLoading, refreshBillingStatus } = useStore();
  const [open, setOpen] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    void refreshBillingStatus();
  }, [refreshBillingStatus, isSignedIn]);

  const balance = billingStatus?.balance ?? null;
  const progress = useMemo(() => {
    if (!balance) return 0;
    const total = balance.includedCredits + balance.topUpCredits;
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((balance.remainingCredits / total) * 100)));
  }, [balance]);

  async function openCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "subscription", planId: "starter", interval: "monthly" }),
      });
      const data = (await res.json()) as { checkoutUrl?: string | null };
      if (data.checkoutUrl) {
        router.push(data.checkoutUrl);
      }
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="px-3 pt-2 pb-4">
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/80 overflow-hidden">
          <Collapsible.Trigger className="w-full px-3.5 py-3 flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <Wallet size={14} className="text-zinc-500" />
              <span className="text-sm font-medium text-zinc-100">Credits remaining</span>
            </div>
            <ChevronDown
              size={14}
              className={`text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </Collapsible.Trigger>

          <Collapsible.Content className="px-3.5 pb-3.5 space-y-3">
            {billingLoading && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Loader2 size={12} className="animate-spin" />
                Syncing balance...
              </div>
            )}

            {!billingLoading && !isSignedIn && (
              <div className="space-y-2">
                <p className="text-sm text-zinc-200">Paid access only</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Sign in, choose a plan, and unlock monthly credits for generation.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  See plans <ExternalLink size={12} />
                </Link>
              </div>
            )}

            {!billingLoading && isSignedIn && !billingStatus?.hasAccess && (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-semibold text-zinc-100">0</span>
                  <span className="text-xs text-zinc-500">No active plan</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  You need an active subscription before generation starts. Credits renew monthly after payment.
                </p>
                <button
                  onClick={openCheckout}
                  className="w-full rounded-xl bg-zinc-100 text-zinc-900 text-xs font-medium py-2 hover:bg-white transition-colors disabled:opacity-60"
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? "Opening..." : "Choose a plan"}
                </button>
              </div>
            )}

            {!billingLoading && billingStatus?.hasAccess && balance && (
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{balance.planName}</p>
                    <p className="text-xs text-zinc-500">{progress}% remaining</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-zinc-100">{balance.remainingCredits}</p>
                    <p className="text-[11px] text-zinc-500">credits</p>
                  </div>
                </div>

                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-zinc-300 transition-[width]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">~{balance.estimatedJobsRemaining} standard jobs</span>
                  <span className="text-zinc-500">{formatRenewalDate(balance.renewalDate)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/pricing#plans"
                    className="rounded-xl border border-zinc-700 text-zinc-300 text-xs font-medium py-2 text-center hover:border-zinc-500 hover:text-zinc-100 transition-colors"
                  >
                    Upgrade plan
                  </Link>
                  <Link
                    href="/pricing#plans"
                    className="rounded-xl border border-zinc-700 text-zinc-300 text-xs font-medium py-2 text-center hover:border-zinc-500 hover:text-zinc-100 transition-colors"
                  >
                    Renew options
                  </Link>
                </div>
              </div>
            )}
          </Collapsible.Content>
        </div>
      </Collapsible.Root>
    </div>
  );
}
