"use client";

import { useState } from "react";
import { FileAudio, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Hydrated } from "@/components/Hydrated";
import { Grabador } from "@/components/Grabador";
import { NivelBadge } from "@/components/NivelBadge";
import { Badge, Barra, Button, Card, Field, Select, Switch } from "@/components/ui";
import { useVozReal } from "@/lib/store";
import { analizarLlamada } from "@/lib/engine";
import type { AnalisisAudio } from "@/lib/audio";
import type { EntradaLlamada, Resultado } from "@/lib/types";
import { similitudCoseno } from "@/lib/utils";

function Verificador() {
  const store = useVozReal();
  const { circulo, config, registrarEvento } = store;
  const [remitente, setRemitente] = useState<string>(circulo.voces[0]?.id ?? "");
  const [urgente, setUrgente] = useState(true);
  const [analisis, setAnalisis] = useState<AnalisisAudio | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [similitudes, setSimilitudes] = useState<Array<{ id: string; nombre: string; color: string; sim: number }>>([]);
  const [registrado, setRegistrado] = useState(false);

  const procesar = (a: AnalisisAudio) => {
    const sims = circulo.voces.map((v) => ({ id: v.id, nombre: v.nombre, color: v.color, sim: similitudCoseno(a.embedding, v.embedding) })).sort((x, y) => y.sim - x.sim);
    const fam = circulo.voces.find((v) => v.id === remitente);
    const mejor = sims[0];
    const entrada: EntradaLlamada = {
      numero: fam?.telefono ?? "",
      numeroOculto: !fam,
      invocaParentesco: !!fam || circulo.voces.length > 0,
      familiarInvocadoId: fam?.id ?? null,
      probSintesis: a.probSintesis,
      calidadMuestra: a.calidad,
      similitudBiometrica: circulo.voces.length ? (fam ? sims.find((s) => s.id === fam.id)?.sim ?? mejor.sim : mejor.sim) : null,
      mejorCandidatoId: fam?.id ?? mejor?.id ?? null,
      palabraIdentificacion: "ausente",
      palabraCoaccion: false,
      llamadaUrgente: urgente,
      canal: "whatsapp",
    };
    const r = analizarLlamada(entrada, store.contextoMotor());
    setAnalisis(a);
    setSimilitudes(sims);
    setResultado(r);
    setRegistrado(false);
    registrarEvento({ entrada, resultado: r, origen: "audio_diferido" });
    setRegistrado(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">F8 · Verificación diferida de audios</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">¿Ese audio de WhatsApp es realmente de tu familiar?</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Compartí o grabá un mensaje de voz y VozReal lo analiza en este dispositivo en menos de un segundo: artefactos de síntesis, calidad de la muestra y cotejo contra las
          huellas enroladas. Es la vía de entrada natural del producto para el fraude asincrónico.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div className="space-y-5">
          <Card title="Audio a verificar">
            <div className="space-y-4">
              <Field label="¿De quién dice ser el audio?">
                <Select value={remitente} onChange={(e) => setRemitente(e.target.value)}>
                  <option value="">Un número desconocido que dice ser familiar</option>
                  {circulo.voces.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre} · {v.parentesco}
                    </option>
                  ))}
                </Select>
              </Field>
              <Switch checked={urgente} onChange={setUrgente} label="Pide dinero o ayuda con urgencia" />
              <Grabador duracionMax={20} onAnalisis={procesar} etiquetaBoton="Grabar o subir el audio" />
            </div>
          </Card>
          <Card>
            <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <ShieldCheck className="h-4 w-4 text-accent-600" /> Qué pasa con el audio
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
              <li>Se decodifica con la Web Audio API y se descarta al terminar.</li>
              <li>Se extraen 64 bandas log-espectrales → embedding de 128 dimensiones.</li>
              <li>Se buscan artefactos del apartado 2.2.2: colapso de armónicos, textura uniforme, ausencia de micro-pausas.</li>
              <li>El resultado queda en el registro local, nunca el audio.</li>
            </ul>
            <p className="mt-3 text-[11px] text-slate-400">Prototipo web: heurísticas espectrales que aproximan a AASIST-Lite y Tiny-ECAPA. Las voces de demostración son vectores sintéticos; enrolá tu voz real para una comparación significativa.</p>
          </Card>
        </div>

        <div className="space-y-5">
          {!resultado || !analisis ? (
            <Card>
              <div className="flex flex-col items-center py-14 text-center">
                <FileAudio className="h-10 w-10 text-slate-300" />
                <p className="mt-3 font-medium text-slate-700">Esperando un audio</p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">Grabá con el micrófono o subí un archivo. El veredicto aparece acá con el nivel del semáforo y el detalle para el guardián.</p>
              </div>
            </Card>
          ) : (
            <>
              <Card>
                <div className="flex flex-wrap items-center gap-2">
                  <NivelBadge nivel={resultado.nivel} />
                  {registrado && <Badge tono="gris">Registrado en eventos</Badge>}
                </div>
                <p className="mt-3 text-xl font-semibold text-slate-900">{resultado.titulo}</p>
                <p className="text-sm text-slate-600">{resultado.mensaje}</p>
                {resultado.preguntaDesafio && (
                  <div className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
                    <span className="font-medium">Antes de responder, preguntale:</span> {resultado.preguntaDesafio}
                  </div>
                )}
              </Card>

              <div className="grid gap-5 md:grid-cols-2">
                <Card title="Capa 2 · anti-spoofing" subtitle={`Probabilidad de síntesis: ${Math.round(analisis.probSintesis * 100)}%`}>
                  <Barra valor={analisis.probSintesis} color={analisis.probSintesis >= config.umbrales.sintesisAlta ? "#dc2626" : analisis.probSintesis <= config.umbrales.sintesisBaja ? "#059669" : "#d97706"} className="mb-4" />
                  <ul className="space-y-3">
                    {analisis.indicadores.map((i) => (
                      <li key={i.nombre}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-700">{i.nombre}</span>
                          <span className="font-mono text-slate-500">{Math.round(i.valor * 100)}%</span>
                        </div>
                        <Barra valor={i.valor} color="#64748b" className="mt-1 h-1.5" />
                        <p className="mt-0.5 text-[11px] text-slate-400">{i.detalle}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
                <div className="space-y-5">
                  <Card title="Calidad de la muestra" subtitle={`SNR estimada ${analisis.snrDb.toFixed(1)} dB · ${analisis.duracionVoz.toFixed(1)} s de habla neta de ${analisis.duracionTotal.toFixed(1)} s`}>
                    <Barra valor={analisis.calidad} color={analisis.calidad < config.umbrales.calidadMinima ? "#d97706" : "#0d9488"} />
                    <p className="mt-2 text-xs text-slate-500">
                      {analisis.calidad < config.umbrales.calidadMinima ? "Por debajo del mínimo operativo: el techo acústico es amarillo." : "Suficiente para un veredicto acústico."} {analisis.pausasPorSegundo.toFixed(2)} pausas/s · {analisis.frecuenciaMuestreo} Hz.
                    </p>
                  </Card>
                  <Card title="Capa 3 · cotejo biométrico" subtitle={circulo.voces.length ? "Similitud coseno contra cada huella" : "Sin voces enroladas"}>
                    {similitudes.length ? (
                      <ul className="space-y-3">
                        {similitudes.map((s) => (
                          <li key={s.id}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2 text-slate-700">
                                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                                {s.nombre}
                              </span>
                              <span className="font-mono text-slate-500">{s.sim.toFixed(2)}</span>
                            </div>
                            <Barra valor={Math.max(0, s.sim)} color={s.sim >= config.umbrales.similitudAlta ? "#059669" : s.sim < config.umbrales.similitudBaja ? "#dc2626" : "#d97706"} className="mt-1 h-1.5" />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">Enrolá voces en el panel para habilitar la comparación.</p>
                    )}
                  </Card>
                </div>
              </div>

              <Card title="Explicación para el guardián">
                <ul className="space-y-2 text-sm text-slate-700">
                  {resultado.razones.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                      {r}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setResultado(null); setAnalisis(null); }}>
                    Verificar otro audio
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerificarPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hydrated>
          <Verificador />
        </Hydrated>
      </main>
      <SiteFooter />
    </div>
  );
}
