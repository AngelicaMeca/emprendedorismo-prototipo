// Motor de decisión de VozReal (apartado 5.9): cascada con activación
// condicional y escalada asimétrica. Cualquier capa puede elevar el nivel,
// ninguna puede reducirlo a verde por sí sola.

import type {
  AlertasFisicas,
  AvisoFisico,
  CategoriaNumero,
  Circulo,
  Configuracion,
  ConfirmacionAutentica,
  EntradaLlamada,
  FasePipeline,
  Nivel,
  NumeroClasificado,
  PreguntaDesafio,
  Resultado,
  ResultadoCapa2,
  ResultadoCapa3,
  VozEnrolada,
} from "./types";
import { CATEGORIAS, PARENTESCOS } from "./niveles";
import { normalizarNumero, rng } from "./utils";

export interface ContextoMotor {
  circulo: Circulo;
  numeros: NumeroClasificado[];
  config: Configuracion;
  preguntas: PreguntaDesafio[];
  confirmaciones: ConfirmacionAutentica[];
}

// Copia del contexto sin plantillas biométricas, para enviar al endpoint
// stateless: el motor no usa los embeddings (recibe la similitud ya calculada)
// y el principio del producto es que las huellas nunca salen del dispositivo.
export function contextoSinHuellas(ctx: ContextoMotor): ContextoMotor {
  return { ...ctx, circulo: { ...ctx.circulo, voces: ctx.circulo.voces.map((v) => ({ ...v, embedding: [] })) } };
}

const PRIORIDAD: Record<CategoriaNumero, number> = {
  extorsion: 6,
  fraude_bancario: 5,
  robocall: 4,
  spam_comercial: 3,
  linea_reciente: 2,
  institucional_verificado: 1,
};

export function coincideNumero(patron: string, numero: string): boolean {
  const p = normalizarNumero(patron);
  const n = normalizarNumero(numero);
  if (p.endsWith("*")) return n.startsWith(p.slice(0, -1));
  return p === n;
}

export function clasificarNumero(numero: string, base: NumeroClasificado[]): NumeroClasificado | null {
  if (!numero) return null;
  const coincidencias = base.filter((x) => coincideNumero(x.numero, numero));
  if (!coincidencias.length) return null;
  coincidencias.sort((a, b) => {
    const ea = a.numero.endsWith("*") ? 0 : 1;
    const eb = b.numero.endsWith("*") ? 0 : 1;
    if (ea !== eb) return eb - ea;
    return PRIORIDAD[b.categoria] - PRIORIDAD[a.categoria];
  });
  return coincidencias[0];
}

export function heuristicasFormato(numero: string, oculto?: boolean): string[] {
  const h: string[] = [];
  if (oculto || !numero) {
    h.push("Cabecera vacía u oculta");
    return h;
  }
  const n = normalizarNumero(numero);
  const digitos = n.replace(/\D/g, "");
  if (!n.startsWith("+54")) h.push("Prefijo internacional inusual para el perfil del usuario");
  if (digitos.length < 10 || digitos.length > 13) h.push("Longitud anómala de numeración");
  return h;
}

export function familiarPorNumero(numero: string, voces: VozEnrolada[]): VozEnrolada | null {
  if (!numero) return null;
  const n = normalizarNumero(numero);
  return voces.find((v) => normalizarNumero(v.telefono) === n) ?? null;
}

function etiquetaFamiliar(v: VozEnrolada | null | undefined): string {
  if (!v) return "tu familiar";
  const p = PARENTESCOS[v.parentesco] ?? PARENTESCOS.otro;
  return `${p.etiqueta} ${v.nombre.split(" ")[0]}`;
}

function latencias(seed: number) {
  const r = rng(seed);
  const entre = (a: number, b: number) => Math.round(a + r() * (b - a));
  return {
    vad: entre(100, 150),
    capa1: entre(8, 20),
    capa2: entre(400, 650),
    capa3: entre(250, 400),
    overlay: entre(20, 50),
  };
}

