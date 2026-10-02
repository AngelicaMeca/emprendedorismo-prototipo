"use client";

import { useState } from "react";
import { AlertOctagon, Eye, EyeOff, KeyRound, MessageCircleQuestion, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select } from "@/components/ui";
import { NivelBadge } from "@/components/NivelBadge";
import { useVozReal } from "@/lib/store";
import { contarSilabas, diasEntre, enMeses, fechaCorta } from "@/lib/utils";

const MATRIZ: Array<{ situacion: string; nivel: 0 | 2 | 4; discreto?: boolean; sinCambio?: boolean; comportamiento: string }> = [
  { situacion: "Palabra de identificación correcta, voz coincidente y sin indicios de síntesis", nivel: 0, comportamiento: "Banda verde con la leyenda “Verificado por voz y palabra clave”." },
  { situacion: "Palabra de identificación correcta pero habla sintética detectada", nivel: 4, comportamiento: "Prevalece el indicio físico. Se informa que la palabra fue dicha pero la voz no es humana." },
  { situacion: "Palabra de coacción detectada", nivel: 4, discreto: true, comportamiento: "Aviso inmediato y silencioso al guardián, sin cartel visible que pueda delatar al usuario." },
  { situacion: "Ausencia de palabra clave en una llamada urgente de un familiar", nivel: 2, sinCambio: true, comportamiento: "No modifica el nivel por sí sola. Se ofrece el botón “Pedile la palabra clave”." },
  { situacion: "Palabra incorrecta tras solicitud explícita del usuario", nivel: 4, comportamiento: "Se despliega la pregunta de desafío y el botón de aviso al guardián." },
  { situacion: "Palabra clave dicha por un número desconocido no enrolado", nivel: 2, comportamiento: "Se advierte que la palabra pudo haberse filtrado y se exige verificación biométrica o pregunta de desafío." },
];

