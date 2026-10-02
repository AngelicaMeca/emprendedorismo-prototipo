"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, Bell, CheckCircle2, Hash, KeyRound, ListChecks, PhoneIncoming, Users, XCircle } from "lucide-react";
import { Badge, Button, Card, PageHeader, Stat } from "@/components/ui";
import { NivelBadge } from "@/components/NivelBadge";
import { useVozReal } from "@/lib/store";
import { NIVELES, NIVEL_HEX } from "@/lib/niveles";
import type { Nivel } from "@/lib/types";
import { diasEntre, enMeses, fechaHora, formatearNumero, relativo } from "@/lib/utils";

export default function PanelPage() {
  const { circulo, eventos, notificaciones, numeros, palabraIdentificacion, palabraCoaccion, preguntas, config, marcarNotificacionesLeidas } = useVozReal();

  const [ahora] = useState(() => Date.now());
  const hace30 = ahora - 30 * 86400000;
  const recientes = eventos.filter((e) => new Date(e.fecha).getTime() >= hace30);
  const porNivel = [0, 1, 2, 3, 4].map((n) => recientes.filter((e) => e.nivel === n).length);
  const rojas = porNivel[4];
  const noLeidas = notificaciones.filter((n) => !n.leida);

  const rotacion = palabraIdentificacion ? enMeses(palabraIdentificacion.fechaAcuerdo, config.rotacionMeses) : null;
  const diasRotacion = rotacion ? diasEntre(new Date().toISOString(), rotacion) : null;

  const checks = [
    { ok: circulo.voces.length >= 1, t: "Al menos una voz enrolada", href: "/panel/circulo" },
    { ok: circulo.voces.length >= 3, t: "Tres o más voces (meta del piloto)", href: "/panel/circulo" },
    { ok: !!palabraIdentificacion, t: "Palabra de identificación definida", href: "/panel/palabras-clave" },
    { ok: !!palabraCoaccion, t: "Palabra de coacción definida", href: "/panel/palabras-clave" },
    { ok: preguntas.length >= 1, t: "Pregunta de desafío configurada", href: "/panel/palabras-clave" },
    { ok: !!circulo.guardian.telefono, t: "Teléfono del guardián para avisos", href: "/panel/circulo" },
    { ok: diasRotacion == null || diasRotacion > 0, t: "Palabra clave sin rotación vencida", href: "/panel/palabras-clave" },
  ];
  const completados = checks.filter((c) => c.ok).length;

  return (
    <>
      <PageHeader
        eyebrow={circulo.nombre}
        title={`Hola, ${circulo.guardian.nombre.split(" ")[0]}`}
        description={`Estado de protección del teléfono de ${circulo.protegido.nombre}. Recibís avisos de riesgo, no un registro de su vida telefónica.`}
        actions={
          <Link href="/simulador">
            <Button variant="accent">
              <PhoneIncoming className="h-4 w-4" /> Simular una llamada
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Voces enroladas" value={`${circulo.voces.length}/8`} hint="Plantillas cifradas en el dispositivo" icon={<Users className="h-4 w-4" />} />
        <Stat label="Alertas rojas · 30 días" value={rojas} hint={rojas ? "Revisá el registro de eventos" : "Sin suplantaciones detectadas"} icon={<AlertTriangle className="h-4 w-4" />} tono={rojas ? "rojo" : "verde"} />
        <Stat
          label="Palabra de identificación"
          value={palabraIdentificacion ? (diasRotacion != null && diasRotacion <= 0 ? "Vencida" : `${diasRotacion} días`) : "Sin definir"}
          hint={palabraIdentificacion ? "para la rotación semestral" : "Definila en Palabras clave"}
          icon={<KeyRound className="h-4 w-4" />}
          tono={!palabraIdentificacion || (diasRotacion != null && diasRotacion <= 0) ? "amarillo" : undefined}
        />
        <Stat label="Números clasificados" value={numeros.length} hint="Base local + reportes de la comunidad" icon={<Hash className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Eventos recientes" subtitle="Cada llamada analizada genera un registro local exportable" actions={<Link href="/panel/eventos" className="text-sm font-medium text-accent-700 hover:underline">Ver todos</Link>}>
          {eventos.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Todavía no hay eventos. Probá el simulador para generar uno.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {eventos.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-center gap-4 py-3">
                  <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: NIVEL_HEX[e.nivel] }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{e.resumen}</p>
                    <p className="text-xs text-slate-500">
                      {e.numero ? formatearNumero(e.numero) : "Número oculto"} · {fechaHora(e.fecha)}
                      {e.feedback === "era_familiar" && " · marcado como falsa alarma"}
                    </p>
                  </div>
                  <NivelBadge nivel={e.nivel} discreto={e.discreto} corto className="hidden sm:inline-flex" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card
            title="Avisos al guardián"
            subtitle={noLeidas.length ? `${noLeidas.length} sin leer` : "Todo al día"}
            actions={
              noLeidas.length ? (
                <Button size="sm" variant="ghost" onClick={marcarNotificacionesLeidas}>
                  Marcar leídos
                </Button>
              ) : undefined
            }
          >
            {notificaciones.length === 0 ? (
              <p className="text-sm text-slate-500">No recibiste avisos. Solo llegan cuando se dispara una alerta roja.</p>
            ) : (
              <ul className="space-y-3">
                {notificaciones.slice(0, 4).map((n) => (
                  <li key={n.id} className={`rounded-xl p-3 text-sm ${n.leida ? "bg-slate-50" : "bg-red-50 ring-1 ring-red-200"}`}>
                    <div className="flex items-center gap-2">
                      <Bell className={`h-4 w-4 ${n.leida ? "text-slate-400" : "text-red-600"}`} />
                      <span className="font-medium text-slate-900">{n.discreto ? "Aviso discreto" : "Alerta roja"}</span>
                      <span className="ml-auto text-xs text-slate-500">{relativo(n.fecha)}</span>
                    </div>
                    <p className="mt-1 text-slate-700">{n.mensaje}</p>
                    <p className="mt-1 text-xs text-slate-500">{n.numero ? formatearNumero(n.numero) : "Número oculto"} · sin audio, nunca</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Estado de la protección" subtitle={`${completados} de ${checks.length} verificaciones completas`}>
            <ul className="space-y-2">
              {checks.map((c) => (
                <li key={c.t} className="flex items-center gap-2 text-sm">
                  {c.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="h-4 w-4 shrink-0 text-amber-500" />}
                  <span className={c.ok ? "text-slate-700" : "text-slate-900"}>{c.t}</span>
                  {!c.ok && (
                    <Link href={c.href} className="ml-auto text-xs font-medium text-accent-700 hover:underline">
                      Resolver <ArrowRight className="inline h-3 w-3" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Distribución del semáforo · 30 días" subtitle={`${recientes.length} llamadas analizadas`}>
          <ul className="space-y-3">
            {([0, 1, 2, 3, 4] as Nivel[]).map((n) => {
              const c = porNivel[n];
              const w = recientes.length ? (c / recientes.length) * 100 : 0;
              return (
                <li key={n} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 text-slate-600">
                    {n} · {NIVELES[n].corto}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${w}%`, background: NIVEL_HEX[n] }} />
                  </div>
                  <span className="w-6 text-right font-mono text-xs text-slate-600">{c}</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card title="Círculo de Protección Familiar" subtitle="Quién es quién en el sistema">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-xs text-slate-500">Usuario protegido</p>
                <p className="font-medium text-slate-900">{circulo.protegido.nombre}</p>
              </div>
              <Badge tono="verde">{circulo.protegido.perfil ?? "Protegido"}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-xs text-slate-500">Guardián administrador</p>
                <p className="font-medium text-slate-900">{circulo.guardian.nombre}</p>
              </div>
              <Badge tono="gris">{circulo.guardian.relacion ?? "guardián"}</Badge>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Voces enroladas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {circulo.voces.map((v) => (
                  <span key={v.id} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs ring-1 ring-slate-200">
                    <span className="h-2 w-2 rounded-full" style={{ background: v.color }} />
                    {v.nombre.split(" ")[0]} · {v.parentesco}
                  </span>
                ))}
                {circulo.voces.length === 0 && <span className="text-xs text-slate-500">Ninguna todavía</span>}
              </div>
            </div>
            <Link href="/panel/circulo" className="inline-flex items-center gap-1 text-sm font-medium text-accent-700 hover:underline">
              <ListChecks className="h-4 w-4" /> Administrar el círculo
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
