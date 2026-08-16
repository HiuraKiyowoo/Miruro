import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const TYPES = [['all','Semua'],['manga','Manga'],['manhwa','Manhwa'],['doujinshi','Doujinshi']];
const SORTS = [['latest_chapter','Terbaru'],['popular','Populer'],['rating','Rating'],['newest','Newest']];

const Browse = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');
  const [sort, setSort] = useState('latest_chapter');

  const fetchPage = async (p = 1, reset = false) => {
    setIsLoading(true);
    try {
      const LIMIT = 24;
      let qs = `limit=${LIMIT}&offset=${(p - 1) * LIMIT}&sort=${sort}`;
      if (filterType && filterType !== 'all') qs += `&type=${filterType}`;
      const res = await apiFetch('/manga?' + qs);
      const list = Array.isArray(res.data) ? res.data : [];
      const total = parseInt(res.headers.get('x-total-count') || '0', 10);
      if (reset || p === 1) setResults(list);
      else setResults(prev => [...prev, ...list]);
      setHasNext(total > p * LIMIT);
      setPage(p);
    } catch { if (reset || p === 1) setResults([]); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { window.scrollTo(0, 0); fetchPage(1, true); }, [filterType, sort]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-nunito selection:bg-[#F6CF80] selection:text-black pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-6">
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest w-10">Tipe</span>
            {TYPES.map(([v, l]) => (
              <button key={v} onClick={() => setFilterType(v)} className={`px-4 py-2 text-[10px] font-bold rounded-xl transition-colors ${filterType === v ? 'bg-[#F6CF80] text-black' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'}`}>{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest w-10">Sort</span>
            {SORTS.map(([v, l]) => (
              <button key={v} onClick={() => setSort(v)} className={`px-4 py-2 text-[10px] font-bold rounded-xl transition-colors ${sort === v ? 'bg-[#F6CF80] text-black' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] gap-3 px-2 mb-10">
          {isLoading && results.length === 0
            ? [...Array(18)].map((_, i) => <CardSkeleton key={i} />)
            : results.map((a, i) => <MangaCard key={`${a.slug}-${i}`} a={a} index={i} onClick={() => navigate(`/manga/${a.slug}`)} />)}
        </div>

        {hasNext && (
          <div className="flex justify-center mb-10">
            <button onClick={() => fetchPage(page + 1)} disabled={isLoading}
              className="px-8 py-3 bg-[#16161a] border border-white/10 hover:border-[#F6CF80] hover:text-[#F6CF80] text-white font-black text-xs uppercase tracking-widest rounded-lg transition-all disabled:opacity-50">
              {isLoading ? 'Memuat...' : 'Muat Lebih Banyak'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
