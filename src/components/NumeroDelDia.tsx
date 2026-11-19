/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Copy, Check } from 'lucide-react';
import { TriFlagRibbon, FlagCostaRica, FlagNicaragua, FlagHonduras } from './FlagBadges';

export interface RecordatorioDia {
  dayIndex: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  nombre: string;
  numero: number;
}

export const LISTA_DIAS: RecordatorioDia[] = [
  { dayIndex: 1, nombre: 'Lunes', numero: 7 },
  { dayIndex: 2, nombre: 'Martes', numero: 3 },
  { dayIndex: 3, nombre: 'Miércoles', numero: 8 },
  { dayIndex: 4, nombre: 'Jueves', numero: 9 },
  { dayIndex: 5, nombre: 'Viernes', numero: 1 },
  { dayIndex: 6, nombre: 'Sábado', numero: 6 },
  { dayIndex: 0, nombre: 'Domingo', numero: 5 },
];

export function NumeroDelDia() {
  const todayIndex = new Date().getDay();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const texto = LISTA_DIAS.map((d) => `${d.nombre} ${d.numero}`).join('\n');
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Encabezado del recordatorio con banderas */}
      <div className="space-y-2 pb-2 border-b border-zinc-800">
        <TriFlagRibbon className="h-1.5 w-full" />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calendar size={16} />
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  Número del Día
                </h3>
                <div className="flex items-center gap-1 ml-1">
                  <FlagCostaRica className="w-3.5 h-2.5" />
                  <FlagNicaragua className="w-3.5 h-2.5" />
                  <FlagHonduras className="w-3.5 h-2.5" />
                </div>
              </div>
              <p className="text-[11px] text-zinc-400">
                Guía fija de la suerte para CR, Nicaragua y Honduras
              </p>
            </div>
          </div>

          <button
            id="btn-copiar-recordatorio"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-300 hover:text-white font-medium border border-zinc-800 hover:border-zinc-700 transition flex items-center gap-1.5 shadow-sm"
            title="Copiar lista de días"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* Lista limpia de los días */}
      <div className="space-y-2">
        {LISTA_DIAS.map((item) => {
          const isToday = item.dayIndex === todayIndex;

          return (
            <div
              key={item.nombre}
              id={`recordatorio-${item.nombre.toLowerCase()}`}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition ${
                isToday
                  ? 'bg-amber-950/30 border-amber-500/60 shadow-md shadow-amber-950/20'
                  : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isToday ? 'bg-amber-400 ring-4 ring-amber-500/20' : 'bg-zinc-600'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    isToday ? 'text-amber-200 font-bold' : 'text-zinc-200'
                  }`}
                >
                  {item.nombre}
                </span>
                {isToday && (
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Hoy
                  </span>
                )}
              </div>

              <div className="flex items-center">
                <span
                  className={`text-xl font-mono font-black ${
                    isToday ? 'text-amber-300' : 'text-white'
                  }`}
                >
                  {item.numero}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
