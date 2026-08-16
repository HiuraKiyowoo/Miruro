import React from 'react';

const Footer = () => (
  <footer className="mt-16 bg-[#0a0a0c] border-t border-white/5 pt-12 pb-0 px-6">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 mb-12 items-start">
      <div className="flex flex-col flex-1">
        <span className="text-[#F6CF80] font-black text-xl mb-2 tracking-tight">Miruro</span>
        <p className="text-[10px] text-white/50 leading-relaxed font-medium max-w-xs">
          Platform baca manga, manhwa & doujinshi. Kami tidak mengunggah atau menyimpan konten di server kami. Semua konten disediakan oleh pihak ketiga.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="text-white font-black text-sm tracking-wide">Jelajahi</h4>
        {[['Manga', '/browse?type=manga'], ['Manhwa', '/browse?type=manhwa'], ['Doujinshi', '/browse?type=doujinshi'], ['Semua Genre', '/explore']].map(([label, href]) => (
          <a key={href} href={href} className="text-white/40 hover:text-[#F6CF80] text-xs font-bold transition-colors">{label}</a>
        ))}
      </div>
    </div>
    <div className="max-w-7xl mx-auto border-t border-white/5 py-6 text-center">
      <p className="text-[10px] text-white/30 font-black tracking-widest uppercase">© {new Date().getFullYear()} Miruro Reader · All Rights Reserved</p>
    </div>
  </footer>
);

export default Footer;
