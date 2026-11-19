/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Calendar, Clock, WifiOff, Check, Copy } from 'lucide-react';
import { FlagHonduras } from './FlagBadges';
import { LaDiariaDayResult, fetchLaDiariaHonduras } from '../utils';

const LOCAL_CACHE_KEY = 'zl_la_diaria_hn_cache_v1';
const AUTO_REFRESH_MS = 60_000;

function loadCachedDays(): LaDiariaDayResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCachedDays(days: LaDiariaDayResult[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(days));
  } catch {
    // Ignore storage quota errors
  }
}

export function LaDiariaHonduras() {
  const [days, setDays] = useState<LaDiariaDayResult[]>(() => loadCachedDays());
  const [loading, setLoading] = useState<boolean>(() => loadCachedDays().length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const loadData = useCallback(async (isManualOrBackground = false) => {
    if (!isMountedRef.current) return;
    if (isManualOrBackground) {
      setRefreshing(true);
    } else {
      setLoading((prev) => prev);
    }

    try {
      const data = await fetchLaDiariaHonduras();
      if (!isMountedRef.current) return;

      if (Array.isArray(data.days)) {
        setDays(data.days);
        saveCachedDays(data.days);
      }
      setLastUpdated(data.updatedAt || new Date().toISOString());
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'No se pudo conectar');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData(false);

    // Actualización automática cada 60 segundos
    const intervalId = setInterval(() => {
      loadData(true);
    }, AUTO_REFRESH_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  const handleCopyNumber = async (key: string, num: string) => {
    try {
      await navigator.clipboard.writeText(num);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1400);
    } catch {
      // Clipboard no disponible
    }
  };

  const formattedUpdatedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('es-HN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div id="la-diaria-hn-panel" className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/35 shrink-0">
            <FlagHonduras className="w-5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
              La Diaria · Honduras
            </h2>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span>Resultados de ayer y hoy</span>
              {formattedUpdatedTime && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span className="font-mono text-cyan-300/90">{formattedUpdatedTime}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <button
          id="btn-refresh-diaria-hn"
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 transition cursor-pointer disabled:opacity-60 shrink-0"
          title="Actualizar resultados ahora"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {error && days.length === 0 && (
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/60 text-xs text-red-200 flex items-center gap-2">
          <WifiOff size={15} className="shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {loading && days.length === 0 ? (
        <div className="space-y-3">
          {[0, 1].map((idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 animate-pulse space-y-3"
            >
              <div className="h-4 w-40 bg-zinc-800 rounded" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-20 bg-zinc-900 rounded-xl" />
                <div className="h-20 bg-zinc-900 rounded-xl" />
                <div className="h-20 bg-zinc-900 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <section
              key={day.date}
              className={`rounded-2xl border overflow-hidden ${
                day.isToday
                  ? 'border-cyan-500/45 bg-zinc-950/85 shadow-lg shadow-cyan-950/20'
                  : 'border-zinc-800/80 bg-zinc-950/65'
              }`}
            >
              <div className="px-3.5 py-2.5 bg-zinc-900/70 border-b border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar
                    size={14}
                    className={day.isToday ? 'text-cyan-400 shrink-0' : 'text-zinc-400 shrink-0'}
                  />
                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                    {day.label}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                    day.isToday
                      ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
                  }`}
                >
                  {day.isToday ? 'Hoy' : 'Ayer'}
                </span>
              </div>

              <div className="p-3 grid grid-cols-3 gap-2.5">
                {day.draws.map((draw) => {
                  const itemKey = `${day.date}-${draw.hour24}`;
                  const isCopied = copiedKey === itemKey;
                  const hasNumber = draw.number !== null && draw.number !== '';

                  return (
                    <button
                      key={itemKey}
                      type="button"
                      disabled={!hasNumber}
                      onClick={() => hasNumber && draw.number && handleCopyNumber(itemKey, draw.number)}
                      className={`group flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition ${
                        hasNumber
                          ? day.isToday
                            ? 'bg-zinc-900/90 hover:bg-zinc-900 border-cyan-500/35 hover:border-cyan-400/70 cursor-pointer active:scale-95'
                            : 'bg-zinc-900/75 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-600 cursor-pointer active:scale-95'
                          : 'bg-zinc-950/70 border-zinc-900 cursor-default opacity-75'
                      }`}
                      title={hasNumber ? `Copiar ${draw.number}` : 'Sorteo pendiente'}
                    >
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-semibold text-zinc-400">
                        <Clock size={10} className="text-zinc-500" />
                        <span>{draw.timeLabel}</span>
                      </span>

                      {hasNumber ? (
                        <span
                          className={`text-2xl sm:text-3xl font-mono font-black tracking-tight tabular-nums ${
                            day.isToday ? 'text-cyan-300' : 'text-white'
                          }`}
                        >
                          {draw.number}
                        </span>
                      ) : (
                        <span className="text-xl sm:text-2xl font-mono font-bold text-zinc-700 tracking-wider">
                          --
                        </span>
                      )}

                      {hasNumber && (
                        <span className="text-[9px] font-medium text-zinc-500 group-hover:text-zinc-300 flex items-center gap-1">
                          {isCopied ? (
                            <>
                              <Check size={9} className="text-emerald-400" />
                              <span className="text-emerald-400">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy size={9} />
                              <span>La Diaria</span>
                            </>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
