// Local preview, as Vercel serves it: the folder as static files, and /api/* passed to the live game server
// (vercel.json does the same with a rewrite, so the page never calls another origin). node dev.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const PORT = Number(process.argv[2] || 4321), ROOT = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.GT_API_ORIGIN || 'https://gentown.my.id';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain' };
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) {
    try {
      const r = await fetch(API + url.pathname + url.search, { headers: { accept: 'application/json' } });
      res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'application/json' });
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch (e) { res.writeHead(502); res.end('{"error":"game server unreachable"}'); }
    return;
  }
  let f = path.resolve(ROOT, '.' + decodeURIComponent(url.pathname));
  if (!f.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log('landing on http://localhost:' + PORT + ' (api: ' + API + ')'));
