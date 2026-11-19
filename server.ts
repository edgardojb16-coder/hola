import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable CORS for mobile apps and external web clients
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-access-key, x-monasus-key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Mapeo dual confidencial mantenido exclusivamente en servidor
const EQUALITY_MAP: Record<string, string> = {
  '0': '5',
  '1': '6',
  '2': '7',
  '3': '8',
  '4': '9',
  '5': '0',
  '6': '1',
  '7': '2',
  '8': '3',
  '9': '4',
};

function getEquality(numberStr: string): string {
  return numberStr
    .split('')
    .map((digit) => EQUALITY_MAP[digit] || digit)
    .join('');
}

// Nuevo algoritmo de numerología para los números extras basado en la fecha del día
const IGUALDAD = [5, 6, 7, 8, 9, 0, 1, 2, 3, 4]; // IGUALDAD[d] = equivalente de d

// Cruz de un número de dos dígitos (a, b)
function cruz(a: number, b: number) {
  const suma = (a + b) % 10;
  const izq = (suma + a) % 10;
  const der = (suma + b) % 10;
  const abajo = (izq + der) % 10;
  return { suma, izq, der, abajo, horizontal: `${izq}${der}` };
}

// Entrada: día del mes (1-31). Devuelve un arreglo de números en texto.
function numerologiaDelDia(dia: number | string): string[] {
  const d = Number(dia);
  if (!Number.isInteger(d) || d < 1 || d > 31) {
    throw new Error("El día debe ser un entero entre 1 y 31");
  }

  const texto = String(d).padStart(2, "0"); // 5 -> "05"
  const a = Number(texto[0]);
  const b = Number(texto[1]);

  // 1) Cruz del día: solo la horizontal
  const horizontalDia = cruz(a, b).horizontal;

  // 2) Igualdad del día
  const ia = IGUALDAD[a];
  const ib = IGUALDAD[b];
  const igualdad = `${ia}${ib}`;

  // 3) Cruz de la igualdad
  const c = cruz(ia, ib);
  const tipo36 = `${c.suma}${ib}`;
  const tipo29 = `${(c.suma + c.abajo) % 10}${c.abajo}`;

  // 4) Quitar repetidos conservando el orden
  return [...new Set([horizontalDia, igualdad, c.horizontal, tipo36, tipo29])];
}

// Algoritmo de suma secuencial de dígitos de la fecha completa (Día, Mes, Año)
// Ejemplo usuario: 27/10/2026 -> 2+7=9; 9+1=10; 10+0=10; 10+2=12; 12+0=12; 12+2=14; 14+6=20 -> "20"
function sumaSecuencialFecha(dia: number, mes: number, anio: number): string {
  const dStr = String(dia).padStart(2, '0');
  const mStr = String(mes).padStart(2, '0');
  const yStr = String(anio);

  const allDigits = (dStr + mStr + yStr).split('').map((ch) => parseInt(ch, 10) || 0);
  const total = allDigits.reduce((acc, curr) => acc + curr, 0);
  return total < 10 ? `0${total}` : String(total);
}

function getCentralAmericaDate(): { day: number; month: number; year: number } {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  // Centroamérica UTC-6
  const centralTime = new Date(utc - 6 * 3600000);
  return {
    day: centralTime.getDate(),
    month: centralTime.getMonth() + 1,
    year: centralTime.getFullYear(),
  };
}

function calculateWithBase(numberStr: string, baseStr: string) {
  const paddedDirect = (numberStr || '0').padStart(2, '0').slice(-2);
  const n1 = parseInt(paddedDirect[0], 10) || 0;
  const n2 = parseInt(paddedDirect[1], 10) || 0;

  const paddedBase = (baseStr || '13').padStart(2, '0').slice(-2);
  const b1 = parseInt(paddedBase[0], 10) || 0;
  const b2 = parseInt(paddedBase[1], 10) || 0;

  // Fórmulas confidenciales usando la base (b1, b2)
  const r1 = (b1 - n1 + 10) % 10;
  const r2 = (b2 - n2 + 10) % 10;

  const direct = `${r1}${r2}`;
  const dual = getEquality(direct);

  // Invertido
  const baseReversed = paddedDirect.split('').reverse().join('');
  const rn1 = parseInt(baseReversed[0], 10) || 0;
  const rn2 = parseInt(baseReversed[1], 10) || 0;
  const rr1 = (b1 - rn1 + 10) % 10;
  const rr2 = (b2 - rn2 + 10) % 10;
  const reversed = `${rr1}${rr2}`;

  return {
    baseUsed: paddedBase,
    direct,
    dual,
    reversed,
  };
}

function getBaseDelDiaOptions(numStr: string): string[] {
  const clean = (numStr || '').padStart(2, '0').slice(-2);
  if (clean.length !== 2) return [];
  const a = clean[0];
  const b = clean[1];
  const qualifies = b === '0' || b === '1' || a === b;
  if (!qualifies) return [];

  let candidates: string[];
  if (b === '1') {
    // Ej: 61 -> [66, 60] (el par se queda con 61, el terminado en 0 pasa a su dual 16)
    candidates = [`${a}${a}`, `${a}0`];
  } else if (b === '0') {
    // Ej: 60 -> [61, 66]
    candidates = [`${a}1`, `${a}${a}`];
  } else {
    // Par (ej: 66) -> [61, 60]
    candidates = [`${a}1`, `${a}0`];
  }

  return Array.from(new Set(candidates)).filter((c) => c !== clean);
}

/**
 * Algoritmo ZL propietario y protegido en el backend.
 * Ningún usuario puede ver esta lógica inspeccionando el navegador.
 */
function calculateSecretZL(
  numberStr: string,
  dayInput?: number,
  monthInput?: number,
  yearInput?: number
) {
  // Base tradicional ZL: 13
  const zlCalc = calculateWithBase(numberStr, '13');
  const leyDirect = zlCalc.direct;
  const igualDirect = zlCalc.dual;

  const fuertes = [
    { label: 'Cifra ZL', value: leyDirect, id: 'ley', cardId: 'card-cifra-zl' },
    { label: 'Número Dual', value: igualDirect, id: 'igual', cardId: 'card-numero-dual' },
  ];

  // Fecha efectiva (Centroamérica UTC-6) o parámetros recibidos
  const centralDate = getCentralAmericaDate();
  const effectiveDay = (dayInput && Number.isInteger(dayInput) && dayInput >= 1 && dayInput <= 31)
    ? dayInput
    : centralDate.day;
  const effectiveMonth = (monthInput && Number.isInteger(monthInput) && monthInput >= 1 && monthInput <= 12)
    ? monthInput
    : centralDate.month;
  const effectiveYear = (yearInput && Number.isInteger(yearInput) && yearInput >= 2000 && yearInput <= 2100)
    ? yearInput
    : centralDate.year;

  // Fórmulas directas del número ingresado (Multiplicación de dígitos y Resta con el día de hoy)
  const paddedInput = (numberStr || '00').padStart(2, '0').slice(-2);
  const d1 = parseInt(paddedInput[0], 10) || 0;
  const d2 = parseInt(paddedInput[1], 10) || 0;
  const multiplicacion = String(d1 * d2).padStart(2, '0');
  const inputNumVal = parseInt(paddedInput, 10) || 0;
  const restaDia = String(Math.abs(inputNumVal - effectiveDay)).padStart(2, '0');
  const restaCien = String((100 - inputNumVal) % 100).padStart(2, '0');

  // Base del Día: misma analogía y código de ZL, pero usando la fecha del día como base en lugar de 13
  const dayBaseStr = String(effectiveDay).padStart(2, '0');
  const dayBaseCalc = calculateWithBase(numberStr, dayBaseStr);
  let directOptions = getBaseDelDiaOptions(dayBaseCalc.direct);
  let dualOptions = getBaseDelDiaOptions(dayBaseCalc.dual);

  // Repartir opciones entre las dos tarjetas cuando una tiene 2 opciones y la otra ninguna
  if (directOptions.length >= 2 && dualOptions.length === 0) {
    dualOptions = directOptions.slice(1);
    directOptions = [directOptions[0]];
  } else if (dualOptions.length >= 2 && directOptions.length === 0) {
    directOptions = dualOptions.slice(1);
    dualOptions = [dualOptions[0]];
  }

  const baseDelDia = {
    baseUsed: dayBaseCalc.baseUsed,
    direct: dayBaseCalc.direct,
    dual: dayBaseCalc.dual,
    directOptions,
    dualOptions,
    allNumbers: Array.from(new Set([dayBaseCalc.direct, dayBaseCalc.dual])),
  };

  // 1) Cálculo de números extras con el algoritmo de numerología del día
  const extrasList = numerologiaDelDia(effectiveDay);

  // 2) Nuevo número por fórmula de suma secuencial de fecha (Día, Mes, Año)
  const fechaSum = sumaSecuencialFecha(effectiveDay, effectiveMonth, effectiveYear);

  // 3) El Número Bomba del Día: 100 menos el día de hoy (ej: día 11 -> 89; día 10 -> 90)
  const bombaVal = 100 - effectiveDay;
  const numeroBombaDia = String(bombaVal % 100).padStart(2, '0');

  // Evitar duplicados en los verdes si coincide con fechaSum
  const greenExtrasList = extrasList.filter((val) => val !== fechaSum);

  const extras = [
    ...greenExtrasList.map((val, idx) => ({
      label: `Extra ${idx + 1}`,
      value: val,
      id: `extra-${idx + 1}`,
      cardId: `card-extra-${idx + 1}`,
      isSpecialOrange: false,
    })),
    {
      label: 'Suma de Fecha',
      value: fechaSum,
      id: 'extra-fecha-suma',
      cardId: 'card-extra-fecha-suma',
      isSpecialOrange: true,
    },
  ];

  const allNumbersList = Array.from(new Set([
    ...fuertes.map((f) => f.value),
    multiplicacion,
    restaDia,
    restaCien,
    ...baseDelDia.allNumbers,
    ...directOptions,
    ...dualOptions,
    ...extras.map((e) => e.value),
    numeroBombaDia,
  ]));

  return {
    fuertes,
    extras,
    numeroBombaDia,
    baseDelDia,
    allNumbers: allNumbersList,
    leyDirect,
    igualDirect,
    multiplicacion,
    restaDia,
    restaCien,
    inputUsed: paddedInput,
    dayUsed: effectiveDay,
    dateUsed: {
      day: effectiveDay,
      month: effectiveMonth,
      year: effectiveYear,
    },
  };
}

// Registro y persistencia de seguridad y dispositivos conectados
const DATA_DIR = path.resolve(__dirname, 'data');
const DEVICES_FILE = path.resolve(DATA_DIR, 'devices.json');
const SECURITY_FILE = path.resolve(DATA_DIR, 'security.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface SecurityConfig {
  secretKey: string;
  masterPin: string;
  monasusKey?: string;
  updatedAt: string;
}

const DEFAULT_MONASUS_KEY = '1604';

function generateNewSecretKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ZL-PRIVADO-${rand}`;
}

function loadSecurityConfig(): SecurityConfig {
  ensureDataDir();
  try {
    if (fs.existsSync(SECURITY_FILE)) {
      const content = fs.readFileSync(SECURITY_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data && data.secretKey && data.masterPin) {
        if (!data.monasusKey) {
          data.monasusKey = DEFAULT_MONASUS_KEY;
          saveSecurityConfig(data);
        }
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading security config:', err);
  }

  const initialConfig: SecurityConfig = {
    secretKey: 'ZL-PRIVADO-8821',
    masterPin: '1021',
    monasusKey: DEFAULT_MONASUS_KEY,
    updatedAt: new Date().toISOString(),
  };
  saveSecurityConfig(initialConfig);
  return initialConfig;
}

function saveSecurityConfig(config: SecurityConfig) {
  ensureDataDir();
  try {
    fs.writeFileSync(SECURITY_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving security config:', err);
  }
}

// Middleware de verificación de acceso
function verifyAccess(req: express.Request): boolean {
  const authHeader = req.headers.authorization;
  const headerKey = req.headers['x-access-key'] as string;
  const queryKey = (req.query.clave as string) || (req.query.key as string);
  const bodyKey = req.body?.key || req.body?.accessKey || req.body?.clave;
  const pin = req.body?.pin || (req.query.pin as string);

  const config = loadSecurityConfig();
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const providedKey = (bearerToken || headerKey || queryKey || bodyKey || '').trim();

  if (providedKey && providedKey === config.secretKey) {
    return true;
  }
  if (pin && String(pin).trim() === config.masterPin) {
    return true;
  }
  return false;
}

// API endpoint protegido para cálculo del algoritmo ZL
app.post('/api/calculate', (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({
        error: 'Acceso no autorizado. Este enlace ha sido desactivado por el propietario.',
        locked: true,
      });
    }

    const rawNumber = String(req.body?.number ?? '00');
    const day = req.body?.day !== undefined ? Number(req.body.day) : undefined;
    const month = req.body?.month !== undefined ? Number(req.body.month) : undefined;
    const year = req.body?.year !== undefined ? Number(req.body.year) : undefined;
    const result = calculateSecretZL(rawNumber, day, month, year);
    res.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Error calculating numbers' });
  }
});

// Endpoint público para verificar si un enlace o PIN es válido
app.post('/api/auth/verify', (req, res) => {
  try {
    const config = loadSecurityConfig();
    const { key, pin } = req.body || {};

    const providedKey = String(key || '').trim();
    const providedPin = String(pin || '').trim();

    if (providedKey && providedKey === config.secretKey) {
      return res.json({
        valid: true,
        secretKey: config.secretKey,
        masterPin: config.masterPin,
        message: 'Acceso concedido mediante enlace privado',
      });
    }

    if (providedPin && providedPin === config.masterPin) {
      return res.json({
        valid: true,
        secretKey: config.secretKey,
        masterPin: config.masterPin,
        message: 'Acceso concedido mediante PIN de propietario',
      });
    }

    return res.status(401).json({
      valid: false,
      error: 'Enlace desactivado o clave incorrecta',
    });
  } catch (error) {
    console.error('Auth verify error:', error);
    res.status(500).json({ error: 'Error validando credenciales' });
  }
});

// Obtener detalles de configuración de seguridad (solo usuarios autenticados)
app.get('/api/auth/info', (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const config = loadSecurityConfig();
    res.json({
      secretKey: config.secretKey,
      masterPin: config.masterPin,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching auth info:', error);
    res.status(500).json({ error: 'Error obteniendo seguridad' });
  }
});

// Regenerar clave privada: desactiva inmediatamente el enlace anterior para todos
app.post('/api/auth/regenerate-key', (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ error: 'No autorizado para regenerar clave' });
    }

    const config = loadSecurityConfig();
    const newKey = generateNewSecretKey();
    config.secretKey = newKey;
    config.updatedAt = new Date().toISOString();
    saveSecurityConfig(config);

    // Limpiar dispositivos anteriores para restablecer el registro al nuevo dueño
    saveDevices({});

    res.json({
      success: true,
      newKey,
      masterPin: config.masterPin,
      message: 'Nuevo enlace privado generado. El enlace anterior ha sido desactivado permanentemente.',
    });
  } catch (error) {
    console.error('Error regenerating key:', error);
    res.status(500).json({ error: 'Error regenerando clave' });
  }
});

// Actualizar PIN de propietario
app.post('/api/auth/update-pin', (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const { newPin } = req.body || {};
    if (!newPin || String(newPin).trim().length < 4) {
      return res.status(400).json({ error: 'El PIN debe tener al menos 4 caracteres' });
    }

    const config = loadSecurityConfig();
    config.masterPin = String(newPin).trim();
    config.updatedAt = new Date().toISOString();
    saveSecurityConfig(config);

    res.json({
      success: true,
      masterPin: config.masterPin,
      message: 'PIN de propietario actualizado correctamente',
    });
  } catch (error) {
    console.error('Error updating pin:', error);
    res.status(500).json({ error: 'Error actualizando PIN' });
  }
});

// Verificación exclusiva para entrar a la pestaña protegida Algoritmo Monasus
app.post('/api/monasus/verify', (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ valid: false, error: 'Acceso no autorizado' });
    }
    const { monasusKey } = req.body || {};
    const provided = String(monasusKey || '').trim();
    const config = loadSecurityConfig();
    const expected = config.monasusKey || DEFAULT_MONASUS_KEY;

    if (provided && provided === expected) {
      return res.json({
        valid: true,
        message: 'Acceso concedido a Algoritmo Monasus',
      });
    }

    return res.status(401).json({
      valid: false,
      error: 'Clave incorrecta. Algoritmo Monasus es exclusivo para el propietario.',
    });
  } catch (error) {
    console.error('Error verifying Monasus key:', error);
    res.status(500).json({ valid: false, error: 'Error validando la clave de Monasus' });
  }
});

// Actualizar la clave privada de Algoritmo Monasus
app.post('/api/monasus/update-key', (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }
    const { currentKey, newKey } = req.body || {};
    const config = loadSecurityConfig();
    const expected = config.monasusKey || DEFAULT_MONASUS_KEY;

    if (String(currentKey || '').trim() !== expected) {
      return res.status(401).json({ error: 'La clave actual no es correcta' });
    }

    const cleanNew = String(newKey || '').trim();
    if (cleanNew.length < 4) {
      return res.status(400).json({ error: 'La nueva clave debe tener al menos 4 caracteres' });
    }

    config.monasusKey = cleanNew;
    config.updatedAt = new Date().toISOString();
    saveSecurityConfig(config);

    res.json({
      success: true,
      message: 'Clave de Algoritmo Monasus actualizada correctamente',
    });
  } catch (error) {
    console.error('Error updating Monasus key:', error);
    res.status(500).json({ error: 'Error actualizando la clave de Monasus' });
  }
});

function digitalRoot(n: number): { value: number; chain: number[] } {
  let val = Math.abs(Math.trunc(n));
  const chain: number[] = [val];
  while (val >= 10) {
    val = String(val)
      .split('')
      .reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0);
    chain.push(val);
  }
  return { value: val, chain };
}

function validateUnique3Digits(
  rawDigits: [number, number, number],
  reducedHint?: number
): { digits: [number, number, number]; adjusted: boolean; notes: string[] } {
  const result: [number, number, number] = [...rawDigits] as [number, number, number];
  const seen = new Set<number>([result[0]]);
  const notes: string[] = [];
  let adjusted = false;

  for (let i = 1; i < 3; i++) {
    const d = result[i];
    if (!seen.has(d)) {
      seen.add(d);
      continue;
    }

    adjusted = true;
    const comp10 = (10 - d) % 10;
    const eq5 = (d + 5) % 10;
    let replacement: number | null = null;
    let reason = '';

    if (!seen.has(comp10)) {
      replacement = comp10;
      reason = `complemento a 10 (10 - ${d} = ${comp10})`;
    } else if (reducedHint !== undefined && reducedHint >= 0 && reducedHint <= 9 && !seen.has(reducedHint)) {
      replacement = reducedHint;
      reason = `raíz reducida (${reducedHint})`;
    } else if (!seen.has(eq5)) {
      replacement = eq5;
      reason = `equivalente (+5 = ${eq5})`;
    } else {
      for (let step = 1; step <= 9; step++) {
        const candidate = (comp10 + step) % 10;
        if (!seen.has(candidate)) {
          replacement = candidate;
          reason = `ajuste único sin repetir (${candidate})`;
          break;
        }
      }
    }

    const finalDigit = replacement !== null ? replacement : (d + 1) % 10;
    result[i] = finalDigit;
    seen.add(finalDigit);
    notes.push(`Dígito repetido ${d} en posición ${i + 1} sustituido por ${finalDigit} vía ${reason}.`);
  }

  return { digits: result, adjusted, notes };
}

function computeEjeCentralCore(cleanSorteo: string, cleanPremio: string) {
  const [S1, S2, S3, S4] = cleanSorteo.split('').map(Number);
  const [P1, P2, P3] = cleanPremio.split('').map(Number);

  // Eje Central: P2
  const ejeCentral = P2;

  // Paso 1 (Centenas): S4 + P2 (si >= 10, reducir sumando dígitos hasta 1 cifra)
  const rawSum1 = S4 + P2;
  const paso1Reduction = digitalRoot(rawSum1);
  const centenas = paso1Reduction.value;
  const hadCompression = rawSum1 >= 10;

  // Paso 2 (Decenas): |S1 - P2|
  const decenas = Math.abs(S1 - P2);

  // Paso 3 (Unidades): reducir 4 cifras del sorteo a 1 dígito (R), multiplicar R * P2
  const sumSorteo = S1 + S2 + S3 + S4;
  const raizS = digitalRoot(sumSorteo);
  const R = raizS.value;
  const producto = R * P2;
  const prodReduction = digitalRoot(producto);
  const unidadReducida = prodReduction.value;
  const unidadDirecta = producto % 10;

  // Regla de Arrastre Invertido: extremos P1 y P3 invertidos + dígito de Paso 1 o Paso 3
  const arrastreClosing = P3 !== centenas && P1 !== centenas ? centenas : unidadReducida;
  const arrastreRaw: [number, number, number] = [P3, P1, arrastreClosing];

  // Regla de Compresión (cuando Paso 1 >= 10): suma P1 + P2 + P3 para 2 primeras cifras + arrastre S4 o extremo
  const sumPremio = P1 + P2 + P3;
  const sumPremioStr = String(sumPremio).padStart(2, '0');
  const comp1 = Number(sumPremioStr[0]);
  const comp2 = Number(sumPremioStr[1]);
  const compThirdCandidates = [S4, P3, P1];
  const compThird = compThirdCandidates.find((d) => d !== comp1 && d !== comp2) ?? S4;
  const compresionRaw: [number, number, number] = [comp1, comp2, compThird];

  // Candidatos antes y después del filtro de 3 cifras distintas
  const c1Raw: [number, number, number] = [centenas, decenas, unidadReducida];
  const c2Raw: [number, number, number] = [centenas, decenas, unidadDirecta];
  const c3Raw: [number, number, number] = hadCompression ? compresionRaw : arrastreRaw;

  const c1Val = validateUnique3Digits(c1Raw, R);
  const c2Val = validateUnique3Digits(c2Raw, unidadReducida);
  const c3Val = validateUnique3Digits(c3Raw, hadCompression ? centenas : unidadReducida);

  const arrastreVal = validateUnique3Digits(arrastreRaw, unidadReducida);
  const compresionVal = hadCompression ? validateUnique3Digits(compresionRaw, centenas) : null;

  return {
    digitsS: [S1, S2, S3, S4] as [number, number, number, number],
    digitsP: [P1, P2, P3] as [number, number, number],
    ejeCentral,
    paso1: {
      formula: `${S4} + ${P2} = ${rawSum1}`,
      rawSum: rawSum1,
      hadCompression,
      chain: paso1Reduction.chain,
      digit: centenas,
    },
    paso2: {
      formula: `|${S1} - ${P2}| = ${decenas}`,
      digit: decenas,
    },
    paso3: {
      sumSorteoFormula: `${S1} + ${S2} + ${S3} + ${S4} = ${sumSorteo}`,
      raizChain: raizS.chain,
      raizR: R,
      productoFormula: `${R} × ${P2} = ${producto}`,
      producto,
      ramaReducidaChain: prodReduction.chain,
      unidadReducida,
      unidadDirecta,
    },
    arrastreInvertido: {
      extremos: `${P1} y ${P3}`,
      invertidos: `${P3} - ${P1}`,
      cierre: arrastreClosing,
      raw: arrastreRaw.join(''),
      validado: arrastreVal.digits.join(''),
      notes: arrastreVal.notes,
    },
    compresion: hadCompression
      ? {
          activa: true,
          sumPremioFormula: `${P1} + ${P2} + ${P3} = ${sumPremioStr}`,
          arrastreCifra: compThird,
          raw: compresionRaw.join(''),
          validado: compresionVal!.digits.join(''),
          notes: compresionVal!.notes,
        }
      : {
          activa: false,
        },
    candidatos: [
      {
        id: 1,
        titulo: 'Candidato Principal',
        subtitulo: 'Fórmula del Eje con reducción',
        raw: c1Raw.join(''),
        numero: c1Val.digits.join(''),
        digitos: c1Val.digits,
        ajustado: c1Val.adjusted,
        notes: c1Val.notes,
      },
      {
        id: 2,
        titulo: 'Candidato Aritmético',
        subtitulo: 'Fórmula del Eje con unidad directa',
        raw: c2Raw.join(''),
        numero: c2Val.digits.join(''),
        digitos: c2Val.digits,
        ajustado: c2Val.adjusted,
        notes: c2Val.notes,
      },
      {
        id: 3,
        titulo: 'Candidato de Arrastre y Simetría',
        subtitulo: hadCompression
          ? 'Regla de Compresión + Arrastre (Paso 1 ≥ 10)'
          : 'Extremos invertidos con cierre del Eje',
        raw: c3Raw.join(''),
        numero: c3Val.digits.join(''),
        digitos: c3Val.digits,
        ajustado: c3Val.adjusted,
        notes: c3Val.notes,
      },
    ],
  };
}

function calculateMonasusEjeCentral(sorteoRaw: string, premioRaw: string) {
  const cleanSorteo = String(sorteoRaw || '').replace(/\D/g, '').slice(-4).padStart(4, '0');
  const cleanPremio = String(premioRaw || '').replace(/\D/g, '').slice(-3).padStart(3, '0');

  const core = computeEjeCentralCore(cleanSorteo, cleanPremio);

  // Segundo algoritmo: Resta directa (Número de Sorteo - Premio que cayó)
  const sorteoVal = parseInt(cleanSorteo, 10) || 0;
  const premioVal = parseInt(cleanPremio, 10) || 0;
  const restaCompleta = Math.abs(sorteoVal - premioVal);
  const resta3 = String(restaCompleta).padStart(3, '0').slice(-3);
  const restaDigitos = resta3.split('').map(Number) as [number, number, number];

  // Tercer algoritmo: Miniresta (últimos 3 dígitos del sorteo - Premio que cayó)
  const last3SorteoStr = cleanSorteo.slice(-3);
  const last3SorteoVal = parseInt(last3SorteoStr, 10) || 0;
  const minirestaVal = Math.abs(last3SorteoVal - premioVal);
  const miniresta3 = String(minirestaVal).padStart(3, '0').slice(-3);
  const minirestaDigitos = miniresta3.split('').map(Number) as [number, number, number];

  // Algoritmo Tercero: suma +2 al número de sorteo (ej. 6581 -> 6583) manteniendo el mismo premio que cayó
  const sorteoTercero = String((sorteoVal + 2) % 10000).padStart(4, '0');
  const terceroCore = computeEjeCentralCore(sorteoTercero, cleanPremio);

  return {
    sorteo: cleanSorteo,
    premio: cleanPremio,
    ...core,
    tercero: {
      sorteoUsado: sorteoTercero,
      numero: terceroCore.candidatos[0].numero,
      digitos: terceroCore.candidatos[0].digitos,
    },
    resta: {
      formula: `${cleanSorteo} − ${cleanPremio} = ${restaCompleta}`,
      resultadoCompleto: String(restaCompleta),
      numero3: resta3,
      digitos: restaDigitos,
    },
    miniresta: {
      formula: `${last3SorteoStr} − ${cleanPremio} = ${minirestaVal}`,
      numero3: miniresta3,
      digitos: minirestaDigitos,
    },
  };
}

// Endpoint privado protegido con clave para calcular el Método del Eje Central
app.post('/api/monasus/analyze', (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }
    const monasusHeader = String(req.headers['x-monasus-key'] || req.body?.monasusKey || '').trim();
    const config = loadSecurityConfig();
    const expected = config.monasusKey || DEFAULT_MONASUS_KEY;
    if (!monasusHeader || monasusHeader !== expected) {
      return res.status(401).json({ error: 'Clave de Algoritmo Monasus requerida o incorrecta' });
    }

    const { sorteo, premio } = req.body || {};
    const cleanSorteo = String(sorteo || '').replace(/\D/g, '');
    const cleanPremio = String(premio || '').replace(/\D/g, '');

    if (cleanSorteo.length !== 4) {
      return res.status(400).json({ error: 'El número de sorteo anterior debe tener exactamente 4 cifras (ej. 6610).' });
    }
    if (cleanPremio.length !== 3) {
      return res.status(400).json({ error: 'El premio anterior debe tener exactamente 3 cifras (ej. 861).' });
    }

    const analysis = calculateMonasusEjeCentral(cleanSorteo, cleanPremio);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing Monasus draw:', error);
    res.status(500).json({ error: 'Error calculando Algoritmo Monasus' });
  }
});

// Endpoint de verificación de estado
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', protected: true });
});

interface ConnectedDevice {
  id: string;
  name: string;
  platform: string;
  firstSeen: string;
  lastSeen: string;
}

interface DevicesStorage {
  [id: string]: ConnectedDevice;
}

function loadDevices(): DevicesStorage {
  try {
    ensureDataDir();
    if (fs.existsSync(DEVICES_FILE)) {
      const content = fs.readFileSync(DEVICES_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading devices file:', err);
  }
  return {};
}

function saveDevices(devices: DevicesStorage) {
  try {
    ensureDataDir();
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing devices file:', err);
  }
}

// Endpoint para recibir latido (ping) de un dispositivo y registrar su nombre
app.post('/api/device-ping', (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    const { deviceId, deviceName, platform } = req.body || {};
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId requerido' });
    }

    const now = new Date().toISOString();
    const devices = loadDevices();

    const existing = devices[deviceId];
    devices[deviceId] = {
      id: deviceId,
      name: (deviceName && String(deviceName).trim()) || existing?.name || 'Dispositivo Anónimo',
      platform: platform || existing?.platform || 'Desconocido',
      firstSeen: existing?.firstSeen || now,
      lastSeen: now,
    };

    saveDevices(devices);

    const nowMs = Date.now();
    const deviceList = Object.values(devices);
    // Un dispositivo se considera en línea si emitió pulso en los últimos 3 minutos (180s)
    const activeThresholdMs = 3 * 60 * 1000;

    const enrichedList = deviceList
      .map((d) => {
        const lastSeenMs = new Date(d.lastSeen).getTime();
        const isOnline = nowMs - lastSeenMs < activeThresholdMs;
        return {
          ...d,
          isOnline,
        };
      })
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    const activeCount = enrichedList.filter((d) => d.isOnline).length;
    const totalCount = enrichedList.length;

    res.json({
      activeCount,
      totalCount,
      devices: enrichedList.slice(0, 50),
    });
  } catch (error) {
    console.error('Error handling device ping:', error);
    res.status(500).json({ error: 'Error procesando dispositivo' });
  }
});

// Endpoint para obtener la lista de dispositivos registrados
app.get('/api/devices', (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    const devices = loadDevices();
    const nowMs = Date.now();
    const activeThresholdMs = 3 * 60 * 1000;

    const enrichedList = Object.values(devices)
      .map((d) => {
        const lastSeenMs = new Date(d.lastSeen).getTime();
        const isOnline = nowMs - lastSeenMs < activeThresholdMs;
        return {
          ...d,
          isOnline,
        };
      })
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    const activeCount = enrichedList.filter((d) => d.isOnline).length;
    const totalCount = enrichedList.length;

    res.json({
      activeCount,
      totalCount,
      devices: enrichedList.slice(0, 50),
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Error obteniendo dispositivos' });
  }
});

// Endpoint para cambiar/personalizar el nombre del dispositivo
app.post('/api/device-rename', (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    const { deviceId, newName } = req.body || {};
    if (!deviceId || !newName) {
      return res.status(400).json({ error: 'deviceId y newName requeridos' });
    }

    const cleanName = String(newName).trim().slice(0, 40);
    const devices = loadDevices();

    if (devices[deviceId]) {
      devices[deviceId].name = cleanName;
      devices[deviceId].lastSeen = new Date().toISOString();
      saveDevices(devices);
    }

    res.json({ success: true, name: cleanName });
  } catch (error) {
    console.error('Error renaming device:', error);
    res.status(500).json({ error: 'Error renombrando dispositivo' });
  }
});

// ============================================================================
// SORTEO DE LA ANGUILA (Datos reales actualizados en línea + caché local)
// ============================================================================
const ANGUILA_CACHE_FILE = path.resolve(DATA_DIR, 'anguilla-cache.json');

interface AnguillaDraw {
  drawName: string;
  timeLabel: string;
  hour24: number;
  first: string;
  second: string;
  third: string;
  sequence: string;
  formulaResult?: string;
  formulaEqual?: string;
  formulaMix?: string;
  formulaExtra?: string;
  formulaMinusOne?: string;
  formulaPlusOne?: string;
  numbersToPlay?: string[];
}

interface AnguillaMorningPlaySlot {
  hour24: number;
  timeLabel: string;
  numbers: string[];
}

interface AnguillaMorningStrongNumber {
  main: string;
  equal: string;
  combined: string;
}

interface AnguillaAfternoonPlaySlot {
  hour24: number;
  timeLabel: string;
  result: string;
  equal: string;
  displayResult?: string;
  displayEqual?: string;
  sumOnly?: string;
}

interface AnguillaDayResult {
  date: string;
  dayNumber: number;
  label: string;
  isToday: boolean;
  isYesterday: boolean;
  isTomorrow?: boolean;
  draws: AnguillaDraw[];
  morningNumbersToPlay?: AnguillaMorningPlaySlot[];
  morningStrongNumber?: AnguillaMorningStrongNumber;
  afternoonNumbersToPlay?: AnguillaAfternoonPlaySlot[];
  allSequence: string[];
  fetchedAt: string;
}

function getAnguillaCostaRicaNow(): { dateStr: string; hour: number } {
  // Costa Rica: UTC-6 (sin cambio de horario)
  const utcMinus6 = new Date(Date.now() - 6 * 3600 * 1000);
  const y = utcMinus6.getUTCFullYear();
  const m = String(utcMinus6.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utcMinus6.getUTCDate()).padStart(2, '0');
  return {
    dateStr: `${y}-${m}-${d}`,
    hour: utcMinus6.getUTCHours(),
  };
}

function getAnguillaTodayStr(): string {
  return getAnguillaCostaRicaNow().dateStr;
}

function shiftDateStr(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function flipSixNine(numStr: string): string | undefined {
  if (!/[69]/.test(numStr)) return undefined;
  const flipped = numStr
    .split('')
    .map((d) => (d === '6' ? '9' : d === '9' ? '6' : d))
    .join('');
  return flipped !== numStr ? flipped : undefined;
}

function enrichDrawsWithFormula(draws: AnguillaDraw[], dateStr: string): AnguillaDraw[] {
  const prevDateStr = shiftDateStr(dateStr, -1);
  const prevDayNumber = Number(prevDateStr.split('-')[2]) || 0;

  return draws.map((d) => {
    const n1 = parseInt(d.first, 10) || 0;
    const n2 = parseInt(d.second, 10) || 0;
    const n3 = parseInt(d.third, 10) || 0;
    const sum = n1 + n2 + n3;

    const crTimeLabel = formatHour24ToLabel(d.hour24 - 2);

    if (d.hour24 >= 12) {
      const formulaResult = String(sum).padStart(2, '0').slice(-2);
      const formulaEqual = getEquality(formulaResult);

      return {
        ...d,
        timeLabel: crTimeLabel,
        formulaResult,
        formulaEqual,
        formulaMix: undefined,
        formulaExtra: undefined,
        formulaMinusOne: undefined,
        formulaPlusOne: undefined,
      };
    }

    // 6:00 AM - 8:00 AM CR (hour24 8..10) alimentan 7:00 AM - 9:00 AM CR; las 9:00 AM (hour24=11) no entra en este bloque
    if (d.hour24 === 11) {
      return {
        ...d,
        timeLabel: crTimeLabel,
        formulaResult: undefined,
        formulaEqual: undefined,
        formulaMix: undefined,
        formulaExtra: undefined,
        formulaMinusOne: undefined,
        formulaPlusOne: undefined,
      };
    }

    // 6:00 AM - 8:00 AM CR: sumar los 3 resultados y restar el día anterior; número, igual y 1 extra (solo cara 6<->9)
    const subtracted = sum - prevDayNumber;
    const formulaResult = String(((subtracted % 100) + 100) % 100).padStart(2, '0');
    const formulaEqual = getEquality(formulaResult);
    let formulaExtra = flipSixNine(formulaResult) || flipSixNine(formulaEqual);
    if (formulaExtra === formulaResult || formulaExtra === formulaEqual) {
      formulaExtra = undefined;
    }

    return {
      ...d,
      timeLabel: crTimeLabel,
      formulaResult,
      formulaEqual,
      formulaMix: undefined,
      formulaExtra,
      formulaMinusOne: undefined,
      formulaPlusOne: undefined,
    };
  });
}

function formatAnguillaDateLabel(dateStr: string): { dayNumber: number; label: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return {
    dayNumber: d,
    label: `${dias[dt.getUTCDay()]} ${d} de ${meses[dt.getUTCMonth()]}, ${y}`,
  };
}

function formatHour24ToLabel(hour24: number): string {
  if (hour24 === 0) return '12:00 AM';
  if (hour24 < 12) return `${hour24}:00 AM`;
  if (hour24 === 12) return '12:00 PM';
  return `${hour24 - 12}:00 PM`;
}

function parseTime12ToHour24(timeText: string): number {
  const m = timeText.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!m) return 0;
  let hr = parseInt(m[1], 10);
  const period = m[3].toUpperCase();
  if (period === 'PM' && hr < 12) hr += 12;
  if (period === 'AM' && hr === 12) hr = 0;
  return hr;
}

function loadAnguillaCache(): Record<string, AnguillaDayResult> {
  ensureDataDir();
  try {
    if (fs.existsSync(ANGUILA_CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(ANGUILA_CACHE_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading anguilla cache:', err);
  }
  return {};
}

function saveAnguillaCache(cache: Record<string, AnguillaDayResult>) {
  ensureDataDir();
  try {
    fs.writeFileSync(ANGUILA_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving anguilla cache:', err);
  }
}

async function fetchAnguillaFromEnLoteria(dateStr: string): Promise<AnguillaDraw[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://enloteria.com/resultados-anguilla-${dateStr}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlgoritmoZL/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!response.ok) return null;

    const html = await response.text();
    const scriptRegex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    const drawsMap = new Map<number, AnguillaDraw>();

    let match: RegExpExecArray | null;
    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [];
        for (const item of graph) {
          if (item?.['@type'] !== 'Event') continue;
          const props: Record<string, string> = {};
          if (Array.isArray(item.additionalProperty)) {
            for (const p of item.additionalProperty) {
              if (p?.name && p?.value !== undefined) {
                props[String(p.name)] = String(p.value);
              }
            }
          }

          const eventDate = props['Fecha del Sorteo'] || String(item.startDate || '').slice(0, 10);
          if (eventDate !== dateStr) continue;

          const startStr = String(item.startDate || '');
          const hourMatch = startStr.match(/T(\d{2}):/);
          const hour24 = hourMatch ? parseInt(hourMatch[1], 10) : parseTime12ToHour24(String(item.name || ''));
          const first = (props['Primer Premio'] || '').padStart(2, '0');
          const second = (props['Segundo Premio'] || '').padStart(2, '0');
          const third = (props['Tercer Premio'] || '').padStart(2, '0');

          if (!first || !second || !third) continue;

          drawsMap.set(hour24, {
            drawName: String(item.name || `Anguilla ${formatHour24ToLabel(hour24)}`),
            timeLabel: formatHour24ToLabel(hour24),
            hour24,
            first,
            second,
            third,
            sequence: `${first} · ${second} · ${third}`,
          });
        }
      } catch {
        // Ignore malformed JSON-LD block
      }
    }

    return Array.from(drawsMap.values()).sort((a, b) => a.hour24 - b.hour24);
  } catch (err) {
    console.error(`Error fetching EnLoteria for ${dateStr}:`, err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAnguillaFallbackOfficial(): Promise<Record<string, AnguillaDraw[]>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const byDate: Record<string, Map<number, AnguillaDraw>> = {};

  try {
    const response = await fetch('https://anguillalottery.ai/es/', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlgoritmoZL/1.0)',
        Accept: 'text/html',
      },
    });
    if (!response.ok) return {};
    const html = await response.text();

    const addDraw = (ddmmyyyy: string, timeRaw: string, nums: string[]) => {
      if (nums.length < 3) return;
      const [dd, mm, yyyy] = ddmmyyyy.split('/');
      if (!dd || !mm || !yyyy) return;
      const dateStr = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      const hour24 = parseTime12ToHour24(timeRaw);
      if (!hour24) return;
      if (!byDate[dateStr]) byDate[dateStr] = new Map();
      const first = nums[0].padStart(2, '0');
      const second = nums[1].padStart(2, '0');
      const third = nums[2].padStart(2, '0');
      byDate[dateStr].set(hour24, {
        drawName: `Anguilla ${formatHour24ToLabel(hour24)}`,
        timeLabel: formatHour24ToLabel(hour24),
        hour24,
        first,
        second,
        third,
        sequence: `${first} · ${second} · ${third}`,
      });
    };

    // Sorteo principal destacado
    const mainMatch = html.match(
      /<div class="horassorteo">\s*Sorteo\s+([0-9:AMPamp]+)\.\s*(\d{2}\/\d{2}\/\d{4})\s*<\/div>[\s\S]*?<div class="bolas-sorteo[^"]*">([\s\S]*?)<\/div>/i
    );
    if (mainMatch) {
      const nums = Array.from(mainMatch[3].matchAll(/<span class="numero"[^>]*>(?:<span class="small">[^<]*<\/span>)?(\d{2})<\/span>/gi)).map((m) => m[1]);
      addDraw(mainMatch[2], mainMatch[1], nums);
    }

    // Resto de sorteos en otro-sorteo (solo los de bolas estándar sin bolablue)
    const blockRegex = /<div class="otro-sorteo">\s*<div class="fecha">\s*([0-9:AMPamp]+)\s*<br\s*\/?>\s*(\d{2}\/\d{2}\/\d{4})\s*<\/div>([\s\S]*?)<\/div>/gi;
    let bMatch: RegExpExecArray | null;
    while ((bMatch = blockRegex.exec(html)) !== null) {
      if (bMatch[3].includes('bolablue')) continue;
      const nums = Array.from(bMatch[3].matchAll(/<span class="numero">(\d{2})<\/span>/gi)).map((m) => m[1]);
      addDraw(bMatch[2], bMatch[1], nums);
    }

    const result: Record<string, AnguillaDraw[]> = {};
    for (const [dt, map] of Object.entries(byDate)) {
      result[dt] = Array.from(map.values()).sort((a, b) => a.hour24 - b.hour24);
    }
    return result;
  } catch (err) {
    console.error('Error fetching official anguillalottery.ai fallback:', err);
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

app.get('/api/anguilla', async (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    const crNow = getAnguillaCostaRicaNow();
    const todayStr = crNow.dateStr;
    const yesterdayStr = shiftDateStr(todayStr, -1);
    const tomorrowStr = shiftDateStr(todayStr, 1);
    // A partir de las 11:00 PM hora Costa Rica ya se muestra el día siguiente para ver qué jugar
    const defaultEndDate = crNow.hour >= 23 ? tomorrowStr : todayStr;

    const requestedDate = typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : null;
    const endDate = typeof req.query.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.endDate)
      ? req.query.endDate
      : defaultEndDate;
    const daysCount = requestedDate
      ? 1
      : Math.min(Math.max(parseInt(String(req.query.days || '3'), 10) || 3, 1), 7);

    const targetDates: string[] = [];
    if (requestedDate) {
      targetDates.push(requestedDate);
    } else {
      for (let i = 0; i < daysCount; i++) {
        targetDates.push(shiftDateStr(endDate, -i));
      }
    }

    const allDatesNeeded = new Set<string>();
    for (const d of targetDates) {
      allDatesNeeded.add(d);
      allDatesNeeded.add(shiftDateStr(d, -1));
    }

    const cache = loadAnguillaCache();
    let cacheUpdated = false;
    let usedLive = false;

    const needsLiveFetch = Array.from(allDatesNeeded).some(
      (dateStr) => dateStr <= todayStr && !(dateStr < todayStr && cache[dateStr]?.draws?.length >= 15)
    );
    const officialPromise = needsLiveFetch
      ? fetchAnguillaFallbackOfficial()
      : Promise.resolve({} as Record<string, AnguillaDraw[]>);

    const dayResultsMap = new Map<string, AnguillaDayResult>();

    const [officialData] = await Promise.all([
      officialPromise,
      Promise.all(
        Array.from(allDatesNeeded).map(async (dateStr) => {
          const isFuture = dateStr > todayStr;
          const isPastCompleted = dateStr < todayStr && cache[dateStr]?.draws?.length >= 15;
          const { dayNumber, label } = formatAnguillaDateLabel(dateStr);

          if (isFuture) {
            dayResultsMap.set(dateStr, {
              date: dateStr,
              dayNumber,
              label,
              isToday: false,
              isYesterday: false,
              isTomorrow: dateStr === tomorrowStr,
              draws: [],
              allSequence: [],
              fetchedAt: new Date().toISOString(),
            });
            return;
          }

          if (isPastCompleted) {
            dayResultsMap.set(dateStr, {
              ...cache[dateStr],
              draws: enrichDrawsWithFormula(cache[dateStr].draws, dateStr),
              dayNumber,
              label,
              isToday: dateStr === todayStr,
              isYesterday: dateStr === yesterdayStr,
              isTomorrow: dateStr === tomorrowStr,
            });
            return;
          }

          const enLoteriaDraws = await fetchAnguillaFromEnLoteria(dateStr);
          const officialDraws = (await officialPromise)[dateStr] || [];

          let mergedDraws: AnguillaDraw[] | null = null;
          if (enLoteriaDraws !== null || officialDraws.length > 0) {
            const byHour = new Map<number, AnguillaDraw>();
            for (const d of enLoteriaDraws || []) {
              byHour.set(d.hour24, d);
            }
            for (const d of officialDraws) {
              byHour.set(d.hour24, d);
            }
            mergedDraws = Array.from(byHour.values()).sort((a, b) => a.hour24 - b.hour24);
          }

          if (mergedDraws !== null) {
            usedLive = true;
            const enrichedDraws = enrichDrawsWithFormula(mergedDraws, dateStr);
            const allSequence = enrichedDraws.flatMap((d) => [d.first, d.second, d.third]);
            const dayResult: AnguillaDayResult = {
              date: dateStr,
              dayNumber,
              label,
              isToday: dateStr === todayStr,
              isYesterday: dateStr === yesterdayStr,
              isTomorrow: dateStr === tomorrowStr,
              draws: enrichedDraws,
              allSequence,
              fetchedAt: new Date().toISOString(),
            };
            if (enrichedDraws.length > 0) {
              cache[dateStr] = dayResult;
              cacheUpdated = true;
            }
            dayResultsMap.set(dateStr, dayResult);
            return;
          }

          if (cache[dateStr]) {
            dayResultsMap.set(dateStr, {
              ...cache[dateStr],
              draws: enrichDrawsWithFormula(cache[dateStr].draws, dateStr),
              dayNumber,
              label,
              isToday: dateStr === todayStr,
              isYesterday: dateStr === yesterdayStr,
              isTomorrow: dateStr === tomorrowStr,
            });
            return;
          }

          dayResultsMap.set(dateStr, {
            date: dateStr,
            dayNumber,
            label,
            isToday: dateStr === todayStr,
            isYesterday: dateStr === yesterdayStr,
            isTomorrow: dateStr === tomorrowStr,
            draws: [],
            allSequence: [],
            fetchedAt: new Date().toISOString(),
          });
        })
      ),
    ]);
    void officialData;

    const results: AnguillaDayResult[] = targetDates.map((dateStr) => {
      const current = dayResultsMap.get(dateStr)!;
      const prevDay = dayResultsMap.get(shiftDateStr(dateStr, -1));
      const prevMorningMap = new Map<number, string[]>();
      const morningNumbersToPlay: AnguillaMorningPlaySlot[] = [];
      let morningStrongNumber: AnguillaMorningStrongNumber | undefined;

      if (prevDay) {
        // De 6:00 AM a 9:00 AM CR:
        // - 6:00 AM (hour24=8) juega con el Número fuerte
        // - 6:00 AM de ayer (8) da para las 7:00 AM de hoy (9)
        // - 7:00 AM de ayer (9) da para las 8:00 AM de hoy (10)
        // - 8:00 AM de ayer (10) da para las 9:00 AM de hoy (11)
        // - 9:00 AM (11) no entra aquí
        for (const pd of prevDay.draws) {
          if (pd.hour24 >= 8 && pd.hour24 <= 10) {
            const targetHour24 = pd.hour24 + 1;
            const nums = [
              pd.formulaResult,
              pd.formulaEqual,
              pd.formulaExtra,
            ].filter((x): x is string => Boolean(x));
            if (nums.length > 0) {
              prevMorningMap.set(targetHour24, nums);
              morningNumbersToPlay.push({
                hour24: targetHour24,
                timeLabel: formatHour24ToLabel(targetHour24 - 2),
                numbers: nums,
              });
            }
          }
        }

        if (prevDay.draws.length > 0) {
          const sortedPrev = [...prevDay.draws].sort((a, b) => a.hour24 - b.hour24);
          const lastDraw = sortedPrev[sortedPrev.length - 1];
          if (lastDraw && (lastDraw.hour24 >= 22 || prevDay.date < todayStr)) {
            const n1 = parseInt(lastDraw.first, 10) || 0;
            const n2 = parseInt(lastDraw.second, 10) || 0;
            const n3 = parseInt(lastDraw.third, 10) || 0;
            const sum = n1 + n2 + n3 + current.dayNumber;
            const strongMain = String(sum).padStart(2, '0').slice(-2);
            const strongEqual = getEquality(strongMain);
            morningStrongNumber = {
              main: strongMain,
              equal: strongEqual,
              combined: `${strongMain}${strongEqual}`,
            };
          }
        }
      }

      const drawsWithPlay = current.draws.map((dr) =>
        dr.hour24 < 12
          ? {
              ...dr,
              numbersToPlay: prevMorningMap.get(dr.hour24) || [],
            }
          : dr
      );

      // Cadena para la sección 10:00 AM - 8:00 PM CR (hour24 12..22):
      // - 10:00 AM (hour24=12) inicia con la fórmula (sin sumar día) del último sorteo del día anterior (8:00 PM CR).
      // - 11:00 AM y 12:00 PM (hour24=13..14) usan la suma de los 3 números del sorteo anterior (sin sumar día).
      // - A partir de la 1:00 PM (hour24=15..22) usan la suma de los 3 números del sorteo anterior + el día siguiente (actualizado automáticamente cada día).
      const nextDayStr = shiftDateStr(current.date, 1);
      const nextDayNumber = Number(nextDayStr.split('-')[2]) || 0;

      const afternoonNumbersToPlay: AnguillaAfternoonPlaySlot[] = [];
      if (prevDay && prevDay.draws.length > 0) {
        const sortedPrev = [...prevDay.draws].sort((a, b) => a.hour24 - b.hour24);
        const lastPrevDraw = sortedPrev[sortedPrev.length - 1];
        if (lastPrevDraw && (lastPrevDraw.hour24 >= 22 || prevDay.date < todayStr)) {
          const prevRes =
            lastPrevDraw.formulaResult !== undefined
              ? String(lastPrevDraw.formulaResult).padStart(2, '0').slice(-2)
              : String(
                  (parseInt(lastPrevDraw.first, 10) || 0) +
                    (parseInt(lastPrevDraw.second, 10) || 0) +
                    (parseInt(lastPrevDraw.third, 10) || 0)
                )
                  .padStart(2, '0')
                  .slice(-2);
          const prevEq = lastPrevDraw.formulaEqual || getEquality(prevRes);
          const prevFirst = String(lastPrevDraw.first).padStart(2, '0');
          const prevPlainSumNum =
            ((parseInt(lastPrevDraw.first, 10) || 0) +
              (parseInt(lastPrevDraw.second, 10) || 0) +
              (parseInt(lastPrevDraw.third, 10) || 0)) %
            100;
          const prevResta100 = String((100 - prevPlainSumNum) % 100).padStart(2, '0');

          afternoonNumbersToPlay.push({
            hour24: 12,
            timeLabel: formatHour24ToLabel(10),
            result: prevRes,
            equal: prevEq,
            displayResult: prevFirst === prevRes ? prevResta100 : undefined,
            displayEqual: prevFirst === prevEq ? prevResta100 : undefined,
            sumOnly: prevRes,
          });
        }
      }

      const currentDrawByHour = new Map<number, AnguillaDraw>();
      for (const dr of drawsWithPlay) {
        currentDrawByHour.set(dr.hour24, dr);
      }
      for (let h = 13; h <= 22; h++) {
        const prevSlotDraw = currentDrawByHour.get(h - 1);
        if (prevSlotDraw) {
          const p1 = parseInt(prevSlotDraw.first, 10) || 0;
          const p2 = parseInt(prevSlotDraw.second, 10) || 0;
          const p3 = parseInt(prevSlotDraw.third, 10) || 0;
          const plainSumNum = (p1 + p2 + p3) % 100;
          const plainSum = String(plainSumNum).padStart(2, '0');
          const resta100 = String((100 - plainSumNum) % 100).padStart(2, '0');
          const prevFirst = String(prevSlotDraw.first).padStart(2, '0');

          let resVal: string;
          let eqVal: string;

          if (h >= 15) {
            resVal = String(p1 + p2 + p3 + nextDayNumber).padStart(2, '0').slice(-2);
            eqVal = getEquality(resVal);
          } else {
            resVal =
              prevSlotDraw.formulaResult !== undefined
                ? String(prevSlotDraw.formulaResult).padStart(2, '0').slice(-2)
                : plainSum;
            eqVal = prevSlotDraw.formulaEqual || getEquality(resVal);
          }

          afternoonNumbersToPlay.push({
            hour24: h,
            timeLabel: formatHour24ToLabel(h - 2),
            result: resVal,
            equal: eqVal,
            displayResult: prevFirst === resVal ? resta100 : undefined,
            displayEqual: prevFirst === eqVal ? resta100 : undefined,
            sumOnly: plainSum,
          });
        }
      }

      return {
        ...current,
        draws: drawsWithPlay,
        morningNumbersToPlay,
        morningStrongNumber,
        afternoonNumbersToPlay,
      };
    });

    if (cacheUpdated) {
      saveAnguillaCache(cache);
    }

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      today: todayStr,
      activeDate: endDate,
      days: results,
      updatedAt: new Date().toISOString(),
      source: usedLive ? 'live' : 'cache',
    });
  } catch (error) {
    console.error('Error in /api/anguilla:', error);
    res.status(500).json({ error: 'Error obteniendo resultados del Sorteo de la Anguila' });
  }
});

// --- La Diaria (Honduras) · Resultados de Ayer y Hoy ---
interface LaDiariaDrawSlot {
  timeLabel: string;
  hour24: number;
  number: string | null;
  publishedAt?: string;
}

interface LaDiariaDayData {
  date: string;
  label: string;
  isToday: boolean;
  isYesterday: boolean;
  draws: LaDiariaDrawSlot[];
}

interface HondurasEnvMeta {
  fetchedAt: number;
  diariaGames: Array<{ gameId: string; title: string; timeLabel: string; hour24: number }>;
  optionNumberById: Record<string, string>;
}

const LA_DIARIA_HN_CACHE_FILE = path.join(DATA_DIR, 'la-diaria-hn-cache.json');
let hondurasEnvCache: HondurasEnvMeta | null = null;

function parseLaDiariaSlotMeta(title: string): { timeLabel: string; hour24: number } | null {
  if (/11\s*:?\s*00\s*am/i.test(title)) return { timeLabel: '11:00 AM', hour24: 11 };
  if (/3\s*:?\s*00\s*pm/i.test(title)) return { timeLabel: '3:00 PM', hour24: 15 };
  if (/9\s*:?\s*00\s*pm/i.test(title)) return { timeLabel: '9:00 PM', hour24: 21 };
  return null;
}

async function fetchHondurasEnvMeta(forceRefresh = false): Promise<HondurasEnvMeta> {
  const now = Date.now();
  if (!forceRefresh && hondurasEnvCache && now - hondurasEnvCache.fetchedAt < 10 * 60 * 1000) {
    return hondurasEnvCache;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('https://api.loteriasdehonduras.com/honduras/sites/env', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlgoritmoZL/1.0)',
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al consultar sites/env`);
    }
    const data = await response.json();
    const siteGames = (data?.siteCompanies || []).flatMap((c: any) => c?.siteGames || []);

    const diariaGames: HondurasEnvMeta['diariaGames'] = [];
    const optionNumberById: Record<string, string> = {};

    for (const sg of siteGames) {
      const title = String(sg?.title || '');
      if (!/la\s+diaria/i.test(title)) continue;
      const slotMeta = parseLaDiariaSlotMeta(title);
      if (!slotMeta || !sg?.game_id) continue;

      diariaGames.push({
        gameId: String(sg.game_id),
        title,
        timeLabel: slotMeta.timeLabel,
        hour24: slotMeta.hour24,
      });

      const scoreLayout = Array.isArray(sg?.game?.score_layout) ? sg.game.score_layout : [];
      for (const row of scoreLayout) {
        if (!Array.isArray(row)) continue;
        for (const col of row) {
          const options = Array.isArray(col?.options) ? col.options : [];
          for (const opt of options) {
            if (!opt?.id || !opt?.text) continue;
            const numMatch = String(opt.text).trim().match(/^(\d{2})\b/);
            if (numMatch) {
              optionNumberById[String(opt.id)] = numMatch[1];
            }
          }
        }
      }
    }

    diariaGames.sort((a, b) => a.hour24 - b.hour24);
    hondurasEnvCache = {
      fetchedAt: now,
      diariaGames,
      optionNumberById,
    };
    return hondurasEnvCache;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchHondurasSessionsForDate(dateStr: string): Promise<any[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://api.loteriasdehonduras.com/honduras/sessions?date=${encodeURIComponent(
      `${dateStr}T04:00:00.000Z`
    )}&limit=3`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlgoritmoZL/1.0)',
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al consultar sessions`);
    }
    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
  } finally {
    clearTimeout(timeout);
  }
}

