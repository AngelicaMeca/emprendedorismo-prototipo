// Datos iniciales de demostración: Círculo de Protección Familiar, base
// precargada de números clasificados, palabras clave y eventos de ejemplo.

import type {
  Circulo,
  Configuracion,
  EntradaLlamada,
  Evento,
  NotificacionGuardian,
  NumeroClasificado,
  PalabraClave,
  PreguntaDesafio,
} from "./types";
import { PRESETS_SENSIBILIDAD } from "./niveles";
import { contarSilabas, haceDias, hashPalabra, uid, vectorAleatorio } from "./utils";
import { analizarLlamada, resumenResultado } from "./engine";

export const COLORES_VOZ = ["#0f766e", "#7c3aed", "#b45309", "#be185d", "#1d4ed8", "#15803d", "#c2410c", "#4338ca"];

export const CONFIG_INICIAL: Configuracion = {
  sensibilidad: "equilibrada",
  umbrales: { ...PRESETS_SENSIBILIDAD.equilibrada },
  bloqueoSilencioso: false,
  modoSusurro: true,
  refuerzoAdaptativo: true,
  operadoraHabilitada: false,
  histeresisDias: 30,
  avisoGuardian: { push: true, sms: true },
  rotacionMeses: 6,
};

export const CIRCULO_INICIAL: Circulo = {
  id: "circ_rodriguez",
  nombre: "Familia Rodríguez",
  creado: haceDias(45),
  protegido: {
    nombre: "Elsa Rodríguez",
    telefono: "+5493854112233",
    edad: 74,
    perfil: "Adulta mayor · atiende en altavoz",
  },
  guardian: {
    nombre: "Marcela Rodríguez",
    telefono: "+5493854556677",
    relacion: "hija",
  },
  voces: [
    {
      id: "voz_marcela",
      nombre: "Marcela Rodríguez",
      parentesco: "hija",
      telefono: "+5493854556677",
      embedding: vectorAleatorio(101),
      fechaEnrolamiento: haceDias(44),
      metodo: "presencial",
      consentimiento: true,
      muestrasRefuerzo: 6,
      color: COLORES_VOZ[0],
    },
    {
      id: "voz_julian",
      nombre: "Julián Pérez",
      parentesco: "nieto",
      telefono: "+5493854998811",
      embedding: vectorAleatorio(202),
      fechaEnrolamiento: haceDias(40),
      metodo: "remoto",
      consentimiento: true,
      muestrasRefuerzo: 2,
      color: COLORES_VOZ[1],
    },
    {
      id: "voz_roberto",
      nombre: "Roberto Rodríguez",
      parentesco: "hijo",
      telefono: "+5491155667788",
      embedding: vectorAleatorio(303),
      fechaEnrolamiento: haceDias(31),
      metodo: "remoto",
      consentimiento: true,
      muestrasRefuerzo: 0,
      color: COLORES_VOZ[2],
    },
  ],
};

export const PALABRA_IDENTIFICACION_INICIAL: PalabraClave = {
  hash: hashPalabra("cielo naranja"),
  pista: "El color del cielo cuando llegamos al campo",
  fechaAcuerdo: haceDias(44),
  silabas: contarSilabas("cielo naranja"),
};

export const PALABRA_COACCION_INICIAL: PalabraClave = {
  hash: hashPalabra("tía Norma"),
  pista: "Un pariente que nunca existió",
  fechaAcuerdo: haceDias(44),
  silabas: contarSilabas("tía Norma"),
};

export const PREGUNTAS_INICIALES: PreguntaDesafio[] = [
  { id: "preg_1", pregunta: "¿Cómo se llamaba el perro que teníamos en el campo?", pista: "Nombre de un animal de la infancia", familiarId: "voz_marcela" },
  { id: "preg_2", pregunta: "¿Qué comida te preparaba la abuela los domingos?", pista: "Receta familiar", familiarId: "voz_julian" },
  { id: "preg_3", pregunta: "¿En qué calle vivíamos cuando naciste?", pista: "Dirección antigua", familiarId: "voz_roberto" },
];

