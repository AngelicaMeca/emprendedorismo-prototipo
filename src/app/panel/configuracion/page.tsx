"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, Card, Modal, PageHeader, Slider, Switch } from "@/components/ui";
import { useVozReal } from "@/lib/store";
import { PRESETS_SENSIBILIDAD } from "@/lib/niveles";
import type { Sensibilidad } from "@/lib/types";
import { cn } from "@/lib/utils";

const SENS: Array<{ id: Sensibilidad; nombre: string; d: string }> = [
  { id: "conservadora", nombre: "Conservadora", d: "Menos alertas rojas. El amarillo absorbe más casos dudosos. Recomendada para familias con mala señal." },
  { id: "equilibrada", nombre: "Equilibrada", d: "Punto de operación por defecto sobre la curva DET del corpus local." },
  { id: "estricta", nombre: "Estricta", d: "Más sensible a la síntesis. Puede aumentar los falsos positivos con resfríos o manos libres." },
];

export default function ConfiguracionPage() {
  const { config, actualizarConfig, setSensibilidad, eliminarTodasLasHuellas, restablecerDemo } = useVozReal();
  const [confirmar, setConfirmar] = useState<"huellas" | "demo" | null>(null);
  const u = config.umbrales;
  const setU = (k: keyof typeof u, v: number) => actualizarConfig({ umbrales: { ...u, [k]: v } });
  const esPreset = JSON.stringify(u) === JSON.stringify(PRESETS_SENSIBILIDAD[config.sensibilidad]);

  return (
    <>
      <PageHeader eyebrow="F9 · Configuración remota" title="Configuración" description="El guardián ajusta la sensibilidad y el comportamiento sin exigir destreza técnica a la persona protegida." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Sensibilidad del motor" subtitle="Punto de operación conservador para el nivel rojo: el falso positivo es un riesgo afectivo">
          <div className="grid gap-3">
            {SENS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSensibilidad(s.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors",
                  config.sensibilidad === s.id && esPreset ? "border-accent-500 bg-accent-50" : "border-slate-200 hover:border-slate-300",
                )}
              >
                <p className="font-medium text-slate-900">{s.nombre}</p>
                <p className="text-xs text-slate-600">{s.d}</p>
              </button>
            ))}
          </div>
          {!esPreset && <p className="mt-3 text-xs text-amber-700">Umbrales personalizados. Elegí un preset para restablecerlos.</p>}
        </Card>

        <Card title="Umbrales de decisión" subtitle="Ajuste fino sobre la curva DET">
          <div className="space-y-5">
            <Slider label="Similitud alta (verde requiere ≥)" value={u.similitudAlta} min={0.5} max={0.95} onChange={(v) => setU("similitudAlta", Math.max(v, u.similitudBaja + 0.05))} formato={(v) => v.toFixed(2)} />
            <Slider label="Similitud baja (rojo si <)" value={u.similitudBaja} min={0.3} max={0.9} onChange={(v) => setU("similitudBaja", Math.min(v, u.similitudAlta - 0.05))} formato={(v) => v.toFixed(2)} />
            <Slider label="Síntesis baja (natural si ≤)" value={u.sintesisBaja} min={0.05} max={0.5} onChange={(v) => setU("sintesisBaja", Math.min(v, u.sintesisAlta - 0.05))} formato={(v) => v.toFixed(2)} />
            <Slider label="Síntesis alta (sintética si ≥)" value={u.sintesisAlta} min={0.3} max={0.95} onChange={(v) => setU("sintesisAlta", Math.max(v, u.sintesisBaja + 0.05))} formato={(v) => v.toFixed(2)} />
            <Slider label="Calidad mínima de muestra (techo amarillo)" value={u.calidadMinima} min={0.1} max={0.7} onChange={(v) => setU("calidadMinima", v)} hint="Por debajo de esta SNR el sistema nunca emite rojo por razones acústicas." />
          </div>
        </Card>

        <Card title="Comportamiento de la alerta">
          <Switch checked={config.modoSusurro} onChange={(v) => actualizarConfig({ modoSusurro: v })} label="Modo susurro" descripcion="En nivel rojo, reproduce el mensaje a bajo volumen solo por el auricular, inaudible para el interlocutor." />
          <Switch checked={config.bloqueoSilencioso} onChange={(v) => actualizarConfig({ bloqueoSilencioso: v })} label="Bloqueo silencioso de spam comercial" descripcion="Única excepción al principio de no intervención. Solo números ya clasificados." />
          <Switch checked={config.refuerzoAdaptativo} onChange={(v) => actualizarConfig({ refuerzoAdaptativo: v })} label="Refuerzo adaptativo de plantillas" descripcion="Las llamadas confirmadas como auténticas refinan la huella local frente al canal y el envejecimiento vocal." />
          <Switch checked={config.operadoraHabilitada} onChange={(v) => actualizarConfig({ operadoraHabilitada: v })} label="Capa 0 · señales de red de la operadora" descripcion="Fase 2 del modelo híbrido. Habilita antigüedad de línea, SIM swap, origen VoIP y fan-out en el simulador." />
          <div className="mt-2">
            <Slider label="Histéresis tras confirmación" value={config.histeresisDias} min={7} max={90} step={1} onChange={(v) => actualizarConfig({ histeresisDias: v })} formato={(v) => `${v} días`} hint="No se reitera el nivel rojo para un número que el usuario confirmó como auténtico." />
          </div>
          <div className="mt-4">
            <Slider label="Rotación de la palabra de identificación" value={config.rotacionMeses} min={3} max={12} step={1} onChange={(v) => actualizarConfig({ rotacionMeses: v })} formato={(v) => `${v} meses`} />
          </div>
        </Card>

        <Card title="Cómo avisa el teléfono" subtitle="Durante la llamada el teléfono está en la oreja: la vibración es el canal principal">
          <Switch
            checked={config.alertas.vibracion}
            onChange={(v) => actualizarConfig({ alertas: { ...config.alertas, vibracion: v } })}
            label="Vibración"
            descripcion="Amarillo: una corta. Naranja: dos cortas. Rojo: una larga que se repite cada 8 s mientras siga la llamada."
          />
          <Switch
            checked={config.alertas.tono}
            onChange={(v) => actualizarConfig({ alertas: { ...config.alertas, tono: v } })}
            label="Tono por auricular (solo en rojo)"
            descripcion="Dos tonos graves que solo escucha la persona protegida, no quien llama. Ningún otro nivel suena."
          />
          <Switch
            checked={config.alertas.linterna}
            onChange={(v) => actualizarConfig({ alertas: { ...config.alertas, linterna: v } })}
            label="Linterna (solo en rojo)"
            descripcion="Tres destellos del flash. Pensada para personas con hipoacusia que hablan con altavoz: con el teléfono en la oreja el flash apunta hacia afuera y no se ve."
          />
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            Verde y gris nunca vibran ni suenan. La palabra de coacción y el bloqueo silencioso no producen ningún aviso en el teléfono.
          </div>
        </Card>

        <Card title="Aviso al guardián (F7)" subtitle="Con número, hora y nivel de riesgo. Nunca con audio.">
          <Switch checked={config.avisoGuardian.push} onChange={(v) => actualizarConfig({ avisoGuardian: { ...config.avisoGuardian, push: v } })} label="Notificación push" />
          <Switch checked={config.avisoGuardian.sms} onChange={(v) => actualizarConfig({ avisoGuardian: { ...config.avisoGuardian, sms: v } })} label="SMS de respaldo" descripcion="Para zonas sin datos móviles. En modo de red asistida lo envía la operadora." />
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            El guardián no accede a la lista de llamadas, su duración ni su contenido. La vigilancia familiar encubierta es un uso explícitamente excluido del producto.
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-red-200 ring-red-200" title={<span className="flex items-center gap-2 text-red-700"><AlertTriangle className="h-4 w-4" /> Zona de datos sensibles</span>} subtitle="Derecho al olvido · art. 16, Ley 25.326">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="danger" onClick={() => setConfirmar("huellas")}>
            Eliminar todas las huellas vocales y palabras clave
          </Button>
          <Button variant="outline" onClick={() => setConfirmar("demo")}>
            <RotateCcw className="h-4 w-4" /> Restablecer datos de demostración
          </Button>
        </div>
      </Card>

      <Modal
        open={confirmar !== null}
        onClose={() => setConfirmar(null)}
        title={confirmar === "huellas" ? "Eliminar datos biométricos" : "Restablecer demostración"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmar(null)}>
              Cancelar
            </Button>
            <Button
              variant={confirmar === "huellas" ? "danger" : "primary"}
              onClick={() => {
                if (confirmar === "huellas") eliminarTodasLasHuellas();
                else restablecerDemo();
                setConfirmar(null);
              }}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          {confirmar === "huellas"
            ? "Se destruirán todos los vectores de voz, sus claves criptográficas y los hashes de las palabras clave. La Capa 3 dejará de funcionar hasta volver a enrolar."
            : "Se reemplazarán todos los datos locales por el círculo de demostración (Familia Rodríguez), su base de números y sus eventos."}
        </p>
      </Modal>
    </>
  );
}
