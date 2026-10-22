# lingua-aberta

> Plataforma abierta y gratuita para jóvenes en Cataluña — y para quien quiera
> aprender una lengua desde cero, a su ritmo y sin conexión obligatoria.

[![CI](https://github.com/belentani7/lingua-aberta/actions/workflows/ci.yml/badge.svg)](https://github.com/belentani7/lingua-aberta/actions/workflows/ci.yml)
[![Licencia: MIT](https://img.shields.io/badge/License-MIT-00E676.svg)](./LICENSE)
[![Seguridad](https://img.shields.io/badge/security--policy-brightgreen.svg)](./SECURITY.md)

**En desarrollo** — el proyecto nace de una idea: el acceso al idioma no puede depender de un
pago, de un servidor en un país concreto ni de una conexión estable.

---

## Qué es

`lingua-aberta` es un prototipo de campus lingüístico con una aplicación web
(Vite + React). El servicio API que solicita el frontend todavía no está implementado:

| Capa | Qué aporta |
|---|---|
| `client/` + `campus/` | Interfaz React, campus y rutas de aprendizaje |
| `server/` | Contenido estático (`miara_content.json`); no contiene una API ejecutable |
| `open-data/` | Corpus y datos abiertos con atribución (`NOTICE-ATRIBUCIONES.md`) |
| `knowledge_base.json` | Base de conocimiento del tutor, versionable y auditable |
| `shared/` | Contratos y tipos compartidos cliente/servidor |
| `drizzle/` + `data/` | Esquema y migraciones de persistencia |
| `tests/` | Archivos de pruebas existentes; no hay un script de tests ejecutable declarado en package.json |

- **Multilingüe por diseño**: interfaz y contenido en español, catalán, portugués e inglés.
- **Offline-first**: los datos de aprendizaje se empaquetan para funcionar sin red.
- **Datos abiertos con atribución explícita**, no con contenido difuso.
- **Configuraciones de despliegue existentes**: Vercel, Netlify, Cloudflare y Docker; necesitan validación de integración.

## Por qué existe

Miles de jóvenes en zonas con conectividad limitada llegan a una clase de idioma sin
material descargable, sin tutor y sin poder pagar una plataforma. Este proyecto existe
para cerrar esa brecha con software libre y datos abiertos.

## Puesta en marcha

```bash
# Opción A — pnpm (recomendada: es el package manager declarado)
pnpm install
cp .env.example .env      # rellena lo que tu entorno necesite
pnpm dev                  # vite

# Configuración Docker existente (integración API todavía pendiente)
docker compose -f docker-compose.aio.yml up
```

Scripts disponibles:

```bash
pnpm dev        # servidor de desarrollo
pnpm build      # build de producción
pnpm check      # tsc --noEmit (typecheck estricto)
pnpm format     # prettier
```

## Arquitectura

| Estado | Relación |
|---|---|
| Implementado | Vite sirve la interfaz y el contenido estático. |
| Pendiente | El cliente solicita `/api/trpc`; falta el servidor que atiende esas peticiones. |
| Pendiente de comprobar | Integración de persistencia, tutor y voz. |

## Documentación

- [`STORY.md`](./STORY.md) — por qué existe el proyecto, en su contexto
- [`NOTICE-ATRIBUCIONES.md`](./NOTICE-ATRIBUCIONES.md) — atribuciones de datos abiertos
- [`SECURITY.md`](./SECURITY.md) — cómo reportar incidencias de seguridad
- `docs/` — notas de arquitectura y decisiones

## Estado del proyecto

En desarrollo activo. El campus, el corpus y el tutor se iteran por sprints cortos.
Las incidencias y propuestas se gestionan como issues; toda contribución pasa por PR
con `pnpm check` en verde.

El build del frontend no acredita autenticación, progreso remoto, tutor de IA generativa, transcripción
ni síntesis de voz remota: otras vistas todavía solicitan `/api/trpc`, pero no existe su
implementación en este repositorio. Esos recorridos necesitan una API real y validación
antes de publicarse como servicios funcionales.

## Licencia

[MIT](./LICENSE) — licencia permisiva. Permite usar, modificar, distribuir y
comercializar el código, conservando el aviso de copyright y la licencia.
No impone copyleft ni obliga a publicar el código de los despliegues.

<sub>Abierto · en desarrollo</sub>

## Verificación de esta integración — 2026-10-17

Node 20.20.2 y pnpm 10.4.1: instalación congelada con scripts de dependencias desactivados, `pnpm check` y `pnpm build` correctos. Vite conserva una advertencia de tamaño del bundle. No se ejecutó un recorrido de usuario ni se verificó la API ausente. El HTML permite ampliar la página y no carga analítica con una URL sin configurar.

## Recuperación funcional de MIARA — 19-10-2026

La portada ahora enlaza a **seis lecciones reales ya existentes en el corpus**
`server/miara_content.json`: dos de español, dos de catalán y dos de inglés.
Las rutas `/study/:slug` incluyen frases, ejercicios de selección y escritura,
corrección determinista, síntesis de voz del navegador (cuando esté disponible)
y seguimiento de finalización **solo cuando todas las respuestas sean correctas**.

El progreso comienza en cero, se valida antes de leerlo de `localStorage`, no
inventa estudiantes, porcentajes ni rachas, y puede exportarse o borrarse en la
misma vista de práctica. No requiere cuenta, cookies de OAuth, ni API remota.
El contenido MIARA es la única fuente: Vite permite importarlo desde `server/`
sin copiarlo a una segunda carpeta.

La conversación en portada usa ahora un **tutor guiado local, no IA generativa**.
Su lectura por voz se apoya en el navegador. El motor de juegos remoto, la cuenta,
la transcripción y una API tRPC siguen pendientes de implementación y no deben
anunciarse como servicios conectados. Tampoco debe describirse esto como una
plataforma certificada, una PWA offline completa o un campus con todos los cursos
publicados: solo seis lecciones han sido verificadas en el corpus.

Para verificar el contrato de contenido:
```sh
node --test tests/privacy-fixtures.test.mjs tests/miara-learning.test.mjs
pnpm check
pnpm build
```


## Campus navegable y paquete de estudio sin conexión — 21 octubre 2026

Esta entrega mantiene intactos los materiales existentes y añade un **campus funcional independiente** dentro de `campus/`, sin sustituir el frontend React de `client/` ni fingir que su API tRPC ausente está conectada.

- Identidad renovada con símbolo de libro-puente original (`campus/icon.svg`), estilo corporativo azul frío/negro, estructura de lectura clara y navegación móvil.
- **Tres cursos del catálogo real**, once unidades de estudio y los documentos originales de presentación y fuentes. La nueva vista `#leer` permite explorar los archivos Markdown en el propio sitio, insertándolos como texto seguro.
- **Tres cuestionarios reales**, cada uno enlazado a su propio `quiz.json`. Validación estricta de preguntas, respuestas con explicación, repetición y calificación al finalizar.
- El progreso se conserva en el almacenamiento local del navegador con máximo resultado y número de intentos por curso. Se considera superado **solo** cuando el cuestionario completo alcanza al menos 70 %; la visita a una página no genera puntos ni certificados.
- Exportación JSON de los resultados y borrado confirmado, sin creación de cuentas ni envío a un backend.
- Worker local `campus/sw.js` que precarga exactamente los tres cursos (sílabos, unidades, recursos y cuestionarios), las cuatro grabaciones de bienvenida y los archivos del campus. Solo intercepta GET de su propio origen y ámbito, y solo limpia cachés con prefijo `lingua-aberta-campus-`.
- Este comportamiento sin conexión se obtiene **después de cargar el campus correctamente bajo HTTPS o localhost con Internet**. Abrir archivos con `file://` o abortar la instalación no instala el paquete. No se promete que todos los recursos ajenos al campus funcionen offline.

### Cómo estudiar

```bash
pnpm install --frozen-lockfile
pnpm dev
```

El campus es contenido estático: además del frontend principal se puede servir el directorio `campus/` desde un servidor HTTP estático para usar `campus/index.html`. Selecciona el curso, abre una de sus unidades en `#leer`, responde al cuestionario en `#quiz` y revisa los resultados en `#progreso`.

### Comprobaciones nuevas

```bash
node --check campus/app.js
node --check campus/course-data.mjs
node --check campus/sw.js
node --test tests/campus-product.test.mjs tests/miara-learning.test.mjs tests/privacy-fixtures.test.mjs
pnpm check
pnpm build
```

Las pruebas de campus verifican existencia y contenido de las once unidades y tres kits, integridad del precache, seguridad de las entradas JSON, compatibilidad del HTML con los controles y rechazo de resultados inválidos. Además de la suite hay que comprobar en navegador real el primer uso con red y la segunda visita sin red.

**Separación de estados**: la API remota, autenticación, tutor de IA en vivo, motor de voz generativo, juegos dependientes de servicios y despliegues externos siguen siendo tareas distintas. No presentar esta rama como publicación completa del monorepositorio ni fusionarla sin resultado verificable de los gates.