export const NUMEROS_INICIALES: NumeroClasificado[] = [
  { id: "num_1", numero: "+5491140000*", categoria: "spam_comercial", fuente: "base", reportes: 1842, fecha: haceDias(20), nota: "Rango de call centers de telemarketing" },
  { id: "num_2", numero: "+548001234567", categoria: "spam_comercial", fuente: "comunidad", reportes: 312, fecha: haceDias(12), nota: "Ofertas de planes de telefonía" },
  { id: "num_3", numero: "+5491122334455", categoria: "robocall", fuente: "comunidad", reportes: 905, fecha: haceDias(8), nota: "Mensaje pregrabado de “premio ganado”" },
  { id: "num_4", numero: "+5491133221100", categoria: "fraude_bancario", fuente: "oficial", reportes: 77, fecha: haceDias(5), nota: "Alerta de banco: suplantación de mesa de ayuda" },
  { id: "num_5", numero: "+5493855501*", categoria: "fraude_bancario", fuente: "oficial", reportes: 41, fecha: haceDias(3), nota: "UFECI: suplantación de organismo previsional" },
  { id: "num_6", numero: "+5491166778899", categoria: "extorsion", fuente: "oficial", reportes: 23, fecha: haceDias(2), nota: "Secuestro virtual denunciado · División Ciberdelitos" },
  { id: "num_7", numero: "+5493854776655", categoria: "extorsion", fuente: "comunidad", reportes: 9, fecha: haceDias(1), nota: "Reportado por 9 círculos familiares de Santiago del Estero" },
  { id: "num_8", numero: "+5493854900100", categoria: "institucional_verificado", fuente: "oficial", reportes: 0, fecha: haceDias(30), nota: "Obra social provincial · número oficial" },
  { id: "num_9", numero: "+548102229999", categoria: "institucional_verificado", fuente: "oficial", reportes: 0, fecha: haceDias(30), nota: "Banco · línea de atención verificada" },
  { id: "num_10", numero: "+5491199887766", categoria: "linea_reciente", fuente: "operadora", reportes: 0, fecha: haceDias(0, 5), nota: "Señal de red: activada hace 14 horas" },
  { id: "num_11", numero: "+5491144556677", categoria: "spam_comercial", fuente: "guardian", reportes: 1, fecha: haceDias(6), nota: "Marcado por el guardián" },
  { id: "num_12", numero: "+5493874001*", categoria: "robocall", fuente: "operadora", reportes: 0, fecha: haceDias(1), nota: "Fan-out de 600 llamadas/hora detectado en red" },
];

function contextoSemilla() {
  return {
    circulo: CIRCULO_INICIAL,
    numeros: NUMEROS_INICIALES,
    config: CONFIG_INICIAL,
    preguntas: PREGUNTAS_INICIALES,
    confirmaciones: [],
  };
}

function evento(fecha: string, entrada: EntradaLlamada, origen: Evento["origen"] = "llamada"): Evento {
  const resultado = analizarLlamada(entrada, contextoSemilla());
  return {
    id: uid("ev"),
    fecha,
    numero: entrada.numeroOculto ? "" : entrada.numero,
    nivel: resultado.nivel,
    discreto: resultado.discreto,
    resumen: resumenResultado(resultado),
    resultado,
    entrada,
    feedback: null,
    origen,
  };
}

export function eventosIniciales(): Evento[] {
  const base: EntradaLlamada = {
    numero: "",
    invocaParentesco: false,
    probSintesis: 0.1,
    calidadMuestra: 0.8,
    palabraIdentificacion: "ausente",
    palabraCoaccion: false,
    llamadaUrgente: false,
    canal: "celular",
  };
  return [
    evento(haceDias(0, 3), { ...base, numero: "+5493854556677", similitudBiometrica: 0.91, mejorCandidatoId: "voz_marcela", probSintesis: 0.06, calidadMuestra: 0.9 }),
    evento(haceDias(1, 2), { ...base, numero: "+5491122334455", probSintesis: 0.86, calidadMuestra: 0.75 }),
    evento(haceDias(2, 6), {
      ...base,
      numero: "+5491166778899",
      invocaParentesco: true,
      familiarInvocadoId: "voz_julian",
      similitudBiometrica: 0.41,
      mejorCandidatoId: "voz_julian",
      probSintesis: 0.82,
      calidadMuestra: 0.7,
      llamadaUrgente: true,
    }),
    evento(haceDias(4, 1), { ...base, numero: "+5493854998811", similitudBiometrica: 0.84, mejorCandidatoId: "voz_julian", probSintesis: 0.12, calidadMuestra: 0.62, palabraIdentificacion: "dicha" }),
    evento(haceDias(6, 4), { ...base, numero: "+5491144556677", probSintesis: 0.3, calidadMuestra: 0.5 }),
    evento(haceDias(9, 2), { ...base, numero: "+5491155667788", similitudBiometrica: 0.63, mejorCandidatoId: "voz_roberto", probSintesis: 0.18, calidadMuestra: 0.28 }),
    evento(haceDias(13, 7), { ...base, numero: "+5491133221100", probSintesis: 0.55, calidadMuestra: 0.66 }),
    evento(haceDias(17, 3), { ...base, numero: "+5493811223344", probSintesis: 0.08, calidadMuestra: 0.81 }),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export function notificacionesIniciales(eventos: Evento[]): NotificacionGuardian[] {
  return eventos
    .filter((e) => e.resultado.avisarGuardian)
    .map((e) => ({
      id: uid("ntf"),
      fecha: e.fecha,
      numero: e.numero,
      nivel: e.nivel,
      discreto: e.discreto,
      mensaje: e.discreto
        ? "Palabra de coacción detectada en una llamada. Comunicate con tu familiar por otro canal."
        : `Alerta roja en el teléfono de Elsa: ${e.resumen}`,
      leida: false,
    }));
}

export const TEXTO_ENROLAMIENTO =
  "Hola, soy yo. Te llamo para avisarte que llegué bien a casa. Mañana paso a verte después del trabajo, llevo las facturas para la merienda. Acordate de tomar la pastilla de la presión y de cerrar bien la puerta del patio. Si alguien te llama pidiendo plata con urgencia, cortá y llamame al número de siempre. Un beso grande, nos vemos mañana.";
