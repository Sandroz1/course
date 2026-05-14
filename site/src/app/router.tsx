import { useEffect } from "react";

import { useAuth } from "../context/AuthContext";
import { BaseCppCoursePage } from "../pages/BaseCppCoursePage";
import { CommonErrorsPage } from "../pages/CommonErrorsPage";
import { CoursePage } from "../pages/CoursePage";
import { CourseIndexPage } from "../pages/CourseIndexPage";
import { CoursesPage } from "../pages/CoursesPage";
import { GuidePage } from "../pages/GuidePage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { TaskDetailsPage } from "../pages/TaskDetailsPage";
import { TasksIndexPage } from "../pages/TasksIndexPage";
import { navigateTo } from "../utils/navigation";

function ProtectedProfilePage() {
  const { accessToken } = useAuth();

  useEffect(() => {
    if (!accessToken) {
      navigateTo("/login", true);
    }
  }, [accessToken]);

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
  return <HomePage />;
}
