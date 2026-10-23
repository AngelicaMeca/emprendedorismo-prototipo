"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CategoriaNumero,
  Circulo,
  Configuracion,
  ConfirmacionAutentica,
  Evento,
  FeedbackEvento,
  NotificacionGuardian,
  NumeroClasificado,
  PalabraClave,
  Persona,
  PreguntaDesafio,
  Resultado,
  EntradaLlamada,
  Sensibilidad,
  VozEnrolada,
} from "./types";
import {
  CIRCULO_INICIAL,
  COLORES_VOZ,
  CONFIG_INICIAL,
  NUMEROS_INICIALES,
  PALABRA_COACCION_INICIAL,
  PALABRA_IDENTIFICACION_INICIAL,
  PREGUNTAS_INICIALES,
  eventosIniciales,
  notificacionesIniciales,
} from "./seed";
import { PRESETS_SENSIBILIDAD } from "./niveles";
import { contarSilabas, hashPalabra, normalizarNumero, uid } from "./utils";
import { resumenResultado } from "./engine";
import type { ContextoMotor } from "./engine";

export const MAX_VOCES = 8;

export interface EstadoVozReal {
  hydrated: boolean;
  circulo: Circulo;
  numeros: NumeroClasificado[];
  palabraIdentificacion: PalabraClave | null;
  palabraCoaccion: PalabraClave | null;
  preguntas: PreguntaDesafio[];
  config: Configuracion;
  eventos: Evento[];
  notificaciones: NotificacionGuardian[];
  confirmaciones: ConfirmacionAutentica[];

  setHydrated: () => void;
  actualizarProtegido: (p: Partial<Persona>) => void;
  actualizarGuardian: (p: Partial<Persona>) => void;
  renombrarCirculo: (nombre: string) => void;
  agregarVoz: (v: Omit<VozEnrolada, "id" | "color" | "muestrasRefuerzo" | "fechaEnrolamiento">) => VozEnrolada | null;
  eliminarVoz: (id: string) => void;
  reforzarVoz: (id: string) => void;
  definirIdentificacion: (frase: string, pista: string) => void;
  definirCoaccion: (frase: string, pista: string) => void;
  eliminarPalabra: (tipo: "identificacion" | "coaccion") => void;
  verificarPalabra: (frase: string) => "identificacion" | "coaccion" | null;
  agregarPregunta: (p: Omit<PreguntaDesafio, "id">) => void;
  eliminarPregunta: (id: string) => void;
  agregarNumero: (n: Omit<NumeroClasificado, "id" | "fecha">) => void;
  reportarNumero: (numero: string, categoria: CategoriaNumero, nota?: string) => void;
  eliminarNumero: (id: string) => void;
  actualizarConfig: (c: Partial<Configuracion>) => void;
  setSensibilidad: (s: Sensibilidad) => void;
  registrarEvento: (args: { entrada: EntradaLlamada; resultado: Resultado; origen: Evento["origen"] }) => Evento;
  marcarFeedback: (id: string, feedback: FeedbackEvento) => void;
  marcarNotificacionesLeidas: () => void;
  limpiarEventos: () => void;
  eliminarTodasLasHuellas: () => void;
  restablecerDemo: () => void;
  contextoMotor: () => ContextoMotor;
}

function estadoInicial() {
  const eventos = eventosIniciales();
  return {
    circulo: CIRCULO_INICIAL,
    numeros: NUMEROS_INICIALES,
    palabraIdentificacion: PALABRA_IDENTIFICACION_INICIAL,
    palabraCoaccion: PALABRA_COACCION_INICIAL,
    preguntas: PREGUNTAS_INICIALES,
    config: CONFIG_INICIAL,
    eventos,
    notificaciones: notificacionesIniciales(eventos),
    confirmaciones: [] as ConfirmacionAutentica[],
  };
}

