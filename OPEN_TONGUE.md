# Open Tongue

Open Tongue es un instituto de idiomas local-first para Willian. La experiencia acompaña el aprendizaje de **español, catalán e inglés** desde el portugués brasileño, con situaciones reales de Barcelona, práctica corta y seguimiento visible.

## Qué está incluido

- Curso estructurado de 12 módulos y 48 lecciones en `data/course-willian.json`.
- Tutor conversacional con memoria de sesión en el navegador y respuestas adaptadas al idioma.
- Reconocimiento de voz del navegador como primera capa, sin subir audio a Manus.
- API local opcional para Ollama en `POST /api/tutor`.
- Persistencia local de frases guardadas, meta semanal, minutos de práctica y logros.
- Sistema de motivación preparado para logros, rachas y sonido de victoria mediante Web Audio API, sin archivos externos.
- Diseño responsive heredado y ampliado desde el dashboard original del repositorio.

## IA local

La aplicación intenta usar un servidor Ollama local en `http://127.0.0.1:11434`. Se puede cambiar con `OLLAMA_URL` y `OLLAMA_MODEL`.

```bash
ollama serve
ollama pull llama3.2:3b
OLLAMA_MODEL=llama3.2:3b pnpm dev
```

Si Ollama no está instalado o no responde, la interfaz utiliza el tutor pedagógico offline incluido en el frontend. No hay claves de Manus ni llamadas obligatorias a servicios propietarios.

Para voz completamente local fuera del navegador, el siguiente paso recomendado es añadir Whisper.cpp para STT y Piper para TTS como servicios hermanos. Los contratos de integración quedan aislados para que puedan activarse sin cambiar el curso.

## Fuentes abiertas recomendadas

| Recurso | Uso | Licencia / nota | Enlace |
| --- | --- | --- | --- |
| Tatoeba | Frases paralelas y ejemplos de traducción | CC BY 2.0 FR; una parte también CC0. Revisar la licencia de cada audio. | https://tatoeba.org/en/downloads |
| Mozilla Common Voice | Audio transcrito para ASR, incluyendo español y catalán | Los datasets publicados en Data Collective indican CC0-1.0; conservar atribución y versión descargada. | https://commonvoice.mozilla.org/en/datasets |
| Open Multilingual Wordnet | Léxico, synsets y relaciones entre idiomas | Proyecto abierto; revisar licencia del wordnet concreto que se incorpore. | https://omwn.org/ |
| Wiktionary / Dbnary | Definiciones y datos léxicos enlazados | Verificar licencia por extracción y conservar avisos. | https://kaiko.getalp.org/about-dbnary/ |

Los datasets grandes no se incluyen en Git para evitar inflar el repositorio. Se deben descargar localmente, fijar versión y guardar únicamente índices, metadatos y scripts de importación.

## Privacidad y acompañamiento adolescente

El tutor usa lenguaje alentador, nunca humillante, propone objetivos pequeños y evita pedir datos sensibles. La cuenta está pensada para ser revisada junto a la madre o responsable. No se implementan perfiles publicitarios, ranking público ni contacto con desconocidos. Antes de desplegar en producción se debe añadir consentimiento verificable de responsable, controles de borrado/exportación y límites de edad según la jurisdicción.

## Comandos

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm dev
```
