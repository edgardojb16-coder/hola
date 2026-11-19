/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { fetchAlgorithmZL, CalculationResult } from '../utils';
import { Copy, Check, Calendar, Sparkles, ShieldCheck } from 'lucide-react';
import { TriFlagRibbon } from './FlagBadges';

interface BaseDelDiaCalculatorProps {
  numberStr: string;
  currentDay?: number;
  currentMonth?: number;
  currentYear?: number;
}

export function BaseDelDiaCalculator({
  numberStr,
  currentDay,
  currentMonth,
  currentYear,
}: BaseDelDiaCalculatorProps) {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const cacheRef = useRef<Record<string, CalculationResult>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const cleanNumber = numberStr.padStart(2, '0').slice(-2);
    const now = new Date();
    const day =
      currentDay && currentDay >= 1 && currentDay <= 31
        ? currentDay
        : now.getDate();
    const month =
      currentMonth && currentMonth >= 1 && currentMonth <= 12
        ? currentMonth
        : now.getMonth() + 1;
    const year =
      currentYear && currentYear >= 2000 && currentYear <= 2100
        ? currentYear
        : now.getFullYear();

    const cacheKey = `${cleanNumber}_date_${day}_${month}_${year}`;

    if (cacheRef.current[cacheKey]) {
      setResult(cacheRef.current[cacheKey]);
      return;
    }

    fetchAlgorithmZL(cleanNumber, { day, month, year })
      .then((data) => {
        if (!isCancelled) {
          cacheRef.current[cacheKey] = data;
          setResult(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching Base del Día calculation:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [numberStr, currentDay, currentMonth, currentYear]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const baseData = result?.baseDelDia;
  const fallbackDay = String(
    currentDay && currentDay >= 1 && currentDay <= 31
      ? currentDay
      : new Date().getDate()
  ).padStart(2, '0');

  const baseUsed = baseData?.baseUsed ?? fallbackDay;
  const direct = baseData?.direct ?? '--';
  const dual = baseData?.dual ?? '--';
  const directOptions = baseData?.directOptions ?? [];
  const dualOptions = baseData?.dualOptions ?? [];
  const uniqueNumbers = baseData?.allNumbers ?? [];

  const copyGroup = () => {
    if (baseData) {
      handleCopy(`${direct} ${dual}`, 'base-group');
    }
  };

  const copyAllUnique = () => {
    if (uniqueNumbers.length > 0) {
      handleCopy(uniqueNumbers.join(' '), 'base-all');
    }
  };

  return (
    <div className="space-y-4">
      {/* CUADRO PRINCIPAL: BASE DEL DÍA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-cyan-950/70 via-blue-950/40 to-zinc-950 border-2 border-cyan-500/80 shadow-xl shadow-cyan-950/50 ring-1 ring-blue-400/30 space-y-3 relative overflow-hidden transition-all duration-300">
        {/* Cinta tricolor en la parte superior */}
        <div className="relative -mt-1 mb-2">
          <TriFlagRibbon className="h-1.5 w-full" />
        </div>

        {/* Resplandor ambiental */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-25 bg-cyan-400" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-zinc-800/80 pb-2.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-md ring-1 ring-white/30 shrink-0">
              <Calendar size={18} className="text-white drop-shadow" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider">
                  Base del Día
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Base Hoy: {baseUsed}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-300/90 font-medium leading-tight mt-0.5">
                Analogía ZL usando el día de hoy ({baseUsed}) como base
              </p>
            </div>
          </div>

          <button
            id="btn-copy-base-dia"
            onClick={copyGroup}
            disabled={!baseData}
            className="self-end sm:self-auto px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-[10px] text-zinc-200 hover:text-white font-medium border border-zinc-700 hover:border-zinc-500 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
            title="Copiar los 2 números de Base del Día"
          >
            {copiedKey === 'base-group' ? (
              <Check size={11} className="text-cyan-400" />
            ) : (
              <Copy size={11} />
            )}
            <span>{copiedKey === 'base-group' ? '¡Copiados!' : 'Copiar Base'}</span>
          </button>
        </div>

        {/* 2 Tarjetas de resultado (Base Directa y Número Dual) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 relative z-10">
          {/* Tarjeta 1: Cifra Base */}
          <div
            id="card-base-directa"
            onClick={() => direct !== '--' && handleCopy(direct, 'base-direct')}
            className="bg-zinc-950/90 hover:bg-zinc-900 p-2.5 sm:p-3.5 rounded-xl border border-cyan-500/60 hover:border-cyan-400 shadow-md shadow-cyan-950/30 flex flex-col justify-between relative group cursor-pointer transition select-none"
            title={`Click para copiar ${direct}`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-white uppercase tracking-tight truncate">
                Base {baseUsed}
              </span>
              <span className="text-zinc-500 group-hover:text-white transition shrink-0 ml-0.5">
                {copiedKey === 'base-direct' ? (
                  <Check size={12} className="text-cyan-400" />
                ) : (
                  <Copy size={10} className="opacity-60 group-hover:opacity-100" />
                )}
              </span>
            </div>

            <div className="text-center py-1 sm:py-2">
              <span className="text-2xl sm:text-4xl font-black font-mono text-cyan-400 tracking-wider drop-shadow-sm">
                {direct}
              </span>
            </div>

            {directOptions.length > 0 && (
              <div className="flex flex-col items-center gap-1 pb-1.5">
                <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Opción
                </span>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {directOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(opt, `base-direct-opt-${opt}`);
                      }}
                      className="px-2 py-0.5 rounded-md bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-500/35 text-xs sm:text-sm font-mono font-bold text-cyan-200 transition"
                      title={`Click para copiar opción ${opt}`}
                    >
                      {copiedKey === `base-direct-opt-${opt}` ? '✓' : opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <span className="text-[9px] text-zinc-400 font-medium">
                Fórmula Directa
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Número Dual */}
          <div
            id="card-base-dual"
            onClick={() => dual !== '--' && handleCopy(dual, 'base-dual')}
            className="bg-zinc-950/90 hover:bg-zinc-900 p-2.5 sm:p-3.5 rounded-xl border border-blue-500/60 hover:border-blue-400 shadow-md shadow-blue-950/30 flex flex-col justify-between relative group cursor-pointer transition select-none"
            title={`Click para copiar ${dual}`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-white uppercase tracking-tight truncate">
                Número Dual
              </span>
              <span className="text-zinc-500 group-hover:text-white transition shrink-0 ml-0.5">
                {copiedKey === 'base-dual' ? (
                  <Check size={12} className="text-cyan-400" />
                ) : (
                  <Copy size={10} className="opacity-60 group-hover:opacity-100" />
                )}
              </span>
            </div>

            <div className="text-center py-1 sm:py-2">
              <span className="text-2xl sm:text-4xl font-black font-mono text-cyan-400 tracking-wider drop-shadow-sm">
                {dual}
              </span>
            </div>

            {dualOptions.length > 0 && (
              <div className="flex flex-col items-center gap-1 pb-1.5">
                <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Opción
                </span>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {dualOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(opt, `base-dual-opt-${opt}`);
                      }}
                      className="px-2 py-0.5 rounded-md bg-blue-950/70 hover:bg-blue-900/90 border border-blue-500/35 text-xs sm:text-sm font-mono font-bold text-blue-200 transition"
                      title={`Click para copiar opción ${opt}`}
                    >
                      {copiedKey === `base-dual-opt-${opt}` ? '✓' : opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <span className="text-[9px] text-zinc-400 font-medium">
                Equivalente Dual
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón rápido para copiar todos los números únicos */}
      <button
        id="btn-copy-base-all"
        onClick={copyAllUnique}
        disabled={uniqueNumbers.length === 0}
        className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-xs text-zinc-200 hover:text-white font-medium border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
        title={`Copiar todos los números de Base del Día (${uniqueNumbers.length})`}
      >
        {copiedKey === 'base-all' ? (
          <Check size={14} className="text-cyan-400" />
        ) : (
          <Sparkles size={14} className="text-cyan-400" />
        )}
        <span>
          {copiedKey === 'base-all'
            ? `¡${uniqueNumbers.length} Números Copiados!`
            : `Copiar todos los de Base del Día (${uniqueNumbers.length})`}
        </span>
      </button>

      {/* Indicador sutil de referencia regional */}
      <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-zinc-500">
        <ShieldCheck size={13} className="text-cyan-500/70" />
        <span>Válido para Loterías de Costa Rica, Nicaragua y Honduras</span>
      </div>
    </div>
  );
}
