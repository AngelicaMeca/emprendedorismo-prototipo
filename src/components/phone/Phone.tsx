"use client";

import { AlertTriangle, Bot, CheckCircle2, HelpCircle, Mic, Phone, PhoneOff, ShieldAlert, ShieldCheck, Volume2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Resultado } from "@/lib/types";
import { cn, formatearNumero } from "@/lib/utils";

export function PhoneMockup({ children, className, hora = "10:42" }: { children: ReactNode; className?: string; hora?: string }) {
  return (
    <div className={cn("relative mx-auto w-[300px] sm:w-[320px]", className)}>
      <div className="rounded-[44px] bg-brand-950 p-2.5 shadow-phone">
        <div className="relative h-[620px] overflow-hidden rounded-[36px] bg-slate-900">
          <div className="absolute top-2 left-1/2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-7 pt-3 text-[11px] font-medium text-white/90">
            <span>{hora}</span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-white/80" />
              <span className="inline-block h-2 w-2 rounded-full bg-white/60" />
              <span className="inline-block h-2 w-2 rounded-full bg-white/40" />
            </span>
          </div>
          <div className="absolute inset-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

export type FaseLlamada = "inactivo" | "repique" | "analizando" | "alerta" | "finalizada" | "resguardo";

export function PantallaLlamada({
  fase,
  numero,
  nombreContacto,
  etiqueta,
  resultado,
  progreso = 0,
  onAccion,
  pistaPalabra,
  nombreProtegido,
  nombreGuardian,
  telefonoFamiliar,
}: {
  fase: FaseLlamada;
  numero: string;
  nombreContacto?: string | null;
  etiqueta?: Resultado["etiquetaEntrante"];
  resultado: Resultado | null;
  progreso?: number;
  onAccion?: (accion: string) => void;
  pistaPalabra?: string | null;
  nombreProtegido: string;
  nombreGuardian: string;
  telefonoFamiliar?: string | null;
}) {
  if (fase === "inactivo") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-brand-900 to-brand-950 px-8 text-center text-white">
        <ShieldCheck className="mb-3 h-12 w-12 text-accent-400" />
        <p className="text-2xl font-semibold">Todo tranquilo</p>
        <p className="mt-2 text-sm text-white/70">VozReal está protegiendo el teléfono de {nombreProtegido.split(" ")[0]}.</p>
      </div>
    );
  }

  if (fase === "resguardo" && resultado) {
    return <PantallaResguardo nombreGuardian={nombreGuardian} telefonoFamiliar={telefonoFamiliar} onAccion={onAccion} discreto={resultado.discreto} />;
  }

  const bloqueada = resultado?.bloqueoSilencioso && fase !== "repique";
  const mostrarOverlay = fase === "alerta" && resultado && !resultado.bloqueoSilencioso && !resultado.discreto && resultado.nivel !== 1;
  const rojo = mostrarOverlay && resultado?.nivel === 4;

  return (
    <div className="relative flex h-full flex-col bg-gradient-to-b from-slate-800 to-slate-950 text-white">
      {/* Pantalla nativa de llamada */}
      <div className={cn("flex flex-1 flex-col items-center px-6 pt-16 text-center transition-opacity", rojo && "opacity-20")}>
        {etiqueta && fase !== "finalizada" && (
          <span
            className={cn(
              "animate-fade-in mb-3 rounded-full px-3 py-1 text-[11px] font-semibold",
              etiqueta.tono === "verde" && "bg-emerald-500/20 text-emerald-300",
              etiqueta.tono === "gris" && "bg-white/10 text-white/70",
              etiqueta.tono === "amarillo" && "bg-amber-500/20 text-amber-300",
              etiqueta.tono === "naranja" && "bg-orange-500/20 text-orange-300",
              etiqueta.tono === "rojo" && "bg-red-500/25 text-red-300",
            )}
          >
            {etiqueta.texto}
          </span>
        )}
        <div className={cn("mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10", fase === "repique" && "animate-ring")}>
          <Phone className="h-9 w-9" />
        </div>
        <p className="text-2xl font-semibold">{nombreContacto ?? (numero ? formatearNumero(numero) : "Número oculto")}</p>
        {nombreContacto && <p className="mt-1 text-sm text-white/60">{numero ? formatearNumero(numero) : "Número oculto"}</p>}
        <p className="mt-2 text-sm text-white/60">
          {fase === "repique" && (bloqueada ? "Bloqueada silenciosamente" : "Llamada entrante…")}
          {fase === "analizando" && "En llamada · 00:02"}
          {fase === "alerta" && (resultado?.bloqueoSilencioso ? "Bloqueada silenciosamente" : "En llamada · 00:03")}
          {fase === "finalizada" && "Llamada finalizada"}
        </p>

        {fase === "analizando" && (
          <div className="mt-8 w-full">
            <div className="mb-2 flex items-center justify-center gap-2 text-xs text-white/70">
              <Mic className="h-3.5 w-3.5 animate-pulse-soft" /> Analizando los primeros segundos…
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-accent-400 transition-all duration-300" style={{ width: `${Math.round(progreso * 100)}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-white/40">Procesamiento local · el audio no sale del teléfono</p>
          </div>
        )}

        {fase === "alerta" && resultado?.bloqueoSilencioso && (
          <div className="mt-8 rounded-xl bg-white/10 px-4 py-3 text-sm text-white/80">
            <p className="font-medium">Sin repique</p>
            <p className="text-xs text-white/60">Spam comercial bloqueado por el guardián.</p>
          </div>
        )}
        {fase === "alerta" && resultado?.discreto && (
          <div className="mt-8 rounded-xl bg-white/5 px-4 py-3 text-xs text-white/50">
            La pantalla no cambia. El aviso viajó en silencio al guardián.
          </div>
        )}
      </div>

      {/* Controles nativos: nunca cubiertos */}
      <div className="relative z-30 flex items-center justify-center gap-10 px-6 pb-10">
        {fase === "repique" && !bloqueada ? (
          <>
            <button className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg" aria-label="Rechazar" onClick={() => onAccion?.("rechazar")}>
              <PhoneOff className="h-7 w-7" />
            </button>
            <button className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg" aria-label="Atender" onClick={() => onAccion?.("atender")}>
              <Phone className="h-7 w-7" />
            </button>
          </>
        ) : (
          <button
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg disabled:opacity-40"
            aria-label="Colgar"
            disabled={fase === "finalizada" || bloqueada === true}
            onClick={() => onAccion?.("colgar")}
          >
            <PhoneOff className="h-7 w-7" />
          </button>
        )}
      </div>

      {/* Overlay del semáforo cognitivo */}
      {mostrarOverlay && resultado && <Overlay resultado={resultado} onAccion={onAccion} pistaPalabra={pistaPalabra} />}
    </div>
  );
}

