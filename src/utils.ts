/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CardNumber {
  label: string;
  value: string;
  id: string;
  cardId: string;
  isSpecialOrange?: boolean;
}

export interface BaseDelDiaResult {
  baseUsed: string;
  direct: string;
  dual: string;
  directOptions?: string[];
  dualOptions?: string[];
  allNumbers: string[];
}

export interface CalculationResult {
  fuertes: CardNumber[];
  extras: CardNumber[];
  numeroBombaDia?: string;
  baseDelDia?: BaseDelDiaResult;
  allNumbers: string[];
  leyDirect: string;
  igualDirect: string;
  leyReversed?: string;
  multiplicacion?: string;
  restaDia?: string;
  restaCien?: string;
  inputUsed?: string;
  dayUsed?: number;
  dateUsed?: {
    day: number;
    month: number;
    year: number;
  };
}

export interface DeviceInfo {
  id: string;
  name: string;
  platform: string;
  firstSeen: string;
  lastSeen: string;
  isOnline: boolean;
}

export interface DevicePingResponse {
  activeCount: number;
  totalCount: number;
  devices: DeviceInfo[];
}

/**
 * Determina el endpoint de la API según si corre en la web o empaquetada como App nativa (Capacitor/Android).
 */
export function getApiUrl(apiPath: string): string {
  const cleanPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  if (import.meta.env.VITE_API_BASE_URL) {
    return `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}${cleanPath}`;
  }
  // Si se ejecuta dentro de la App nativa de Android (Capacitor usa el protocolo capacitor:// o file://)
  if (
    typeof window !== 'undefined' &&
    (window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:' ||
      (window.location.hostname === 'localhost' && window.location.port === ''))
  ) {
    return `https://ais-pre-ewtq6rvy24t355ihlvehgd-356562217147.us-west1.run.app${cleanPath}`;
  }
  return cleanPath;
}

export function getApiCalculateUrl(): string {
  return getApiUrl('/api/calculate');
}

export const AUTH_STORAGE_KEY = 'zl_auth_key';

export function getStoredAuthKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

export function setStoredAuthKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, key.trim());
}

export function clearStoredAuthKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export interface AuthVerifyResult {
  valid: boolean;
  secretKey?: string;
  masterPin?: string;
  message?: string;
  error?: string;
}

export async function verifyAuth(keyOrPin: string): Promise<AuthVerifyResult> {
  const url = getApiUrl('/api/auth/verify');
  const cleanInput = keyOrPin.trim();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: cleanInput, pin: cleanInput }),
  });

  const data = await response.json();
  if (response.ok && data.valid && data.secretKey) {
    setStoredAuthKey(data.secretKey);
  }
  return data;
}

export async function fetchSecurityInfo(): Promise<{ secretKey: string; masterPin: string; updatedAt: string }> {
  const key = getStoredAuthKey();
  const url = getApiUrl('/api/auth/info');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${key || ''}`,
      'x-access-key': key || '',
    },
  });

  if (!response.ok) {
    throw new Error('No autorizado para ver la configuración de seguridad');
  }

  return response.json();
}

export async function regenerateAccessKey(): Promise<{ newKey: string; masterPin: string }> {
  const key = getStoredAuthKey();
  const url = getApiUrl('/api/auth/regenerate-key');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key || ''}`,
      'x-access-key': key || '',
    },
  });

  if (!response.ok) {
    throw new Error('Error al regenerar el enlace privado');
  }

  const data = await response.json();
  if (data.newKey) {
    setStoredAuthKey(data.newKey);
  }
  return data;
}

