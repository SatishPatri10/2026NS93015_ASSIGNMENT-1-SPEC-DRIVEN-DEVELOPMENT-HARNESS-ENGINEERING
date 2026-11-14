const { TokenBucket } = require('./tokenBucket');

/**
 * Initial generation: Naive in-memory store lacking eviction logic.
 * (Vulnerable to unbounded memory growth)
 */
class MemoryStore {
  constructor() {
    this.buckets = new Map();
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

  size() {
    return this.buckets.size;
  }
}

module.exports = { MemoryStore };
