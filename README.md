# Lingua Aberta

Plataforma abierta y gratuita para jóvenes brasileños en Cataluña, con aprendizaje de español, catalán e inglés y tutor IA preparado para voz.

## Estado

- **Stack**: Vite + React + TypeScript + Pulumi
- **CI**: ✅ GitHub Actions con pnpm y frozen lockfile
- **Typecheck**: ✅ `pnpm run check`
- **Build**: ✅ `pnpm run build`
- **Tests**: ✅ `pnpm run check` (type-level tests)
- **License**: MIT

## Setup

```bash
pnpm install
pnpm run check     # TypeScript validation
pnpm run dev       # Development server (http://localhost:5173)
pnpm run build     # Production build
pnpm format        # Format code
```

## Estructura

```
client/      Frontend React
campus/      Contenido educativo
open-data/   Datos abiertos CC-BY
scripts/     Automatización
data/        Fixtures y datasets de prueba
```

## Contribuir

Ver CONTRIBUTING.md.

## Licencia

MIT — ver LICENSE en la raíz del repositorio.
