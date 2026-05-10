import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { CoursePage } from "./components/CoursePage";
import { useAuth } from "./context/AuthContext";
import { HomePage } from "./pages/HomePage";
import { BaseCppCoursePage } from "./pages/BaseCppCoursePage";
import { CourseIndexPage } from "./pages/CourseIndexPage";
import { CoursesPage } from "./pages/CoursesPage";
import { TasksIndexPage } from "./pages/TasksIndexPage";
import { TaskDetailsPage } from "./pages/TaskDetailsPage";
import { SelfCheckPage } from "./pages/SelfCheckPage";
import { GuidePage } from "./pages/GuidePage";
import { CommonErrorsPage } from "./pages/CommonErrorsPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { navigateTo } from "./utils/navigation";
import { currentPath } from "./utils/slug";

function ProtectedProfilePage() {
  const { accessToken, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !accessToken) {
      navigateTo("/login", true);
    }
  }, [accessToken, isLoading]);

  if (isLoading) {
    return (
      <article className="reading-page compact-page auth-page">
        <section className="panel auth-card">
          <p>Проверяем вход...</p>
        </section>
      </article>
    );
  }

  return accessToken ? <ProfilePage /> : null;
}

function renderRoute(path: string) {
  if (path === "/") return <HomePage />;
  if (path === "/login") return <LoginPage />;
  if (path === "/register") return <RegisterPage />;
  if (path === "/profile") return <ProtectedProfilePage />;
  if (path === "/courses") return <CoursesPage />;
  if (path === "/courses/base-cpp") return <BaseCppCoursePage />;
  if (path === "/courses/oop-cpp") return <CourseIndexPage />;
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