function loadLaDiariaCache(): Record<string, Record<number, { number: string; publishedAt?: string }>> {
  ensureDataDir();
  try {
    if (fs.existsSync(LA_DIARIA_HN_CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(LA_DIARIA_HN_CACHE_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading la-diaria cache:', err);
  }
  return {};
}

function saveLaDiariaCache(cache: Record<string, Record<number, { number: string; publishedAt?: string }>>) {
  ensureDataDir();
  try {
    fs.writeFileSync(LA_DIARIA_HN_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving la-diaria cache:', err);
  }
}

async function syncLaDiariaCacheForDates(
  targetDates: string[],
  todayStr: string
): Promise<{
  cache: Record<string, Record<number, { number: string; publishedAt?: string }>>;
  usedLive: boolean;
}> {
  const cache = loadLaDiariaCache();
  let usedLive = false;

  const datesToFetch = targetDates.filter((dt) => {
    if (dt === todayStr) return true;
    const dayCache = cache[dt];
    // Para historial de Tiempos Tica necesitamos 11:00 AM (11) y 3:00 PM (15)
    return !dayCache || !dayCache[11]?.number || !dayCache[15]?.number;
  });

  if (datesToFetch.length === 0) {
    return { cache, usedLive: false };
  }

  try {
    let envMeta = await fetchHondurasEnvMeta(false);
    const sessionResults = await Promise.allSettled(
      datesToFetch.map((dt) => fetchHondurasSessionsForDate(dt))
    );
    const allSessionEntries = sessionResults.flatMap((res) =>
      res.status === 'fulfilled' ? res.value : []
    );

    const gameById = new Map(envMeta.diariaGames.map((g) => [g.gameId, g]));
    let hasUnknownOption = false;
    for (const entry of allSessionEntries) {
      if (!gameById.has(String(entry?.game_id || ''))) continue;
      for (const sess of entry?.sessions || []) {
        const firstOptId = sess?.score?.[0]?.[0];
        if (firstOptId && !envMeta.optionNumberById[String(firstOptId)]) {
          hasUnknownOption = true;
          break;
        }
      }
      if (hasUnknownOption) break;
    }
    if (hasUnknownOption) {
      envMeta = await fetchHondurasEnvMeta(true);
    }

    const targetSet = new Set(targetDates);
    let cacheChanged = false;
    for (const entry of allSessionEntries) {
      const gameMeta = gameById.get(String(entry?.game_id || ''));
      if (!gameMeta) continue;

      const sessionsList = Array.isArray(entry?.sessions) ? entry.sessions : [];
      for (const sess of sessionsList) {
        const sessDateStr = String(sess?.date || '').slice(0, 10);
        if (!targetSet.has(sessDateStr)) continue;

        const firstOptId = sess?.score?.[0]?.[0];
        if (!firstOptId) continue;
        const drawnNumber = envMeta.optionNumberById[String(firstOptId)];
        if (!drawnNumber) continue;

        if (!cache[sessDateStr]) cache[sessDateStr] = {};
        const existing = cache[sessDateStr][gameMeta.hour24];
        const publishedAt = sess?.updatedAt || sess?.createdAt;
        if (!existing || existing.number !== drawnNumber || existing.publishedAt !== publishedAt) {
          cache[sessDateStr][gameMeta.hour24] = {
            number: drawnNumber,
            publishedAt,
          };
          cacheChanged = true;
        }
      }
    }

    usedLive = sessionResults.some((r) => r.status === 'fulfilled');
    if (cacheChanged) {
      saveLaDiariaCache(cache);
    }
  } catch (err) {
    console.error('Error syncing La Diaria HN cache for Tiempos Tica:', err);
  }

  return { cache, usedLive };
}

app.get('/api/la-diaria-hn', async (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    // Honduras y Costa Rica comparten UTC-6 sin cambio de horario
    const hnNow = getAnguillaCostaRicaNow();
    const todayStr = hnNow.dateStr;
    const yesterdayStr = shiftDateStr(todayStr, -1);

    const cache = loadLaDiariaCache();
    let usedLive = false;

    try {
      let envMeta = await fetchHondurasEnvMeta(false);
      const [todaySessions, yesterdaySessions] = await Promise.all([
        fetchHondurasSessionsForDate(todayStr),
        fetchHondurasSessionsForDate(yesterdayStr),
      ]);

      const gameById = new Map(envMeta.diariaGames.map((g) => [g.gameId, g]));
      const allSessionEntries = [...todaySessions, ...yesterdaySessions];

      // Si aparece un optionId nuevo que no estaba en el mapa cacheado, refrescar sites/env una vez
      let hasUnknownOption = false;
      for (const entry of allSessionEntries) {
        if (!gameById.has(String(entry?.game_id || ''))) continue;
        for (const sess of entry?.sessions || []) {
          const firstOptId = sess?.score?.[0]?.[0];
          if (firstOptId && !envMeta.optionNumberById[String(firstOptId)]) {
            hasUnknownOption = true;
            break;
          }
        }
        if (hasUnknownOption) break;
      }
      if (hasUnknownOption) {
        envMeta = await fetchHondurasEnvMeta(true);
      }

      let cacheChanged = false;
      for (const entry of allSessionEntries) {
        const gameMeta = gameById.get(String(entry?.game_id || ''));
        if (!gameMeta) continue;

        const sessionsList = Array.isArray(entry?.sessions) ? entry.sessions : [];
        for (const sess of sessionsList) {
          const sessDateStr = String(sess?.date || '').slice(0, 10);
          if (sessDateStr !== todayStr && sessDateStr !== yesterdayStr) continue;

          const firstOptId = sess?.score?.[0]?.[0];
          if (!firstOptId) continue;
          const drawnNumber = envMeta.optionNumberById[String(firstOptId)];
          if (!drawnNumber) continue;

          if (!cache[sessDateStr]) cache[sessDateStr] = {};
          const existing = cache[sessDateStr][gameMeta.hour24];
          const publishedAt = sess?.updatedAt || sess?.createdAt;
          if (!existing || existing.number !== drawnNumber || existing.publishedAt !== publishedAt) {
            cache[sessDateStr][gameMeta.hour24] = {
              number: drawnNumber,
              publishedAt,
            };
            cacheChanged = true;
          }
        }
      }

      usedLive = true;
      if (cacheChanged) {
        saveLaDiariaCache(cache);
      }
    } catch (liveErr) {
      console.error('Live fetch error in /api/la-diaria-hn, falling back to cache:', liveErr);
    }

    const SLOTS: Array<{ hour24: number; timeLabel: string }> = [
      { hour24: 11, timeLabel: '11:00 AM' },
      { hour24: 15, timeLabel: '3:00 PM' },
      { hour24: 21, timeLabel: '9:00 PM' },
    ];

    const buildDay = (dateStr: string, isToday: boolean, isYesterday: boolean): LaDiariaDayData => {
      const dayCache = cache[dateStr] || {};
      return {
        date: dateStr,
        label: formatAnguillaDateLabel(dateStr).label,
        isToday,
        isYesterday,
        draws: SLOTS.map((slot) => ({
          timeLabel: slot.timeLabel,
          hour24: slot.hour24,
          number: dayCache[slot.hour24]?.number ?? null,
          publishedAt: dayCache[slot.hour24]?.publishedAt,
        })),
      };
    };

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      today: todayStr,
      yesterday: yesterdayStr,
      days: [
        buildDay(todayStr, true, false),
        buildDay(yesterdayStr, false, true),
      ],
      updatedAt: new Date().toISOString(),
      source: usedLive ? 'live' : 'cache',
    });
  } catch (error) {
    console.error('Error in /api/la-diaria-hn:', error);
    res.status(500).json({ error: 'Error obteniendo resultados de La Diaria de Honduras' });
  }
});

// --- Monazos Tica (Costa Rica · 3 Monazos JPS) ---
const MONAZOS_TICA_CACHE_FILE = path.join(DATA_DIR, 'monazos-tica-cache.json');

type MonazosSlotKey = '12:55' | '4:30' | '7:30';

interface MonazosCachedEntry {
  digits: [string, string, string];
  number3: string;
  sorteoNumber?: string;
}

interface MonazosDrawSlot {
  slotKey: MonazosSlotKey;
  slotName: string;
  timeLabel: string;
  sorteoNumber?: string;
  digits: [string, string, string] | null;
  number3: string | null;
}

interface MonazosDayData {
  date: string;
  label: string;
  isToday: boolean;
  isYesterday: boolean;
  draws: MonazosDrawSlot[];
}

const MONAZOS_SLOTS: Array<{ slotKey: MonazosSlotKey; slotName: string; timeLabel: string }> = [
  { slotKey: '12:55', slotName: 'Mediodía', timeLabel: '12:55 PM' },
  { slotKey: '4:30', slotName: 'Tarde', timeLabel: '4:30 PM' },
  { slotKey: '7:30', slotName: 'Noche', timeLabel: '7:30 PM' },
];

function normalizeMonazosSlotKey(rawTime: string): MonazosSlotKey | null {
  const clean = rawTime.trim();
  if (/12\s*:?\s*55/.test(clean)) return '12:55';
  if (/4\s*:?\s*30/.test(clean) || /16\s*:?\s*30/.test(clean)) return '4:30';
  if (/7\s*:?\s*30/.test(clean) || /19\s*:?\s*30/.test(clean)) return '7:30';
  return null;
}

function loadMonazosCache(): Record<string, Partial<Record<MonazosSlotKey, MonazosCachedEntry>>> {
  ensureDataDir();
  try {
    if (fs.existsSync(MONAZOS_TICA_CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(MONAZOS_TICA_CACHE_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading monazos cache:', err);
  }
  return {};
}

function saveMonazosCache(cache: Record<string, Partial<Record<MonazosSlotKey, MonazosCachedEntry>>>) {
  ensureDataDir();
  try {
    fs.writeFileSync(MONAZOS_TICA_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving monazos cache:', err);
  }
}

async function fetchMonazosFromLoteriaCR(
  targetDateStr?: string
): Promise<Record<string, Partial<Record<MonazosSlotKey, MonazosCachedEntry>>>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const parsed: Record<string, Partial<Record<MonazosSlotKey, MonazosCachedEntry>>> = {};

  try {
    const url = targetDateStr
      ? `https://loteriacr.com/resultados/3-monazos/${targetDateStr}/`
      : 'https://loteriacr.com/resultados/3-monazos/';
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlgoritmoZL/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!response.ok) return parsed;

    const html = await response.text();

    // 1. Parsear tabla histórica (trae número de sorteo, fecha DD/MM/YYYY, hora y 3 dígitos)
    const tableRowRegex =
      /<td class="tabla__sorteo"[^>]*>\s*([^<]+?)\s*<\/td>\s*<td class="tabla__fecha"[^>]*>\s*<span class="tabla__dia">\s*(\d{2})\/(\d{2})\/(\d{4})\s*<\/span>\s*<span class="tabla__hora">\s*([^<]+?)\s*<\/span>\s*<\/td>\s*<td class="tabla__resultado"[^>]*>\s*([^<]+?)\s*<\/td>/gi;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = tableRowRegex.exec(html)) !== null) {
      const sorteoNumber = rowMatch[1].trim();
      const dateStr = `${rowMatch[4]}-${rowMatch[3]}-${rowMatch[2]}`;
      const slotKey = normalizeMonazosSlotKey(rowMatch[5]);
      const digitsFound = rowMatch[6].match(/\d/g);
      if (!slotKey || !digitsFound || digitsFound.length < 3) continue;
      const digits: [string, string, string] = [digitsFound[0], digitsFound[1], digitsFound[2]];
      if (!parsed[dateStr]) parsed[dateStr] = {};
      parsed[dateStr][slotKey] = {
        digits,
        number3: digits.join(''),
        sorteoNumber,
      };
    }

    // 2. Parsear tarjetas del día mostrado (útil en página de fecha específica o resultados de hoy)
    const cardDateStr = targetDateStr || getAnguillaCostaRicaNow().dateStr;
    const dayGridMatch = html.match(/<div class="rejilla-resultados rejilla-resultados--dia">([\s\S]*?)<\/div>\s*(?:<h2|$)/i);
    const cardsSource = dayGridMatch ? dayGridMatch[1] : (targetDateStr ? html : '');
    if (cardsSource) {
      const cardRegex =
        /<span class="tarjeta-resultado__hora">\s*([^<]+?)\s*<\/span>[\s\S]*?<div class="tres-bolas">([\s\S]*?)<\/div>/gi;
      let cardMatch: RegExpExecArray | null;
      while ((cardMatch = cardRegex.exec(cardsSource)) !== null) {
        const slotKey = normalizeMonazosSlotKey(cardMatch[1]);
        const balls = Array.from(
          cardMatch[2].matchAll(/<span class="tres-bolas__bola">\s*(\d)\s*<\/span>/gi)
        ).map((m) => m[1]);
        if (!slotKey || balls.length < 3) continue;
        const digits: [string, string, string] = [balls[0], balls[1], balls[2]];
        if (!parsed[cardDateStr]) parsed[cardDateStr] = {};
        if (!parsed[cardDateStr][slotKey]) {
          parsed[cardDateStr][slotKey] = {
            digits,
            number3: digits.join(''),
          };
        }
      }
    }

    return parsed;
  } catch (err) {
    console.error('Error fetching 3 Monazos Costa Rica:', err);
    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

app.get('/api/monazos-tica', async (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    const crNow = getAnguillaCostaRicaNow();
    const todayStr = crNow.dateStr;
    const yesterdayStr = shiftDateStr(todayStr, -1);

    const requestedDate =
      typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
        ? req.query.date
        : null;
    const daysCount = requestedDate
      ? 1
      : Math.min(Math.max(parseInt(String(req.query.days || '4'), 10) || 4, 1), 7);

    const targetDates: string[] = [];
    if (requestedDate) {
      targetDates.push(requestedDate);
    } else {
      for (let i = 0; i < daysCount; i++) {
        targetDates.push(shiftDateStr(todayStr, -i));
      }
    }

    const cache = loadMonazosCache();
    let cacheChanged = false;
    let usedLive = false;

    try {
      const mainLive = await fetchMonazosFromLoteriaCR();
      for (const [dt, slotsMap] of Object.entries(mainLive)) {
        if (!cache[dt]) cache[dt] = {};
        for (const [slotKey, entry] of Object.entries(slotsMap) as Array<
          [MonazosSlotKey, MonazosCachedEntry | undefined]
        >) {
          if (!entry) continue;
          const prev = cache[dt][slotKey];
          if (
            !prev ||
            prev.number3 !== entry.number3 ||
            (entry.sorteoNumber && prev.sorteoNumber !== entry.sorteoNumber)
          ) {
            cache[dt][slotKey] = { ...prev, ...entry };
            cacheChanged = true;
          }
        }
      }
      if (Object.keys(mainLive).length > 0) {
        usedLive = true;
      }

      // Buscar fechas faltantes (por ejemplo al consultar días anteriores o una fecha del filtro)
      const missingDates = targetDates.filter((dt) => {
        if (dt > todayStr) return false;
        const count = Object.keys(cache[dt] || {}).length;
        return count < 3 && (dt !== todayStr || !mainLive[dt]);
      });

      if (missingDates.length > 0) {
        const extraResults = await Promise.all(
          missingDates.map((dt) => fetchMonazosFromLoteriaCR(dt))
        );
        for (const extraMap of extraResults) {
          for (const [dt, slotsMap] of Object.entries(extraMap)) {
            if (!cache[dt]) cache[dt] = {};
            for (const [slotKey, entry] of Object.entries(slotsMap) as Array<
              [MonazosSlotKey, MonazosCachedEntry | undefined]
            >) {
              if (!entry) continue;
              const prev = cache[dt][slotKey];
              if (!prev || prev.number3 !== entry.number3) {
                cache[dt][slotKey] = { ...prev, ...entry };
                cacheChanged = true;
              }
            }
          }
          if (Object.keys(extraMap).length > 0) {
            usedLive = true;
          }
        }
      }

      if (cacheChanged) {
        saveMonazosCache(cache);
      }
    } catch (liveErr) {
      console.error('Live fetch error in /api/monazos-tica, falling back to cache:', liveErr);
    }

    const days: MonazosDayData[] = targetDates.map((dateStr) => {
      const dayCache = cache[dateStr] || {};
      return {
        date: dateStr,
        label: formatAnguillaDateLabel(dateStr).label,
        isToday: dateStr === todayStr,
        isYesterday: dateStr === yesterdayStr,
        draws: MONAZOS_SLOTS.map((slot) => {
          const entry = dayCache[slot.slotKey];
          return {
            slotKey: slot.slotKey,
            slotName: slot.slotName,
            timeLabel: slot.timeLabel,
            sorteoNumber: entry?.sorteoNumber,
            digits: entry?.digits ?? null,
            number3: entry?.number3 ?? null,
          };
        }),
      };
    });

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      today: todayStr,
      yesterday: yesterdayStr,
      days,
      updatedAt: new Date().toISOString(),
      source: usedLive ? 'live' : 'cache',
    });
  } catch (error) {
    console.error('Error in /api/monazos-tica:', error);
    res.status(500).json({ error: 'Error obteniendo resultados de Monazos Tica' });
  }
});

