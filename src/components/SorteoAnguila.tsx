/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar,
  RefreshCw,
  WifiOff,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  AnguillaDayResult,
  fetchAnguillaResults,
} from '../utils';

const LOCAL_CACHE_KEY = 'zl_anguilla_days_cache_v25';

function getTopBottomCombinations(
  top?: string | number,
  bottom?: string,
  extraSum?: string
): string[] {
  const t = top !== undefined ? String(top).padStart(2, '0') : '';
  const b = bottom ? String(bottom).padStart(2, '0') : '';
  if (t.length < 2 || b.length < 2) return [];
  const [a, b1] = t;
  const [c, d] = b;

  // Un solo lado (sin duplicar el inverso)
  const raw = [`${a}${c}`, `${b1}${d}`, `${a}${d}`, `${b1}${c}`];
  const seenPairs = new Set<string>();
  const singleSide: string[] = [];

  for (const num of raw) {
    const rev = num.split('').reverse().join('');
    if (seenPairs.has(num) || seenPairs.has(rev)) continue;
    seenPairs.add(num);
    seenPairs.add(rev);
    singleSide.push(num);
  }

  // Cuando sale 96 o 69 (en el código principal, igual o combinaciones), agregar las vueltas 99 y 66
  const has96or69 =
    t === '96' ||
    t === '69' ||
    b === '96' ||
    b === '69' ||
    singleSide.includes('96') ||
    singleSide.includes('69');

  if (has96or69) {
    if (!singleSide.includes('99')) singleSide.push('99');
    if (!singleSide.includes('66')) singleSide.push('66');
  }

  // Cuando sale 27 o 72 (en el código principal, igual o combinaciones), agregar los dos pares 77 y 22
  const has27or72 =
    t === '27' ||
    t === '72' ||
    b === '27' ||
    b === '72' ||
    singleSide.includes('27') ||
    singleSide.includes('72');

  if (has27or72) {
    if (!singleSide.includes('77')) singleSide.push('77');
    if (!singleSide.includes('22')) singleSide.push('22');
  }

  // Cuando sale 83 o 38 (en el código principal, igual o combinaciones), agregar los dos pares 33 y 88
  const has83or38 =
    t === '83' ||
    t === '38' ||
    b === '83' ||
    b === '38' ||
    singleSide.includes('83') ||
    singleSide.includes('38');

  if (has83or38) {
    if (!singleSide.includes('33')) singleSide.push('33');
    if (!singleSide.includes('88')) singleSide.push('88');
  }

  // Agregar la suma directa de los 3 premios (con vuelta V) si aún no está incluida
  if (extraSum) {
    const sumPadded = String(extraSum).padStart(2, '0');
    const sumRev = sumPadded.split('').reverse().join('');
    if (sumPadded.length === 2 && !singleSide.includes(sumPadded) && !singleSide.includes(sumRev)) {
      singleSide.push(sumPadded);
    }
  }

  return singleSide;
}

function getAfternoonSlotCalculations(playSlot?: {
  result: string;
  equal: string;
  displayResult?: string;
  displayEqual?: string;
  sumOnly?: string;
}) {
  const codeResult = playSlot?.result;
  const codeEqual = playSlot?.equal;
  const shownResult = playSlot?.displayResult ?? codeResult;
  const shownEqual = playSlot?.displayEqual ?? codeEqual;
  const sumOnly = playSlot?.sumOnly;

  const combinations = getTopBottomCombinations(codeResult, codeEqual, sumOnly);

  if (playSlot?.displayResult || playSlot?.displayEqual) {
    const replacedCombinations = getTopBottomCombinations(shownResult, shownEqual);
    for (const rc of replacedCombinations) {
      const rev = rc.split('').reverse().join('');
      if (!combinations.includes(rc) && !combinations.includes(rev)) {
        combinations.push(rc);
      }
    }
  }

  const expandedCombinations = combinations.flatMap((combo) => {
    const rev = combo.split('').reverse().join('');
    return [combo, rev];
  });

  const extraReplacementMatches: string[] = [];
  if (playSlot?.displayResult && shownResult) {
    extraReplacementMatches.push(String(shownResult).padStart(2, '0').split('').reverse().join(''));
  }
  if (playSlot?.displayEqual && shownEqual) {
    extraReplacementMatches.push(String(shownEqual).padStart(2, '0').split('').reverse().join(''));
  }

  const afternoonWinSet = new Set(
    [shownResult, shownEqual, ...extraReplacementMatches, ...expandedCombinations]
      .filter((x): x is string => Boolean(x))
      .map((x) => String(x).padStart(2, '0'))
  );

  return {
    codeResult,
    codeEqual,
    shownResult,
    shownEqual,
    sumOnly,
    combinations,
    afternoonWinSet,
  };
}

