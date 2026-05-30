/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { calculateLey13, Ley13Result } from '../utils';
import { Copy, Check, HelpCircle } from 'lucide-react';

interface Ley13CalculatorProps {
  numberStr: string;
}

export function Ley13Calculator({ numberStr }: Ley13CalculatorProps) {
  const data: Ley13Result = calculateLey13(numberStr);
  const { padded, n1, n2, r1, r2, ley, igual } = data;

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Core Transform Summary Badges (clickable) */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <h3 className="text-zinc-300 font-medium text-xs uppercase tracking-wider">Resultados Finales Guardados</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Base badge */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Número Base</span>
              <span className="text-lg font-bold font-mono text-zinc-200">{padded}</span>
            </div>
            <button
              id="btn-copy-base"
              onClick={() => handleCopy(padded, 'base')}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/60 transition"
              title="Copiar número base"
            >
              {copiedKey === 'base' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>

          {/* Ley 13 Badge */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-emerald-950 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-2 rounded-bl bg-emerald-500"></div>
            <div>
              <span className="text-[10px] text-emerald-500 uppercase tracking-wider block font-semibold">Cifra ZL</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{ley}</span>
            </div>
            <button
              id="btn-copy-ley"
              onClick={() => handleCopy(ley, 'ley')}
              className="p-2 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-zinc-900/60 transition"
              title="Copiar cifra ZL"
            >
              {copiedKey === 'ley' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>

          {/* Equality Badge */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Igualdad (Dual)</span>
              <span className="text-lg font-bold font-mono text-zinc-200">{igual}</span>
            </div>
            <button
              id="btn-copy-igual"
              onClick={() => handleCopy(igual, 'igual')}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/60 transition"
              title="Copiar igualdad dual"
            >
              {copiedKey === 'igual' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Detailed Full Sequence Panel */}
        <div className="mt-2 bg-zinc-950/60 rounded-xl p-3 border border-zinc-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase">Cadena de Secuencia</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-sm sm:text-base font-mono">
              <span className="text-zinc-300 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{padded}</span>
              <span className="text-zinc-600 font-normal">→</span>
              <span className="text-emerald-400 font-bold bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30">{ley}</span>
              <span className="text-zinc-600 font-normal">→</span>
              <span className="text-zinc-300 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{igual}</span>
            </div>
          </div>

          <button
            id="btn-copy-chain"
            onClick={() => handleCopy(`${padded} → ${ley} → ${igual}`, 'chain')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-805 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 font-sans text-xs font-medium text-zinc-200 flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            {copiedKey === 'chain' ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>¡Cofre copiado!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copiar Flujo Completo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Definition Notes */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
        <h4 className="text-zinc-300 font-medium text-xs uppercase tracking-wider flex items-center gap-1 text-zinc-400">
          <HelpCircle size={13} className="text-blue-400" /> ¿Qué es ZL?
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Es una fórmula numerológica que calcula los dígitos opuestos reguladores. El primer dígito se deduce restándole su valor a 
          <code className="text-blue-400 px-1 py-0.5 bg-zinc-950 font-mono text-[11px] rounded mx-1">1</code> 
          y el segundo restándole su valor a 
          <code className="text-blue-400 px-1 py-0.5 bg-zinc-950 font-mono text-[11px] rounded mx-1">3</code> 
          (ambos bajo aritmética de módulo 10). La igualdad posterior desplaza el resultado en 5 unidades para encontrar su frecuencia dual idéntica.
        </p>
      </div>
    </div>
  );
}
