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

El build del frontend no acredita autenticación, progreso remoto, tutor, transcripción
ni síntesis de voz: la pantalla principal solicita `/api/trpc`, pero no existe su
implementación en este repositorio. Esos recorridos deben implementarse y probarse
antes de publicar el producto como funcional.

## Licencia

[MIT](./LICENSE) — licencia permisiva. Permite usar, modificar, distribuir y
comercializar el código, conservando el aviso de copyright y la licencia.
No impone copyleft ni obliga a publicar el código de los despliegues.

<sub>Abierto · en desarrollo</sub>

## Verificación de esta integración — 2026-10-17

Node 20.20.2 y pnpm 10.4.1: instalación congelada con scripts de dependencias desactivados, `pnpm check` y `pnpm build` correctos. Vite conserva una advertencia de tamaño del bundle. No se ejecutó un recorrido de usuario ni se verificó la API ausente. El HTML permite ampliar la página y no carga analítica con una URL sin configurar.
