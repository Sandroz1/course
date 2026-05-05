import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Репозиторий: https://github.com/Sandroz1/course
const repoName = "course";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === "true" ? `/${repoName}/` : "/",
});
