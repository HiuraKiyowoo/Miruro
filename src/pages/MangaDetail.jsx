import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { imgUrl, apiFetch, saveHistory, getLastChapter, fmtNum } from '../utils/api';

const Shimmer = () => <div className="absolute top-0 bottom-0 left-0 w-[150%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;

function cleanDesc(str) {
  if (!str) return '';
  const decoded = str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '');
  return decoded.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const StarIcon = () => <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const EyeIcon = () => <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const BookIcon = () => <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;

const MangaDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [comments, setComments] = useState([]);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortDesc, setSortDesc] = useState(true);
  const [lastRead, setLastRead] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    if (!slug) return;
    window.scrollTo(0, 0);
    setIsLoading(true);
    setComments([]);
    setRelated([]);
    setLastRead(getLastChapter(slug));

    apiFetch(`/manga/${slug}`)
      .then(async res => {
        const data = res.data;
        setManga(data);
        document.title = `${data.title} - Miruro`;

        // Fetch comments
        apiFetch(`/manga/${data.id}/comments?page=1&limit=15`)
          .then(c => setComments(Array.isArray(c.data) ? c.data : []))
          .catch(() => {});

        // Fetch related (manga from same first genre)
        const genres = (data.manga_genres || []).map(g => g.genres).filter(Boolean);
        if (genres.length > 0) {
          apiFetch(`/manga?genre=${genres[0].slug}&sort=popular&limit=9`)
            .then(r => {
              const list = Array.isArray(r.data) ? r.data.filter(a => a.slug !== slug).slice(0, 8) : [];
              setRelated(list);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [slug]);

  const genres = manga ? (manga.manga_genres || []).map(g => g.genres).filter(Boolean) : [];
  const chapters = manga ? [...(manga.chapters || [])].sort((a, b) =>
    sortDesc ? b.chapter_number - a.chapter_number : a.chapter_number - b.chapter_number
  ) : [];
  const description = cleanDesc(manga?.description || '');

  const handleRead = (chapter) => {
    if (!manga) return;
    saveHistory({ slug: manga.slug, title: manga.title, cover_url: manga.cover_url }, chapter.chapter_number, chapter.id);
    navigate(`/read/${chapter.id}`);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0c] pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />
      <div className="pt-20 max-w-4xl mx-auto px-4 md:px-6 animate-pulse">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-48 mx-auto md:mx-0 aspect-[3/4] bg-[#16161a] rounded-md relative overflow-hidden shrink-0"><Shimmer /></div>
          <div className="flex-1 flex flex-col gap-4 pt-2">
            <div className="h-8 w-3/4 bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div>
            <div className="h-4 w-1/2 bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div>
            <div className="h-24 w-full bg-[#16161a] rounded-sm relative overflow-hidden"><Shimmer /></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!manga) return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <Navbar />
      <div className="text-white/40 text-sm font-bold">Manga tidak ditemukan.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-nunito selection:bg-[#F6CF80] selection:text-black pb-24 text-white">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0} .ch-scroll::-webkit-scrollbar{width:3px} .ch-scroll::-webkit-scrollbar-track{background:transparent} .ch-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}`}</style>
      <Navbar />

      {manga.cover_url && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img src={imgUrl(manga.cover_url)} className="w-full h-full object-cover blur-3xl opacity-10 scale-110" alt="" />
          <div className="absolute inset-0 bg-[#0a0a0c]/80" />
        </div>
      )}

      <div className="relative z-10 pt-20 max-w-4xl mx-auto px-4 md:px-6">

        {/* Cover + Info */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-48 shrink-0 flex justify-center md:justify-start">
            <img src={imgUrl(manga.cover_url)} alt={manga.title} className="w-44 aspect-[3/4] object-cover rounded-md shadow-[0_20px_60px_rgba(0,0,0,0.6)]" />
          </div>
          <div className="flex flex-col flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1 leading-tight tracking-tighter">{manga.title}</h1>
            {manga.alt_titles && <p className="text-white/30 text-[11px] mb-3 font-medium leading-snug">{manga.alt_titles}</p>}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
              {manga.type && <span className="bg-[#F6CF80] text-black text-[9px] px-2.5 py-1 rounded-sm uppercase font-black tracking-widest">{manga.type}</span>}
              {manga.status && <span className="bg-white/10 text-white/80 text-[9px] px-2.5 py-1 rounded-sm uppercase font-bold border border-white/5">{manga.status}</span>}
              {manga.rating && <span className="flex items-center gap-1 bg-[#fbbf24]/10 text-[#fbbf24] text-[9px] px-2.5 py-1 rounded-sm font-bold border border-[#fbbf24]/20"><StarIcon />{parseFloat(manga.rating).toFixed(2)}</span>}
              {manga.views && <span className="flex items-center gap-1 bg-white/5 text-white/60 text-[9px] px-2.5 py-1 rounded-sm font-bold border border-white/5"><EyeIcon />{fmtNum(manga.views)}</span>}
              {chapters.length > 0 && <span className="flex items-center gap-1 bg-white/5 text-white/60 text-[9px] px-2.5 py-1 rounded-sm font-bold border border-white/5"><BookIcon />{chapters.length} ch</span>}
            </div>

            {(manga.author || manga.artist) && (
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                {manga.author && (
                  <div className="bg-white/5 rounded-sm px-3 py-2 border border-white/5 text-left cursor-pointer hover:border-[#F6CF80]/40 transition-colors"
                    onClick={() => navigate(`/taxonomy/authors`)}>
                    <span className="text-white/40 text-[9px] uppercase font-black block tracking-wider">Author</span>
                    <span className="text-white text-xs font-bold">{manga.author}</span>
                  </div>
                )}
                {manga.artist && manga.artist !== manga.author && (
                  <div className="bg-white/5 rounded-sm px-3 py-2 border border-white/5 text-left">
                    <span className="text-white/40 text-[9px] uppercase font-black block tracking-wider">Artist</span>
                    <span className="text-white text-xs font-bold">{manga.artist}</span>
                  </div>
                )}
              </div>
            )}

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center md:justify-start mb-4">
                {genres.map(g => (
                  <span key={g.slug} onClick={() => navigate(`/explore?genre=${g.slug}`)}
                    className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-white/60 cursor-pointer hover:bg-[#F6CF80] hover:text-black hover:border-[#F6CF80] transition-all">{g.name}</span>
                ))}
              </div>
            )}

            {description && (
              <div className="mb-5 text-left">
                <p className={`text-white/55 text-xs leading-relaxed ${!showFullDesc ? 'line-clamp-4' : ''}`}>{description}</p>
                {description.length > 200 && (
                  <button onClick={() => setShowFullDesc(p => !p)} className="text-[#F6CF80] text-[10px] font-black mt-1 hover:underline">
                    {showFullDesc ? 'Sembunyikan' : 'Selengkapnya'}
                  </button>
                )}
              </div>
            )}

            {chapters.length > 0 && (
              <div className="flex gap-3 justify-center md:justify-start flex-wrap">
                <button onClick={() => handleRead(chapters[chapters.length - 1])}
                  className="px-6 py-3 bg-[#F6CF80] text-black font-black text-xs rounded-lg hover:bg-[#ebd59b] active:scale-95 transition-all uppercase tracking-widest">
                  Baca Ch.1
                </button>
                {lastRead?.chapterId && (
                  <button onClick={() => navigate(`/read/${lastRead.chapterId}`)}
                    className="px-6 py-3 bg-white/10 border border-white/20 text-white font-black text-xs rounded-lg hover:bg-white/20 active:scale-95 transition-all">
                    Lanjut Ch.{lastRead.chapterNumber}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chapter List */}
        <div className="bg-[#16161a] rounded-md border border-white/5 p-4 md:p-6 shadow-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-black uppercase text-sm tracking-wider">Chapters ({chapters.length})</h3>
            <button onClick={() => setSortDesc(p => !p)} className="text-white/40 hover:text-[#F6CF80] text-[10px] font-black uppercase tracking-widest transition-colors">
              {sortDesc ? 'Terbaru ↓' : 'Terlama ↑'}
            </button>
          </div>
          <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto pr-1 ch-scroll">
            {chapters.map(ch => {
              const isLast = lastRead?.chapterId === ch.id;
              return (
                <div key={ch.id} onClick={() => handleRead(ch)}
                  className={`flex items-center justify-between px-4 py-3 rounded-sm cursor-pointer transition-all active:scale-[0.99] ${isLast ? 'bg-[#F6CF80]/10 border border-[#F6CF80]/30' : 'bg-[#0a0a0c] border border-white/5 hover:border-white/20 hover:bg-white/5'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`font-black text-sm shrink-0 ${isLast ? 'text-[#F6CF80]' : 'text-white/80'}`}>Ch. {ch.chapter_number}</span>
                    {ch.title && <span className="text-white/40 text-xs font-medium truncate">{ch.title}</span>}
                    {isLast && <span className="text-[#F6CF80] text-[8px] font-black uppercase shrink-0 bg-[#F6CF80]/10 px-1.5 py-0.5 rounded-sm">Terakhir</span>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ch.views && <span className="text-white/25 text-[9px] font-bold">{fmtNum(ch.views)}</span>}
                    <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Related Manga */}
        {related.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white font-black uppercase text-sm tracking-wider mb-4">Mungkin Kamu Suka</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {related.map((a, i) => (
                <div key={a.slug || i} onClick={() => navigate(`/manga/${a.slug}`)} className="flex flex-col gap-1.5 group cursor-pointer active:scale-95 transition-transform">
                  <div className="relative aspect-[3/4.5] overflow-hidden bg-[#16161a] rounded-sm shadow-lg">
                    <img src={imgUrl(a.cover_url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={a.title} />
                  </div>
                  <h4 className="text-[8px] font-bold text-white/50 line-clamp-1 group-hover:text-[#F6CF80] transition-colors">{a.title}</h4>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {comments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-white font-black uppercase text-sm tracking-wider mb-4">Komentar ({comments.length})</h3>
            <div className="flex flex-col gap-3">
              {comments.map((c, i) => (
                <div key={i} className="bg-[#16161a] border border-white/5 rounded-sm px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#F6CF80]/20 flex items-center justify-center shrink-0">
                      <span className="text-[#F6CF80] text-[9px] font-black uppercase">
                        {(c.users?.username || 'A')[0]}
                      </span>
                    </div>
                    <span className="text-[#F6CF80] text-xs font-black">{c.users?.username || 'Anonymous'}</span>
                    {c.created_at && (
                      <span className="text-white/20 text-[9px] font-bold ml-auto">
                        {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed">{c.content || ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default MangaDetail;
