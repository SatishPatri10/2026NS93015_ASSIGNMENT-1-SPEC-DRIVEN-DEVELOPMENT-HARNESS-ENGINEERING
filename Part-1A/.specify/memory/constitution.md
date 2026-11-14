# Part 1A Project Constitution: Deterministic Rate Limiter Microservice

## 1. Purpose & Architectural Principles
This constitution defines non-negotiable engineering standards and operational boundaries for the **Tiered Rate Limiter Microservice**. The application controls inbound traffic for HTTP APIs based on client identity and subscription tier using deterministic token-bucket algorithms.

## 2. Core Technical Constraints
- **Runtime & Language**: Node.js (>= 18.x) with CommonJS/ES modules, running lightweight Express microservice.
- **Algorithm Conformance**: Pure Token Bucket algorithm with mathematical refill precision based on elapsed millisecond intervals ($tokens = \min(capacity, tokens + refillRate \times elapsed)$).
- **State Management**: In-memory adapter with zero external infrastructure required for testing, accompanied by an explicit memory-leak mitigation strategy (TTL-based inactive client eviction).
- **HTTP Header Standards**: Strict adherence to RFC 6585 and IETF Draft RateLimit header standards (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`).
- **Determinism**: Identical sequences of HTTP requests arriving at identical relative timestamps must yield 100% deterministic status codes, remaining counts, and reset durations.

## 3. Measurable Quality Standards
- **Zero Unhandled Rejections**: All Express middleware must capture edge errors and return standard HTTP 500 error objects without crashing the event loop.
- **Zero Insecure Code / SAST**: No usage of `eval()`, `new Function()`, vulnerable regular expressions (ReDoS), or prototype pollution vulnerabilities.
- **Code Hygiene & Linting**: 100% clean syntax and linting checks using strict style rules without disabled warnings.
- **Coverage & Test Rigor**: 100% of public endpoints and core token-bucket functions covered by automated binary assertions.

## 4. Coding Agent Guardrails & Prohibitions
- **Immutable Acceptance Criteria**: The coding agent is strictly prohibited from modifying, weakening, or commenting out failing test assertions to achieve green builds.
- **Zero Secrets**: No API keys, credentials, or private keys shall be hardcoded in repository sources.
- **Preservation of Audit Trail**: Any repair cycle triggered by the test harness must be documented in `evidence/harness-log.md` with explicit attribution of the failure cause, code delta, and verification outcome.
- **Human Acceptance Authority**: Automated harness passes are a prerequisite for review; final deployment authority remains exclusively with human engineering review.
