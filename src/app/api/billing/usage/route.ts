import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUsageSummary } from "@/lib/billing/service";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to view usage." }, { status: 401 });
  }

  const summary = await getUsageSummary(userId);
  return NextResponse.json(summary);
}
