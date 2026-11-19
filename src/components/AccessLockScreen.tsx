/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TriFlagRibbon } from './FlagBadges';

interface AccessLockScreenProps {
  onUnlock: (keyOrPin: string) => Promise<{ success: boolean; message?: string }>;
}

export function AccessLockScreen({ onUnlock }: AccessLockScreenProps) {
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      setErrorMsg('Por favor ingresa tu Clave o PIN de propietario');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await onUnlock(inputVal.trim());
      if (res.success) {
        setSuccessMsg('¡Acceso concedido! Entrando a la aplicación...');
      } else {
        setErrorMsg(res.message || 'Clave o PIN no válido. Este enlace fue desactivado.');
      }
    } catch {
      setErrorMsg('No se pudo verificar la clave. Revisa tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen patriotic-background font-sans text-zinc-100 flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden select-none">
      {/* Resplandor tricolor patriótico de fondo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-[450px] h-[450px] bg-[#CE1126]/30 rounded-full blur-[110px]" />
        <div className="absolute top-1/3 -right-24 w-[480px] h-[480px] bg-[#0067C6]/30 rounded-full blur-[110px]" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-[#00BCE4]/28 rounded-full blur-[120px]" />
      </div>

      <header className="max-w-md w-full mx-auto text-center relative z-10 mb-4">
        <div className="mb-3 px-2">
          <TriFlagRibbon className="h-2 w-full shadow-md" />
        </div>
      </header>

      <main className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center relative z-10 my-auto">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-zinc-800/90 relative text-center space-y-6">
          {/* Icono de seguridad con resplandor */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-red-500/50 flex items-center justify-center shadow-lg shadow-red-950/50 relative z-10">
                <Lock size={38} className="text-red-400 animate-pulse" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 z-20 shadow-md">
                <ShieldAlert size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-950/80 border border-red-700/60 text-red-400">
              Enlace Anterior Desactivado
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Acceso Privado Exclusivo
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
              El propietario ha restringido esta aplicación. El enlace anterior que se compartió ha sido desactivado permanentemente para proteger el acceso.
            </p>
          </div>

          {/* Formulario de ingreso de clave o PIN */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="text-left space-y-1.5">
              <label htmlFor="owner-pin-input" className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <KeyRound size={14} className="text-amber-400" />
                <span>¿Eres el propietario? Ingresa tu PIN o Clave</span>
              </label>

              <div className="relative">
                <input
                  id="owner-pin-input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Ej: PIN de 4 dígitos o Clave privada"
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full bg-zinc-900/90 border border-zinc-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-hidden transition font-mono tracking-wider"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center gap-2 text-left animate-shake">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2 text-left">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-linear-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] text-white shadow-lg shadow-red-950/50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
            >
              {loading ? (
                <span>Verificando...</span>
              ) : (
                <>
                  <span>Desbloquear y Entrar</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Caja explicativa para el propietario */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 text-left text-[11px] text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-300">💡 Nota de recuperación:</p>
            <p>
              Si eres el dueño y no tienes el nuevo link a mano, puedes ingresar con tu <span className="text-amber-300 font-bold">PIN de propietario</span>. Al ingresar, podrás copiar tu nuevo enlace privado permanente.
            </p>
          </div>
        </div>
      </main>

      <footer className="max-w-md w-full mx-auto text-center relative z-10 pt-4 text-[11px] text-zinc-500">
        <span>Algoritmo ZL · Sistema de Acceso Seguro Propietario</span>
      </footer>
    </div>
  );
}
