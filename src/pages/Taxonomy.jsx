import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { imgUrl, apiFetch } from '../utils/api';

const Shimmer = () => <div className="absolute top-0 bottom-0 left-0 w-[150%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;
const CardSkeleton = () => <div className="w-full flex flex-col gap-2"><div className="aspect-[3/4.5] bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div><div className="w-3/4 h-2.5 bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div></div>;

const LABELS = { authors: 'Author', groups: 'Group / Scanlation', series: 'Series', characters: 'Karakter' };

const Taxonomy = () => {
  const { type, slug } = useParams();
  const navigate = useNavigate();
  const [terms, setTerms] = useState([]);
  const [mangaList, setMangaList] = useState([]);
  const [termInfo, setTermInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const label = LABELS[type] || type;

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoading(true);
    setSearch('');

    if (slug) {
      // Detail: manga list for this term
      apiFetch(`/taxonomy/${type}/${slug}?page=1&sort=latest&limit=24`)
        .then(res => {
          setMangaList(res.data.mangaList || []);
          setTermInfo(res.data.term || null);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      // List: all terms
      apiFetch(`/taxonomy/${type}?page=${page}&limit=60`)
        .then(res => {
          setTerms(res.data.terms || []);
          setTotalPages(res.data.pagination?.totalPages || 1);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [type, slug, page]);

  const filteredTerms = search
    ? terms.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : terms;

  // Detail view
  if (slug) return (
    <div className="min-h-screen bg-[#0a0a0c] font-nunito selection:bg-[#F6CF80] selection:text-black pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-6">
        <button onClick={() => navigate(`/taxonomy/${type}`)} className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-black uppercase tracking-widest mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          {label}
        </button>
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white tracking-tighter">{termInfo?.name || slug}</h1>
          {termInfo?.description && <p className="text-white/40 text-xs mt-1">{termInfo.description}</p>}
          <span className="text-white/30 text-[10px] font-bold">{mangaList.length} manga</span>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] gap-3">
            {[...Array(12)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] gap-3">
            {mangaList.map((a, i) => (
              <div key={a.slug || i} onClick={() => navigate(`/manga/${a.slug}`)} className="flex flex-col gap-2 group cursor-pointer active:scale-95 transition-transform">
                <div className="relative aspect-[3/4.5] overflow-hidden bg-[#16161a] rounded-sm shadow-xl">
                  <img src={imgUrl(a.cover_url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={a.title} />
                  {a.rating && <div className="absolute top-1 left-1 bg-black/60 text-[#F6CF80] text-[8px] font-black px-1.5 py-0.5 rounded-sm">★ {parseFloat(a.rating).toFixed(1)}</div>}
                </div>
                <h3 className="text-[9px] font-bold text-white/60 line-clamp-1 group-hover:text-[#F6CF80] transition-colors">{a.title}</h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // List view
  return (
    <div className="min-h-screen bg-[#0a0a0c] font-nunito selection:bg-[#F6CF80] selection:text-black pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-6">
        <button onClick={() => navigate('/browse')} className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-black uppercase tracking-widest mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Browse
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">{label}</h1>
          <span className="text-white/30 text-[10px] font-bold">{terms.length} total</span>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Cari ${label.toLowerCase()}...`}
            className="w-full bg-[#16161a] border border-white/10 focus:border-[#F6CF80] text-white text-sm px-4 py-3 rounded-lg outline-none placeholder-white/20 font-medium transition-colors" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">✕</button>}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(10)].map((_, i) => <div key={i} className="h-14 bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div>)}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredTerms.map(t => (
              <div key={t.slug} onClick={() => navigate(`/taxonomy/${type}/${t.slug}`)}
                className="flex items-center justify-between px-4 py-3 bg-[#16161a] border border-white/5 hover:border-[#F6CF80]/40 rounded-sm cursor-pointer transition-all group active:scale-[0.99]">
                <span className="text-white font-bold text-sm group-hover:text-[#F6CF80] transition-colors">{t.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-white/30 text-[10px] font-bold">{t.manga_count || 0} manga</span>
                  <svg className="w-4 h-4 text-white/20 group-hover:text-[#F6CF80] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredTerms.length === 0 && (
          <div className="text-center py-16 text-white/30 font-bold text-sm">Tidak ditemukan</div>
        )}

        {totalPages > 1 && !search && (
          <div className="flex justify-center gap-2 mt-8 flex-wrap">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center bg-[#16161a] border border-white/10 text-white disabled:opacity-20 hover:bg-[#F6CF80] hover:text-black transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span className="flex items-center px-4 text-white/40 text-xs font-bold">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="w-10 h-10 flex items-center justify-center bg-[#16161a] border border-white/10 text-white disabled:opacity-20 hover:bg-[#F6CF80] hover:text-black transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Taxonomy;

