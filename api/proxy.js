// api/proxy.js — Vercel Serverless Function
// Handle: /api/* → decrypt + forward ke doujin.desu.xxx

const API_HOST = 'doujin.desu.xxx';
const APP_SECRET = 'dfdf72051dbfdc7d76889ebd31324e74';
const SALT = 'doujindesu-scrapers-cannot-read-this-super-secret-salt-2026-v2';
const HOUR = 36e5;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  // Strip /api prefix → /manga?x=y
  const apiPath = req.url.replace(/^\/api/, '');

  try {
    const upstream = await fetch(`https://${API_HOST}/api${apiPath}`, {
      headers: {
        'User-Agent': UA,
        'X-App-Secret': APP_SECRET,
        'x-app-secret': APP_SECRET,
        'x-device-id': deviceId(),
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
        'Referer': 'https://doujin.desu.xxx/',
        'Origin': 'https://doujin.desu.xxx',
      },
    });

    const text = await upstream.text();
    let data;
    try { data = decrypt(JSON.parse(text)); } catch { data = text; }

    const isJson = typeof data !== 'string';
    const totalCount = upstream.headers.get('x-total-count');

    res.setHeader('Content-Type', isJson ? 'application/json' : 'text/plain');
    if (totalCount) res.setHeader('x-total-count', totalCount);

    const status = upstream.status === 304 ? 200 : upstream.status;
    res.status(status).send(isJson ? JSON.stringify(data) : data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
