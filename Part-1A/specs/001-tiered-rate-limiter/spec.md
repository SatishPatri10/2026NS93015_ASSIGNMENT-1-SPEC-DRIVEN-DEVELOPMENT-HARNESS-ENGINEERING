# Feature Specification: Tiered Rate Limiter Microservice

## 1. Overview & Problem Statement
High-volume HTTP microservices require resilient rate limiting to protect backend resources from resource exhaustion, abuse, and noisy neighbors. This specification defines a Tiered Rate Limiter Microservice built in Node.js/Express that identifies inbound clients via API keys or IP addresses, categorizes them into configured consumption tiers (Free, Standard, Premium), and enforces request quotas using the Token Bucket algorithm.

## 2. User Stories
- **US-1 (Client API Consumption)**: As an API consumer, I want my valid requests within my tier's quota to be forwarded to protected endpoints with status 200 and informative rate-limit headers.
- **US-2 (Rate Limit Enforcement)**: As a system operator, when a client exceeds their tier's token capacity, the service must immediately reject the request with HTTP 429 Too Many Requests, returning an accurate `Retry-After` header.
- **US-3 (Tier Differentiation)**: As an API provider, I want different tiers (Free, Standard, Premium) to have distinct refill rates, burst capacities, and window limits.
- **US-4 (Client Identification)**: As a client, I can identify myself using an `x-api-key` HTTP header. If no key is provided, the service must default to the `free` tier keyed by client IP.
- **US-5 (Service Health & Observability)**: As an administrator, I want unthrottled health inspection (`/health`) and tier configuration inspection (`/api/limits`) endpoints.

## 3. Tier Configurations
| Tier Name | Capacity (Burst) | Refill Rate (tokens/sec) | Window Allowance (req/min) | Identification Key |
|-----------|------------------|--------------------------|----------------------------|--------------------|
| `free`    | 5 tokens         | 0.1667 (10 / 60s)        | 10 requests / minute       | Default (or IP fallback) |
| `standard`| 15 tokens        | 1.0 (60 / 60s)           | 60 requests / minute       | `x-api-key: std-key-*` |
| `premium` | 50 tokens        | 5.0 (300 / 60s)          | 300 requests / minute      | `x-api-key: prem-key-*` |

## 4. HTTP Protocol & Header Contract
1. **Protected Endpoints**:
   - `GET /api/data`
   - `GET /api/resource`
2. **Standard Headers Injected on Responses**:
   - `RateLimit-Limit`: Maximum burst/window capacity integer.
   - `RateLimit-Remaining`: Integer count of tokens remaining in client bucket (clamped at 0).
   - `RateLimit-Reset`: Integer seconds until bucket refills to full capacity.
3. **HTTP 429 Error Response Payload**:
   - Injected header: `Retry-After: <integer_seconds>`
   - JSON response body:
   ```json
   {
     "error": "Too Many Requests",
     "message": "Rate limit exceeded for tier: <tier_name>",
     "tier": "<tier_name>",
     "limit": <number>,
     "remaining": 0,
     "retryAfter": <seconds>
   }
   ```
4. **Invalid API Key Response**:
   - HTTP 401 Unauthorized:
   ```json
   {
     "error": "Unauthorized",
     "message": "Invalid API key provided"
   }
   ```

## 5. Formal Binary Acceptance Criteria
- **AC-1 (Initial Quota Allowance)**: A new client with no prior history must be granted immediate access up to their tier burst capacity with HTTP 200 OK.
- **AC-2 (Accurate Header Metadata)**: Every 200 OK response on protected routes must include valid integer values for `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`.
- **AC-3 (Deterministic Rate Limit Exceeded - HTTP 429)**: When client requests exhaust all available tokens ($tokens < 1.0$), the immediate subsequent request MUST return HTTP 429 Too Many Requests with `remaining: 0` and a positive integer `Retry-After` header.
- **AC-4 (Continuous Token Replenishment)**: Waiting for the duration calculated by $\lceil (1.0 - tokens) / refillRate \rceil$ must replenish at least 1 token and allow subsequent requests to succeed with HTTP 200 OK.
- **AC-5 (Burst Capacity Clamping)**: Prolonged idle periods must never accumulate tokens beyond the configured burst capacity ($tokens \le capacity$).
- **AC-6 (IP Fallback for Anonymous Users)**: Requests lacking the `x-api-key` header must be automatically attributed to the client IP and governed by the `free` tier quota.
- **AC-7 (Invalid Key Rejection)**: Unrecognized keys matching pattern `inv-*` or malformed tokens must return HTTP 401 Unauthorized without consuming bucket tokens.
- **AC-8 (Unthrottled Operational Endpoints)**: Requests to `/health` must bypass rate limiting entirely and always return HTTP 200 with `{ "status": "UP" }`.
