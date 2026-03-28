const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');
const API = path.join(__dirname, 'api');

// MIME types
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

// Load API route handler
async function loadHandler(routePath) {
  const handlerPath = path.join(API, routePath) + '.js';
  if (!fs.existsSync(handlerPath)) return null;

  // Dynamic import for ESM modules
  const mod = await import(`file://${handlerPath}`);
  return mod.default || mod;
}

// Find matching API route (supports [param] dynamic segments)
function matchRoute(urlPath) {
  const clean = urlPath.replace(/^\/api\//, '').replace(/\/$/, '');
  const segments = clean.split('/');

  // Direct match
  const directPath = path.join(API, ...segments);
  if (fs.existsSync(directPath + '.js')) {
    return { handlerPath: path.join(...segments), params: {} };
  }

  // Dynamic [param] match
  const apiEntries = fs.readdirSync(API, { withFileTypes: true });
  for (const entry of apiEntries) {
    if (entry.isDirectory()) {
      const dirName = entry.name;
      if (dirName.startsWith('[') && dirName.endsWith(']')) {
        const paramName = dirName.slice(1, -1);
        const restPath = segments.slice(1).join('/');
        const handlerFile = path.join(API, dirName, restPath);
        if (fs.existsSync(handlerFile + '.js')) {
          return { handlerPath: path.join(dirName, restPath), params: { [paramName]: segments[0] } };
        }
      }
    }
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API routes
  if (url.pathname.startsWith('/api/')) {
    const route = matchRoute(url.pathname);
    if (!route) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'API route not found' }));
    }

    try {
      const handler = await loadHandler(route.handlerPath);
      if (!handler) throw new Error('Handler not found');

      // Collect body
      let body = '';
      for await (const chunk of req) body += chunk;

      // Build req/res adapters for Vercel-style handlers
      const reqObj = {
        method: req.method,
        headers: req.headers,
        query: Object.fromEntries(url.searchParams),
        body: body ? JSON.parse(body) : {},
        url: url.pathname
      };

      let statusCode = 200;
      let responseHeaders = {};
      let responseBody = '';

      const resObj = {
        status: (code) => { statusCode = code; return resObj; },
        setHeader: (k, v) => { responseHeaders[k] = v; return resObj; },
        json: (data) => { responseBody = JSON.stringify(data); responseHeaders['Content-Type'] = 'application/json'; },
        end: (data) => { responseBody = data || ''; },
        send: (data) => { responseBody = typeof data === 'string' ? data : JSON.stringify(data); }
      };

      await handler(reqObj, resObj);

      res.writeHead(statusCode, responseHeaders);
      res.end(responseBody);
    } catch (err) {
      console.error('API Error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: err.message }));
    }
    return;
  }

  // Static files
  let filePath = path.join(DIST, url.pathname);
  if (url.pathname === '/') filePath = path.join(DIST, 'index.html');

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // SPA fallback
    filePath = path.join(DIST, 'index.html');
  }

  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 ShortAI Video Factory running on http://localhost:${PORT}`);
});
