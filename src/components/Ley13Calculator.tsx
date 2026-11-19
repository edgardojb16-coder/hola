/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { fetchAlgorithmZL, CalculationResult } from '../utils';
import { Copy, Check, Bomb, Clover, Sparkles, ShieldCheck } from 'lucide-react';
import {
  LotteryCountry,
  COUNTRIES,
  FlagCostaRica,
  FlagNicaragua,
  FlagHonduras,
  TriFlagRibbon,
} from './FlagBadges';

interface Ley13CalculatorProps {
  numberStr: string;
  selectedCountry?: LotteryCountry;
  currentDay?: number;
  currentMonth?: number;
  currentYear?: number;
}

export function Ley13Calculator({
  numberStr,
  selectedCountry = 'all',
  currentDay,
  currentMonth,
  currentYear,
}: Ley13CalculatorProps) {
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
        console.error('Error fetching calculation:', err);
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

  const filteredExtras = result?.extras ?? [];
  const allNumbersList = result?.allNumbers ?? [];
  const numeroBombaDia = result?.numeroBombaDia ?? '--';

  const leyDirect = result?.leyDirect ?? '--';
  const igualDirect = result?.igualDirect ?? '--';

  const cleanInput = (result?.inputUsed || numberStr || '00').padStart(2, '0').slice(-2);
  const d1 = parseInt(cleanInput[0], 10) || 0;
  const d2 = parseInt(cleanInput[1], 10) || 0;
  const effectiveDay =
    result?.dayUsed ??
    (currentDay && currentDay >= 1 && currentDay <= 31 ? currentDay : new Date().getDate());
  const multiplicacion =
    result?.multiplicacion ?? String(d1 * d2).padStart(2, '0');
  const inputNum = parseInt(cleanInput, 10) || 0;
  const restaDia =
    result?.restaDia ?? String(Math.abs(inputNum - effectiveDay)).padStart(2, '0');
  const restaCien =
    result?.restaCien ?? String((100 - inputNum) % 100).padStart(2, '0');

  const baseData = result?.baseDelDia;
  const baseDirect = baseData?.direct ?? '--';
  const baseDual = baseData?.dual ?? '--';
  const baseDirectOptions = baseData?.directOptions ?? [];
  const baseDualOptions = baseData?.dualOptions ?? [];
  const baseTiles = baseData
    ? Array.from(
        new Set(
          [baseDirect, ...baseDirectOptions, baseDual, ...baseDualOptions].filter(
            (v) => v && v !== '--'
          )
        )
      )
    : ['--', '--'];

  const copyFuertes = () => {
    if (result) {
      const nums = Array.from(
        new Set([leyDirect, igualDirect, multiplicacion, restaDia, restaCien, ...baseTiles])
      ).filter((v) => v && v !== '--');
      handleCopy(nums.join(' '), 'fuertes');
    }
  };

  const copyExtras = () => {
    if (filteredExtras.length > 0) {
      handleCopy(filteredExtras.map((e) => e.value).join(' '), 'extras');
    }
  };

  const copyNumeroBomba = () => {
    if (numeroBombaDia && numeroBombaDia !== '--') {
      handleCopy(numeroBombaDia, 'numero-bomba');
    }
  };

  const copyAll = () => {
    if (allNumbersList.length > 0) {
      handleCopy(allNumbersList.join(' '), 'all-numbers');
    }
  };

  const gridColsClass =
    filteredExtras.length >= 6
      ? 'grid-cols-3 sm:grid-cols-6'
      : filteredExtras.length === 5
      ? 'grid-cols-3 sm:grid-cols-5'
      : filteredExtras.length === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : filteredExtras.length === 3
      ? 'grid-cols-3'
      : filteredExtras.length === 2
      ? 'grid-cols-2'
      : 'grid-cols-1 max-w-[200px] mx-auto';

  // Estilos temáticos según el país seleccionado
  const countryTheme = COUNTRIES[selectedCountry] || COUNTRIES.all;

  // Clases dinámicas según la bandera activa
  const containerClasses =
    selectedCountry === 'cr'
      ? 'bg-gradient-to-b from-blue-950/70 via-red-950/40 to-zinc-950 border-2 border-red-600/90 shadow-red-950/60 ring-1 ring-blue-500/40'
      : selectedCountry === 'ni'
      ? 'bg-gradient-to-b from-blue-950/80 via-blue-900/40 to-zinc-950 border-2 border-blue-500/90 shadow-blue-950/60 ring-1 ring-white/20'
      : selectedCountry === 'hn'
      ? 'bg-gradient-to-b from-cyan-950/80 via-sky-950/50 to-zinc-950 border-2 border-cyan-400/90 shadow-cyan-950/60 ring-1 ring-cyan-500/40'
      : 'bg-gradient-to-b from-blue-950/60 via-red-950/30 to-zinc-950 border-2 border-red-500/80 shadow-red-950/50 ring-1 ring-cyan-500/30';

  return (
    <div className="space-y-4">
      {/* CUADRO 1: FUERTES PARA EL SORTEO CON REFERENCIA A LAS BANDERAS */}
      <div className={`p-4 sm:p-5 rounded-2xl ${containerClasses} shadow-xl space-y-3 relative overflow-hidden transition-all duration-300`}>
        {/* Cinta de bandera en la parte superior del cuadro */}
        <div className="relative -mt-1 mb-2">
          {selectedCountry === 'all' ? (
            <TriFlagRibbon className="h-1.5 w-full" />
          ) : selectedCountry === 'cr' ? (
            <div className="h-1.5 w-full flex flex-col rounded-full overflow-hidden">
              <div className="h-[20%] bg-[#002B7F]" />
              <div className="h-[20%] bg-white" />
              <div className="h-[40%] bg-[#CE1126]" />
              <div className="h-[20%] bg-white" />
              <div className="h-[20%] bg-[#002B7F]" />
            </div>
          ) : selectedCountry === 'ni' ? (
            <div className="h-1.5 w-full flex flex-col rounded-full overflow-hidden">
              <div className="h-[33.3%] bg-[#0067C6]" />
              <div className="h-[33.4%] bg-white" />
              <div className="h-[33.3%] bg-[#0067C6]" />
            </div>
          ) : (
            <div className="h-1.5 w-full flex flex-col rounded-full overflow-hidden">
              <div className="h-[33.3%] bg-[#00BCE4]" />
              <div className="h-[33.4%] bg-white" />
              <div className="h-[33.3%] bg-[#00BCE4]" />
            </div>
          )}
        </div>

        {/* Resplandor ambiental de fondo */}
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-25"
          style={{ backgroundColor: countryTheme.colors.accent }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-zinc-800/80 pb-2.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-red-600 via-blue-600 to-cyan-500 text-white shadow-md ring-1 ring-white/30 shrink-0">
              <Bomb size={18} className="text-white drop-shadow animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <span>Bomba · Fuertes para el sorteo</span>
                </h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  ¡Por explotar!
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-300/90 font-medium leading-tight mt-0.5">
                Los números más fuertes y probables para jugar
              </p>
            </div>
          </div>

          <button
            id="btn-copy-fuertes"
            onClick={copyFuertes}
            disabled={!result}
            className="self-end sm:self-auto px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-[10px] text-zinc-200 hover:text-white font-medium border border-zinc-700 hover:border-zinc-500 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
            title="Copiar todos los números fuertes"
          >
            {copiedKey === 'fuertes' ? (
              <Check size={11} className="text-emerald-400" />
            ) : (
              <Copy size={11} />
            )}
            <span>{copiedKey === 'fuertes' ? '¡Copiados!' : 'Copiar Fuertes'}</span>
          </button>
        </div>

        {/* 5 Cuadros juntos solo con los números */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 relative z-10">
          <div
            id="card-cifra-zl"
            onClick={() => leyDirect !== '--' && handleCopy(leyDirect, 'ley')}
            className={`bg-zinc-950/90 hover:bg-zinc-900 py-3 sm:py-4 px-1 rounded-xl border ${
              copiedKey === 'ley'
                ? 'border-emerald-400 ring-1 ring-emerald-400/50'
                : 'border-red-500/60 hover:border-red-400'
            } shadow-md shadow-red-950/30 flex items-center justify-center cursor-pointer transition select-none`}
            title={`Click para copiar ${leyDirect}`}
          >
            <span className="text-xl sm:text-3xl font-black font-mono text-emerald-400 tracking-wider drop-shadow-sm">
              {leyDirect}
            </span>
          </div>

          <div
            id="card-numero-dual"
            onClick={() => igualDirect !== '--' && handleCopy(igualDirect, 'igual')}
            className={`bg-zinc-950/90 hover:bg-zinc-900 py-3 sm:py-4 px-1 rounded-xl border ${
              copiedKey === 'igual'
                ? 'border-emerald-400 ring-1 ring-emerald-400/50'
                : 'border-blue-500/60 hover:border-blue-400'
            } shadow-md shadow-blue-950/30 flex items-center justify-center cursor-pointer transition select-none`}
            title={`Click para copiar ${igualDirect}`}
          >
            <span className="text-xl sm:text-3xl font-black font-mono text-emerald-400 tracking-wider drop-shadow-sm">
              {igualDirect}
            </span>
          </div>

          <div
            id="card-formula-multiplicacion"
            onClick={() => handleCopy(multiplicacion, 'multiplicacion')}
            className={`bg-zinc-950/90 hover:bg-zinc-900 py-3 sm:py-4 px-1 rounded-xl border ${
              copiedKey === 'multiplicacion'
                ? 'border-emerald-400 ring-1 ring-emerald-400/50'
                : 'border-cyan-500/60 hover:border-cyan-400'
            } shadow-md shadow-cyan-950/30 flex items-center justify-center cursor-pointer transition select-none`}
            title={`Click para copiar ${multiplicacion}`}
          >
            <span className="text-xl sm:text-3xl font-black font-mono text-emerald-400 tracking-wider drop-shadow-sm">
              {multiplicacion}
            </span>
          </div>

          <div
            id="card-formula-resta-dia"
            onClick={() => handleCopy(restaDia, 'resta-dia')}
            className={`bg-zinc-950/90 hover:bg-zinc-900 py-3 sm:py-4 px-1 rounded-xl border ${
              copiedKey === 'resta-dia'
                ? 'border-emerald-400 ring-1 ring-emerald-400/50'
                : 'border-amber-500/60 hover:border-amber-400'
            } shadow-md shadow-amber-950/30 flex items-center justify-center cursor-pointer transition select-none`}
            title={`Click para copiar ${restaDia}`}
          >
            <span className="text-xl sm:text-3xl font-black font-mono text-emerald-400 tracking-wider drop-shadow-sm">
              {restaDia}
            </span>
          </div>

          <div
            id="card-formula-resta-cien"
            onClick={() => handleCopy(restaCien, 'resta-cien')}
            className={`bg-zinc-950/90 hover:bg-zinc-900 py-3 sm:py-4 px-1 rounded-xl border ${
              copiedKey === 'resta-cien'
                ? 'border-emerald-400 ring-1 ring-emerald-400/50'
                : 'border-emerald-500/60 hover:border-emerald-400'
            } shadow-md shadow-emerald-950/30 flex items-center justify-center cursor-pointer transition select-none`}
            title={`Click para copiar ${restaCien}`}
          >
            <span className="text-xl sm:text-3xl font-black font-mono text-emerald-400 tracking-wider drop-shadow-sm">
              {restaCien}
            </span>
          </div>
        </div>

        {/* Base del Día dentro del mismo cuadro, marcada en rojo y solo con los números */}
        <div
          id="seccion-base-del-dia"
          className={`grid ${
            baseTiles.length >= 4
              ? 'grid-cols-4'
              : baseTiles.length === 3
              ? 'grid-cols-3'
              : 'grid-cols-2'
          } gap-2 sm:gap-3 relative z-10`}
        >
          {baseTiles.map((num, idx) => {
            const key = `base-tile-${idx}`;
            return (
              <div
                key={`${num}-${idx}`}
                id={idx === 0 ? 'card-base-directa' : idx === 1 ? 'card-base-dual' : `card-base-opt-${idx}`}
                onClick={() => num !== '--' && handleCopy(num, key)}
                className={`bg-zinc-950/90 hover:bg-zinc-900 py-3 sm:py-4 px-1.5 rounded-xl border ${
                  copiedKey === key
                    ? 'border-red-400 ring-1 ring-red-400/60'
                    : 'border-red-500/75 hover:border-red-400'
                } shadow-md shadow-red-950/40 flex items-center justify-center cursor-pointer transition select-none`}
                title={`Click para copiar ${num}`}
              >
                <span className="text-2xl sm:text-3xl font-black font-mono text-red-400 tracking-wider drop-shadow-sm">
                  {num}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CUADRO 2: NÚMEROS FUERTES PARA TODO EL DÍA */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-950/70 border border-emerald-800/50 text-emerald-400 flex items-center justify-center shadow-sm shrink-0 mt-0.5">
              <Clover size={16} className="fill-emerald-400/20 text-emerald-400" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-emerald-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
                  Números fuertes para todo el día
                </h3>
                {result?.dateUsed ? (
                  <span className="text-[10px] text-zinc-300 font-semibold bg-zinc-900 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Fecha: {String(result.dateUsed.day).padStart(2, '0')}/{String(result.dateUsed.month).padStart(2, '0')}/{result.dateUsed.year}
                  </span>
                ) : result?.dayUsed ? (
                  <span className="text-[10px] text-zinc-300 font-semibold bg-zinc-900 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Fecha: Día {result.dayUsed}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5 leading-snug">
                Jugar en todos los sorteos durante todo el día sin cambiar nada
              </p>
            </div>
          </div>
          {filteredExtras.length > 0 && (
            <button
              id="btn-copy-extras"
              onClick={copyExtras}
              className="self-end sm:self-auto px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 hover:text-emerald-400 font-medium border border-zinc-800 hover:border-zinc-700 transition flex items-center gap-1.5 shrink-0"
              title={`Copiar los ${filteredExtras.length} números fuertes del día`}
            >
              {copiedKey === 'extras' ? (
                <Check size={11} className="text-emerald-400" />
              ) : (
                <Copy size={11} />
              )}
              <span>{copiedKey === 'extras' ? '¡Copiados!' : 'Copiar Fuertes del Día'}</span>
            </button>
          )}
        </div>

        {/* Cuadros de números fuertes para todo el día con trébol de la suerte en cada uno */}
        {filteredExtras.length > 0 ? (
          <div className={`grid gap-2.5 sm:gap-3 ${gridColsClass}`}>
            {filteredExtras.map((extra) => {
              const isOrange = Boolean(extra.isSpecialOrange);

              return (
                <div
                  key={extra.id}
                  id={extra.cardId}
                  onClick={() => handleCopy(extra.value, extra.id)}
                  className={
                    isOrange
                      ? 'bg-gradient-to-b from-orange-950/60 to-zinc-950 hover:bg-orange-950/80 p-2.5 sm:p-3.5 rounded-xl border-2 border-orange-500/90 hover:border-orange-400 shadow-md shadow-orange-950/50 ring-1 ring-orange-500/40 flex flex-col justify-between relative group cursor-pointer transition select-none'
                      : 'bg-zinc-900/80 hover:bg-zinc-900 p-2.5 sm:p-3.5 rounded-xl border border-zinc-800/90 hover:border-emerald-500/40 flex flex-col justify-between relative group cursor-pointer transition select-none shadow-sm'
                  }
                  title={isOrange ? `Click para copiar ${extra.value} (Suma de Fecha)` : `Click para copiar ${extra.value}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={
                        isOrange
                          ? 'p-1 rounded-md bg-orange-950/90 border border-orange-500/70 text-orange-400 flex items-center justify-center shrink-0 shadow-xs'
                          : 'p-1 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs'
                      }
                    >
                      <Clover
                        size={14}
                        className={
                          isOrange
                            ? 'text-orange-400 fill-orange-400/40 animate-pulse'
                            : 'text-emerald-400 fill-emerald-400/40 animate-pulse'
                        }
                      />
                    </span>
                    <span
                      className={
                        isOrange
                          ? 'text-orange-400/70 group-hover:text-orange-300 transition shrink-0 ml-0.5'
                          : 'text-zinc-600 group-hover:text-emerald-400 transition shrink-0 ml-0.5'
                      }
                    >
                      {copiedKey === extra.id ? (
                        <Check size={13} className={isOrange ? 'text-orange-400' : 'text-emerald-400'} />
                      ) : (
                        <Copy size={11} className="opacity-60 group-hover:opacity-100" />
                      )}
                    </span>
                  </div>
                  <div className="text-center py-1.5 sm:py-2.5">
                    <span
                      className={
                        isOrange
                          ? 'text-2xl sm:text-3xl font-black font-mono text-orange-400 tracking-wider drop-shadow-sm'
                          : 'text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-wider drop-shadow-sm'
                      }
                    >
                      {extra.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-3 text-xs text-zinc-500 italic">
            Los números fuertes para todo el día coinciden con las cifras principales.
          </div>
        )}
      </div>

      {/* CUADRO 3: NÚMERO BOMBA DEL DÍA */}
      <div
        id="seccion-numero-bomba-dia"
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-rose-950/70 via-red-950/40 to-zinc-950 border-2 border-rose-600/80 shadow-xl shadow-rose-950/50 ring-1 ring-amber-500/30 space-y-3 relative overflow-hidden"
      >
        {/* Resplandor ambiental de fondo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 text-white shadow-md ring-1 ring-white/30 shrink-0">
              <Bomb size={18} className="text-white drop-shadow animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            </div>
            <h3 className="text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
              <span>Número bomba del día</span>
            </h3>
          </div>

          <button
            id="btn-copy-numero-bomba"
            onClick={copyNumeroBomba}
            disabled={!result || numeroBombaDia === '--'}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-[10px] text-zinc-200 hover:text-white font-medium border border-zinc-700 hover:border-zinc-500 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
            title={`Copiar el número bomba del día (${numeroBombaDia})`}
          >
            {copiedKey === 'numero-bomba' ? (
              <Check size={11} className="text-rose-400" />
            ) : (
              <Copy size={11} />
            )}
            <span>{copiedKey === 'numero-bomba' ? '¡Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        {/* Tarjeta limpia con la bombita bonita y nada más el número */}
        <div className="relative z-10 max-w-[220px] mx-auto w-full pt-1">
          <div
            id="card-numero-bomba-dia"
            onClick={copyNumeroBomba}
            className="bg-zinc-950/90 hover:bg-zinc-900 p-4 rounded-2xl border-2 border-rose-500/80 hover:border-rose-400 shadow-lg shadow-rose-950/40 ring-1 ring-amber-500/30 flex flex-col items-center justify-center relative group cursor-pointer transition select-none text-center"
            title={`Click para copiar ${numeroBombaDia}`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="p-1 rounded-md bg-rose-950/90 border border-rose-500/70 text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                <Bomb size={16} className="text-rose-400 drop-shadow animate-pulse" />
              </span>
              <span className="text-zinc-500 group-hover:text-white transition shrink-0 ml-0.5">
                {copiedKey === 'numero-bomba' ? (
                  <Check size={13} className="text-rose-400" />
                ) : (
                  <Copy size={11} className="opacity-60 group-hover:opacity-100" />
                )}
              </span>
            </div>

            <div className="py-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400 tracking-widest drop-shadow-md">
                {numeroBombaDia}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón rápido para copiar todos los números únicos con el estilo tricolor */}
      <button
        id="btn-copy-all"
        onClick={copyAll}
        disabled={allNumbersList.length === 0}
        className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-xs text-zinc-200 hover:text-white font-medium border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
        title={`Copiar todos los números (${allNumbersList.length})`}
      >
        {copiedKey === 'all-numbers' ? (
          <Check size={14} className="text-emerald-400" />
        ) : (
          <Sparkles size={14} className="text-cyan-400" />
        )}
        <span>
          {copiedKey === 'all-numbers'
            ? `¡${allNumbersList.length} Números Copiados!`
            : `Copiar todos los números probables (${allNumbersList.length})`}
        </span>
      </button>

      {/* Indicador sutil de protección y referencia regional */}
      <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-zinc-500">
        <ShieldCheck size={13} className="text-emerald-500/70" />
        <span>Válido para Loterías de Costa Rica, Nicaragua y Honduras</span>
      </div>
    </div>
  );
}
