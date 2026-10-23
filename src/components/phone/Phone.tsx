"use client";

import { AlertTriangle, Bot, CheckCircle2, HelpCircle, KeyRound, Mic, Phone, PhoneOff, ShieldAlert, ShieldCheck, Volume2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Resultado } from "@/lib/types";
import { cn, formatearNumero } from "@/lib/utils";

// Reglas de la pantalla para la persona protegida (apartado 5.8):
// · una idea por alerta: título de 3 a 6 palabras, una línea de consejo como máximo;
// · nunca más de dos botones, de 48 px o más de alto, con verbo al frente;
// · letra mínima de 15 px, título rojo de 28 px, contraste AA en todos los fondos;
// · el botón nativo de colgar nunca queda cubierto.

export function PhoneMockup({
  children,
  className,
  hora = "10:42",
  vibrando = false,
  linterna = false,
}: {
  children: ReactNode;
  className?: string;
  hora?: string;
  vibrando?: boolean;
  linterna?: boolean;
}) {
  return (
    <div className={cn("relative mx-auto w-[300px] sm:w-[320px]", className)}>
      <div className={cn("rounded-[44px] bg-brand-950 p-2.5 shadow-phone", vibrando && "animate-vibrar")}>
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
          {/* Destello de la linterna (flash trasero reflejado) */}
          {linterna && <div className="animate-destello pointer-events-none absolute inset-0 z-40 bg-white" aria-hidden />}
        </div>
      </div>
      {/* Indicadores físicos fuera de la pantalla */}
      <div className="pointer-events-none absolute -right-2 top-24 flex flex-col gap-2">
        {vibrando && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white shadow">vibra</span>}
        {linterna && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-semibold text-amber-900 shadow">linterna</span>}
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
              "animate-fade-in mb-3 rounded-full px-3 py-1 text-[13px] font-semibold",
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
      {mostrarOverlay && resultado && <Overlay resultado={resultado} onAccion={onAccion} pistaPalabra={pistaPalabra} nombreGuardian={nombreGuardian} />}
    </div>
  );
}

// Caja que aparece al tocar “Pedile la clave”: pista de la palabra y pregunta de desafío.
function CajaClave({ pista, pregunta, oscuro }: { pista?: string | null; pregunta?: string; oscuro?: boolean }) {
  return (
    <div className={cn("mt-2 rounded-xl px-3 py-2.5", oscuro ? "bg-brand-950/10" : "bg-white/15")}>
      {pista && (
        <p className="text-[15px] leading-snug">
          Pista de la clave: <span className="font-bold">{pista}</span>
        </p>
      )}
      {pregunta && (
        <p className={cn("text-[15px] leading-snug", pista && "mt-1")}>
          Preguntale: <span className="font-bold">{pregunta}</span>
        </p>
      )}
    </div>
  );
}

function BotonAccion({ texto, onClick, estilo, icono }: { texto: string; onClick: () => void; estilo: string; icono?: ReactNode }) {
  return (
    <button onClick={onClick} className={cn("flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-[16px] font-bold leading-tight", estilo)}>
      {icono}
      {texto}
    </button>
  );
}

function Overlay({ resultado, onAccion, pistaPalabra, nombreGuardian }: { resultado: Resultado; onAccion?: (a: string) => void; pistaPalabra?: string | null; nombreGuardian: string }) {
  const [mostrarClave, setMostrarClave] = useState(false);
  const n = resultado.nivel;
  const accion = (a: string) => {
    if (a === "Pedile la clave") setMostrarClave(true);
    if (a === "Cortar") return onAccion?.("colgar");
    onAccion?.(a);
  };

  if (n === 0) {
    return (
      <div className="animate-slide-down absolute inset-x-0 top-10 z-20 mx-3 flex items-center gap-3 rounded-xl bg-emerald-700 px-4 py-3 text-white shadow-lg">
        <CheckCircle2 className="h-7 w-7 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-[20px] font-bold leading-tight">{resultado.titulo}</p>
          {resultado.reforzado && <p className="text-[13px] text-emerald-100">Dijo la palabra clave</p>}
        </div>
      </div>
    );
  }
  if (n === 2) {
    return (
      <div className="animate-slide-down absolute inset-x-0 top-10 z-20 mx-3 rounded-xl bg-amber-400 px-3 py-3 text-brand-950 shadow-lg">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-7 w-7 shrink-0" />
          <p className="text-[20px] font-bold leading-tight">{resultado.titulo}</p>
        </div>
        {mostrarClave ? (
          <CajaClave pista={pistaPalabra} pregunta={resultado.preguntaDesafio} oscuro />
        ) : (
          <div className="mt-2.5 flex gap-2">
            <BotonAccion texto="Poner altavoz" icono={<Volume2 className="h-5 w-5" />} estilo="bg-brand-950 text-white" onClick={() => accion("Poner altavoz")} />
            <BotonAccion texto="Pedile la clave" icono={<KeyRound className="h-5 w-5" />} estilo="bg-brand-950/10 text-brand-950" onClick={() => accion("Pedile la clave")} />
          </div>
        )}
      </div>
    );
  }
  if (n === 3) {
    return (
      <div className="animate-slide-down absolute inset-x-0 top-10 z-20 mx-3 rounded-xl bg-orange-700 px-3 py-3 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Bot className="h-7 w-7 shrink-0" />
          <p className="text-[20px] font-bold leading-tight">{resultado.titulo}</p>
        </div>
        <p className="mt-1 text-[15px] text-orange-50">{resultado.mensaje}</p>
        <div className="mt-2.5 flex gap-2">
          <BotonAccion texto="Cortar" icono={<PhoneOff className="h-5 w-5" />} estilo="bg-white text-orange-800" onClick={() => accion("Cortar")} />
          <BotonAccion texto="Bloquear" estilo="bg-white/20 text-white" onClick={() => accion("Bloquear")} />
        </div>
      </div>
    );
  }
  // Nivel 4: pantalla completa, alto contraste, sin cubrir el botón de colgar
  return (
    <div className="animate-fade-in absolute inset-x-0 top-0 bottom-28 z-20 flex flex-col bg-red-700 px-4 pt-12 pb-3 text-white">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-1 h-8 w-8 shrink-0" />
        <p className="text-[28px] font-bold leading-[1.1]">{resultado.titulo}</p>
      </div>
      <p className="mt-4 text-[20px] font-semibold leading-snug">{resultado.mensaje}</p>
      <p className="mt-3 flex items-center gap-1.5 text-[15px] text-red-100">
        <ShieldAlert className="h-4 w-4 shrink-0" /> Ya avisamos a {nombreGuardian.split(" ")[0]}.
      </p>
      {mostrarClave && <CajaClave pista={pistaPalabra} pregunta={resultado.preguntaDesafio} />}
      <div className="mt-auto flex flex-col gap-2">
        <button onClick={() => accion("Cortar")} className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-white text-[22px] font-bold text-red-700">
          <PhoneOff className="h-6 w-6" /> Cortar
        </button>
        {!mostrarClave && (
          <button onClick={() => accion("Pedile la clave")} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-white text-[18px] font-bold text-white">
            <KeyRound className="h-5 w-5" /> Pedile la clave
          </button>
        )}
        <button onClick={() => onAccion?.("era mi familiar")} className="py-1 text-[14px] text-red-100 underline underline-offset-2">
          Era mi familiar
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
        <p className="text-[24px] font-bold">Esperá un momento</p>
      </div>
      <p className="mt-2 text-[16px] text-indigo-100">{discreto ? "Usaste la palabra de ayuda. Seguí estos pasos." : "Esa llamada era sospechosa. Seguí estos pasos."}</p>
      <ol className="mt-5 space-y-3">
        {[
          "No des dinero ni datos.",
          `Llamá a tu familiar${telefonoFamiliar ? ` al ${formatearNumero(telefonoFamiliar)}` : ""}.`,
          `${nombreGuardian.split(" ")[0]} ya está avisado.`,
        ].map((t, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[16px] font-bold text-indigo-700">{i + 1}</span>
            <p className="text-[17px] font-semibold leading-snug">{t}</p>
          </li>
        ))}
      </ol>
      <div className="mt-auto grid gap-2">
        <button onClick={() => onAccion?.("llamar familiar")} className="min-h-14 rounded-xl bg-white text-[20px] font-bold text-indigo-700">
          Llamar a mi familiar
        </button>
        <button onClick={() => onAccion?.("exportar")} className="min-h-12 rounded-xl border-2 border-white/60 text-[16px] font-semibold text-white">
          Guardar para la denuncia
        </button>
        <button onClick={() => onAccion?.("cerrar resguardo")} className="py-1 text-[14px] text-indigo-200">
          Cerrar
        </button>
      </div>
    </div>
  );
}
