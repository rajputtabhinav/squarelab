import type { BillingInterval, PlanId, TopUpPackId } from "@/types";
import { formatPrice, getPlanDefinition, getPlanPrice, getTopUpPack } from "./config";

export interface CheckoutSession {
  checkoutUrl: string | null;
  provider: string;
  mode: "subscription" | "topup";
  externalReference?: string;
  message: string;
}

export interface BillingWebhookEvent {
  type: "subscription.updated" | "topup.completed";
  payload: Record<string, unknown>;
}

export interface BillingAdapter {
  createSubscriptionCheckout(userId: string, planId: PlanId, interval: BillingInterval): Promise<CheckoutSession>;
  createTopUpCheckout(userId: string, packId: TopUpPackId): Promise<CheckoutSession>;
  parseWebhook(body: unknown, secret?: string | null): Promise<BillingWebhookEvent | null>;
}

class ManualBillingAdapter implements BillingAdapter {
  async createSubscriptionCheckout(
    userId: string,
    planId: PlanId,
    interval: BillingInterval
  ): Promise<CheckoutSession> {
    const plan = getPlanDefinition(planId);
    const price = getPlanPrice(plan, interval);
    return {
      checkoutUrl: `/pricing?plan=${plan.id}&interval=${interval}&user=${encodeURIComponent(userId)}#billing-contact`,
      provider: "manual",
      mode: "subscription",
      message: `Billing provider not configured yet. Continue with the manual billing section on pensil.io for the ${plan.name} ${interval} plan at ${formatPrice(price)}.`,
    };
  }

  async createTopUpCheckout(userId: string, packId: TopUpPackId): Promise<CheckoutSession> {
    const pack = getTopUpPack(packId);
    return {
      checkoutUrl: `/pricing?topup=${pack.id}&user=${encodeURIComponent(userId)}#billing-contact`,
      provider: "manual",
      mode: "topup",
      message: "Billing provider not configured yet. Continue with the manual billing section on pensil.io.",
    };
  }

  async parseWebhook(body: unknown, secret?: string | null): Promise<BillingWebhookEvent | null> {
    if (process.env.BILLING_WEBHOOK_SECRET && secret !== process.env.BILLING_WEBHOOK_SECRET) {
      throw new Error("Invalid billing webhook secret.");
    }
    if (!body || typeof body !== "object") return null;

    const event = body as { type?: string; payload?: Record<string, unknown> };
    if (
      event.type === "subscription.updated" ||
      event.type === "topup.completed"
    ) {
      return {
        type: event.type,
        payload: event.payload ?? {},
      };
    }
    return null;
  }
}

let adapter: BillingAdapter | null = null;

export function getBillingAdapter() {
  if (!adapter) {
    adapter = new ManualBillingAdapter();
  }
  return adapter;
}
