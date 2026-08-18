import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { imgUrl, apiFetch, fmtNum } from '../utils/api';

const Shimmer = () => <div className="absolute top-0 bottom-0 left-0 w-[150%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;
const CardSkeleton = () => (
  <div className="min-w-[105px] flex flex-col gap-2">
    <div className="aspect-[3/4.5] bg-[#16161a] rounded-sm relative overflow-hidden shadow-xl"><Shimmer /></div>
    <div className="w-3/4 h-2.5 bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div>
  </div>
);

const StarIcon = () => <svg className="w-2 h-2 inline-block" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const EyeIcon = () => <svg className="w-2 h-2 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

const MangaCard = ({ a, onClick, badgeType }) => (
  <div onClick={onClick} className="min-w-[105px] w-[105px] group cursor-pointer snap-start active:scale-95 flex flex-col gap-2 transition-transform">
    <div className="relative aspect-[3/4.5] overflow-hidden bg-[#16161a] rounded-sm shadow-xl">
      <img src={imgUrl(a.cover_url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={a.title} />
      {badgeType === 'rating' && a.rating && (
        <div className="absolute top-1 left-1 bg-black/70 text-[#F472B6] text-[8px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
          <StarIcon /> {parseFloat(a.rating).toFixed(1)}
        </div>
      )}
      {badgeType === 'views' && a.views && (
        <div className="absolute top-1 left-1 bg-black/70 text-[#F472B6] text-[8px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
          <EyeIcon /> {fmtNum(a.views)}
        </div>
      )}
      {badgeType === 'status' && a.status && (
        <div className="absolute top-1 left-1 bg-black/70 text-white/80 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
          {a.status}
        </div>
      )}
      {a.type && <div className="absolute bottom-1 right-1 bg-white/10 text-white/80 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase">{a.type}</div>}
    </div>
    <h3 className="text-[9px] font-bold text-white/60 line-clamp-1 group-hover:text-[#F472B6] transition-colors">{a.title}</h3>
  </div>
);

const SectionHeader = ({ title, sub, onMore, scrollRef }) => (
  <div className="flex items-center justify-between mb-4 px-2">
    <div className="flex flex-col cursor-pointer group" onClick={onMore}>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-black text-white uppercase leading-none group-hover:text-[#F472B6] transition-colors tracking-tight">{title}</h2>
        <svg className="w-5 h-5 text-white/40 group-hover:text-[#F472B6] transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
      </div>
      <span className="text-[10px] text-white/40 mt-1 font-bold uppercase tracking-widest">{sub}</span>
    </div>
    <div className="flex gap-2">
      <button onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })} className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-white/20 transition-colors">
        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })} className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-white/20 transition-colors">
        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
      </button>
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [latestManga, setLatestManga] = useState([]);
  const [latestManhwa, setLatestManhwa] = useState([]);
  const [popular, setPopular] = useState([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const r1 = useRef(null), r2 = useRef(null), r3 = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    let alive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const [bRes, mRes, mhRes, pRes] = await Promise.all([
          apiFetch('/banners').catch(() => ({ data: [] })),
          apiFetch('/manga?limit=12&type=manga&sort=latest_chapter').catch(() => ({ data: [] })),
          apiFetch('/manga?limit=12&type=manhwa&sort=latest_chapter').catch(() => ({ data: [] })),
          apiFetch('/manga?limit=12&sort=popular').catch(() => ({ data: [] })),
        ]);
        if (!alive) return;
        setBanners(Array.isArray(bRes.data) ? bRes.data : []);
        setLatestManga(Array.isArray(mRes.data) ? mRes.data : []);
        setLatestManhwa(Array.isArray(mhRes.data) ? mhRes.data : []);
        setPopular(Array.isArray(pRes.data) ? pRes.data : []);
      } finally { if (alive) setIsLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, []);

  const heroItems = (banners.length > 0 ? banners : popular).slice(0, 8);
  const carousel = heroItems.length > 0 ? [...heroItems, heroItems[0]] : [];

  useEffect(() => {
    if (!heroItems.length) return;
    const itv = setInterval(() => setHeroIdx(p => p + 1), 6000);
    return () => clearInterval(itv);
  }, [heroItems.length]);

  useEffect(() => {
    if (heroItems.length && heroIdx === heroItems.length) {
      const t = setTimeout(() => { setTransitioning(false); setHeroIdx(0); }, 750);
      return () => clearTimeout(t);
    }
  }, [heroIdx, heroItems.length]);

  useEffect(() => {
    if (!transitioning && heroIdx === 0) {
      const t = setTimeout(() => setTransitioning(true), 50);
      return () => clearTimeout(t);
    }
  }, [transitioning, heroIdx]);

  const getSlug  = (item) => item.slug || item.manga_slug || '';
  const getCover = (item) => imgUrl(item.image_url || item.banner_url || item.cover_url || '');

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-nunito selection:bg-[#F472B6] selection:text-black pb-24 text-white">
      <style>{`
        @keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}}
        body,html{background-color:#0a0a0c!important;color:white;margin:0;padding:0;overscroll-behavior-y:none}
        .cscroll::-webkit-scrollbar{height:4px}.cscroll::-webkit-scrollbar-track{background:transparent}.cscroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:10px}
      `}</style>
      <Navbar />

      {/* Hero Carousel — VoraToon style */}
      <header className="relative w-full overflow-hidden bg-[#0f0f12]" style={{ height: 'clamp(280px, 56vw, 460px)' }}>
        {isLoading ? (
          <div className="w-full h-full bg-[#16161a] relative overflow-hidden"><Shimmer /></div>
        ) : (
          <>
            <div className={`flex h-full ${transitioning ? 'transition-transform duration-700' : ''}`}
              style={{ transform: `translate3d(-${heroIdx * 100}%,0,0)` }}>
              {carousel.map((item, i) => {
                const slug = getSlug(item);
                const cover = getCover(item);
                return (
                  <div key={i} className="min-w-full h-full relative overflow-hidden cursor-pointer"
                    onClick={() => slug && navigate(`/manga/${slug}`)}>

                    {/* Background artwork */}
                    <img src={cover} className="absolute inset-0 w-full h-full object-cover scale-105" alt="" style={{ opacity: 0.35 }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,10,12,0.85) 0%, rgba(10,10,12,0.5) 50%, rgba(10,10,12,0.7) 100%)' }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,12,1) 0%, transparent 40%)' }} />

                    {/* Main content */}
                    <div className="absolute inset-0 flex items-center justify-center gap-4 px-4" style={{ paddingBottom: '36px' }}>

                      {/* Stats pills — left */}
                      <div className="flex flex-col gap-1.5 shrink-0" style={{ minWidth: '72px' }}>
                        {item.rating && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-black text-xs text-white" style={{ background: '#f97316' }}>
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            {parseFloat(item.rating).toFixed(1)}
                          </div>
                        )}
                        {item.views && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-black text-xs text-white" style={{ background: '#0891b2' }}>
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            {fmtNum(item.views)}
                          </div>
                        )}
                        {item.status && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-black text-xs text-white" style={{ background: '#16a34a' }}>
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            {item.status}
                          </div>
                        )}
                        {item.type && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-black text-xs text-white" style={{ background: '#7c3aed' }}>
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                            {item.type}
                          </div>
                        )}
                      </div>

                      {/* Book cover — center */}
                      <div className="shrink-0 relative" style={{ width: 'clamp(110px, 26vw, 180px)' }}>
                        <img src={cover} alt={item.title}
                          className="w-full aspect-[3/4.2] object-cover rounded-lg"
                          style={{ boxShadow: '6px 6px 30px rgba(0,0,0,0.8), -2px 0 0 rgba(255,255,255,0.08), 2px 0 8px rgba(0,0,0,0.5)' }} />
                      </div>

                      {/* Right spacer — buat balance */}
                      <div style={{ minWidth: '72px' }} className="hidden md:block" />
                    </div>

                    {/* Title + genre tags — bottom */}
                    <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 px-4 z-10">
                      <h2 className="text-white font-black text-center line-clamp-1 drop-shadow-lg"
                        style={{ fontSize: 'clamp(11px, 3vw, 16px)', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                        {item.title || ''}
                      </h2>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dot indicators */}
            {heroItems.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
                {heroItems.map((_, i) => {
                  const active = i === heroIdx % heroItems.length;
                  return (
                    <button key={i} onClick={() => setHeroIdx(i)}
                      className={`rounded-full transition-all duration-300 ${active ? 'w-5 h-1.5 bg-[#F472B6]' : 'w-1.5 h-1.5 bg-white/30'}`} />
                  );
                })}
              </div>
            )}
          </>
        )}
      </header>

      <section className="max-w-7xl mx-auto px-6 mt-12">
        <SectionHeader title="Manga Terbaru" sub="Update manga paling baru" onMore={() => navigate('/browse?type=manga')} scrollRef={r1} />
        <div ref={r1} className="flex overflow-x-auto gap-3 pb-4 cscroll snap-x px-2">
          {isLoading ? [...Array(8)].map((_, i) => <CardSkeleton key={i} />) :
            latestManga.map((a, i) => <MangaCard key={a.slug || i} a={a} onClick={() => navigate(`/manga/${a.slug}`)} badgeType="rating" />)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 mt-10">
        <SectionHeader title="Manhwa Terbaru" sub="Komik Korea terbaru" onMore={() => navigate('/browse?type=manhwa')} scrollRef={r2} />
        <div ref={r2} className="flex overflow-x-auto gap-3 pb-4 cscroll snap-x px-2">
          {isLoading ? [...Array(8)].map((_, i) => <CardSkeleton key={i} />) :
            latestManhwa.map((a, i) => <MangaCard key={a.slug || i} a={a} onClick={() => navigate(`/manga/${a.slug}`)} badgeType="status" />)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 mt-10">
        <SectionHeader title="Populer" sub="Paling banyak dibaca" onMore={() => navigate('/explore')} scrollRef={r3} />
        <div ref={r3} className="flex overflow-x-auto gap-3 pb-4 cscroll snap-x px-2">
          {isLoading ? [...Array(8)].map((_, i) => <CardSkeleton key={i} />) :
            popular.map((a, i) => <MangaCard key={a.slug || i} a={a} onClick={() => navigate(`/manga/${a.slug}`)} badgeType="views" />)}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
