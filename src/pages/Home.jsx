import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { imgUrl, apiFetch, fmtNum } from "../utils/api";

const Shimmer = () => (
  <div
    className="absolute top-0 bottom-0 left-0 w-[150%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10"
    style={{ transform: "translate3d(-100%,0,0) skewX(-20deg)" }}
  />
);
const CardSkeleton = () => (
  <div className="min-w-[105px] flex flex-col gap-2">
    <div className="aspect-[3/4.5] bg-[#16161a] rounded-sm relative overflow-hidden shadow-xl">
      <Shimmer />
    </div>
    <div className="w-3/4 h-2.5 bg-[#16161a] rounded-sm relative overflow-hidden">
      <Shimmer />
    </div>
  </div>
);

const StarIcon = () => (
  <svg className="w-2 h-2 inline-block" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const EyeIcon = () => (
  <svg
    className="w-2 h-2 inline-block"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const MangaCard = ({ a, onClick, badgeType }) => (
  <div
    onClick={onClick}
    className="min-w-[105px] w-[105px] group cursor-pointer snap-start active:scale-95 flex flex-col gap-2 transition-transform"
  >
    <div className="relative aspect-[3/4.5] overflow-hidden bg-[#16161a] rounded-sm shadow-xl">
      <img
        src={imgUrl(a.cover_url)}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        alt={a.title}
      />
      {badgeType === "rating" && a.rating && (
        <div className="absolute top-1 left-1 bg-black/70 text-[#F472B6] text-[8px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
          <StarIcon /> {parseFloat(a.rating).toFixed(1)}
        </div>
      )}
      {badgeType === "views" && a.views && (
        <div className="absolute top-1 left-1 bg-black/70 text-[#F472B6] text-[8px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
          <EyeIcon /> {fmtNum(a.views)}
        </div>
      )}
      {badgeType === "status" && a.status && (
        <div className="absolute top-1 left-1 bg-black/70 text-white/80 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
          {a.status}
        </div>
      )}
      {a.type && (
        <div className="absolute bottom-1 right-1 bg-white/10 text-white/80 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
          {a.type}
        </div>
      )}
    </div>
    <h3 className="text-[9px] font-bold text-white/60 line-clamp-1 group-hover:text-[#F472B6] transition-colors">
      {a.title}
    </h3>
  </div>
);

const SectionHeader = ({ title, sub, onMore, scrollRef }) => (
  <div className="flex items-center justify-between mb-4 px-2">
    <div className="flex flex-col cursor-pointer group" onClick={onMore}>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-black text-white uppercase leading-none group-hover:text-[#F472B6] transition-colors tracking-tight">
          {title}
        </h2>
        <svg
          className="w-5 h-5 text-white/40 group-hover:text-[#F472B6] transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <span className="text-[10px] text-white/40 mt-1 font-bold uppercase tracking-widest">
        {sub}
      </span>
    </div>
    <div className="flex gap-2">
      <button
        onClick={() =>
          scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })
        }
        className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-white/20 transition-colors"
      >
        <svg
          className="w-4 h-4 text-white/50"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() =>
          scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })
        }
        className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-white/20 transition-colors"
      >
        <svg
          className="w-4 h-4 text-white/50"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
);

/**
 * DARK COMIC CAROUSEL — kartu tengah aktif, side peek, stack statistik,
 * cover komik, loop saat swipe, dan tanpa panah pada Android.
 *
 * Cara pakai di Home.jsx:
 * 1. Simpan file ini, lalu import VoratoonHeroCarousel dari path komponen ini.
 * 2. Ganti <header> hero lama dengan:
 *    <VoratoonHeroCarousel
 *      items={heroItems}
 *      isLoading={isLoading}
 *      navigate={navigate}
 *      imgUrl={imgUrl}
 *      fmtNum={fmtNum}
 *    />
 * 3. Hapus state/effect lama: heroIdx, transitioning, carousel, dan tiga useEffect carousel.
 */

const HeroStar = () => (
  <svg
    className="h-2 w-2 shrink-0"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const HeroEye = () => (
  <svg
    className="h-2 w-2 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const Arrow = ({ direction }) => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d={direction === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"}
    />
  </svg>
);

