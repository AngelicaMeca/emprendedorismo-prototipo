import { NIVELES, NIVEL_HEX, NIVEL_TONO, nombreNivel } from "@/lib/niveles";
import type { CategoriaNumero, Nivel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";

export function NivelBadge({
  nivel,
  discreto,
  corto,
  className,
  categoria,
  suplantaFamiliar,
}: {
  nivel: Nivel | 5;
  discreto?: boolean;
  corto?: boolean;
  className?: string;
  categoria?: CategoriaNumero | null;
  suplantaFamiliar?: boolean;
}) {
  const n = NIVELES[nivel];
  return (
    <Badge tono={NIVEL_TONO[nivel]} className={className}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: NIVEL_HEX[nivel] }} />
      {corto ? `Nivel ${nivel} · ${n.corto}` : nombreNivel(nivel, categoria, suplantaFamiliar)}
      {discreto && <span className="ml-1 opacity-70">· discreto</span>}
    </Badge>
  );
}

export function NivelDot({ nivel, className }: { nivel: Nivel | 5; className?: string }) {
  return <span className={cn("inline-block h-3 w-3 rounded-full ring-2 ring-white", className)} style={{ background: NIVEL_HEX[nivel] }} />;
}
