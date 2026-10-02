"use client";

import { useState } from "react";
import { Link2, Mic, Plus, ShieldCheck, Sparkles, Trash2, UserRound } from "lucide-react";
import { Avatar, Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { Grabador } from "@/components/Grabador";
import { MAX_VOCES, useVozReal } from "@/lib/store";
import { PARENTESCOS } from "@/lib/niveles";
import { TEXTO_ENROLAMIENTO } from "@/lib/seed";
import type { Parentesco } from "@/lib/types";
import { fechaCorta, formatearNumero, vectorAleatorio } from "@/lib/utils";

type Metodo = "presencial" | "remoto" | "simulado";

export default function CirculoPage() {
  const { circulo, actualizarProtegido, actualizarGuardian, renombrarCirculo, agregarVoz, eliminarVoz } = useVozReal();
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [nombre, setNombre] = useState("");
  const [parentesco, setParentesco] = useState<Parentesco>("hija");
  const [telefono, setTelefono] = useState("");
  const [metodo, setMetodo] = useState<Metodo>("presencial");
  const [consentimiento, setConsentimiento] = useState(false);
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [enlace, setEnlace] = useState<string | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState<string | null>(null);

  const lleno = circulo.voces.length >= MAX_VOCES;

  const reiniciar = () => {
    setPaso(1);
    setNombre("");
    setTelefono("");
    setParentesco("hija");
    setMetodo("presencial");
    setConsentimiento(false);
    setEmbedding(null);
    setEnlace(null);
  };

  const cerrar = () => {
    setAbierto(false);
    reiniciar();
  };

  const guardar = (emb: number[], m: Metodo) => {
    agregarVoz({ nombre: nombre.trim(), parentesco, telefono, embedding: emb, metodo: m, consentimiento: true });
    cerrar();
  };

  const generarEnlace = () => {
    const params = new URLSearchParams({ n: nombre.trim(), p: parentesco, t: telefono, c: circulo.id });
    const url = `${window.location.origin}/enrolar?${params.toString()}`;
    setEnlace(url);
    void navigator.clipboard?.writeText(url).catch(() => undefined);
  };

  const datosValidos = nombre.trim().length >= 2 && telefono.replace(/\D/g, "").length >= 8;

  return (
    <>
      <PageHeader
        eyebrow="Círculo de Protección Familiar"
        title="Círculo familiar"
        description="La unidad de uso de VozReal: una persona protegida, un guardián y hasta ocho voces enroladas con consentimiento expreso."
        actions={
          <Button variant="accent" disabled={lleno} onClick={() => setAbierto(true)}>
            <Plus className="h-4 w-4" /> Enrolar una voz
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Nombre del círculo">
          <Input value={circulo.nombre} onChange={(e) => renombrarCirculo(e.target.value)} />
          <p className="mt-2 text-xs text-slate-500">Creado el {fechaCorta(circulo.creado)}</p>
        </Card>
        <Card title="Usuario protegido" subtitle="No configura nada. Solo ve un cartel grande cuando algo no está bien.">
          <div className="space-y-3">
            <Field label="Nombre">
              <Input value={circulo.protegido.nombre} onChange={(e) => actualizarProtegido({ nombre: e.target.value })} />
            </Field>
            <Field label="Teléfono">
              <Input value={circulo.protegido.telefono} onChange={(e) => actualizarProtegido({ telefono: e.target.value })} />
            </Field>
            <Field label="Perfil de vulnerabilidad situacional">
              <Select value={circulo.protegido.perfil ?? ""} onChange={(e) => actualizarProtegido({ perfil: e.target.value })}>
                {["Adulta mayor · atiende en altavoz", "Adulto mayor", "Deterioro cognitivo leve", "Discapacidad intelectual", "Adolescente con teléfono propio", "Baja alfabetización digital"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>
        <Card title="Guardián administrador" subtitle="Recibe los avisos de alerta roja. Nunca audio ni lista de llamadas.">
          <div className="space-y-3">
            <Field label="Nombre">
              <Input value={circulo.guardian.nombre} onChange={(e) => actualizarGuardian({ nombre: e.target.value })} />
            </Field>
            <Field label="Teléfono para avisos">
              <Input value={circulo.guardian.telefono} onChange={(e) => actualizarGuardian({ telefono: e.target.value })} />
            </Field>
            <Field label="Relación">
              <Select value={circulo.guardian.relacion ?? "hija"} onChange={(e) => actualizarGuardian({ relacion: e.target.value })}>
                {Object.keys(PARENTESCOS).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Voces enroladas <span className="ml-1 text-sm font-normal text-slate-500">{circulo.voces.length} de {MAX_VOCES}</span>
          </h2>
          <Badge tono="verde">
            <ShieldCheck className="h-3 w-3" /> AES-GCM 256 · Android Keystore
          </Badge>
        </div>
        {circulo.voces.length === 0 ? (
          <Empty icon={<UserRound className="h-8 w-8" />} title="Todavía no hay voces enroladas" text="Sin una huella de referencia, la Capa 3 no puede verificar a tus familiares." action={<Button onClick={() => setAbierto(true)}>Enrolar la primera voz</Button>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {circulo.voces.map((v) => (
              <Card key={v.id} padding={false}>
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar nombre={v.nombre} color={v.color} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{v.nombre}</p>
                      <p className="text-sm text-slate-500">{v.parentesco}</p>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <dt>Teléfono</dt>
                      <dd className="font-mono">{formatearNumero(v.telefono)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Enrolada</dt>
                      <dd>{fechaCorta(v.fechaEnrolamiento)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Método</dt>
                      <dd className="capitalize">{v.metodo}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Refuerzo adaptativo</dt>
                      <dd>{v.muestrasRefuerzo} muestras</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Embedding</dt>
                      <dd className="font-mono">128-d · cifrado</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex h-6 items-end gap-px overflow-hidden rounded">
                    {v.embedding.slice(0, 48).map((x, i) => (
                      <span key={i} className="flex-1 rounded-sm" style={{ height: `${Math.round(Math.abs(x) * 100) + 8}%`, background: v.color, opacity: 0.35 + Math.abs(x) * 0.65 }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                  <Badge tono="verde">Consentimiento revocable</Badge>
                  <button onClick={() => setConfirmarBorrado(v.id)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="mt-8" title="Cómo se enrola una voz sin comprometer la privacidad" subtitle="Apartado 5.3.2 · el audio nunca sale del dispositivo de quien graba">
        <ol className="grid gap-4 text-sm text-slate-700 md:grid-cols-5">
          {[
            ["Enlace remoto", "El guardián envía por WhatsApp un enlace de invitación. El familiar graba 30 segundos leyendo un texto."],
            ["Extracción local", "El audio se procesa y se descarta en el teléfono del familiar. Solo viaja un vector de 128 dimensiones."],
            ["Cifrado extremo a extremo", "El vector se cifra con la clave pública del dispositivo protegido y pasa por un relay ciego que lo destruye al entregarlo."],
            ["Alternativa presencial", "En la próxima visita, el familiar graba directamente en el teléfono de la persona protegida, sin servidores."],
            ["Refuerzo adaptativo", "Cada llamada confirmada como auténtica puede refinar la plantilla frente al canal telefónico y el envejecimiento vocal."],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-xl bg-slate-50 p-4">
              <span className="font-mono text-xs text-accent-700">0{i + 1}</span>
              <p className="mt-1 font-medium text-slate-900">{t}</p>
              <p className="mt-1 text-xs text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
      </Card>

      {/* Modal de enrolamiento */}
      <Modal open={abierto} onClose={cerrar} title={`Enrolar una voz · paso ${paso} de 3`} wide>
        {paso === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre del familiar">
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Marcela Rodríguez" />
              </Field>
              <Field label="Parentesco con la persona protegida">
                <Select value={parentesco} onChange={(e) => setParentesco(e.target.value as Parentesco)}>
                  {Object.keys(PARENTESCOS).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Teléfono del familiar" hint="Se usa para la verificación 1:1 cuando llama desde su número.">
                <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+54 9 385 ..." />
              </Field>
              <Field label="Método de enrolamiento">
                <Select value={metodo} onChange={(e) => setMetodo(e.target.value as Metodo)}>
                  <option value="presencial">Presencial · grabar ahora en este dispositivo</option>
                  <option value="remoto">Remoto · enviar enlace por WhatsApp</option>
                  <option value="simulado">Simulado · generar huella de demostración</option>
                </Select>
              </Field>
            </div>
            <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
              <input type="checkbox" className="mt-0.5" checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)} />
              <span>
                El familiar presta <strong>consentimiento expreso, informado y revocable</strong> para que su huella vocal se almacene cifrada únicamente en el teléfono de la
                persona protegida (Ley 25.326, arts. 2, 4, 8 y 16). Podrá eliminarla en cualquier momento.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={cerrar}>
                Cancelar
              </Button>
              <Button disabled={!datosValidos || !consentimiento} onClick={() => setPaso(2)}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {paso === 2 && metodo === "presencial" && (
          <div className="space-y-4">
            <Grabador
              duracionMax={30}
              textoLectura={TEXTO_ENROLAMIENTO}
              etiquetaBoton="Tocá para grabar 30 segundos"
              onAnalisis={(a) => {
                setEmbedding(a.embedding);
                setPaso(3);
              }}
            />
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setPaso(1)}>
                Atrás
              </Button>
            </div>
          </div>
        )}

        {paso === 2 && metodo === "remoto" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
              <p className="flex items-center gap-2 font-medium">
                <Link2 className="h-4 w-4" /> Enlace de invitación para {nombre || "el familiar"}
              </p>
              <p className="mt-1 text-xs text-brand-800/80">
                El familiar abre el enlace en su propio teléfono, graba 30 segundos y solo se transmite el vector cifrado. En este prototipo, el enlace abre el módulo de
                enrolamiento en este mismo navegador.
              </p>
              {enlace ? (
                <div className="mt-3 space-y-2">
                  <Input readOnly value={enlace} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
                  <p className="text-xs text-emerald-700">Copiado al portapapeles. Enviáselo por WhatsApp.</p>
                  <a href={enlace} target="_blank" rel="noreferrer" className="inline-block text-xs font-medium text-accent-700 hover:underline">
                    Abrir el módulo de enrolamiento →
                  </a>
                </div>
              ) : (
                <Button className="mt-3" size="sm" onClick={generarEnlace}>
                  Generar enlace
                </Button>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setPaso(1)}>
                Atrás
              </Button>
              <Button variant="outline" onClick={cerrar}>
                Listo, espero el vector
              </Button>
            </div>
          </div>
        )}

        {paso === 2 && metodo === "simulado" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="flex items-center gap-2 font-medium text-slate-900">
                <Sparkles className="h-4 w-4 text-accent-600" /> Huella de demostración
              </p>
              <p className="mt-1 text-xs">Se generará un vector determinista de 128 dimensiones para poder probar el simulador sin micrófono.</p>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setPaso(1)}>
                Atrás
              </Button>
              <Button onClick={() => guardar(vectorAleatorio(Date.now() % 100000), "simulado")}>Generar y guardar</Button>
            </div>
          </div>
        )}

        {paso === 3 && embedding && (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
              <p className="flex items-center gap-2 font-medium">
                <Mic className="h-4 w-4" /> Embedding extraído localmente
              </p>
              <p className="mt-1 text-xs">El audio fue descartado. Solo se conservará este vector cifrado.</p>
              <div className="mt-3 flex h-10 items-end gap-px">
                {embedding.slice(0, 64).map((x, i) => (
                  <span key={i} className="flex-1 rounded-sm bg-emerald-600" style={{ height: `${Math.round(Math.abs(x) * 100) + 8}%`, opacity: 0.4 + Math.abs(x) * 0.6 }} />
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setPaso(2)}>
                Grabar de nuevo
              </Button>
              <Button variant="accent" onClick={() => guardar(embedding, "presencial")}>
                Guardar huella cifrada
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmarBorrado}
        onClose={() => setConfirmarBorrado(null)}
        title="Eliminar huella vocal"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmarBorrado(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmarBorrado) eliminarVoz(confirmarBorrado);
                setConfirmarBorrado(null);
              }}
            >
              Eliminar definitivamente
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Se destruirán el vector biométrico y la clave criptográfica asociada (art. 16, Ley 25.326). La acción es inmediata e irreversible. Las preguntas de desafío
          vinculadas quedarán sin familiar asignado.
        </p>
      </Modal>
    </>
  );
}
