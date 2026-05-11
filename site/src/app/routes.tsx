import { lazy, useEffect } from "react";

import { useAuth } from "../context/AuthContext";
import { navigateTo } from "../utils/navigation";

const HomePage = lazy(() => import("../pages/HomePage").then(({ HomePage }) => ({ default: HomePage })));
const LoginPage = lazy(() => import("../pages/LoginPage").then(({ LoginPage }) => ({ default: LoginPage })));
const RegisterPage = lazy(() => import("../pages/RegisterPage").then(({ RegisterPage }) => ({ default: RegisterPage })));
const ProfilePage = lazy(() => import("../pages/ProfilePage").then(({ ProfilePage }) => ({ default: ProfilePage })));
const CoursesPage = lazy(() => import("../pages/CoursesPage").then(({ CoursesPage }) => ({ default: CoursesPage })));
const BaseCppCoursePage = lazy(() =>
  import("../pages/BaseCppCoursePage").then(({ BaseCppCoursePage }) => ({ default: BaseCppCoursePage })),
);
const CourseIndexPage = lazy(() => import("../pages/CourseIndexPage").then(({ CourseIndexPage }) => ({ default: CourseIndexPage })));
const CoursePage = lazy(() => import("../components/CoursePage/CoursePage").then(({ CoursePage }) => ({ default: CoursePage })));
const TasksIndexPage = lazy(() => import("../pages/TasksIndexPage").then(({ TasksIndexPage }) => ({ default: TasksIndexPage })));
const TaskDetailsPage = lazy(() => import("../pages/TaskDetailsPage").then(({ TaskDetailsPage }) => ({ default: TaskDetailsPage })));
const GuidePage = lazy(() => import("../pages/GuidePage").then(({ GuidePage }) => ({ default: GuidePage })));
const CommonErrorsPage = lazy(() => import("../pages/CommonErrorsPage").then(({ CommonErrorsPage }) => ({ default: CommonErrorsPage })));
const SelfCheckPage = lazy(() => import("../pages/SelfCheckPage").then(({ SelfCheckPage }) => ({ default: SelfCheckPage })));

function ProtectedProfilePage() {
  const { accessToken, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !accessToken) {
      navigateTo("/login", true);
    }
  }, [accessToken, isLoading]);

  if (isLoading) {
    return (
      <article className="reading-page compact-page">
        <section className="panel">
          <p>Проверяем вход...</p>
        </section>
      </article>
    );
  }

  return accessToken ? <ProfilePage /> : <LoginPage />;
}

export function renderRoute(path: string) {
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
