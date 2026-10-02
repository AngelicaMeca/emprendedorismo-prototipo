import type { CategoriaNumero, Nivel, Sensibilidad, Umbrales } from "./types";

export const NIVELES: Record<
  Nivel | 5,
  { nombre: string; corto: string; color: string; descripcion: string; disparador: string; manifestacion: string; accion: string }
> = {
  0: {
    nombre: "Verde · Voz verificada",
    corto: "Verde",
    color: "verde",
    descripcion: "La voz coincide con un familiar enrolado y no hay artefactos de síntesis.",
    disparador: "Similitud biométrica sobre el umbral alto y probabilidad de síntesis bajo el umbral bajo.",
    manifestacion: "Banda verde delgada en el borde superior con nombre y foto del familiar. Sin sonido ni vibración.",
    accion: "Ninguna. El sistema tranquiliza y desaparece a los pocos segundos.",
  },
  1: {
    nombre: "Gris · Sin datos",
    corto: "Gris",
    color: "gris",
    descripcion: "Número desconocido sin señales adversas. Estado por defecto de la mayoría de las llamadas.",
    disparador: "Sin reputación negativa, sin invocación de parentesco, habla natural.",
    manifestacion: "Sin superposición alguna. Silencio deliberado para evitar la fatiga de alerta.",
    accion: "Ninguna.",
  },
  2: {
    nombre: "Amarillo · Precaución",
    corto: "Amarillo",
    color: "amarillo",
    descripcion: "Score ambiguo, audio degradado, número sin reputación o línea activada hace menos de 72 h.",
    disparador: "Resultado indeterminado en alguna capa o techo por calidad de señal.",
    manifestacion: "Banda ámbar de una línea: “No pudimos verificar quién está hablando”.",
    accion: "Sugerir altavoz para mejorar el análisis y botón de pregunta de desafío.",
  },
  3: {
    nombre: "Naranja · Llamada automatizada o comercial",
    corto: "Naranja",
    color: "naranja",
    descripcion: "Habla sintética o patrón de robocall en un número no asociado a ningún familiar.",
    disparador: "Síntesis detectada sin candidato familiar, o reputación de robocall / fraude bancario.",
    manifestacion: "Banda naranja: “Esto parece un robot, no una persona”. Doble vibración corta.",
    accion: "Cortar, bloquear y reportar el número a la base comunitaria.",
  },
  4: {
    nombre: "Rojo · Posible suplantación de un familiar",
    corto: "Rojo",
    color: "rojo",
    descripcion: "La llamada invoca la identidad de un familiar y la voz presenta síntesis o no alcanza la similitud.",
    disparador: "Identidad familiar invocada + artefactos de síntesis o similitud bajo el umbral.",
    manifestacion: "Superposición completa, alto contraste, 28sp o más: “Atención: esta voz no suena como la de tu hija”. Vibración larga y tono discreto.",
    accion: "Pedir la palabra clave, pregunta de desafío, aviso al guardián y botón de cortar. Nunca corta por su cuenta.",
  },
  5: {
    nombre: "Modo Resguardo (posterior a la llamada)",
    corto: "Resguardo",
    color: "resguardo",
    descripcion: "Se activa al finalizar cualquier llamada que haya alcanzado el nivel rojo.",
    disparador: "Fin de una llamada en nivel 4.",
    manifestacion: "Pantalla de contención con tres instrucciones en lenguaje llano y letra grande.",
    accion: "No transferir dinero; llamar al familiar al número de la agenda; avisar al guardián y exportar el registro.",
  },
};

export const CATEGORIAS: Record<
  CategoriaNumero,
  { nombre: string; criterio: string; respuesta: string; nivel: Nivel | null; tono: "verde" | "gris" | "amarillo" | "naranja" | "rojo" }
