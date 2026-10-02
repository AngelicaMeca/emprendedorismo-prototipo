"use client";

import { useMemo, useState } from "react";
import { Database, Plus, Search, Trash2 } from "lucide-react";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Switch } from "@/components/ui";
import { NivelBadge } from "@/components/NivelBadge";
import { useVozReal } from "@/lib/store";
import { CATEGORIAS } from "@/lib/niveles";
import { clasificarNumero, heuristicasFormato } from "@/lib/engine";
import type { CategoriaNumero, FuenteNumero } from "@/lib/types";
import { fechaCorta, formatearNumero, normalizarNumero } from "@/lib/utils";

const FUENTES: Record<FuenteNumero, string> = {
  base: "Base precargada",
  comunidad: "Comunidad",
  oficial: "Registro oficial",
  operadora: "Operadora (Capa 0)",
  guardian: "Guardián",
};

export default function NumerosPage() {
  const { numeros, config, actualizarConfig, agregarNumero, eliminarNumero } = useVozReal();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<CategoriaNumero | "todas">("todas");
  const [modal, setModal] = useState(false);
  const [nuevo, setNuevo] = useState({ numero: "", categoria: "spam_comercial" as CategoriaNumero, nota: "" });
  const [consulta, setConsulta] = useState("");

  const lista = useMemo(
    () =>
      numeros.filter((n) => (filtro === "todas" || n.categoria === filtro) && (!busqueda || n.numero.includes(busqueda.replace(/\D/g, "")) || n.nota?.toLowerCase().includes(busqueda.toLowerCase()))),
    [numeros, filtro, busqueda],
  );

  const resultadoConsulta = useMemo(() => {
    if (!consulta.trim()) return null;
    const n = normalizarNumero(consulta);
    return { n, clasif: clasificarNumero(n, numeros), heur: heuristicasFormato(n) };
  }, [consulta, numeros]);

  const conteo = (Object.keys(CATEGORIAS) as CategoriaNumero[]).map((c) => ({ c, k: numeros.filter((n) => n.categoria === c).length }));

  return (
    <>
      <PageHeader
        eyebrow="Capa 1 · Reputación"
        title="Números clasificados como spam o fraude"
        description="Base cifrada en el dispositivo, sincronizada de forma diferencial. Toda consulta se resuelve localmente en menos de 20 ms; la agenda nunca se sube."
        actions={
          <Button onClick={() => setModal(true)}>
            <Plus className="h-4 w-4" /> Marcar un número
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card padding={false}>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input className="pl-9" placeholder="Buscar por número o nota" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <Select className="sm:w-64" value={filtro} onChange={(e) => setFiltro(e.target.value as CategoriaNumero | "todas")}>
                <option value="todas">Todas las categorías</option>
                {(Object.keys(CATEGORIAS) as CategoriaNumero[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIAS[c].nombre}
                  </option>
                ))}
              </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Número / prefijo</th>
                    <th className="px-4 py-2.5 font-medium">Categoría</th>
                    <th className="px-4 py-2.5 font-medium">Fuente</th>
                    <th className="px-4 py-2.5 font-medium text-right">Reportes</th>
                    <th className="px-4 py-2.5 font-medium">Actualizado</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lista.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-mono text-slate-900">{n.numero.endsWith("*") ? `${n.numero} (prefijo)` : formatearNumero(n.numero)}</p>
                        {n.nota && <p className="text-xs text-slate-500">{n.nota}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tono={CATEGORIAS[n.categoria].tono}>{CATEGORIAS[n.categoria].nombre}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{FUENTES[n.fuente]}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">{n.reportes}</td>
                      <td className="px-4 py-3 text-slate-600">{fechaCorta(n.fecha)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => eliminarNumero(n.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lista.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        Sin resultados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Categorías y respuesta del sistema" subtitle="Apartado 5.6.3">
            <ul className="divide-y divide-slate-100">
              {(Object.keys(CATEGORIAS) as CategoriaNumero[]).map((c) => (
                <li key={c} className="grid gap-2 py-3 md:grid-cols-[220px_1fr_1fr]">
                  <div className="space-y-1">
                    <Badge tono={CATEGORIAS[c].tono}>{CATEGORIAS[c].nombre}</Badge>
                    <div>{CATEGORIAS[c].nivel != null ? <NivelBadge nivel={CATEGORIAS[c].nivel!} corto /> : <Badge tono="verde">Etiqueta informativa</Badge>}</div>
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-800">Criterio:</span> {CATEGORIAS[c].criterio}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-800">Respuesta:</span> {CATEGORIAS[c].respuesta}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Consultar un número" subtitle="Simula la consulta local previa al repique">
            <Input placeholder="+54 9 11 ..." value={consulta} onChange={(e) => setConsulta(e.target.value)} />
            {resultadoConsulta && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                <p className="font-mono text-xs text-slate-500">{resultadoConsulta.n}</p>
                {resultadoConsulta.clasif ? (
                  <>
                    <div className="mt-1">
                      <Badge tono={CATEGORIAS[resultadoConsulta.clasif.categoria].tono}>{CATEGORIAS[resultadoConsulta.clasif.categoria].nombre}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{CATEGORIAS[resultadoConsulta.clasif.categoria].respuesta}</p>
                  </>
                ) : (
                  <p className="mt-1 text-slate-700">Sin reputación en la base local. Nivel base gris.</p>
                )}
                {resultadoConsulta.heur.length > 0 && <p className="mt-2 text-xs text-amber-700">Heurística: {resultadoConsulta.heur.join("; ")}</p>}
                <p className="mt-2 text-[11px] text-slate-400">Consulta resuelta localmente. También disponible en GET /api/numeros/[numero].</p>
              </div>
            )}
          </Card>

          <Card title="Bloqueo silencioso" subtitle="Única excepción al principio de no intervención">
            <Switch
              checked={config.bloqueoSilencioso}
              onChange={(v) => actualizarConfig({ bloqueoSilencioso: v })}
              label="Bloquear spam comercial sin repique"
              descripcion="Solo para números ya clasificados como telemarketing. Requiere habilitación expresa del guardián."
            />
          </Card>

          <Card title="Composición de la base">
            <ul className="space-y-2">
              {conteo.map(({ c, k }) => (
                <li key={c} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="h-2 w-2 rounded-full" style={{ background: { verde: "#059669", gris: "#64748b", amarillo: "#d97706", naranja: "#ea580c", rojo: "#dc2626" }[CATEGORIAS[c].tono] }} />
                    {CATEGORIAS[c].nombre}
                  </span>
                  <span className="font-mono text-xs text-slate-600">{k}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Database className="h-3.5 w-3.5" /> Límite reconocido: esta capa es higiene, no la propuesta de valor central. Es ciega ante una SIM comprada hace media hora y ante el Caller ID falsificado.
            </p>
          </Card>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Marcar un número"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button
              disabled={nuevo.numero.replace(/\D/g, "").length < 6}
              onClick={() => {
                agregarNumero({ numero: nuevo.numero, categoria: nuevo.categoria, fuente: "guardian", reportes: 1, nota: nuevo.nota || undefined });
                setNuevo({ numero: "", categoria: "spam_comercial", nota: "" });
                setModal(false);
              }}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Número o prefijo" hint="Terminá con * para marcar un prefijo completo. Ej.: +5491140000*">
            <Input value={nuevo.numero} onChange={(e) => setNuevo({ ...nuevo, numero: e.target.value })} placeholder="+54 9 11 ..." />
          </Field>
          <Field label="Categoría">
            <Select value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value as CategoriaNumero })}>
              {(Object.keys(CATEGORIAS) as CategoriaNumero[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORIAS[c].nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nota (opcional)">
            <Input value={nuevo.nota} onChange={(e) => setNuevo({ ...nuevo, nota: e.target.value })} placeholder="Qué pasó en la llamada" />
          </Field>
          <p className="text-xs text-slate-500">Los reportes comunitarios se transmiten disociados del identificador del reportante y se ponderan por reputación histórica.</p>
        </div>
      </Modal>
    </>
  );
}
