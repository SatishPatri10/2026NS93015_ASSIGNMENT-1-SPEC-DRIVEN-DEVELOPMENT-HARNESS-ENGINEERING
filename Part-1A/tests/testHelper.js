const { EventEmitter } = require('node:events');

class MockResponse extends EventEmitter {
  constructor() {
    super();
    this.headers = {};
    this.statusCode = 200;
    this.body = '';
  }

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = String(value);
  }

  getHeader(name) {
    return this.headers[name.toLowerCase()] || null;
  }

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    for (const [k, v] of Object.entries(headers)) {
      this.setHeader(k, v);
    }
    return this;
  }

  end(chunk) {
    if (chunk) {
      this.body += chunk;
    }
    this.emit('finish');
    return this;
  }

  json() {
    return this.body ? JSON.parse(this.body) : {};
  }
}

function request(app, options = {}) {
  const {
    method = 'GET',
    url = '/health',
    headers = {},
    socket = { remoteAddress: '127.0.0.1' }
  } = options;

  const req = {
    method,
    url,
    headers: Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)])
    ),
    socket
  };

  const res = new MockResponse();

  return new Promise((resolve) => {
    res.on('finish', () => {
      resolve({
        status: res.statusCode,
        headers: {
          get: (name) => res.getHeader(name)
        },
        json: async () => res.json(),
        text: async () => res.body
      });
    });

    app.handleRequest(req, res);
  });
}

module.exports = { request, MockResponse };