> = {
  spam_comercial: {
    nombre: "Spam comercial / telemarketing",
    criterio: "Reportes convergentes de múltiples usuarios sobre una misma numeración con actividad sostenida.",
    respuesta: "Etiqueta en la pantalla de llamada entrante y, si el guardián lo habilitó, bloqueo silencioso sin repique.",
    nivel: 1,
    tono: "gris",
  },
  robocall: {
    nombre: "Robocall / marcación automatizada",
    criterio: "Alta densidad de llamadas del originante en ventana corta y habla sintética en llamadas previas.",
    respuesta: "Nivel 3 (naranja) con botón de cortar, bloquear y reportar.",
    nivel: 3,
    tono: "naranja",
  },
  fraude_bancario: {
    nombre: "Fraude bancario o institucional reportado",
    criterio: "Numeración incluida en alertas oficiales o reportada como suplantación de banco, organismo o fuerza de seguridad.",
    respuesta: "Nivel 3 (naranja) con advertencia explícita: ninguna entidad solicita claves ni transferencias por teléfono.",
    nivel: 3,
    tono: "naranja",
  },
  linea_reciente: {
    nombre: "Línea de reciente activación",
    criterio: "Señal de Capa 0 sobre antigüedad menor a 72 horas o ausencia total de historial.",
    respuesta: "Nivel 2 (amarillo) y activación obligatoria de las Capas 2 y 3 al atender.",
    nivel: 2,
    tono: "amarillo",
  },
  extorsion: {
    nombre: "Numeración asociada a extorsión denunciada",
    criterio: "Cruce con reportes de secuestro virtual validados por el equipo o por las autoridades.",
    respuesta: "Nivel 4 (rojo) desde el repique, antes de que el usuario atienda.",
    nivel: 4,
    tono: "rojo",
  },
  institucional_verificado: {
    nombre: "Contacto institucional legítimo verificado",
    criterio: "Numeración oficial confirmada de bancos, obras sociales, organismos previsionales o emergencias.",
    respuesta: "Etiqueta verde informativa, sin sustituir el análisis acústico posterior.",
    nivel: null,
    tono: "verde",
  },
};

export const PRESETS_SENSIBILIDAD: Record<Sensibilidad, Umbrales> = {
  conservadora: { similitudAlta: 0.8, similitudBaja: 0.5, sintesisBaja: 0.2, sintesisAlta: 0.7, calidadMinima: 0.4 },
  equilibrada: { similitudAlta: 0.75, similitudBaja: 0.55, sintesisBaja: 0.25, sintesisAlta: 0.6, calidadMinima: 0.35 },
  estricta: { similitudAlta: 0.7, similitudBaja: 0.6, sintesisBaja: 0.3, sintesisAlta: 0.5, calidadMinima: 0.3 },
};

export const PARENTESCOS: Record<string, { fem: boolean; etiqueta: string }> = {
  hija: { fem: true, etiqueta: "tu hija" },
  hijo: { fem: false, etiqueta: "tu hijo" },
  nieta: { fem: true, etiqueta: "tu nieta" },
  nieto: { fem: false, etiqueta: "tu nieto" },
  esposa: { fem: true, etiqueta: "tu esposa" },
  esposo: { fem: false, etiqueta: "tu esposo" },
  hermana: { fem: true, etiqueta: "tu hermana" },
  hermano: { fem: false, etiqueta: "tu hermano" },
  nuera: { fem: true, etiqueta: "tu nuera" },
  yerno: { fem: false, etiqueta: "tu yerno" },
  sobrina: { fem: true, etiqueta: "tu sobrina" },
  sobrino: { fem: false, etiqueta: "tu sobrino" },
  otro: { fem: false, etiqueta: "tu familiar" },
};

export const TONO_CLASES: Record<string, string> = {
  verde: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  gris: "bg-slate-100 text-slate-700 ring-slate-200",
  amarillo: "bg-amber-100 text-amber-800 ring-amber-200",
  naranja: "bg-orange-100 text-orange-800 ring-orange-200",
  rojo: "bg-red-100 text-red-800 ring-red-200",
  resguardo: "bg-indigo-100 text-indigo-800 ring-indigo-200",
};

export const NIVEL_TONO: Record<Nivel | 5, string> = {
  0: "verde",
  1: "gris",
  2: "amarillo",
  3: "naranja",
  4: "rojo",
  5: "resguardo",
};

export const NIVEL_HEX: Record<Nivel | 5, string> = {
  0: "#059669",
  1: "#64748b",
  2: "#d97706",
  3: "#ea580c",
  4: "#dc2626",
  5: "#4f46e5",
};
