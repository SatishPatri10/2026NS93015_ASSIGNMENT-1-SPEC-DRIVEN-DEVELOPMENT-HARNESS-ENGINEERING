# Technical Plan: Tiered Rate Limiter Microservice

## 1. System Architecture
The microservice is implemented in Node.js with Express. The architecture separates rate-limiting algorithmic state from HTTP routing and header serialization:

```
[ Inbound HTTP Request ]
           │
           ▼
[ RateLimiter Middleware ]
   ├── Key Resolver (Extract x-api-key or Client IP)
   ├── Tier Resolver (Map key/IP to Tier Config)
   └── TokenBucket Engine
         ├── MemoryStore (Get or initialize Bucket)
         ├── Refill Computation (based on elapsed ms)
         └── Atomic Deduction
           ├── Allowed: Next() + Attach Headers (200 OK)
           └── Denied: Return 429 Too Many Requests + Retry-After
```

## 2. Directory & Module Structure
```
Part-1A/
├── .specify/                         # Spec Kit configuration and memory
├── specs/001-tiered-rate-limiter/    # Spec, Clarifications, Plan, Tasks
├── src/
│   ├── config/
│   │   └── tiers.js                  # Tier configurations and API key registry
│   ├── limiter/
│   │   ├── tokenBucket.js            # Pure mathematical Token Bucket core
│   │   └── memoryStore.js            # In-memory store with TTL eviction
│   ├── middleware/
│   │   └── rateLimiterMiddleware.js  # Express middleware handling headers & 429
│   ├── app.js                        # Express application instance setup
│   └── server.js                     # HTTP server listener
├── tests/
│   ├── tokenBucket.test.js           # Unit tests for token bucket calculations
│   └── apiRateLimit.test.js          # Contract & Integration tests using Supertest
├── .harness/
│   ├── lint-guard.js                 # Syntax & Static style check
│   ├── security-guard.js             # SAST Security vulnerability check
│   ├── test-runner.js                # Test execution and assertion parser
│   └── run-harness.js                # Top-level 3-gate harness orchestrator
├── evidence/
│   ├── initial-generation/           # First-pass implementation snapshot
│   ├── initial-run.json              # First harness execution output (failure evidence)
│   ├── final-generation/             # Repaired implementation snapshot
│   ├── final-run.json                # Second harness execution output (100% pass)
│   └── harness-log.md                # Comprehensive audit and human review log
└── package.json                      # Dependencies and npm scripts
```

## 3. Technology Stack & Dependencies
- **Runtime**: Node.js v20+
- **HTTP Framework**: `express` (^4.19.2)
- **Testing**: Node.js built-in test runner (`node:test`, `node:assert/strict`) + `supertest` (^7.0.0)
- **Linting & Code Quality**: Custom AST / syntax validator & ESLint compatible rules
- **Security Check**: SAST regex & AST static analysis guard

## 4. Test Strategy
- **Unit Tests**: Verify mathematical token accumulation, burst limits, refill rates over mock time intervals, and bucket eviction.
- **Contract & Integration Tests**: Verify HTTP status codes (200, 401, 429), exact header presence (`RateLimit-*`, `Retry-After`), response payload shape, tier differentiation, and unthrottled endpoints.
