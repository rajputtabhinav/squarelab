import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/billing/service";
import type { BillingInterval, PlanId } from "@/types";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
  }

  const body = (await req.json()) as {
    mode?: "subscription";
    planId?: PlanId;
    interval?: BillingInterval;
  };

  if (body.mode && body.mode !== "subscription") {
    return NextResponse.json({ error: "Top-up purchases are not available." }, { status: 400 });
  }

  const session = await createCheckoutSession({
    userId,
    mode: "subscription",
    planId: body.planId,
    interval: body.interval,
  });

  return NextResponse.json(session);
}