function Overlay({ resultado, onAccion, pistaPalabra }: { resultado: Resultado; onAccion?: (a: string) => void; pistaPalabra?: string | null }) {
  const n = resultado.nivel;
  if (n === 0) {
    return (
      <div className="animate-slide-down absolute inset-x-0 top-10 z-20 mx-3 flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-white shadow-lg">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{resultado.titulo}</p>
          {resultado.reforzado && <p className="text-[11px] text-emerald-100">Voz y palabra clave coinciden</p>}
        </div>
      </div>
    );
  }
  if (n === 2) {
    return (
      <div className="animate-slide-down absolute inset-x-0 top-10 z-20 mx-3 rounded-xl bg-amber-500 px-3 py-2.5 text-brand-950 shadow-lg">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold leading-tight">{resultado.titulo}</p>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {resultado.acciones.map((a) => (
            <button key={a} onClick={() => onAccion?.(a)} className="rounded-md bg-brand-950/10 px-2 py-1 text-[11px] font-medium hover:bg-brand-950/20">
              {a === "Poner altavoz" && <Volume2 className="mr-1 inline h-3 w-3" />}
              {a}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (n === 3) {
    return (
      <div className="animate-slide-down absolute inset-x-0 top-10 z-20 mx-3 rounded-xl bg-orange-600 px-3 py-2.5 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold leading-tight">{resultado.titulo}</p>
        </div>
        <p className="mt-1 text-[11px] text-orange-100">{resultado.mensaje}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {resultado.acciones.map((a) => (
            <button key={a} onClick={() => onAccion?.(a)} className="rounded-md bg-white/15 px-2 py-1 text-[11px] font-medium hover:bg-white/25">
              {a}
            </button>
          ))}
        </div>
      </div>
    );
  }
  // Nivel 4: superposición completa, alto contraste, sin cubrir el botón de colgar
  return (
    <div className="animate-fade-in absolute inset-x-0 top-0 bottom-28 z-20 flex flex-col bg-red-700 px-4 pt-12 pb-3 text-white">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-1 h-7 w-7 shrink-0" />
        <p className="text-[22px] font-bold leading-tight">{resultado.titulo}</p>
      </div>
      <p className="mt-3 text-[15px] leading-snug text-red-50">{resultado.mensaje}</p>
      {resultado.preguntaDesafio && (
        <div className="mt-3 rounded-lg bg-white/15 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-100">Preguntale</p>
          <p className="text-sm font-medium">{resultado.preguntaDesafio}</p>
        </div>
      )}
      {pistaPalabra && (
        <p className="mt-2 text-[11px] text-red-100">
          Pista de la palabra clave: <span className="font-medium text-white">{pistaPalabra}</span>
        </p>
      )}
      <div className="mt-auto grid grid-cols-2 gap-1.5">
        {resultado.acciones
          .filter((a) => a !== "Cortar")
          .map((a) => (
            <button key={a} onClick={() => onAccion?.(a)} className="rounded-lg bg-white px-2 py-2 text-[12px] font-semibold text-red-700 hover:bg-red-50">
              {a}
            </button>
          ))}
        <button onClick={() => onAccion?.("era mi familiar")} className="col-span-2 rounded-lg border border-white/40 px-2 py-1.5 text-[11px] text-red-50 hover:bg-white/10">
          Era mi familiar (falsa alarma)
        </button>
      </div>
    </div>
  );
}

export function PantallaResguardo({
  nombreGuardian,
  telefonoFamiliar,
  onAccion,
  discreto,
}: {
  nombreGuardian: string;
  telefonoFamiliar?: string | null;
  onAccion?: (a: string) => void;
  discreto?: boolean;
}) {
  return (
    <div className="animate-fade-in flex h-full flex-col bg-indigo-700 px-5 pt-12 pb-6 text-white">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-7 w-7" />
        <p className="text-xl font-bold">Modo Resguardo</p>
      </div>
      <p className="mt-2 text-sm text-indigo-100">
        {discreto ? "Tu familiar usó la palabra de coacción. Mantené la calma y seguí estos pasos." : "Esa llamada no pudo verificarse. Antes de hacer nada, seguí estos tres pasos."}
      </p>
      <ol className="mt-5 space-y-3">
        {[
          "No transfieras dinero ni entregues nada a nadie.",
          `Llamá a tu familiar al número guardado en la agenda${telefonoFamiliar ? ` (${formatearNumero(telefonoFamiliar)})` : ""}.`,
          `Avisale a ${nombreGuardian.split(" ")[0]}. Ya recibió una alerta.`,
        ].map((t, i) => (
          <li key={i} className="flex gap-3 rounded-xl bg-white/10 px-3 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-indigo-700">{i + 1}</span>
            <p className="text-[15px] font-medium leading-snug">{t}</p>
          </li>
        ))}
      </ol>
      <div className="mt-auto grid gap-2">
        <button onClick={() => onAccion?.("llamar familiar")} className="rounded-xl bg-white py-3 text-base font-semibold text-indigo-700">
          Llamar a mi familiar
        </button>
        <button onClick={() => onAccion?.("exportar")} className="rounded-xl border border-white/40 py-2.5 text-sm font-medium text-white">
          Guardar registro para la denuncia
        </button>
        <button onClick={() => onAccion?.("cerrar resguardo")} className="py-1 text-xs text-indigo-200">
          Cerrar
        </button>
      </div>
    </div>
  );
}
