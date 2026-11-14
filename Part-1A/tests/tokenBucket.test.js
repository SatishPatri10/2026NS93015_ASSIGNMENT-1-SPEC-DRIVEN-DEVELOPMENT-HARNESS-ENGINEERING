const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const srcDir = process.env.SRC_DIR || path.resolve(__dirname, '../src');
const { TokenBucket } = require(path.join(srcDir, 'limiter/tokenBucket'));
const { MemoryStore } = require(path.join(srcDir, 'limiter/memoryStore'));
const { TIERS } = require(path.join(srcDir, 'config/tiers'));

test('TokenBucket - Unit Tests', async (t) => {
  await t.test('TC-U01: Initializes with full burst capacity', () => {
    const bucket = new TokenBucket(10, 1.0);
    const result = bucket.consume(1);
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 9);
    assert.equal(result.retryAfter, 0);
  });

  await t.test('TC-U02: Rejects consumption when tokens are exhausted', () => {
    const bucket = new TokenBucket(2, 0.5);
    const res1 = bucket.consume(1);
    const res2 = bucket.consume(1);
    const res3 = bucket.consume(1); // Should fail

    assert.equal(res1.allowed, true);
    assert.equal(res2.allowed, true);
    assert.equal(res3.allowed, false);
    assert.equal(res3.remaining, 0);
    assert.ok(res3.retryAfter >= 2, `Expected retryAfter >= 2, got ${res3.retryAfter}`);
  });

  await t.test('TC-U03: Accurately refills tokens over elapsed time', () => {
    const now = 1000000;
    const bucket = new TokenBucket(5, 1.0, 0); // start empty
    bucket.lastRefill = now;

    // Advance 3 seconds -> should add 3 tokens
    const result = bucket.consume(2, now + 3000);
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 1); // 3 refilled - 2 consumed = 1
  });

  await t.test('TC-U04: Clamps tokens to burst capacity after long idle time', () => {
    const now = 1000000;
    const bucket = new TokenBucket(5, 1.0, 0);
    bucket.lastRefill = now;

    // Advance 100 seconds (far exceeding capacity of 5)
    bucket.refill(now + 100000);
    assert.equal(bucket.tokens, 5);
  });

  await t.test('TC-U05: MemoryStore creates and evicts idle buckets', () => {
    const store = new MemoryStore(5000); // 5 sec TTL
    const now = 1000000;

    const b1 = store.getOrCreate('user-1', TIERS.standard, now);
    assert.ok(b1);
    assert.equal(store.size(), 1);

    if (typeof store.evictExpired === 'function') {
      const evicted = store.evictExpired(5000, now + 6000);
      assert.equal(evicted, 1);
      assert.equal(store.size(), 0);
    } else {
      assert.fail('MemoryStore lacks required evictExpired method');
    }
  });

  await t.test('TC-U06: Validates constructor parameter guards', () => {
    assert.throws(() => new TokenBucket(0, 1), /Capacity must be a positive number/);
    assert.throws(() => new TokenBucket(5, -1), /Refill rate must be a positive number/);
  });
});