export function analizarLlamada(entrada: EntradaLlamada, ctx: ContextoMotor): Resultado {
  const { circulo, numeros, config, preguntas, confirmaciones } = ctx;
  const u = config.umbrales;
  const razones: string[] = [];
  const numero = entrada.numeroOculto ? "" : normalizarNumero(entrada.numero);

  // ---------- Etapa 1: evaluación previa a la atención (Capas 0 y 1) ----------
  const clasif = clasificarNumero(numero, numeros);
  const familiarNum = familiarPorNumero(numero, circulo.voces);
  const heur = entrada.canal === "whatsapp" && !numero ? [] : heuristicasFormato(numero, entrada.numeroOculto);
  let categoria: CategoriaNumero | null = clasif?.categoria ?? null;

  const indicios0: string[] = [];
  const c0 = config.operadoraHabilitada ? entrada.capa0 ?? {} : {};
  const capa0Aplicada = config.operadoraHabilitada;
  let forzarCapas23 = false;
  let verdePorNumeroInhabilitado = false;
  let senalFuerteCapa0 = false;

  if (capa0Aplicada) {
    if (c0.antiguedadLineaHoras != null && c0.antiguedadLineaHoras < 72) {
      indicios0.push(`Línea originante activada hace ${c0.antiguedadLineaHoras} h (SIM prepaga descartable)`);
      forzarCapas23 = true;
      if (!categoria || PRIORIDAD[categoria] < PRIORIDAD.linea_reciente) categoria = "linea_reciente";
    }
    if (c0.cambioSimReciente && familiarNum) {
      indicios0.push(`Cambio reciente de IMSI/SIM en la línea de ${familiarNum.nombre} (posible SIM swap)`);
      verdePorNumeroInhabilitado = true;
    }
    if (c0.origenInternacionalOVoip) {
      indicios0.push("Cabecera nacional con enrutamiento internacional o VoIP mayorista (Caller ID falsificado)");
      senalFuerteCapa0 = true;
    }
    if ((c0.llamadasUltimaHora ?? 0) >= 50) {
      indicios0.push(`Fan-out de ${c0.llamadasUltimaHora} llamadas en la última hora (robocalling)`);
      if (!categoria || PRIORIDAD[categoria] < PRIORIDAD.robocall) categoria = "robocall";
    }
    if (c0.denunciadaEnRed) {
      indicios0.push("Línea denunciada en tiempo real en la red de la operadora");
      if (!categoria || PRIORIDAD[categoria] < PRIORIDAD.fraude_bancario) categoria = "fraude_bancario";
    }
    if (c0.rangoAsociadoFraude) {
      indicios0.push("Rango de numeración asociado a fraude (ajuste de umbrales por contexto)");
      senalFuerteCapa0 = true;
    }
  }

  let nivelPre: Nivel = 1;
  let bloqueoSilencioso = false;
  let etiquetaEntrante: Resultado["etiquetaEntrante"] = null;

  if (familiarNum && !verdePorNumeroInhabilitado) {
    etiquetaEntrante = { texto: `${familiarNum.nombre} · familiar enrolado`, tono: "verde" };
  }
  if (categoria) {
    const cat = CATEGORIAS[categoria];
    etiquetaEntrante = { texto: cat.nombre, tono: cat.tono };
    if (cat.nivel != null) nivelPre = cat.nivel;
    razones.push(`Capa 1: número clasificado como “${cat.nombre}” (fuente: ${clasif?.fuente ?? "operadora"}).`);
    if (categoria === "spam_comercial" && config.bloqueoSilencioso) {
      bloqueoSilencioso = true;
      razones.push("Bloqueo silencioso habilitado por el guardián: la llamada no repica.");
    }
    if (categoria === "extorsion") razones.push("Nivel rojo desde el repique, antes de atender.");
  } else if (numero) {
    razones.push("Capa 1: número sin reputación en la base local (consulta B-Tree < 20 ms).");
  }
  if (heur.length) {
    razones.push(`Heurísticas de formato: ${heur.join("; ")}.`);
    if (nivelPre < 2) nivelPre = 2;
  }
  if (indicios0.length) razones.push(`Capa 0: ${indicios0.join("; ")}.`);
  else if (capa0Aplicada) razones.push("Capa 0: señales de red sin indicios adversos.");
  if (senalFuerteCapa0 && nivelPre < 2) nivelPre = 2;
  if (verdePorNumeroInhabilitado) razones.push("Capa 0: verificación en verde por número inhabilitada; se exige verificación de voz.");

  // ---------- Etapas 2 y 3: VAD + anti-spoofing (siempre) ----------
  const calidad = entrada.calidadMuestra;
  const prob = entrada.probSintesis;
  let capa2: ResultadoCapa2;
  if (calidad < u.calidadMinima) {
    capa2 = "indeterminado";
    razones.push(`Capa 2: calidad de muestra insuficiente (${Math.round(calidad * 100)}% < ${Math.round(u.calidadMinima * 100)}%). Techo de severidad acústica en amarillo.`);
  } else if (prob >= u.sintesisAlta) {
    capa2 = "sintetica";
    razones.push(`Capa 2: habla sintética detectada (p = ${prob.toFixed(2)} ≥ ${u.sintesisAlta}). Artefactos de fase y ausencia de micro-respiraciones.`);
  } else if (prob <= u.sintesisBaja) {
    capa2 = "natural";
    razones.push(`Capa 2: habla natural (p = ${prob.toFixed(2)} ≤ ${u.sintesisBaja}).`);
  } else {
    capa2 = "indeterminado";
    razones.push(`Capa 2: resultado indeterminado (p = ${prob.toFixed(2)} entre ${u.sintesisBaja} y ${u.sintesisAlta}).`);
  }

  // ---------- Etapa 4: biometría (condicional) ----------
  const invocado = entrada.familiarInvocadoId
    ? circulo.voces.find((v) => v.id === entrada.familiarInvocadoId) ?? null
    : null;
  const candidatoPorNumero = verdePorNumeroInhabilitado ? null : familiarNum;
  const requiereBiometria = !!familiarNum || entrada.invocaParentesco || forzarCapas23;
  let modo: Resultado["capas"]["capa3"]["modo"] = "ninguno";
  let capa3: ResultadoCapa3 = "no_aplica";
  let candidato: VozEnrolada | null = null;
  const sim = entrada.similitudBiometrica ?? null;

  if (requiereBiometria && circulo.voces.length > 0) {
    modo = familiarNum ? "1:1" : "1:N";
    candidato =
      (entrada.mejorCandidatoId ? circulo.voces.find((v) => v.id === entrada.mejorCandidatoId) ?? null : null) ??
      candidatoPorNumero ??
      invocado ??
      null;
    if (sim == null) {
      capa3 = "ambiguo";
      razones.push("Capa 3: sin embedding comparable (muestra insuficiente).");
    } else if (sim >= u.similitudAlta) {
      capa3 = "coincide";
      razones.push(`Capa 3 (${modo}): similitud coseno ${sim.toFixed(2)} ≥ ${u.similitudAlta} con ${candidato?.nombre ?? "familiar"}.`);
    } else if (sim < u.similitudBaja) {
      capa3 = "no_coincide";
      razones.push(`Capa 3 (${modo}): similitud ${sim.toFixed(2)} < ${u.similitudBaja}. La voz no coincide con ${candidato?.nombre ?? "ningún familiar enrolado"}.`);
    } else {
      capa3 = "ambiguo";
      razones.push(`Capa 3 (${modo}): similitud ${sim.toFixed(2)} en zona ambigua (${u.similitudBaja}–${u.similitudAlta}).`);
    }
  } else if (requiereBiometria && circulo.voces.length === 0) {
    razones.push("Capa 3: no hay voces enroladas; no es posible verificar al familiar.");
    capa3 = "ambiguo";
  } else {
    razones.push("Capa 3: no se ejecuta (sin candidato familiar ni mención de parentesco).");
  }

  // ---------- Etapa 6: fusión (matriz Capa 2 × Capa 3) ----------
  const identidadInvocada = !!familiarNum || entrada.invocaParentesco;
  let nivelAcustico: Nivel = 1;
  // El spam comercial es higiene (nivel 1 con etiqueta), no una señal adversa que condicione la fusión.
  const senalesAdversas = senalFuerteCapa0 || (categoria != null && categoria !== "institucional_verificado" && categoria !== "spam_comercial");

  if (capa2 === "natural") {
    if (capa3 === "coincide") nivelAcustico = 0;
    else if (capa3 === "no_coincide") nivelAcustico = 4;
    else if (capa3 === "ambiguo") nivelAcustico = 2;
    else nivelAcustico = senalesAdversas ? 2 : 1;
  } else if (capa2 === "sintetica") {
    if (capa3 === "coincide") {
      nivelAcustico = 4;
      razones.push("Fusión: prevalece el indicio de síntesis aunque el timbre coincida (clonación de alta fidelidad).");
    } else if (capa3 === "no_coincide" || capa3 === "ambiguo") nivelAcustico = 4;
    else nivelAcustico = identidadInvocada ? 4 : 3;
  } else {
    if (capa3 === "coincide") nivelAcustico = 2;
    else if (capa3 === "no_coincide") nivelAcustico = senalesAdversas ? 4 : 2;
    else nivelAcustico = 2;
  }
  if (calidad < u.calidadMinima && nivelAcustico > 2) {
    nivelAcustico = 2;
    razones.push("Techo de severidad por calidad de señal: el nivel acústico máximo queda limitado a amarillo.");
  }

  const hist = numero ? confirmaciones.find((c) => c.numero === numero) : undefined;
  if (hist) {
    const dias = (Date.now() - new Date(hist.fecha).getTime()) / 86400000;
    if (dias <= config.histeresisDias && nivelAcustico === 4 && capa2 !== "sintetica") {
      nivelAcustico = 2;
      razones.push(`Histéresis: el número fue confirmado como auténtico hace ${Math.max(0, Math.round(dias))} días; no se reitera el nivel rojo.`);
    }
  }

  // ---------- Etapa 5: factor de conocimiento ----------
  // El gris previo al descuelgue (1) significa "sin datos": no debe impedir el verde acústico.
  // Solo un nivel previo adverso (>= 2) se impone sobre el resultado de las Capas 2 y 3.
  let nivel: Nivel = nivelPre >= 2 ? (Math.max(nivelPre, nivelAcustico) as Nivel) : nivelAcustico;
  let discreto = false;
  let reforzado = false;
  let efecto = "La palabra clave no modificó el nivel.";
  let mostrarBotonPalabra = false;

  if (entrada.palabraCoaccion) {
    nivel = 4;
    discreto = true;
    efecto = "Palabra de coacción detectada: nivel 4 en modo discreto, aviso silencioso al guardián.";
    razones.push("Factor de conocimiento: palabra de coacción detectada. Aviso silencioso, sin cartel visible.");
  } else if (entrada.palabraIdentificacion === "dicha") {
    if (capa2 === "sintetica") {
      nivel = 4;
      efecto = "La palabra fue dicha pero la voz no es humana: prevalece el indicio físico.";
      razones.push("Factor de conocimiento: palabra correcta pero habla sintética. Prevalece la Capa 2.");
    } else if (capa3 === "coincide" && capa2 === "natural" && nivel === 0) {
      reforzado = true;
      efecto = "Nivel 0 reforzado: verificado por voz y palabra clave.";
      razones.push("Factor de conocimiento: palabra de identificación correcta con voz coincidente → verde reforzado.");
    } else if (!familiarNum) {
      nivel = Math.max(nivel, 2) as Nivel;
      efecto = "Palabra dicha desde un número no enrolado: pudo haberse filtrado; se exige verificación biométrica o desafío.";
      razones.push("Factor de conocimiento: palabra correcta desde número desconocido. Nivel mínimo amarillo.");
    } else {
      efecto = "Palabra correcta, pero la biometría no alcanzó el verde: no reduce el nivel.";
    }
  } else if (entrada.palabraIdentificacion === "incorrecta_tras_pedido") {
    nivel = 4;
    efecto = "Palabra incorrecta tras solicitud explícita: escala a rojo con pregunta de desafío.";
    razones.push("Factor de conocimiento: palabra incorrecta tras pedido del usuario → nivel 4.");
  } else if (entrada.llamadaUrgente && identidadInvocada) {
    mostrarBotonPalabra = true;
    efecto = "Ausencia de palabra en llamada urgente: no modifica el nivel; se ofrece “Pedile la palabra clave”.";
  }

  // ---------- Pipeline y latencias (7.1) ----------
  const l = latencias(numero.length * 31 + Math.round(prob * 1000) + Math.round(calidad * 100));
  const conAudio = !bloqueoSilencioso;
  const pipeline: FasePipeline[] = [
    { fase: "Capa 0 · señales de red", tecnologia: "Metadatos de señalización (operadora)", ms: 0, ejecutada: capa0Aplicada },
    { fase: "Capa 1 · reputación", tecnologia: "SQLite B-Tree local cifrado", ms: l.capa1, ejecutada: true },
    { fase: "Ingesta y VAD", tecnologia: "Silero VAD (TFLite INT8)", ms: conAudio ? l.vad : 0, ejecutada: conAudio },
    { fase: "Capa 2 · anti-spoofing", tecnologia: "AASIST-Lite INT8 (ONNX Mobile)", ms: conAudio ? l.capa2 : 0, ejecutada: conAudio },
    { fase: "Capa 3 · biometría", tecnologia: "Tiny-ECAPA-TDNN · coseno 128-d", ms: modo !== "ninguno" && conAudio ? l.capa3 : 0, ejecutada: modo !== "ninguno" && conAudio },
    { fase: "Keyword spotting", tecnologia: "Vocabulario cerrado 1 MB INT8 (paralelo)", ms: conAudio ? 80 : 0, ejecutada: conAudio },
    { fase: "Notificación accesible", tecnologia: "WindowManager Overlay", ms: l.overlay, ejecutada: conAudio && nivel !== 1 },
  ];
  const latenciaTotalMs = pipeline
    .filter((p) => p.ejecutada && p.fase !== "Keyword spotting")
    .reduce((s, p) => s + p.ms, 0);

  // ---------- Mensajes del semáforo (5.8) ----------
  // Regla de redacción para la persona protegida: una idea por alerta, título de
  // 3 a 6 palabras, una línea de consejo como máximo y no más de dos botones.
  const fam = candidato ?? invocado ?? familiarNum;
  const nombreFam = fam?.nombre.split(" ")[0] ?? "tu familiar";
  const etiquetaFam = etiquetaFamiliar(fam);
  const pregunta = preguntas.find((p) => p.familiarId === fam?.id) ?? preguntas[0];
  let titulo = "";
  let mensaje = "";
  let acciones: string[] = [];

  if (bloqueoSilencioso) {
    titulo = "Bloqueo silencioso";
    mensaje = "Llamada de spam comercial bloqueada sin repique.";
    acciones = ["Ver en registro", "Desbloquear número"];
  } else if (discreto) {
    titulo = "Sin cartel visible";
    mensaje = "Aviso silencioso enviado al guardián. La pantalla no cambia para no delatar al usuario.";
    acciones = ["Aviso enviado al guardián (modo discreto)"];
  } else {
    switch (nivel) {
      case 0:
        titulo = `Es ${nombreFam}`;
        mensaje = reforzado ? "Voz y palabra clave correctas." : `La voz coincide con ${etiquetaFam}.`;
        break;
      case 1:
        titulo = "Sin superposición";
        mensaje = "Número desconocido sin señales adversas. Silencio de interfaz deliberado.";
        break;
      case 2:
        titulo = "No sabemos quién habla";
        mensaje = "Poné el altavoz.";
        acciones = ["Poner altavoz", "Pedile la clave"];
        break;
      case 3:
        titulo = categoria === "fraude_bancario" ? "Puede ser un banco falso" : "Es un robot, no una persona";
        mensaje = categoria === "fraude_bancario" ? "El banco nunca pide claves." : "Podés cortar.";
        acciones = ["Cortar", "Bloquear"];
        break;
      case 4:
        if (entrada.palabraIdentificacion === "dicha" && capa2 === "sintetica") {
          titulo = "Dijo la clave, pero la voz es falsa";
        } else if (categoria === "extorsion" && capa2 !== "sintetica" && !identidadInvocada) {
          titulo = "Número denunciado por estafa";
        } else if (entrada.palabraIdentificacion === "incorrecta_tras_pedido") {
          titulo = "La clave no es correcta";
        } else {
          titulo = fam ? `Puede no ser ${nombreFam}` : "Puede no ser tu familiar";
        }
        mensaje = "No des dinero ni datos.";
        acciones = ["Cortar", "Pedile la clave"];
        break;
    }
  }

  // ---------- Aviso físico (vibración, tono, linterna) ----------
  const aviso = avisoFisico(nivel, { discreto, bloqueoSilencioso }, config.alertas);
  const haptica = describirVibracion(aviso, discreto);
  const sonido = !aviso.tono ? (nivel === 4 && !discreto && !config.alertas.tono ? "Tono desactivado" : "Ninguno") : config.modoSusurro ? "Dos tonos graves por auricular + susurro" : "Dos tonos graves por auricular";

  const avisarGuardian = nivel === 4 && !bloqueoSilencioso;

  return {
    nivel,
    nivelPreAtencion: nivelPre,
    discreto,
    reforzado,
    bloqueoSilencioso,
    titulo,
    mensaje,
    acciones,
    haptica,
    sonido,
    aviso,
    avisarGuardian,
    modoResguardo: avisarGuardian,
    susurro: nivel === 4 && config.modoSusurro && !discreto,
    razones,
    etiquetaEntrante,
    capas: {
      capa0: { aplicada: capa0Aplicada, indicios: indicios0 },
      capa1: {
        categoria,
        fuente: clasif?.fuente ?? (categoria ? "operadora" : null),
        familiarPorNumero: familiarNum?.nombre ?? null,
        heuristicas: heur,
      },
      capa2: { resultado: capa2, probSintesis: prob, calidad },
      capa3: { resultado: capa3, similitud: sim, candidato: candidato?.nombre ?? null, modo },
      conocimiento: { identificacion: entrada.palabraIdentificacion, coaccion: entrada.palabraCoaccion, efecto },
    },
    pipeline,
    latenciaTotalMs,
    preguntaDesafio: nivel >= 2 && !discreto && !bloqueoSilencioso ? pregunta?.pregunta : undefined,
    mostrarBotonPalabra,
  };
}

