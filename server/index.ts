import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "64kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, app: "open-tongue", localAi: true });
  });

  app.post("/api/tutor", async (req, res) => {
    const { message, language = "Español", history = [] } = req.body ?? {};
    if (typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }
    const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
    const model = process.env.OLLAMA_MODEL || "llama3.2:3b";
    const system = `Eres el tutor local de Open Tongue para Willian, un joven brasileño que vive en Cataluña. Enseñas ${language} usando portugués brasileño como puente. Sé cálido, breve, juvenil y respetuoso. Corrige una sola cosa cada vez, explica la lógica comparándola con portugués y termina con una pregunta fácil para continuar. Nunca pidas datos sensibles ni reemplaces a su madre, profesores o profesionales.`;
    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, stream: false, messages: [{ role: "system", content: system }, ...history.slice(-8), { role: "user", content: message }] }),
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error(`Ollama ${response.status}`);
      const data = await response.json() as { message?: { content?: string } };
      res.json({ reply: data.message?.content || "Vamos tentar de novo juntos?", engine: "ollama-local" });
    } catch {
      res.json({ reply: "Muito bem por tentar! Vou guardar este passo. Agora repete a ideia com uma frase curta e eu te ajudo a ajustar uma palavra.", engine: "offline-coach" });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
