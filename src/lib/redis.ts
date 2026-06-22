import Redis from "ioredis";
import { env } from "./env";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedis(): Redis | null {
  try {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    client.on("error", (err) => {
      console.warn("[redis]", err.message);
    });
    return client;
  } catch {
    return null;
  }
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 600,
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // cache miss is non-fatal
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // ignore
  }
}