// --- Tiempos Tica (Costa Rica · Nuevos Tiempos JPS) ---
const TIEMPOS_TICA_CACHE_FILE = path.join(DATA_DIR, 'tiempos-tica-cache.json');

interface TiemposCachedEntry {
  number2: string;
  sorteoNumber?: string;
  megaNumero?: string;
  bolita?: string;
}

interface TiemposDrawSlot {
  slotKey: MonazosSlotKey;
  slotName: string;
  timeLabel: string;
  sorteoNumber?: string;
  number2: string | null;
  megaNumero?: string;
  bolita?: string;
  probableMain?: string;
  probables?: string[];
  hondurasProbables?: string[];
  hondurasSourceNumber?: string;
  hondurasSourceTime?: string;
}

interface TiemposDayData {
  date: string;
  label: string;
  isToday: boolean;
  isYesterday: boolean;
  dailyZlNumber?: string;
  draws: TiemposDrawSlot[];
}

function loadTiemposCache(): Record<string, Partial<Record<MonazosSlotKey, TiemposCachedEntry>>> {
  ensureDataDir();
  try {
    if (fs.existsSync(TIEMPOS_TICA_CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(TIEMPOS_TICA_CACHE_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading tiempos cache:', err);
  }
  return {};
}

function saveTiemposCache(cache: Record<string, Partial<Record<MonazosSlotKey, TiemposCachedEntry>>>) {
  ensureDataDir();
  try {
    fs.writeFileSync(TIEMPOS_TICA_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving tiempos cache:', err);
  }
}

async function fetchTiemposFromLoteriaCR(
  targetDateStr?: string
): Promise<Record<string, Partial<Record<MonazosSlotKey, TiemposCachedEntry>>>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const parsed: Record<string, Partial<Record<MonazosSlotKey, TiemposCachedEntry>>> = {};

  try {
    const url = targetDateStr
      ? `https://loteriacr.com/resultados/nuevos-tiempos/${targetDateStr}/`
      : 'https://loteriacr.com/resultados/nuevos-tiempos/';
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlgoritmoZL/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!response.ok) return parsed;

    const html = await response.text();

    // 1. Parsear tabla histórica (sorteo, fecha DD/MM/YYYY, hora y número de 2 cifras)
    const tableRowRegex =
      /<td class="tabla__sorteo"[^>]*>\s*([^<]+?)\s*<\/td>\s*<td class="tabla__fecha"[^>]*>\s*<span class="tabla__dia">\s*(\d{2})\/(\d{2})\/(\d{4})\s*<\/span>\s*<span class="tabla__hora">\s*([^<]+?)\s*<\/span>\s*<\/td>\s*<td class="tabla__resultado"[^>]*>\s*([^<]+?)\s*<\/td>/gi;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = tableRowRegex.exec(html)) !== null) {
      const sorteoNumber = rowMatch[1].trim();
      const dateStr = `${rowMatch[4]}-${rowMatch[3]}-${rowMatch[2]}`;
      const slotKey = normalizeMonazosSlotKey(rowMatch[5]);
      const numMatch = rowMatch[6].match(/\d{1,2}/);
      if (!slotKey || !numMatch) continue;
      const number2 = numMatch[0].padStart(2, '0');
      if (!parsed[dateStr]) parsed[dateStr] = {};
      parsed[dateStr][slotKey] = {
        ...parsed[dateStr][slotKey],
        number2,
        sorteoNumber,
      };
    }

    // 2. Parsear tarjetas del día mostrado (incluyen número, Meganúmero y Bolita)
    const cardDateStr = targetDateStr || getAnguillaCostaRicaNow().dateStr;
    const dayGridMatch = html.match(/<div class="rejilla-resultados rejilla-resultados--dia">([\s\S]*?)<\/div>\s*(?:<h2|$)/i);
    const cardsSource = dayGridMatch ? dayGridMatch[1] : (targetDateStr ? html : '');
    if (cardsSource) {
      const cardRegex = /<article class="tarjeta-resultado[^>]*>([\s\S]*?)<\/article>/gi;
      let cardMatch: RegExpExecArray | null;
      while ((cardMatch = cardRegex.exec(cardsSource)) !== null) {
        const cardHtml = cardMatch[1];
        const horaMatch = cardHtml.match(/<span class="tarjeta-resultado__hora">\s*([^<]+?)\s*<\/span>/i);
        const numMatch = cardHtml.match(/<span class="bola-grande__num">\s*(\d{1,2})\s*<\/span>/i);
        if (!horaMatch || !numMatch) continue;
        const slotKey = normalizeMonazosSlotKey(horaMatch[1]);
        if (!slotKey) continue;
        const number2 = numMatch[1].padStart(2, '0');
        const megaMatch = cardHtml.match(/Megan[uú]mero\s*<strong>\s*(\d{1,2})\s*<\/strong>/i);
        const bolitaMatch = cardHtml.match(/<li class="pastilla pastilla--bolita[^"]*">\s*([^<]+?)\s*<\/li>/i);
        const megaNumero = megaMatch ? megaMatch[1].padStart(2, '0') : undefined;
        const bolita = bolitaMatch ? bolitaMatch[1].trim() : undefined;

        if (!parsed[cardDateStr]) parsed[cardDateStr] = {};
        parsed[cardDateStr][slotKey] = {
          ...parsed[cardDateStr][slotKey],
          number2,
          ...(megaNumero ? { megaNumero } : {}),
          ...(bolita ? { bolita } : {}),
        };
      }
    }

    return parsed;
  } catch (err) {
    console.error('Error fetching Nuevos Tiempos Costa Rica:', err);
    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

async function syncTiemposTicaCache(
  targetDates: string[],
  todayStr: string
): Promise<{
  cache: Record<string, Partial<Record<MonazosSlotKey, TiemposCachedEntry>>>;
  usedLive: boolean;
}> {
  const cache = loadTiemposCache();
  let cacheChanged = false;
  let usedLive = false;

  try {
    const mainLive = await fetchTiemposFromLoteriaCR();
    for (const [dt, slotsMap] of Object.entries(mainLive)) {
      if (!cache[dt]) cache[dt] = {};
      for (const [slotKey, entry] of Object.entries(slotsMap) as Array<
        [MonazosSlotKey, TiemposCachedEntry | undefined]
      >) {
        if (!entry) continue;
        const prev = cache[dt][slotKey];
        if (
          !prev ||
          prev.number2 !== entry.number2 ||
          (entry.sorteoNumber && prev.sorteoNumber !== entry.sorteoNumber) ||
          (entry.megaNumero && prev.megaNumero !== entry.megaNumero) ||
          (entry.bolita && prev.bolita !== entry.bolita)
        ) {
          cache[dt][slotKey] = { ...prev, ...entry };
          cacheChanged = true;
        }
      }
    }
    if (Object.keys(mainLive).length > 0) {
      usedLive = true;
    }

    const missingDates = targetDates.filter((dt) => {
      if (dt > todayStr) return false;
      const slots = cache[dt] || {};
      const count = Object.keys(slots).length;
      const missingExtraMeta = Object.values(slots).some((s) => s && !s.bolita && !s.megaNumero);
      return count < 3 || missingExtraMeta;
    });

    if (missingDates.length > 0) {
      const extraResults = await Promise.all(
        missingDates.map((dt) => fetchTiemposFromLoteriaCR(dt))
      );
      for (const extraMap of extraResults) {
        for (const [dt, slotsMap] of Object.entries(extraMap)) {
          if (!cache[dt]) cache[dt] = {};
          for (const [slotKey, entry] of Object.entries(slotsMap) as Array<
            [MonazosSlotKey, TiemposCachedEntry | undefined]
          >) {
            if (!entry) continue;
            const prev = cache[dt][slotKey];
            if (
              !prev ||
              prev.number2 !== entry.number2 ||
              (entry.sorteoNumber && prev.sorteoNumber !== entry.sorteoNumber) ||
              (entry.megaNumero && prev.megaNumero !== entry.megaNumero) ||
              (entry.bolita && prev.bolita !== entry.bolita)
            ) {
              cache[dt][slotKey] = { ...prev, ...entry };
              cacheChanged = true;
            }
          }
        }
        if (Object.keys(extraMap).length > 0) {
          usedLive = true;
        }
      }
    }

    if (cacheChanged) {
      saveTiemposCache(cache);
    }
  } catch (liveErr) {
    console.error('Live fetch error in syncTiemposTicaCache, falling back to cache:', liveErr);
  }

  return { cache, usedLive };
}

function isNearCostaRicaDrawWindow(): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Costa_Rica',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const totalMinutes = hour * 60 + minute;

  // Ventana: 15 min antes hasta 25 min después de 12:55, 4:30 (16:30) y 7:30 (19:30) CR
  const drawMinutes = [12 * 60 + 55, 16 * 60 + 30, 19 * 60 + 30];
  return drawMinutes.some((m) => totalMinutes >= m - 15 && totalMinutes <= m + 25);
}

let tiemposBgTimer: ReturnType<typeof setTimeout> | null = null;
let isTiemposBgRunning = false;

function startTiemposBackgroundSync() {
  if (tiemposBgTimer) {
    clearTimeout(tiemposBgTimer);
  }

  const runTick = async () => {
    if (!isTiemposBgRunning) {
      isTiemposBgRunning = true;
      try {
        const crNow = getAnguillaCostaRicaNow();
        const todayStr = crNow.dateStr;
        const yesterdayStr = shiftDateStr(todayStr, -1);
        await syncTiemposTicaCache([todayStr, yesterdayStr], todayStr);
      } catch (err) {
        console.error('Tiempos background sync error:', err);
      } finally {
        isTiemposBgRunning = false;
      }
    }

    const nextIntervalMs = isNearCostaRicaDrawWindow() ? 20_000 : 90_000;
    tiemposBgTimer = setTimeout(runTick, nextIntervalMs);
  };

  tiemposBgTimer = setTimeout(runTick, 3_000);
}

app.get('/api/tiempos-tica', async (req, res) => {
  try {
    if (!verifyAccess(req)) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    const monasusHeader = String(req.headers['x-monasus-key'] || req.query.monasusKey || '').trim();
    const secConfig = loadSecurityConfig();
    const expectedKey = secConfig.monasusKey || DEFAULT_MONASUS_KEY;
    if (!monasusHeader || monasusHeader !== expectedKey) {
      return res.status(401).json({ error: 'Clave privada de Tiempos Tica requerida o incorrecta' });
    }

    const crNow = getAnguillaCostaRicaNow();
    const todayStr = crNow.dateStr;
    const yesterdayStr = shiftDateStr(todayStr, -1);

    const requestedDate =
      typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
        ? req.query.date
        : null;
    const daysCount = requestedDate
      ? 1
      : Math.min(Math.max(parseInt(String(req.query.days || '6'), 10) || 6, 1), 15);

    const targetDates: string[] = [];
    if (requestedDate) {
      targetDates.push(requestedDate);
    } else {
      for (let i = 0; i < daysCount; i++) {
        targetDates.push(shiftDateStr(todayStr, -i));
      }
    }

    const prevOfOldest = shiftDateStr(targetDates[targetDates.length - 1], -1);
    const syncDates = Array.from(new Set([...targetDates, prevOfOldest]));
    const [{ cache, usedLive }, { cache: hnCache }] = await Promise.all([
      syncTiemposTicaCache(syncDates, todayStr),
      syncLaDiariaCacheForDates(targetDates, todayStr),
    ]);

    const computeSorteoProbables = (sorteoNumber?: string): string[] => {
      if (!sorteoNumber) return [];
      const clean = sorteoNumber.replace(/\D/g, '');
      if (clean.length < 5) return [];
      const part1 = parseInt(clean.slice(0, 2), 10);
      const part2 = parseInt(clean.slice(2, 4), 10);
      const part3 = parseInt(clean.slice(4), 10);
      if (Number.isNaN(part1) || Number.isNaN(part2) || Number.isNaN(part3)) return [];
      const base = part1 + part2 + part3;
      const direct = String(((base % 100) + 100) % 100).padStart(2, '0');
      return [direct];
    };

    let anchor: { dateMs: number; slotIdx: number; sorteoNum: number } | null = null;
    for (const [dt, slotsMap] of Object.entries(cache)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dt)) continue;
      const [ay, am, ad] = dt.split('-').map(Number);
      const dateMs = Date.UTC(ay, am - 1, ad);
      MONAZOS_SLOTS.forEach((slot, slotIdx) => {
        const sn = slotsMap?.[slot.slotKey]?.sorteoNumber;
        const num = sn ? parseInt(sn.replace(/\D/g, ''), 10) : NaN;
        if (!Number.isNaN(num) && num > 0) {
          if (
            !anchor ||
            dateMs > anchor.dateMs ||
            (dateMs === anchor.dateMs && slotIdx > anchor.slotIdx)
          ) {
            anchor = { dateMs, slotIdx, sorteoNum: num };
          }
        }
      });
    }

    const days: TiemposDayData[] = targetDates.map((dateStr) => {
      const dayCache = cache[dateStr] || {};
      const [dy, dm, dd] = dateStr.split('-').map(Number);
      const dateMs = Date.UTC(dy, dm - 1, dd);

      const prevDateStr = shiftDateStr(dateStr, -1);
      const prevDayCache = cache[prevDateStr] || {};
      const prevN1 = prevDayCache['12:55']?.number2;
      const prevN2 = prevDayCache['4:30']?.number2;
      const prevN3 = prevDayCache['7:30']?.number2;

      let mediodiaProbableMain: string | undefined;
      if (prevN1 && prevN2 && prevN3) {
        const sum =
          (parseInt(prevN1, 10) || 0) +
          (parseInt(prevN2, 10) || 0) +
          (parseInt(prevN3, 10) || 0);
        mediodiaProbableMain = String(sum % 100).padStart(2, '0');
      }

      const dayPadded = String(dd).padStart(2, '0');
      const dayReversed = dayPadded.split('').reverse().join('');
      const dailyZlNumber = calculateWithBase(dayReversed, '13').direct;

      return {
        date: dateStr,
        label: formatAnguillaDateLabel(dateStr).label,
        isToday: dateStr === todayStr,
        isYesterday: dateStr === yesterdayStr,
        dailyZlNumber,
        draws: MONAZOS_SLOTS.map((slot, slotIdx) => {
          const entry = dayCache[slot.slotKey];
          let effectiveSorteoNumber = entry?.sorteoNumber;
          if (!effectiveSorteoNumber && anchor) {
            const dayDiff = Math.round((dateMs - anchor.dateMs) / 86400000);
            const slotDiff = dayDiff * 3 + (slotIdx - anchor.slotIdx);
            const inferred = anchor.sorteoNum + slotDiff;
            if (inferred > 0) {
              effectiveSorteoNumber = String(inferred);
            }
          }

          const probableMain = slot.slotKey === '12:55' ? mediodiaProbableMain : undefined;
          const sorteoProbs = computeSorteoProbables(effectiveSorteoNumber);
          const probables: string[] = [];
          if (probableMain) probables.push(probableMain);
          for (const p of sorteoProbs) {
            if (!probables.includes(p)) probables.push(p);
          }
          if (dailyZlNumber && !probables.includes(dailyZlNumber)) {
            probables.push(dailyZlNumber);
          }

          // Sorteo de Honduras:
          // - 11:00 AM -> Tica Mediodía (12:55 PM)
          // - 3:00 PM  -> Tica Tarde (4:30 PM)
          // - 9:00 PM  -> NO se toma en cuenta (Noche 7:30 PM no lleva Honduras)
          let hondurasSourceNumber: string | undefined;
          let hondurasSourceTime: string | undefined;
          let hondurasProbables: string[] = [];

          if (slot.slotKey === '12:55') {
            const hn11 = hnCache[dateStr]?.[11]?.number;
            if (hn11) {
              const hnZl = calculateWithBase(hn11, '13');
              hondurasSourceNumber = hn11;
              hondurasSourceTime = '11:00 AM';
              hondurasProbables = hnZl.direct === hnZl.dual ? [hnZl.direct] : [hnZl.direct, hnZl.dual];
            }
          } else if (slot.slotKey === '4:30') {
            const hn3 = hnCache[dateStr]?.[15]?.number;
            if (hn3) {
              const hnZl = calculateWithBase(hn3, '13');
              hondurasSourceNumber = hn3;
              hondurasSourceTime = '3:00 PM';
              hondurasProbables = hnZl.direct === hnZl.dual ? [hnZl.direct] : [hnZl.direct, hnZl.dual];
            }
          }

          return {
            slotKey: slot.slotKey,
            slotName: slot.slotName,
            timeLabel: slot.timeLabel,
            sorteoNumber: effectiveSorteoNumber,
            number2: entry?.number2 ?? null,
            megaNumero: entry?.megaNumero,
            bolita: entry?.bolita,
            ...(probableMain !== undefined ? { probableMain } : {}),
            ...(probables.length > 0 ? { probables } : {}),
            ...(hondurasProbables.length > 0
              ? { hondurasProbables, hondurasSourceNumber, hondurasSourceTime }
              : {}),
          };
        }),
      };
    });

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      today: todayStr,
      yesterday: yesterdayStr,
      days,
      updatedAt: new Date().toISOString(),
      source: usedLive ? 'live' : 'cache',
    });
  } catch (error) {
    console.error('Error in /api/tiempos-tica:', error);
    res.status(500).json({ error: 'Error obteniendo resultados de Tiempos Tica' });
  }
});

