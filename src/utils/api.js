// All API calls → vite proxy → server.js (handles decryption + headers)
// Images → /img?url= proxy (server.js adds proper Referer)

export const imgUrl = (url) => {
  if (!url) return '';
  return '/img?url=' + encodeURIComponent(url);
};

export async function apiFetch(path) {
  const res = await fetch('/api' + path);
  if (!res.ok && res.status !== 404) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  try {
    return { data: JSON.parse(text), status: res.status, headers: res.headers };
  } catch {
    return { data: text, status: res.status, headers: res.headers };
  }
}

export function fmtNum(n) {
  if (!n) return '';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

const HISTORY_KEY = 'miruro_history';

export function saveHistory({ slug, title, cover_url }, chapterNumber, chapterId) {
  try {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const prev = existing.find(h => h.slug === slug);
    const filtered = existing.filter(h => h.slug !== slug);
    const entry = {
      slug,
      title,
      // Pertahankan cover_url lama kalau yang baru null/undefined
      cover_url: cover_url || prev?.cover_url || null,
      chapterId,
      chapterNumber,
      readAt: Date.now(),
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...filtered].slice(0, 100)));
  } catch {}
}

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

export function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}

export function getLastChapter(slug) {
  try {
    const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return all.find(h => h.slug === slug) || null;
  } catch { return null; }
}
