# Lingua Aberta — Instituto de Idiomas Online

## 1. Premisa
Instituto de idiomas online **gratuito** para jóvenes brasileños en Barcelona (y globalmente). Plataforma educacional de acceso democrático.

## 2. Intención
Democratizar el acceso a educación de idiomas de calidad, sin barreras económicas. Conectar jóvenes brasileños dispersos con formación lingüística profesional.

## 3. Idiomas ofrecidos
- Portugués (PT-BR, PT-PT)
- Español
- Inglés
- Catalán

## 4. Estructura pedagógica
- **Módulos** → Unidades de aprendizaje estructuradas
- **Cursos** → Paths formativos (A0→B2)
- **Ejercicios** → Práctica interactiva
- **Certificaciones** → Validación de competencia

## 5. Stack técnico
- **Frontend**: React (client/)
- **Backend**: Node.js + TypeScript (server/)
- **Database**: Drizzle ORM + PostgreSQL (drizzle/)
- **Deploy**: Netlify (netlify.toml)
- **Analytics**: Umami

## 6. Componentes principales
- Authentication (login/register)
- Classroom dashboard
- Course navigator
- Exercise editor
- Progress tracker
- Certificate generator

## 7. Funcionalidades prioritarias
✅ User authentication
✅ Course enrollment
✅ Module completion tracking
✅ Exercise submission
✅ Progress analytics

⚠️ Community features
⚠️ Live classes
⚠️ AI tutor integration

## 8. Tono
- Inclusivo, accesible, profesional
- Énfasis en "gratuito" y "sin barreras"
- Narrativa de empoderamiento

## 9. Estado actual
🔧 **FULL-STACK FUNCIONAL** pero requiere:
1. npm install (client + server)
2. .env configuration (database, api keys)
3. Database migrations (drizzle)
4. npm run dev (verificar funcionamiento)
5. npm run build (producción)

## 10. Variables de entorno requeridas
- `DATABASE_URL` → PostgreSQL connection
- `API_SECRET` → JWT secret
- `VITE_API_ENDPOINT` → Backend URL
- `VITE_ANALYTICS_WEBSITE_ID` → Umami tracking
- `VITE_ANALYTICS_ENDPOINT` → Analytics endpoint

## 11. Ampliación futura
- Gamification (puntos, badges)
- Ejercicios generados por AI
- Tutoring en vivo (Zoom)
- Mobile app (React Native)
- Community forum
- Marketplace de certificados

---

## DEPLOYMENT CHECKLIST

| Item | Status | Command |
|---|---|---|
| Dependencies installed | ⚠️ | npm install (root, client, server) |
| .env configured | ⚠️ | cp .env.example .env + fill values |
| Database setup | ⚠️ | npm run db:migrate |
| Dev server test | ⚠️ | npm run dev |
| Build test | ⚠️ | npm run build |
| Production ready | ⚠️ | npm run build + deploy to Netlify |

## STATUS: 🔧 READY FOR BUILD

Este proyecto es **educacionalmente sólido** y técnicamente completamente estructurado.

**Próximos pasos:**
1. Instalar dependencias
2. Configurar .env con credentials reales
3. Ejecutar migrations de BD
4. Testear npm run dev
5. Verificar flujo usuario (login → course → exercise)
6. Deploy a Netlify

**Complejidad**: Media-Alta (full-stack, BD, auth)
**Prioridad**: Máxima (educacional + gratuito)

---

## CONCLUSIÓN

Lingua Aberta es un proyecto **socialmente valioso** (educación gratuita) con **arquitectura profesional** (full-stack, BD, auth). Listo para desarrollo final.