// Endpoint con metadata del paquete Android
app.get('/api/android-status', (_req, res) => {
  const zipPath = path.resolve('/tmp', 'algoritmo-zl-android-studio.zip');
  const exists = fs.existsSync(zipPath);
  let sizeMb = 0;
  if (exists) {
    const stats = fs.statSync(zipPath);
    sizeMb = +(stats.size / (1024 * 1024)).toFixed(2);
  }
  res.json({
    ready: exists,
    sizeMb,
    packageName: 'com.algoritmozl.app',
    appName: 'Algoritmo ZL',
    downloadUrl: '/api/download-android-project',
  });
});

// Endpoint para descargar el proyecto completo de Android Studio
app.get('/api/download-android-project', (_req, res) => {
  try {
    const zipPath = path.resolve('/tmp', 'algoritmo-zl-android-studio.zip');
    const scriptPath = path.resolve(__dirname, 'scripts', 'package_android.py');

    // Si el zip no existe o si se solicita forzar regeneración
    if (!fs.existsSync(zipPath)) {
      console.log('Generating Android project zip...');
      execSync(`python3 "${scriptPath}" "${zipPath}"`, { stdio: 'inherit' });
    }

    res.download(zipPath, 'algoritmo-zl-android-studio.zip', (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error al enviar el archivo zip' });
        }
      }
    });
  } catch (error) {
    console.error('Error generating or downloading android zip:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al procesar el archivo del proyecto Android' });
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    startTiemposBackgroundSync();
  });
}

startServer();
