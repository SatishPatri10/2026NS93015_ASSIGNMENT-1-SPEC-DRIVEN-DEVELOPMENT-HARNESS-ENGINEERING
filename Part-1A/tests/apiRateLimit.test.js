const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const srcDir = process.env.SRC_DIR || path.resolve(__dirname, '../src');
const { createApp } = require(path.join(srcDir, 'app'));
const { MemoryStore } = require(path.join(srcDir, 'limiter/memoryStore'));
const { request } = require('./testHelper');

test('API Rate Limiter - Contract & Integration Tests', async (t) => {
  let app;
  let store;

  t.beforeEach(() => {
    store = new MemoryStore();
    app = createApp(store);
  });

  await t.test('AC-1 & AC-2: Valid standard tier request returns 200 with proper headers', async () => {
    const res = await request(app, {
      url: '/api/data',
      headers: { 'x-api-key': 'std-key-123' }
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/json');
    assert.equal(res.headers.get('ratelimit-limit'), '15');
    assert.equal(res.headers.get('ratelimit-remaining'), '14');
    assert.ok(parseInt(res.headers.get('ratelimit-reset'), 10) >= 0);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.id, 101);
  });

  await t.test('AC-3: Exhausting token bucket triggers HTTP 429 and Retry-After header', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app, { url: '/api/data' });
      assert.equal(res.status, 200, `Request ${i + 1} should succeed`);
    }

    const blockedRes = await request(app, { url: '/api/data' });
    assert.equal(blockedRes.status, 429);
    assert.equal(blockedRes.headers.get('ratelimit-remaining'), '0');
    
    const retryAfter = blockedRes.headers.get('retry-after');
    assert.ok(retryAfter !== null, 'Retry-After header must be present on 429 response');
    assert.ok(parseInt(retryAfter, 10) > 0, 'Retry-After must be positive integer');

    const body = await blockedRes.json();
    assert.equal(body.error, 'Too Many Requests');
    assert.equal(body.tier, 'free');
    assert.equal(body.remaining, 0);
    assert.ok(body.retryAfter > 0);
  });

  await t.test('AC-6: Anonymous clients without x-api-key default to Free tier', async () => {
    const res = await request(app, { url: '/api/resource' });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('ratelimit-limit'), '5');
  });

  await t.test('AC-7: Invalid API key returns 401 Unauthorized', async () => {
    const res = await request(app, {
      url: '/api/data',
      headers: { 'x-api-key': 'inv-fake-token-999' }
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Unauthorized');
  });

  await t.test('AC-8: Unthrottled /health endpoint always returns 200 OK', async () => {
    for (let i = 0; i < 6; i++) {
      await request(app, { url: '/api/data' });
    }

    const healthRes = await request(app, { url: '/health' });
    assert.equal(healthRes.status, 200);
    const healthBody = await healthRes.json();
    assert.equal(healthBody.status, 'UP');
  });
});