export async function updateOwnerPin(newPin: string): Promise<{ masterPin: string }> {
  const key = getStoredAuthKey();
  const url = getApiUrl('/api/auth/update-pin');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key || ''}`,
      'x-access-key': key || '',
    },
    body: JSON.stringify({ newPin }),
  });

  if (!response.ok) {
    throw new Error('Error al actualizar el PIN');
  }

  return response.json();
}

/**
 * Cliente seguro: solicita el cálculo al backend protegido.
 * Ninguna fórmula matemática ni lógica de cruce reside en el código del navegador.
 */
export async function fetchAlgorithmZL(
  numberStr: string,
  dateInput?: number | { day?: number; month?: number; year?: number }
): Promise<CalculationResult> {
  const url = getApiCalculateUrl();
  const now = new Date();
  let day: number | undefined;
  let month: number | undefined;
  let year: number | undefined;

  if (typeof dateInput === 'number') {
    day = dateInput;
  } else if (dateInput) {
    day = dateInput.day;
    month = dateInput.month;
    year = dateInput.year;
  }

  const currentDay = (day && day >= 1 && day <= 31) ? day : now.getDate();
  const currentMonth = (month && month >= 1 && month <= 12) ? month : now.getMonth() + 1;
  const currentYear = (year && year >= 2000 && year <= 2100) ? year : now.getFullYear();
  const authKey = getStoredAuthKey();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authKey || ''}`,
      'x-access-key': authKey || '',
    },
    body: JSON.stringify({
      number: numberStr,
      day: currentDay,
      month: currentMonth,
      year: currentYear,
      key: authKey,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('LOCKED: Acceso denegado. Enlace desactivado.');
    }
    throw new Error(`Error en el servidor: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Obtiene o crea un ID único y persistente para este dispositivo en localStorage.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_id';
  const STORAGE_KEY = 'zl_device_unique_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    deviceId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Detecta inteligentemente la marca o modelo del dispositivo según el navegador y User-Agent.
 */
export function detectDefaultDeviceName(): { name: string; platform: string } {
  if (typeof window === 'undefined') {
    return { name: 'Dispositivo Web', platform: 'Web' };
  }

  const ua = navigator.userAgent || '';

  // Detección de plataforma
  let platform = 'Web';
  if (/Android/i.test(ua)) platform = 'Android';
  else if (/iPhone/i.test(ua)) platform = 'iPhone';
  else if (/iPad/i.test(ua)) platform = 'iPad';
  else if (/Macintosh|Mac OS/i.test(ua)) platform = 'Mac';
  else if (/Windows/i.test(ua)) platform = 'Windows';
  else if (/Linux/i.test(ua)) platform = 'Linux';

  // Detección de marca / modelo
  let name = 'Dispositivo';

  if (/SM-[A-Z0-9]+|Samsung/i.test(ua)) {
    name = 'Samsung Galaxy (Android)';
  } else if (/Xiaomi|Redmi|POCO/i.test(ua)) {
    name = 'Xiaomi Redmi (Android)';
  } else if (/Motorola|Moto/i.test(ua)) {
    name = 'Motorola Moto (Android)';
  } else if (/Huawei|HONOR/i.test(ua)) {
    name = 'Huawei / Honor';
  } else if (/Pixel/i.test(ua)) {
    name = 'Google Pixel';
  } else if (/iPhone/i.test(ua)) {
    name = 'Apple iPhone';
  } else if (/iPad/i.test(ua)) {
    name = 'Apple iPad';
  } else if (/Android/i.test(ua)) {
    name = 'Teléfono Android';
  } else if (/Windows/i.test(ua)) {
    name = 'PC Windows';
  } else if (/Macintosh/i.test(ua)) {
    name = 'Computadora Mac';
  } else {
    name = `Equipo ${platform}`;
  }

  return { name, platform };
}

/**
 * Obtiene el nombre guardado para este dispositivo (o el detectado automáticamente).
 */
export function getSavedDeviceName(): string {
  if (typeof window === 'undefined') return 'Dispositivo';
  const custom = localStorage.getItem('zl_device_custom_name');
  if (custom && custom.trim()) {
    return custom.trim();
  }
  return detectDefaultDeviceName().name;
}

/**
 * Guarda un nombre personalizado para este dispositivo.
 */
export function setSavedDeviceName(name: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('zl_device_custom_name', name.trim());
}

/**
 * Envía pulso (heartbeat) al servidor para registrar la conexión del dispositivo y su nombre.
 */
export async function sendDevicePing(): Promise<DevicePingResponse> {
  const deviceId = getOrCreateDeviceId();
  const deviceName = getSavedDeviceName();
  const { platform } = detectDefaultDeviceName();
  const authKey = getStoredAuthKey();

  const url = getApiUrl('/api/device-ping');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authKey || ''}`,
      'x-access-key': authKey || '',
    },
    body: JSON.stringify({
      deviceId,
      deviceName,
      platform,
    }),
  });

  if (!response.ok) {
    throw new Error('Error en el ping del dispositivo');
  }

  return response.json();
}

