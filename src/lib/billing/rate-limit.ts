import type { AbuseSeverity } from "@/types";

interface ConsumeWindowInput {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
}

interface ConsumeResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimiter {
  consume(input: ConsumeWindowInput): Promise<ConsumeResult>;
}

class MemoryRateLimiter implements RateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();

  async consume(input: ConsumeWindowInput): Promise<ConsumeResult> {
    const now = Date.now();
    const token = `${input.scope}:${input.key}`;
    const current = this.store.get(token);

    if (!current || now >= current.resetAt) {
      const next = { count: 1, resetAt: now + input.windowMs };
      this.store.set(token, next);
      return { allowed: true, remaining: Math.max(0, input.limit - 1), resetAt: next.resetAt };
    }

    current.count += 1;
    return {
      allowed: current.count <= input.limit,
      remaining: Math.max(0, input.limit - current.count),
      resetAt: current.resetAt,
    };
  }
}

class RedisRateLimiter implements RateLimiter {
  private clientPromise: Promise<{
    incr: (key: string) => Promise<number>;
    pExpire: (key: string, ms: number) => Promise<number>;
    pTTL: (key: string) => Promise<number>;
  }>;

  constructor(url: string) {
    this.clientPromise = (async () => {
      const { createClient } = await import("redis");
      const client = createClient({ url });
      client.on("error", () => {});
      if (!client.isOpen) {
        await client.connect();
      }
      return client;
    })();
  }

  async consume(input: ConsumeWindowInput): Promise<ConsumeResult> {
    const client = await this.clientPromise;
    const token = `${input.scope}:${input.key}`;
    const current = await client.incr(token);
    if (current === 1) {
      await client.pExpire(token, input.windowMs);
    }
    const ttl = await client.pTTL(token);
    return {
      allowed: current <= input.limit,
      remaining: Math.max(0, input.limit - current),
      resetAt: Date.now() + Math.max(ttl, 0),
    };
  }
}

function getLimiter(): RateLimiter {
  const redisUrl = process.env.REDIS_URL;
  const globalStore = globalThis as typeof globalThis & {
    __pensilRateLimiter?: RateLimiter;
  };

  if (redisUrl) {
    if (!globalStore.__pensilRateLimiter) {
      globalStore.__pensilRateLimiter = new RedisRateLimiter(redisUrl);
    }
    return globalStore.__pensilRateLimiter;
  }

  if (!globalStore.__pensilRateLimiter) {
    globalStore.__pensilRateLimiter = new MemoryRateLimiter();
  }
  return globalStore.__pensilRateLimiter;
}

export interface AbuseCheckInput {
  userId: string;
  ip: string;
  fingerprint: string;
}

export interface AbuseCheckResult {
  blocked: boolean;
  reason?: string;
  severity?: AbuseSeverity;
  retryAt?: string;
}

export async function runAbuseChecks(input: AbuseCheckInput): Promise<AbuseCheckResult> {
  const limiter = getLimiter();
  const checks: Array<ConsumeWindowInput & { reason: string; severity: AbuseSeverity }> = [
    {
      scope: "user-burst",
      key: input.userId,
      limit: 3,
      windowMs: 5 * 60 * 1000,
      reason: "Too many generation attempts in a short window.",
      severity: "warning",
    },
    {
      scope: "ip-burst",
      key: input.ip,
      limit: 10,
      windowMs: 10 * 60 * 1000,
      reason: "IP-level burst threshold exceeded.",
      severity: "critical",
    },
    {
      scope: "device-burst",
      key: input.fingerprint,
      limit: 5,
      windowMs: 10 * 60 * 1000,
      reason: "Device fingerprint exceeded the burst threshold.",
      severity: "warning",
    },
  ];

  for (const check of checks) {
    const result = await limiter.consume(check);
    if (!result.allowed) {
      return {
        blocked: true,
        reason: check.reason,
        severity: check.severity,
        retryAt: new Date(result.resetAt).toISOString(),
      };
    }
  }

  return { blocked: false };
}
