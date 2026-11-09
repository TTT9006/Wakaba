import React from 'react';
import type { KamonType } from '../types';

interface KamonProps {
  className?: string;
  size?: number;
}

export function KikuKamon({ className = 'w-10 h-10', size = 48 }: KamonProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Gia huy Hoa Cúc Hoàng Gia"
    >
      <circle cx="24" cy="24" r="4.5" fill="currentColor" fillOpacity="0.25" />
      <path d="M24 5v7M24 36v7M5 24h7M36 24h7" />
      <path d="m10.5 10.5 5 5m17 17 5 5M10.5 37.5l5-5m17-17 5-5" />
      <path
        d="M24 4.5c1 0 3.8 5 3.8 9.5s-2.8 5.5-3.8 5.5-3.8-1-3.8-5.5 2.8-9.5 3.8-9.5z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M24 43.5c1 0 3.8-5 3.8-9.5s-2.8-5.5-3.8-5.5-3.8 1-3.8 5.5 2.8 9.5 3.8 9.5z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M4.5 24c0 1 5 3.8 9.5 3.8s5.5-2.8 5.5-3.8-1-3.8-5.5-3.8-9.5 2.8-9.5 3.8z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M43.5 24c0 1-5 3.8-9.5 3.8s-5.5-2.8-5.5-3.8 1-3.8 5.5-3.8 9.5 2.8 9.5 3.8z"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

export function UmeKamon({ className = 'w-10 h-10' }: KamonProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Gia huy Hoa Mai Tri Thức"
    >
      <circle cx="24" cy="24" r="4.5" fill="currentColor" fillOpacity="0.25" />
      <circle cx="24" cy="11.8" r="6.2" fill="currentColor" fillOpacity="0.16" />
      <circle cx="35.6" cy="20.2" r="6.2" fill="currentColor" fillOpacity="0.16" />
      <circle cx="31.2" cy="33.8" r="6.2" fill="currentColor" fillOpacity="0.16" />
      <circle cx="16.8" cy="33.8" r="6.2" fill="currentColor" fillOpacity="0.16" />
      <circle cx="12.4" cy="20.2" r="6.2" fill="currentColor" fillOpacity="0.16" />
    </svg>
  );
}

export function SakuraKamon({ className = 'w-10 h-10' }: KamonProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-label="Gia huy Hoa Anh Đào"
    >
      <defs>
        <path
          id="sakuraPetalHarmonized"
          d="M 24 20 C 19 16 15.5 11 19 5.2 C 21 3.5 22.8 4.6 24 6.8 C 25.2 4.6 27 3.5 29 5.2 C 32.5 11 29 16 24 20 Z"
          fill="currentColor"
          fillOpacity="0.18"
        />
      </defs>
      <circle cx="24" cy="24" r="4.5" fill="currentColor" fillOpacity="0.25" />
      <use href="#sakuraPetalHarmonized" />
      <use href="#sakuraPetalHarmonized" transform="rotate(72 24 24)" />
      <use href="#sakuraPetalHarmonized" transform="rotate(144 24 24)" />
      <use href="#sakuraPetalHarmonized" transform="rotate(216 24 24)" />
      <use href="#sakuraPetalHarmonized" transform="rotate(288 24 24)" />
    </svg>
  );
}

export function WakabaKamon({ className = 'w-10 h-10' }: KamonProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Gia huy Chồi Non Wakaba"
    >
      <circle cx="24" cy="24" r="21" strokeDasharray="2 3" strokeWidth="1.2" opacity="0.4" />
      <path d="M 24 38 C 24 28 24 22 24 16" strokeWidth="2.2" />
      <path
        d="M 24 23 C 32 23 37 17 38 9 C 30 8 25 14 24 23 Z"
        fill="currentColor"
        fillOpacity="0.22"
      />
      <path
        d="M 24 27 C 16 27 11 21 10 13 C 18 12 23 18 24 27 Z"
        fill="currentColor"
        fillOpacity="0.22"
      />
    </svg>
  );
}

interface KamonBadgeProps {
  type: KamonType;
  rank?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function KamonBadge({
  type,
  rank,
  size = 'md',
  showLabel = false,
  className = '',
}: KamonBadgeProps) {
  const sizeMap = {
    sm: { container: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-[10px]' },
    md: { container: 'w-11 h-11', icon: 'w-7 h-7', text: 'text-xs' },
    lg: { container: 'w-16 h-16', icon: 'w-10 h-10', text: 'text-sm' },
  };

  const styleMap = {
    kiku: {
      bg: 'bg-[#fcf9f2] border-[#c89b3c] text-[#966c18]',
      badgeBg: 'bg-[#faf6ed] border-[#ecd9b2]',
      tagBg: 'bg-[#f6ebd1] text-[#966c18] border-[#e8d19e]',
      label: 'Quán Quân (Top 1)',
      kamonName: 'Cúc Hoàng Gia (菊紋)',
    },
    ume: {
      bg: 'bg-[#ffffff] border-[#94a3b8] text-[#475569]',
      badgeBg: 'bg-[#f7f8f9] border-[#d9dfe4]',
      tagBg: 'bg-[#e9edf1] text-[#475569] border-[#cbd5e1]',
      label: 'Á Quân (Top 2)',
      kamonName: 'Mai Tri Thức (梅紋)',
    },
    sakura: {
      bg: 'bg-[#ffffff] border-[#b8806c] text-[#8c4a32]',
      badgeBg: 'bg-[#faf4f1] border-[#e7d3cb]',
      tagBg: 'bg-[#f3e4de] text-[#8c4a32] border-[#dec2b7]',
      label: 'Quý Quân (Top 3)',
      kamonName: 'Anh Đào (桜紋)',
    },
    wakaba: {
      bg: 'bg-white border-[#2c5e43] text-[#2c5e43]',
      badgeBg: 'bg-[#e9f2ec] border-[#c2dacb]',
      tagBg: 'bg-[#d9ebe0] text-[#2c5e43] border-[#bcdbc7]',
      label: rank ? `Hạng #${rank}` : 'Chồi Non',
      kamonName: 'Chồi Non (若葉紋)',
    },
  };

  const { container, icon, text } = sizeMap[size];
  const s = styleMap[type];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`${container} rounded-full border-2 flex items-center justify-center shadow-xs transition-transform duration-200 hover:scale-105 ${s.bg}`}
      >
        {type === 'kiku' && <KikuKamon className={icon} />}
        {type === 'ume' && <UmeKamon className={icon} />}
        {type === 'sakura' && <SakuraKamon className={icon} />}
        {type === 'wakaba' && <WakabaKamon className={icon} />}
      </div>
      {showLabel && (
        <div>
          <span
            className={`font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${text} ${s.tagBg}`}
          >
            {s.label}
          </span>
          <p className="text-[11px] text-[#5e6660] mt-0.5">{s.kamonName}</p>
        </div>
      )}
    </div>
  );
}
