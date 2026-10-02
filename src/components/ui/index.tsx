"use client";

import { X } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { TONO_CLASES } from "@/lib/niveles";

/* ---------- Button ---------- */
type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

const VARIANTES: Record<Variant, string> = {
  primary: "bg-brand-900 text-white hover:bg-brand-800 shadow-sm",
  accent: "bg-accent-600 text-white hover:bg-accent-700 shadow-sm",
  secondary: "bg-brand-100 text-brand-900 hover:bg-brand-200",
  outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
};
const TAMANOS: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        VARIANTES[variant],
        TAMANOS[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------- Card ---------- */
export function Card({
  className,
  children,
  title,
  subtitle,
  actions,
  padding = true,
}: {
  className?: string;
  children?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  padding?: boolean;
}) {
  return (
    <section className={cn("rounded-2xl bg-white shadow-card ring-1 ring-slate-200/70", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(padding && (title || actions ? "px-5 pb-5" : "p-5"))}>{children}</div>
    </section>
  );
}

/* ---------- Badge ---------- */
export function Badge({ tono = "gris", children, className }: { tono?: string; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONO_CLASES[tono] ?? TONO_CLASES.gris,
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Form ---------- */
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30 disabled:bg-slate-50";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />;
}
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, "min-h-[80px]", className)} {...props} />;
}
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, "appearance-none pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  descripcion,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  descripcion?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {descripcion && <p className="text-xs text-slate-500">{descripcion}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 disabled:opacity-50",
          checked ? "bg-accent-600" : "bg-slate-300",
        )}
      >
        <span className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
      </button>
    </div>
  );
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  label,
  formato = (v: number) => `${Math.round(v * 100)}%`,
  hint,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  formato?: (v: number) => string;
  hint?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="font-mono text-xs text-slate-600">{formato(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/* ---------- Stat ---------- */
export function Stat({
  label,
  value,
  hint,
  icon,
  tono,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tono?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        {icon && <span className={cn("rounded-lg p-1.5", tono ? TONO_CLASES[tono] : "bg-brand-50 text-brand-700")}>{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-700">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Empty ---------- */
export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <p className="font-medium text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "animate-slide-down max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Misc ---------- */
export function Avatar({ nombre, color, size = "md" }: { nombre: string; color?: string; size?: "sm" | "md" | "lg" }) {
  const ini = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const s = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", s)} style={{ background: color ?? "#214070" }}>
      {ini}
    </span>
  );
}

export function Barra({ valor, color = "#0d9488", className }: { valor: number; color?: string; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(Math.min(1, Math.max(0, valor)) * 100)}%`, background: color }} />
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">{children}</kbd>;
}
