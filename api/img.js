// api/img.js — Vercel Serverless Function
// Handle: /img?url=<encoded> → proxy gambar dengan Referer doujin.desu.xxx

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const { url } = req.query;
  if (!url) { res.status(400).send('Missing ?url='); return; }

  let parsed;
  try { parsed = new URL(url); } catch {
    res.status(400).send('Invalid URL'); return;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    res.status(403).send('Protocol not allowed'); return;
  }

  try {
    const upstream = await fetch(url, {
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
    });

    if (!upstream.ok) {
      res.status(upstream.status).send('Upstream error'); return;
    }

    const contentType = upstream.headers.get('content-type') || 'image/webp';
    const buffer = await upstream.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(Buffer.from(buffer));
  } catch (e) {
    res.status(502).send('Proxy error: ' + e.message);
  }
}
