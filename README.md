# VozReal · prototipo web

Sistema web (Next.js 16 + React 19 + Tailwind CSS 4) que implementa la definición de producto del documento
**"VozReal: Marco Teórico, Antecedentes, Estado del Arte y Definición de Producto"** (UCSE · Cátedra de Emprendedorismo · TP2).

VozReal es un sistema de verificación de identidad vocal y detección de habla sintética que opera durante las llamadas
entrantes, se ejecuta íntegramente en el teléfono de la persona protegida y responde en menos de tres segundos a dos
preguntas: ¿quien habla es una persona real o una voz generada? y, si dice ser un familiar, ¿su voz coincide con la huella
que ese familiar registró?

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
npm start
```

No requiere base de datos ni variables de entorno. Todo el estado (círculo familiar, huellas, palabras clave, base de
números, eventos) se guarda en `localStorage` del navegador, en línea con el principio de que ningún dato biométrico
abandona el dispositivo.

## Qué incluye

| Ruta | Función del documento | Descripción |
| --- | --- | --- |
| `/` | Resumen ejecutivo, capítulos 4 y 5 | Landing con el problema, las capas, el semáforo de cinco niveles, los roles y el pipeline |
| `/simulador` | 5.8, 5.9, 5.10, 7.1 | Simulador de llamada entrante: escenarios del documento, señales de las Capas 0–3 y del factor de conocimiento, mockup del teléfono con el overlay de cada nivel, Modo Resguardo, aviso al guardián y pipeline con latencias |
| `/verificar` | F8 · 7.3 | Verificación diferida de audios: graba o sube un mensaje de voz, lo analiza en el navegador (Web Audio API) y lo coteja contra las huellas enroladas |
| `/protegido` | F6 · 5.8 · 2.4 | Vista de la persona protegida: letra grande, contraste alto, botones "Pedile la palabra clave", pregunta de desafío, llamar al familiar, avisar al guardián y Modo Resguardo |
| `/enrolar` | 5.3.2 | Módulo liviano de enrolamiento remoto por enlace, con consentimiento expreso |
| `/panel` | F9 | Resumen del guardián: KPIs, eventos, avisos, estado de la protección |
| `/panel/circulo` | 5.3 · F2 | Círculo de Protección Familiar: protegido, guardián y hasta 8 voces enroladas (presencial, remoto o simulado) |
| `/panel/palabras-clave` | F4 · F5 · 5.7 | Palabra de identificación, palabra de coacción, preguntas de desafío, gobernanza y matriz de integración con el motor |
| `/panel/numeros` | F3 · 5.6 | Base local de números clasificados, consulta, reportes, categorías y bloqueo silencioso |
| `/panel/eventos` | 5.2 · 5.11 | Registro local de eventos con detalle técnico por capa, feedback "era mi familiar" (histéresis) y exportación CSV/JSON para la denuncia |
| `/panel/configuracion` | F9 · 5.11 | Sensibilidad, umbrales sobre la curva DET, modo susurro, refuerzo adaptativo, Capa 0, histéresis, avisos y derecho al olvido |
| `POST /api/analizar` | 5.9 | Motor de decisión stateless: recibe las señales ya extraídas (nunca audio) y devuelve el nivel, mensajes, acciones y explicación |
| `GET /api/numeros/[numero]` | 5.6 | Consulta de reputación contra la base precargada |
| `GET /api/salud` | 7.1 | Estado del servicio y modelos del pipeline |

## Motor de decisión (`src/lib/engine.ts`)

Implementa la cascada con activación condicional y escalada asimétrica del apartado 5.9:

1. Evaluación previa a la atención (Capas 0 y 1): reputación local, heurísticas de formato y señales de red.
2. Capa 2 anti-spoofing (siempre) con techo de severidad por calidad de muestra.
3. Capa 3 biometría (condicional: número enrolado, mención de parentesco o línea reciente), 1:1 o 1:N.
4. Fusión según la matriz Capa 2 × Capa 3 del documento. Ninguna capa reduce a verde por sí sola.
5. Factor de conocimiento: palabra de identificación, palabra de coacción (nivel 4 discreto), palabra incorrecta tras pedido.
6. Histéresis para números confirmados como auténticos y mensajes del semáforo (5.8).

## Análisis acústico local (`src/lib/audio.ts`)

Aproximación heurística del pipeline AASIST-Lite + Tiny-ECAPA para el prototipo web: FFT propia, 64 bandas log-espectrales,
embedding de 128 dimensiones (media + desvío), SNR estimada, detección de micro-pausas e indicadores del apartado 2.2.2
(colapso de armónicos por encima de 3,5 kHz, textura espectral uniforme, envolvente plana). El audio se procesa y se
descarta en el navegador.

## Estructura

```
src/
  app/            páginas (App Router) y rutas API
  components/     UI, mockup del teléfono, grabador, shell del panel
  lib/            tipos, motor de decisión, niveles, semilla de datos, audio, store (zustand + persist)
```
