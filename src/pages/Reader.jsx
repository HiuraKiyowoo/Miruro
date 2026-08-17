import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { imgUrl, apiFetch, saveHistory } from '../utils/api';

// Simpan & ambil posisi halaman terakhir per chapter
const POS_KEY = 'miruro_page_pos';
function savePagePos(chapterId, page) {
  try {
    const all = JSON.parse(localStorage.getItem(POS_KEY) || '{}');
    all[chapterId] = page;
    localStorage.setItem(POS_KEY, JSON.stringify(all));
  } catch {}
}
function getPagePos(chapterId) {
  try {
    return JSON.parse(localStorage.getItem(POS_KEY) || '{}')[chapterId] || 0;
  } catch { return 0; }
}

const Reader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedPages, setLoadedPages] = useState({});
  const [mode, setMode] = useState(() => localStorage.getItem('miruro_read_mode') || 'vertical');

  const hideTimer = useRef(null);
  const containerRef = useRef(null);
  const pageRefs = useRef([]);
  const isScrolling = useRef(false);

  const pages = chapter?.content_urls || [];
  const totalPages = pages.length;

  // ===== Load chapter =====
  useEffect(() => {
    if (!id) return;
    window.scrollTo(0, 0);
    setIsLoading(true);
    setLoadedPages({});
    setCurrentPage(0);

    apiFetch(`/chapters/${id}`)
      .then(res => {
        setChapter(res.data);
        document.title = `${res.data.manga_title || ''} — Ch.${res.data.chapter_number} - Miruro`;
        if (res.data.manga_slug) {
          saveHistory(
            { slug: res.data.manga_slug, title: res.data.manga_title, cover_url: null },
            res.data.chapter_number, res.data.id
          );
        }
        // Restore posisi halaman
        const saved = getPagePos(id);
        if (saved > 0) setCurrentPage(saved);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  // ===== Scroll ke halaman tersimpan saat load (vertical mode) =====
  useEffect(() => {
    if (!isLoading && mode === 'vertical' && currentPage > 0 && pageRefs.current[currentPage]) {
      setTimeout(() => {
        pageRefs.current[currentPage]?.scrollIntoView({ behavior: 'instant' });
      }, 300);
    }
  }, [isLoading]);

  // ===== Toolbar auto-hide =====
  const showToolbar = useCallback(() => {
    setToolbarVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setToolbarVisible(false), 3000);
  }, []);

  // ===== Track halaman saat ini (vertical scroll) =====
  useEffect(() => {
    if (mode !== 'vertical') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const idx = parseInt(e.target.dataset.idx);
            if (!isNaN(idx)) {
              setCurrentPage(idx);
              savePagePos(id, idx);
            }
          }
        });
      },
      { threshold: 0.5 }
    );
    pageRefs.current.forEach(r => r && observer.observe(r));
    return () => observer.disconnect();
  }, [pages, mode, id]);

  // ===== Horizontal swipe: keyboard nav =====
  useEffect(() => {
    if (mode !== 'horizontal') return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, currentPage, totalPages]);

  // ===== Simpan mode =====
  const toggleMode = () => {
    const next = mode === 'vertical' ? 'horizontal' : 'vertical';
    setMode(next);
    localStorage.setItem('miruro_read_mode', next);
    setCurrentPage(0);
    window.scrollTo(0, 0);
  };

  const goPrev = () => {
    if (currentPage > 0) {
      const p = currentPage - 1;
      setCurrentPage(p);
      savePagePos(id, p);
    }
  };

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      const p = currentPage + 1;
      setCurrentPage(p);
      savePagePos(id, p);
    } else if (chapter?.next_id) {
      navigate(`/read/${chapter.next_id}`, { replace: true });
    }
  };

  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  // ===== Horizontal touch swipe =====
  const touchStart = useRef(null);
  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext(); else goPrev();
    }
    touchStart.current = null;
  };

  return (
    <div className="min-h-screen bg-black text-white font-nunito select-none"
      onClick={showToolbar}
      onTouchStart={mode === 'horizontal' ? handleTouchStart : undefined}
      onTouchEnd={mode === 'horizontal' ? handleTouchEnd : undefined}>
      <style>{`
        body,html{background:#000!important;margin:0;padding:0;overscroll-behavior-y:none}
        .page-img{display:block;width:100%;user-select:none;-webkit-user-drag:none}
      `}</style>

      {/* ===== TOOLBAR ===== */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${toolbarVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
        <div className="bg-black/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={e => { e.stopPropagation(); navigate(chapter?.manga_slug ? `/manga/${chapter.manga_slug}` : -1); }}
              className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-black text-xs line-clamp-1">{chapter?.manga_title || 'Memuat...'}</span>
              <span className="text-white/40 text-[10px] font-bold">Ch.{chapter?.chapter_number || '...'} · {currentPage + 1}/{totalPages}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle mode */}
            <button onClick={e => { e.stopPropagation(); toggleMode(); }}
              className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-[10px] font-black hover:bg-white/20 transition-colors"
              title={mode === 'vertical' ? 'Ganti ke Horizontal' : 'Ganti ke Vertikal'}>
              {mode === 'vertical' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/>
                </svg>
              )}
            </button>

            {chapter?.prev_id && (
              <button onClick={e => { e.stopPropagation(); navigate(`/read/${chapter.prev_id}`, { replace: true }); }}
                className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs font-black hover:bg-white/20 transition-colors">← Prev</button>
            )}
            {chapter?.next_id && (
              <button onClick={e => { e.stopPropagation(); navigate(`/read/${chapter.next_id}`, { replace: true }); }}
                className="px-3 py-1.5 bg-[#F6CF80] text-black rounded-lg text-xs font-black hover:bg-[#ebd59b] transition-colors">Next →</button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/10 w-full">
          <div className="h-full bg-[#F6CF80] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-white/10 border-t-[#F6CF80] rounded-full animate-spin" />
            <p className="text-white/40 text-sm font-bold">Memuat chapter...</p>
          </div>
        </div>
      ) : pages.length === 0 ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-white/40 text-sm font-bold">Tidak ada halaman.</p>
        </div>
      ) : mode === 'vertical' ? (
        /* ===== VERTICAL SCROLL MODE ===== */
        <div ref={containerRef} className="max-w-3xl mx-auto pt-14">
          {pages.map((url, i) => (
            <div key={i} data-idx={i} ref={el => pageRefs.current[i] = el}
              className="w-full relative bg-[#111] flex items-center justify-center min-h-[200px]">
              {!loadedPages[i] && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-white/10 border-t-[#F6CF80] rounded-full animate-spin" />
                    <span className="text-white/20 text-[9px] font-bold">{i + 1}</span>
                  </div>
                </div>
              )}
              <img src={imgUrl(url)} alt={`${i + 1}`} loading="lazy" className="page-img"
                onLoad={() => setLoadedPages(p => ({ ...p, [i]: true }))}
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div style="padding:40px;text-align:center;color:rgba(255,255,255,0.2);font-size:12px;font-weight:bold;">❌ Halaman ${i + 1} gagal</div>`;
                }} />
            </div>
          ))}

          {/* Bottom nav */}
          <div className="flex justify-center gap-4 p-8">
            {chapter?.prev_id && (
              <button onClick={() => navigate(`/read/${chapter.prev_id}`, { replace: true })}
                className="px-6 py-3 bg-white/10 border border-white/20 text-white font-black text-xs rounded-lg hover:bg-white/20 transition-all uppercase">
                ← Chapter Sebelumnya
              </button>
            )}
            {chapter?.next_id ? (
              <button onClick={() => navigate(`/read/${chapter.next_id}`, { replace: true })}
                className="px-6 py-3 bg-[#F6CF80] text-black font-black text-xs rounded-lg hover:bg-[#ebd59b] transition-all uppercase">
                Chapter Selanjutnya →
              </button>
            ) : (
              <button onClick={() => navigate(chapter?.manga_slug ? `/manga/${chapter.manga_slug}` : '/home')}
                className="px-6 py-3 bg-[#F6CF80] text-black font-black text-xs rounded-lg hover:bg-[#ebd59b] transition-all uppercase">
                ✓ Selesai — Kembali
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ===== HORIZONTAL SWIPE MODE ===== */
        <div className="fixed inset-0 flex items-center justify-center bg-black pt-14">
          {/* Halaman aktif */}
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            {pages[currentPage] && (
              <img src={imgUrl(pages[currentPage])} alt={`${currentPage + 1}`}
                className="max-w-full max-h-full object-contain"
                style={{ pointerEvents: 'none' }}
                onError={e => {
                  e.target.style.display = 'none';
                }} />
            )}
          </div>

          {/* Tap zones kiri & kanan */}
          <div className="absolute inset-0 flex pt-14" style={{ pointerEvents: 'none' }}>
            <div className="w-1/3 h-full cursor-pointer" style={{ pointerEvents: 'all' }}
              onClick={e => { e.stopPropagation(); goPrev(); showToolbar(); }} />
            <div className="w-1/3 h-full" onClick={showToolbar} style={{ pointerEvents: 'all' }} />
            <div className="w-1/3 h-full cursor-pointer" style={{ pointerEvents: 'all' }}
              onClick={e => { e.stopPropagation(); goNext(); showToolbar(); }} />
          </div>

          {/* Page indicator dots */}
          {totalPages <= 30 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1 flex-wrap px-8">
              {pages.map((_, i) => (
                <div key={i} onClick={e => { e.stopPropagation(); setCurrentPage(i); savePagePos(id, i); }}
                  className={`rounded-full transition-all cursor-pointer ${i === currentPage ? 'w-4 h-1.5 bg-[#F6CF80]' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`} />
              ))}
            </div>
          )}

          {/* Chapter nav saat di halaman terakhir */}
          {currentPage === totalPages - 1 && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3">
              {chapter?.next_id ? (
                <button onClick={() => navigate(`/read/${chapter.next_id}`, { replace: true })}
                  className="px-6 py-3 bg-[#F6CF80] text-black font-black text-xs rounded-lg uppercase">
                  Chapter Selanjutnya →
                </button>
              ) : (
                <button onClick={() => navigate(chapter?.manga_slug ? `/manga/${chapter.manga_slug}` : '/home')}
                  className="px-6 py-3 bg-[#F6CF80] text-black font-black text-xs rounded-lg uppercase">
                  ✓ Selesai — Kembali
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reader;
