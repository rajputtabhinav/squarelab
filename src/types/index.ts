export interface TextOverlay {
  text: string;
  position: string;
  color: string;
  strokeColor?: string;
  fontFamily?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  type: "thumbnail" | "banner";
  width: number;
  height: number;
  score?: number;
  textOverlay?: TextOverlay;
}

export type ImageFormat =
  | "youtube-thumbnail"
  | "instagram-post"
  | "instagram-story"
  | "twitter-banner"
  | "blog-header"
  | "custom";

export interface FormatConfig {
  label: string;
  shortLabel: string;
  aspectRatio: string;
  width: number;
  height: number;
  placeholder: string;
  description: string;
}

export type AppStatus = "idle" | "generating" | "results";

export interface GenerationRecord {
  id: string;
  prompt: string;
  format: ImageFormat;
  imageCount: number;
  createdAt: string;
  previewUrl: string;
}

export type PlanId = "starter" | "pro" | "agency";
export type BillingInterval = "monthly" | "yearly";
export type SubscriptionStatus =
  | "active"
  | "canceling"
  | "past_due"
  | "expired"
  | "pending";
export type TopUpPackId = "small" | "medium";
export type UsageEventStatus = "reserved" | "committed" | "refunded";
export type AbuseSeverity = "info" | "warning" | "critical";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  monthlyCredits: number;
  targetMargin: number;
  estimatedStandardJobs: number;
  summary: string;
  features: string[];
}

export interface TopUpPack {
  id: TopUpPackId;
  name: string;
  credits: number;
  priceCents: number;
  summary: string;
}

export interface SubscriptionState {
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  provider: string;
  monthlyCredits: number;
  priceCents: number;
  billingInterval?: BillingInterval;
  cycleStart: string;
  cycleEnd: string;
  cancelAtCycleEnd: boolean;
  externalReference?: string | null;
}

export interface CreditBalance {
  planId: PlanId | null;
  planName: string | null;
  includedCredits: number;
  topUpCredits: number;
  reservedCredits: number;
  consumedCredits: number;
  remainingCredits: number;
  estimatedJobsRemaining: number;
  renewalDate: string | null;
  hardStop: boolean;
}

export interface UsageEvent {
  id: string;
  userId: string;
  requestId: string;
  status: UsageEventStatus;
  promptPreview: string;
  generationCount: number;
  models: string[];
  estimatedCredits: number;
  actualCredits: number;
  estimatedCostUsd: number;
  actualCostUsd: number;
  metadata?: Record<string, unknown>;
  failureReason?: string | null;
  createdAt: string;
  finalizedAt?: string | null;
}

export interface TopUpPurchase {
  id: string;
  userId: string;
  packId: TopUpPackId;
  credits: number;
  amountCents: number;
  status: "pending" | "completed" | "failed";
  provider: string;
  externalReference?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface AbuseFlag {
  id: string;
  userId?: string | null;
  ip?: string | null;
  fingerprint?: string | null;
  reason: string;
  severity: AbuseSeverity;
  createdAt: string;
}

export interface BillingStatusResponse {
  signedIn: boolean;
  hasAccess: boolean;
  subscription: SubscriptionState | null;
  balance: CreditBalance | null;
  plans: PlanDefinition[];
  topUpPacks: TopUpPack[];
}

export interface ThumbnailSpec {
  imagePrompt: string;
  textOverlay?: TextOverlay;
  lightingSetup: string;
  colorGrade: string;
  cinemaReference: string;
  focalPoint: string;
  negativePrompt: string;
  colorPalette: string[];
  composition: string;
  style: string;
  targetType: "thumbnail" | "banner";
}
