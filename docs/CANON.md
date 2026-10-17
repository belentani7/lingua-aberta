# CANON — Lingua Aberta

> Estado: VERIFIED / DOCUMENTED ONLY. Observado online el 2026-10-15.

## Misión
Plataforma educativa multilingüe con campus, contenidos y backend de datos para aprendizaje abierto.

## Arquitectura observada
TypeScript con client, campus, server, drizzle, tests, Dockerfile y docker-compose.aio.yml. Mantener el monolito modular; no dividir en microservicios por estética.

## Estado técnico
- VERIFIED: estructura full-stack, Drizzle, tests, Docker y lockfiles.
- RISK: instalación y CI con lockfile divergente.
- PENDING: confirmar contraseñas obligatorias por variables.
- PENDING: sustituir datos personales de seeds por fixtures sintéticos.

## Gates
Instalación congelada, typecheck, tests, build, validación de compose y escaneo de secretos. No exponer stack traces ni datos de usuario.

## Decisión
Producto CORE educativo. Prioridad: CI reproducible y privacidad de fixtures; la capa visual se estabiliza después.
