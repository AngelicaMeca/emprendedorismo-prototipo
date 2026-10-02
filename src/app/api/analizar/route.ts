import { NextResponse } from "next/server";
import { analizarLlamada, type ContextoMotor } from "@/lib/engine";
import type { EntradaLlamada } from "@/lib/types";
import { CIRCULO_INICIAL, CONFIG_INICIAL, NUMEROS_INICIALES, PREGUNTAS_INICIALES } from "@/lib/seed";

// POST /api/analizar
// Ejecuta el motor de decisión (apartado 5.9) de forma stateless. El cliente
// envía las señales ya extraídas localmente (probabilidad de síntesis,
// similitud, calidad); nunca audio ni plantillas biométricas en claro.
export async function POST(req: Request) {
  let body: { entrada?: Partial<EntradaLlamada>; contexto?: Partial<ContextoMotor> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }
  const e = body.entrada;
  if (!e || typeof e.probSintesis !== "number" || typeof e.calidadMuestra !== "number") {
    return NextResponse.json({ error: "Faltan campos obligatorios: probSintesis y calidadMuestra" }, { status: 400 });
  }
  const entrada: EntradaLlamada = {
    numero: e.numero ?? "",
    numeroOculto: !!e.numeroOculto,
    invocaParentesco: !!e.invocaParentesco,
    familiarInvocadoId: e.familiarInvocadoId ?? null,
    capa0: e.capa0,
    probSintesis: Math.min(1, Math.max(0, e.probSintesis)),
    calidadMuestra: Math.min(1, Math.max(0, e.calidadMuestra)),
    similitudBiometrica: e.similitudBiometrica ?? null,
    mejorCandidatoId: e.mejorCandidatoId ?? null,
    palabraIdentificacion: e.palabraIdentificacion ?? "ausente",
    palabraCoaccion: !!e.palabraCoaccion,
    llamadaUrgente: !!e.llamadaUrgente,
    canal: e.canal ?? "celular",
  };
  const c = body.contexto ?? {};
  const contexto: ContextoMotor = {
    circulo: c.circulo ?? CIRCULO_INICIAL,
    numeros: c.numeros ?? NUMEROS_INICIALES,
    config: c.config ?? CONFIG_INICIAL,
    preguntas: c.preguntas ?? PREGUNTAS_INICIALES,
    confirmaciones: c.confirmaciones ?? [],
  };
  const inicio = performance.now();
  const resultado = analizarLlamada(entrada, contexto);
  const tiempoServidorMs = Math.round((performance.now() - inicio) * 100) / 100;
  return NextResponse.json({ resultado, tiempoServidorMs, version: "1.0.0" });
}