function VoratoonHeroCarousel({
  items = [],
  isLoading,
  navigate,
  imgUrl,
  fmtNum,
}) {
  const trackRef = useRef(null);
  const activeRef = useRef(0);
  const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const settleTimerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const count = items.length;
  const getSlug = item => item?.slug || item?.manga_slug || "";
  const getBanner = item =>
    imgUrl(item?.banner_url || item?.image_url || item?.cover_url || "");
  const getCover = item =>
    imgUrl(item?.cover_url || item?.image_url || item?.banner_url || "");
  const getSaveCount = item =>
    item?.bookmarks || item?.favorites || item?.likes || item?.followers || 0;
  const getGenres = item => {
    const raw = item?.genres || item?.genre || item?.tags || [];
    const values = Array.isArray(raw) ? raw : String(raw).split(",");
    return values
      .map(genre => (typeof genre === "string" ? genre.trim() : genre?.name))
      .filter(Boolean)
      .slice(0, 3);
  };

  const centerElement = (element, instant = false) => {
    const track = trackRef.current;
    if (!track || !element) return;
    const left =
      element.offsetLeft - (track.clientWidth - element.clientWidth) / 2;
    track.scrollTo({ left, behavior: instant ? "auto" : "smooth" });
  };

  const selectIndex = index => {
    if (!count) return;
    const next = (index + count) % count;
    activeRef.current = next;
    setActiveIndex(next);
  };

  const centerRealSlide = (index, instant = false) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector(
      `[data-vt-real="${index}"]:not([data-vt-clone])`
    );
    centerElement(slide, instant);
  };

  const goTo = index => {
    if (!count) return;
    const next = (index + count) % count;
    selectIndex(next);
    centerRealSlide(next);
  };

  const goNext = () => {
    if (count < 2) return;
    const current = activeRef.current;
    if (current === count - 1) {
      const clone = trackRef.current?.querySelector('[data-vt-clone="head"]');
      selectIndex(0);
      centerElement(clone);
      return;
    }
    goTo(current + 1);
  };

  const goPrevious = () => {
    if (count < 2) return;
    const current = activeRef.current;
    if (current === 0) {
      const clone = trackRef.current?.querySelector('[data-vt-clone="tail"]');
      selectIndex(count - 1);
      centerElement(clone);
      return;
    }
    goTo(current - 1);
  };

  const settlePosition = () => {
    const track = trackRef.current;
    if (!track || !count) return;
    const cards = [...track.querySelectorAll("[data-vt-real]")];
    const center = track.scrollLeft + track.clientWidth / 2;
    const nearest = cards.reduce((winner, card) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const winnerCenter = winner.offsetLeft + winner.clientWidth / 2;
      return Math.abs(cardCenter - center) < Math.abs(winnerCenter - center)
        ? card
        : winner;
    });
    const index = Number(nearest.dataset.vtReal);
    if (nearest.dataset.vtClone) centerRealSlide(index, true);
    selectIndex(index);
  };

  useEffect(() => {
    if (!count) return undefined;
    const frame = requestAnimationFrame(() => {
      selectIndex(0);
      centerRealSlide(0, true);
    });
    return () => cancelAnimationFrame(frame);
  }, [count]);

  useEffect(() => {
    if (count < 2) return undefined;
    const timer = window.setInterval(goNext, 6000);
    return () => window.clearInterval(timer);
  }, [count]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const onScroll = () => {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(settlePosition, 130);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(settleTimerRef.current);
      track.removeEventListener("scroll", onScroll);
    };
  }, [count]);

  useEffect(() => {
    const onKeyboard = event => {
      if (event.key === "ArrowLeft") goPrevious();
      if (event.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyboard);
    return () => window.removeEventListener("keydown", onKeyboard);
  }, [count]);

  const onPointerDown = event => {
    if (event.pointerType === "touch") return;
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
    };
    track.setPointerCapture(event.pointerId);
    track.classList.add("vt-dragging");
  };

  const onPointerMove = event => {
    const track = trackRef.current;
    if (!dragRef.current.active || !track) return;
    track.scrollLeft =
      dragRef.current.startScrollLeft -
      (event.clientX - dragRef.current.startX);
  };

  const onPointerUp = event => {
    const track = trackRef.current;
    if (!dragRef.current.active || !track) return;
    dragRef.current.active = false;
    track.classList.remove("vt-dragging");
    if (track.hasPointerCapture(event.pointerId))
      track.releasePointerCapture(event.pointerId);
    settlePosition();
  };

  const slides =
    count > 1
      ? [
          { item: items.at(-1), realIndex: count - 1, clone: "tail" },
          ...items.map((item, realIndex) => ({ item, realIndex })),
          { item: items[0], realIndex: 0, clone: "head" },
        ]
      : items.map((item, realIndex) => ({ item, realIndex }));

  if (isLoading) {
    return (
      <header className="relative w-full min-h-[300px] aspect-[16/10] overflow-hidden bg-[#16161a]">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#16161a] via-white/5 to-[#16161a]" />
      </header>
    );
  }

  if (!count) return null;

  return (
    <header
      className="vt-hero relative w-full overflow-hidden bg-[#0a0e17] py-1"
      aria-label="Banner seri pilihan"
    >
      <style>{`
        .vt-hero * { box-sizing: border-box; }
        .vt-track { scrollbar-width: none; }
        .vt-track::-webkit-scrollbar { display: none; }
        .vt-track.vt-dragging { cursor: grabbing; scroll-snap-type: none; }
        .vt-card { container-type: inline-size; }
      `}</style>

      <button
        type="button"
        onClick={goPrevious}
        aria-label="Banner sebelumnya"
        className="absolute left-[max(12px,calc(50%-min(36vw,430px)))] top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-[#111827]/70 text-white shadow-xl backdrop-blur-sm transition hover:scale-110 hover:border-[#ff7f00] hover:bg-[#ff7f00] active:scale-95 md:grid"
      >
        <Arrow direction="prev" />
      </button>

      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="vt-track flex snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain px-[7.5%] py-5 scroll-smooth md:px-[20%]"
        style={{ touchAction: "pan-x", cursor: "grab" }}
      >
        {slides.map(({ item, realIndex, clone }, index) => {
          const genres = getGenres(item);
          const isActive = !clone && realIndex === activeIndex;
          const rating = item?.rating ? Number(item.rating).toFixed(1) : "—";
          const saved = getSaveCount(item);
          const views = item?.views || item?.view_count || 0;

          return (
            <article
              key={`${clone || "real"}-${realIndex}-${index}`}
              data-vt-real={realIndex}
              data-vt-clone={clone || undefined}
              aria-hidden={clone ? "true" : undefined}
              className={`vt-card relative -mx-2.5 aspect-[720/380] max-w-[720px] flex-[0_0_85%] snap-center overflow-hidden bg-[#111827] shadow-[0_10px_30px_rgba(0,0,0,.5)] transition-all duration-[400ms] [transition-timing-function:cubic-bezier(.25,1,.5,1)] md:-mx-[15px] md:flex-[0_0_60%] ${isActive ? "z-20 scale-100 opacity-100 shadow-[0_18px_42px_rgba(0,0,0,.82)]" : "z-10 scale-[.88] opacity-45"}`}
            >
              <img
                src={getBanner(item)}
                className="absolute inset-0 h-full w-full object-cover"
                draggable="false"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c]/65 via-transparent to-transparent" />

              <div className="relative z-10 flex h-full max-w-[90%] flex-col justify-center py-[4%] pr-[4%]">
                <div className="mb-[2%] flex h-[80%] items-center">
                  <div className="z-10 flex flex-col gap-1.5">
                    <span className="flex min-w-[95px] items-center gap-2 bg-[#f59e0b] py-1.5 pl-2.5 pr-2 text-[clamp(.52rem,1.8cqi,.75rem)] font-black text-white shadow-lg">
                      <HeroStar />
                      {rating}
                    </span>
                    <span className="flex min-w-[95px] items-center gap-2 bg-[#ec4899] py-1.5 pl-2.5 pr-2 text-[clamp(.52rem,1.8cqi,.75rem)] font-black text-white shadow-lg">
                      <b aria-hidden="true">▮</b>
                      {fmtNum(saved)}
                    </span>
                    <span className="flex min-w-[95px] items-center gap-2 bg-[#06b6d4] py-1.5 pl-2.5 pr-2 text-[clamp(.52rem,1.8cqi,.75rem)] font-black text-white shadow-lg">
                      <HeroEye />
                      {fmtNum(views)}
                    </span>
                    <span className="flex min-w-[95px] items-center gap-2 bg-[#10b981] py-1.5 pl-2.5 pr-2 text-[clamp(.52rem,1.8cqi,.75rem)] font-black text-white shadow-lg">
                      <b aria-hidden="true">▥</b>#
                      {String(realIndex + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <img
                    src={getCover(item)}
                    className="h-full w-auto shrink-0 rounded-lg object-cover shadow-[4px_8px_20px_rgba(0,0,0,.6)]"
                    draggable="false"
                    alt={`Cover ${item?.title || ""}`}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pl-[2.5cqi]">
                  {(genres.length ? genres : [item?.type || "Komik"]).map(
                    genre => (
                      <span
                        key={genre}
                        className="rounded-full bg-[#ff7f00] px-[2cqi] py-[.55cqi] text-[clamp(.46rem,1.5cqi,.7rem)] font-black text-white shadow-md"
                      >
                        {genre}
                      </span>
                    )
                  )}
                  {getSlug(item) && (
                    <button
                      type="button"
                      onClick={() => navigate(`/manga/${getSlug(item)}`)}
                      tabIndex={clone ? -1 : 0}
                      className="rounded-full border border-white/30 bg-black/25 px-[2cqi] py-[.55cqi] text-[clamp(.46rem,1.5cqi,.7rem)] font-black text-white backdrop-blur-sm transition hover:bg-white hover:text-black"
                    >
                      Baca →
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        onClick={goNext}
        aria-label="Banner berikutnya"
        className="absolute right-[max(12px,calc(50%-min(36vw,430px)))] top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-[#111827]/70 text-white shadow-xl backdrop-blur-sm transition hover:scale-110 hover:border-[#ff7f00] hover:bg-[#ff7f00] active:scale-95 md:grid"
      >
        <Arrow direction="next" />
      </button>

      <div
        className="mt-0 flex items-center justify-center gap-1.5 pb-2"
        aria-label="Pilih banner"
      >
        {items.map((item, index) => (
          <button
            key={item?.id || item?.slug || index}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Tampilkan banner ${index + 1}`}
            aria-current={activeIndex === index}
            className={`h-1.5 rounded-full transition-all ${activeIndex === index ? "w-6 bg-[#ff7f00] shadow-[0_0_10px_rgba(255,127,0,.55)]" : "w-1.5 bg-white/25"}`}
          />
        ))}
      </div>
    </header>
  );
}

const Home = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [latestManga, setLatestManga] = useState([]);
  const [latestManhwa, setLatestManhwa] = useState([]);
  const [popular, setPopular] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const r1 = useRef(null),
    r2 = useRef(null),
    r3 = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    let alive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const [bRes, mRes, mhRes, pRes] = await Promise.all([
          apiFetch("/banners").catch(() => ({ data: [] })),
          apiFetch("/manga?limit=12&type=manga&sort=latest_chapter").catch(
            () => ({ data: [] })
          ),
          apiFetch("/manga?limit=12&type=manhwa&sort=latest_chapter").catch(
            () => ({ data: [] })
          ),
          apiFetch("/manga?limit=12&sort=popular").catch(() => ({ data: [] })),
        ]);
        if (!alive) return;
        setBanners(Array.isArray(bRes.data) ? bRes.data : []);
        setLatestManga(Array.isArray(mRes.data) ? mRes.data : []);
        setLatestManhwa(Array.isArray(mhRes.data) ? mhRes.data : []);
        setPopular(Array.isArray(pRes.data) ? pRes.data : []);
      } finally {
        if (alive) setIsLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const heroItems = (banners.length > 0 ? banners : popular).slice(0, 8);
  return (
    <div className="min-h-screen bg-[#0a0a0c] font-nunito selection:bg-[#F472B6] selection:text-black pb-24 text-white">
      <style>{`
        @keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}}
        body,html{background-color:#0a0a0c!important;color:white;margin:0;padding:0;overscroll-behavior-y:none}
        .cscroll::-webkit-scrollbar{height:4px}.cscroll::-webkit-scrollbar-track{background:transparent}.cscroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:10px}
      `}</style>
      <Navbar />

      <VoratoonHeroCarousel
        items={heroItems}
        isLoading={isLoading}
        navigate={navigate}
        imgUrl={imgUrl}
        fmtNum={fmtNum}
      />

      <section className="max-w-7xl mx-auto px-6 mt-12">
        <SectionHeader
          title="Manga Terbaru"
          sub="Update manga paling baru"
          onMore={() => navigate("/browse?type=manga")}
          scrollRef={r1}
        />
        <div
          ref={r1}
          className="flex overflow-x-auto gap-3 pb-4 cscroll snap-x px-2"
        >
          {isLoading
            ? [...Array(8)].map((_, i) => <CardSkeleton key={i} />)
            : latestManga.map((a, i) => (
                <MangaCard
                  key={a.slug || i}
                  a={a}
                  onClick={() => navigate(`/manga/${a.slug}`)}
                  badgeType="rating"
                />
              ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 mt-10">
        <SectionHeader
          title="Manhwa Terbaru"
          sub="Komik Korea terbaru"
          onMore={() => navigate("/browse?type=manhwa")}
          scrollRef={r2}
        />
        <div
          ref={r2}
          className="flex overflow-x-auto gap-3 pb-4 cscroll snap-x px-2"
        >
          {isLoading
            ? [...Array(8)].map((_, i) => <CardSkeleton key={i} />)
            : latestManhwa.map((a, i) => (
                <MangaCard
                  key={a.slug || i}
                  a={a}
                  onClick={() => navigate(`/manga/${a.slug}`)}
                  badgeType="status"
                />
              ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 mt-10">
        <SectionHeader
          title="Populer"
          sub="Paling banyak dibaca"
          onMore={() => navigate("/explore")}
          scrollRef={r3}
        />
        <div
          ref={r3}
          className="flex overflow-x-auto gap-3 pb-4 cscroll snap-x px-2"
        >
          {isLoading
            ? [...Array(8)].map((_, i) => <CardSkeleton key={i} />)
            : popular.map((a, i) => (
                <MangaCard
                  key={a.slug || i}
                  a={a}
                  onClick={() => navigate(`/manga/${a.slug}`)}
                  badgeType="views"
                />
              ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
