"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import GradientBg from "@/components/GradientBg";
import {
  PLAN_DEFINITIONS,
  YEARLY_DISCOUNT,
  formatPrice,
  getPlanMonthlyEquivalent,
  getPlanPrice,
} from "@/lib/billing/config";
import type { BillingInterval, PlanId } from "@/types";

const FAQ = [
  {
    q: "Why credits instead of unlimited generations?",
    a: "Credits make usage clear and predictable. Different jobs can use different amounts, so plans are built around monthly credits instead of vague unlimited access.",
  },
  {
    q: "How many jobs does one plan usually cover?",
    a: "A standard job means a typical 4-image generation. More variations cost more credits. Your remaining credits and estimated standard jobs are shown in the app before you run out.",
  },
  {
    q: "What happens when I hit zero credits?",
    a: "The system hard-stops new generations. You can renew your plan for the next cycle or move to a higher plan if you need more room.",
  },
  {
    q: "Can I move to a higher plan later?",
    a: "Yes. If your workload grows, you can move up to a higher plan with a larger monthly credit allowance.",
  },
];

function Check() {
  return (
    <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PricingContent() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [interval, setInterval] = useState<BillingInterval>(
    (searchParams.get("interval") as BillingInterval | null) === "yearly" ? "yearly" : "monthly"
  );

  const requestedPlan = useMemo(() => {
    const planId = searchParams.get("plan") as PlanId | null;
    return PLAN_DEFINITIONS.find((plan) => plan.id === planId) ?? null;
  }, [searchParams]);

  const requestedInterval = (searchParams.get("interval") as BillingInterval | null) === "yearly"
    ? "yearly"
    : "monthly";
  const requestedUser = searchParams.get("user");

  async function openCheckout(id: PlanId) {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setLoading(`subscription:${id}`);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "subscription", planId: id, interval }),
      });
      const data = (await res.json()) as { checkoutUrl?: string | null };
      if (data.checkoutUrl) {
        router.push(data.checkoutUrl);
      }
    } finally {
      setLoading(null);
    }
  }

  async function copyBillingEmail() {
    await navigator.clipboard.writeText("abhinav@pensil.io");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="relative min-h-screen">
      <GradientBg />

      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="mb-16 text-center">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors">
            Back to pensil.io
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 mt-6 mb-3">
            Clear plans for serious image creation.
          </h1>
          <p className="text-zinc-600 text-base max-w-2xl mx-auto leading-relaxed">
            pensil.io plans are built around monthly credits, clear renewals, and straightforward
            upgrades so you always know what you have available.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="inline-flex max-w-full flex-wrap justify-center rounded-[1.05rem] border border-zinc-200/80 bg-white/70 p-1 shadow-[0_10px_30px_rgba(24,24,27,0.08)] backdrop-blur-md">
              {(["monthly", "yearly"] as BillingInterval[]).map((value) => {
                const active = interval === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setInterval(value)}
                    className={`relative rounded-[0.8rem] px-3.5 py-1.5 text-xs font-semibold transition-all md:px-4 ${
                      active
                        ? "bg-zinc-900 text-white shadow-[0_8px_22px_rgba(24,24,27,0.18)]"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    <span className="capitalize">{value}</span>
                    {value === "yearly" ? (
                      <span
                        className={`ml-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${
                          active
                            ? "bg-white/14 text-zinc-100"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        Save {Math.round(YEARLY_DISCOUNT * 100)}%
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-medium tracking-wide text-zinc-500">
              {interval === "yearly"
                ? "Pay once per year and keep the 15% discount locked in."
                : "Switch to yearly billing to save 15%."}
            </p>
          </div>
        </div>

        <section id="plans" className="grid md:grid-cols-3 gap-4 mb-20">
          {PLAN_DEFINITIONS.map((plan) => {
            const isFeatured = plan.id === "pro";
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  isFeatured
                    ? "bg-zinc-900 border border-zinc-700"
                    : "bg-white/60 backdrop-blur-sm border border-zinc-200/60"
                }`}
              >
                {isFeatured && (
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-zinc-700 text-zinc-300">
                    Best balance
                  </div>
                )}

                <div className="mb-6">
                  <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${isFeatured ? "text-zinc-400" : "text-zinc-500"}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1.5 mb-1">
                    <span className={`text-4xl font-bold ${isFeatured ? "text-zinc-100" : "text-zinc-900"}`}>
                      {formatPrice(getPlanMonthlyEquivalent(plan, interval))}
                    </span>
                    <span className="text-sm mb-1.5 text-zinc-500">/ month</span>
                  </div>
                  {interval === "yearly" ? (
                    <p className={`text-xs ${isFeatured ? "text-zinc-400" : "text-zinc-500"}`}>
                      Billed yearly at {formatPrice(getPlanPrice(plan, "yearly"))}
                    </p>
                  ) : (
                    <p className={`text-xs ${isFeatured ? "text-zinc-400" : "text-zinc-500"}`}>
                      Billed monthly at {formatPrice(getPlanPrice(plan, "monthly"))}
                    </p>
                  )}
                  <p className={`text-sm mt-2 leading-relaxed ${isFeatured ? "text-zinc-400" : "text-zinc-500"}`}>
                    {plan.summary}
                  </p>
                </div>

                <div className={`rounded-xl p-4 mb-6 ${isFeatured ? "bg-zinc-800/60" : "bg-zinc-950/[0.03]"}`}>
                  <p className={`text-2xl font-bold ${isFeatured ? "text-zinc-100" : "text-zinc-900"}`}>
                    {plan.monthlyCredits.toLocaleString()} credits
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    About {plan.estimatedStandardJobs} standard jobs each month
                  </p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-start gap-2.5 text-sm ${isFeatured ? "text-zinc-300" : "text-zinc-700"}`}
                    >
                      <span className="text-zinc-400">
                        <Check />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => openCheckout(plan.id)}
                  className={`w-full text-center py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isFeatured
                      ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                      : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                  }`}
                  disabled={loading !== null}
                >
                  {loading === `subscription:${plan.id}` ? "Opening..." : `Choose ${plan.name}`}
                </button>
              </div>
            );
          })}
        </section>

        <section className="mb-20">
          <div className="bg-zinc-900 rounded-2xl p-8 md:p-10">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Why credits work
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-4 leading-snug">
              Simple usage, clear limits, no surprises.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Each plan gives you a monthly pool of credits, shows what remains inside the app,
              and makes it easy to renew or step up to a higher tier when you need more.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-left">
              {[
                { stat: "Monthly", label: "Credits reset on your billing cycle." },
                { stat: "Upgrade", label: "Move to a larger plan when your workload grows." },
                { stat: "Visible", label: "Track remaining usage directly in the app." },
              ].map(({ stat, label }) => (
                <div key={stat} className="bg-zinc-800/50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-zinc-100 mb-1">{stat}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-16">
          <h2 className="text-xl font-semibold text-zinc-900 mb-8 text-center">Common questions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="bg-white/50 backdrop-blur-sm border border-zinc-200/50 rounded-xl p-5">
                <p className="text-sm font-semibold text-zinc-900 mb-2">{q}</p>
                <p className="text-sm text-zinc-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <section
          id="billing-contact"
          className="rounded-2xl border border-zinc-200/60 bg-white/60 backdrop-blur-sm p-6 md:p-8 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Manual billing
          </p>
          <h2 className="text-2xl font-semibold text-zinc-900 mb-3">
            {requestedPlan ? `Continue with ${requestedPlan.name}` : "Need help with billing?"}
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-2xl mx-auto mb-5">
            {requestedPlan
              ? `We have your ${requestedPlan.name} ${requestedInterval} request ready. Use the billing contact below and mention your billing cadence so we can activate your subscription manually.`
              : "Need manual billing, a larger quota, or help onboarding a team? Reach out to billing and we will take it from there."}
          </p>
          <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-3 rounded-2xl border border-zinc-300/70 bg-zinc-50/80 px-4 py-3 mb-4">
            <span className="text-sm font-medium text-zinc-900">abhinav@pensil.io</span>
            <button
              onClick={copyBillingEmail}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-white transition-colors"
            >
              {copied ? "Copied" : "Copy email"}
            </button>
          </div>
          {requestedPlan && (
            <p className="text-xs text-zinc-500">
              Requested plan: <span className="font-medium text-zinc-700">{requestedPlan.name}</span>
              {" "}on the <span className="font-medium text-zinc-700 capitalize">{requestedInterval}</span> plan
              {requestedUser ? (
                <>
                  {" "}for user <span className="font-mono text-[11px] text-zinc-600">{requestedUser}</span>
                </>
              ) : null}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PricingContent />
    </Suspense>
  );
}
