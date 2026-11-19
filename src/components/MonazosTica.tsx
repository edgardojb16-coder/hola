/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Calendar, Clock, WifiOff, Check, Copy, ChevronDown, X } from 'lucide-react';
import { FlagCostaRica } from './FlagBadges';
import { MonazosDayResult, fetchMonazosTica } from '../utils';

const LOCAL_CACHE_KEY = 'zl_monazos_tica_cache_v1';
const AUTO_REFRESH_MS = 60_000;

function loadLocalDaysCache(): Record<string, MonazosDayResult> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalDaysCache(days: MonazosDayResult[]) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadLocalDaysCache();
    for (const day of days) {
      if (day.draws.some((d) => d.digits !== null)) {
        current[day.date] = day;
      }
    }
    const keys = Object.keys(current).sort().reverse().slice(0, 30);
    const trimmed: Record<string, MonazosDayResult> = {};
    for (const k of keys) {
      trimmed[k] = current[k];
    }
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota errors
  }
}

export function MonazosTica() {
  const [daysList, setDaysList] = useState<MonazosDayResult[]>(() => {
    const cached = loadLocalDaysCache();
    return Object.values(cached)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4);
  });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [daysCount, setDaysCount] = useState<number>(4);
  const [isLoading, setIsLoading] = useState<boolean>(() => Object.keys(loadLocalDaysCache()).length === 0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const lastFetchAtRef = useRef<number>(0);

  const loadResults = useCallback(
    async (opts?: { dateFilter?: string; count?: number; silent?: boolean }) => {
      const targetDate = opts?.dateFilter !== undefined ? opts.dateFilter : selectedDate;
      const targetCount = opts?.count !== undefined ? opts.count : daysCount;

      if (opts?.silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMsg(null);

      try {
        const res = await fetchMonazosTica(
          targetDate ? { date: targetDate } : { days: targetCount }
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
        console.error('Error loading Monazos Tica:', err);
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
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [selectedDate, daysCount]
  );

  useEffect(() => {
    loadResults();
  }, [loadResults]);

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
    const handleOffline = () => setIsOnline(false);
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
    }, AUTO_REFRESH_MS);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', refreshIfStale);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [loadResults]);

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1400);
    } catch {
      // Clipboard not available
    }
  };

  const handleLoadMoreDays = () => {
    const nextCount = Math.min(daysCount + 3, 7);
    setIsLoadingMore(true);
    setDaysCount(nextCount);
  };

  return (
    <div id="monazos-tica-panel" className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-pink-950/55 border border-pink-500/35 shrink-0">
            <FlagCostaRica className="w-5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
              Monazos Tica
            </h2>
            <p className="text-[11px] text-zinc-400 truncate">
              3 Monazos JPS · Costa Rica
              {lastUpdated && isOnline ? ` · Act. ${lastUpdated}` : ''}
            </p>
          </div>
        </div>

        <button
          id="btn-refresh-monazos"
          type="button"
          onClick={() => loadResults({ silent: true })}
          disabled={isLoading || isRefreshing}
          className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          title="Actualizar resultados ahora"
        >
          <RefreshCw
            size={13}
            className={isLoading || isRefreshing ? 'animate-spin text-pink-400' : 'text-pink-400'}
          />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Filtro de fecha */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Calendar
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            id="input-monazos-date"
            type="date"
            value={selectedDate}
            min="2023-01-01"
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-zinc-950/90 text-xs text-zinc-200 pl-9 pr-3 py-2 rounded-xl border border-zinc-800 focus:border-pink-500/50 focus:outline-none font-mono"
            title="Filtrar por una fecha específica"
          />
        </div>
        {selectedDate && (
          <button
            id="btn-clear-monazos-date"
            type="button"
            onClick={() => setSelectedDate('')}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 border border-zinc-800 transition flex items-center gap-1 shrink-0 cursor-pointer"
            title="Volver a ver últimos días"
          >
            <X size={13} />
            <span>Recientes</span>
          </button>
        )}
      </div>

      {(!isOnline || errorMsg) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300">
          <WifiOff size={13} className="shrink-0" />
          <span>{errorMsg || 'Sin conexión a internet. Mostrando datos guardados.'}</span>
        </div>
      )}

      {isLoading && daysList.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center gap-2.5 text-zinc-400">
          <RefreshCw size={20} className="animate-spin text-pink-400" />
          <span className="text-xs">Cargando resultados de 3 Monazos Costa Rica...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {daysList.map((day) => (
            <section
              key={day.date}
              id={`monazos-day-${day.date}`}
              className={`rounded-2xl border overflow-hidden ${
                day.isToday
                  ? 'border-pink-500/45 bg-zinc-950/90 shadow-lg shadow-pink-950/20'
                  : 'border-zinc-800/90 bg-zinc-950/80'
              }`}
            >
              <div className="px-3.5 py-2.5 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar
                    size={14}
                    className={day.isToday ? 'text-pink-400 shrink-0' : 'text-zinc-400 shrink-0'}
                  />
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                    {day.label}
                  </h3>
                </div>
                {day.isToday && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-pink-500/20 border border-pink-400/50 text-pink-200 shrink-0">
                    Hoy
                  </span>
                )}
                {day.isYesterday && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-300 shrink-0">
                    Ayer
                  </span>
                )}
              </div>

              <div className="divide-y divide-zinc-800/70">
                {day.draws.map((draw) => {
                  const itemKey = `${day.date}-${draw.slotKey}`;
                  const isCopied = copiedKey === itemKey;
                  const hasDigits = Boolean(draw.digits && draw.number3);

                  return (
                    <button
                      key={itemKey}
                      type="button"
                      disabled={!hasDigits}
                      onClick={() => hasDigits && draw.number3 && handleCopy(itemKey, draw.number3)}
                      className={`w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left transition ${
                        hasDigits
                          ? 'hover:bg-zinc-900/60 cursor-pointer active:scale-[0.99]'
                          : 'opacity-70 cursor-default'
                      }`}
                      title={hasDigits ? `Copiar ${draw.number3}` : 'Sorteo pendiente'}
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-zinc-100">
                            {draw.slotName}
                          </span>
                          {draw.sorteoNumber && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                              #{draw.sorteoNumber}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 mt-0.5">
                          <Clock size={10} className="text-zinc-500" />
                          <span>{draw.timeLabel} CR</span>
                        </span>
                      </div>

                      {hasDigits && draw.digits ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1.5 font-mono tabular-nums">
                            {draw.digits.map((digit, idx) => (
                              <span
                                key={idx}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center text-lg sm:text-xl font-black shadow-sm ${
                                  day.isToday
                                    ? 'bg-pink-950/60 border-pink-500/60 text-pink-100'
                                    : 'bg-zinc-900 border-zinc-700/80 text-white'
                                }`}
                              >
                                {digit}
                              </span>
                            ))}
                          </div>
                          <span className="text-zinc-500 w-4 flex justify-center">
                            {isCopied ? (
                              <Check size={13} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-mono text-zinc-600 text-sm pr-6">
                          <span>-</span>
                          <span>·</span>
                          <span>-</span>
                          <span>·</span>
                          <span>-</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {!selectedDate && daysCount < 7 && (
        <button
          id="btn-load-more-monazos"
          type="button"
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
