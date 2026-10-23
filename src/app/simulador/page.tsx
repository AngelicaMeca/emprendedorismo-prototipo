"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Play, RotateCcw, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Hydrated } from "@/components/Hydrated";
import { PantallaLlamada, PhoneMockup, type FaseLlamada } from "@/components/phone/Phone";
import { NivelBadge } from "@/components/NivelBadge";
import { Badge, Button, Card, Field, Input, Select, Slider, Switch } from "@/components/ui";
import { useVozReal } from "@/lib/store";
import { analizarLlamada, contextoSinHuellas, familiarPorNumero } from "@/lib/engine";
import type { EntradaLlamada, Resultado, SenalesCapa0 } from "@/lib/types";
import { cn, formatearNumero, normalizarNumero } from "@/lib/utils";

interface Escenario {
  numero: string;
  numeroOculto: boolean;
  invocaParentesco: boolean;
  familiarInvocadoId: string;
  llamadaUrgente: boolean;
  probSintesis: number;
  calidadMuestra: number;
  similitud: number;
  candidatoId: string;
  fraseDicha: string;
  incorrectaTrasPedido: boolean;
  capa0: Required<Pick<SenalesCapa0, "cambioSimReciente" | "origenInternacionalOVoip" | "denunciadaEnRed" | "rangoAsociadoFraude">> & { antiguedadLineaHoras: number; llamadasUltimaHora: number };
}

const BASE: Escenario = {
  numero: "+5491198765432",
  numeroOculto: false,
  invocaParentesco: false,
  familiarInvocadoId: "",
  llamadaUrgente: false,
  probSintesis: 0.1,
  calidadMuestra: 0.8,
  similitud: 0.3,
  candidatoId: "",
  fraseDicha: "",
  incorrectaTrasPedido: false,
  capa0: { antiguedadLineaHoras: 2000, cambioSimReciente: false, origenInternacionalOVoip: false, denunciadaEnRed: false, rangoAsociadoFraude: false, llamadasUltimaHora: 1 },
};

const PRESETS: Array<{ nombre: string; d: string; e: (b: Escenario) => Escenario }> = [
  { nombre: "Hija real llamando", d: "Marcela llama desde su número, voz natural, buena señal.", e: (b) => ({ ...b, numero: "+5493854556677", similitud: 0.91, probSintesis: 0.05, calidadMuestra: 0.88, candidatoId: "voz_marcela" }) },
  { nombre: "Verde reforzado", d: "Marcela dice la palabra clave con su voz.", e: (b) => ({ ...b, numero: "+5493854556677", similitud: 0.9, probSintesis: 0.06, calidadMuestra: 0.85, candidatoId: "voz_marcela", fraseDicha: "cielo naranja", llamadaUrgente: true }) },
  { nombre: "Secuestro virtual con voz clonada", d: "Caller ID del nieto falsificado, timbre clonado con alta fidelidad, habla sintética.", e: (b) => ({ ...b, numero: "+5493854998811", invocaParentesco: true, familiarInvocadoId: "voz_julian", candidatoId: "voz_julian", similitud: 0.79, probSintesis: 0.86, calidadMuestra: 0.74, llamadaUrgente: true, capa0: { ...b.capa0, origenInternacionalOVoip: true } }) },
  { nombre: "Desconocido dice ser el nieto", d: "Número sin reputación, menciona parentesco, voz humana que no coincide.", e: (b) => ({ ...b, numero: "+5491198765432", invocaParentesco: true, familiarInvocadoId: "voz_julian", candidatoId: "voz_julian", similitud: 0.36, probSintesis: 0.22, calidadMuestra: 0.7, llamadaUrgente: true }) },
  { nombre: "Palabra clave filtrada", d: "Número desconocido con SIM de 20 h dice la palabra correcta con voz humana.", e: (b) => ({ ...b, numero: "+5491177001122", invocaParentesco: true, familiarInvocadoId: "voz_roberto", candidatoId: "voz_roberto", similitud: 0.52, probSintesis: 0.18, calidadMuestra: 0.76, fraseDicha: "cielo naranja", llamadaUrgente: true, capa0: { ...b.capa0, antiguedadLineaHoras: 20 } }) },
  { nombre: "Hijo real bajo coacción", d: "Roberto llama con su voz y usa la palabra de coacción.", e: (b) => ({ ...b, numero: "+5491155667788", similitud: 0.88, probSintesis: 0.08, calidadMuestra: 0.8, candidatoId: "voz_roberto", fraseDicha: "tía Norma" }) },
  { nombre: "Hijo real con mala señal", d: "Roberto desde manos libres en la ruta: muestra degradada.", e: (b) => ({ ...b, numero: "+5491155667788", similitud: 0.6, probSintesis: 0.33, calidadMuestra: 0.2, candidatoId: "voz_roberto" }) },
  { nombre: "Robocall de premio", d: "Número con reputación de robocall y voz pregrabada.", e: (b) => ({ ...b, numero: "+5491122334455", probSintesis: 0.9, calidadMuestra: 0.7 }) },
  { nombre: "Telemarketing", d: "Prefijo de call center. Con bloqueo silencioso activo no repica.", e: (b) => ({ ...b, numero: "+5491140000123", probSintesis: 0.15, calidadMuestra: 0.75 }) },
  { nombre: "Falso banco", d: "Número en alerta oficial por suplantación de mesa de ayuda.", e: (b) => ({ ...b, numero: "+5491133221100", probSintesis: 0.4, calidadMuestra: 0.7 }) },
  { nombre: "Número de extorsión denunciado", d: "Rojo desde el repique, antes de atender.", e: (b) => ({ ...b, numero: "+5491166778899", invocaParentesco: true, familiarInvocadoId: "voz_marcela", candidatoId: "voz_marcela", similitud: 0.3, probSintesis: 0.5, calidadMuestra: 0.7, llamadaUrgente: true }) },
  { nombre: "Número oculto neutro", d: "Cabecera vacía, voz natural, sin parentesco.", e: (b) => ({ ...b, numero: "", numeroOculto: true, probSintesis: 0.12, calidadMuestra: 0.8 }) },
];

