import { describe, expect, it } from "vitest";
import { analizarLlamada, avisoFisico, contextoSinHuellas, type ContextoMotor } from "./engine";
import { CIRCULO_INICIAL, CONFIG_INICIAL, NUMEROS_INICIALES, PREGUNTAS_INICIALES } from "./seed";
import type { EntradaLlamada } from "./types";

// Los doce escenarios del simulador (src/app/simulador/page.tsx) con la
// configuración por defecto: sensibilidad equilibrada, Capa 0 apagada.

function ctx(extra: Partial<ContextoMotor> = {}): ContextoMotor {
  return { circulo: CIRCULO_INICIAL, numeros: NUMEROS_INICIALES, config: CONFIG_INICIAL, preguntas: PREGUNTAS_INICIALES, confirmaciones: [], ...extra };
}

const BASE: EntradaLlamada = {
  numero: "",
  invocaParentesco: false,
  probSintesis: 0.1,
  calidadMuestra: 0.8,
  palabraIdentificacion: "ausente",
  palabraCoaccion: false,
  llamadaUrgente: false,
  canal: "celular",
};

const MARCELA = "+5493854556677";
const JULIAN = "+5493854998811";
const ROBERTO = "+5491155667788";

describe("motor de decisión · escenarios del simulador", () => {
  it("hija real llamando → verde", () => {
    const r = analizarLlamada({ ...BASE, numero: MARCELA, similitudBiometrica: 0.91, mejorCandidatoId: "voz_marcela", probSintesis: 0.05, calidadMuestra: 0.88 }, ctx());
    expect(r.nivel).toBe(0);
    expect(r.titulo).toContain("Marcela");
    expect(r.avisarGuardian).toBe(false);
  });

  it("hija real con palabra clave → verde reforzado", () => {
    const r = analizarLlamada(
      { ...BASE, numero: MARCELA, similitudBiometrica: 0.9, mejorCandidatoId: "voz_marcela", probSintesis: 0.06, calidadMuestra: 0.85, palabraIdentificacion: "dicha", llamadaUrgente: true },
      ctx(),
    );
    expect(r.nivel).toBe(0);
    expect(r.reforzado).toBe(true);
  });

  it("secuestro virtual con voz clonada (timbre coincide, habla sintética) → rojo", () => {
    const r = analizarLlamada(
      { ...BASE, numero: JULIAN, invocaParentesco: true, familiarInvocadoId: "voz_julian", similitudBiometrica: 0.79, mejorCandidatoId: "voz_julian", probSintesis: 0.86, calidadMuestra: 0.74, llamadaUrgente: true },
      ctx(),
    );
    expect(r.nivel).toBe(4);
    expect(r.capas.capa2.resultado).toBe("sintetica");
    expect(r.capas.capa3.resultado).toBe("coincide");
    expect(r.avisarGuardian).toBe(true);
    expect(r.modoResguardo).toBe(true);
  });

  it("desconocido dice ser el nieto, voz humana que no coincide → rojo", () => {
    const r = analizarLlamada(
      { ...BASE, numero: "+5491198765432", invocaParentesco: true, familiarInvocadoId: "voz_julian", similitudBiometrica: 0.36, mejorCandidatoId: "voz_julian", probSintesis: 0.22, calidadMuestra: 0.7, llamadaUrgente: true },
      ctx(),
    );
    expect(r.nivel).toBe(4);
    expect(r.capas.capa3.modo).toBe("1:N");
    expect(r.titulo).toContain("Julián");
  });

  it("palabra clave filtrada desde número desconocido → rojo", () => {
    const r = analizarLlamada(
      { ...BASE, numero: "+5491177001122", invocaParentesco: true, familiarInvocadoId: "voz_roberto", similitudBiometrica: 0.52, mejorCandidatoId: "voz_roberto", probSintesis: 0.18, calidadMuestra: 0.76, palabraIdentificacion: "dicha", llamadaUrgente: true },
      ctx(),
    );
    expect(r.nivel).toBe(4);
    expect(r.reforzado).toBe(false);
  });

  it("hijo real bajo coacción → rojo discreto, sin cartel", () => {
    const r = analizarLlamada({ ...BASE, numero: ROBERTO, similitudBiometrica: 0.88, mejorCandidatoId: "voz_roberto", probSintesis: 0.08, calidadMuestra: 0.8, palabraCoaccion: true }, ctx());
    expect(r.nivel).toBe(4);
    expect(r.discreto).toBe(true);
    expect(r.avisarGuardian).toBe(true);
    expect(r.haptica).toContain("discreto");
    expect(r.aviso).toEqual({ vibracion: [], tono: false, linterna: false, repetirMs: null });
  });

  it("hijo real con mala señal → amarillo (techo por calidad)", () => {
    const r = analizarLlamada({ ...BASE, numero: ROBERTO, similitudBiometrica: 0.6, mejorCandidatoId: "voz_roberto", probSintesis: 0.33, calidadMuestra: 0.2 }, ctx());
    expect(r.nivel).toBe(2);
    expect(r.capas.capa2.resultado).toBe("indeterminado");
  });

  it("robocall de premio → naranja", () => {
    const r = analizarLlamada({ ...BASE, numero: "+5491122334455", probSintesis: 0.9, calidadMuestra: 0.7 }, ctx());
    expect(r.nivel).toBe(3);
    expect(r.titulo).toContain("robot");
  });

  it("telemarketing → gris con etiqueta; bloqueo silencioso si el guardián lo habilitó", () => {
    const entrada = { ...BASE, numero: "+5491140000123", probSintesis: 0.15, calidadMuestra: 0.75 };
    const r = analizarLlamada(entrada, ctx());
    expect(r.nivel).toBe(1);
    expect(r.etiquetaEntrante?.texto).toContain("Spam");
    expect(r.bloqueoSilencioso).toBe(false);

    const b = analizarLlamada(entrada, ctx({ config: { ...CONFIG_INICIAL, bloqueoSilencioso: true } }));
    expect(b.bloqueoSilencioso).toBe(true);
    expect(b.avisarGuardian).toBe(false);
  });

  it("falso banco → naranja con advertencia institucional", () => {
    const r = analizarLlamada({ ...BASE, numero: "+5491133221100", probSintesis: 0.4, calidadMuestra: 0.7 }, ctx());
    expect(r.nivel).toBe(3);
    expect(r.titulo).toContain("banco falso");
  });

  it("número de extorsión denunciado → rojo desde el repique", () => {
    const r = analizarLlamada(
      { ...BASE, numero: "+5491166778899", invocaParentesco: true, familiarInvocadoId: "voz_marcela", similitudBiometrica: 0.3, mejorCandidatoId: "voz_marcela", probSintesis: 0.5, calidadMuestra: 0.7, llamadaUrgente: true },
      ctx(),
    );
    expect(r.nivelPreAtencion).toBe(4);
    expect(r.nivel).toBe(4);
  });

  it("número oculto neutro → amarillo por heurística de formato", () => {
    const r = analizarLlamada({ ...BASE, numero: "", numeroOculto: true, probSintesis: 0.12, calidadMuestra: 0.8 }, ctx());
    expect(r.nivel).toBe(2);
    expect(r.capas.capa1.heuristicas).toContain("Cabecera vacía u oculta");
  });
});

