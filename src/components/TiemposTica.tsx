/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Calendar,
  Clock,
  WifiOff,
  Check,
  Copy,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { FlagCostaRica } from './FlagBadges';
import { TiemposDayResult, fetchTiemposTica, verifyMonasusKey } from '../utils';

interface TiemposTicaProps {
  unlockedKey: string | null;
  onUnlock: (key: string) => void;
  onLock: () => void;
}

const DEFAULT_DAYS = 6;
const MAX_DAYS = 15;
const LOCAL_CACHE_KEY = 'zl_tiempos_tica_days_cache_v5';
const AUTO_REFRESH_MS = 30_000;

function loadRecentDaysCache(): TiemposDayResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TiemposDayResult[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((d) => d && typeof d.date === 'string')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, MAX_DAYS);
  } catch {
    return [];
  }
}

function saveRecentDaysCache(days: TiemposDayResult[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(days.slice(0, MAX_DAYS)));
  } catch {
    // Ignore storage quota errors
  }
}

export function TiemposTica({
  unlockedKey,
  onUnlock,
  onLock,
}: TiemposTicaProps) {
  const [inputKey, setInputKey] = useState('');
  const [showInputKey, setShowInputKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockErrorMsg, setLockErrorMsg] = useState<string | null>(null);

  const [daysCount, setDaysCount] = useState<number>(DEFAULT_DAYS);
  const [daysList, setDaysList] = useState<TiemposDayResult[]>(() =>
    loadRecentDaysCache().slice(0, DEFAULT_DAYS)
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => loadRecentDaysCache().length === 0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const lastFetchAtRef = useRef<number>(0);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setLockErrorMsg('Ingresa la clave privada para entrar a Tiempos Tica.');
      return;
    }

    setIsVerifying(true);
    setLockErrorMsg(null);
    try {
      const res = await verifyMonasusKey(trimmed);
      if (res.valid) {
        setInputKey('');
        onUnlock(trimmed);
      } else {
        setLockErrorMsg(res.error || 'Clave incorrecta. Acceso restringido al propietario.');
      }
    } catch {
      setLockErrorMsg('No se pudo verificar la clave con el servidor.');
    } finally {
      setIsVerifying(false);
    }
  };

  const loadResults = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!unlockedKey) return;
      if (opts?.silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMsg(null);

      try {
        const res = await fetchTiemposTica({ days: daysCount, monasusKey: unlockedKey });
        lastFetchAtRef.current = Date.now();
        setIsOnline(true);
        const recentDays = res.days.slice(0, daysCount);
        setDaysList(recentDays);
        saveRecentDaysCache(recentDays);
      } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED_TIEMPOS') {
          onLock();
          return;
        }
        console.error('Error loading Tiempos Tica:', err);
        const cached = loadRecentDaysCache().slice(0, daysCount);
        if (cached.length > 0) {
          setDaysList(cached);
        }
        setErrorMsg('Sin conexión a internet. Mostrando últimos datos guardados.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [unlockedKey, daysCount, onLock]
  );

  useEffect(() => {
    if (!unlockedKey) return;
    loadResults();
  }, [unlockedKey, loadResults]);

  useEffect(() => {
    if (!unlockedKey) return;

    const refreshIfStale = () => {
      if (!navigator.onLine) return;
      if (Date.now() - lastFetchAtRef.current >= 10000) {
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
  }, [unlockedKey, loadResults]);

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

  if (!unlockedKey) {
    return (
      <div id="tiempos-lock-gate" className="py-4 space-y-5">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-950/60 border border-blue-500/45 flex items-center justify-center shadow-lg shadow-blue-950/40">
            <Lock size={28} className="text-blue-300" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-950/80 border border-blue-500/40 text-blue-300">
              <KeyRound size={11} />
              <span>Acceso Privado · Solo Propietario</span>
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight pt-1 flex items-center justify-center gap-2">
              <FlagCostaRica className="w-5 h-3.5" />
              <span>Tiempos Tica</span>
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Esta pestaña está protegida con la misma clave privada de acceso.
            </p>
          </div>
        </div>

        <form onSubmit={handleUnlockSubmit} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label
              htmlFor="input-tiempos-key"
              className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5 px-0.5"
            >
              <KeyRound size={13} className="text-blue-400" />
              <span>Clave de acceso</span>
            </label>
            <div className="relative">
              <input
                id="input-tiempos-key"
                type={showInputKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  if (lockErrorMsg) setLockErrorMsg(null);
                }}
                placeholder="Ingresa la clave privada..."
                autoComplete="off"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowInputKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
                title={showInputKey ? 'Ocultar clave' : 'Mostrar clave'}
              >
                {showInputKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {lockErrorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/70 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{lockErrorMsg}</span>
            </div>
          )}

          <button
            id="btn-unlock-tiempos"
            type="submit"
            disabled={isVerifying}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isVerifying ? 'Verificando...' : 'Entrar a Tiempos Tica'}</span>
            <ArrowRight size={15} />
          </button>
        </form>
      </div>
    );
  }

  const get69Variants = (numStr: string): string[] => {
    const clean = String(numStr || '').trim();
    if (!clean) return [];
    const set = new Set<string>([clean]);
    if (/[69]/.test(clean)) {
      set.add(clean.replace(/[69]/g, (ch) => (ch === '6' ? '9' : '6')));
      if (clean.length === 2) {
        if (clean[0] === '6' || clean[0] === '9') {
          set.add(`${clean[0] === '6' ? '9' : '6'}${clean[1]}`);
        }
        if (clean[1] === '6' || clean[1] === '9') {
          set.add(`${clean[0]}${clean[1] === '6' ? '9' : '6'}`);
        }
      }
    }
    return Array.from(set);
  };

  const getVueltaEquivalents = (numStr: string): string[] => {
    const clean = String(numStr || '').trim();
    if (!clean) return [];
    const reversed = clean.length === 2 ? `${clean[1]}${clean[0]}` : clean;
    const set = new Set<string>([
      ...get69Variants(clean),
      ...get69Variants(reversed),
    ]);
    return Array.from(set);
  };

  const getDayBingosCount = (day: TiemposDayResult): number => {
    let count = 0;
    for (const draw of day.draws) {
      const allProbs = [
        ...(draw.probables || []),
        ...(draw.hondurasProbables || []),
      ];
      const expandedProbs = new Set(allProbs.flatMap((p) => getVueltaEquivalents(p)));
      const hitNum = Boolean(draw.number2 && expandedProbs.has(draw.number2));
      const hitMega = Boolean(draw.megaNumero && expandedProbs.has(draw.megaNumero));
      if (hitNum) count += 1;
      if (hitMega) count += 1;
    }
    return count;
  };

  const totalBingosCount = daysList.reduce((acc, day) => acc + getDayBingosCount(day), 0);

  const handleLoadMoreDays = () => {
    const nextCount = Math.min(daysCount + 5, MAX_DAYS);
    setIsLoadingMore(true);
    setDaysCount(nextCount);
  };

  return (
    <div id="tiempos-tica-panel" className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-500/40 shrink-0">
            <FlagCostaRica className="w-5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
              Tiempos Tica
            </h2>
            <div
              id="tiempos-total-bingos"
              className={`px-2 py-0.5 rounded-lg border font-mono font-extrabold text-[11px] shrink-0 flex items-center gap-1 tabular-nums ${
                totalBingosCount > 0
                  ? 'bg-red-600/30 border-red-500/70 text-red-200 ring-1 ring-red-500/40 shadow-sm shadow-red-950/50'
                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
              }`}
              title="Total de bingos (incluye Número y Mega Reventado)"
            >
              <span>{totalBingosCount}</span>
              <span>{totalBingosCount === 1 ? 'bingo' : 'bingos'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-refresh-tiempos"
            type="button"
            onClick={() => loadResults({ silent: true })}
            disabled={isLoading || isRefreshing}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Actualizar resultados ahora"
          >
            <RefreshCw
              size={13}
              className={isLoading || isRefreshing ? 'animate-spin text-blue-400' : 'text-blue-400'}
            />
            <span>Actualizar</span>
          </button>

          <button
            id="btn-lock-tiempos"
            type="button"
            onClick={onLock}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
            title="Bloquear acceso"
          >
            <Lock size={13} />
          </button>
        </div>
      </div>

      {(!isOnline || errorMsg) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300">
          <WifiOff size={13} className="shrink-0" />
          <span>{errorMsg || 'Sin conexión a internet. Mostrando datos guardados.'}</span>
        </div>
      )}

      {isLoading && daysList.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center gap-2.5 text-zinc-400">
          <RefreshCw size={20} className="animate-spin text-blue-400" />
          <span className="text-xs">Cargando Tiempos Tica...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {daysList.map((day) => {
            const dayBingosCount = getDayBingosCount(day);
            return (
            <section
              key={day.date}
              id={`tiempos-day-${day.date}`}
              className={`rounded-2xl border overflow-hidden ${
                day.isToday
                  ? 'border-blue-500/45 bg-zinc-950/90 shadow-lg shadow-blue-950/20'
                  : 'border-zinc-800/90 bg-zinc-950/80'
              }`}
            >
              {/* Cabecera del día */}
              <div className="px-3.5 py-2.5 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar
                    size={14}
                    className={day.isToday ? 'text-blue-400 shrink-0' : 'text-zinc-400 shrink-0'}
                  />
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                    {day.label}
                  </h3>
                  {day.isToday && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 border border-blue-400/50 text-blue-200 shrink-0">
                      Hoy
                    </span>
                  )}
                  {day.isYesterday && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-300 shrink-0">
                      Ayer
                    </span>
                  )}
                </div>
                <div
                  id={`tiempos-bingos-${day.date}`}
                  className={`px-2 py-0.5 rounded-lg border font-mono font-extrabold text-[11px] shrink-0 flex items-center gap-1 tabular-nums ${
                    dayBingosCount > 0
                      ? 'bg-red-600/30 border-red-500/70 text-red-200 ring-1 ring-red-500/40 shadow-sm shadow-red-950/50'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
                  }`}
                  title="Bingos del día (Número o Mega Reventado)"
                >
                  <span>{dayBingosCount}</span>
                  <span>{dayBingosCount === 1 ? 'bingo' : 'bingos'}</span>
                </div>
              </div>

              {/* Subcabecera estilo La Anguila: arriba lo que va a caer / abajo probables */}
              <div className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-950/60 border-b border-zinc-800/70 flex items-center justify-between">
                <span>Horario · Sorteo</span>
                <span>Número · Mega Reventado</span>
              </div>

              {/* Bloques de cada sorteo (Mediodía, Tarde, Noche): Arriba resultado, Abajo probables */}
              <div className="divide-y divide-zinc-800/80">
                {day.draws.map((draw) => {
                  const numKey = `${day.date}-${draw.slotKey}-num`;
                  const megaKey = `${day.date}-${draw.slotKey}-mega`;
                  const isNumCopied = copiedKey === numKey;
                  const isMegaCopied = copiedKey === megaKey;
                  const hasNumber = draw.number2 !== null && draw.number2 !== '';
                  const hasMega = Boolean(draw.megaNumero);
                  const slotProbables = draw.probables || [];
                  const hnProbables = draw.hondurasProbables || [];
                  const expandedProbSet = new Set(
                    [...slotProbables, ...hnProbables].flatMap((p) => getVueltaEquivalents(p))
                  );
                  const isTopNumberHit = Boolean(
                    hasNumber && draw.number2 && expandedProbSet.has(draw.number2)
                  );
                  const isTopMegaHit = Boolean(
                    hasMega && draw.megaNumero && expandedProbSet.has(draw.megaNumero)
                  );

                  return (
                    <div
                      key={`${day.date}-${draw.slotKey}`}
                      id={`tiempos-slot-${day.date}-${draw.slotKey.replace(':', '')}`}
                      className="flex flex-col gap-2.5 px-3.5 py-3"
                    >
                      {/* Fila superior (Arriba): Turno, código, horario + Número y Mega Reventado */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col min-w-0 flex-1 gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-zinc-100">
                              {draw.slotName}
                            </span>
                            {draw.sorteoNumber && (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                                #{draw.sorteoNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                            <Clock size={10} className="text-zinc-500 shrink-0" />
                            <span>{draw.timeLabel}</span>
                          </div>
                        </div>

                        <div className="flex items-end gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={!hasNumber}
                            onClick={() => hasNumber && draw.number2 && handleCopy(numKey, draw.number2)}
                            className={`flex flex-col items-center gap-1 group transition ${
                              hasNumber ? 'cursor-pointer active:scale-[0.97]' : 'opacity-60 cursor-default'
                            }`}
                            title={
                              isTopNumberHit
                                ? `¡Acierto en Número! Copiar ${draw.number2}`
                                : hasNumber
                                ? `Copiar número ${draw.number2}`
                                : 'Esperando resultado'
                            }
                          >
                            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-300/90 flex items-center gap-1">
                              <span>Número</span>
                              {hasNumber &&
                                (isNumCopied ? (
                                  <Check size={9} className="text-emerald-400" />
                                ) : (
                                  <Copy size={9} className="text-zinc-500 group-hover:text-zinc-300" />
                                ))}
                            </span>
                            <span
                              className={`w-12 h-11 rounded-xl border flex items-center justify-center text-xl font-mono font-black tracking-tight shadow-sm tabular-nums ${
                                hasNumber
                                  ? isTopNumberHit
                                    ? 'bg-red-600/35 border-red-500 text-red-100 ring-1 ring-red-500/60 shadow-red-950/60'
                                    : day.isToday
                                    ? 'bg-blue-950/70 border-blue-500/60 group-hover:border-blue-400 text-blue-100'
                                    : 'bg-zinc-900 border-zinc-700/80 group-hover:border-zinc-500 text-white'
                                  : 'bg-zinc-950 border-zinc-800/80 text-zinc-600'
                              }`}
                            >
                              {hasNumber ? draw.number2 : '--'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={!hasMega}
                            onClick={() => hasMega && draw.megaNumero && handleCopy(megaKey, draw.megaNumero)}
                            className={`flex flex-col items-center gap-1 group transition ${
                              hasMega ? 'cursor-pointer active:scale-[0.97]' : 'opacity-60 cursor-default'
                            }`}
                            title={
                              isTopMegaHit
                                ? `¡Acierto en Mega Reventado! Copiar ${draw.megaNumero}`
                                : hasMega
                                ? `Copiar Mega Reventado ${draw.megaNumero}`
                                : 'Esperando Mega Reventado'
                            }
                          >
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300/90 whitespace-nowrap flex items-center gap-1">
                              <span>Mega Reventado</span>
                              {hasMega &&
                                (isMegaCopied ? (
                                  <Check size={9} className="text-emerald-400" />
                                ) : (
                                  <Copy size={9} className="text-zinc-500 group-hover:text-zinc-300" />
                                ))}
                            </span>
                            <span
                              className={`w-12 h-11 rounded-xl border flex items-center justify-center text-xl font-mono font-black tracking-tight shadow-sm tabular-nums ${
                                hasMega
                                  ? isTopMegaHit
                                    ? 'bg-red-600/35 border-red-500 text-red-100 ring-1 ring-red-500/60 shadow-red-950/60'
                                    : 'bg-amber-950/55 border-amber-500/60 group-hover:border-amber-400 text-amber-200'
                                  : 'bg-zinc-950 border-zinc-800/80 text-zinc-600'
                              }`}
                            >
                              {hasMega ? draw.megaNumero : '--'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Fila inferior (Abajo): Espacio para los Probables estilo La Anguila */}
                      <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-zinc-900/90 font-mono">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-zinc-500 text-sm font-bold">=</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                            Probables
                          </span>
                        </div>

                        <div
                          id={`tiempos-probables-${day.date}-${draw.slotKey.replace(':', '')}`}
                          className="rounded-xl bg-sky-950/40 border border-sky-500/40 p-1.5 flex items-center justify-end flex-wrap gap-1.5 tabular-nums shadow-inner shadow-sky-950/30"
                          title="Probables del sorteo"
                        >
                          {slotProbables.length > 0 || hnProbables.length > 0 ? (
                            <>
                              {slotProbables.map((val, idx) => {
                                const itemProbKey = `${day.date}-${draw.slotKey}-prob-${idx}`;
                                const isItemCopied = copiedKey === itemProbKey;
                                const eqs = getVueltaEquivalents(val);
                                const matchedNum = Boolean(
                                  hasNumber && draw.number2 && eqs.includes(draw.number2)
                                );
                                const matchedMega = Boolean(
                                  hasMega && draw.megaNumero && eqs.includes(draw.megaNumero)
                                );
                                const isItemHit = matchedNum || matchedMega;
                                const eqLabel = eqs.filter((x) => x !== val).join('/');
                                return (
                                  <button
                                    key={`tica-${idx}`}
                                    type="button"
                                    onClick={() => handleCopy(itemProbKey, val)}
                                    className={`min-w-[3.1rem] text-center px-2 py-1 rounded-md border font-bold text-xs sm:text-sm transition cursor-pointer active:scale-95 flex items-center justify-center gap-0.5 ${
                                      isItemHit
                                        ? 'bg-red-600/40 border-red-500 text-red-100 ring-1 ring-red-500/60 shadow-sm shadow-red-950/60'
                                        : 'bg-sky-900/55 border-sky-500/45 hover:border-sky-300 text-sky-100'
                                    }`}
                                    title={
                                      matchedNum && matchedMega
                                        ? `¡Acierto en Número y Mega Reventado!${eqLabel ? ` (${val}V = ${eqLabel})` : ''} · Copiar ${val}`
                                        : matchedNum
                                        ? `¡Acierto en Número!${eqLabel ? ` (${val}V = ${eqLabel})` : ''} · Copiar ${val}`
                                        : matchedMega
                                        ? `¡Acierto en Mega Reventado!${eqLabel ? ` (${val}V = ${eqLabel})` : ''} · Copiar ${val}`
                                        : eqLabel
                                        ? `${val}V (vuelta: ${eqLabel}) · Copiar ${val}`
                                        : `Copiar ${val}`
                                    }
                                  >
                                    <span>{val}V</span>
                                    {isItemCopied && <Check size={9} className="text-emerald-300" />}
                                  </button>
                                );
                              })}
                              {hnProbables.map((val, idx) => {
                                const itemHnKey = `${day.date}-${draw.slotKey}-hn-${idx}`;
                                const isItemCopied = copiedKey === itemHnKey;
                                const eqs = getVueltaEquivalents(val);
                                const matchedNum = Boolean(
                                  hasNumber && draw.number2 && eqs.includes(draw.number2)
                                );
                                const matchedMega = Boolean(
                                  hasMega && draw.megaNumero && eqs.includes(draw.megaNumero)
                                );
                                const isItemHit = matchedNum || matchedMega;
                                const eqLabel = eqs.filter((x) => x !== val).join('/');
                                const hnOriginLabel = draw.hondurasSourceNumber && draw.hondurasSourceTime
                                  ? `Honduras ${draw.hondurasSourceTime} (${draw.hondurasSourceNumber} → ZL)`
                                  : 'Honduras ZL';
                                return (
                                  <button
                                    key={`hn-${idx}`}
                                    type="button"
                                    onClick={() => handleCopy(itemHnKey, val)}
                                    data-source="honduras"
                                    className={`min-w-[3.1rem] text-center px-2 py-1 rounded-md border font-extrabold text-xs sm:text-sm transition cursor-pointer active:scale-95 flex items-center justify-center gap-0.5 ${
                                      isItemHit
                                        ? 'bg-red-600/40 border-red-500 text-red-100 ring-1 ring-red-500/60 shadow-sm shadow-red-950/60'
                                        : 'bg-cyan-400 border-cyan-200 hover:bg-cyan-300 hover:border-white text-slate-950 shadow-md shadow-cyan-500/35 ring-1 ring-cyan-300/60'
                                    }`}
                                    title={
                                      matchedNum && matchedMega
                                        ? `¡Acierto ${hnOriginLabel} en Número y Mega Reventado!${eqLabel ? ` (${val}V = ${eqLabel})` : ''} · Copiar ${val}`
                                        : matchedNum
                                        ? `¡Acierto ${hnOriginLabel} en Número!${eqLabel ? ` (${val}V = ${eqLabel})` : ''} · Copiar ${val}`
                                        : matchedMega
                                        ? `¡Acierto ${hnOriginLabel} en Mega Reventado!${eqLabel ? ` (${val}V = ${eqLabel})` : ''} · Copiar ${val}`
                                        : `${hnOriginLabel}${eqLabel ? ` · ${val}V = ${eqLabel}` : ''} · Copiar ${val}`
                                    }
                                  >
                                    <span>{val}V</span>
                                    {isItemCopied && (
                                      <Check
                                        size={9}
                                        className={isItemHit ? 'text-emerald-300' : 'text-slate-950'}
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </>
                          ) : (
                            <span className="min-w-[2.75rem] text-center px-2 py-1 rounded-md border border-sky-500/25 bg-sky-950/50 text-sky-300/50 font-bold text-xs">
                              --
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            );
          })}

          {daysCount < MAX_DAYS && (
            <button
              id="btn-load-more-tiempos"
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
      )}
    </div>
  );
}
