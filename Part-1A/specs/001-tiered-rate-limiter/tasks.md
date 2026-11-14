# Implementation Tasks: Tiered Rate Limiter Microservice

## Task Overview & Dependency Graph

Each task is strictly mapped to formal Acceptance Criteria defined in `spec.md`.

- [x] **Task 1: Project Setup & Package Scaffolding**
  - Create `package.json` with scripts for `start`, `test`, `lint`, and `harness`.
  - Configure production and testing dependencies (`express`, `supertest`).
  - _Maps to: General System Architecture_

- [x] **Task 2: Tier Configuration & Key Mapping**
  - Implement `src/config/tiers.js` with Free, Standard, Premium tier parameters.
  - Setup key verification mapping (`std-key-*`, `prem-key-*`) and invalid key pattern detection.
  - _Maps to: AC-6, AC-7_

- [x] **Task 3: In-Memory Token Bucket Engine**
  - Implement `src/limiter/memoryStore.js` with get, set, reset, and TTL eviction logic.
  - Implement `src/limiter/tokenBucket.js` with exact mathematical continuous refill and burst clamping.
  - _Maps to: AC-1, AC-4, AC-5_

- [x] **Task 4: Rate Limiting Express Middleware**
  - Implement `src/middleware/rateLimiterMiddleware.js`.
  - Resolve client key or fallback to remote IP.
  - Compute tokens, inject `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers.
  - Intercept quota violations with HTTP 429 and `Retry-After`.
  - _Maps to: AC-2, AC-3, AC-6, AC-7_

- [x] **Task 5: Express App and Protected Routes**
  - Implement `src/app.js` with `/health`, `/api/limits`, `/api/data`, and `/api/resource`.
  - Implement `src/server.js` for standalone execution.
  - _Maps to: AC-8_

- [x] **Task 6: Deterministic Unit & Contract Test Suite**
  - Implement `tests/tokenBucket.test.js` validating refill formulas, time offsets, and eviction.
  - Implement `tests/apiRateLimit.test.js` validating HTTP contract headers, status transitions, and tier quotas.
  - _Maps to: AC-1 through AC-8_

- [x] **Task 7: Automated Verification Harness**
  - Implement `.harness/lint-guard.js`, `.harness/security-guard.js`, `.harness/test-runner.js`, and `.harness/run-harness.js`.
  - Capture initial failure, apply self-healing repair, verify 100% PASS, and generate evidence logs.
  - _Maps to: Harness Engineering Specification (Section 3.5 - 3.7)_