describe("motor de decisión · reglas transversales", () => {
  it("un nivel previo adverso (línea reciente) se impone aunque la voz coincida", () => {
    const r = analizarLlamada(
      { ...BASE, numero: "+5491199887766", invocaParentesco: true, familiarInvocadoId: "voz_marcela", similitudBiometrica: 0.95, mejorCandidatoId: "voz_marcela", probSintesis: 0.05, calidadMuestra: 0.9 },
      ctx(),
    );
    expect(r.nivelPreAtencion).toBe(2);
    expect(r.nivel).toBeGreaterThanOrEqual(2);
  });

  it("la histéresis baja el rojo a amarillo para un número confirmado, salvo síntesis", () => {
    const entrada: EntradaLlamada = { ...BASE, numero: "+5491198765432", invocaParentesco: true, familiarInvocadoId: "voz_julian", similitudBiometrica: 0.36, mejorCandidatoId: "voz_julian", probSintesis: 0.22, calidadMuestra: 0.7 };
    const conf = ctx({ confirmaciones: [{ numero: "+5491198765432", fecha: new Date().toISOString() }] });
    expect(analizarLlamada(entrada, conf).nivel).toBe(2);
    expect(analizarLlamada({ ...entrada, probSintesis: 0.9 }, conf).nivel).toBe(4);
  });

  it("contextoSinHuellas elimina los embeddings y deja intacto el original", () => {
    const original = ctx();
    const limpio = contextoSinHuellas(original);
    expect(limpio.circulo.voces.every((v) => v.embedding.length === 0)).toBe(true);
    expect(original.circulo.voces.every((v) => v.embedding.length === 128)).toBe(true);
    expect(JSON.stringify(limpio)).not.toContain(String(original.circulo.voces[0].embedding[0]));
    // El motor da el mismo resultado con o sin huellas
    const e = { ...BASE, numero: MARCELA, similitudBiometrica: 0.91, mejorCandidatoId: "voz_marcela", probSintesis: 0.05, calidadMuestra: 0.88 };
    expect(analizarLlamada(e, limpio).nivel).toBe(analizarLlamada(e, original).nivel);
  });
});

