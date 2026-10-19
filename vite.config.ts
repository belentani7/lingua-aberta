import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
