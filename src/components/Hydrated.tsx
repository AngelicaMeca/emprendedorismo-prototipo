"use client";

import type { ReactNode } from "react";
import { useVozReal } from "@/lib/store";

export function Hydrated({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const hydrated = useVozReal((s) => s.hydrated);
  if (!hydrated) {
    return (
      fallback ?? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-accent-500" />
            Cargando datos locales del dispositivo…
          </div>
        </div>
      )
    );
  }
  return <>{children}</>;
}