describe("textos y aviso físico de la alerta", () => {
  const ALERTAS = CONFIG_INICIAL.alertas;
  const ROJO: EntradaLlamada = { ...BASE, numero: "", numeroOculto: true, invocaParentesco: true, familiarInvocadoId: "voz_marcela", similitudBiometrica: 0.3, mejorCandidatoId: "voz_marcela", probSintesis: 0.85, calidadMuestra: 0.8 };

  it("verde: título corto con el nombre y sin aviso físico", () => {
    const r = analizarLlamada({ ...BASE, numero: MARCELA, similitudBiometrica: 0.91, mejorCandidatoId: "voz_marcela", probSintesis: 0.05, calidadMuestra: 0.88 }, ctx());
    expect(r.titulo).toBe("Es Marcela");
    expect(r.acciones).toEqual([]);
    expect(r.aviso.vibracion).toEqual([]);
    expect(r.aviso.tono).toBe(false);
  });

  it("rojo: título de pocas palabras, una línea, dos botones, vibración larga repetida y tono", () => {
    const r = analizarLlamada(ROJO, ctx());
    expect(r.nivel).toBe(4);
    expect(r.titulo).toBe("Puede no ser Marcela");
    expect(r.titulo.split(" ").length).toBeLessThanOrEqual(6);
    expect(r.mensaje).toBe("No des dinero ni datos.");
    expect(r.acciones).toEqual(["Cortar", "Pedile la clave"]);
    expect(r.aviso).toEqual({ vibracion: [700, 200, 700], tono: true, linterna: false, repetirMs: 8000 });
    expect(r.avisarGuardian).toBe(true);
  });

  it("ningún nivel ofrece más de dos botones", () => {
    const casos: EntradaLlamada[] = [
      { ...BASE, numero: ROBERTO, similitudBiometrica: 0.6, mejorCandidatoId: "voz_roberto", probSintesis: 0.33, calidadMuestra: 0.2 },
      { ...BASE, numero: "+5491122334455", probSintesis: 0.9, calidadMuestra: 0.7 },
      { ...BASE, numero: "+5491133221100", probSintesis: 0.4, calidadMuestra: 0.7 },
      ROJO,
    ];
    for (const e of casos) expect(analizarLlamada(e, ctx()).acciones.length).toBeLessThanOrEqual(2);
  });

  it("aviso físico por nivel con la configuración por defecto", () => {
    const estado = { discreto: false, bloqueoSilencioso: false };
    expect(avisoFisico(0, estado, ALERTAS).vibracion).toEqual([]);
    expect(avisoFisico(1, estado, ALERTAS).vibracion).toEqual([]);
    expect(avisoFisico(2, estado, ALERTAS)).toEqual({ vibracion: [200], tono: false, linterna: false, repetirMs: null });
    expect(avisoFisico(3, estado, ALERTAS)).toEqual({ vibracion: [150, 100, 150], tono: false, linterna: false, repetirMs: null });
    expect(avisoFisico(4, estado, ALERTAS).linterna).toBe(false);
  });

  it("la linterna solo se enciende en rojo y si el guardián la activó", () => {
    const con = { ...ALERTAS, linterna: true };
    const estado = { discreto: false, bloqueoSilencioso: false };
    expect(avisoFisico(4, estado, con).linterna).toBe(true);
    expect(avisoFisico(3, estado, con).linterna).toBe(false);
    expect(avisoFisico(4, { ...estado, discreto: true }, con).linterna).toBe(false);
  });

  it("apagar vibración y tono deja el rojo solo con pantalla", () => {
    const r = analizarLlamada(ROJO, ctx({ config: { ...CONFIG_INICIAL, alertas: { vibracion: false, tono: false, linterna: false } } }));
    expect(r.nivel).toBe(4);
    expect(r.aviso).toEqual({ vibracion: [], tono: false, linterna: false, repetirMs: null });
    expect(r.haptica).toBe("Ninguna");
    expect(r.sonido).toBe("Tono desactivado");
  });
});
