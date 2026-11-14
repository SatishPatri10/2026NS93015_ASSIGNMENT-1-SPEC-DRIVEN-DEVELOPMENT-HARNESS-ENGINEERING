const { resolveTierByKey, TIERS } = require('../config/tiers');
const { MemoryStore } = require('../limiter/memoryStore');

class RateLimiterService {
  constructor(store = new MemoryStore()) {
    this.store = store;
  }

  getMiddleware(options = {}) {
    return (req, res, next) => {
      if (req.url === '/health' || req.path === '/health') {
        return next ? next() : null;
      }

      const apiKey = req.headers['x-api-key'];
      let clientKey = '';
      let tier = null;

      if (apiKey) {
        tier = resolveTierByKey(apiKey);
        if (!tier) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Unauthorized',
            message: 'Invalid API key provided'
          }));
          return;
        }
        clientKey = `key:${apiKey}`;
      } else {
        const remoteIp = req.headers['x-forwarded-for'] || 
                         (req.socket ? req.socket.remoteAddress : '127.0.0.1');
        tier = TIERS.free;
        clientKey = `ip:${remoteIp}`;
      }

      const bucket = this.store.getOrCreate(clientKey, tier);
      const result = bucket.consume(1);

      res.setHeader('RateLimit-Limit', tier.burst);
      res.setHeader('RateLimit-Remaining', result.remaining);
      res.setHeader('RateLimit-Reset', result.reset);

      // FLAW in Initial Generation: Missing Retry-After header injection on 429
      if (!result.allowed) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded for tier: ${tier.name}`,
          tier: tier.name,
          limit: tier.burst,
          remaining: 0
        }));
        return;
      }

      if (next) {
        next();
      }
    };
  }
}

module.exports = { RateLimiterService };
