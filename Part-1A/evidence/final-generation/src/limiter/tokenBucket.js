/**
 * Token Bucket implementation with continuous time refill.
 */
class TokenBucket {
  constructor(capacity, refillRate, initialTokens = null) {
    if (capacity <= 0) {
      throw new Error('Capacity must be a positive number');
    }
    if (refillRate <= 0) {
      throw new Error('Refill rate must be a positive number');
    }

    this.capacity = capacity;
    this.refillRate = refillRate; // tokens per second
    this.tokens = initialTokens !== null ? Math.min(capacity, initialTokens) : capacity;
    this.lastRefill = Date.now();
  }

  refill(now = Date.now()) {
    const elapsedSeconds = Math.max(0, (now - this.lastRefill) / 1000);
    const tokensToAdd = elapsedSeconds * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  consume(cost = 1, now = Date.now()) {
    this.refill(now);

    if (this.tokens >= cost) {
      this.tokens -= cost;
      const remaining = Math.max(0, Math.floor(this.tokens));
      const reset = Math.ceil((this.capacity - this.tokens) / this.refillRate);

      return {
        allowed: true,
        remaining,
        exactTokens: this.tokens,
        reset,
        retryAfter: 0
      };
    }

    // Rate limit exceeded
    const remaining = Math.max(0, Math.floor(this.tokens));
    const deficit = cost - this.tokens;
    const retryAfter = Math.max(1, Math.ceil(deficit / this.refillRate));
    const reset = Math.ceil((this.capacity - this.tokens) / this.refillRate);

    return {
      allowed: false,
      remaining,
      exactTokens: this.tokens,
      reset,
      retryAfter
    };
  }
}

module.exports = { TokenBucket };
