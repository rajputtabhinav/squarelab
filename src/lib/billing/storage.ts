import { randomUUID } from "node:crypto";
import type {
  AbuseFlag,
  SubscriptionState,
  TopUpPackId,
  TopUpPurchase,
  UsageEvent,
} from "@/types";

type UpsertSubscriptionInput = Omit<SubscriptionState, "userId"> & { userId: string };
type CreateTopUpInput = {
  userId: string;
  packId: TopUpPackId;
  credits: number;
  amountCents: number;
  status: TopUpPurchase["status"];
  provider: string;
  externalReference?: string | null;
};
type ReserveUsageInput = Omit<
  UsageEvent,
  "id" | "status" | "actualCredits" | "actualCostUsd" | "createdAt" | "finalizedAt"
>;
type FinalizeUsageInput = {
  eventId: string;
  status: "committed" | "refunded";
  actualCredits: number;
  actualCostUsd: number;
  failureReason?: string | null;
};
type AbuseInput = Omit<AbuseFlag, "id" | "createdAt">;

export interface BillingRepository {
  getSubscription(userId: string): Promise<SubscriptionState | null>;
  upsertSubscription(input: UpsertSubscriptionInput): Promise<SubscriptionState>;
  listTopUps(userId: string): Promise<TopUpPurchase[]>;
  createTopUp(input: CreateTopUpInput): Promise<TopUpPurchase>;
  markTopUpCompleted(id: string, externalReference?: string | null): Promise<TopUpPurchase | null>;
  createUsageReservation(input: ReserveUsageInput): Promise<UsageEvent>;
  finalizeUsageEvent(input: FinalizeUsageInput): Promise<UsageEvent | null>;
  listUsageEvents(userId: string, limit?: number): Promise<UsageEvent[]>;
  createAbuseFlag(input: AbuseInput): Promise<AbuseFlag>;
}

function nowIso() {
  return new Date().toISOString();
}

class MemoryBillingRepository implements BillingRepository {
  private subscriptions = new Map<string, SubscriptionState>();
  private topUps = new Map<string, TopUpPurchase>();
  private usageEvents = new Map<string, UsageEvent>();

  async getSubscription(userId: string) {
    return this.subscriptions.get(userId) ?? null;
  }

  async upsertSubscription(input: UpsertSubscriptionInput) {
    const record: SubscriptionState = {
      ...input,
      externalReference: input.externalReference ?? null,
    };
    this.subscriptions.set(input.userId, record);
    return record;
  }

