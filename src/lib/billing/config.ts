import type { BillingInterval, PlanDefinition, PlanId, TopUpPack, TopUpPackId } from "@/types";
import { estimateStandardJobsFromCredits } from "./costs";

export const TARGET_MARGIN = 0.35;
export const YEARLY_DISCOUNT = 0.15;

const rawPlans: Array<
  Omit<PlanDefinition, "estimatedStandardJobs" | "yearlyPriceCents"> & {
    id: PlanId;
  }
> = [
  {
    id: "starter",
    name: "Starter",
    monthlyPriceCents: 2000,
    monthlyCredits: 900,
    targetMargin: TARGET_MARGIN,
    summary: "For solo creators who need professional outputs without burning margin.",
    features: [
      "900 monthly credits",
      "Priority generation queue",
      "Credit dashboard and usage history",
      "Hard-stop protection before overspend",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPriceCents: 5000,
    monthlyCredits: 2500,
    targetMargin: TARGET_MARGIN,
    summary: "For operators publishing every week across multiple channels.",
    features: [
      "2,500 monthly credits",
      "Faster queue priority",
      "Stricter concurrency allowances",
      "Built for heavier monthly output",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPriceCents: 9900,
    monthlyCredits: 5600,
    targetMargin: TARGET_MARGIN,
    summary: "For teams running high-volume creative production with predictable spend.",
    features: [
      "5,600 monthly credits",
      "Highest queue priority",
      "Expanded operational limits",
      "Manual billing support for larger workloads",
    ],
  },
];

export const PLAN_DEFINITIONS: PlanDefinition[] = rawPlans.map((plan) => ({
  ...plan,
  yearlyPriceCents: Math.round(plan.monthlyPriceCents * 12 * (1 - YEARLY_DISCOUNT)),
  estimatedStandardJobs: estimateStandardJobsFromCredits(plan.monthlyCredits),
}));

export const TOP_UP_PACKS: TopUpPack[] = [
  {
    id: "small",
    name: "Small top-up",
    credits: 250,
    priceCents: 700,
    summary: "Enough to get through a busy week without changing plans.",
  },
  {
    id: "medium",
    name: "Medium top-up",
    credits: 700,
    priceCents: 1800,
    summary: "A larger credit refill for launches and campaign bursts.",
  },
];

export function getPlanDefinition(planId: PlanId) {
  return PLAN_DEFINITIONS.find((plan) => plan.id === planId) ?? PLAN_DEFINITIONS[0];
}

export function getTopUpPack(packId: TopUpPackId) {
  return TOP_UP_PACKS.find((pack) => pack.id === packId) ?? TOP_UP_PACKS[0];
}

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export function getPlanPrice(plan: PlanDefinition, interval: BillingInterval) {
  return interval === "yearly" ? plan.yearlyPriceCents : plan.monthlyPriceCents;
}

export function getPlanMonthlyEquivalent(plan: PlanDefinition, interval: BillingInterval) {
  const total = getPlanPrice(plan, interval);
  return interval === "yearly" ? Math.round(total / 12) : total;
}
