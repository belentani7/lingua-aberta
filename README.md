# Lingua Abierta

Plataforma abierta de aprendizaje de idiomas con progresión CEFR, campus virtual y tutor IA.

## Estado

🟢 **Operativo** — CI/CD verde, datos sintéticos, sin credenciales hardcoded.

## Qué incluye

- **Campus virtual**: Cursos estructurados por nivel CEFR (A1–C2)
- **Tutor IA**: Asistencia conversacional con límites de privacidad
- **Datos abiertos**: Corpus lingüísticos con licencia verificada
- **Multiidioma**: ES, EN, PT-BR, FR, DE, IT, ZH, JA, AR, HI

## Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Radix UI, TanStack Query
- **Backend**: Express, tRPC, MySQL/TiDB (Drizzle ORM)
- **IA**: z-ai-web-dev-sdk (opt-in, sin datos personales)
- **Calidad**: TypeScript strict, Vitest, ESLint, Prettier

## Desarrollo local

```bash
pnpm install
pnpm dev           # Frontend en :5173
pnpm api           # API en :3001 (terminal separada)
pnpm check         # TypeScript strict
pnpm build         # Build producción
pnpm db:seed       # Generar datos sintéticos (faker.js)
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

```env
DATABASE_URL=mysql://user:pass@localhost:3306/linguaaberta
DB_PASSWORD=secure_password_here
REDIS_URL=redis://localhost:6379
ZAI_API_KEY=your_zai_key
```

**Nunca** commitear `.env` ni secretos.

## Docker

```bash
# Requiere DATABASE_URL y DB_PASSWORD en entorno
docker-compose -f docker-compose.aio.yml up -d
```

## Datos

Los datos de desarrollo son **100% sintéticos** generados con `@faker-js/faker`. No hay PII real en el repositorio.

```bash
pnpm db:seed  # Genera data/seed/synthetic-data.json
```

## Licencia

MIT para código. Datos y corpus bajo sus licencias originales (ver `NOTICE-ATRIBUCIONES.md`).

## Seguridad

- `docker-compose.aio.yml` requiere `DATABASE_URL` y `DB_PASSWORD` obligatorias
- Escaneo de secretos en CI con Gitleaks
- Endpoints IA con rate-limiting y validación estricta

---

Parte del ecosistema educativo **Belentani / NOIACORE**.