// Patrones de vibración en ms (vibrar, pausa, vibrar…), según el apartado 5.8.
export const VIBRACION_POR_NIVEL: Record<Nivel, number[]> = {
  0: [],
  1: [],
  2: [200],
  3: [150, 100, 150],
  4: [700, 200, 700],
};

const SIN_AVISO: AvisoFisico = { vibracion: [], tono: false, linterna: false, repetirMs: null };

// Qué hace físicamente el teléfono en cada nivel, respetando la configuración del guardián.
export function avisoFisico(nivel: Nivel, estado: { discreto: boolean; bloqueoSilencioso: boolean }, alertas: AlertasFisicas): AvisoFisico {
  // Coacción o bloqueo silencioso: el teléfono no hace absolutamente nada.
  if (estado.discreto || estado.bloqueoSilencioso) return SIN_AVISO;
  return {
    vibracion: alertas.vibracion ? VIBRACION_POR_NIVEL[nivel] : [],
    tono: nivel === 4 && alertas.tono,
    linterna: nivel === 4 && alertas.linterna,
    repetirMs: nivel === 4 && alertas.vibracion ? 8000 : null,
  };
}

function describirVibracion(aviso: AvisoFisico, discreto: boolean): string {
  if (discreto) return "Ninguna (modo discreto)";
  const n = aviso.vibracion.filter((_, i) => i % 2 === 0).length;
  if (n === 0) return "Ninguna";
  const larga = aviso.vibracion[0] >= 500;
  const base = n === 1 ? (larga ? "Una vibración larga" : "Una vibración corta") : `${n === 2 ? "Dos" : n} vibraciones ${larga ? "largas" : "cortas"}`;
  return aviso.repetirMs ? `${base}, se repite a los ${aviso.repetirMs / 1000} s` : base;
}

export function resumenResultado(r: Resultado): string {
  if (r.bloqueoSilencioso) return "Spam comercial bloqueado silenciosamente";
  if (r.discreto) return "Palabra de coacción: aviso discreto al guardián";
  return r.titulo;
}
