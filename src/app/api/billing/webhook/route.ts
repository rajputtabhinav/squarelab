import { NextResponse } from "next/server";
import { getBillingAdapter } from "@/lib/billing/payment-adapter";
import { applyWebhookEvent } from "@/lib/billing/service";

export async function POST(req: Request) {
  const body = (await req.json()) as unknown;
  const secret = req.headers.get("x-billing-secret");
  const adapter = getBillingAdapter();
  const event = await adapter.parseWebhook(body, secret);

  if (!event) {
    return NextResponse.json({ error: "Unsupported billing webhook event." }, { status: 400 });
  }

  const result = await applyWebhookEvent(event);
  return NextResponse.json({ ok: true, result });
}
