/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Calculator,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import {
  verifyMonasusKey,
  updateMonasusKey,
  analyzeMonasusDraw,
  MonasusAnalysisResult,
} from '../utils';

interface AlgoritmoMonasusProps {
  unlockedKey: string | null;
  onUnlock: (key: string) => void;
  onLock: () => void;
}

const MANUAL_INPUT_STORAGE_KEY = 'zl_monasus_single_input_v1';

function loadSavedInput(): { sorteo: string; premio: string } {
  if (typeof window === 'undefined') return { sorteo: '', premio: '' };
  try {
    const raw = localStorage.getItem(MANUAL_INPUT_STORAGE_KEY);
    if (!raw) return { sorteo: '', premio: '' };
    const parsed = JSON.parse(raw) as { sorteo?: string; premio?: string };
    return {
      sorteo: String(parsed?.sorteo || '').replace(/\D/g, '').slice(0, 4),
      premio: String(parsed?.premio || '').replace(/\D/g, '').slice(0, 3),
    };
  } catch {
    return { sorteo: '', premio: '' };
  }
}

export function AlgoritmoMonasus({
  unlockedKey,
  onUnlock,
  onLock,
}: AlgoritmoMonasusProps) {
  const [inputKey, setInputKey] = useState('');
  const [showInputKey, setShowInputKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [manualInput, setManualInput] = useState<{ sorteo: string; premio: string }>(() =>
    loadSavedInput()
  );
  const [analysis, setAnalysis] = useState<MonasusAnalysisResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showChangeKey, setShowChangeKey] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(MANUAL_INPUT_STORAGE_KEY, JSON.stringify(manualInput));
    } catch {
      // Ignore storage quota errors
    }
  }, [manualInput]);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setErrorMsg('Ingresa tu clave privada para entrar a Algoritmo Monasus.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const res = await verifyMonasusKey(trimmed);
      if (res.valid) {
        setInputKey('');
        onUnlock(trimmed);
      } else {
        setErrorMsg(res.error || 'Clave incorrecta. Acceso restringido al propietario.');
      }
    } catch {
      setErrorMsg('No se pudo verificar la clave con el servidor.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFieldChange = (field: 'sorteo' | 'premio', rawValue: string) => {
    const maxLen = field === 'sorteo' ? 4 : 3;
    const clean = rawValue.replace(/\D/g, '').slice(0, maxLen);
    setManualInput((prev) => ({ ...prev, [field]: clean }));
    if (calcError) setCalcError(null);
  };

  const handleClearInput = () => {
    setManualInput({ sorteo: '', premio: '' });
    setAnalysis(null);
    setCalcError(null);
  };

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!unlockedKey) return;

    const sClean = manualInput.sorteo.replace(/\D/g, '');
    const pClean = manualInput.premio.replace(/\D/g, '');

    if (sClean.length !== 4) {
      setCalcError('Ingresa el número de sorteo de 4 cifras (ej. 6610).');
      return;
    }
    if (pClean.length !== 3) {
      setCalcError('Ingresa los 3 números del último resultado (ej. 861).');
      return;
    }

    setIsCalculating(true);
    setCalcError(null);
    try {
      const result = await analyzeMonasusDraw(unlockedKey, sClean, pClean);
      setAnalysis(result);
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : 'Error al calcular.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCopy = async (id: string, num: string) => {
    try {
      await navigator.clipboard.writeText(num);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1400);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleChangeKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockedKey) return;
    const cleanNew = newKeyInput.trim();
    if (cleanNew.length < 4) {
      setKeyStatusMsg({ type: 'error', text: 'La nueva clave debe tener al menos 4 caracteres.' });
      return;
    }

    setIsUpdatingKey(true);
    setKeyStatusMsg(null);
    try {
      await updateMonasusKey(unlockedKey, cleanNew);
      onUnlock(cleanNew);
      setNewKeyInput('');
      setKeyStatusMsg({ type: 'success', text: 'Clave actualizada correctamente.' });
    } catch (err) {
      setKeyStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al actualizar la clave.',
      });
    } finally {
      setIsUpdatingKey(false);
    }
  };

  if (!unlockedKey) {
    return (
      <div id="monasus-lock-gate" className="py-4 space-y-5">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-violet-950/60 border border-violet-500/45 flex items-center justify-center shadow-lg shadow-violet-950/40">
            <Lock size={28} className="text-violet-300" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-950/80 border border-violet-500/40 text-violet-300">
              <KeyRound size={11} />
              <span>Acceso Privado · Solo Propietario</span>
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight pt-1">
              Algoritmo Monasus
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Esta pestaña está bloqueada con clave exclusiva mientras se encuentra en preparación.
            </p>
          </div>
        </div>

        <form onSubmit={handleUnlockSubmit} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label
              htmlFor="input-monasus-key"
              className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5 px-0.5"
            >
              <KeyRound size={13} className="text-violet-400" />
              <span>Clave de acceso</span>
            </label>
            <div className="relative">
              <input
                id="input-monasus-key"
                type={showInputKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ingresa la clave privada..."
                autoComplete="off"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none transition"
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

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/70 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            id="btn-unlock-monasus"
            type="submit"
            disabled={isVerifying || !inputKey.trim()}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-violet-600 hover:bg-violet-500 active:scale-[0.99] text-white shadow-lg shadow-violet-950/50 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{isVerifying ? 'Verificando clave...' : 'Entrar a Algoritmo Monasus'}</span>
            {!isVerifying && <ArrowRight size={15} />}
          </button>
        </form>
      </div>
    );
  }

  const ordenRows = analysis
    ? [
        {
          id: 'principal',
          label: 'Monazo principal',
          numero: analysis.candidatos[0].numero,
          digitos: analysis.candidatos[0].digitos,
        },
        {
          id: 'aritmetico',
          label: 'Monazo aritmético',
          numero: analysis.candidatos[1].numero,
          digitos: analysis.candidatos[1].digitos,
        },
        {
          id: 'arrastre',
          label: 'Arrastre y simetría',
          numero: analysis.candidatos[2].numero,
          digitos: analysis.candidatos[2].digitos,
        },
        {
          id: 'tercero',
          label: 'Tercero',
          numero: analysis.tercero.numero,
          digitos: analysis.tercero.digitos,
        },
      ]
    : [];

  const desordenRows = analysis
    ? [
        {
          id: 'resta',
          label: 'Desorden resta',
          numero: analysis.resta.numero3,
          digitos: analysis.resta.digitos,
        },
        {
          id: 'miniresta',
          label: 'Desorden miniresta',
          numero: analysis.miniresta.numero3,
          digitos: analysis.miniresta.digitos,
        },
      ]
    : [];

  return (
    <div id="monasus-private-workspace" className="space-y-4">
      {/* Encabezado privado */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-violet-950/60 border border-violet-500/40 text-violet-300 shrink-0">
            <Unlock size={16} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
              Algoritmo Monasus
            </h2>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={11} />
              <span>Acceso privado</span>
            </p>
          </div>
        </div>

        <button
          id="btn-lock-monasus"
          type="button"
          onClick={onLock}
          className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-800 hover:border-violet-500/40 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          title="Bloquear esta pestaña nuevamente"
        >
          <Lock size={12} className="text-violet-400" />
          <span>Bloquear</span>
        </button>
      </div>

      {/* Único espacio de registro manual: Último */}
      <form
        onSubmit={handleCalculate}
        className="rounded-2xl border border-violet-500/40 bg-zinc-900/80 p-3.5 space-y-3 shadow-md shadow-violet-950/20"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 border border-amber-500/35 text-amber-300">
            Último
          </span>

          <button
            type="button"
            onClick={handleClearInput}
            className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            title="Limpiar campos"
          >
            <Trash2 size={12} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label htmlFor="input-monasus-sorteo" className="block text-[10px] font-semibold text-zinc-400">
              N.º Sorteo
            </label>
            <input
              id="input-monasus-sorteo"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={manualInput.sorteo}
              onChange={(e) => handleFieldChange('sorteo', e.target.value)}
              placeholder="Ej. 6610"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/60 rounded-xl px-3 py-2.5 text-center font-mono font-bold text-base text-white placeholder-zinc-600 focus:outline-none tracking-widest"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="input-monasus-premio" className="block text-[10px] font-semibold text-zinc-400">
              3 números
            </label>
            <input
              id="input-monasus-premio"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              value={manualInput.premio}
              onChange={(e) => handleFieldChange('premio', e.target.value)}
              placeholder="Ej. 861"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/60 rounded-xl px-3 py-2.5 text-center font-mono font-bold text-base text-white placeholder-zinc-600 focus:outline-none tracking-widest"
            />
          </div>
        </div>

        <button
          id="btn-monasus-calc"
          type="submit"
          disabled={isCalculating}
          className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.99] text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-violet-950/40"
        >
          <Calculator size={15} />
          <span>{isCalculating ? 'Calculando...' : 'Calcular'}</span>
        </button>
      </form>

      {calcError && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/70 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-red-400" />
          <span>{calcError}</span>
        </div>
      )}

      {/* Resultados divididos en Monazos orden (arriba) y Monazos desorden (abajo) */}
      {analysis && (
        <div id="monasus-analysis-result" className="space-y-3">
          {/* Cuadrito arriba: Monazos orden */}
          <div
            id="monasus-box-orden"
            className="rounded-2xl border border-violet-500/40 bg-zinc-900/90 overflow-hidden divide-y divide-zinc-800/75"
          >
            <div className="px-3.5 py-2 bg-violet-950/40 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-300">
                Monazos orden
              </span>
            </div>

            {ordenRows.map((row) => {
              const isCopied = copiedId === row.id;
              return (
                <div
                  key={row.id}
                  id={`monasus-row-${row.id}`}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-2"
                >
                  <span className="text-[11px] font-semibold tracking-tight text-zinc-300">
                    {row.label}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopy(row.id, row.numero)}
                    className="flex items-center gap-2 shrink-0 cursor-pointer group"
                    title={`Copiar ${row.numero}`}
                  >
                    <div className="flex items-center gap-1.5 font-mono tabular-nums">
                      {row.digitos.map((dig, idx) => (
                        <span
                          key={idx}
                          className="w-9 h-9 rounded-xl border bg-violet-950/75 border-violet-400/60 text-white group-hover:border-violet-300 flex items-center justify-center text-lg font-black shadow-sm transition"
                        >
                          {dig}
                        </span>
                      ))}
                    </div>
                    <span className="text-zinc-500 group-hover:text-zinc-200 w-4 flex justify-center">
                      {isCopied ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cuadrito abajo: Monazos desorden */}
          <div
            id="monasus-box-desorden"
            className="rounded-2xl border border-cyan-500/45 bg-cyan-950/20 overflow-hidden divide-y divide-cyan-900/40"
          >
            <div className="px-3.5 py-2 bg-cyan-950/50 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300">
                Monazos desorden
              </span>
            </div>

            {desordenRows.map((row) => {
              const isCopied = copiedId === row.id;
              return (
                <div
                  key={row.id}
                  id={`monasus-row-${row.id}`}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-2"
                >
                  <span className="text-[11px] font-semibold tracking-tight text-cyan-200">
                    {row.label}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopy(row.id, row.numero)}
                    className="flex items-center gap-2 shrink-0 cursor-pointer group"
                    title={`Copiar ${row.numero}`}
                  >
                    <div className="flex items-center gap-1.5 font-mono tabular-nums">
                      {row.digitos.map((dig, idx) => (
                        <span
                          key={idx}
                          className="w-9 h-9 rounded-xl border bg-cyan-950/80 border-cyan-400/60 text-cyan-100 group-hover:border-cyan-300 flex items-center justify-center text-lg font-black shadow-sm transition"
                        >
                          {dig}
                        </span>
                      ))}
                    </div>
                    <span className="text-zinc-500 group-hover:text-zinc-200 w-4 flex justify-center">
                      {isCopied ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Control para cambiar la clave privada de Monasus */}
      <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
            <KeyRound size={14} className="text-violet-400" />
            <span>Clave privada de esta pestaña</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowChangeKey((v) => !v);
              setKeyStatusMsg(null);
            }}
            className="text-[11px] font-semibold text-violet-300 hover:text-violet-200 transition cursor-pointer"
          >
            {showChangeKey ? 'Cancelar' : 'Cambiar clave'}
          </button>
        </div>

        {showChangeKey && (
          <form onSubmit={handleChangeKeySubmit} className="space-y-2.5 pt-1">
            <div className="flex gap-2">
              <input
                id="input-new-monasus-key"
                type="text"
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                placeholder="Nueva clave (mín. 4 caracteres)"
                className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-violet-500 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={isUpdatingKey || newKeyInput.trim().length < 4}
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition disabled:opacity-40 cursor-pointer"
              >
                {isUpdatingKey ? 'Guardando...' : 'Guardar'}
              </button>
            </div>

            {keyStatusMsg && (
              <div
                className={`p-2 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                  keyStatusMsg.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                    : 'bg-red-950/60 border-red-800/70 text-red-300'
                }`}
              >
                {keyStatusMsg.type === 'success' ? (
                  <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle size={13} className="shrink-0 text-red-400" />
                )}
                <span>{keyStatusMsg.text}</span>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
