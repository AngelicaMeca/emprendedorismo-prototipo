// Utilidades compartidas (sin dependencias de navegador)

export function normalizarTexto(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// FNV-1a 64 bits sobre la frase normalizada. Prototipo: en la app Android se
// reemplaza por plantilla acústica + hash bajo Android Keystore (AES-GCM 256).
export function hashPalabra(s: string): string {
  const texto = normalizarTexto(s);
  let h = BigInt("0xcbf29ce484222325");
  const prime = BigInt("0x100000001b3");
  const mask = BigInt("0xffffffffffffffff");
  for (let i = 0; i < texto.length; i++) {
    h ^= BigInt(texto.charCodeAt(i));
    h = (h * prime) & mask;
  }
  return h.toString(16).padStart(16, "0");
}

export function contarSilabas(s: string): number {
  const t = normalizarTexto(s);
  const grupos = t.match(/[aeiouy]+/g);
  return grupos ? grupos.length : 0;
}

export function normalizarNumero(n: string): string {
  const limpio = n.replace(/[^\d+*]/g, "");
  if (limpio.startsWith("+")) return limpio;
  if (limpio.startsWith("00")) return "+" + limpio.slice(2);
  if (limpio.startsWith("0")) return "+54" + limpio.slice(1);
  if (/^\d{10}$/.test(limpio)) return "+54" + limpio;
  return limpio;
}

export function formatearNumero(n: string): string {
  if (!n) return "Número oculto";
  if (n.startsWith("+54") && n.length >= 12) {
    const resto = n.slice(3);
    if (resto.startsWith("9")) {
      const r = resto.slice(1);
      return `+54 9 ${r.slice(0, 3)} ${r.slice(3, 6)}-${r.slice(6)}`;
    }
    return `+54 ${resto.slice(0, 3)} ${resto.slice(3, 6)}-${resto.slice(6)}`;
  }
  return n;
}

export function uid(prefix = "id"): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rnd}`;
}

export function haceDias(d: number, horas = 0): string {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(t.getHours() - horas);
  return t.toISOString();
}

export function enMeses(iso: string, meses: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString();
}

export function diasEntre(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

export function fechaHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  return `hace ${d} días`;
}

// Generador pseudoaleatorio determinista (mulberry32) para datos de demo
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function vectorAleatorio(seed: number, dim = 128): number[] {
  const r = rng(seed);
  const v = Array.from({ length: dim }, () => r() * 2 - 1);
  return normalizarVector(v);
}

export function normalizarVector(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

export function similitudCoseno(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

// Variante perturbada de un vector (misma persona, distinto canal)
export function perturbar(v: number[], intensidad: number, seed: number): number[] {
  const r = rng(seed);
  return normalizarVector(v.map((x) => x + (r() * 2 - 1) * intensidad));
}

export function clamp(x: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, x));
}

export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function cn(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}
