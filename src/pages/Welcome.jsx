import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { imgUrl, apiFetch } from '../utils/api';

const Welcome = () => {
  const navigate = useNavigate();
  const [covers, setCovers] = useState([]);

  useEffect(() => {
    apiFetch('/manga?limit=20&sort=popular')
      .then(r => setCovers(Array.isArray(r.data) ? r.data.filter(a => a.cover_url) : []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center relative overflow-hidden">
      <style>{`body,html{background:#0a0a0c!important;margin:0;padding:0;overscroll-behavior-y:none}`}</style>

      {covers.length > 0 && (
        <div className="absolute inset-0 grid grid-cols-5 md:grid-cols-8 gap-1 opacity-20 scale-110 pointer-events-none">
          {[...covers, ...covers].slice(0, 40).map((a, i) => (
            <div key={i} className="aspect-[3/4] overflow-hidden">
              <img src={imgUrl(a.cover_url)} className="w-full h-full object-cover" alt="" />
            </div>
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/60 via-[#0a0a0c]/80 to-[#0a0a0c]" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 gap-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[#F6CF80] font-black text-5xl md:text-7xl tracking-tighter">Miruro</span>
          <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Manga · Manhwa · Doujinshi</span>
        </div>
        <p className="text-white/60 text-sm font-medium max-w-sm leading-relaxed">
          Baca manga, manhwa & doujinshi favorit kamu. Gratis, tanpa iklan, langsung di browser.
        </p>
        <button
          onClick={() => navigate('/home')}
          className="mt-4 px-10 py-4 bg-[#F6CF80] text-black font-black text-sm rounded-2xl shadow-[0_10px_40px_rgba(246,207,128,0.3)] hover:bg-[#ebd59b] active:scale-95 transition-all uppercase tracking-widest"
        >
          Mulai Membaca
        </button>
        <p className="text-white/20 text-[10px] font-bold">Server lokal aktif · Semua gambar diproxy</p>
      </div>
    </div>
  );
};

export default Welcome;
