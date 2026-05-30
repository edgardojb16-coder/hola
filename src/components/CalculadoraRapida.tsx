/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Minus, Calculator } from 'lucide-react';

export function CalculadoraRapida() {
  const [val1, setVal1] = useState<string>('56');
  const [val2, setVal2] = useState<string>('10');

  const n1 = parseFloat(val1) || 0;
  const n2 = parseFloat(val2) || 0;

  const suma = n1 + n2;
  const resta = n1 - n2;

  const restaValida = resta >= 0 && resta <= 99;
  const sumaValida = suma >= 0 && suma <= 99;

  const formatWithPad = (val: number) => {
    if (Number.isInteger(val)) {
      return String(val).padStart(2, '0');
    }
    return String(val);
  };

  return (
    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
        <Calculator className="text-blue-400" size={16} />
        <h3 className="text-zinc-300 font-bold text-xs uppercase tracking-wider">
          #GOLD
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
            Número A
          </label>
          <input
            id="calc-input-a"
            type="number"
            value={val1}
            onChange={(e) => setVal1(e.target.value)}
            className="w-full bg-zinc-950 text-center font-mono font-bold text-sm p-2.5 rounded-xl border border-zinc-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition"
            placeholder="Ej. 56"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
            Número B
          </label>
          <input
            id="calc-input-b"
            type="number"
            value={val2}
            onChange={(e) => setVal2(e.target.value)}
            className="w-full bg-zinc-950 text-center font-mono font-bold text-sm p-2.5 rounded-xl border border-zinc-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition"
            placeholder="Ej. 10"
          />
        </div>
      </div>

      {/* Results panel */}
      <div className="space-y-2.5 pt-1">
        {/* Resta / Subtraction */}
        {restaValida && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-900/80">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-blue-950/30 border border-blue-900/30 text-blue-400">
                <Minus size={12} />
              </span>
              <span className="text-xs text-zinc-400 font-sans font-medium">Restar</span>
            </div>
            <div className="font-mono text-zinc-300 flex items-center pr-1.5">
              <strong className="text-emerald-400 text-base font-bold tracking-wider">{formatWithPad(resta)}</strong>
            </div>
          </div>
        )}

        {/* Suma / Addition */}
        {sumaValida && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-900/80">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-blue-950/30 border border-blue-900/30 text-blue-400">
                <Plus size={12} />
              </span>
              <span className="text-xs text-zinc-400 font-sans font-medium">Sumar</span>
            </div>
            <div className="font-mono text-zinc-300 flex items-center pr-1.5">
              <strong className="text-emerald-400 text-base font-bold tracking-wider">{formatWithPad(suma)}</strong>
            </div>
          </div>
        )}

        {!restaValida && !sumaValida && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900/80 text-center text-xs text-zinc-500 italic">
            Resultados fuera de rango (solo se permiten valores entre 00 y 99)
          </div>
        )}
      </div>
    </div>
  );
}
