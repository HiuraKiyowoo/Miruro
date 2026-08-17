import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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

const TYPES    = [['all','Semua'],['manga','Manga'],['manhwa','Manhwa'],['doujinshi','Doujinshi']];
const STATUSES = [['all','Semua'],['ongoing','Ongoing'],['completed','Completed'],['hiatus','Hiatus']];
const SORTS    = [['latest_chapter','Terbaru'],['popular','Populer'],['rating','Rating'],['newest','Newest'],['title_asc','A–Z'],['created_at_asc','Terlama'],['created_at_desc','Terbaru Dibuat']];

const TAX_LINKS = [
  { type: 'authors',    label: 'Author',    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { type: 'groups',     label: 'Group',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { type: 'series',     label: 'Series',    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { type: 'characters', label: 'Karakter',  icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' },
];

const Browse = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sort, setSort] = useState('latest_chapter');

  const fetchPage = async (p = 1, reset = false) => {
    setIsLoading(true);
    try {
      const LIMIT = 24;
      let qs = `limit=${LIMIT}&offset=${(p - 1) * LIMIT}&sort=${sort}`;
      if (filterType !== 'all') qs += `&type=${filterType}`;
      if (filterStatus !== 'all') qs += `&status=${filterStatus}`;
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

  useEffect(() => { window.scrollTo(0, 0); fetchPage(1, true); }, [filterType, filterStatus, sort]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-nunito selection:bg-[#F6CF80] selection:text-black pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0} .no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-6">

        {/* Taxonomy shortcuts */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {TAX_LINKS.map(({ type, label, icon }) => (
            <Link key={type} to={`/taxonomy/${type}`}
              className="flex flex-col items-center gap-1.5 bg-[#16161a] border border-white/5 hover:border-[#F6CF80]/40 hover:bg-[#F6CF80]/5 p-3 rounded-lg transition-all group">
              <svg className="w-5 h-5 text-white/30 group-hover:text-[#F6CF80] transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={icon}/>
              </svg>
              <span className="text-[9px] font-black text-white/40 group-hover:text-[#F6CF80] uppercase tracking-widest transition-colors">{label}</span>
            </Link>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-white/30 text-[9px] font-black uppercase tracking-widest shrink-0">Tipe</span>
            {TYPES.map(([v, l]) => <FilterBtn key={v} active={filterType === v} onClick={() => setFilterType(v)}>{l}</FilterBtn>)}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-white/30 text-[9px] font-black uppercase tracking-widest shrink-0">Status</span>
            {STATUSES.map(([v, l]) => <FilterBtn key={v} active={filterStatus === v} onClick={() => setFilterStatus(v)}>{l}</FilterBtn>)}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-white/30 text-[9px] font-black uppercase tracking-widest shrink-0">Sort</span>
            {SORTS.map(([v, l]) => <FilterBtn key={v} active={sort === v} onClick={() => setSort(v)}>{l}</FilterBtn>)}
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
