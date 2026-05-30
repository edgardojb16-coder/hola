/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { calculateFechas, FechasResult } from '../utils';
import { Copy, Check, Plus } from 'lucide-react';

interface FechasCalculatorProps {
  numberStr: string;
}

export function FechasCalculator({ numberStr }: FechasCalculatorProps) {
  const data: FechasResult = calculateFechas(numberStr);
  const { x, y, centro, izq, der, final } = data;

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (num: string, index: number) => {
    try {
      await navigator.clipboard.writeText(num);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const combinations = [
    { value: `${centro}${izq}`, label: 'Centro + Izquierda', desc: 'Flujo Superior Izquierdo' },
    { value: `${izq}${final}`, label: 'Izquierda + Abajo', desc: 'Flujo Inferior Izquierdo' },
    { value: `${final}${der}`, label: 'Abajo + Derecha', desc: 'Flujo Inferior Derecho' },
    { value: `${der}${centro}`, label: 'Derecha + Centro', desc: 'Flujo Superior Derecho' }
  ];

  return (
    <div className="space-y-6">
      {/* Diagram Section */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        {/* Cruciform Diagram Section */}
        <div className="p-2 bg-zinc-950/40 rounded-xl border border-zinc-900 relative">
          <div className="text-center text-[10px] text-blue-400 uppercase tracking-widest font-bold pt-2 mb-2">
            Diagrama
          </div>
          
          <div className="relative w-64 h-64 mx-auto flex items-center justify-center my-2">
            {/* SVG Background Cross & Diamond Connectors */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-zinc-850 text-zinc-800/80" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3">
              {/* Diagonal Cross 'X' matching the sketch */}
              <line x1="15%" y1="15%" x2="85%" y2="85%" />
              <line x1="85%" y1="15%" x2="15%" y2="85%" />

              {/* Outside diamond boundary loops */}
              <path 
                d="M 128 40 L 40 128 L 128 216 L 216 128 Z" 
                fill="none" 
                stroke="rgba(59, 130, 246, 0.15)" 
                strokeWidth="1.5" 
                strokeDasharray="none"
              />
            </svg>

            {/* Grid elements mapping the exact diagram dimensions */}
            <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-2 relative z-10">
              
              {/* Row 1, Col 2: Centro */}
              <div className="col-start-2 row-start-1 flex flex-col items-center justify-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-12 h-12 rounded-full bg-zinc-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-black text-lg shadow-[0_0_12px_rgba(16,185,129,0.08)] relative"
                >
                  <span className="absolute -top-4 text-[7px] uppercase tracking-wider text-zinc-500 font-medium">Centro</span>
                  {centro}
                </motion.div>
              </div>

              {/* Row 2, Col 1: Izquierda */}
              <div className="col-start-1 row-start-2 flex items-center justify-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-12 h-12 rounded-full bg-zinc-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-black text-lg shadow-[0_0_12px_rgba(16,185,129,0.06)] relative"
                >
                  <span className="absolute -left-4 text-[7px] uppercase tracking-wider text-zinc-500 font-medium rotate-90 origin-right">Izq</span>
                  {izq}
                </motion.div>
              </div>

              {/* Row 2, Col 2: Middle Operator */}
              <div className="col-start-2 row-start-2 flex flex-col items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-blue-400 font-bold text-xs shadow-inner relative">
                  <span className="absolute -top-3.5 text-[6px] text-zinc-600 uppercase tracking-widest font-mono">Suma</span>
                  +
                </div>
              </div>

              {/* Row 2, Col 3: Derecha */}
              <div className="col-start-3 row-start-2 flex items-center justify-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-12 h-12 rounded-full bg-zinc-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-black text-lg shadow-[0_0_12px_rgba(16,185,129,0.06)] relative"
                >
                  <span className="absolute -right-4 text-[7px] uppercase tracking-wider text-zinc-500 font-medium -rotate-90 origin-left">Der</span>
                  {der}
                </motion.div>
              </div>

              {/* Row 3, Col 2: Final / Bottom */}
              <div className="col-start-2 row-start-3 flex flex-col items-center justify-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-12 h-12 rounded-full bg-zinc-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-black text-lg shadow-[0_0_12px_rgba(16,185,129,0.06)] relative"
                >
                  <span className="absolute -bottom-4 text-[7px] uppercase tracking-wider text-zinc-500 font-medium">Final</span>
                  {final}
                </motion.div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Suggested Numbers to Play (The exact 4 combinations matching the notebook) */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-zinc-300 font-medium text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-blue-400">⚡</span> Sencuencias del Diagrama
          </h3>
          <span className="text-[9px] text-zinc-500">Haz clic para copiar</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {combinations.map((comb, idx) => (
            <button
              id={`btn-play-comb-${idx}`}
              key={idx}
              onClick={() => handleCopy(comb.value, idx)}
              className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/60 hover:border-blue-500/30 transition-all text-center focus:outline-none focus:ring-1 focus:ring-blue-500/55"
            >
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold group-hover:text-zinc-400 transition-colors">
                {comb.label}
              </span>
              <span className="text-[8px] text-zinc-600 font-semibold tracking-wider font-mono mt-0.5">
                {comb.desc}
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400 group-hover:text-emerald-300 transition-colors mt-2 tracking-wider">
                {comb.value}
              </span>

              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                {copiedIndex === idx ? (
                  <Check size={11} className="text-emerald-400" />
                ) : (
                  <Copy size={11} className="text-zinc-500" />
                )}
              </div>

              {copiedIndex === idx && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-zinc-900/95 rounded-xl border border-emerald-500/50"
                >
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Check size={12} /> {comb.value} Copiado
                  </span>
                </motion.div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
