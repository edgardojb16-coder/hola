/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type LotteryCountry = 'all' | 'cr' | 'ni' | 'hn';

export interface CountryInfo {
  id: LotteryCountry;
  name: string;
  shortName: string;
  lotteryName: string;
  flagEmoji: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    border: string;
    cardBg: string;
    badgeBg: string;
    textColor: string;
  };
}

export const COUNTRIES: Record<LotteryCountry, CountryInfo> = {
  all: {
    id: 'all',
    name: 'Trinacional (CR · NI · HN)',
    shortName: 'Las 3 Loterías',
    lotteryName: 'Costa Rica · Nicaragua · Honduras',
    flagEmoji: '🌎',
    colors: {
      primary: '#002B7F',
      secondary: '#CE1126',
      accent: '#00BCE4',
      glow: 'rgba(206, 17, 38, 0.25)',
      border: 'border-zinc-700',
      cardBg: 'from-blue-950/40 via-red-950/30 to-cyan-950/40',
      badgeBg: 'bg-zinc-800 text-white',
      textColor: 'text-white',
    },
  },
  cr: {
    id: 'cr',
    name: 'Costa Rica',
    shortName: 'Costa Rica',
    lotteryName: 'Tiempos Tica / JPS',
    flagEmoji: '🇨🇷',
    colors: {
      primary: '#002B7F', // Azul marino
      secondary: '#FFFFFF', // Blanco
      accent: '#CE1126', // Rojo
      glow: 'rgba(206, 17, 38, 0.35)',
      border: 'border-red-600/60',
      cardBg: 'from-blue-950/60 via-red-950/50 to-blue-950/70',
      badgeBg: 'bg-red-600 text-white',
      textColor: 'text-red-400',
    },
  },
  ni: {
    id: 'ni',
    name: 'Nicaragua',
    shortName: 'Nicaragua',
    lotteryName: 'Loto Diaria / La Nica',
    flagEmoji: '🇳🇮',
    colors: {
      primary: '#0067C6', // Azul Cobalto
      secondary: '#FFFFFF', // Blanco
      accent: '#F59E0B', // Ámbar sol del triángulo
      glow: 'rgba(0, 103, 198, 0.35)',
      border: 'border-blue-500/60',
      cardBg: 'from-blue-950/70 via-blue-900/40 to-zinc-950',
      badgeBg: 'bg-blue-600 text-white',
      textColor: 'text-blue-400',
    },
  },
  hn: {
    id: 'hn',
    name: 'Honduras',
    shortName: 'Honduras',
    lotteryName: 'La Diaria / Loto HN',
    flagEmoji: '🇭🇳',
    colors: {
      primary: '#00BCE4', // Azul Turquesa Maya oficial
      secondary: '#FFFFFF', // Blanco con 5 estrellas
      accent: '#06B6D4', // Cyan
      glow: 'rgba(0, 188, 228, 0.35)',
      border: 'border-cyan-500/60',
      cardBg: 'from-cyan-950/60 via-sky-900/40 to-zinc-950',
      badgeBg: 'bg-cyan-500 text-zinc-950',
      textColor: 'text-cyan-400',
    },
  },
};

/**
 * Bandera oficial estilizada de Costa Rica (Azul, Blanco, Rojo, Blanco, Azul)
 */
export function FlagCostaRica({ className = 'w-5 h-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className={`rounded-sm shadow-sm inline-block overflow-hidden shrink-0 ${className}`}
      aria-label="Bandera de Costa Rica"
    >
      <rect width="100" height="10" fill="#002B7F" />
      <rect y="10" width="100" height="10" fill="#FFFFFF" />
      <rect y="20" width="100" height="20" fill="#CE1126" />
      <rect y="40" width="100" height="10" fill="#FFFFFF" />
      <rect y="50" width="100" height="10" fill="#002B7F" />
    </svg>
  );
}

/**
 * Bandera oficial estilizada de Nicaragua (Azul, Blanco con triángulo nacional, Azul)
 */
export function FlagNicaragua({ className = 'w-5 h-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className={`rounded-sm shadow-sm inline-block overflow-hidden shrink-0 ${className}`}
      aria-label="Bandera de Nicaragua"
    >
      <rect width="100" height="20" fill="#0067C6" />
      <rect y="20" width="100" height="20" fill="#FFFFFF" />
      <rect y="40" width="100" height="20" fill="#0067C6" />
      <polygon points="50,23 41,37 59,37" fill="#0067C6" stroke="#D97706" strokeWidth="0.8" />
      <polygon points="50,27 45,36 55,36" fill="#059669" />
      <circle cx="50" cy="28" r="1.8" fill="#FBBF24" />
    </svg>
  );
}

