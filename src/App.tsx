/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FechasCalculator } from './components/FechasCalculator';
import { Ley13Calculator } from './components/Ley13Calculator';
import { CalculadoraRapida } from './components/CalculadoraRapida';
import { Sparkles, Dices, Layers, CalendarRange, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

export default function App() {
  const [number, setNumber] = useState('47');
  const [activeTab, setActiveTab] = useState<'ley13' | 'fechas'>('fechas');

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

  const paddedNumber = number.padStart(2, '0');
  const d1 = paddedNumber[0] || '0';
  const d2 = paddedNumber[1] || '0';

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 flex flex-col justify-between py-8 px-4 sm:px-6 select-none selection:bg-blue-500/20 selection:text-blue-400">
      {/* Background radial soft ambient lights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-[350px] h-[350px] bg-zinc-800/20 rounded-full blur-[100px]"></div>
      </div>

      <header className="max-w-md w-full mx-auto text-center mb-6 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[11px] font-medium text-blue-450 text-blue-400 uppercase tracking-widest shadow-md">
          <Sparkles size={11} className="animate-pulse text-blue-400" /> Numerología Avanzada
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mt-3 uppercase font-sans">
          ALGORITMOS
        </h1>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1.5 leading-relaxed">
          Ingresa un número de dos dígitos para sincronizar las matrices de cálculo ZL y la Pirámide de Fechas.
        </p>
      </header>

      <main className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center relative mb-12">
        <div className="glass-panel p-6 rounded-3xl shadow-2xl relative border border-zinc-800/80 space-y-6">
          
          {/* Visual dialing pad interface */}
          <div className="space-y-3">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider block text-center font-semibold">
              Dial de Número Base
            </label>
            
            <div className="flex items-center justify-center gap-4">
              {/* Tens digit block */}
              <div className="flex flex-col items-center">
                <button
                  id="btn-tens-up"
                  onClick={() => adjustDigit('tens', 'up')}
                  className="p-1 text-zinc-500 hover:text-blue-400 transition"
                  title="Aumentar decenas"
                >
                  <ChevronUp size={24} />
                </button>
                <div className="w-16 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                  <span className="text-4xl font-extrabold font-mono text-white transition-all group-hover:text-blue-400">
                    {d1}
                  </span>
                </div>
                <button
                  id="btn-tens-down"
                  onClick={() => adjustDigit('tens', 'down')}
                  className="p-1 text-zinc-500 hover:text-blue-400 transition"
                  title="Disminuir decenas"
                >
                  <ChevronDown size={24} />
                </button>
              </div>

              {/* Separation dot */}
              <div className="text-zinc-600 font-mono text-3xl font-semibold select-none">:</div>

              {/* Units digit block */}
              <div className="flex flex-col items-center">
                <button
                  id="btn-units-up"
                  onClick={() => adjustDigit('units', 'up')}
                  className="p-1 text-zinc-500 hover:text-blue-400 transition"
                  title="Aumentar unidades"
                >
                  <ChevronUp size={24} />
                </button>
                <div className="w-16 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                  <span className="text-4xl font-extrabold font-mono text-white transition-all group-hover:text-blue-400">
                    {d2}
                  </span>
                </div>
                <button
                  id="btn-units-down"
                  onClick={() => adjustDigit('units', 'down')}
                  className="p-1 text-zinc-500 hover:text-blue-400 transition"
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
                  placeholder="Ingrese número"
                  className="w-full bg-zinc-950 text-center font-mono font-bold text-lg p-3 rounded-2xl border border-zinc-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 tracking-widest focus:outline-none placeholder-zinc-700 transition"
                  title="Ingresa un número manualmente"
                />
                
                {/* Random lucky selector */}
                <button
                  id="btn-random"
                  onClick={setRandomNumber}
                  className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-blue-400 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition flex items-center justify-center shrink-0 shadow-sm"
                  title="Número al azar"
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

          {/* Symmetrical Segmented Tabs Switcher */}
          <div className="space-y-4">
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900">
              <button
                id="tab-fechas"
                onClick={() => setActiveTab('fechas')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'fechas'
                    ? 'bg-zinc-900 text-blue-400 border border-zinc-800 font-semibold shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <CalendarRange size={13} />
                <span>Pirámide de Fechas</span>
              </button>
              <button
                id="tab-ley13"
                onClick={() => setActiveTab('ley13')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'ley13'
                    ? 'bg-zinc-900 text-blue-400 border border-zinc-800 font-semibold shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Layers size={13} />
                <span>ZL</span>
              </button>
            </div>

            {/* Tab view with light sliding/rendering animation */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab + number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'fechas' ? (
                    <FechasCalculator numberStr={paddedNumber} />
                  ) : (
                    <Ley13Calculator numberStr={paddedNumber} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <hr className="border-t border-zinc-900" />

          {/* Quick interactive math calculator Section */}
          <CalculadoraRapida />
          
        </div>
      </main>

      <footer className="max-w-md w-full mx-auto text-center text-zinc-600 text-[11px] font-mono border-t border-zinc-900 pt-3 relative">
        <span>© {new Date().getFullYear()} Algoritmos de Suerte</span>
        <span className="block mt-0.5 text-zinc-700">Calculado bajo sincronía de residuo entero (Modulo 10).</span>
      </footer>
    </div>
  );
}

