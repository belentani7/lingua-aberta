# Lingua Aberta

Plataforma experimental de aprendizaje de idiomas y campus educativo abierto.
El repositorio reúne una experiencia Vite/React, un campus estático offline-first y
materiales de datos abiertos.

## Estado actual

- Frontend principal: `client/`, Vite + React + TypeScript.
- Campus educativo estático: `campus/`.
- Datos abiertos: `open-data/` y `client/public/open-data/`.
- La salida de producción se genera en `dist/public`.
- El proyecto sigue en consolidación: no hay una suite de pruebas de runtime
  declarada en `package.json`; la CI verifica build y TypeScript.

## Desarrollo

Requisitos: Node.js y pnpm.

```bash
corepack enable
pnpm install --no-frozen-lockfile
pnpm dev
```

Comprobaciones disponibles:

```bash
pnpm check
pnpm build
```

## Datos, privacidad y despliegue

No guardes credenciales, tokens ni datos personales en el repositorio. El
despliegue AIO con Docker Compose requiere proporcionar `DATABASE_URL` y
`DB_PASSWORD` en el entorno; no existen valores por defecto seguros para
producción.

Los proveedores de despliegue se habilitan únicamente cuando sus secretos están
configurados en GitHub Actions. Revisa la política de privacidad y la
procedencia/licencia de cada dataset antes de publicar.

## Licencia

El manifiesto del paquete y el documento de atribuciones requieren una decisión
unificada sobre la licencia efectiva antes de presentar el proyecto como
distribución estable. Hasta entonces, trata las licencias de código, contenido,
datos y dependencias por separado.
