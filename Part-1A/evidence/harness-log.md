# Part 1A Deterministic Harness & Self-Healing Audit Log

## 1. Initial Coding-Agent Generation & Specification Context

- **Specification Source**: `specs/001-tiered-rate-limiter/spec.md`, `specs/001-tiered-rate-limiter/plan.md`, `specs/001-tiered-rate-limiter/tasks.md`.
- **Implementation Goal**: Build a high-throughput, deterministic Tiered Rate Limiter microservice in Node.js implementing the Token Bucket algorithm with Free, Standard, and Premium tiers, RFC 6585 header compliance, and an in-memory client storage adapter.
- **Initial Code Snapshot Location**: `evidence/initial-generation/src/`

---

## 2. Harness Execution Run 1 (Initial Generation)

- **Execution Command**: `node .harness/run-harness.js` (targeting `evidence/initial-generation/src`)
- **Execution Timestamp**: 2026-11-14T06:08:50.732Z
- **Outcome**: **FAIL**
- **Evidence Artifact**: `evidence/initial-run.json`

### Gate-by-Gate Breakdown

1. **Gate 1 (Syntax & Static Lint Guard)**: **PASS** (0 violations across 6 source files).
2. **Gate 2 (SAST Security Guard)**: **FAIL** (1 critical finding):
   - `SEC004_UNBOUNDED_CACHE_MEMORY_LEAK`: `src/limiter/memoryStore.js` initialized an unbounded `Map` without an eviction mechanism (`.delete()` / `evictExpired()`), introducing a denial-of-service / memory-exhaustion vulnerability under persistent client churn.
3. **Gate 3 (Unit & Contract Test Suite)**: **FAIL** (4 failed subtests):
   - `TC-U05`: MemoryStore failed because `evictExpired` method was missing on the naive Map store.
   - `AC-3`: Contract test assertion failed: `AssertionError: Retry-After header must be present on 429 response`. The initial middleware returned HTTP 429 but omitted the mandatory RFC 6585 `Retry-After` header.

---

## 3. Failure Evidence Fed Back to Coding Agent

The following structured diagnostic evidence was extracted from the harness results and supplied to the coding agent for corrective repair:

```json
{
  "gate2_security_finding": {
    "rule": "SEC004_UNBOUNDED_CACHE_MEMORY_LEAK",
    "file": "src/limiter/memoryStore.js",
    "message": "In-memory store maintains unbounded collections without an eviction strategy (.delete() / evictExpired)"
  },
  "gate3_contract_failures": [
    {
      "test": "AC-3: Exhausting token bucket triggers HTTP 429 and Retry-After header",
      "error": "Retry-After header must be present on 429 response",
      "expected": "Positive integer seconds in 'Retry-After' header",
      "observed": "null"
    },
    {
      "test": "TC-U05: MemoryStore creates and evicts idle buckets",
      "error": "MemoryStore lacks required evictExpired method"
    }
  ]
}
```

---

## 4. Self-Healing & Repair Applied

Without weakening the specification or lowering any test assertions, the coding agent applied targeted repairs:

1. **In-Memory Store Eviction (`src/limiter/memoryStore.js`)**:
   - Added `lastAccessed` timestamp tracking to each client bucket entry.
   - Implemented `evictExpired(maxIdleMs, now)` method utilizing `this.buckets.delete(key)` to safely purge client buckets that remain idle longer than the configured TTL (default 1 hour).
2. **RFC 6585 Header Compliance (`src/middleware/rateLimiterMiddleware.js`)**:
   - Injected the standard `Retry-After` header: `res.setHeader('Retry-After', result.retryAfter)`.
   - Guaranteed that `result.retryAfter` calculates the exact integer ceiling duration required to replenish at least 1 token ($\lceil (1.0 - tokens) / refillRate \rceil$).
   - Ensured `remaining` count in HTTP 429 JSON response body is strictly clamped to `0`.

---

## 5. Harness Execution Run 2 (Repaired Implementation)

- **Execution Command**: `node .harness/run-harness.js` (targeting `src/`)
- **Execution Timestamp**: 2026-11-14T06:09:00.804Z
- **Outcome**: **PASS (100%)**
- **Evidence Artifact**: `evidence/final-run.json` & `evidence/harness-results.json`

### Gate-by-Gate Verification

1. **Gate 1 (Syntax & Static Lint Guard)**: **PASS** (0 violations across all files).
2. **Gate 2 (SAST Security Guard)**: **PASS** (0 findings; TTL eviction detected).
3. **Gate 3 (Unit & Contract Test Suite)**: **PASS** (13 of 13 tests passed, 0 failures, duration 526ms).
   - TC-U01 through TC-U06: PASS
   - AC-1 through AC-8: PASS

---

## 6. Final Human Review & Acceptance Decision

- **Decision**: **ACCEPT**
- **Reviewer**: Software Engineering Team Lead / Student Evaluator
- **Justification**:
  The application strictly satisfies all 8 formal Acceptance Criteria specified in `spec.md`. The harness confirmed code syntax hygiene, zero SAST vulnerabilities, and verified exact mathematical rate-limiting behavior across Free, Standard, and Premium tiers. The automated test suite passed deterministically without requiring external network connectivity or third-party runtime dependencies.
- **Known Limitations & Production Considerations**:
  - _Distributed Nodes_: The current `MemoryStore` maintains bucket state local to a single Node.js process. In a horizontally scaled cluster behind a round-robin load balancer, a Redis-backed distributed adapter (using Redis Lua scripts) would be recommended to synchronize token buckets across cluster nodes.
  - _Clock Drift_: Extreme system clock adjustments on the host machine could briefly skew $\Delta t$ calculations. In high-stakes production environments, a monotonic clock source (`process.hrtime.bigint()`) should be preferred over wall-clock timestamps.
