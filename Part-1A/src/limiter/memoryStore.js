const { TokenBucket } = require('./tokenBucket');

/**
 * In-memory client bucket store with TTL idle eviction.
 */
class MemoryStore {
  constructor(defaultTtlMs = 3600000) { // 1 hour idle TTL
    this.buckets = new Map();
    this.defaultTtlMs = defaultTtlMs;
  }

  getOrCreate(clientKey, tierConfig, now = Date.now()) {
    const entry = this.buckets.get(clientKey);
    if (entry) {
      entry.lastAccessed = now;
      return entry.bucket;
    }

    const bucket = new TokenBucket(tierConfig.burst, tierConfig.refillRate);
    this.buckets.set(clientKey, {
      bucket,
      lastAccessed: now,
      tier: tierConfig.name
    });
    return bucket;
  }

  evictExpired(maxIdleMs = this.defaultTtlMs, now = Date.now()) {
    let evictedCount = 0;
    for (const [key, entry] of this.buckets.entries()) {
      if (now - entry.lastAccessed > maxIdleMs) {
        this.buckets.delete(key);
        evictedCount++;
      }
    }
    return evictedCount;
  }

  size() {
    return this.buckets.size;
  }

  clear() {
    this.buckets.clear();
  }
}

module.exports = { MemoryStore };
