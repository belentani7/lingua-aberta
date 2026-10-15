# lingua-aberta

> Plataforma abierta y gratuita para jóvenes en Cataluña — y para quien quiera
> aprender una lengua desde cero, a su ritmo y sin conexión obligatoria.

[![CI](https://github.com/belentani7/lingua-aberta/actions/workflows/ci.yml/badge.svg)](https://github.com/belentani7/lingua-aberta/actions/workflows/ci.yml)
[![Licencia: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-00E676.svg)](./LICENSE)
[![Seguridad](https://img.shields.io/badge/security--policy-brightgreen.svg)](./SECURITY.md)

**VERDE** — el proyecto nace de una idea: el acceso al idioma no puede depender de un
pago, de un servidor en un país concreto ni de una conexión estable.

---

## Qué es

`lingua-aberta` es un campus lingüístico completo que funciona como aplicación web
(Vite + React) y como servicio:

| Capa | Qué aporta |
|---|---|
| `client/` + `campus/` | Interfaz React, campus y rutas de aprendizaje |
| `server/` | API, tutor conversacional y Static Data (S3) |
| `open-data/` | Corpus y datos abiertos con atribución (`NOTICE-ATRIBUCIONES.md`) |
| `knowledge_base.json` | Base de conocimiento del tutor, versionable y auditable |
| `shared/` | Contratos y tipos compartidos cliente/servidor |
| `drizzle/` + `data/` | Esquema y migraciones de persistencia |
| `tests/` | Suite de tests del proyecto |

- **Multilingüe por diseño**: interfaz y contenido en español, catalán, portugués e inglés.
- **Offline-first**: los datos de aprendizaje se empaquetan para funcionar sin red.
- **Datos abiertos con atribución explícita**, no con contenido difuso.
- **Deploy flexible**: Vercel, Netlify, Cloudflare (wrangler) y Docker (`Dockerfile.aio`).

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

# Opción B — stack completo en Docker
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

```
┌──────────────┐   HTTP/JSON   ┌──────────────┐
│  client/     │ ────────────► │  server/     │
│  React+Vite  │ ◄──────────── │  API + tutor │
└──────────────┘               └──────┬───────┘
                                      │
                        ┌─────────────┼─────────────┐
                        ▼             ▼             ▼
                 open-data/     drizzle/       S3 (static)
```

## Documentación

- [`STORY.md`](./STORY.md) — por qué existe el proyecto, en su contexto
- [`NOTICE-ATRIBUCIONES.md`](./NOTICE-ATRIBUCIONES.md) — atribuciones de datos abiertos
- [`SECURITY.md`](./SECURITY.md) — cómo reportar incidencias de seguridad
- `docs/` — notas de arquitectura y decisiones

## Estado del proyecto

En desarrollo activo. El campus, el corpus y el tutor se iteran por sprints cortos.
Las incidencias y propuestas se gestionan como issues; toda contribución pasa por PR
con `pnpm check` en verde.

## Licencia

[AGPL-3.0](./LICENSE) — copyleft fuerte: si alguien lo despliega como servicio, el
código sigue siendo libre. Es una decisión deliberada para proteger el proyecto y a
quien lo usa.

<sub>VERDE · abierto · para todos</sub>
