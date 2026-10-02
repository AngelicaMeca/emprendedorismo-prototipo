"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/simulador", label: "Simulador" },
  { href: "/verificar", label: "Verificar audio" },
  { href: "/protegido", label: "Vista protegida" },
  { href: "/panel", label: "Panel del guardián" },
];

export function Logo({ oscuro }: { oscuro?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-white">
        <ShieldCheck className="h-5 w-5" />
      </span>
      <span className={cn("text-lg font-semibold tracking-tight", oscuro ? "text-white" : "text-brand-950")}>
        Voz<span className="text-accent-600">Real</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ transparente }: { transparente?: boolean }) {
  const path = usePathname();
  const [abierto, setAbierto] = useState(false);
  return (
    <header className={cn("sticky top-0 z-40 border-b", transparente ? "border-white/10 bg-brand-950/80 text-white backdrop-blur" : "border-slate-200 bg-white/90 backdrop-blur")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo oscuro={transparente} />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const activo = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  transparente
                    ? activo
                      ? "bg-white/15 text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                    : activo
                      ? "bg-brand-50 text-brand-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <button className="rounded-lg p-2 md:hidden" aria-label="Menú" onClick={() => setAbierto((v) => !v)}>
          {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {abierto && (
        <nav className={cn("border-t px-4 py-2 md:hidden", transparente ? "border-white/10 bg-brand-950" : "border-slate-200 bg-white")}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setAbierto(false)} className={cn("block rounded-lg px-3 py-2 text-sm font-medium", transparente ? "text-white/85" : "text-slate-700")}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="hidden sm:inline">· Prototipo web</span>
        </div>
        <p>Universidad Católica de Santiago del Estero · Cátedra de Emprendedorismo · TP2 · 2026</p>
      </div>
    </footer>
  );
}
