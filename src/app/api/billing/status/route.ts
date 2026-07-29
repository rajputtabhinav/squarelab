import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getBillingStatus } from "@/lib/billing/service";

export async function GET() {
  const { userId } = await auth();
  const status = await getBillingStatus(userId);
  return NextResponse.json(status);
}
