import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Репозиторий: https://github.com/Sandroz1/c-
const repoName = "c-";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === "true" ? `/${repoName}/` : "/",
});
