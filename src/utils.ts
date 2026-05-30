/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Equality mapping: maps each digit to its dual counterpart (+5 mod 10)
export const EQUALITY_MAP: Record<string, string> = {
  '0': '5',
  '1': '6',
  '2': '7',
  '3': '8',
  '4': '9',
  '5': '0',
  '6': '1',
  '7': '2',
  '8': '3',
  '9': '4'
};

/**
 * Maps a string of digits to its equality dual representation.
 */
export function getEquality(numberStr: string): string {
  return numberStr
    .split('')
    .map(digit => EQUALITY_MAP[digit] || digit)
    .join('');
}

export interface Ley13Result {
  padded: string;
  n1: number;
  n2: number;
  r1: number;
  r2: number;
  ley: string;
   igual: string;
}

/**
 * Calculates Law 13 properties for a given numeric string.
 */
export function calculateLey13(numberStr: string): Ley13Result {
  const padded = numberStr.padStart(2, '0').slice(-2);
  const n1 = parseInt(padded[0], 10) || 0;
  const n2 = parseInt(padded[1], 10) || 0;

  const r1 = (1 - n1 + 10) % 10;
  const r2 = (3 - n2 + 10) % 10;

  const ley = `${r1}${r2}`;
  const igual = getEquality(ley);

  return { padded, n1, n2, r1, r2, ley, igual };
}

export interface FechasResult {
  padded: string;
  x: number;
  y: number;
  centro: number;
  izq: number;
  der: number;
  final: number;
  jugar: string[];
}

/**
 * Calculates Dates (Fechas Pyramid) properties for a given numeric string.
 */
export function calculateFechas(numberStr: string): FechasResult {
  const padded = numberStr.padStart(2, '0').slice(-2);
  const x = parseInt(padded[0], 10) || 0;
  const y = parseInt(padded[1], 10) || 0;

  const centro = (x + y) % 10;
  const izq = (centro + x) % 10;
  const der = (centro + y) % 10;
  const final = (izq + der) % 10;

  // Recommended numbers lists:
  const jugar = [
    `${centro}${izq}`,
    `${centro}${der}`,
    `${centro}${final}`,
    `${padded}`,
    `${x}${final}`,
    `${y}${final}`
  ];

  return { padded, x, y, centro, izq, der, final, jugar };
}
