/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ley13Calculator } from './components/Ley13Calculator';
import { SorteoAnguila } from './components/SorteoAnguila';
import { MonazosTica } from './components/MonazosTica';
import { TiemposTica } from './components/TiemposTica';
import { AlgoritmoMonasus } from './components/AlgoritmoMonasus';
import { LaDiariaHonduras } from './components/LaDiariaHonduras';
import { NumeroDelDia } from './components/NumeroDelDia';
import { DeviceTrackerFooter } from './components/DeviceTrackerFooter';
import { AccessLockScreen } from './components/AccessLockScreen';
import { SecurityManagerModal } from './components/SecurityManagerModal';
import { CornerMenu, AppTabId } from './components/CornerMenu';
import {
  LotteryCountry,
  COUNTRIES,
  FlagCostaRica,
  FlagNicaragua,
  FlagHonduras,
  TriFlagRibbon,
} from './components/FlagBadges';
import { Sparkles, Dices, ChevronUp, ChevronDown, Calendar, Hash, Lock, ShieldCheck, Clock } from 'lucide-react';
import { verifyAuth, getStoredAuthKey } from './utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTabId>('zl');
  const [selectedCountry] = useState<LotteryCountry>('all');
  const [number, setNumber] = useState('47');

  // Control de acceso exclusivo para el propietario
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [monasusUnlockedKey, setMonasusUnlockedKey] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const urlKey = params.get('clave') || params.get('key') || params.get('token') || params.get('pin');
      const savedKey = getStoredAuthKey();

      const candidate = urlKey || savedKey;

      if (candidate) {
        try {
          const res = await verifyAuth(candidate);
          if (res.valid) {
            setIsAuthorized(true);
            return;
          }
        } catch (e) {
          console.error('Error validating auth:', e);
        }
      }

      setIsAuthorized(false);
    };

    checkAuth();
  }, []);

  const handleUnlock = async (keyOrPin: string) => {
    try {
      const res = await verifyAuth(keyOrPin);
      if (res.valid) {
        setIsAuthorized(true);
        return { success: true };
      }
      return { success: false, message: res.error || 'Clave o PIN no válido' };
    } catch {
      return { success: false, message: 'Error conectando con el servidor' };
    }
  };

  // Increment or decrement overall value
  const adjustBy = (amount: number) => {
    let val = parseInt(number, 10) || 0;
    val = (val + amount + 100) % 100;
    setNumber(String(val).padStart(2, '0'));
  };

  // Adjust a single digit individually (tens or units)
  const adjustDigit = (position: 'tens' | 'units', direction: 'up' | 'down') => {
    const padded = number.padStart(2, '0');
    let d1 = parseInt(padded[0], 10) || 0;
    let d2 = parseInt(padded[1], 10) || 0;

    if (position === 'tens') {
      d1 = direction === 'up' ? (d1 + 1) % 10 : (d1 - 1 + 10) % 10;
    } else {
      d2 = direction === 'up' ? (d2 + 1) % 10 : (d2 - 1 + 10) % 10;
    }

    setNumber(`${d1}${d2}`);
  };

  // Set randomized lucky digits
  const setRandomNumber = () => {
    const random = Math.floor(Math.random() * 100);
    setNumber(String(random).padStart(2, '0'));
  };

  // Format valid input typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9]/g, '').slice(-2);
    setNumber(clean);
  };

  // Fecha actual siempre actualizada en tiempo real
  const getFormattedToday = () => {
    const now = new Date();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const diaSemana = dias[now.getDay()];
    const diaNumero = now.getDate();
    const mesNombre = meses[now.getMonth()];
    const anio = now.getFullYear();
    return `${diaSemana} ${diaNumero} de ${mesNombre} del ${anio}`;
  };

  const [currentDate, setCurrentDate] = useState(getFormattedToday);

  // Mantener la fecha actualizada si pasa la medianoche
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(getFormattedToday());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Mientras se verifica la autenticación
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen patriotic-background font-sans text-zinc-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-400 font-medium">Verificando acceso privado...</span>
        </div>
      </div>
    );
  }

  // Si no está autorizado (enlace anterior desactivado / sin clave o PIN)
  if (!isAuthorized) {
    return <AccessLockScreen onUnlock={handleUnlock} />;
  }

  const paddedNumber = number.padStart(2, '0');
  const d1 = paddedNumber[0] || '0';
  const d2 = paddedNumber[1] || '0';

  const inputPlaceholder = 'Número para CR, NI o HN';

  return (
    <div className="min-h-screen patriotic-background font-sans text-zinc-100 flex flex-col justify-between py-6 px-4 sm:px-6 select-none selection:bg-red-500/20 selection:text-red-400 relative overflow-x-hidden">
      {/* Modal de gestión de seguridad del propietario */}
      <SecurityManagerModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />

      {/* Luces y resplandores vivos de las tres banderas (Costa Rica, Nicaragua y Honduras) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Rojo vibrante de la bandera de Costa Rica */}
        <div className="absolute -top-20 -left-20 w-[450px] h-[450px] bg-[#CE1126]/35 rounded-full blur-[110px]" />
        {/* Azul Cobalto profundo de la bandera de Nicaragua */}
        <div className="absolute top-1/4 -right-24 w-[480px] h-[480px] bg-[#0067C6]/35 rounded-full blur-[110px]" />
        {/* Celeste / Turquesa de la bandera de Honduras */}
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-[#00BCE4]/32 rounded-full blur-[120px]" />
        {/* Luz blanca central suave */}
        <div className="absolute top-1/2 left-1/4 w-[280px] h-[280px] bg-white/5 rounded-full blur-[80px]" />
      </div>

      <header className="max-w-md w-full mx-auto text-center mb-4 relative z-30">
        {/* Cinta patriótica superior con las 3 banderas */}
        <div className="mb-3 px-2">
          <TriFlagRibbon className="h-2 w-full shadow-md" />
        </div>

        {/* Fila superior con badge a la izquierda y menucito desplegable en la esquina derecha */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900/95 border border-zinc-800 rounded-full text-[11px] font-medium text-zinc-300 uppercase tracking-widest shadow-md backdrop-blur-sm">
            <Sparkles size={11} className="text-amber-400 animate-pulse" />
            <span>Algoritmo ZL</span>
            <span className="text-zinc-600">·</span>
            <div className="inline-flex items-center gap-1">
              <FlagCostaRica className="w-3.5 h-2.5" />
              <FlagNicaragua className="w-3.5 h-2.5" />
              <FlagHonduras className="w-3.5 h-2.5" />
            </div>
          </div>

          <CornerMenu
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenSecurity={() => setShowSecurityModal(true)}
          />
        </div>

        {/* Barra de Fecha de hoy */}
        <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
          <div
            id="live-today-date"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900/95 border border-zinc-800 rounded-full text-xs font-medium text-zinc-300 shadow-md backdrop-blur-sm transition-all hover:border-zinc-700"
          >
            <Calendar size={13} className="text-amber-400 shrink-0" />
            <span className="text-zinc-400">Hoy:</span>
            <span className="text-white font-semibold capitalize tracking-wide">{currentDate}</span>
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5"
              title="Fecha actualizada en tiempo real"
            />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-2.5">
          Algoritmo ZL Loterías
        </h1>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
          Probabilidad y cálculo para la{' '}
          <span className="text-red-400 font-semibold">Lotería de Costa Rica</span>,{' '}
          <span className="text-blue-400 font-semibold">Lotería de Nicaragua</span> y{' '}
          <span className="text-cyan-400 font-semibold">Lotería de Honduras</span>.
        </p>
      </header>

      <main className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center relative mb-8 z-10">
        {/* Pestañas Principales */}
        <div className="grid grid-cols-3 gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 mb-4 shadow-lg backdrop-blur-sm">
          <button
            id="tab-btn-zl"
            onClick={() => setActiveTab('zl')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 select-none leading-tight text-center ${
              activeTab === 'zl'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Hash size={14} className="shrink-0" />
            <span>Algoritmo ZL</span>
          </button>
          <button
            id="tab-btn-diaria"
            onClick={() => setActiveTab('diaria')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 select-none leading-tight text-center ${
              activeTab === 'diaria'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Clock size={14} className="shrink-0" />
            <span>Ayer y Hoy</span>
          </button>
          <button
            id="tab-btn-dia"
            onClick={() => setActiveTab('dia')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 select-none leading-tight text-center ${
              activeTab === 'dia'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-950/50 font-black'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Calendar size={14} className="shrink-0" />
            <span>Número del Día</span>
          </button>
        </div>

        <div className="glass-panel p-5 sm:p-6 rounded-3xl shadow-2xl relative border border-zinc-800/80 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'zl' ? (
              <motion.div
                key="tab-zl"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Visual dialing pad interface */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] sm:text-[11px] text-zinc-300 uppercase tracking-wider font-bold">
                      ¿Qué número cayó anteriormente?
                    </label>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
                      <span>🇨🇷 · 🇳🇮 · 🇭🇳 Modo Trinacional</span>
                    </div>
                  </div>

                  {/* Digit Wheels */}
                  <div className="flex justify-center items-center gap-3 sm:gap-4 my-2">
                    {/* Tens position column */}
                    <div className="flex flex-col items-center bg-zinc-900/90 rounded-2xl p-2 border border-zinc-800 shadow-md">
                      <button
                        id="btn-tens-up"
                        onClick={() => adjustDigit('tens', 'up')}
                        className="p-1 text-zinc-500 hover:text-white transition"
                        title="Aumentar decenas"
                      >
                        <ChevronUp size={24} />
                      </button>
                      <span className="text-4xl sm:text-5xl font-mono font-bold my-1 text-white w-12 text-center select-none">
                        {d1}
                      </span>
                      <button
                        id="btn-tens-down"
                        onClick={() => adjustDigit('tens', 'down')}
                        className="p-1 text-zinc-500 hover:text-white transition"
                        title="Disminuir decenas"
                      >
                        <ChevronDown size={24} />
                      </button>
                    </div>

                    <span className="text-2xl font-black text-zinc-600">:</span>

                    {/* Units position column */}
                    <div className="flex flex-col items-center bg-zinc-900/90 rounded-2xl p-2 border border-zinc-800 shadow-md">
                      <button
                        id="btn-units-up"
                        onClick={() => adjustDigit('units', 'up')}
                        className="p-1 text-zinc-500 hover:text-white transition"
                        title="Aumentar unidades"
                      >
                        <ChevronUp size={24} />
                      </button>
                      <span className="text-4xl sm:text-5xl font-mono font-bold my-1 text-white w-12 text-center select-none">
                        {d2}
                      </span>
                      <button
                        id="btn-units-down"
                        onClick={() => adjustDigit('units', 'down')}
                        className="p-1 text-zinc-500 hover:text-white transition"
                        title="Disminuir unidades"
                      >
                        <ChevronDown size={24} />
                      </button>
                    </div>
                  </div>

                  {/* Quick Helper Adjustment Controls & Text Input */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        id="input-numero"
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={number}
                        onChange={handleInputChange}
                        placeholder={inputPlaceholder}
                        className="w-full bg-zinc-950 text-center font-mono font-bold text-lg p-3 rounded-2xl border border-zinc-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 tracking-widest focus:outline-none placeholder-zinc-600 transition"
                        title="Ingresa el número para calcular"
                      />

                      {/* Random lucky selector */}
                      <button
                        id="btn-random"
                        onClick={setRandomNumber}
                        className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition flex items-center justify-center shrink-0 shadow-sm"
                        title="Generar número de la suerte al azar"
                      >
                        <Dices size={20} />
                      </button>
                    </div>

                    {/* Increments inline bar */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                      <button
                        id="btn-adjust-down"
                        onClick={() => adjustBy(-1)}
                        className="py-1.5 rounded-lg bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-900 hover:border-zinc-800 transition"
                      >
                        -1 Decrementar
                      </button>
                      <button
                        id="btn-adjust-up"
                        onClick={() => adjustBy(1)}
                        className="py-1.5 rounded-lg bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-900 hover:border-zinc-800 transition"
                      >
                        +1 Incrementar
                      </button>
                    </div>
                  </div>
                </div>

                <hr className="border-t border-zinc-900" />

                {/* Sección de resultados según pestaña activa */}
                <div className="relative">
                  <Ley13Calculator
                    numberStr={paddedNumber}
                    selectedCountry={selectedCountry}
                    currentDay={new Date().getDate()}
                    currentMonth={new Date().getMonth() + 1}
                    currentYear={new Date().getFullYear()}
                  />
                </div>
              </motion.div>
            ) : activeTab === 'diaria' ? (
              <motion.div
                key="tab-diaria"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <LaDiariaHonduras />
              </motion.div>
            ) : activeTab === 'anguila' ? (
              <motion.div
                key="tab-anguila"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <SorteoAnguila />
              </motion.div>
            ) : activeTab === 'monazos' ? (
              <motion.div
                key="tab-monazos"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <MonazosTica />
              </motion.div>
            ) : activeTab === 'tiempos' ? (
              <motion.div
                key="tab-tiempos"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <TiemposTica
                  unlockedKey={monasusUnlockedKey}
                  onUnlock={(key) => setMonasusUnlockedKey(key)}
                  onLock={() => setMonasusUnlockedKey(null)}
                />
              </motion.div>
            ) : activeTab === 'monasus' ? (
              <motion.div
                key="tab-monasus"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <AlgoritmoMonasus
                  unlockedKey={monasusUnlockedKey}
                  onUnlock={(key) => setMonasusUnlockedKey(key)}
                  onLock={() => setMonasusUnlockedKey(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="tab-dia"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <NumeroDelDia />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="max-w-md w-full mx-auto text-center text-zinc-500 text-[11px] font-mono border-t border-zinc-900 pt-3 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className="flex items-center gap-1">
            <FlagCostaRica className="w-3.5 h-2.5" /> Costa Rica
          </span>
          <span className="text-zinc-700">·</span>
          <span className="flex items-center gap-1">
            <FlagNicaragua className="w-3.5 h-2.5" /> Nicaragua
          </span>
          <span className="text-zinc-700">·</span>
          <span className="flex items-center gap-1">
            <FlagHonduras className="w-3.5 h-2.5" /> Honduras
          </span>
        </div>
        <div>
          <span>© {new Date().getFullYear()} Algoritmo ZL Loterías Centroamérica</span>
        </div>

        {/* Indicador de dispositivos conectados y registrados con nombre */}
        <DeviceTrackerFooter />
      </footer>
    </div>
  );
}
