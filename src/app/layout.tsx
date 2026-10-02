import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VozReal · Protección familiar contra el vishing",
    template: "%s · VozReal",
  },
  description:
    "Verificación de identidad vocal y detección de habla sintética en tiempo real durante las llamadas. Edge AI, privacidad por diseño y un semáforo cognitivo de cinco niveles.",
  applicationName: "VozReal",
};

export const viewport: Viewport = {
  themeColor: "#0f2342",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
