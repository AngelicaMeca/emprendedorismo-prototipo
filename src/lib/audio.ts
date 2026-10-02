// Análisis acústico local (solo navegador). Todo el procesamiento ocurre en el
// dispositivo: el audio nunca se envía a ningún servidor. Es una aproximación
// heurística del pipeline AASIST-Lite + Tiny-ECAPA descrito en el apartado 7.1,
// pensada para el prototipo web.

import { clamp, normalizarVector } from "./utils";

export interface AnalisisAudio {
  embedding: number[]; // 128 dimensiones
  probSintesis: number; // 0..1
  calidad: number; // 0..1 (SNR estimada)
  duracionTotal: number; // s
  duracionVoz: number; // s de habla neta
  pausasPorSegundo: number;
  snrDb: number;
  indicadores: { nombre: string; valor: number; detalle: string }[];
  frecuenciaMuestreo: number;
}

const BANDAS = 64;
const N_FFT = 1024;
const HOP = 512;

function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ar = re[i + j];
        const ai = im[i + j];
        const br = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci;
        const bi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
        re[i + j] = ar + br;
        im[i + j] = ai + bi;
        re[i + j + len / 2] = ar - br;
        im[i + j + len / 2] = ai - bi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

function media(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function desvio(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = media(xs);
  return Math.sqrt(media(xs.map((x) => (x - m) * (x - m))));
}
function cv(xs: number[]): number {
  const m = media(xs);
  return m === 0 ? 0 : desvio(xs) / Math.abs(m);
}

export async function decodificarArchivo(blob: Blob): Promise<AudioBuffer> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const buf = await blob.arrayBuffer();
  try {
    return await ctx.decodeAudioData(buf);
  } finally {
    void ctx.close();
  }
}

