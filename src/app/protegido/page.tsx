"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, KeyRound, MessageCircleQuestion, Phone, ShieldAlert, ShieldCheck } from "lucide-react";
import { Hydrated } from "@/components/Hydrated";
import { useVozReal } from "@/lib/store";
import { NIVEL_HEX } from "@/lib/niveles";
import { formatearNumero, relativo } from "@/lib/utils";

function VistaProtegida() {
  const { circulo, eventos, palabraIdentificacion, preguntas } = useVozReal();
  const [panel, setPanel] = useState<"ninguno" | "palabra" | "pregunta" | "aviso">("ninguno");
  const ultimo = eventos[0];
  const [ahora] = useState(() => Date.now());
  const hace10min = ultimo && ahora - new Date(ultimo.fecha).getTime() < 10 * 60000;
  const enResguardo = !!ultimo && ultimo.nivel === 4 && hace10min && ultimo.feedback !== "era_familiar";
  const guardian = circulo.guardian;
  const familiarPrincipal = circulo.voces[0];

  return (
    <div className={`min-h-screen ${enResguardo ? "bg-indigo-700 text-white" : "bg-brand-950 text-white"}`}>
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <header className="flex items-center justify-between">
          <span className="text-lg font-semibold">
            Voz<span className="text-accent-300">Real</span>
          </span>
          <Link href="/" className="text-xs text-white/60 hover:text-white">
            Salir
          </Link>
        </header>

        {enResguardo ? (
          <section className="mt-8 flex-1">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-10 w-10" />
              <h1 className="text-3xl font-bold leading-tight">Modo Resguardo</h1>
            </div>
            <p className="mt-3 text-lg text-indigo-100">
              {ultimo.discreto ? "Tu familiar usó la palabra de coacción." : "La última llamada no pudo verificarse."} Antes de hacer nada, seguí estos tres pasos.
            </p>
            <ol className="mt-6 space-y-4">
              {[
                "No transfieras dinero ni entregues nada a nadie.",
                `Llamá a ${familiarPrincipal ? familiarPrincipal.nombre.split(" ")[0] : "tu familiar"} al número de la agenda.`,
                `${guardian.nombre.split(" ")[0]} ya recibió una alerta. Esperá su llamado.`,
              ].map((t, i) => (
                <li key={i} className="flex gap-4 rounded-2xl bg-white/10 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-indigo-700">{i + 1}</span>
                  <p className="text-xl font-medium leading-snug">{t}</p>
                </li>
              ))}
            </ol>
            {familiarPrincipal && (
              <a href={`tel:${familiarPrincipal.telefono}`} className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-white py-5 text-2xl font-bold text-indigo-700">
                <Phone className="h-7 w-7" /> Llamar a {familiarPrincipal.nombre.split(" ")[0]}
              </a>
            )}
            <p className="mt-4 text-center text-sm text-indigo-200">Llamada de {relativo(ultimo.fecha)} · {ultimo.numero ? formatearNumero(ultimo.numero) : "número oculto"}</p>
          </section>
        ) : (
          <section className="mt-8 flex-1">
            <div className="rounded-3xl bg-white/10 p-6 text-center">
              <ShieldCheck className="mx-auto h-16 w-16 text-accent-300" />
              <h1 className="mt-3 text-3xl font-bold">Todo tranquilo</h1>
              <p className="mt-2 text-lg text-white/70">VozReal está cuidando tus llamadas, {circulo.protegido.nombre.split(" ")[0]}.</p>
            </div>

            {ultimo && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                <span className="h-10 w-2 rounded-full" style={{ background: NIVEL_HEX[ultimo.nivel] }} />
                <div className="min-w-0">
                  <p className="text-sm text-white/60">Última llamada · {relativo(ultimo.fecha)}</p>
                  <p className="truncate text-base font-medium">{ultimo.nivel === 1 ? "Sin novedades" : ultimo.resumen}</p>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-3">
              <button onClick={() => setPanel(panel === "palabra" ? "ninguno" : "palabra")} className="flex items-center gap-4 rounded-2xl bg-white px-5 py-5 text-left text-brand-950">
                <KeyRound className="h-8 w-8 shrink-0 text-accent-600" />
                <span className="text-xl font-semibold">Pedile la palabra clave</span>
              </button>
              {panel === "palabra" && (
                <div className="rounded-2xl bg-accent-500 p-5 text-brand-950">
                  <p className="text-lg font-semibold">Decile: “¿Cuál es nuestra palabra?”</p>
                  <p className="mt-2 text-base">{palabraIdentificacion ? `Pista: ${palabraIdentificacion.pista}` : "Todavía no hay una palabra acordada. Pedile a tu familia que la definan."}</p>
                  <p className="mt-3 text-sm font-medium">Si no la sabe o pide plata con urgencia: cortá y llamá vos al número de siempre.</p>
                </div>
              )}

              <button onClick={() => setPanel(panel === "pregunta" ? "ninguno" : "pregunta")} className="flex items-center gap-4 rounded-2xl bg-white px-5 py-5 text-left text-brand-950">
                <MessageCircleQuestion className="h-8 w-8 shrink-0 text-brand-700" />
                <span className="text-xl font-semibold">Hacer una pregunta de desafío</span>
              </button>
              {panel === "pregunta" && (
                <div className="rounded-2xl bg-white p-5 text-brand-950">
                  {preguntas.length ? (
                    <ul className="space-y-3">
                      {preguntas.map((p) => (
                        <li key={p.id} className="text-lg font-medium leading-snug">
                          {p.pregunta}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-base">No hay preguntas configuradas.</p>
                  )}
                  <p className="mt-3 text-sm text-slate-600">Solo tu familiar de verdad sabe la respuesta.</p>
                </div>
              )}

              {familiarPrincipal && (
                <a href={`tel:${familiarPrincipal.telefono}`} className="flex items-center gap-4 rounded-2xl bg-white px-5 py-5 text-left text-brand-950">
                  <Phone className="h-8 w-8 shrink-0 text-emerald-600" />
                  <span className="text-xl font-semibold">Llamar a {familiarPrincipal.nombre.split(" ")[0]}</span>
                </a>
              )}

              <button onClick={() => setPanel(panel === "aviso" ? "ninguno" : "aviso")} className="flex items-center gap-4 rounded-2xl bg-red-500 px-5 py-5 text-left text-white">
                <Bell className="h-8 w-8 shrink-0" />
                <span className="text-xl font-semibold">Avisar a {guardian.nombre.split(" ")[0]}</span>
              </button>
              {panel === "aviso" && (
                <div className="rounded-2xl bg-white p-5 text-brand-950">
                  <p className="text-lg font-semibold">Aviso enviado a {guardian.nombre.split(" ")[0]}.</p>
                  <p className="mt-1 text-base text-slate-600">Le llega tu nombre y la hora. Nunca el audio de la llamada.</p>
                </div>
              )}
            </div>
          </section>
        )}

        <footer className="mt-8 text-center text-xs text-white/40">Letra grande · contraste AAA · sin porcentajes ni términos técnicos</footer>
      </div>
    </div>
  );
}

export default function ProtegidoPage() {
  return (
    <Hydrated fallback={<div className="min-h-screen bg-brand-950" />}>
      <VistaProtegida />
    </Hydrated>
  );
}