/**
 * Cambia el nombre de este dispositivo en el servidor.
 */
export async function renameDeviceOnServer(newName: string): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  setSavedDeviceName(newName);
  const authKey = getStoredAuthKey();

  const url = getApiUrl('/api/device-rename');
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authKey || ''}`,
      'x-access-key': authKey || '',
    },
    body: JSON.stringify({
      deviceId,
      newName,
    }),
  });
}

export interface AnguillaDraw {
  drawName: string;
  timeLabel: string;
  hour24: number;
  first: string;
  second: string;
  third: string;
  sequence: string;
  formulaResult?: string | number;
  formulaEqual?: string;
  formulaMix?: string;
  formulaExtra?: string;
  formulaMinusOne?: string;
  formulaPlusOne?: string;
  numbersToPlay?: string[];
}

export interface AnguillaMorningPlaySlot {
  hour24: number;
  timeLabel: string;
  numbers: string[];
}

export interface AnguillaMorningStrongNumber {
  main: string;
  equal: string;
  combined: string;
}

export interface AnguillaAfternoonPlaySlot {
  hour24: number;
  timeLabel: string;
  result: string;
  equal: string;
  displayResult?: string;
  displayEqual?: string;
  sumOnly?: string;
}

export interface AnguillaDayResult {
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

export interface AnguillaResponse {
  today: string;
  activeDate?: string;
  days: AnguillaDayResult[];
  updatedAt: string;
  source: 'live' | 'cache';
}

export async function fetchAnguillaResults(params?: {
  date?: string;
  endDate?: string;
  days?: number;
}): Promise<AnguillaResponse> {
  const authKey = getStoredAuthKey();
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  if (params?.endDate) query.set('endDate', params.endDate);
  if (params?.days) query.set('days', String(params.days));

  const qs = query.toString();
  const url = getApiUrl(`/api/anguilla${qs ? `?${qs}` : ''}`);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${authKey || ''}`,
      'x-access-key': authKey || '',
    },
  });

  if (!response.ok) {
    throw new Error('No se pudieron obtener los resultados de La Anguila');
  }

  return response.json();
}

export interface LaDiariaDraw {
  timeLabel: string;
  hour24: number;
  number: string | null;
  publishedAt?: string;
}

export interface LaDiariaDayResult {
  date: string;
  label: string;
  isToday: boolean;
  isYesterday: boolean;
  draws: LaDiariaDraw[];
}

export interface LaDiariaResponse {
  today: string;
  yesterday: string;
  days: LaDiariaDayResult[];
  updatedAt: string;
  source: 'live' | 'cache';
}

export async function fetchLaDiariaHonduras(): Promise<LaDiariaResponse> {
  const authKey = getStoredAuthKey();
  const url = getApiUrl('/api/la-diaria-hn');
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${authKey || ''}`,
      'x-access-key': authKey || '',
    },
  });

  if (!response.ok) {
    throw new Error('No se pudieron obtener los resultados de La Diaria de Honduras');
  }

  return response.json();
}

export interface MonazosDraw {
  slotKey: '12:55' | '4:30' | '7:30';
  slotName: string;
  timeLabel: string;
  sorteoNumber?: string;
  digits: [string, string, string] | null;
  number3: string | null;
}

export interface MonazosDayResult {
  date: string;
  label: string;
  isToday: boolean;
  isYesterday: boolean;
  draws: MonazosDraw[];
}

export interface MonazosResponse {
  today: string;
  yesterday: string;
  days: MonazosDayResult[];
  updatedAt: string;
  source: 'live' | 'cache';
}

export async function fetchMonazosTica(params?: {
  date?: string;
  days?: number;
}): Promise<MonazosResponse> {
  const authKey = getStoredAuthKey();
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  if (params?.days) query.set('days', String(params.days));

  const qs = query.toString();
  const url = getApiUrl(`/api/monazos-tica${qs ? `?${qs}` : ''}`);
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${authKey || ''}`,
      'x-access-key': authKey || '',
    },
  });

  if (!response.ok) {
    throw new Error('No se pudieron obtener los resultados de Monazos Tica');
  }

  return response.json();
}