  async listTopUps(userId: string) {
    return Array.from(this.topUps.values())
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createTopUp(input: CreateTopUpInput) {
    const record: TopUpPurchase = {
      id: randomUUID(),
      userId: input.userId,
      packId: input.packId,
      credits: input.credits,
      amountCents: input.amountCents,
      status: input.status,
      provider: input.provider,
      externalReference: input.externalReference ?? null,
      createdAt: nowIso(),
      completedAt: input.status === "completed" ? nowIso() : null,
    };
    this.topUps.set(record.id, record);
    return record;
  }

  async markTopUpCompleted(id: string, externalReference?: string | null) {
    const current = this.topUps.get(id);
    if (!current) return null;
    const next: TopUpPurchase = {
      ...current,
      status: "completed",
      externalReference: externalReference ?? current.externalReference ?? null,
      completedAt: nowIso(),
    };
    this.topUps.set(id, next);
    return next;
  }

  async createUsageReservation(input: ReserveUsageInput) {
    const record: UsageEvent = {
      id: randomUUID(),
      ...input,
      status: "reserved",
      actualCredits: 0,
      actualCostUsd: 0,
      failureReason: null,
      createdAt: nowIso(),
      finalizedAt: null,
    };
    this.usageEvents.set(record.id, record);
    return record;
  }

  async finalizeUsageEvent(input: FinalizeUsageInput) {
    const current = this.usageEvents.get(input.eventId);
    if (!current) return null;
    const next: UsageEvent = {
      ...current,
      status: input.status,
      actualCredits: input.actualCredits,
      actualCostUsd: input.actualCostUsd,
      failureReason: input.failureReason ?? null,
      finalizedAt: nowIso(),
    };
    this.usageEvents.set(next.id, next);
    return next;
  }

  async listUsageEvents(userId: string, limit = 100) {
    return Array.from(this.usageEvents.values())
      .filter((event) => event.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async createAbuseFlag(input: AbuseInput) {
    return {
      id: randomUUID(),
      ...input,
      createdAt: nowIso(),
    };
  }
}

class PostgresBillingRepository implements BillingRepository {
  private poolPromise: Promise<import("pg").Pool>;
  private initPromise: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.poolPromise = (async () => {
      const { Pool } = await import("pg");
      return new Pool({ connectionString });
    })();
  }

  private async pool() {
    const pool = await this.poolPromise;
    if (!this.initPromise) {
      this.initPromise = this.ensureSchema(pool);
    }
    await this.initPromise;
    return pool;
  }

  private async ensureSchema(pool: import("pg").Pool) {
    await pool.query(`
      create table if not exists billing_subscriptions (
        user_id text primary key,
        plan_id text not null,
        status text not null,
        provider text not null,
        monthly_credits integer not null,
        price_cents integer not null,
        cycle_start timestamptz not null,
        cycle_end timestamptz not null,
        cancel_at_cycle_end boolean not null default false,
        external_reference text,
        updated_at timestamptz not null default now()
      );

      create table if not exists billing_topups (
        id uuid primary key,
        user_id text not null,
        pack_id text not null,
        credits integer not null,
        amount_cents integer not null,
        status text not null,
        provider text not null,
        external_reference text,
        created_at timestamptz not null default now(),
        completed_at timestamptz
      );

      create table if not exists billing_usage_events (
        id uuid primary key,
        user_id text not null,
        request_id text not null,
        status text not null,
        prompt_preview text not null,
        generation_count integer not null,
        models jsonb not null default '[]'::jsonb,
        estimated_credits integer not null,
        actual_credits integer not null default 0,
        estimated_cost_usd numeric(12, 4) not null,
        actual_cost_usd numeric(12, 4) not null default 0,
        metadata jsonb,
        failure_reason text,
        created_at timestamptz not null default now(),
        finalized_at timestamptz
      );

      create table if not exists billing_abuse_flags (
        id uuid primary key,
        user_id text,
        ip text,
        fingerprint text,
        reason text not null,
        severity text not null,
        created_at timestamptz not null default now()
      );
    `);
  }

  async getSubscription(userId: string) {
    const pool = await this.pool();
    const result = await pool.query("select * from billing_subscriptions where user_id = $1 limit 1", [userId]);
    const row = result.rows[0];
    if (!row) return null;
    return {
      userId: row.user_id,
      planId: row.plan_id,
      status: row.status,
      provider: row.provider,
      monthlyCredits: row.monthly_credits,
      priceCents: row.price_cents,
      cycleStart: new Date(row.cycle_start).toISOString(),
      cycleEnd: new Date(row.cycle_end).toISOString(),
      cancelAtCycleEnd: row.cancel_at_cycle_end,
      externalReference: row.external_reference,
    };
  }

  async upsertSubscription(input: UpsertSubscriptionInput) {
    const pool = await this.pool();
    await pool.query(
      `
        insert into billing_subscriptions (
          user_id, plan_id, status, provider, monthly_credits, price_cents, cycle_start, cycle_end, cancel_at_cycle_end, external_reference, updated_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
        on conflict (user_id) do update set
          plan_id = excluded.plan_id,
          status = excluded.status,
          provider = excluded.provider,
          monthly_credits = excluded.monthly_credits,
          price_cents = excluded.price_cents,
          cycle_start = excluded.cycle_start,
          cycle_end = excluded.cycle_end,
          cancel_at_cycle_end = excluded.cancel_at_cycle_end,
          external_reference = excluded.external_reference,
          updated_at = now()
      `,
      [
        input.userId,
        input.planId,
        input.status,
        input.provider,
        input.monthlyCredits,
        input.priceCents,
        input.cycleStart,
        input.cycleEnd,
        input.cancelAtCycleEnd,
        input.externalReference ?? null,
      ]
    );
    return (await this.getSubscription(input.userId)) as SubscriptionState;
  }

  async listTopUps(userId: string) {
    const pool = await this.pool();
    const result = await pool.query("select * from billing_topups where user_id = $1 order by created_at desc", [userId]);
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      packId: row.pack_id,
      credits: row.credits,
      amountCents: row.amount_cents,
      status: row.status,
      provider: row.provider,
      externalReference: row.external_reference,
      createdAt: new Date(row.created_at).toISOString(),
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    }));
  }

  async createTopUp(input: CreateTopUpInput) {
    const id = randomUUID();
    const pool = await this.pool();
    await pool.query(
      `
        insert into billing_topups (
          id, user_id, pack_id, credits, amount_cents, status, provider, external_reference, created_at, completed_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8, now(), $9)
      `,
      [
        id,
        input.userId,
        input.packId,
        input.credits,
        input.amountCents,
        input.status,
        input.provider,
        input.externalReference ?? null,
        input.status === "completed" ? nowIso() : null,
      ]
    );
    const topups = await this.listTopUps(input.userId);
    return topups.find((item) => item.id === id) as TopUpPurchase;
  }

  async markTopUpCompleted(id: string, externalReference?: string | null) {
    const pool = await this.pool();
    const result = await pool.query(
      `
        update billing_topups
        set status = 'completed', external_reference = coalesce($2, external_reference), completed_at = now()
        where id = $1
        returning *
      `,
      [id, externalReference ?? null]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      packId: row.pack_id,
      credits: row.credits,
      amountCents: row.amount_cents,
      status: row.status,
      provider: row.provider,
      externalReference: row.external_reference,
      createdAt: new Date(row.created_at).toISOString(),
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    };
  }

  async createUsageReservation(input: ReserveUsageInput) {
    const id = randomUUID();
    const pool = await this.pool();
    await pool.query(
      `
        insert into billing_usage_events (
          id, user_id, request_id, status, prompt_preview, generation_count, models, estimated_credits, actual_credits, estimated_cost_usd, actual_cost_usd, metadata, failure_reason, created_at, finalized_at
        ) values ($1,$2,$3,'reserved',$4,$5,$6,$7,0,$8,0,$9,null, now(), null)
      `,
      [
        id,
        input.userId,
        input.requestId,
        input.promptPreview,
        input.generationCount,
        JSON.stringify(input.models),
        input.estimatedCredits,
        input.estimatedCostUsd,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ]
    );
    const events = await this.listUsageEvents(input.userId, 200);
    return events.find((event) => event.id === id) as UsageEvent;
  }

  async finalizeUsageEvent(input: FinalizeUsageInput) {
    const pool = await this.pool();
    const result = await pool.query(
      `
        update billing_usage_events
        set status = $2, actual_credits = $3, actual_cost_usd = $4, failure_reason = $5, finalized_at = now()
        where id = $1
        returning *
      `,
      [input.eventId, input.status, input.actualCredits, input.actualCostUsd, input.failureReason ?? null]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      requestId: row.request_id,
      status: row.status,
      promptPreview: row.prompt_preview,
      generationCount: row.generation_count,
      models: row.models ?? [],
      estimatedCredits: row.estimated_credits,
      actualCredits: row.actual_credits,
      estimatedCostUsd: Number(row.estimated_cost_usd),
      actualCostUsd: Number(row.actual_cost_usd),
      metadata: row.metadata ?? undefined,
      failureReason: row.failure_reason,
      createdAt: new Date(row.created_at).toISOString(),
      finalizedAt: row.finalized_at ? new Date(row.finalized_at).toISOString() : null,
    };
  }

  async listUsageEvents(userId: string, limit = 100) {
    const pool = await this.pool();
    const result = await pool.query(
      "select * from billing_usage_events where user_id = $1 order by created_at desc limit $2",
      [userId, limit]
    );
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      requestId: row.request_id,
      status: row.status,
      promptPreview: row.prompt_preview,
      generationCount: row.generation_count,
      models: row.models ?? [],
      estimatedCredits: row.estimated_credits,
      actualCredits: row.actual_credits,
      estimatedCostUsd: Number(row.estimated_cost_usd),
      actualCostUsd: Number(row.actual_cost_usd),
      metadata: row.metadata ?? undefined,
      failureReason: row.failure_reason,
      createdAt: new Date(row.created_at).toISOString(),
      finalizedAt: row.finalized_at ? new Date(row.finalized_at).toISOString() : null,
    }));
  }

  async createAbuseFlag(input: AbuseInput) {
    const pool = await this.pool();
    const id = randomUUID();
    await pool.query(
      `
        insert into billing_abuse_flags (id, user_id, ip, fingerprint, reason, severity, created_at)
        values ($1,$2,$3,$4,$5,$6, now())
      `,
      [id, input.userId ?? null, input.ip ?? null, input.fingerprint ?? null, input.reason, input.severity]
    );
    return {
      id,
      ...input,
      createdAt: nowIso(),
    };
  }
}

export function getBillingRepository(): BillingRepository {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const globalPool = globalThis as typeof globalThis & {
      __pensilBillingRepo?: BillingRepository;
    };
    if (!globalPool.__pensilBillingRepo) {
      globalPool.__pensilBillingRepo = new PostgresBillingRepository(connectionString);
    }
    return globalPool.__pensilBillingRepo;
  }

  const globalMemory = globalThis as typeof globalThis & {
    __pensilMemoryBillingRepo?: MemoryBillingRepository;
  };
  if (!globalMemory.__pensilMemoryBillingRepo) {
    globalMemory.__pensilMemoryBillingRepo = new MemoryBillingRepository();
  }
  return globalMemory.__pensilMemoryBillingRepo;
}