/**
 * Bandera oficial estilizada de Honduras (Azul turquesa maya, Blanco con 5 estrellas turquesa, Azul turquesa)
 */
export function FlagHonduras({ className = 'w-5 h-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className={`rounded-sm shadow-sm inline-block overflow-hidden shrink-0 ${className}`}
      aria-label="Bandera de Honduras"
    >
      <rect width="100" height="20" fill="#00BCE4" />
      <rect y="20" width="100" height="20" fill="#FFFFFF" />
      <rect y="40" width="100" height="20" fill="#00BCE4" />
      <g fill="#00BCE4">
        <path d="M 40,25 L 41,27.5 L 43.5,27.5 L 41.5,29 L 42.2,31.5 L 40,30 L 37.8,31.5 L 38.5,29 L 36.5,27.5 L 39,27.5 Z" />
        <path d="M 60,25 L 61,27.5 L 63.5,27.5 L 61.5,29 L 62.2,31.5 L 60,30 L 57.8,31.5 L 58.5,29 L 56.5,27.5 L 59,27.5 Z" />
        <path d="M 50,28 L 51,30.5 L 53.5,30.5 L 51.5,32 L 52.2,34.5 L 50,33 L 47.8,34.5 L 48.5,32 L 46.5,30.5 L 49,30.5 Z" />
        <path d="M 40,31 L 41,33.5 L 43.5,33.5 L 41.5,35 L 42.2,37.5 L 40,36 L 37.8,37.5 L 38.5,35 L 36.5,33.5 L 39,33.5 Z" />
        <path d="M 60,31 L 61,33.5 L 63.5,33.5 L 61.5,35 L 62.2,37.5 L 60,36 L 57.8,37.5 L 58.5,35 L 56.5,33.5 L 59,33.5 Z" />
      </g>
    </svg>
  );
}

/**
 * Cinta tricolor patriótica combinando las tres banderas hermanas (CR, NI, HN)
 */
export function TriFlagRibbon({ className = 'h-1.5 w-full' }: { className?: string }) {
  return (
    <div className={`flex rounded-full overflow-hidden shadow-sm ${className}`}>
      {/* Costa Rica: Azul, Blanco, Rojo, Blanco, Azul */}
      <div className="flex-1 flex flex-col">
        <div className="h-[20%] bg-[#002B7F]" />
        <div className="h-[20%] bg-white" />
        <div className="h-[40%] bg-[#CE1126]" />
        <div className="h-[20%] bg-white" />
        <div className="h-[20%] bg-[#002B7F]" />
      </div>

      {/* Separador fino */}
      <div className="w-[1.5px] bg-zinc-900" />

      {/* Nicaragua: Azul, Blanco, Azul */}
      <div className="flex-1 flex flex-col">
        <div className="h-[33.3%] bg-[#0067C6]" />
        <div className="h-[33.4%] bg-white" />
        <div className="h-[33.3%] bg-[#0067C6]" />
      </div>

      {/* Separador fino */}
      <div className="w-[1.5px] bg-zinc-900" />

      {/* Honduras: Azul Turquesa, Blanco, Azul Turquesa */}
      <div className="flex-1 flex flex-col">
        <div className="h-[33.3%] bg-[#00BCE4]" />
        <div className="h-[33.4%] bg-white" />
        <div className="h-[33.3%] bg-[#00BCE4]" />
      </div>
    </div>
  );
}

export function CountryBadge({ country }: { country: LotteryCountry }) {
  if (country === 'cr') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-500/40">
        <FlagCostaRica className="w-4 h-2.5" />
        <span>Costa Rica</span>
      </span>
    );
  }
  if (country === 'ni') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40">
        <FlagNicaragua className="w-4 h-2.5" />
        <span>Nicaragua</span>
      </span>
    );
  }
  if (country === 'hn') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
        <FlagHonduras className="w-4 h-2.5" />
        <span>Honduras</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-700">
      <FlagCostaRica className="w-3.5 h-2" />
      <FlagNicaragua className="w-3.5 h-2" />
      <FlagHonduras className="w-3.5 h-2" />
      <span className="ml-0.5">Trinacional</span>
    </span>
  );
}
