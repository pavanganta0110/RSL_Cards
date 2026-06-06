import { redisAdapter } from '../../../adapters/redis.adapter.js';
import { logger } from '../../../lib/logger.js';

export class CacheProvider {
  private memoryCache = new Map<string, { value: string; expiresAt: number }>();
  private defaultTtl: number;

  constructor() {
    this.defaultTtl = Number(process.env.AI_CARD_SEARCH_CACHE_TTL_SECONDS || '3600');
  }

  async get(key: string): Promise<string | null> {
    try {
      const redisVal = await redisAdapter.get(key);
      if (redisVal) return redisVal;
    } catch (err: any) {
      logger.debug(`Redis get failed: ${err.message}. Checking memory fallback.`);
    }

    // In-memory fallback
    const cached = this.memoryCache.get(key);
    if (cached) {
      if (cached.expiresAt > Date.now()) {
        return cached.value;
      }
      this.memoryCache.delete(key);
    }
    return null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTtl;
    try {
      await redisAdapter.set(key, value, ttl);
    } catch (err: any) {
      logger.debug(`Redis set failed: ${err.message}. Using memory fallback.`);
    }

    // In-memory fallback
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    try {
      await redisAdapter.delete(key);
    } catch (err: any) {
      logger.debug(`Redis delete failed: ${err.message}. Using memory fallback.`);
    }
    this.memoryCache.delete(key);
  }
}

export const cacheProvider = new CacheProvider();
