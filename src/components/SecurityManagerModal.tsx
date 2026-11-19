/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Key,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Lock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  fetchSecurityInfo,
  regenerateAccessKey,
  updateOwnerPin,
  getStoredAuthKey,
} from '../utils';

interface SecurityManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyRegenerated?: (newKey: string) => void;
}

export function SecurityManagerModal({ isOpen, onClose, onKeyRegenerated }: SecurityManagerModalProps) {
  const [secretKey, setSecretKey] = useState<string>('');
  const [masterPin, setMasterPin] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmRegen, setShowConfirmRegen] = useState(false);

  // Cargar datos de seguridad
  const loadInfo = async () => {
    try {
      setLoading(true);
      const data = await fetchSecurityInfo();
      setSecretKey(data.secretKey);
      setMasterPin(data.masterPin);
      setNewPinInput(data.masterPin);
    } catch {
      const fallbackKey = getStoredAuthKey() || 'ZL-PRIVADO-8821';
      setSecretKey(fallbackKey);
      setMasterPin('1021');
      setNewPinInput('1021');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInfo();
      setStatusMsg(null);
      setShowConfirmRegen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Construir el enlace privado completo para el propietario
  const getPrivateUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?clave=${secretKey}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getPrivateUrl());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      setStatusMsg({ type: 'success', text: '¡Enlace privado copiado! Guárdalo en tus favoritos o marcadores.' });
    } catch {
      setStatusMsg({ type: 'error', text: 'No se pudo copiar automáticamente. Copia el texto manualmente.' });
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinInput.trim() || newPinInput.trim().length < 4) {
      setStatusMsg({ type: 'error', text: 'El PIN debe tener al menos 4 caracteres o dígitos' });
      return;
    }

    try {
      setLoading(true);
      const res = await updateOwnerPin(newPinInput.trim());
      setMasterPin(res.masterPin);
      setStatusMsg({ type: 'success', text: `PIN actualizado con éxito a: ${res.masterPin}` });
    } catch {
      setStatusMsg({ type: 'error', text: 'No se pudo actualizar el PIN' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      setStatusMsg(null);
      const res = await regenerateAccessKey();
      setSecretKey(res.newKey);
      setMasterPin(res.masterPin);
      setShowConfirmRegen(false);
      setStatusMsg({
        type: 'success',
        text: '¡Nuevo enlace generado! El enlace anterior que habías compartido quedó 100% DESACTIVADO.',
      });
      if (onKeyRegenerated) {
        onKeyRegenerated(res.newKey);
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Error regenerando el enlace privado' });
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Encabezado del modal */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Lock size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Mi Enlace Privado Exclusivo</span>
                <span className="text-[10px] font-semibold bg-emerald-950 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-full">
                  Solo tú
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Control de acceso y desactivación de enlaces compartidos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 overflow-y-auto space-y-5 text-zinc-200 text-xs sm:text-sm">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-red-950/60 border-red-800 text-red-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <ShieldCheck size={16} className="shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="shrink-0 text-red-400 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Bloque 1: Tu nuevo link privado */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Key size={14} />
                <span>Tu Enlace Nuevo y Secreto</span>
              </span>
              <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">
                Clave: {secretKey || 'Cargando...'}
              </span>
            </div>

            <div className="p-2.5 bg-black/60 rounded-xl border border-zinc-800 font-mono text-[11px] text-emerald-400 break-all select-all">
              {getPrivateUrl()}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-md shadow-emerald-950/40 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Mi Enlace Privado'}</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              ⭐ <strong>¿Cómo funciona?</strong> Solo quienes tengan este enlace con tu clave podrán entrar. El enlace original sin clave ya está completamente <strong>bloqueado</strong>.
            </p>
          </div>

          {/* Bloque 2: Tu PIN de Propietario */}
          <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={14} className="text-cyan-400" />
                <span>PIN Maestro de Propietario</span>
              </span>
              <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-md">
                PIN Actual: {masterPin}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-snug">
              Si entras desde otro teléfono o navegador sin el link completo, puedes escribir este PIN en la pantalla de bloqueo para desbloquear tu app al instante.
            </p>

            <form onSubmit={handleUpdatePin} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Nuevo PIN (ej. 1021)"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                className="flex-1 bg-black/50 border border-zinc-700 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-xs font-mono text-white outline-hidden"
              />
              <button
                type="submit"
                disabled={loading || newPinInput === masterPin}
                className="px-3 py-1.5 rounded-xl font-semibold text-xs bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] text-white disabled:opacity-40 transition cursor-pointer"
              >
                Cambiar PIN
              </button>
            </form>
          </div>

          {/* Bloque 3: Regenerar / Desactivar y crear link nuevo */}
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert size={15} />
              <span>Desactivar Todo y Crear Nuevo Link</span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Si alguna vez vuelves a compartir tu link por error, presiona este botón. Al instante se creará un link totalmente nuevo y el que compartiste dejará de funcionar para siempre.
            </p>

            {!showConfirmRegen ? (
              <button
                onClick={() => setShowConfirmRegen(true)}
                className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-red-950 text-red-300 border border-red-800/60 hover:border-red-600 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Desactivar este enlace y generar uno nuevo</span>
              </button>
            ) : (
              <div className="p-3 bg-red-950/80 border border-red-700 rounded-xl space-y-2">
                <p className="text-[11px] font-bold text-red-200">
                  ¿Confirmas que deseas desactivar el enlace actual de inmediato?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="flex-1 py-1.5 px-3 rounded-lg font-bold text-xs bg-red-600 hover:bg-red-500 text-white transition cursor-pointer"
                  >
                    {regenerating ? 'Generando...' : 'Sí, Desactivar y Crear Nuevo'}
                  </button>
                  <button
                    onClick={() => setShowConfirmRegen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pie del modal */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
