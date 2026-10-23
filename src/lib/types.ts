// Tipos de dominio de VozReal (prototipo web)

export type Nivel = 0 | 1 | 2 | 3 | 4;

export type CategoriaNumero =
  | "spam_comercial"
  | "robocall"
  | "fraude_bancario"
  | "linea_reciente"
  | "extorsion"
  | "institucional_verificado";

export type FuenteNumero = "base" | "comunidad" | "oficial" | "operadora" | "guardian";

export interface NumeroClasificado {
  id: string;
  numero: string; // número completo o prefijo (termina en *)
  categoria: CategoriaNumero;
  fuente: FuenteNumero;
  reportes: number;
  fecha: string; // ISO
  nota?: string;
}

export type Parentesco =
  | "hija"
  | "hijo"
  | "nieta"
  | "nieto"
  | "esposa"
  | "esposo"
  | "hermana"
  | "hermano"
  | "nuera"
  | "yerno"
  | "sobrina"
  | "sobrino"
  | "otro";

export interface VozEnrolada {
  id: string;
  nombre: string;
  parentesco: Parentesco;
  telefono: string;
  embedding: number[]; // 128 dimensiones, generado localmente
  fechaEnrolamiento: string;
  metodo: "presencial" | "remoto" | "simulado";
  consentimiento: boolean;
  muestrasRefuerzo: number;
  color: string;
}

export interface PalabraClave {
  hash: string; // FNV-1a 64 de la frase normalizada
  pista: string;
  fechaAcuerdo: string;
  silabas: number;
}

export interface PreguntaDesafio {
  id: string;
  pregunta: string;
  pista: string;
  familiarId?: string;
}

export interface Persona {
  nombre: string;
  telefono: string;
  relacion?: string;
  edad?: number;
  perfil?: string;
}

export interface Circulo {
  id: string;
  nombre: string;
  protegido: Persona;
  guardian: Persona;
  voces: VozEnrolada[];
  creado: string;
}

export type Sensibilidad = "conservadora" | "equilibrada" | "estricta";

export interface Umbrales {
  similitudAlta: number; // >= verde
  similitudBaja: number; // < rojo
  sintesisBaja: number; // <= habla natural
  sintesisAlta: number; // >= habla sintética
  calidadMinima: number; // techo amarillo por SNR
}

// Canales físicos con los que el teléfono avisa a la persona protegida.
// El teléfono está en la oreja durante la llamada: la vibración es el canal
// principal; el tono suena solo por el auricular; la linterna es opcional
// (hipoacusia) porque el flash apunta hacia afuera y solo sirve con altavoz.
export interface AlertasFisicas {
  vibracion: boolean;
  tono: boolean;
  linterna: boolean;
}

export interface Configuracion {
  sensibilidad: Sensibilidad;
  alertas: AlertasFisicas;
  umbrales: Umbrales;
  bloqueoSilencioso: boolean;
  modoSusurro: boolean;
  refuerzoAdaptativo: boolean;
  operadoraHabilitada: boolean; // Capa 0
  histeresisDias: number;
  avisoGuardian: { push: boolean; sms: boolean };
  rotacionMeses: number;
}

export interface SenalesCapa0 {
  antiguedadLineaHoras?: number | null; // < 72 => línea reciente
  cambioSimReciente?: boolean;
  origenInternacionalOVoip?: boolean;
  llamadasUltimaHora?: number; // fan-out
  denunciadaEnRed?: boolean;
  rangoAsociadoFraude?: boolean;
}

export type EstadoPalabra = "ausente" | "dicha" | "incorrecta_tras_pedido";

export interface EntradaLlamada {
  numero: string;
  numeroOculto?: boolean;
  invocaParentesco: boolean;
  familiarInvocadoId?: string | null;
  capa0?: SenalesCapa0;
  probSintesis: number; // 0..1
  calidadMuestra: number; // 0..1
  similitudBiometrica?: number | null;
  mejorCandidatoId?: string | null;
  palabraIdentificacion: EstadoPalabra;
  palabraCoaccion: boolean;
  llamadaUrgente: boolean;
  canal?: "celular" | "fija" | "whatsapp";
}

export type ResultadoCapa2 = "natural" | "sintetica" | "indeterminado";
export type ResultadoCapa3 = "coincide" | "no_coincide" | "ambiguo" | "no_aplica";

export interface FasePipeline {
  fase: string;
  tecnologia: string;
  ms: number;
  ejecutada: boolean;
}

// Qué hace físicamente el teléfono al mostrar la alerta (ya filtrado por la configuración).
export interface AvisoFisico {
  vibracion: number[]; // patrón en ms (vibrar, pausa, vibrar…); vacío = no vibra
  tono: boolean; // dos tonos graves por el auricular, inaudibles para quien llama
  linterna: boolean; // tres destellos del flash
  repetirMs: number | null; // vuelve a vibrar si la llamada sigue en rojo
}

export interface Resultado {
  nivel: Nivel;
  nivelPreAtencion: Nivel;
  discreto: boolean;
  reforzado: boolean;
  bloqueoSilencioso: boolean;
  titulo: string;
  mensaje: string;
  acciones: string[];
  haptica: string;
  sonido: string;
  aviso: AvisoFisico;
  avisarGuardian: boolean;
  modoResguardo: boolean;
  susurro: boolean;
  razones: string[];
  etiquetaEntrante: { texto: string; tono: "verde" | "gris" | "amarillo" | "naranja" | "rojo" } | null;
  capas: {
    capa0: { aplicada: boolean; indicios: string[] };
    capa1: { categoria: CategoriaNumero | null; fuente: FuenteNumero | null; familiarPorNumero: string | null; heuristicas: string[] };
    capa2: { resultado: ResultadoCapa2; probSintesis: number; calidad: number };
    capa3: { resultado: ResultadoCapa3; similitud: number | null; candidato: string | null; modo: "1:1" | "1:N" | "ninguno" };
    conocimiento: { identificacion: EstadoPalabra; coaccion: boolean; efecto: string };
  };
  pipeline: FasePipeline[];
  latenciaTotalMs: number;
  preguntaDesafio?: string;
  mostrarBotonPalabra: boolean;
}

export type FeedbackEvento = "era_familiar" | "confirmado_fraude" | null;

export interface Evento {
  id: string;
  fecha: string;
  numero: string;
  nivel: Nivel;
  discreto: boolean;
  resumen: string;
  resultado: Resultado;
  entrada: EntradaLlamada;
  feedback: FeedbackEvento;
  origen: "llamada" | "audio_diferido" | "simulacion";
}

export interface NotificacionGuardian {
  id: string;
  fecha: string;
  numero: string;
  nivel: Nivel;
  discreto: boolean;
  mensaje: string;
  leida: boolean;
}

export interface ConfirmacionAutentica {
  numero: string;
  fecha: string;
}