function Simulador() {
  const store = useVozReal();
  const { circulo, config, palabraIdentificacion, verificarPalabra, registrarEvento, marcarFeedback } = store;
  const [esc, setEsc] = useState<Escenario>(() => PRESETS[0].e(BASE));
  const [presetActivo, setPresetActivo] = useState(0);
  const [fase, setFase] = useState<FaseLlamada>("inactivo");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [progreso, setProgreso] = useState(0);
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [acciones, setAcciones] = useState<string[]>([]);
  const [viaApi, setViaApi] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const limpiarTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => () => limpiarTimers(), []);

  const familiarNum = useMemo(() => familiarPorNumero(esc.numeroOculto ? "" : esc.numero, circulo.voces), [esc.numero, esc.numeroOculto, circulo.voces]);
  const requiereBio = !!familiarNum || esc.invocaParentesco || (config.operadoraHabilitada && esc.capa0.antiguedadLineaHoras < 72);
  const tipoPalabra = verificarPalabra(esc.fraseDicha);

  const entrada: EntradaLlamada = useMemo(
    () => ({
      numero: esc.numeroOculto ? "" : normalizarNumero(esc.numero),
      numeroOculto: esc.numeroOculto,
      invocaParentesco: esc.invocaParentesco,
      familiarInvocadoId: esc.invocaParentesco ? esc.familiarInvocadoId || null : null,
      capa0: config.operadoraHabilitada ? esc.capa0 : undefined,
      probSintesis: esc.probSintesis,
      calidadMuestra: esc.calidadMuestra,
      similitudBiometrica: requiereBio && circulo.voces.length ? esc.similitud : null,
      mejorCandidatoId: requiereBio ? esc.candidatoId || familiarNum?.id || esc.familiarInvocadoId || null : null,
      palabraIdentificacion: esc.incorrectaTrasPedido ? "incorrecta_tras_pedido" : tipoPalabra === "identificacion" ? "dicha" : "ausente",
      palabraCoaccion: tipoPalabra === "coaccion",
      llamadaUrgente: esc.llamadaUrgente,
      canal: "celular",
    }),
    [esc, config.operadoraHabilitada, requiereBio, circulo.voces.length, familiarNum, tipoPalabra],
  );

  const vistaPrevia = useMemo(() => analizarLlamada(entrada, store.contextoMotor()), [entrada, store]);

  const reiniciar = useCallback(() => {
    limpiarTimers();
    setFase("inactivo");
    setResultado(null);
    setProgreso(0);
    setEventoId(null);
    setAcciones([]);
    setViaApi(null);
  }, []);

  const iniciar = async () => {
    reiniciar();
    let r: Resultado = vistaPrevia;
    try {
      const res = await fetch("/api/analizar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entrada, contexto: contextoSinHuellas(store.contextoMotor()) }) });
      if (res.ok) {
        const json = await res.json();
        r = json.resultado;
        setViaApi(json.tiempoServidorMs);
      }
    } catch {
      /* se usa el motor local */
    }
    setResultado(r);
    if (r.bloqueoSilencioso) {
      setFase("alerta");
      setEventoId(registrarEvento({ entrada, resultado: r, origen: "simulacion" }).id);
      return;
    }
    setFase("repique");
  };

  const atender = () => {
    if (!resultado) return;
    setFase("analizando");
    const total = Math.max(600, resultado.latenciaTotalMs) * 1.6;
    const pasos = 24;
    for (let i = 1; i <= pasos; i++) {
      timers.current.push(setTimeout(() => setProgreso(i / pasos), (total / pasos) * i));
    }
    timers.current.push(
      setTimeout(() => {
        setFase("alerta");
        setEventoId(registrarEvento({ entrada, resultado, origen: "simulacion" }).id);
      }, total + 150),
    );
  };

  const onAccion = (a: string) => {
    if (a === "atender") return atender();
    if (a === "rechazar") {
      setFase("finalizada");
      setAcciones((x) => [...x, "Rechazó la llamada desde el repique"]);
      return;
    }
    if (a === "colgar") {
      setFase(resultado?.modoResguardo ? "resguardo" : "finalizada");
      setAcciones((x) => [...x, "Cortó la llamada"]);
      return;
    }
    if (a === "cerrar resguardo") return setFase("finalizada");
    if (a === "era mi familiar" && eventoId) {
      marcarFeedback(eventoId, "era_familiar");
      setAcciones((x) => [...x, "Marcó la alerta como falsa alarma: histéresis activada para este número"]);
      return;
    }
    setAcciones((x) => [...x, `Acción: ${a}`]);
  };

  const aplicarPreset = (i: number) => {
    setPresetActivo(i);
    setEsc(PRESETS[i].e(BASE));
    reiniciar();
  };

  const set = <K extends keyof Escenario>(k: K, v: Escenario[K]) => {
    setEsc((e) => ({ ...e, [k]: v }));
    setPresetActivo(-1);
  };

  const mostrado = fase === "inactivo" ? vistaPrevia : resultado ?? vistaPrevia;
  const nombreContacto = familiarNum?.nombre ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Simulador de llamada entrante</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Probá el motor de decisión de punta a punta</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Configurá las señales que las capas extraerían del audio y de la red, iniciá la llamada y mirá cómo reacciona el teléfono de {circulo.protegido.nombre.split(" ")[0]}. Cada
          corrida queda registrada en el panel del guardián.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px_1fr] xl:gap-8">
        {/* Columna izquierda: escenario */}
        <div className="space-y-5">
          <Card title="Escenarios" subtitle="Casos del documento, listos para correr">
            <div className="grid gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={p.nombre}
                  onClick={() => aplicarPreset(i)}
                  className={cn("rounded-lg border px-3 py-2 text-left transition-colors", presetActivo === i ? "border-accent-500 bg-accent-50" : "border-slate-200 hover:border-slate-300")}
                >
                  <p className="text-sm font-medium text-slate-900">{p.nombre}</p>
                  <p className="text-xs text-slate-500">{p.d}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Señales de la llamada" subtitle="Lo que el teléfono sabe antes y durante los primeros 2 segundos">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Número entrante">
                  <Input value={esc.numero} disabled={esc.numeroOculto} onChange={(e) => set("numero", e.target.value)} />
                </Field>
                <div className="pt-6">
                  <Switch checked={esc.numeroOculto} onChange={(v) => set("numeroOculto", v)} label="Número oculto" />
                </div>
              </div>
              {familiarNum && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  El número pertenece a <strong>{familiarNum.nombre}</strong> ({familiarNum.parentesco}). Capa 3 en modo 1:1.
                </p>
              )}
              <Switch checked={esc.invocaParentesco} onChange={(v) => set("invocaParentesco", v)} label="Invoca parentesco" descripcion="“Mamá”, “abuela”, “soy tu hijo”… detectado por el spotter de vocabulario cerrado." />
              {esc.invocaParentesco && (
                <Field label="Dice ser">
                  <Select value={esc.familiarInvocadoId} onChange={(e) => set("familiarInvocadoId", e.target.value)}>
                    <option value="">Un familiar sin precisar</option>
                    {circulo.voces.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nombre} · {v.parentesco}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Switch checked={esc.llamadaUrgente} onChange={(v) => set("llamadaUrgente", v)} label="Pedido urgente de dinero o ayuda" />

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Capa 2 · anti-spoofing</p>
                <div className="space-y-4">
                  <Slider label="Probabilidad de habla sintética" value={esc.probSintesis} onChange={(v) => set("probSintesis", v)} hint={`Natural ≤ ${config.umbrales.sintesisBaja} · sintética ≥ ${config.umbrales.sintesisAlta}`} />
                  <Slider label="Calidad de la muestra (SNR)" value={esc.calidadMuestra} onChange={(v) => set("calidadMuestra", v)} hint={`Por debajo de ${Math.round(config.umbrales.calidadMinima * 100)}% el techo acústico es amarillo`} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Capa 3 · biometría {requiereBio ? "(se ejecuta)" : "(no se ejecuta)"}</p>
                <div className={cn("space-y-4", !requiereBio && "opacity-50")}>
                  <Slider label="Similitud coseno con la huella" value={esc.similitud} onChange={(v) => set("similitud", v)} formato={(v) => v.toFixed(2)} hint={`Verde ≥ ${config.umbrales.similitudAlta} · rojo < ${config.umbrales.similitudBaja}`} />
                  <Field label="Mejor candidato de la comparación">
                    <Select value={esc.candidatoId || familiarNum?.id || esc.familiarInvocadoId || ""} onChange={(e) => set("candidatoId", e.target.value)}>
                      <option value="">Automático</option>
                      {circulo.voces.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nombre}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Factor de conocimiento</p>
                <Field label="Frase que pronuncia el interlocutor" hint={palabraIdentificacion ? `Pista configurada: ${palabraIdentificacion.pista}` : "No hay palabra de identificación definida"}>
                  <Input value={esc.fraseDicha} onChange={(e) => set("fraseDicha", e.target.value)} placeholder="Ej.: cielo naranja" />
                </Field>
                <div className="mt-2 flex items-center gap-2">
                  {tipoPalabra === "identificacion" && <Badge tono="verde">Palabra de identificación reconocida</Badge>}
                  {tipoPalabra === "coaccion" && <Badge tono="rojo">Palabra de coacción reconocida</Badge>}
                  {!tipoPalabra && esc.fraseDicha && <Badge tono="gris">No coincide con ninguna palabra</Badge>}
                </div>
                <Switch checked={esc.incorrectaTrasPedido} onChange={(v) => set("incorrectaTrasPedido", v)} label="El usuario pidió la palabra y fue incorrecta" />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Capa 0 · señales de red</p>
                {config.operadoraHabilitada ? (
                  <div className="space-y-2">
                    <Slider label="Antigüedad de la línea originante" value={esc.capa0.antiguedadLineaHoras} min={1} max={2000} step={1} onChange={(v) => set("capa0", { ...esc.capa0, antiguedadLineaHoras: v })} formato={(v) => (v >= 2000 ? "> 2000 h" : `${v} h`)} />
                    <Slider label="Llamadas del originante en la última hora" value={esc.capa0.llamadasUltimaHora} min={1} max={600} step={1} onChange={(v) => set("capa0", { ...esc.capa0, llamadasUltimaHora: v })} formato={(v) => `${v}`} />
                    <Switch checked={esc.capa0.cambioSimReciente} onChange={(v) => set("capa0", { ...esc.capa0, cambioSimReciente: v })} label="Cambio reciente de SIM en la línea de un familiar" />
                    <Switch checked={esc.capa0.origenInternacionalOVoip} onChange={(v) => set("capa0", { ...esc.capa0, origenInternacionalOVoip: v })} label="Cabecera nacional con origen internacional / VoIP" />
                    <Switch checked={esc.capa0.denunciadaEnRed} onChange={(v) => set("capa0", { ...esc.capa0, denunciadaEnRed: v })} label="Línea denunciada en la red" />
                    <Switch checked={esc.capa0.rangoAsociadoFraude} onChange={(v) => set("capa0", { ...esc.capa0, rangoAsociadoFraude: v })} label="Rango asociado a fraude" />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Deshabilitada (fase 1, sin operadora). Activala en Configuración para simular la alianza con la línea telefónica.</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Columna central: teléfono */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <PhoneMockup>
            <PantallaLlamada
              fase={fase}
              numero={entrada.numero}
              nombreContacto={nombreContacto}
              etiqueta={mostrado.etiquetaEntrante}
              resultado={fase === "inactivo" ? null : resultado}
              progreso={progreso}
              onAccion={onAccion}
              pistaPalabra={palabraIdentificacion?.pista}
              nombreProtegido={circulo.protegido.nombre}
              nombreGuardian={circulo.guardian.nombre}
              telefonoFamiliar={(circulo.voces.find((v) => v.nombre === mostrado.capas.capa3.candidato) ?? familiarNum)?.telefono ?? circulo.guardian.telefono}
            />
          </PhoneMockup>
          <div className="mt-5 flex justify-center gap-2">
            {fase === "inactivo" ? (
              <Button variant="accent" size="lg" onClick={iniciar}>
                <Play className="h-4 w-4" /> Iniciar llamada
              </Button>
            ) : (
              <Button variant="outline" size="lg" onClick={reiniciar}>
                <RotateCcw className="h-4 w-4" /> Reiniciar
              </Button>
            )}
          </div>
          {fase === "repique" && !resultado?.bloqueoSilencioso && <p className="mt-2 text-center text-xs text-slate-500">Tocá el botón verde del teléfono para atender.</p>}
        </div>

        {/* Columna derecha: explicación */}
        <div className="space-y-5">
          <Card title="Resolución del motor" subtitle={fase === "inactivo" ? "Vista previa con las señales actuales" : viaApi != null ? `Calculado en /api/analizar en ${viaApi} ms` : "Calculado localmente"}>
            <div className="flex flex-wrap items-center gap-2">
              <NivelBadge nivel={mostrado.nivel} discreto={mostrado.discreto} />
              {mostrado.reforzado && <Badge tono="verde">Reforzado</Badge>}
              {mostrado.bloqueoSilencioso && <Badge tono="gris">Bloqueo silencioso</Badge>}
              {mostrado.susurro && <Badge tono="rojo">Modo susurro</Badge>}
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-900">{mostrado.titulo}</p>
            <p className="text-sm text-slate-600">{mostrado.mensaje}</p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-2.5">
                <dt className="text-slate-500">Nivel previo al descuelgue</dt>
                <dd className="font-medium text-slate-900">Nivel {mostrado.nivelPreAtencion}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <dt className="text-slate-500">Háptica / sonido</dt>
                <dd className="font-medium text-slate-900">
                  {mostrado.haptica} · {mostrado.sonido}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <dt className="text-slate-500">Aviso al guardián</dt>
                <dd className="font-medium text-slate-900">{mostrado.avisarGuardian ? (mostrado.discreto ? "Sí, silencioso" : "Sí") : "No"}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <dt className="text-slate-500">Modo Resguardo al cortar</dt>
                <dd className="font-medium text-slate-900">{mostrado.modoResguardo ? "Sí" : "No"}</dd>
              </div>
            </dl>
            {mostrado.avisarGuardian && (
              <div className="mt-3 flex gap-3 rounded-xl bg-red-50 p-3 text-xs text-red-900 ring-1 ring-red-200">
                <Bell className="h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Notificación al guardián ({circulo.guardian.nombre.split(" ")[0]})</p>
                  <p>
                    {mostrado.discreto ? "Palabra de coacción detectada." : `Alerta roja: ${mostrado.titulo}`} · {entrada.numero ? formatearNumero(entrada.numero) : "número oculto"} · nivel {mostrado.nivel}. Sin audio.
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card title="Pipeline on-device" subtitle={`${mostrado.latenciaTotalMs} ms acumulados · meta: alertar antes de los 3 s`}>
            <ul className="space-y-2">
              {mostrado.pipeline.map((p) => (
                <li key={p.fase} className={cn("flex items-center gap-3 text-sm", !p.ejecutada && "opacity-40")}>
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", p.ejecutada ? "bg-accent-500" : "bg-slate-300")} />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{p.fase}</p>
                    <p className="text-xs text-slate-500">{p.tecnologia}</p>
                  </div>
                  <span className="font-mono text-xs text-slate-600">{p.ejecutada ? `${p.ms} ms` : "omitida"}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Explicación para el guardián" subtitle="Detalle técnico que la persona protegida nunca ve">
            <ul className="space-y-2 text-sm text-slate-700">
              {mostrado.razones.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <Sparkles className="h-3.5 w-3.5" /> {mostrado.capas.conocimiento.efecto}
            </p>
          </Card>

          {acciones.length > 0 && (
            <Card title="Acciones de la persona protegida">
              <ol className="space-y-1 text-sm text-slate-700">
                {acciones.map((a, i) => (
                  <li key={i}>
                    {i + 1}. {a}
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SimuladorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hydrated>
          <Simulador />
        </Hydrated>
      </main>
      <SiteFooter />
    </div>
  );
}
