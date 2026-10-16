import { defineConfig } from "vite";
export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? "/my-website/" : "/",
  define: {
    "import.meta.env.VITE_BROWSER_DEMO": JSON.stringify(
      mode === "pages" ? "true" : "false",
    ),
  },
  build: { outDir: mode === "pages" ? "dist-pages" : "dist" },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:3001" },
  },
  preview: { host: "0.0.0.0" },
}));
