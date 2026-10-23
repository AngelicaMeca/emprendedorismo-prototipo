// Ejecuta el aviso físico en el navegador del prototipo. En el producto real
// esto lo hace el servicio Android (Vibrator, AudioAttributes USAGE_VOICE_COMMUNICATION
// para que el tono salga solo por el auricular, CameraManager.setTorchMode).

import type { AvisoFisico } from "./types";

export function vibrar(patron: number[]) {
  if (!patron.length || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(patron);
  } catch {
    /* navegadores de escritorio */
  }
}

// Dos tonos graves y cortos (440 Hz → 330 Hz), 0,9 s en total, a bajo volumen.
export function tonoDiscreto() {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    const ctx = new Ctx();
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(ctx.destination);
    const nota = (freq: number, t0: number) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.38);
      o.start(t0);
      o.stop(t0 + 0.4);
    };
    const t = ctx.currentTime + 0.02;
    nota(440, t);
    nota(330, t + 0.45);
    setTimeout(() => void ctx.close(), 1200);
  } catch {
    /* sin audio */
  }
}

export function duracionVibracion(patron: number[]): number {
  return patron.reduce((a, b) => a + b, 0);
}

// Dispara todo lo que corresponda y devuelve una función para cancelar la repetición.
export function ejecutarAviso(aviso: AvisoFisico, hooks: { onVibrar?: (ms: number) => void; onLinterna?: () => void } = {}): () => void {
  const lanzar = () => {
    if (aviso.vibracion.length) {
      vibrar(aviso.vibracion);
      hooks.onVibrar?.(duracionVibracion(aviso.vibracion));
    }
  };
  lanzar();
  if (aviso.tono) tonoDiscreto();
  if (aviso.linterna) hooks.onLinterna?.();
  let timer: ReturnType<typeof setInterval> | null = null;
  if (aviso.repetirMs) timer = setInterval(lanzar, aviso.repetirMs);
  return () => {
    if (timer) clearInterval(timer);
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(0);
  };
}
