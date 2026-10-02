import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    servicio: "VozReal · prototipo web",
    version: "1.0.0",
    fecha: new Date().toISOString(),
    modelos: [
      { nombre: "Silero VAD", fase: "Ingesta y VAD", formato: "TFLite INT8", latenciaMs: "100–150" },
      { nombre: "AASIST-Lite", fase: "Capa 2 · anti-spoofing", formato: "ONNX Mobile INT8", latenciaMs: "400–650" },
      { nombre: "Tiny-ECAPA-TDNN", fase: "Capa 3 · biometría", formato: "ONNX Mobile INT8 · 128-d", latenciaMs: "250–400" },
      { nombre: "Keyword spotting", fase: "Factor de conocimiento", formato: "INT8 · 1 MB", latenciaMs: "< 100" },
    ],
    principios: ["El audio nunca abandona el dispositivo", "La IA informa, el humano decide", "Ninguna capa reduce a verde por sí sola"],
  });
}
