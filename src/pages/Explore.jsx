import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { imgUrl, apiFetch } from '../utils/api';

const Shimmer = () => <div className="absolute top-0 bottom-0 left-0 w-[150%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;
const CardSkeleton = () => <div className="w-full flex flex-col gap-2"><div className="aspect-[3/4.5] bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div><div className="w-3/4 h-2.5 bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div></div>;

const MangaCard = ({ a, onClick, index }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), (index % 15) * 40); return () => clearTimeout(t); }, [index]);
  return (
    <div onClick={onClick} className={`w-full flex flex-col gap-2 group cursor-pointer active:scale-95 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="relative aspect-[3/4.5] w-full overflow-hidden bg-[#16161a] rounded-sm shadow-xl">
        <img src={imgUrl(a.cover_url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={a.title} />
        {a.rating && <div className="absolute top-1 left-1 bg-black/60 text-[#F6CF80] text-[8px] font-black px-1.5 py-0.5 rounded-sm">★ {parseFloat(a.rating).toFixed(1)}</div>}
        {a.type && <div className="absolute bottom-1 right-1 bg-white/10 text-white/80 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase">{a.type}</div>}
      </div>
      <h3 className="text-[9px] font-bold text-white/60 line-clamp-1 group-hover:text-[#F6CF80] transition-colors">{a.title}</h3>
    </div>
  );
};

const LIMIT = 24;

const Explore = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    apiFetch('/genres').then(r => setGenres(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => { setPage(0); }, [query, selectedGenre]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        let qs = `limit=${LIMIT}&offset=${page * LIMIT}`;
        if (query) qs += `&search=${encodeURIComponent(query)}&sort=latest_chapter`;
        else if (selectedGenre) qs += `&genre=${encodeURIComponent(selectedGenre)}&sort=latest_chapter`;
        else qs += `&sort=popular`;
        const res = await apiFetch('/manga?' + qs);
        if (!alive) return;
        setResults(Array.isArray(res.data) ? res.data : []);
        setTotal(parseInt(res.headers.get('x-total-count') || '0', 10));
      } catch { if (alive) setResults([]); }
      finally { if (alive) setIsLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, [page, query, selectedGenre]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-nunito selection:bg-[#F6CF80] selection:text-black pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0} .no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-6">

        {!query && genres.length > 0 && (
          <div className="mb-8">
            <h2 className="text-white font-black uppercase mb-4 text-sm tracking-wide">Filter Genre</h2>
            <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
              <button onClick={() => setSelectedGenre('')} className={`px-4 py-2 text-[10px] whitespace-nowrap font-bold rounded-xl transition-colors ${!selectedGenre ? 'bg-[#F6CF80] text-black' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'}`}>Semua</button>
              {genres.map(g => (
                <button key={g.slug} onClick={() => setSelectedGenre(g.slug)} className={`px-4 py-2 text-[10px] whitespace-nowrap font-bold rounded-xl transition-colors ${selectedGenre === g.slug ? 'bg-[#F6CF80] text-black' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'}`}>
                  {g.name} <span className="opacity-50">({g.manga_count || 0})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {query && (
          <div className="mb-8">
            <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest">Hasil untuk:</h2>
            <span className="text-[#F6CF80] text-2xl font-black uppercase tracking-tighter">"{query}"</span>
          </div>
        )}

        {selectedGenre && !query && (
          <div className="mb-8 flex items-center gap-3">
            <span className="text-[#F6CF80] text-lg font-black uppercase">{genres.find(g => g.slug === selectedGenre)?.name}</span>
            <button onClick={() => setSelectedGenre('')} className="text-white/30 hover:text-white text-xs font-black">✕ Clear</button>
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] gap-3 px-2">
          {isLoading ? [...Array(18)].map((_, i) => <CardSkeleton key={i} />) :
            results.map((a, i) => <MangaCard key={a.slug || i} a={a} index={i} onClick={() => navigate(`/manga/${a.slug}`)} />)}
        </div>

        {!isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-white/40 font-bold text-sm">Tidak ditemukan</p>
          </div>
        )}

        {totalPages > 1 && !isLoading && (
          <div className="flex justify-center gap-2 mt-10 flex-wrap">
            <button onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo(0, 0); }} disabled={page === 0}
              className="w-10 h-10 flex items-center justify-center bg-[#16161a] border border-white/10 text-white disabled:opacity-20 hover:bg-[#F6CF80] hover:text-black transition-colors font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            {[...Array(Math.min(totalPages, 7))].map((_, i) => {
              const p = Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
              return <button key={p} onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                className={`w-10 h-10 flex items-center justify-center font-black text-xs transition-all ${p === page ? 'bg-[#F6CF80] border border-[#F6CF80] text-black' : 'bg-[#16161a] border border-white/10 text-white hover:bg-white/10'}`}>{p + 1}</button>;
            })}
            <button onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, 0); }} disabled={page >= totalPages - 1}
              className="w-10 h-10 flex items-center justify-center bg-[#16161a] border border-white/10 text-white disabled:opacity-20 hover:bg-[#F6CF80] hover:text-black transition-colors font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
