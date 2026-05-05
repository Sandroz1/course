import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { CoursePage } from "./components/CoursePage";
import { HomePage } from "./pages/HomePage";
import { CourseIndexPage } from "./pages/CourseIndexPage";
import { TasksIndexPage } from "./pages/TasksIndexPage";
import { TaskDetailsPage } from "./pages/TaskDetailsPage";
import { SelfCheckPage } from "./pages/SelfCheckPage";
import { GuidePage } from "./pages/GuidePage";
import { CommonErrorsPage } from "./pages/CommonErrorsPage";
import { currentPath } from "./utils/slug";

function renderRoute(path: string) {
  if (path === "/") return <HomePage />;
  if (path === "/course") return <CourseIndexPage />;
  if (path.startsWith("/course/")) {
    return <CoursePage slug={path.replace("/course/", "")} />;
  }
  if (path === "/tasks") return <TasksIndexPage />;
  if (path.startsWith("/tasks/")) {
    return <TaskDetailsPage taskId={path.replace("/tasks/", "")} />;
  }
  if (path === "/guide") return <GuidePage />;
  if (path === "/common-errors") return <CommonErrorsPage />;
  if (path === "/check") return <SelfCheckPage />;
  return <HomePage />;
}

export default function App() {
  const [path, setPath] = useState(currentPath());

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a");
      if (!link) return;

      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;
      if (url.hash && !url.hash.startsWith("#/")) return;

      event.preventDefault();
      window.history.pushState({}, "", `${url.pathname}${url.search}`);
      setPath(currentPath());
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const onHashChange = () => setPath(currentPath());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return <Layout>{renderRoute(path)}</Layout>;
}
