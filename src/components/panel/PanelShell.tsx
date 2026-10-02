"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, FileAudio, Hash, KeyRound, LayoutDashboard, ListChecks, PhoneIncoming, Settings, Smartphone, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/SiteHeader";
import { Hydrated } from "@/components/Hydrated";
import { useVozReal } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";

const NAV = [
  { href: "/panel", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/panel/circulo", label: "Círculo familiar", icon: Users },
  { href: "/panel/palabras-clave", label: "Palabras clave", icon: KeyRound },
  { href: "/panel/numeros", label: "Números clasificados", icon: Hash },
  { href: "/panel/eventos", label: "Registro de eventos", icon: ListChecks },
  { href: "/panel/configuracion", label: "Configuración", icon: Settings },
];

const HERRAMIENTAS = [
  { href: "/simulador", label: "Simulador de llamada", icon: PhoneIncoming },
  { href: "/verificar", label: "Verificar audio", icon: FileAudio },
  { href: "/protegido", label: "Vista protegida", icon: Smartphone },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const path = usePathname();
  const noLeidas = useVozReal((s) => s.notificaciones.filter((n) => !n.leida).length);
  return (
    <>
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Panel del guardián</p>
      {NAV.map((n) => {
        const activo = n.exact ? path === n.href : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activo ? "bg-brand-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <n.icon className="h-4 w-4" />
            {n.label}
            {n.href === "/panel" && noLeidas > 0 && (
              <span className={cn("ml-auto rounded-full px-1.5 text-[11px] font-semibold", activo ? "bg-white/20" : "bg-red-100 text-red-700")}>{noLeidas}</span>
            )}
          </Link>
        );
      })}
      <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Herramientas</p>
      {HERRAMIENTAS.map((n) => (
        <Link key={n.href} href={n.href} onClick={onClick} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
          <n.icon className="h-4 w-4" />
          {n.label}
        </Link>
      ))}
    </>
  );
}

function Encabezado() {
  const circulo = useVozReal((s) => s.circulo);
  const noLeidas = useVozReal((s) => s.notificaciones.filter((n) => !n.leida).length);
  return (
    <div className="flex items-center gap-3">
      <Link href="/panel" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notificaciones">
        <Bell className="h-5 w-5" />
        {noLeidas > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
      </Link>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-slate-900">{circulo.guardian.nombre}</p>
        <p className="text-xs text-slate-500">Guardián · {circulo.nombre}</p>
      </div>
      <Avatar nombre={circulo.guardian.nombre} />
    </div>
  );
}

export function PanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 lg:flex">
        <div className="px-3 pb-6">
          <Logo />
        </div>
        <nav className="flex flex-col gap-0.5">
          <NavLinks />
        </nav>
        <div className="mt-auto rounded-xl bg-brand-50 p-3 text-xs text-brand-900">
          <p className="font-semibold">Privacidad por diseño</p>
          <p className="mt-1 text-brand-800/80">Las huellas vocales y los eventos se guardan solo en este dispositivo. Nada viaja a un servidor.</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <Logo />
          </div>
          <div className="hidden lg:block" />
          <Hydrated fallback={<div className="h-10 w-10 rounded-full bg-slate-100" />}>
            <Encabezado />
          </Hydrated>
        </header>
        <nav className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {[...NAV, ...HERRAMIENTAS].map((n) => (
            <Link key={n.href} href={n.href} className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
              <n.icon className="h-3.5 w-3.5" />
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Hydrated>{children}</Hydrated>
        </main>
      </div>
    </div>
  );
}
