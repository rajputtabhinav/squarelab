import { randomUUID } from "node:crypto";
import type {
  BillingInterval,
  BillingStatusResponse,
  CreditBalance,
  PlanId,
  SubscriptionState,
  TopUpPackId,
} from "@/types";
import { PLAN_DEFINITIONS, TOP_UP_PACKS, getPlanDefinition, getTopUpPack } from "./config";
import {
  estimateCreditsForGenerationCount,
  estimateJobCostUsd,
  estimateStandardJobCredits,
  estimateStandardJobsFromCredits,
  formatUsd,
} from "./costs";
import { getBillingAdapter } from "./payment-adapter";
import { runAbuseChecks } from "./rate-limit";
import { getBillingRepository } from "./storage";

export class BillingAccessError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

function isActiveSubscription(subscription: SubscriptionState | null) {
  if (!subscription) return false;
  if (!["active", "canceling"].includes(subscription.status)) return false;
  return new Date(subscription.cycleEnd).getTime() > Date.now();
}

function trimPrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, " ").slice(0, 120);
}

async function computeBalance(userId: string, subscription: SubscriptionState): Promise<CreditBalance> {
  const repo = getBillingRepository();
  const [usageEvents, topUps] = await Promise.all([
    repo.listUsageEvents(userId, 200),
    repo.listTopUps(userId),
  ]);

  const cycleStart = new Date(subscription.cycleStart).getTime();
  const cycleEnd = new Date(subscription.cycleEnd).getTime();

  const inCycle = usageEvents.filter((event) => {
    const createdAt = new Date(event.createdAt).getTime();
    return createdAt >= cycleStart && createdAt <= cycleEnd;
  });

  const consumedCredits = inCycle.reduce((sum, event) => {
    if (event.status !== "committed") return sum;
    return sum + event.actualCredits;
  }, 0);

  const reservedCredits = inCycle.reduce((sum, event) => {
    if (event.status !== "reserved") return sum;
    return sum + event.estimatedCredits;
  }, 0);

  const topUpCredits = topUps
    .filter((item) => {
      if (item.status !== "completed") return false;
      const completedAt = item.completedAt ? new Date(item.completedAt).getTime() : 0;
      return completedAt >= cycleStart && completedAt <= cycleEnd;
    })
    .reduce((sum, item) => sum + item.credits, 0);

  const remainingCredits = Math.max(
    0,
    subscription.monthlyCredits + topUpCredits - consumedCredits - reservedCredits
  );
  const plan = getPlanDefinition(subscription.planId);

  return {
    planId: subscription.planId,
    planName: plan.name,
    includedCredits: subscription.monthlyCredits,
    topUpCredits,
    reservedCredits,
    consumedCredits,
    remainingCredits,
    estimatedJobsRemaining: estimateStandardJobsFromCredits(remainingCredits),
    renewalDate: subscription.cycleEnd,
    hardStop: remainingCredits <= 0,
  };
}

export async function getBillingStatus(userId: string | null): Promise<BillingStatusResponse> {
  if (!userId) {
    return {
      signedIn: false,
      hasAccess: false,
      subscription: null,
      balance: null,
      plans: PLAN_DEFINITIONS,
      topUpPacks: TOP_UP_PACKS,
    };
  }

  const repo = getBillingRepository();
  const subscription = await repo.getSubscription(userId);
  const hasAccess = isActiveSubscription(subscription);
  const balance = hasAccess && subscription ? await computeBalance(userId, subscription) : null;

  return {
    signedIn: true,
    hasAccess,
    subscription,
    balance,
    plans: PLAN_DEFINITIONS,
    topUpPacks: TOP_UP_PACKS,
  };
}

