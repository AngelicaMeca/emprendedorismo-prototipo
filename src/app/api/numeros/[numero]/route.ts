import { NextResponse } from "next/server";
import { clasificarNumero, heuristicasFormato } from "@/lib/engine";
import { CATEGORIAS } from "@/lib/niveles";
import { NUMEROS_INICIALES } from "@/lib/seed";
import { formatearNumero, normalizarNumero } from "@/lib/utils";

// GET /api/numeros/[numero]
// Consulta de reputación contra la base precargada (Capa 1). En la app
// Android esta consulta se resuelve en un índice B-Tree local; aquí se expone
// como endpoint para herramientas de prueba e integraciones.
export async function GET(_req: Request, { params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const n = normalizarNumero(decodeURIComponent(numero));
  const inicio = performance.now();
  const clasif = clasificarNumero(n, NUMEROS_INICIALES);
  const heuristicas = heuristicasFormato(n);
  const ms = Math.round((performance.now() - inicio) * 100) / 100;
  return NextResponse.json({
    numero: n,
    formateado: formatearNumero(n),
    clasificacion: clasif
      ? {
          categoria: clasif.categoria,
          nombre: CATEGORIAS[clasif.categoria].nombre,
          respuesta: CATEGORIAS[clasif.categoria].respuesta,
          nivelBase: CATEGORIAS[clasif.categoria].nivel,
          fuente: clasif.fuente,
          reportes: clasif.reportes,
          patron: clasif.numero,
        }
      : null,
    heuristicas,
    consultaMs: ms,
  });
}
