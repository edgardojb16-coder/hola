/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Hash, Calendar, Lock, ChevronDown, Check, Sparkles, ListOrdered, Clock, Dices, Timer } from 'lucide-react';

export type AppTabId = 'zl' | 'diaria' | 'anguila' | 'monazos' | 'tiempos' | 'monasus' | 'dia';

export interface AppTabItem {
  id: AppTabId;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentClass: string;
}

export const APP_TABS: AppTabItem[] = [
  {
    id: 'zl',
    label: 'Algoritmo ZL',
    description: 'Cálculo, Base del Día, fuertes y bomba del día',
    icon: Hash,
    accentClass: 'text-red-400 bg-red-500/15 border-red-500/40',
  },
  {
    id: 'diaria',
    label: 'Resultados de Ayer y Hoy',
    description: 'La Diaria Honduras · Actualización cada 60s',
    icon: Clock,
    accentClass: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/40',
  },
  {
    id: 'anguila',
    label: 'Sorteo de la Anguila',
    description: 'Resultados por día y secuencia numérica',
    icon: ListOrdered,
    accentClass: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
  },
  {
    id: 'monazos',
    label: 'Monazos Tica',
    description: '3 Monazos Costa Rica · Resultados en vivo',
    icon: Dices,
    accentClass: 'text-pink-400 bg-pink-500/15 border-pink-500/40',
  },
  {
    id: 'tiempos',
    label: 'Tiempos Tica',
    description: 'Nuevos Tiempos CR · Protegido con clave',
    icon: Timer,
    accentClass: 'text-blue-400 bg-blue-500/15 border-blue-500/40',
  },
  {
    id: 'monasus',
    label: 'Algoritmo Monasus',
    description: 'Solo propietario · Protegido con clave',
    icon: Lock,
    accentClass: 'text-violet-400 bg-violet-500/15 border-violet-500/40',
  },
  {
    id: 'dia',
    label: 'El Número del Día',
    description: 'Guía fija de la suerte semanal',
    icon: Calendar,
    accentClass: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
  },
];

interface CornerMenuProps {
  activeTab: AppTabId;
  onSelectTab: (tab: AppTabId) => void;
  onOpenSecurity: () => void;
}

export function CornerMenu({
  activeTab,
  onSelectTab,
  onOpenSecurity,
}: CornerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleTabClick = (tabId: AppTabId) => {
    onSelectTab(tabId);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative z-50">
      <button
        id="btn-corner-menu"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 backdrop-blur-sm ${
          isOpen
            ? 'bg-zinc-800 border-amber-400/60 text-white shadow-amber-950/30'
            : 'bg-zinc-900/95 hover:bg-zinc-800/95 border-zinc-700/80 hover:border-zinc-500 text-zinc-200 hover:text-white'
        }`}
        title="Abrir menú de pestañas"
      >
        {isOpen ? (
          <X size={14} className="text-amber-400" />
        ) : (
          <Menu size={14} className="text-amber-400" />
        )}
        <span>Menú</span>
        <ChevronDown
          size={13}
          className={`text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="dropdown-corner-menu"
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-64 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-2xl shadow-black/80 ring-1 ring-white/10 overflow-hidden text-left"
          >
            <div className="px-3.5 py-2.5 border-b border-zinc-800/90 flex items-center justify-between bg-zinc-900/60">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-300">
                  Pestañas
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {APP_TABS.length} secciones
              </span>
            </div>

            <div className="p-1.5 space-y-1">
              {APP_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    id={`menu-tab-${tab.id}`}
                    role="menuitem"
                    type="button"
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800/90 border border-zinc-700/80 text-white shadow-sm'
                        : 'hover:bg-zinc-900 text-zinc-300 hover:text-white border border-transparent'
                    }`}
                  >
                    <span
                      className={`p-1.5 rounded-lg border shrink-0 flex items-center justify-center ${tab.accentClass}`}
                    >
                      <Icon size={15} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">
                        {tab.label}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {tab.description}
                      </div>
                    </div>
                    {isActive && (
                      <Check size={14} className="text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-zinc-800/90 p-1.5 bg-zinc-900/30">
              <button
                id="menu-action-security"
                role="menuitem"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSecurity();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer"
              >
                <span className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400 shrink-0 flex items-center justify-center">
                  <Lock size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold leading-tight">
                    Mi Enlace Privado
                  </div>
                  <div className="text-[10px] text-amber-400/70 truncate mt-0.5">
                    Clave y seguridad del acceso
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
