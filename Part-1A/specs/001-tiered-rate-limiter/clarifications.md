# Clarification Decisions: Tiered Rate Limiter Microservice

## Clarification 1: Sub-Second Precision and Floor vs Round

- **Question**: When elapsed time yields fractional tokens (e.g. 2.45 tokens), should internal accounting maintain floats or round to integers?
- **Decision**: Internal token calculation retains double-precision floating points ($tokens = \min(capacity, tokens + refillRate \times \Delta t)$). However, headers exposed over HTTP (`RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`) must be rounded down via `Math.floor()` for remaining count and `Math.ceil()` for wait durations to guarantee safe consumer behavior.

## Clarification 2: Memory Eviction Policy for In-Memory Adapter

- **Question**: In-memory hash maps without cleanup will leak memory over extended periods as transient IP addresses make requests. How should eviction be enforced?
- **Decision**: The in-memory bucket store must record a `lastUpdated` timestamp on every access. A scheduled cleanup worker runs every 60 seconds (or on-demand during testing) to evict client buckets whose idle time exceeds 3600 seconds (1 hour).

## Clarification 3: Header Format Standards

- **Question**: Which rate-limit header naming standard should be enforced (`X-RateLimit-*` vs `RateLimit-*`)?
- **Decision**: The microservice complies with the official IETF draft standard: `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`, along with the RFC 6585 standard `Retry-After`. Legacy `X-RateLimit-*` aliases are mirrored for backwards compatibility.

## Clarification 4: Key Validation vs Anonymous Access

- **Question**: What differentiates an anonymous user from an unauthorized user?
- **Decision**: Omission of `x-api-key` signifies anonymous access and defaults to the Free tier keyed by IP address. Presence of an `x-api-key` that does not match any known key registry triggers HTTP 401 Unauthorized to prevent arbitrary quota fabrication.
