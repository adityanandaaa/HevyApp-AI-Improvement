// Zero-dependency static file server for local dev. No bundler: the app is
// plain HTML/CSS/JS served as-is, so a page load only needs files off disk.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = process.cwd();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;

/** @type {Record<string, string>} */
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

/**
 * @param {string} urlPath
 * @returns {Promise<string | null>}
 */
async function resolvePath(urlPath) {
  const safePath = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(ROOT, safePath);

  try {
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }
  } catch {
    return null;
  }

  try {
    await stat(filePath);
    return filePath;
  } catch {
    return null;
  }
}

/** @type {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => Promise<void>} */
const handleRequest = async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const filePath = await resolvePath(url.pathname);

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const contentType = MIME_TYPES[extname(filePath)] ?? 'application/octet-stream';
  const body = await readFile(filePath);
  // No cache-control headers meant a plain reload could keep serving an old
  // cached copy of a JS module across a dev-server restart — confusing for
  // local dev, where the file on disk is the only source of truth.
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  res.end(body);
};

const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`AI Training Coach dev server: http://localhost:${PORT}`);
});