export async function verifyMonasusKey(monasusKey: string): Promise<{ valid: boolean; error?: string }> {
  const authKey = getStoredAuthKey();
  const url = getApiUrl('/api/monasus/verify');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authKey || ''}`,
      'x-access-key': authKey || '',
    },
    body: JSON.stringify({ monasusKey: monasusKey.trim() }),
  });

  const data = await response.json();
  return {
    valid: Boolean(response.ok && data.valid),
    error: data.error,
  };
}

export async function updateMonasusKey(
  currentKey: string,
  newKey: string
): Promise<{ success: boolean; message?: string }> {
  const authKey = getStoredAuthKey();
  const url = getApiUrl('/api/monasus/update-key');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authKey || ''}`,
      'x-access-key': authKey || '',
    },
    body: JSON.stringify({ currentKey: currentKey.trim(), newKey: newKey.trim() }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'No se pudo actualizar la clave');
  }
  return data;
}

export interface MonasusCandidate {
  id: number;
  titulo: string;
  subtitulo: string;
  raw: string;
  numero: string;
  digitos: [number, number, number];
  ajustado: boolean;
  notes: string[];
}

export interface MonasusAnalysisResult {
  sorteo: string;
  premio: string;
  digitsS: [number, number, number, number];
  digitsP: [number, number, number];
  ejeCentral: number;
  paso1: {
    formula: string;
    rawSum: number;
    hadCompression: boolean;
    chain: number[];
    digit: number;
  };
  paso2: {
    formula: string;
    digit: number;
  };
  paso3: {
    sumSorteoFormula: string;
    raizChain: number[];
    raizR: number;
    productoFormula: string;
    producto: number;
    ramaReducidaChain: number[];
    unidadReducida: number;
    unidadDirecta: number;
  };
  arrastreInvertido: {
    extremos: string;
    invertidos: string;
    cierre: number;
    raw: string;
    validado: string;
    notes: string[];
  };
  compresion: {
    activa: boolean;
    sumPremioFormula?: string;
    arrastreCifra?: number;
    raw?: string;
    validado?: string;
    notes?: string[];
  };
  tercero: {
    sorteoUsado: string;
    numero: string;
    digitos: [number, number, number];
  };
  resta: {
    formula: string;
    resultadoCompleto: string;
    numero3: string;
    digitos: [number, number, number];
  };
  miniresta: {
    formula: string;
    numero3: string;
    digitos: [number, number, number];
  };
  candidatos: MonasusCandidate[];
}

export async function analyzeMonasusDraw(
  monasusKey: string,
  sorteo: string,
  premio: string
): Promise<MonasusAnalysisResult> {
  const authKey = getStoredAuthKey();
  const url = getApiUrl('/api/monasus/analyze');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authKey || ''}`,
      'x-access-key': authKey || '',
      'x-monasus-key': monasusKey.trim(),
    },
    body: JSON.stringify({
      monasusKey: monasusKey.trim(),
      sorteo,
      premio,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'No se pudo calcular el análisis');
  }
  return data;
}

export interface TiemposDraw {
  slotKey: '12:55' | '4:30' | '7:30';
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

export interface TiemposDayResult {
  date: string;
  label: string;
  isToday: boolean;
  isYesterday: boolean;
  dailyZlNumber?: string;
  draws: TiemposDraw[];
}

export interface TiemposResponse {
  today: string;
  yesterday: string;
  days: TiemposDayResult[];
  updatedAt: string;
  source: 'live' | 'cache';
}

export async function fetchTiemposTica(params?: {
  date?: string;
  days?: number;
  monasusKey?: string;
}): Promise<TiemposResponse> {
  const authKey = getStoredAuthKey();
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  if (params?.days) query.set('days', String(params.days));

  const qs = query.toString();
  const url = getApiUrl(`/api/tiempos-tica${qs ? `?${qs}` : ''}`);
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${authKey || ''}`,
      'x-access-key': authKey || '',
      'x-monasus-key': (params?.monasusKey || '').trim(),
    },
  });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED_TIEMPOS');
  }

  if (!response.ok) {
    throw new Error('No se pudieron obtener los resultados de Tiempos Tica');
  }

  return response.json();
}