function loadLocalDaysCache(): Record<string, AnguillaDayResult> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalDaysCache(days: AnguillaDayResult[]) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadLocalDaysCache();
    for (const day of days) {
      if (
        day.draws.length > 0 ||
        (day.morningNumbersToPlay && day.morningNumbersToPlay.length > 0) ||
        Boolean(day.morningStrongNumber) ||
        (day.afternoonNumbersToPlay && day.afternoonNumbersToPlay.length > 0)
      ) {
        current[day.date] = day;
      }
    }
    // Conservar los últimos 30 días en caché local
    const keys = Object.keys(current).sort().reverse().slice(0, 30);
    const trimmed: Record<string, AnguillaDayResult> = {};
    for (const k of keys) {
      trimmed[k] = current[k];
    }
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota errors
  }
}

export function SorteoAnguila() {
  const [daysList, setDaysList] = useState<AnguillaDayResult[]>(() => {
    const cached = loadLocalDaysCache();
    return Object.values(cached)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
  });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [daysCount, setDaysCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [expandedMorningResults, setExpandedMorningResults] = useState<Record<string, boolean>>({});
  const lastFetchAtRef = useRef<number>(0);

  const loadResults = useCallback(
    async (opts?: { dateFilter?: string; count?: number; silent?: boolean }) => {
      const targetDate = opts?.dateFilter !== undefined ? opts.dateFilter : selectedDate;
      const targetCount = opts?.count !== undefined ? opts.count : daysCount;

      if (!opts?.silent) {
        setIsLoading(true);
      }
      setErrorMsg(null);

      try {
        const res = await fetchAnguillaResults(
          targetDate
            ? { date: targetDate }
            : { days: targetCount }
        );
        lastFetchAtRef.current = Date.now();
        setIsOnline(true);
        setDaysList(res.days);
        saveLocalDaysCache(res.days);
        setLastUpdated(
          new Date(res.updatedAt).toLocaleTimeString('es-CR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Costa_Rica',
          })
        );
      } catch (err) {
        console.error('Error loading Anguilla results:', err);
        const cached = loadLocalDaysCache();
        if (targetDate && cached[targetDate]) {
          setDaysList([cached[targetDate]]);
        } else if (!targetDate && Object.keys(cached).length > 0) {
          setDaysList(
            Object.values(cached)
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, targetCount)
          );
        }
        setErrorMsg('Sin conexión a internet. Mostrando últimos datos guardados.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedDate, daysCount]
  );

  // Carga inicial y al cambiar fecha o cantidad de días
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Se mantiene sincronizado en línea cada 60 s, al volver el internet o al regresar a la app
  useEffect(() => {
    const refreshIfStale = () => {
      if (!navigator.onLine) return;
      if (Date.now() - lastFetchAtRef.current >= 15000) {
        loadResults({ silent: true });
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      loadResults({ silent: true });
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshIfStale();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', refreshIfStale);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      if (navigator.onLine) {
        loadResults({ silent: true });
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', refreshIfStale);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [loadResults]);

  const handleLoadMoreDays = () => {
    const nextCount = Math.min(daysCount + 3, 7);
    setIsLoadingMore(true);
    setDaysCount(nextCount);
  };

  return (
    <div className="space-y-4">
      {/* Encabezado limpio y ordenado */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
            Sorteo de la Anguila
          </h2>
          <p className="text-[11px] text-zinc-400">
            Números por día (1.º · 2.º · 3.º)
            {lastUpdated && isOnline ? ` · Act. ${lastUpdated}` : ''}
          </p>
        </div>

        <button
          id="btn-refresh-anguilla"
          onClick={() => loadResults()}
          disabled={isLoading}
          className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          title="Actualizar resultados ahora"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Filtro de fecha específico para ir a cualquier día */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Calendar
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            id="input-anguilla-date"
            type="date"
            value={selectedDate}
            min="2023-01-04"
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-zinc-950/90 text-xs text-zinc-200 pl-9 pr-3 py-2 rounded-xl border border-zinc-800 focus:border-cyan-500/50 focus:outline-none font-mono"
            title="Filtrar por un día específico"
          />
        </div>
        {selectedDate && (
          <button
            id="btn-clear-anguilla-date"
            onClick={() => setSelectedDate('')}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 border border-zinc-800 transition flex items-center gap-1 shrink-0 cursor-pointer"
            title="Volver a ver últimos días"
          >
            <X size={13} />
            <span>Recientes</span>
          </button>
        )}
      </div>

      {/* Aviso discreto si está sin internet */}
      {(!isOnline || errorMsg) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300">
          <WifiOff size={13} className="shrink-0" />
          <span>{errorMsg || 'Sin conexión a internet. Mostrando datos guardados.'}</span>
        </div>
      )}

      {/* Listado de resultados dividido por días */}
      {isLoading && daysList.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center gap-2.5 text-zinc-400">
          <RefreshCw size={20} className="animate-spin text-cyan-400" />
          <span className="text-xs">Cargando resultados reales de La Anguila...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {daysList.map((day) => {
            const morningDraws = day.draws.filter((d) => d.hour24 < 12);
            const afternoonDraws = day.draws.filter((d) => d.hour24 >= 12);
            const playMap = new Map<number, { timeLabel: string; numbers: string[] }>();
            for (const slot of day.morningNumbersToPlay || []) {
              playMap.set(slot.hour24, { timeLabel: slot.timeLabel, numbers: slot.numbers });
            }

            const afternoonPlayMap = new Map<
              number,
              {
                timeLabel: string;
                result: string;
                equal: string;
                displayResult?: string;
                displayEqual?: string;
                sumOnly?: string;
              }
            >();
            for (const slot of day.afternoonNumbersToPlay || []) {
              afternoonPlayMap.set(slot.hour24, {
                timeLabel: slot.timeLabel,
                result: slot.result,
                equal: slot.equal,
                displayResult: slot.displayResult,
                displayEqual: slot.displayEqual,
                sumOnly: slot.sumOnly,
              });
            }

            const strong = day.morningStrongNumber;
            let bingosCount = 0;

            for (const draw of morningDraws) {
              const playSlot = playMap.get(draw.hour24);
              const playNumbers =
                draw.numbersToPlay && draw.numbersToPlay.length > 0
                  ? draw.numbersToPlay
                  : playSlot?.numbers || [];
              const morningWinSet = new Set(
                [strong?.main, strong?.equal, ...playNumbers]
                  .filter((x): x is string => Boolean(x))
                  .map((x) => String(x).padStart(2, '0'))
              );
              const firstPadded = String(draw.first).padStart(2, '0');
              if (morningWinSet.has(firstPadded)) {
                bingosCount += 1;
              }
            }

            for (const draw of afternoonDraws) {
              const playSlot = afternoonPlayMap.get(draw.hour24);
              const { afternoonWinSet } = getAfternoonSlotCalculations(playSlot);
              const firstPadded = String(draw.first).padStart(2, '0');
              if (afternoonWinSet.has(firstPadded)) {
                bingosCount += 1;
              }
            }

            return (
            <section
              key={day.date}
              id={`anguilla-day-${day.date}`}
              className="rounded-2xl bg-zinc-950/85 border border-zinc-800/90 overflow-hidden"
            >
              {/* Cabecera del día */}
              <div className="px-3.5 py-2.5 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-white font-mono font-bold text-xs shrink-0">
                    Día {String(day.dayNumber).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                      {day.label}
                    </h3>
                  </div>
                  {day.isTomorrow && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                      Mañana
                    </span>
                  )}
                  {day.isToday && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                      Hoy
                    </span>
                  )}
                  {day.isYesterday && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                      Ayer
                    </span>
                  )}
                </div>

                <div
                  id={`anguilla-bingos-${day.date}`}
                  className={`px-2.5 py-1 rounded-lg border font-mono font-extrabold text-[11px] sm:text-xs shrink-0 flex items-center gap-1 tabular-nums ${
                    bingosCount > 0
                      ? 'bg-red-600/30 border-red-500/70 text-red-200 ring-1 ring-red-500/40 shadow-sm shadow-red-950/50'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
                  }`}
                  title="Conteo total de aciertos en rojo del día"
                >
                  <span>{bingosCount}</span>
                  <span>{bingosCount === 1 ? 'bingo' : 'bingos'}</span>
                </div>
              </div>

              {/* Bloques separados entre mañana (6AM-9AM CR) y tarde/noche (10AM-8PM CR) */}
              {(day.draws.length > 0 ||
                (day.morningNumbersToPlay && day.morningNumbersToPlay.length > 0) ||
                Boolean(day.morningStrongNumber) ||
                (day.afternoonNumbersToPlay && day.afternoonNumbersToPlay.length > 0)) ? (() => {
                const morningHours = Array.from(
                  new Set([
                    ...morningDraws.map((d) => d.hour24),
                    ...Array.from(playMap.keys()),
                  ])
                ).sort((a, b) => a - b);

                const afternoonHours = Array.from(
                  new Set([
                    ...afternoonDraws.map((d) => d.hour24),
                    ...Array.from(afternoonPlayMap.keys()),
                  ])
                ).sort((a, b) => a - b);

                const renderMorningBlock = () => {
                  const showResults = Boolean(expandedMorningResults[day.date]);
                  const strong = day.morningStrongNumber;

                  return (
                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 overflow-hidden divide-y divide-zinc-800/80">
                      <div className="px-3 py-2 bg-zinc-900/60 flex items-center justify-between gap-2">
                        <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-zinc-300">
                          6:00 AM – 9:00 AM · Hora Costa Rica
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMorningResults((prev) => ({
                              ...prev,
                              [day.date]: !prev[day.date],
                            }))
                          }
                          aria-expanded={showResults}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border transition cursor-pointer ${
                            showResults
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-zinc-950/70 border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-600'
                          }`}
                        >
                          <span>Resultado</span>
                          <ChevronDown
                            size={12}
                            className={`transition-transform duration-150 ${showResults ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </div>

                      {strong && (() => {
                        const morningFirstSet = new Set(
                          morningDraws.map((d) => String(d.first).padStart(2, '0'))
                        );
                        const isStrongMainHit = morningFirstSet.has(String(strong.main).padStart(2, '0'));
                        const isStrongEqualHit = morningFirstSet.has(String(strong.equal).padStart(2, '0'));

                        return (
                        <div className="px-3 py-2.5 bg-gradient-to-r from-emerald-950/45 via-zinc-950/85 to-cyan-950/35 flex items-center justify-between gap-3">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                              Número fuerte
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              Para los 4 sorteos de la mañana
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono shrink-0 tabular-nums">
                            <span
                              className={`px-2.5 py-1 rounded-lg border font-black text-base sm:text-lg tracking-wider shadow-sm ${
                                isStrongMainHit
                                  ? 'bg-red-600/35 border-red-500 text-red-200 ring-1 ring-red-500/60 shadow-red-950/60'
                                  : 'bg-emerald-950/85 border-emerald-500/60 text-emerald-300'
                              }`}
                              title={isStrongMainHit ? '¡Acierto en primero!' : 'Número fuerte de la mañana'}
                            >
                              {strong.main}
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-lg border font-black text-base sm:text-lg tracking-wider shadow-sm ${
                                isStrongEqualHit
                                  ? 'bg-red-600/35 border-red-500 text-red-200 ring-1 ring-red-500/60 shadow-red-950/60'
                                  : 'bg-emerald-950/85 border-emerald-500/60 text-emerald-300'
                              }`}
                              title={isStrongEqualHit ? '¡Acierto en primero!' : 'Igual del número fuerte'}
                            >
                              {strong.equal}
                            </span>
                          </div>
                        </div>
                        );
                      })()}

                      <div className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-950/60 flex items-center justify-between">
                        <span>Hora · Sorteo</span>
                        <span className="text-amber-300/90">Jugar extras{showResults ? ' · Resultado' : ''}</span>
                      </div>

                      {morningHours.map((hour24) => {
                        const draw = morningDraws.find((d) => d.hour24 === hour24);
                        const playSlot = playMap.get(hour24);
                        const playNumbers =
                          draw?.numbersToPlay && draw.numbersToPlay.length > 0
                            ? draw.numbersToPlay
                            : playSlot?.numbers || [];
                        const timeLabel = draw?.timeLabel || playSlot?.timeLabel || `${hour24 - 2}:00 AM`;
                        const strongBaseSet = new Set(
                          [strong?.main, strong?.equal]
                            .filter((x): x is string => Boolean(x))
                            .map((x) => String(x).padStart(2, '0'))
                        );
                        const morningWinSet = new Set(
                          [
                            strong?.main,
                            strong?.equal,
                            ...playNumbers,
                          ]
                            .filter((x): x is string => Boolean(x))
                            .map((x) => String(x).padStart(2, '0'))
                        );
                        const firstPadded = draw ? String(draw.first).padStart(2, '0') : '';
                        const isFirstWin = Boolean(draw && morningWinSet.has(firstPadded));

                        return (
                          <div
                            key={`${day.date}-${hour24}`}
                            className="flex flex-col gap-2.5 px-3 py-3"
                          >
                            {/* Fila 1: Hora a la izquierda y Números del día a la derecha */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono font-semibold text-zinc-400 whitespace-nowrap">
                                {timeLabel}
                              </span>

                              {draw ? (
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span
                                    className={`px-2 py-1 rounded-md font-bold text-xs sm:text-sm tracking-tight ${
                                      isFirstWin
                                        ? 'bg-red-600/35 border border-red-500 text-red-200 ring-1 ring-red-500/60 shadow-sm shadow-red-950/60'
                                        : 'bg-zinc-900 border border-zinc-700/80 text-white'
                                    }`}
                                    title={isFirstWin ? '¡Gane en primero!' : undefined}
                                  >
                                    {draw.first}
                                  </span>
                                  <span className="text-zinc-600 text-xs">-</span>
                                  <span className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold text-xs sm:text-sm tracking-tight">
                                    {draw.second}
                                  </span>
                                  <span className="text-zinc-600 text-xs">-</span>
                                  <span className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs sm:text-sm tracking-tight">
                                    {draw.third}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 font-mono text-zinc-600 text-xs">
                                  <span>--</span>
                                  <span>-</span>
                                  <span>--</span>
                                  <span>-</span>
                                  <span>--</span>
                                </div>
                              )}
                            </div>

                            {/* Fila 2: Cuadrito de Jugar extras (y Resultado solo cuando la pestaña está expandida) */}
                            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-900/90">
                              <div className="rounded-lg border border-amber-500/45 bg-amber-950/25 px-2.5 py-1.5 flex items-center justify-between gap-2">
                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-300 shrink-0">
                                  Jugar extras
                                </span>
                                <div className="flex flex-wrap items-center justify-end gap-1.5 font-mono">
                                  {playNumbers.length > 0 ? (
                                    playNumbers.map((num, idx) => {
                                      const paddedNum = String(num).padStart(2, '0');
                                      const isBaseMatch = strongBaseSet.has(paddedNum);
                                      return (
                                        <span
                                          key={`${day.date}-${hour24}-play-${idx}`}
                                          className={`px-2 py-0.5 rounded-md font-extrabold text-xs sm:text-sm tracking-tight ${
                                            isBaseMatch
                                              ? 'bg-blue-600/35 border border-blue-400 text-blue-200 ring-1 ring-blue-400/50 shadow-sm shadow-blue-950/60'
                                              : 'bg-amber-950/80 border border-amber-400/60 text-amber-200'
                                          }`}
                                          title={
                                            isBaseMatch
                                              ? 'Número base de 6 a 9 · Jugar más fuerte'
                                              : undefined
                                          }
                                        >
                                          {num}
                                        </span>
                                      );
                                    })
                                  ) : hour24 === 8 ? (
                                    <span className="text-[11px] font-semibold text-emerald-300/85">
                                      Número fuerte
                                    </span>
                                  ) : (
                                    <span className="text-zinc-600 text-xs">--</span>
                                  )}
                                </div>
                              </div>

                              {showResults && (
                                <div className="flex items-center justify-between gap-2 px-0.5">
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                                    Resultado
                                  </span>
                                  {draw && draw.formulaResult !== undefined ? (
                                    <div className="flex flex-wrap items-center justify-end gap-1.5 font-mono shrink-0">
                                      <span
                                        className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs sm:text-sm tracking-tight"
                                        title="Resultado"
                                      >
                                        {draw.formulaResult}
                                      </span>
                                      {draw.formulaEqual && (
                                        <span
                                          className="px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs sm:text-sm tracking-tight"
                                          title="Igual"
                                        >
                                          {draw.formulaEqual}
                                        </span>
                                      )}
                                      {draw.formulaMix && (
                                        <span
                                          className="px-2 py-0.5 rounded-md bg-violet-950/70 border border-violet-500/40 text-violet-300 font-extrabold text-xs sm:text-sm tracking-tight"
                                          title="Mezcla de pares"
                                        >
                                          {draw.formulaMix}
                                        </span>
                                      )}
                                      {draw.formulaExtra && (
                                        <span
                                          className="px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-500/40 text-amber-300 font-extrabold text-xs sm:text-sm tracking-tight"
                                          title="Número extra"
                                        >
                                          {draw.formulaExtra}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-right text-zinc-600 font-mono text-xs">--</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                };

                const renderAfternoonBlock = () => {
                  const morningBaseSet = new Set(
                    [day.morningStrongNumber?.main, day.morningStrongNumber?.equal]
                      .filter((x): x is string => Boolean(x))
                      .map((x) => String(x).padStart(2, '0'))
                  );

                  return (
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 overflow-hidden divide-y divide-zinc-800/80">
                    <div className="px-3 py-2 bg-zinc-900/60 flex items-center justify-between">
                      <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-zinc-300">
                        10:00 AM – 8:00 PM · Hora Costa Rica
                      </span>
                    </div>
                    <div className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-950/60 flex items-center justify-between">
                      <span>Hora · Números</span>
                      <span>Para jugar · Combinaciones</span>
                    </div>

                    {afternoonHours.map((hour24) => {
                      const draw = afternoonDraws.find((d) => d.hour24 === hour24);
                      const playSlot = afternoonPlayMap.get(hour24);
                      const crHour = hour24 - 2;
                      const fallbackLabel =
                        crHour === 12
                          ? '12:00 PM'
                          : crHour < 12
                          ? `${crHour}:00 AM`
                          : `${crHour - 12}:00 PM`;
                      const timeLabel = draw?.timeLabel || playSlot?.timeLabel || fallbackLabel;

                      const {
                        codeResult,
                        codeEqual,
                        shownResult,
                        shownEqual,
                        sumOnly,
                        combinations,
                        afternoonWinSet,
                      } = getAfternoonSlotCalculations(playSlot);
                      const firstPadded = draw ? String(draw.first).padStart(2, '0') : '';
                      const isFirstWin = Boolean(draw && afternoonWinSet.has(firstPadded));
                      const isCodeResultBase = Boolean(
                        shownResult && morningBaseSet.has(String(shownResult).padStart(2, '0'))
                      );
                      const isCodeEqualBase = Boolean(
                        shownEqual && morningBaseSet.has(String(shownEqual).padStart(2, '0'))
                      );

                      return (
                        <div
                          key={`${day.date}-${hour24}`}
                          className="flex flex-col gap-2.5 px-3 py-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-semibold text-zinc-400 whitespace-nowrap">
                              {timeLabel}
                            </span>

                            {draw ? (
                              <div className="flex items-center gap-1.5 font-mono">
                                <span
                                  className={`px-2 py-1 rounded-md font-bold text-sm sm:text-base tracking-tight ${
                                    isFirstWin
                                      ? 'bg-red-600/35 border border-red-500 text-red-200 ring-1 ring-red-500/60 shadow-sm shadow-red-950/60'
                                      : 'bg-zinc-900 border border-zinc-700/80 text-white'
                                  }`}
                                  title={isFirstWin ? '¡Gane en primero!' : undefined}
                                >
                                  {draw.first}
                                </span>
                                <span className="text-zinc-600 text-xs">-</span>
                                <span className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold text-sm sm:text-base tracking-tight">
                                  {draw.second}
                                </span>
                                <span className="text-zinc-600 text-xs">-</span>
                                <span className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-sm sm:text-base tracking-tight">
                                  {draw.third}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 font-mono text-zinc-600 text-xs">
                                <span>--</span>
                                <span>-</span>
                                <span>--</span>
                                <span>-</span>
                                <span>--</span>
                              </div>
                            )}
                          </div>

                          {shownResult !== undefined && (
                            <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-zinc-900/90 font-mono">
                              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <span className="text-zinc-500 text-sm sm:text-base font-bold">=</span>
                                <div className="flex flex-col items-center gap-1.5 tabular-nums">
                                  {(() => {
                                    const shownResPadded = String(shownResult).padStart(2, '0');
                                    const shownResRev = shownResPadded.split('').reverse().join('');
                                    const isCodeResultHit = Boolean(
                                      draw &&
                                        (firstPadded === shownResPadded ||
                                          (Boolean(playSlot?.displayResult) && firstPadded === shownResRev))
                                    );
                                    return (
                                  <span
                                    className={`w-[3.6rem] sm:w-[4rem] inline-flex items-center justify-center gap-2 px-2 py-1 rounded-lg border font-extrabold text-base sm:text-lg ${
                                      isCodeResultHit
                                        ? 'bg-red-600/35 border-red-500 text-red-200 ring-1 ring-red-500/60 shadow-sm shadow-red-950/60'
                                        : isCodeResultBase
                                        ? 'bg-blue-600/35 border-blue-400 text-blue-100 ring-1 ring-blue-400/60 shadow-sm shadow-blue-950/60'
                                        : 'bg-emerald-950/75 border-emerald-500/45 text-emerald-300'
                                    }`}
                                    title={
                                      isCodeResultHit
                                        ? '¡Acierto en primero!'
                                        : isCodeResultBase
                                        ? 'Número fuerte de 6 a 9 · Dar seguimiento'
                                        : playSlot?.displayResult
                                        ? `Reemplaza a ${codeResult} repetido (100 - ${sumOnly || '00'} = ${shownResult})`
                                        : 'Código principal para jugar'
                                    }
                                  >
                                    {shownResPadded.split('').map((digit, idx) => (
                                      <span key={idx}>{digit}</span>
                                    ))}
                                  </span>
                                    );
                                  })()}
                                  {shownEqual && (() => {
                                    const shownEqPadded = String(shownEqual).padStart(2, '0');
                                    const shownEqRev = shownEqPadded.split('').reverse().join('');
                                    const isCodeEqualHit = Boolean(
                                      draw &&
                                        (firstPadded === shownEqPadded ||
                                          (Boolean(playSlot?.displayEqual) && firstPadded === shownEqRev))
                                    );
                                    return (
                                    <span
                                      className={`w-[3.6rem] sm:w-[4rem] inline-flex items-center justify-center gap-2 px-2 py-1 rounded-lg border font-extrabold text-base sm:text-lg ${
                                        isCodeEqualHit
                                          ? 'bg-red-600/35 border-red-500 text-red-200 ring-1 ring-red-500/60 shadow-sm shadow-red-950/60'
                                          : isCodeEqualBase
                                          ? 'bg-blue-600/35 border-blue-400 text-blue-100 ring-1 ring-blue-400/60 shadow-sm shadow-blue-950/60'
                                          : 'bg-cyan-950/75 border-cyan-500/45 text-cyan-300'
                                      }`}
                                      title={
                                        isCodeEqualHit
                                          ? '¡Acierto en primero!'
                                          : isCodeEqualBase
                                          ? 'Número fuerte de 6 a 9 · Dar seguimiento'
                                          : playSlot?.displayEqual
                                          ? `Reemplaza a ${codeEqual} repetido (100 - ${sumOnly || '00'} = ${shownEqual})`
                                          : 'Igual'
                                      }
                                    >
                                      {shownEqPadded.split('').map((digit, idx) => (
                                        <span key={idx}>{digit}</span>
                                      ))}
                                    </span>
                                    );
                                  })()}
                                </div>
                              </div>

                              {combinations.length > 0 && (
                                <div
                                  className="w-[10.75rem] sm:w-[11.75rem] shrink-0 rounded-xl bg-sky-950/45 border border-sky-500/45 p-1.5 sm:p-2 grid grid-cols-3 gap-1.5 tabular-nums shadow-inner shadow-sky-950/30"
                                  title="Combinaciones posibles para jugar (con vuelta)"
                                >
                                  {combinations.map((combo) => {
                                    const comboPadded = String(combo).padStart(2, '0');
                                    const comboRev = comboPadded.split('').reverse().join('');
                                    const isComboHit = Boolean(
                                      draw && (firstPadded === comboPadded || firstPadded === comboRev)
                                    );
                                    const isComboBase =
                                      morningBaseSet.has(comboPadded) || morningBaseSet.has(comboRev);
                                    return (
                                      <span
                                        key={combo}
                                        className={`w-full text-center px-1 py-1 rounded-md border font-bold text-xs sm:text-sm ${
                                          isComboHit
                                            ? 'bg-red-600/40 border-red-500 text-red-100 ring-1 ring-red-500/60 shadow-sm shadow-red-950/60'
                                            : isComboBase
                                            ? 'bg-blue-500/45 border-blue-300 text-white ring-1 ring-blue-300/70 shadow-sm shadow-blue-950/60'
                                            : 'bg-sky-900/55 border-sky-500/40 text-sky-100'
                                        }`}
                                        title={
                                          isComboHit
                                            ? '¡Acierto en primero!'
                                            : isComboBase
                                            ? 'Número fuerte de 6 a 9 · Dar seguimiento'
                                            : undefined
                                        }
                                      >
                                        {combo}v
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  );
                };

                return (
                  <div className="p-2.5 sm:p-3 space-y-4">
                    {morningHours.length > 0 && renderMorningBlock()}
                    {afternoonHours.length > 0 && renderAfternoonBlock()}
                  </div>
                );
              })() : (
                <div className="px-4 py-5 text-center text-xs text-zinc-500">
                  No hay sorteos registrados para esta fecha todavía.
                </div>
              )}
            </section>
            );
          })}
        </div>
      )}

      {/* Cargar días anteriores cuando no hay filtro único */}
      {!selectedDate && daysCount < 7 && (
        <button
          id="btn-load-more-anguilla"
          onClick={handleLoadMoreDays}
          disabled={isLoadingMore || isLoading}
          className="w-full py-2.5 px-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 text-xs text-zinc-300 hover:text-white font-medium border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <ChevronDown size={14} />
          <span>{isLoadingMore ? 'Cargando días anteriores...' : 'Ver más días anteriores'}</span>
        </button>
      )}
    </div>
  );
}
