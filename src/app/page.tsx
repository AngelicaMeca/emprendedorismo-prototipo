import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Cpu,
  Fingerprint,
  KeyRound,
  Lock,
  PhoneIncoming,
  Radio,
  ShieldCheck,
  Smartphone,
  Users,
  Waves,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { NIVELES, NIVEL_HEX } from "@/lib/niveles";
import type { Nivel } from "@/lib/types";

const CAPAS = [
  {
    icon: Radio,
    titulo: "Capa 0 · Señales de red",
    texto: "Antigüedad de la línea, cambio de SIM, origen VoIP y fan-out, aportados por la operadora antes del descuelgue. Solo metadatos, nunca audio.",
    tag: "Fase 2 · operadora",
  },
  {
    icon: PhoneIncoming,
    titulo: "Capa 1 · Reputación del número",
    texto: "Consulta local en menos de 20 ms contra una base cifrada de spam, robocall, fraude y extorsión. La agenda nunca sale del teléfono.",
    tag: "Algo que tiene",
  },
  {
    icon: Waves,
    titulo: "Capa 2 · Anti-spoofing",
    texto: "AASIST-Lite cuantizado en INT8 analiza 2 segundos de habla neta buscando artefactos de síntesis: fase, armónicos y micro-respiraciones.",
    tag: "Siempre se ejecuta",
  },
  {
    icon: Fingerprint,
    titulo: "Capa 3 · Biometría intrafamiliar",
    texto: "Tiny-ECAPA-TDNN compara el embedding de 128 dimensiones contra hasta 8 huellas familiares cifradas en el dispositivo.",
    tag: "Algo que es",
  },
  {
    icon: KeyRound,
    titulo: "Factor de conocimiento",
    texto: "Una palabra de identificación y una de coacción acordadas en persona. Un algoritmo clona un timbre, pero no sabe un secreto que nunca circuló por Internet.",
    tag: "Algo que sabe",
  },
];

