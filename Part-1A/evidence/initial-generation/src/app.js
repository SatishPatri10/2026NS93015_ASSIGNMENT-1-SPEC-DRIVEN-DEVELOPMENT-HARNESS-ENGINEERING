const { RateLimiterService } = require('./middleware/rateLimiterMiddleware');
const { MemoryStore } = require('./limiter/memoryStore');
const { TIERS } = require('./config/tiers');

function createApp(store = new MemoryStore()) {
  const rateLimiterService = new RateLimiterService(store);
  const limiterMiddleware = rateLimiterService.getMiddleware();

  const handleRequest = (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Unthrottled health inspection
    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'UP', timestamp: new Date().toISOString() }));
      return;
    }

    // Unthrottled metadata endpoint
    if (pathname === '/api/limits') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ tiers: TIERS }));
      return;
    }

    // Run rate limiter middleware for protected routes
    limiterMiddleware(req, res, () => {
      if (pathname === '/api/data') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: { id: 101, title: 'Confidential Analytics Report' },
          timestamp: new Date().toISOString()
        }));
        return;
      }

      if (pathname === '/api/resource') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          resource: 'Compute Cluster Alpha',
          status: 'operational'
        }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
    });
  };

  return {
    handleRequest,
    store,
    rateLimiterService
  };
}

module.exports = { createApp };
