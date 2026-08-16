// server.js — Miruro All-in-One Server
// Dev  : npm run dev   (vite :5173, server :3000)
// Prod : npm run build → node server.js (semua di :3000)

import http from 'http';
import https from 'https';
import fs from 'fs';
import { URL, fileURLToPath } from 'url';
import path from 'path';

const PORT = process.env.PORT || 3000;
const API_HOST = 'doujin.desu.xxx';
const APP_SECRET = 'dfdf72051dbfdc7d76889ebd31324e74';
const SALT = 'miruro-scrapers-cannot-read-this-super-secret-salt-2026-v2';
const HOUR = 36e5;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');

// ===== MIME TYPES =====
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.mjs':  'text/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.json': 'application/json',
  '.txt':  'text/plain',
};

// ===== CRYPTO =====
function keyFor(b) {
  const s = SALT + '_' + b;
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  let x = Math.abs(h) || 123456789, out = '';
  for (let i = 0; i < 32; i++) {
    x = (x * 1664525 + 1013904223) % 4294967296;
    out += String.fromCharCode(33 + (x % 93));
  }
  return out;
}
function keys() {
  const b = Math.floor(Date.now() / HOUR);
  return [keyFor(b), keyFor(b - 1), keyFor(b + 1)];
}
function xorDecrypt(hex, key) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    const p = hex.substring(i, i + 2);
    if (!p) break;
    bytes.push(parseInt(p, 16));
  }
  let out = '', n = 42;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    out += String.fromCharCode((b ^ key.charCodeAt(i % key.length) ^ (i * 13) ^ n) & 255);
    n = (n + b) % 256;
  }
  return out;
}
function decrypt(payload) {
  if (payload && typeof payload === 'object' && typeof payload._enc_resp_ === 'string') {
    for (const k of keys()) {
      try { return JSON.parse(decodeURIComponent(xorDecrypt(payload._enc_resp_, k))); } catch {}
    }
    throw new Error('Decrypt failed');
  }
  return payload;
}
function deviceId() {
  return 'dev_' + Math.random().toString(36).slice(2, 15) + '_' + Date.now().toString(36);
}
function apiHeaders() {
  return {
    'User-Agent': UA,
    'X-App-Secret': APP_SECRET,
    'x-app-secret': APP_SECRET,
    'x-device-id': deviceId(),
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store',
    'Pragma': 'no-cache',
    'Referer': 'https://doujin.desu.xxx/',
    'Origin': 'https://doujin.desu.xxx',
  };
}

// ===== HTTPS HELPER =====
function httpsReq(hostname, reqPath, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path: reqPath, method: 'GET', headers }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ res, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

// ===== API PROXY =====
async function handleApi(apiPath, clientRes) {
  try {
    const { res: up, body } = await httpsReq(API_HOST, '/api' + apiPath, apiHeaders());
    let data;
    try { data = decrypt(JSON.parse(body.toString())); } catch { data = body.toString(); }

    const isJson = typeof data !== 'string';
    const outHeaders = {
      'Content-Type': isJson ? 'application/json' : 'text/plain',
      'Access-Control-Allow-Origin': '*',
    };
    if (up.headers['x-total-count']) outHeaders['x-total-count'] = up.headers['x-total-count'];

    const status = up.statusCode === 304 ? 200 : up.statusCode;
    clientRes.writeHead(status, outHeaders);
    clientRes.end(isJson ? JSON.stringify(data) : data);
  } catch (e) {
    clientRes.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    clientRes.end(JSON.stringify({ error: e.message }));
  }
}

// ===== IMAGE PROXY =====
function handleImg(targetUrl, clientRes) {
  let parsed;
  try { parsed = new URL(targetUrl); } catch {
    clientRes.writeHead(400); clientRes.end('Invalid URL'); return;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    clientRes.writeHead(403); clientRes.end('Protocol not allowed'); return;
  }
  const req = https.request({
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: {
      'User-Agent': UA,
      'Referer': 'https://doujin.desu.xxx/',
      'Origin': 'https://doujin.desu.xxx',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'sec-fetch-dest': 'image',
      'sec-fetch-mode': 'no-cors',
      'sec-fetch-site': 'cross-site',
    },
  }, (upRes) => {
    clientRes.writeHead(upRes.statusCode, {
      'Content-Type': upRes.headers['content-type'] || 'image/webp',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    });
    upRes.pipe(clientRes);
  });
  req.on('error', () => { try { clientRes.writeHead(502); clientRes.end(); } catch {} });
  req.end();
}

// ===== STATIC FILE SERVER =====
function serveStatic(filePath, clientRes) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath);
    clientRes.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
    });
    clientRes.end(content);
  } catch {
    // File not found → SPA fallback
    serveIndex(clientRes);
  }
}

function serveIndex(clientRes) {
  const indexPath = path.join(DIST, 'index.html');
  if (fs.existsSync(indexPath)) {
    clientRes.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    clientRes.end(fs.readFileSync(indexPath));
  } else {
    clientRes.writeHead(503, { 'Content-Type': 'text/plain' });
    clientRes.end('Build belum ada. Jalankan: npm run build');
  }
}

const distExists = fs.existsSync(DIST);

// ===== HTTP SERVER =====
http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  const p = u.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' });
    res.end();
    return;
  }

  // API proxy
  if (p.startsWith('/api')) {
    await handleApi(p.slice(4) + u.search, res);
    return;
  }

  // Image proxy
  if (p === '/img') {
    const url = u.searchParams.get('url');
    if (!url) { res.writeHead(400); res.end('Missing ?url='); return; }
    handleImg(decodeURIComponent(url), res);
    return;
  }

  // Static files dari dist/
  if (distExists) {
    // Coba serve file statis dulu
    const filePath = path.join(DIST, p === '/' ? 'index.html' : p);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      serveStatic(filePath, res);
    } else {
      // SPA fallback — semua route React ditangani client-side
      serveIndex(res);
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found. Jalankan npm run build terlebih dahulu.');

}).listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  Miruro Reader');
  console.log('  → http://localhost:' + PORT);
  if (!distExists) {
    console.log('  ⚠ dist/ belum ada — jalankan npm run build');
  }
  console.log('  Ctrl+C untuk stop');
  console.log('');
});
