"use client";

import { Mic, Square, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { analizarBlob, soportaGrabacion, type AnalisisAudio } from "@/lib/audio";
import { cn } from "@/lib/utils";

export function Grabador({
  duracionMax = 30,
  onAnalisis,
  textoLectura,
  permitirArchivo = true,
  etiquetaBoton = "Grabar",
}: {
  duracionMax?: number;
  onAnalisis: (a: AnalisisAudio, blob: Blob) => void;
  textoLectura?: string;
  permitirArchivo?: boolean;
  etiquetaBoton?: string;
}) {
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nivel, setNivel] = useState(0);
  const [soporte] = useState(() => typeof window === "undefined" || soportaGrabacion());
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const limpiar = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    setNivel(0);
  }, []);

  useEffect(() => () => limpiar(), [limpiar]);

  const procesar = useCallback(
    async (blob: Blob) => {
      setProcesando(true);
      setError(null);
      try {
        const a = await analizarBlob(blob);
        if (a.duracionVoz < 0.5) {
          setError("No se detectó habla suficiente en el audio. Probá de nuevo más cerca del micrófono.");
        } else {
          onAnalisis(a, blob);
        }
      } catch {
        setError("No se pudo decodificar el audio. Usá un archivo WAV, MP3, OGG, M4A o WebM.");
      } finally {
        setProcesando(false);
      }
    },
    [onAnalisis],
  );

  const detener = useCallback(() => {
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    setGrabando(false);
    limpiar();
  }, [limpiar]);

  const iniciar = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false } });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        void procesar(blob);
      };
      rec.start(250);
      setGrabando(true);
      setSegundos(0);
      timerRef.current = setInterval(() => {
        setSegundos((s) => {
          if (s + 1 >= duracionMax) {
            setTimeout(() => detener(), 0);
          }
          return s + 1;
        });
      }, 1000);
      // Medidor de nivel
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      const loop = () => {
        an.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        setNivel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      setError("No se pudo acceder al micrófono. Revisá los permisos del navegador o subí un archivo.");
      limpiar();
    }
  }, [duracionMax, detener, limpiar, procesar]);

  return (
    <div className="space-y-4">
      {textoLectura && (
        <div className="rounded-xl bg-brand-50 p-4 text-sm leading-relaxed text-brand-900">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700">Leé este texto con tu voz habitual</p>
          {textoLectura}
        </div>
      )}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 p-5">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-accent-500/20 transition-transform" style={{ transform: `scale(${1 + nivel * 0.8})`, opacity: grabando ? 1 : 0 }} />
          <button
            type="button"
            disabled={!soporte || procesando}
            onClick={grabando ? detener : iniciar}
            className={cn(
              "relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-colors disabled:opacity-50",
              grabando ? "bg-red-600 hover:bg-red-700" : "bg-accent-600 hover:bg-accent-700",
            )}
            aria-label={grabando ? "Detener" : "Grabar"}
          >
            {grabando ? <Square className="h-7 w-7" /> : <Mic className="h-8 w-8" />}
          </button>
        </div>
        <p className="font-mono text-sm text-slate-700">
          {grabando ? `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")} / ${duracionMax}s` : procesando ? "Analizando en el dispositivo…" : etiquetaBoton}
        </p>
        <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-accent-500 transition-all" style={{ width: `${(segundos / duracionMax) * 100}%` }} />
        </div>
        {!soporte && <p className="text-xs text-amber-700">Este navegador no permite grabar. Subí un archivo de audio.</p>}
        {permitirArchivo && (
          <label className="mt-1 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <Upload className="h-4 w-4" />
            Subir archivo de audio
            <input
              type="file"
              accept="audio/*,.webm,.ogg,.m4a,.wav,.mp3,.opus"
              className="hidden"
              disabled={procesando || grabando}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void procesar(f);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {error && <p className="text-center text-xs text-red-600">{error}</p>}
      </div>
      <p className="text-center text-[11px] text-slate-400">El audio se procesa y se descarta en este navegador. No se transmite a ningún servidor.</p>
    </div>
  );
}