export const useVozReal = create<EstadoVozReal>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...estadoInicial(),

      setHydrated: () => set({ hydrated: true }),

      actualizarProtegido: (p) => set((s) => ({ circulo: { ...s.circulo, protegido: { ...s.circulo.protegido, ...p } } })),
      actualizarGuardian: (p) => set((s) => ({ circulo: { ...s.circulo, guardian: { ...s.circulo.guardian, ...p } } })),
      renombrarCirculo: (nombre) => set((s) => ({ circulo: { ...s.circulo, nombre } })),

      agregarVoz: (v) => {
        const s = get();
        if (s.circulo.voces.length >= MAX_VOCES) return null;
        const voz: VozEnrolada = {
          ...v,
          id: uid("voz"),
          telefono: normalizarNumero(v.telefono),
          color: COLORES_VOZ[s.circulo.voces.length % COLORES_VOZ.length],
          muestrasRefuerzo: 0,
          fechaEnrolamiento: new Date().toISOString(),
        };
        set({ circulo: { ...s.circulo, voces: [...s.circulo.voces, voz] } });
        return voz;
      },
      eliminarVoz: (id) =>
        set((s) => ({
          circulo: { ...s.circulo, voces: s.circulo.voces.filter((v) => v.id !== id) },
          preguntas: s.preguntas.map((p) => (p.familiarId === id ? { ...p, familiarId: undefined } : p)),
        })),
      reforzarVoz: (id) =>
        set((s) => ({
          circulo: {
            ...s.circulo,
            voces: s.circulo.voces.map((v) => (v.id === id ? { ...v, muestrasRefuerzo: v.muestrasRefuerzo + 1 } : v)),
          },
        })),

      definirIdentificacion: (frase, pista) =>
        set({
          palabraIdentificacion: { hash: hashPalabra(frase), pista, fechaAcuerdo: new Date().toISOString(), silabas: contarSilabas(frase) },
        }),
      definirCoaccion: (frase, pista) =>
        set({
          palabraCoaccion: { hash: hashPalabra(frase), pista, fechaAcuerdo: new Date().toISOString(), silabas: contarSilabas(frase) },
        }),
      eliminarPalabra: (tipo) => set(tipo === "identificacion" ? { palabraIdentificacion: null } : { palabraCoaccion: null }),
      verificarPalabra: (frase) => {
        const s = get();
        if (!frase.trim()) return null;
        const h = hashPalabra(frase);
        if (s.palabraCoaccion && h === s.palabraCoaccion.hash) return "coaccion";
        if (s.palabraIdentificacion && h === s.palabraIdentificacion.hash) return "identificacion";
        return null;
      },

      agregarPregunta: (p) => set((s) => ({ preguntas: [...s.preguntas, { ...p, id: uid("preg") }] })),
      eliminarPregunta: (id) => set((s) => ({ preguntas: s.preguntas.filter((p) => p.id !== id) })),

      agregarNumero: (n) =>
        set((s) => ({
          numeros: [{ ...n, numero: normalizarNumero(n.numero), id: uid("num"), fecha: new Date().toISOString() }, ...s.numeros],
        })),
      reportarNumero: (numero, categoria, nota) => {
        const s = get();
        const n = normalizarNumero(numero);
        const existente = s.numeros.find((x) => normalizarNumero(x.numero) === n);
        if (existente) {
          set({
            numeros: s.numeros.map((x) =>
              x.id === existente.id ? { ...x, reportes: x.reportes + 1, categoria, fecha: new Date().toISOString(), nota: nota ?? x.nota } : x,
            ),
          });
        } else {
          set({
            numeros: [{ id: uid("num"), numero: n, categoria, fuente: "guardian", reportes: 1, fecha: new Date().toISOString(), nota }, ...s.numeros],
          });
        }
      },
      eliminarNumero: (id) => set((s) => ({ numeros: s.numeros.filter((x) => x.id !== id) })),

      actualizarConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
      setSensibilidad: (sens) => set((s) => ({ config: { ...s.config, sensibilidad: sens, umbrales: { ...PRESETS_SENSIBILIDAD[sens] } } })),

      registrarEvento: ({ entrada, resultado, origen }) => {
        const s = get();
        const ev: Evento = {
          id: uid("ev"),
          fecha: new Date().toISOString(),
          numero: entrada.numeroOculto ? "" : normalizarNumero(entrada.numero),
          nivel: resultado.nivel,
          discreto: resultado.discreto,
          resumen: resumenResultado(resultado),
          resultado,
          entrada,
          feedback: null,
          origen,
        };
        const notis = [...s.notificaciones];
        if (resultado.avisarGuardian) {
          notis.unshift({
            id: uid("ntf"),
            fecha: ev.fecha,
            numero: ev.numero,
            nivel: ev.nivel,
            discreto: ev.discreto,
            mensaje: ev.discreto
              ? "Palabra de coacción detectada en una llamada. Comunicate con tu familiar por otro canal."
              : `Alerta roja en el teléfono de ${s.circulo.protegido.nombre.split(" ")[0]}: ${ev.resumen}`,
            leida: false,
          });
        }
        set({ eventos: [ev, ...s.eventos].slice(0, 200), notificaciones: notis.slice(0, 100) });
        return ev;
      },
      marcarFeedback: (id, feedback) => {
        const s = get();
        const ev = s.eventos.find((e) => e.id === id);
        if (!ev) return;
        const confirmaciones = [...s.confirmaciones];
        let voces = s.circulo.voces;
        if (feedback === "era_familiar" && ev.numero) {
          confirmaciones.unshift({ numero: ev.numero, fecha: new Date().toISOString() });
          if (s.config.refuerzoAdaptativo) {
            const cand = s.circulo.voces.find((v) => v.nombre === ev.resultado.capas.capa3.candidato);
            if (cand) voces = voces.map((v) => (v.id === cand.id ? { ...v, muestrasRefuerzo: v.muestrasRefuerzo + 1 } : v));
          }
        }
        set({
          eventos: s.eventos.map((e) => (e.id === id ? { ...e, feedback } : e)),
          confirmaciones,
          circulo: { ...s.circulo, voces },
        });
      },
      marcarNotificacionesLeidas: () => set((s) => ({ notificaciones: s.notificaciones.map((n) => ({ ...n, leida: true })) })),
      limpiarEventos: () => set({ eventos: [], notificaciones: [] }),
      eliminarTodasLasHuellas: () =>
        set((s) => ({ circulo: { ...s.circulo, voces: [] }, palabraIdentificacion: null, palabraCoaccion: null })),
      restablecerDemo: () => set({ ...estadoInicial() }),
      contextoMotor: () => {
        const s = get();
        return { circulo: s.circulo, numeros: s.numeros, config: s.config, preguntas: s.preguntas, confirmaciones: s.confirmaciones };
      },
    }),
    {
      name: "vozreal-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        circulo: s.circulo,
        numeros: s.numeros,
        palabraIdentificacion: s.palabraIdentificacion,
        palabraCoaccion: s.palabraCoaccion,
        preguntas: s.preguntas,
        config: s.config,
        eventos: s.eventos,
        notificaciones: s.notificaciones,
        confirmaciones: s.confirmaciones,
      }),
      // Configuraciones guardadas antes de que existiera un campo toman el valor por defecto.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<typeof current>;
        return { ...current, ...p, config: { ...CONFIG_INICIAL, ...(p.config ?? {}), alertas: { ...CONFIG_INICIAL.alertas, ...(p.config?.alertas ?? {}) } } };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
