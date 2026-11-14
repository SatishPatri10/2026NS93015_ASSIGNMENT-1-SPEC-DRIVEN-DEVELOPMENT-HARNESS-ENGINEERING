const http = require('node:http');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
const app = createApp();

const server = http.createServer((req, res) => {
  app.handleRequest(req, res);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[RateLimiterService] Microservice listening on http://localhost:${PORT}`);
  });
}

module.exports = { server, app };
