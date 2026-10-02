"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Download, FileJson, Trash2 } from "lucide-react";
import { Badge, Button, Card, Empty, PageHeader, Select } from "@/components/ui";
import { NivelBadge } from "@/components/NivelBadge";
import { useVozReal } from "@/lib/store";
import { NIVEL_HEX } from "@/lib/niveles";
import type { Evento, Nivel } from "@/lib/types";
import { fechaHora, formatearNumero } from "@/lib/utils";

function descargar(nombre: string, contenido: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function exportarJSON(eventos: Evento[]) {
  descargar(
    `vozreal-registro-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(
      eventos.map((e) => ({
        fecha: e.fecha,
        numero: e.numero || "oculto",
        nivel: e.nivel,
        discreto: e.discreto,
        resumen: e.resumen,
        origen: e.origen,
        feedback: e.feedback,
        capas: e.resultado.capas,
        razones: e.resultado.razones,
        latenciaMs: e.resultado.latenciaTotalMs,
      })),
      null,
      2,
    ),
    "application/json",
  );
}

function exportarCSV(eventos: Evento[]) {
  const filas = [["fecha", "numero", "nivel", "discreto", "resumen", "origen", "feedback", "capa2", "capa3", "latencia_ms"]];
  eventos.forEach((e) =>
    filas.push([
      e.fecha,
      e.numero || "oculto",
      String(e.nivel),
      String(e.discreto),
      e.resumen.replace(/"/g, "'"),
      e.origen,
      e.feedback ?? "",
      e.resultado.capas.capa2.resultado,
      e.resultado.capas.capa3.resultado,
      String(e.resultado.latenciaTotalMs),
    ]),
  );
  descargar(`vozreal-registro-${new Date().toISOString().slice(0, 10)}.csv`, filas.map((f) => f.map((c) => `"${c}"`).join(",")).join("\n"), "text/csv");
}

export default function EventosPage() {
  const { eventos, marcarFeedback, limpiarEventos } = useVozReal();
  const [filtro, setFiltro] = useState<"todos" | Nivel>("todos");
  const [abierto, setAbierto] = useState<string | null>(null);
  const lista = useMemo(() => eventos.filter((e) => filtro === "todos" || e.nivel === filtro), [eventos, filtro]);

  return (
    <>
      <PageHeader
        eyebrow="Registro local"
        title="Registro de eventos"
        description="Cada llamada analizada queda registrada en el dispositivo con el detalle técnico de cada capa. Exportable para facilitar la denuncia. Nunca contiene audio."
        actions={
          <>
            <Button variant="outline" onClick={() => exportarCSV(lista)} disabled={!lista.length}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => exportarJSON(lista)} disabled={!lista.length}>
              <FileJson className="h-4 w-4" /> JSON
            </Button>
            <Button variant="ghost" onClick={limpiarEventos} disabled={!eventos.length}>
              <Trash2 className="h-4 w-4" /> Limpiar
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <Select className="w-56" value={String(filtro)} onChange={(e) => setFiltro(e.target.value === "todos" ? "todos" : (Number(e.target.value) as Nivel))}>
          <option value="todos">Todos los niveles</option>
          {[0, 1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              Nivel {n}
            </option>
          ))}
        </Select>
        <span className="text-sm text-slate-500">{lista.length} eventos</span>
      </div>

      {lista.length === 0 ? (
        <Empty title="Sin eventos" text="Usá el simulador o la verificación diferida de audios para generar registros." />
      ) : (
        <div className="space-y-3">
          {lista.map((e) => {
            const open = abierto === e.id;
            return (
              <Card key={e.id} padding={false}>
                <button className="flex w-full items-center gap-4 p-4 text-left" onClick={() => setAbierto(open ? null : e.id)}>
                  <span className="h-12 w-1.5 shrink-0 rounded-full" style={{ background: NIVEL_HEX[e.nivel] }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{e.resumen}</p>
                    <p className="text-xs text-slate-500">
                      {e.numero ? formatearNumero(e.numero) : "Número oculto"} · {fechaHora(e.fecha)} · {e.origen === "audio_diferido" ? "audio diferido" : e.origen}
                      {e.resultado.capas.capa3.candidato && ` · candidato: ${e.resultado.capas.capa3.candidato}`}
                    </p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    {e.feedback === "era_familiar" && <Badge tono="verde">Era mi familiar</Badge>}
                    {e.feedback === "confirmado_fraude" && <Badge tono="rojo">Fraude confirmado</Badge>}
                    <NivelBadge nivel={e.nivel} discreto={e.discreto} corto />
                  </div>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="border-t border-slate-100 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Detalle técnico (solo guardián)</p>
                        <ul className="space-y-1.5 text-sm text-slate-700">
                          {e.resultado.razones.map((r, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-slate-50 p-2.5">
                            <p className="text-slate-500">Capa 2 · síntesis</p>
                            <p className="font-medium text-slate-900">
                              {e.resultado.capas.capa2.resultado} · p={e.resultado.capas.capa2.probSintesis.toFixed(2)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2.5">
                            <p className="text-slate-500">Capa 3 · biometría</p>
                            <p className="font-medium text-slate-900">
                              {e.resultado.capas.capa3.resultado}
                              {e.resultado.capas.capa3.similitud != null && ` · cos=${e.resultado.capas.capa3.similitud.toFixed(2)}`}
                            </p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2.5">
                            <p className="text-slate-500">Calidad de muestra</p>
                            <p className="font-medium text-slate-900">{Math.round(e.resultado.capas.capa2.calidad * 100)}%</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2.5">
                            <p className="text-slate-500">Latencia pipeline</p>
                            <p className="font-medium text-slate-900">{e.resultado.latenciaTotalMs} ms</p>
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2.5 text-xs">
                          <p className="text-slate-500">Factor de conocimiento</p>
                          <p className="text-slate-800">{e.resultado.capas.conocimiento.efecto}</p>
                        </div>
                        {e.nivel >= 2 && (
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant={e.feedback === "era_familiar" ? "secondary" : "outline"} onClick={() => marcarFeedback(e.id, e.feedback === "era_familiar" ? null : "era_familiar")}>
                              Era mi familiar
                            </Button>
                            <Button size="sm" variant={e.feedback === "confirmado_fraude" ? "danger" : "outline"} onClick={() => marcarFeedback(e.id, e.feedback === "confirmado_fraude" ? null : "confirmado_fraude")}>
                              Confirmar fraude
                            </Button>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400">
                          “Era mi familiar” activa la histéresis para este número y, si está habilitado, incorpora la muestra al refuerzo adaptativo. Alimenta de forma agregada y anónima la mejora de umbrales.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
