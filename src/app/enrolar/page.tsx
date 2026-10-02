"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { Hydrated } from "@/components/Hydrated";
import { Grabador } from "@/components/Grabador";
import { Button, Card, Field, Input } from "@/components/ui";
import { Logo } from "@/components/SiteHeader";
import { MAX_VOCES, useVozReal } from "@/lib/store";
import { TEXTO_ENROLAMIENTO } from "@/lib/seed";
import type { Parentesco } from "@/lib/types";

function Enrolamiento() {
  const params = useSearchParams();
  const { circulo, agregarVoz } = useVozReal();
  const [nombre, setNombre] = useState(params.get("n") ?? "");
  const [telefono, setTelefono] = useState(params.get("t") ?? "");
  const parentesco = (params.get("p") ?? "otro") as Parentesco;
  const [consentimiento, setConsentimiento] = useState(false);
  const [paso, setPaso] = useState<"consentimiento" | "grabar" | "enviando" | "listo" | "lleno">(circulo.voces.length >= MAX_VOCES ? "lleno" : "consentimiento");

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Logo />
          <span className="text-xs text-slate-500">Módulo liviano de enrolamiento</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Invitación de {circulo.guardian.nombre}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Registrá tu voz para proteger a {circulo.protegido.nombre.split(" ")[0]}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tu huella vocal permitirá que el teléfono de {circulo.protegido.nombre.split(" ")[0]} reconozca si quien llama con tu voz sos realmente vos. Tarda 30 segundos.
        </p>

        {paso === "lleno" && (
          <Card className="mt-6">
            <p className="text-sm text-slate-700">El círculo ya tiene las {MAX_VOCES} voces permitidas. Pedile al guardián que libere un lugar.</p>
          </Card>
        )}

        {paso === "consentimiento" && (
          <Card className="mt-6" title="Tus datos y tu consentimiento">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tu nombre">
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </Field>
                <Field label="Tu teléfono">
                  <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                </Field>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="flex items-center gap-2 font-medium text-slate-900">
                  <Lock className="h-4 w-4 text-accent-600" /> Qué pasa con tu grabación
                </p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>El audio se procesa en este dispositivo y se descarta. Nunca se transmite.</li>
                  <li>Solo viaja un vector de 128 números cifrado con la clave pública del teléfono de {circulo.protegido.nombre.split(" ")[0]}.</li>
                  <li>Pasa por un relay ciego que no puede descifrarlo y destruye el paquete al confirmar la entrega.</li>
                  <li>Podés revocar el consentimiento y eliminar tu huella en cualquier momento (art. 16, Ley 25.326).</li>
                </ul>
              </div>
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input type="checkbox" className="mt-0.5" checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)} />
                Presto consentimiento expreso, informado y revocable para que mi huella vocal se almacene cifrada únicamente en el teléfono de la persona protegida.
              </label>
              <Button disabled={!consentimiento || nombre.trim().length < 2} onClick={() => setPaso("grabar")}>
                Continuar a la grabación
              </Button>
            </div>
          </Card>
        )}

        {paso === "grabar" && (
          <Card className="mt-6" title="Grabá 30 segundos" subtitle="Hablá con tu tono habitual, en un lugar silencioso">
            <Grabador
              duracionMax={30}
              textoLectura={TEXTO_ENROLAMIENTO}
              etiquetaBoton="Tocá para empezar"
              onAnalisis={(a) => {
                setPaso("enviando");
                setTimeout(() => {
                  agregarVoz({ nombre: nombre.trim(), parentesco, telefono, embedding: a.embedding, metodo: "remoto", consentimiento: true });
                  setPaso("listo");
                }, 1200);
              }}
            />
          </Card>
        )}

        {paso === "enviando" && (
          <Card className="mt-6">
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-accent-500" /> Cifrando el vector y enviándolo por el relay ciego…
            </div>
          </Card>
        )}

        {paso === "listo" && (
          <Card className="mt-6">
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              <p className="mt-3 text-lg font-semibold text-slate-900">Listo, {nombre.split(" ")[0]}</p>
              <p className="mt-1 max-w-sm text-sm text-slate-600">Tu huella quedó cifrada en el teléfono de {circulo.protegido.nombre.split(" ")[0]}. El audio ya fue descartado de este dispositivo.</p>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" /> Consentimiento registrado y revocable
              </p>
              <Link href="/panel/circulo" className="mt-5 text-sm font-medium text-accent-700 hover:underline">
                Ver el círculo familiar
              </Link>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function EnrolarPage() {
  return (
    <Hydrated>
      <Suspense fallback={<div className="min-h-screen bg-surface" />}>
        <Enrolamiento />
      </Suspense>
    </Hydrated>
  );
}
