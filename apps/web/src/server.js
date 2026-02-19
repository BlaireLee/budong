import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const port = Number(process.env.WEB_PORT ?? 3000);
const root = new URL('.', import.meta.url).pathname;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function normalizePath(pathname) {
  if (pathname === '/' || pathname === '') {
    return 'index.html';
  }

  return pathname.replace(/^\/+/, '');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const normalized = normalizePath(url.pathname);
  const absolutePath = join(root, normalized);

  try {
    const file = await readFile(absolutePath);
    const ext = extname(absolutePath);
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`[web] listening on http://localhost:${port}`);
});