export async function beginGenerationSession(input: {
  userId: string;
  ip: string;
  fingerprint: string;
  prompt: string;
  generationCount: number;
}) {
  const repo = getBillingRepository();
  const subscription = await repo.getSubscription(input.userId);
  if (!isActiveSubscription(subscription)) {
    throw new BillingAccessError(
      "An active paid plan is required before you can generate. Choose a plan or complete billing first.",
      402
    );
  }
  const activeSubscription = subscription as SubscriptionState;

  const abuse = await runAbuseChecks({
    userId: input.userId,
    ip: input.ip,
    fingerprint: input.fingerprint,
  });

  if (abuse.blocked) {
    await repo.createAbuseFlag({
      userId: input.userId,
      ip: input.ip,
      fingerprint: input.fingerprint,
      reason: abuse.reason ?? "Burst rate limit exceeded.",
      severity: abuse.severity ?? "warning",
    });
    throw new BillingAccessError(
      `${abuse.reason ?? "Too many generation attempts."} Try again after ${abuse.retryAt ?? "the cooldown window"}.`,
      429
    );
  }

  const balance = await computeBalance(input.userId, activeSubscription);
  const estimatedCredits = estimateCreditsForGenerationCount(input.generationCount);
  const estimatedCostUsd = formatUsd(estimateJobCostUsd(input.generationCount));

  if (balance.remainingCredits < estimatedCredits) {
    throw new BillingAccessError(
      `You need ${estimatedCredits} credits for this request but only have ${balance.remainingCredits} remaining. Renew your plan or upgrade to a larger one.`,
      402
    );
  }

  const usageEvent = await repo.createUsageReservation({
    userId: input.userId,
    requestId: randomUUID(),
    promptPreview: trimPrompt(input.prompt),
    generationCount: input.generationCount,
    models: ["anthropic/claude-opus-4.6", "google/gemini-3.1-flash-image-preview"],
    estimatedCredits,
    estimatedCostUsd,
    metadata: {
      ip: input.ip,
      fingerprint: input.fingerprint,
    },
  });

  const nextBalance = await computeBalance(input.userId, activeSubscription);
  return {
    usageEvent,
    subscription: activeSubscription,
    balance: nextBalance,
    estimatedCredits,
  };
}

export async function finalizeGenerationSession(input: {
  eventId: string;
  userId: string;
  actualImageCount: number;
  failureReason?: string | null;
}) {
  const repo = getBillingRepository();
  const actualImages = Math.max(0, input.actualImageCount);
  const actualCredits = actualImages > 0 ? estimateCreditsForGenerationCount(actualImages) : 0;
  const actualCostUsd = actualImages > 0 ? formatUsd(estimateJobCostUsd(actualImages)) : 0;

  await repo.finalizeUsageEvent({
    eventId: input.eventId,
    status: actualImages > 0 ? "committed" : "refunded",
    actualCredits,
    actualCostUsd,
    failureReason: input.failureReason ?? null,
  });

  return getBillingStatus(input.userId);
}

export async function getUsageSummary(userId: string) {
  const repo = getBillingRepository();
  const status = await getBillingStatus(userId);
  const usageEvents = await repo.listUsageEvents(userId, 50);
  return {
    status,
    usageEvents,
  };
}

export async function createCheckoutSession(input: {
  userId: string;
  mode: "subscription" | "topup";
  planId?: PlanId;
  interval?: BillingInterval;
  packId?: TopUpPackId;
}) {
  const adapter = getBillingAdapter();
  if (input.mode === "subscription") {
    const planId = input.planId ?? "starter";
    const interval = input.interval ?? "monthly";
    return adapter.createSubscriptionCheckout(input.userId, planId, interval);
  }

  const packId = input.packId ?? "small";
  const pack = getTopUpPack(packId);
  const repo = getBillingRepository();
  await repo.createTopUp({
    userId: input.userId,
    packId,
    credits: pack.credits,
    amountCents: pack.priceCents,
    status: "pending",
    provider: "manual",
  });
  return adapter.createTopUpCheckout(input.userId, packId);
}

function startOfMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function endOfMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

export async function applyWebhookEvent(event: {
  type: "subscription.updated" | "topup.completed";
  payload: Record<string, unknown>;
}) {
  const repo = getBillingRepository();
  if (event.type === "subscription.updated") {
    const userId = String(event.payload.userId ?? "");
    if (!userId) throw new Error("Missing userId in subscription.updated payload.");
    const planId = String(event.payload.planId ?? "starter") as PlanId;
    const plan = getPlanDefinition(planId);
    return repo.upsertSubscription({
      userId,
      planId,
      status: String(event.payload.status ?? "active") as SubscriptionState["status"],
      provider: String(event.payload.provider ?? "manual"),
      monthlyCredits: Number(event.payload.monthlyCredits ?? plan.monthlyCredits),
      priceCents: Number(event.payload.priceCents ?? plan.monthlyPriceCents),
      billingInterval: String(event.payload.billingInterval ?? "monthly") as BillingInterval,
      cycleStart: String(event.payload.cycleStart ?? startOfMonth()),
      cycleEnd: String(event.payload.cycleEnd ?? endOfMonth()),
      cancelAtCycleEnd: Boolean(event.payload.cancelAtCycleEnd ?? false),
      externalReference: String(event.payload.externalReference ?? ""),
    });
  }

  const topUpId = String(event.payload.topUpId ?? "");
  if (!topUpId) throw new Error("Missing topUpId in topup.completed payload.");
  return repo.markTopUpCompleted(topUpId, String(event.payload.externalReference ?? ""));
}

export function getPricingSnapshot() {
  return {
    plans: PLAN_DEFINITIONS.map((plan) => ({
      ...plan,
      standardJobCredits: estimateStandardJobCredits(),
    })),
    topUpPacks: TOP_UP_PACKS,
  };
}
