import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "node:fs";
import { defineConfig } from "vite";

// Keep the standalone curriculum and interactive HTML available in Vercel's
// actual Vite output. They live outside client/ so Vite will not copy them by
// default. Copy only the reviewed campus tree after build, never secrets.
function publishStandaloneCampus() {
  return {
    name: "publish-standalone-campus",
    apply: "build" as const,
    closeBundle() {
      const root = path.resolve(__dirname);
      const source = path.join(root, "campus");
      const dest = path.join(root, "dist/public/campus");
      if (!fs.existsSync(path.join(source, "index.html")) ||
          !fs.existsSync(path.join(source, "pratica-rapida.html"))) {
        throw new Error("Campus entrypoint or interactive practice is missing");
      }
      fs.cpSync(source, dest, {
        recursive: true,
        filter: (entry) => {
          const relative = path.relative(source, entry).split(path.sep);
          return !relative.some((part) => part === ".git" || part === "node_modules" || part.startsWith(".env"));
        },
      });
      const legacy = path.join(root, "campus.html");
      if (fs.existsSync(legacy)) {
        fs.copyFileSync(legacy, path.join(root, "dist/public/campus.html"));
      }
      for (const page of ["index.html", "pratica-rapida.html"]) {
        if (!fs.statSync(path.join(dest, page)).size) {
          throw new Error("Empty published campus page: " + page);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), publishStandaloneCampus()],
  root: "client",
  // MIARA lessons remain canonical in server/miara_content.json; allow this
  // specific sibling directory in dev rather than duplicating the dataset.
  server: {
    fs: { allow: [path.resolve(__dirname, "client"), path.resolve(__dirname, "server")] },
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
});