const PIPELINE = [
  { fase: "Ingesta y VAD", tec: "Silero VAD · TFLite", ms: "100–150 ms" },
  { fase: "Capa 1 · reputación", tec: "SQLite B-Tree cifrado", ms: "< 20 ms" },
  { fase: "Capa 2 · anti-spoofing", tec: "AASIST-Lite · INT8", ms: "400–650 ms" },
  { fase: "Capa 3 · verificación", tec: "Tiny-ECAPA · coseno", ms: "250–400 ms" },
  { fase: "Notificación accesible", tec: "Overlay WindowManager", ms: "< 50 ms" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader transparente />

      {/* Hero */}
      <section className="grid-bg relative overflow-hidden bg-brand-950 text-white">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24 lg:pb-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-accent-300">
              <Cpu className="h-3.5 w-3.5" /> Edge AI · inferencia 100% local · Android 8+
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Un guardián silencioso que escucha los primeros segundos de cada llamada.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              VozReal detecta voces clonadas por IA y verifica, en menos de tres segundos, si quien dice ser tu hijo o tu nieto realmente lo es. Sin grabar, sin
              subir nada a la nube, con un cartel grande y claro cuando algo no está bien.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/simulador" className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent-500 px-6 text-base font-semibold text-brand-950 hover:bg-accent-400">
                Probar el simulador <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/panel" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-base font-medium hover:bg-white/10">
                Panel del guardián
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {[
                ["< 3 s", "para alertar en pantalla"],
                ["3–10 s", "de audio bastan para clonar una voz"],
                ["0 bytes", "de audio salen del teléfono"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-2xl font-semibold text-white">{v}</dt>
                  <dd className="mt-1 text-xs text-white/60">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Mockup estático del nivel rojo */}
          <div className="relative mx-auto w-[300px]">
            <div className="rounded-[44px] bg-black/60 p-2.5 shadow-phone ring-1 ring-white/10">
              <div className="relative h-[600px] overflow-hidden rounded-[36px] bg-slate-900">
                <div className="absolute top-2 left-1/2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
                <div className="absolute inset-x-0 top-0 bottom-28 flex flex-col bg-red-700 px-4 pt-12 pb-3 text-white">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-1 h-7 w-7 shrink-0" />
                    <p className="text-[22px] font-bold leading-tight">Atención: esta voz no suena como la de tu hija Marcela</p>
                  </div>
                  <p className="mt-3 text-[15px] leading-snug text-red-50">No pudimos confirmar que sea quien dice ser. No transfieras dinero. Verificá antes de seguir.</p>
                  <div className="mt-3 rounded-lg bg-white/15 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-red-100">Preguntale</p>
                    <p className="text-sm font-medium">¿Cómo se llamaba el perro que teníamos en el campo?</p>
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-1.5">
                    {["Pedile la palabra clave", "Hacer la pregunta de desafío", "Avisar al guardián"].map((a) => (
                      <span key={a} className="rounded-lg bg-white px-2 py-2 text-center text-[12px] font-semibold text-red-700">
                        {a}
                      </span>
                    ))}
                    <span className="rounded-lg border border-white/40 px-2 py-2 text-center text-[12px] font-semibold text-white">Era mi familiar</span>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex h-28 items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg">
                    <PhoneIncoming className="h-7 w-7 rotate-[135deg] text-white" />
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-white/50">Nivel 4 · superposición de alto contraste · el botón de colgar nunca se cubre</p>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">El problema</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">El “cuento del tío” ahora tiene la voz exacta de tu hijo.</h2>
            <p className="mt-4 text-slate-600">
              Con modelos zero-shot como XTTS-v2 o ElevenLabs, un estado de WhatsApp de 5 segundos alcanza para clonar timbre, cadencia y formantes. El axioma
              “reconozco la voz, por lo tanto es mi familiar” ya no sirve.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {[
              { t: "Secuestro de la amígdala", d: "Ante una amenaza a un ser querido, el sistema límbico bloquea el razonamiento. La verificación tiene que ser automática, no voluntaria." },
              { t: "Caller ID sin firma", d: "Sin STIR/SHAKEN obligatorio en Argentina, el atacante inyecta el número real del hijo. Truecaller lo mostraría como seguro." },
              { t: "+200 % de denuncias anuales", d: "Las estafas telefónicas lideran el crecimiento de causas en la UFECI desde 2020. El NOA suma SIM prepagas sin validación." },
              { t: "Pixel solo para el 0,5 %", d: "La detección de Google requiere hardware premium y busca palabras financieras. Falla ante gritos, llanto y pedidos de efectivo." },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/70">
                <p className="font-semibold text-slate-900">{x.t}</p>
                <p className="mt-1.5 text-sm text-slate-600">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capas */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Cómo funciona</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Autenticación familiar de triple factor, en cascada y en el propio teléfono.</h2>
            <p className="mt-4 text-slate-600">
              Cualquier capa puede elevar el nivel de alerta, pero ninguna puede bajarlo a verde por sí sola. El verde exige similitud biométrica alta y
              probabilidad de síntesis baja al mismo tiempo.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {CAPAS.map((c, i) => (
              <div key={c.titulo} className="group relative rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition-colors hover:border-accent-400 hover:bg-white">
                <span className="absolute top-4 right-4 text-xs font-mono text-slate-400">0{i}</span>
                <span className="inline-flex rounded-lg bg-brand-900 p-2 text-white">
                  <c.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-semibold text-slate-900">{c.titulo}</p>
                <p className="mt-1.5 text-sm text-slate-600">{c.texto}</p>
                <span className="mt-3 inline-block rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-medium text-accent-700">{c.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Semáforo */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Sistema de alertas</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Un semáforo cognitivo de cinco niveles, más un estado de contención.</h2>
          <p className="mt-4 text-slate-600">Una sola idea por alerta. Nunca acusa, siempre invita a verificar. Sin porcentajes ni jerga para la persona protegida.</p>
        </div>
        <div className="mt-10 overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200/70">
          {([0, 1, 2, 3, 4, 5] as Array<Nivel | 5>).map((n) => (
            <div key={n} className="grid gap-3 border-b border-slate-100 p-5 last:border-0 md:grid-cols-[220px_1fr_1fr_1fr]">
              <div className="flex items-center gap-3">
                <span className="h-10 w-1.5 rounded-full" style={{ background: NIVEL_HEX[n] }} />
                <div>
                  <p className="text-xs text-slate-400">Nivel {n}</p>
                  <p className="font-semibold text-slate-900">{NIVELES[n].corto}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Disparador</p>
                <p className="mt-0.5 text-sm text-slate-700">{NIVELES[n].disparador}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">En pantalla</p>
                <p className="mt-0.5 text-sm text-slate-700">{NIVELES[n].manifestacion}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Acción ofrecida</p>
                <p className="mt-0.5 text-sm text-slate-700">{NIVELES[n].accion}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roles + Pipeline */}
      <section className="bg-brand-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-300">Círculo de Protección Familiar</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">La persona protegida no configura nada. Solo ve un cartel grande cuando algo no está bien.</h2>
            <div className="mt-8 space-y-4">
              {[
                { icon: Smartphone, t: "Usuario protegido", d: "El eslabón más vulnerable. Tiene la app activa y recibe las alertas. No administra nada ni necesita saber que la tecnología existe." },
                { icon: Users, t: "Guardián administrador", d: "Un hijo, hija o nieto de 25 a 55 años. Instala, enrola voces, define palabras clave y preguntas, recibe los avisos rojos y paga la suscripción." },
                { icon: Fingerprint, t: "Voces enroladas", d: "Hasta ocho familiares que graban 30 segundos con consentimiento expreso. Solo viaja un vector de 128 dimensiones cifrado de extremo a extremo." },
              ].map((r) => (
                <div key={r.t} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-500/20 text-accent-300">
                    <r.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{r.t}</p>
                    <p className="mt-1 text-sm text-white/65">{r.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-300">Pipeline on-device</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Entre 820 y 1.250 ms desde la primera frase hasta la alerta.</h2>
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
              {PIPELINE.map((p, i) => (
                <div key={p.fase} className="flex items-center gap-4 border-b border-white/10 px-5 py-4 last:border-0">
                  <span className="font-mono text-xs text-white/40">0{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium">{p.fase}</p>
                    <p className="text-xs text-white/55">{p.tec}</p>
                  </div>
                  <span className="rounded-full bg-accent-500/15 px-2.5 py-1 font-mono text-xs text-accent-300">{p.ms}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                ["< 80 MB", "RAM por análisis"],
                ["0,05 %", "batería por llamada"],
                ["< 5 M", "parámetros · INT8"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl bg-white/5 p-3">
                  <p className="text-lg font-semibold">{v}</p>
                  <p className="text-[11px] text-white/55">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Privacidad / modelo */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Lock, t: "Privacidad por diseño", d: "Plantillas cifradas con AES-GCM 256 bajo Android Keystore. Botón de eliminación inmediata (art. 16, Ley 25.326). Sin base biométrica centralizada." },
            { icon: Bot, t: "La IA informa, el humano decide", d: "La app tiene vedado cortar llamadas por su cuenta. Informa un riesgo probabilístico y propone una acción concreta de verificación." },
            { icon: ShieldCheck, t: "Modelo híbrido secuencial", d: "App Android autónoma desde el día uno. En fase 2, servicio de valor agregado de operadoras: cobro en factura, permisos privilegiados y señales de red." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200/70">
              <span className="inline-flex rounded-lg bg-accent-100 p-2 text-accent-700">
                <x.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-semibold text-slate-900">{x.t}</p>
              <p className="mt-1.5 text-sm text-slate-600">{x.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl bg-brand-900 p-8 text-white sm:flex-row">
          <div>
            <p className="text-xl font-semibold">Explorá el sistema completo</p>
            <p className="mt-1 text-sm text-white/65">Simulá una llamada, verificá un audio de WhatsApp o administrá el círculo familiar desde el panel.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/simulador" className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent-500 px-5 font-semibold text-brand-950 hover:bg-accent-400">
              Simulador <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/verificar" className="inline-flex h-11 items-center rounded-xl border border-white/20 px-5 font-medium hover:bg-white/10">
              Verificar audio
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