export function analizarBuffer(buffer: AudioBuffer): AnalisisAudio {
  const sr = buffer.sampleRate;
  const canales = buffer.numberOfChannels;
  const n = buffer.length;
  const mono = new Float32Array(n);
  for (let c = 0; c < canales; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < n; i++) mono[i] += d[i] / canales;
  }

  const ventana = new Float64Array(N_FFT);
  for (let i = 0; i < N_FFT; i++) ventana[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N_FFT - 1));

  const nyq = sr / 2;
  const binHz = sr / N_FFT;
  const fMin = 80;
  const fMax = Math.min(8000, nyq);
  const limites: number[] = [];
  for (let b = 0; b <= BANDAS; b++) {
    const f = fMin * Math.pow(fMax / fMin, b / BANDAS);
    limites.push(Math.min(N_FFT / 2 - 1, Math.max(1, Math.round(f / binHz))));
  }
  const bin3500 = Math.min(N_FFT / 2 - 1, Math.round(3500 / binHz));

  const rmsFrames: number[] = [];
  const hfFrames: number[] = [];
  const centroides: number[] = [];
  const planitudes: number[] = [];
  const bandasFrames: number[][] = [];
  const re = new Float64Array(N_FFT);
  const im = new Float64Array(N_FFT);

  for (let start = 0; start + N_FFT <= n; start += HOP) {
    let energia = 0;
    for (let i = 0; i < N_FFT; i++) {
      const s = mono[start + i];
      energia += s * s;
      re[i] = s * ventana[i];
      im[i] = 0;
    }
    rmsFrames.push(Math.sqrt(energia / N_FFT));
    fft(re, im);
    const mag = new Float64Array(N_FFT / 2);
    let total = 0;
    let alta = 0;
    let numC = 0;
    let logSum = 0;
    for (let k = 1; k < N_FFT / 2; k++) {
      const m = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
      mag[k] = m;
      total += m;
      if (k >= bin3500) alta += m;
      numC += m * k * binHz;
      logSum += Math.log(m + 1e-9);
    }
    hfFrames.push(total > 0 ? alta / total : 0);
    centroides.push(total > 0 ? numC / total : 0);
    const geo = Math.exp(logSum / (N_FFT / 2 - 1));
    const arit = total / (N_FFT / 2 - 1);
    planitudes.push(arit > 0 ? geo / arit : 0);
    const bandas: number[] = [];
    for (let b = 0; b < BANDAS; b++) {
      let e = 0;
      for (let k = limites[b]; k < Math.max(limites[b] + 1, limites[b + 1]); k++) e += mag[k] * mag[k];
      bandas.push(Math.log(e + 1e-8));
    }
    bandasFrames.push(bandas);
  }

  const total = rmsFrames.length;
  const maxRms = Math.max(...rmsFrames, 1e-6);
  const umbral = Math.max(0.004, maxRms * 0.12);
  const vozIdx: number[] = [];
  const ruidoIdx: number[] = [];
  rmsFrames.forEach((r, i) => (r > umbral ? vozIdx.push(i) : ruidoIdx.push(i)));

  const duracionTotal = n / sr;
  const duracionVoz = (vozIdx.length * HOP) / sr;

  const energiaVoz = media(vozIdx.map((i) => rmsFrames[i] ** 2)) || 1e-9;
  const ordenadas = [...rmsFrames].sort((a, b) => a - b);
  const pisoRuido = ruidoIdx.length
    ? media(ruidoIdx.map((i) => rmsFrames[i] ** 2))
    : (ordenadas[Math.floor(ordenadas.length * 0.1)] ?? 1e-5) ** 2;
  const snrDb = 10 * Math.log10(energiaVoz / Math.max(pisoRuido, 1e-10));
  let calidad = clamp((snrDb - 6) / 30);
  calidad *= clamp(duracionVoz / 2);

  // Embedding: media y desvío de 64 bandas log-energía sobre tramos con voz
  const idxEmb = vozIdx.length >= 8 ? vozIdx : rmsFrames.map((_, i) => i);
  const medias = new Array(BANDAS).fill(0);
  const desvios = new Array(BANDAS).fill(0);
  idxEmb.forEach((i) => bandasFrames[i].forEach((v, b) => (medias[b] += v / idxEmb.length)));
  idxEmb.forEach((i) => bandasFrames[i].forEach((v, b) => (desvios[b] += ((v - medias[b]) ** 2) / idxEmb.length)));
  const mm = media(medias);
  const embedding = normalizarVector([...medias.map((x) => x - mm), ...desvios.map((x) => Math.sqrt(x))]);

  // Pausas: cantidad de transiciones voz→silencio por segundo de habla
  let segmentos = 0;
  for (let i = 1; i < total; i++) if (rmsFrames[i] > umbral && rmsFrames[i - 1] <= umbral) segmentos++;
  const pausasPorSegundo = duracionVoz > 0 ? segmentos / duracionVoz : 0;

  // Heurísticas anti-spoofing (2.2.2)
  const hfVoz = vozIdx.map((i) => hfFrames[i]);
  const planVoz = vozIdx.map((i) => planitudes[i]);
  const rmsVoz = vozIdx.map((i) => rmsFrames[i]);
  const centVoz = vozIdx.map((i) => centroides[i]);

  const colapsoArmonico = clamp(1 - media(hfVoz) / 0.08); // poca energía > 3.5 kHz
  const texturaUniforme = clamp(1 - cv(hfVoz) / 0.7); // textura espectral demasiado estable
  const sinRespiracion = clamp(1 - pausasPorSegundo / 0.9); // ausencia de micro-pausas
  const dinamicaPlana = clamp(1 - cv(rmsVoz) / 0.6); // envolvente temporal plana
  const planitudBaja = clamp(1 - cv(planVoz) / 0.8);
  const centroideFijo = clamp(1 - cv(centVoz) / 0.5);

  let probSintesis = clamp(
    0.05 +
      0.22 * colapsoArmonico +
      0.2 * texturaUniforme +
      0.2 * sinRespiracion +
      0.13 * dinamicaPlana +
      0.1 * planitudBaja +
      0.1 * centroideFijo,
  );
  if (vozIdx.length < 8) probSintesis = 0.5;

  return {
    embedding,
    probSintesis,
    calidad,
    duracionTotal,
    duracionVoz,
    pausasPorSegundo,
    snrDb,
    frecuenciaMuestreo: sr,
    indicadores: [
      { nombre: "Colapso de armónicos > 3,5 kHz", valor: colapsoArmonico, detalle: `Energía alta: ${(media(hfVoz) * 100).toFixed(1)}% del espectro` },
      { nombre: "Textura espectral uniforme", valor: texturaUniforme, detalle: `Variación de banda alta: ${cv(hfVoz).toFixed(2)}` },
      { nombre: "Ausencia de micro-pausas respiratorias", valor: sinRespiracion, detalle: `${pausasPorSegundo.toFixed(2)} pausas/s de habla` },
      { nombre: "Envolvente temporal plana", valor: dinamicaPlana, detalle: `Variación de energía: ${cv(rmsVoz).toFixed(2)}` },
      { nombre: "Planitud espectral constante", valor: planitudBaja, detalle: `Variación: ${cv(planVoz).toFixed(2)}` },
      { nombre: "Centroide espectral fijo", valor: centroideFijo, detalle: `Centroide medio: ${Math.round(media(centVoz))} Hz` },
    ],
  };
}

export async function analizarBlob(blob: Blob): Promise<AnalisisAudio> {
  const buffer = await decodificarArchivo(blob);
  return analizarBuffer(buffer);
}

export function soportaGrabacion(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}
