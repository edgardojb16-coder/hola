/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  Tablet,
  Radio,
  Edit2,
  Check,
  X,
  Users,
  RefreshCw,
  Clock
} from 'lucide-react';
import {
  DeviceInfo,
  DevicePingResponse,
  sendDevicePing,
  renameDeviceOnServer,
  getOrCreateDeviceId,
  getSavedDeviceName
} from '../utils';

export const DeviceTrackerFooter: React.FC = () => {
  const [data, setData] = useState<DevicePingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Edición de nombre del dispositivo actual
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [savingName, setSavingName] = useState<boolean>(false);

  const currentDeviceId = getOrCreateDeviceId();
  const currentSavedName = getSavedDeviceName();

  // Función para enviar pulso periódico al servidor
  const ping = async () => {
    try {
      const res = await sendDevicePing();
      setData(res);
    } catch (err) {
      console.error('Error al sincronizar dispositivo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Ping inicial
    ping();

    // Pulso periódico cada 40 segundos para mantener el conteo activo en vivo
    const interval = setInterval(() => {
      ping();
    }, 40000);

    return () => clearInterval(interval);
  }, []);

  const handleStartEditing = () => {
    setNameInput(currentSavedName);
    setIsEditing(true);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    try {
      setSavingName(true);
      await renameDeviceOnServer(nameInput.trim());
      setIsEditing(false);
      await ping();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  // Ayudante de icono según plataforma
  const getDeviceIcon = (platform: string) => {
    const p = (platform || '').toLowerCase();
    if (p.includes('ipad') || p.includes('tablet')) {
      return <Tablet size={15} className="text-cyan-400 shrink-0" />;
    }
    if (p.includes('windows') || p.includes('mac') || p.includes('linux')) {
      return <Laptop size={15} className="text-blue-400 shrink-0" />;
    }
    return <Smartphone size={15} className="text-emerald-400 shrink-0" />;
  };

  // Formato de tiempo relativo
  const formatTimeAgo = (isoString: string, isOnline: boolean) => {
    if (isOnline) return 'En línea ahora';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Hace un momento';
      if (mins < 60) return `Hace ${mins} min`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `Hace ${hours} h`;
      const days = Math.floor(hours / 24);
      return `Hace ${days} d`;
    } catch {
      return 'Reciente';
    }
  };

  return (
    <div className="mt-3 flex flex-col items-center select-none">
      {/* Botón principal del pie de página */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-300 transition-all shadow-md active:scale-95"
        title="Ver dispositivos conectados y registrados"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>

        <span className="font-semibold text-white">
          {data ? data.activeCount : 1} en línea
        </span>

        <span className="text-zinc-600">·</span>

        <span className="text-zinc-400 group-hover:text-zinc-200 transition">
          {data ? data.totalCount : 1} {data?.totalCount === 1 ? 'dispositivo' : 'dispositivos'}
        </span>

        <span className="text-zinc-600">·</span>

        <span className="text-[10px] text-amber-300/90 font-mono flex items-center gap-1 max-w-[140px] truncate">
          <Smartphone size={11} className="shrink-0 text-amber-400" />
          <span className="truncate">{currentSavedName}</span>
        </span>
      </button>

      {/* Modal con la lista completa y editor de nombre */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col">
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Radio size={16} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Dispositivos Conectados
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Registro de equipos que usan la aplicación
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tarjeta: Tu dispositivo actual */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 shadow-inner shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <span>📱 Tu dispositivo (Este equipo)</span>
                </span>
                {!isEditing && (
                  <button
                    onClick={handleStartEditing}
                    className="text-[10px] font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <Edit2 size={11} />
                    <span>Cambiar nombre</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    maxLength={35}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Ej: Celular de Juan"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 transition"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={savingName || !nameInput.trim()}
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition flex items-center justify-center shrink-0"
                    title="Guardar nombre"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition flex items-center justify-center shrink-0"
                    title="Cancelar"
                  >
                    <X size={14} />
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white font-mono truncate">
                    {currentSavedName}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Activo ahora
                  </span>
                </div>
              )}
            </div>

            {/* Lista de Dispositivos Registrados */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Equipos Registrados ({data?.totalCount ?? 0})
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {data?.activeCount ?? 0} en línea
                </span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-amber-400" />
                  <span>Cargando equipos...</span>
                </div>
              ) : data?.devices && data.devices.length > 0 ? (
                <div className="space-y-1.5">
                  {data.devices.map((device) => {
                    const isCurrent = device.id === currentDeviceId;

                    return (
                      <div
                        key={device.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                          isCurrent
                            ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getDeviceIcon(device.platform)}

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-200 truncate flex items-center gap-1.5">
                              <span className="truncate">{device.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-md shrink-0">
                                  Tú
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <Clock size={10} />
                              <span>{formatTimeAgo(device.lastSeen, device.isOnline)}</span>
                            </p>
                          </div>
                        </div>

                        {/* Indicador de estado */}
                        <div className="flex items-center gap-1 shrink-0">
                          {device.isOnline ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              En línea
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                              Desconectado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-zinc-500 text-xs">
                  Aún no hay otros dispositivos registrados.
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
              <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                <Users size={12} />
                <span>Actualización automática</span>
              </span>

              <button
                onClick={ping}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition flex items-center gap-1 text-[10px]"
              >
                <RefreshCw size={11} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
