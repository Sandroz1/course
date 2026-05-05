import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Для GitHub Pages замените REPLACE_WITH_REPOSITORY_NAME на имя репозитория.
// Например, если репозиторий называется oop-cpp-course:
// const repoName = "oop-cpp-course";
const repoName = "REPLACE_WITH_REPOSITORY_NAME";
const hasRealRepoName = repoName !== "REPLACE_WITH_REPOSITORY_NAME";

export default defineConfig({
  plugins: [react()],
  base:
    process.env.GITHUB_PAGES === "true" && hasRealRepoName
      ? `/${repoName}/`
      : "/",
});
