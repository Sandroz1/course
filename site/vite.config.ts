import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_API_BASE_URL = "/api";
const DEFAULT_DEV_API_PROXY_TARGET = "http://127.0.0.1:8000";

export default defineConfig(({ command }) => {
  const productionApiBaseUrl =
    command === "build" ? process.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL : undefined;
  const devApiProxyTarget = process.env.DEV_API_PROXY_TARGET?.trim() || DEFAULT_DEV_API_PROXY_TARGET;

  return {
    plugins: [react()],
    base: "/",
    define: productionApiBaseUrl
      ? {
          "import.meta.env.VITE_API_BASE_URL": JSON.stringify(productionApiBaseUrl),
        }
      : undefined,
    server: {
      proxy: {
        "/api": devApiProxyTarget,
        "/admin": devApiProxyTarget,
        "/static": devApiProxyTarget,
        "/media": devApiProxyTarget,
      },
    },
    build: {
      emptyOutDir: true,
      // The C++ grammar is an intentional lazy Shiki chunk. Keep the warning
      // useful for app/page bundles while accepting that grammar payload.
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return undefined;
            }

            if (id.includes("@shikijs/langs/dist/cpp.mjs")) return "shiki-lang-cpp";
            if (id.includes("@shikijs/langs/dist/cpp-macro.mjs")) return "shiki-lang-cpp-macro";
            if (id.includes("@shikijs/langs/dist/regexp.mjs")) return "shiki-lang-regexp";
            if (id.includes("@shikijs/langs/dist/glsl.mjs")) return "shiki-lang-glsl";
            if (id.includes("@shikijs/langs/dist/sql.mjs")) return "shiki-lang-sql";
            if (id.includes("@shikijs/langs/dist/typescript.mjs")) return "shiki-lang-typescript";
            if (id.includes("@shikijs/langs/dist/tsx.mjs")) return "shiki-lang-tsx";
            if (id.includes("@shikijs/langs/dist/javascript.mjs")) return "shiki-lang-javascript";
            if (id.includes("@shikijs/langs/dist/markdown.mjs")) return "shiki-lang-markdown";
            if (id.includes("@shikijs/langs/dist/bash.mjs")) return "shiki-lang-bash";
            if (id.includes("@shikijs/langs/dist/powershell.mjs")) return "shiki-lang-powershell";
            if (id.includes("@shikijs/langs/dist/cmake.mjs")) return "shiki-lang-cmake";
            if (id.includes("@shikijs/langs/dist/xml.mjs")) return "shiki-lang-xml";
            if (id.includes("@shikijs/langs/dist/html.mjs")) return "shiki-lang-html";
            if (id.includes("@shikijs/langs/dist/json.mjs")) return "shiki-lang-json";
            if (id.includes("@shikijs/themes")) return "shiki-themes";
            if (id.includes("@shikijs/engine") || id.includes("shiki/engine")) return "shiki-engine";
            if (id.includes("@shikijs") || id.includes("node_modules/shiki")) return "shiki-core";
            if (id.includes("react") || id.includes("scheduler")) return "react-vendor";

            return undefined;
          },
        },
      },
    },
  };
});
