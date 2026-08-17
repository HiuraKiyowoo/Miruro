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
        {a.rating && <div className="absolute top-1 left-1 bg-black/60 text-[#F6CF80] text-[8px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
          <svg className="w-2 h-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          {parseFloat(a.rating).toFixed(1)}
        </div>}
        {a.type && <div className="absolute bottom-1 right-1 bg-white/10 text-white/80 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase">{a.type}</div>}
      </div>
      <h3 className="text-[9px] font-bold text-white/60 line-clamp-1 group-hover:text-[#F6CF80] transition-colors">{a.title}</h3>
    </div>
  );
};

const FilterBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap ${active ? 'bg-[#F6CF80] text-black' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'}`}>{children}</button>
);

const STATUSES = [['all','Semua'],['ongoing','Ongoing'],['completed','Completed'],['hiatus','Hiatus']];
const LIMIT = 24;

const Explore = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    apiFetch('/genres').then(r => setGenres(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => { setPage(0); }, [query, selectedGenre, filterStatus]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        let qs = `limit=${LIMIT}&offset=${page * LIMIT}`;
        if (query) qs += `&search=${encodeURIComponent(query)}&sort=latest_chapter`;
        else if (selectedGenre) qs += `&genre=${encodeURIComponent(selectedGenre)}&sort=latest_chapter`;
        else qs += `&sort=popular`;
        if (filterStatus !== 'all') qs += `&status=${filterStatus}`;
        const res = await apiFetch('/manga?' + qs);
        if (!alive) return;
        setResults(Array.isArray(res.data) ? res.data : []);
        setTotal(parseInt(res.headers.get('x-total-count') || '0', 10));
      } catch { if (alive) setResults([]); }
      finally { if (alive) setIsLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, [page, query, selectedGenre, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-nunito selection:bg-[#F6CF80] selection:text-black pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0} .no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-6">

        {query && (
          <div className="mb-6">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Hasil untuk:</p>
            <span className="text-[#F6CF80] text-2xl font-black tracking-tighter">"{query}"</span>
          </div>
        )}

        {/* Status filter */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4">
          <span className="text-white/30 text-[9px] font-black uppercase tracking-widest shrink-0">Status</span>
          {STATUSES.map(([v, l]) => <FilterBtn key={v} active={filterStatus === v} onClick={() => setFilterStatus(v)}>{l}</FilterBtn>)}
        </div>

        {/* Genre filter */}
        {!query && genres.length > 0 && (
          <div className="mb-6">
            <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
              <button onClick={() => setSelectedGenre('')} className={`px-3 py-1.5 text-[10px] whitespace-nowrap font-bold rounded-lg transition-colors ${!selectedGenre ? 'bg-[#F6CF80] text-black' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'}`}>Semua Genre</button>
              {genres.map(g => (
                <button key={g.slug} onClick={() => setSelectedGenre(g.slug)} className={`px-3 py-1.5 text-[10px] whitespace-nowrap font-bold rounded-lg transition-colors ${selectedGenre === g.slug ? 'bg-[#F6CF80] text-black' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'}`}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedGenre && !query && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-[#F6CF80] text-base font-black uppercase">{genres.find(g => g.slug === selectedGenre)?.name}</span>
            <button onClick={() => setSelectedGenre('')} className="text-white/30 hover:text-white text-xs font-black">✕</button>
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] gap-3 px-2">
          {isLoading ? [...Array(18)].map((_, i) => <CardSkeleton key={i} />) :
            results.map((a, i) => <MangaCard key={a.slug || i} a={a} index={i} onClick={() => navigate(`/manga/${a.slug}`)} />)}
        </div>

        {!isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
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