function FormPalabra({
  tipo,
  onGuardar,
  onCerrar,
}: {
  tipo: "identificacion" | "coaccion";
  onGuardar: (frase: string, pista: string) => void;
  onCerrar: () => void;
}) {
  const [frase, setFrase] = useState("");
  const [pista, setPista] = useState("");
  const [ver, setVer] = useState(false);
  const silabas = contarSilabas(frase);
  const robusta = silabas >= 2 && silabas <= 4;
  return (
    <div className="space-y-4">
      <Field label={tipo === "identificacion" ? "Palabra o frase de identificación" : "Palabra de coacción"} hint="Se recomienda de 2 a 4 sílabas y de baja frecuencia en el habla cotidiana.">
        <div className="relative">
          <Input type={ver ? "text" : "password"} value={frase} onChange={(e) => setFrase(e.target.value)} placeholder={tipo === "identificacion" ? "Ej.: cielo naranja" : "Ej.: tía Norma"} autoComplete="off" />
          <button type="button" onClick={() => setVer((v) => !v)} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Mostrar">
            {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <div className="flex items-center gap-2 text-xs">
        <Badge tono={frase ? (robusta ? "verde" : "amarillo") : "gris"}>{silabas} sílabas</Badge>
        <span className="text-slate-500">{frase ? (robusta ? "Longitud recomendada" : "Ajustá la longitud para evitar activaciones espurias") : "Escribí la frase"}</span>
      </div>
      <Field label="Pista visible para la persona protegida" hint="Es lo único que se muestra en pantalla. Nunca la palabra completa.">
        <Input value={pista} onChange={(e) => setPista(e.target.value)} placeholder="Ej.: El color del cielo cuando llegamos al campo" />
      </Field>
      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        Se almacena como hash (FNV-1a 64 en el prototipo; plantilla acústica + AES-GCM 256 bajo Android Keystore en la app). No queda en texto plano.
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button disabled={!frase.trim() || !pista.trim()} onClick={() => onGuardar(frase, pista)}>
          Guardar
        </Button>
      </div>
    </div>
  );
}

export default function PalabrasClavePage() {
  const { palabraIdentificacion, palabraCoaccion, preguntas, circulo, config, definirIdentificacion, definirCoaccion, eliminarPalabra, agregarPregunta, eliminarPregunta } = useVozReal();
  const [modal, setModal] = useState<"identificacion" | "coaccion" | "pregunta" | null>(null);
  const [pregunta, setPregunta] = useState("");
  const [pista, setPista] = useState("");
  const [familiarId, setFamiliarId] = useState("");

  const rotacion = palabraIdentificacion ? enMeses(palabraIdentificacion.fechaAcuerdo, config.rotacionMeses) : null;
  const dias = rotacion ? diasEntre(new Date().toISOString(), rotacion) : null;

  return (
    <>
      <PageHeader
        eyebrow="Factor de conocimiento compartido"
        title="Palabras clave de seguridad"
        description="Algo que uno sabe. Un algoritmo puede replicar un timbre con precisión indistinguible, pero no puede conocer un secreto que nunca circuló por Internet."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title={
            <span className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-accent-600" /> Palabra de identificación (positiva)
            </span>
          }
          subtitle="La misma para todo el círculo. El familiar la dice al inicio de cualquier llamada urgente o inesperada."
          actions={
            palabraIdentificacion ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setModal("identificacion")}>
                  <RefreshCw className="h-3.5 w-3.5" /> Rotar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => eliminarPalabra("identificacion")}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setModal("identificacion")}>
                Definir
              </Button>
            )
          }
        >
          {palabraIdentificacion ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Pista visible</dt>
                <dd className="text-right font-medium text-slate-900">{palabraIdentificacion.pista}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Hash almacenado</dt>
                <dd className="font-mono text-xs text-slate-700">{palabraIdentificacion.hash}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Sílabas</dt>
                <dd>{palabraIdentificacion.silabas}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Acordada en persona</dt>
                <dd>{fechaCorta(palabraIdentificacion.fechaAcuerdo)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Próxima rotación</dt>
                <dd>
                  <Badge tono={dias != null && dias <= 0 ? "rojo" : dias != null && dias < 30 ? "amarillo" : "verde"}>
                    {rotacion ? fechaCorta(rotacion) : "-"} {dias != null && (dias <= 0 ? "· vencida" : `· en ${dias} días`)}
                  </Badge>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Sin definir. Su detección eleva la confianza y habilita el nivel 0 reforzado. Su ausencia, por sí sola, no penaliza.</p>
          )}
        </Card>

        <Card
          title={
            <span className="flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-600" /> Palabra de coacción (duress word)
            </span>
          }
          subtitle="Pedido de auxilio encubierto. Dispara el nivel 4 en modo discreto aunque la voz sea auténtica."
          actions={
            palabraCoaccion ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setModal("coaccion")}>
                  Cambiar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => eliminarPalabra("coaccion")}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setModal("coaccion")}>
                Definir
              </Button>
            )
          }
        >
          {palabraCoaccion ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Pista (solo para el guardián)</dt>
                <dd className="text-right font-medium text-slate-900">{palabraCoaccion.pista}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Hash almacenado</dt>
                <dd className="font-mono text-xs text-slate-700">{palabraCoaccion.hash}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Acordada en persona</dt>
                <dd>{fechaCorta(palabraCoaccion.fechaAcuerdo)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Sin definir. Nunca se ensaya ni se menciona fuera del acuerdo original.</p>
          )}
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-900 ring-1 ring-red-200">
            Jamás se muestra en la pantalla de la persona protegida ni se define en la misma conversación que la palabra de identificación.
          </div>
        </Card>
      </div>

      <Card
        className="mt-6"
        title={
          <span className="flex items-center gap-2">
            <MessageCircleQuestion className="h-4 w-4 text-brand-700" /> Preguntas de desafío
          </span>
        }
        subtitle="No las evalúa el sistema sino la persona. Trasladan la conversación del plano emocional al analítico."
        actions={
          <Button size="sm" onClick={() => setModal("pregunta")}>
            <Plus className="h-3.5 w-3.5" /> Agregar
          </Button>
        }
      >
        {preguntas.length === 0 ? (
          <p className="text-sm text-slate-500">Sin preguntas. Ante una alerta, la app no tendrá qué sugerir.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {preguntas.map((p) => {
              const fam = circulo.voces.find((v) => v.id === p.familiarId);
              return (
                <li key={p.id} className="flex items-start gap-4 py-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{p.pregunta}</p>
                    <p className="text-xs text-slate-500">
                      Pista: {p.pista} · {fam ? `para llamadas que invoquen a ${fam.nombre.split(" ")[0]}` : "genérica para todo el círculo"}
                    </p>
                  </div>
                  <button onClick={() => eliminarPregunta(p.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Gobernanza familiar" subtitle="La seguridad depende de la disciplina del grupo">
          <ul className="space-y-2 text-sm text-slate-700">
            {[
              "Acordar la palabra en persona, nunca por WhatsApp, SMS, correo ni redes sociales.",
              "No usar datos deducibles del entorno digital: mascota publicada, apodo conocido, fecha divulgada.",
              "Rotar la palabra de identificación cada seis meses, con recordatorio automático.",
              "No ensayar ni mencionar jamás la palabra de coacción fuera del acuerdo original.",
              "Una sola regla operativa para la persona protegida: si piden plata con urgencia y no dicen la palabra, cortar y devolver el llamado al número de la agenda.",
            ].map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                {r}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Integración con el motor de decisión" subtitle="Apartado 5.7.4 · la palabra correcta nunca basta por sí sola">
          <ul className="divide-y divide-slate-100">
            {MATRIZ.map((m) => (
              <li key={m.situacion} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm font-medium text-slate-900">{m.situacion}</p>
                  <p className="text-xs text-slate-500">{m.comportamiento}</p>
                </div>
                <div className="sm:text-right">
                  {m.sinCambio ? <Badge tono="gris">No modifica el nivel</Badge> : <NivelBadge nivel={m.nivel} discreto={m.discreto} corto />}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Modal open={modal === "identificacion"} onClose={() => setModal(null)} title={palabraIdentificacion ? "Rotar palabra de identificación" : "Definir palabra de identificación"}>
        <FormPalabra
          tipo="identificacion"
          onCerrar={() => setModal(null)}
          onGuardar={(f, p) => {
            definirIdentificacion(f, p);
            setModal(null);
          }}
        />
      </Modal>
      <Modal open={modal === "coaccion"} onClose={() => setModal(null)} title="Definir palabra de coacción">
        <FormPalabra
          tipo="coaccion"
          onCerrar={() => setModal(null)}
          onGuardar={(f, p) => {
            definirCoaccion(f, p);
            setModal(null);
          }}
        />
      </Modal>
      <Modal
        open={modal === "pregunta"}
        onClose={() => setModal(null)}
        title="Nueva pregunta de desafío"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!pregunta.trim()}
              onClick={() => {
                agregarPregunta({ pregunta: pregunta.trim(), pista: pista.trim() || "Sin pista", familiarId: familiarId || undefined });
                setPregunta("");
                setPista("");
                setFamiliarId("");
                setModal(null);
              }}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Pregunta" hint="Cuya respuesta solo conoce el familiar real y no está en redes.">
            <Input value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="¿Cómo se llamaba el perro que teníamos en el campo?" />
          </Field>
          <Field label="Pista para el guardián">
            <Input value={pista} onChange={(e) => setPista(e.target.value)} placeholder="Nombre de un animal de la infancia" />
          </Field>
          <Field label="Familiar asociado (opcional)">
            <Select value={familiarId} onChange={(e) => setFamiliarId(e.target.value)}>
              <option value="">Genérica para todo el círculo</option>
              {circulo.voces.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre} · {v.parentesco}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </>
  );
}
