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
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { TaskDetailsPage } from "../pages/TaskDetailsPage";
import { TasksIndexPage } from "../pages/TasksIndexPage";
import { navigateTo } from "../utils/navigation";
import { appRoutes, routePrefixes, stripRoutePrefix } from "./routes";

function ProtectedProfilePage() {
  const { accessToken, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !accessToken) {
      navigateTo(appRoutes.login, true);
    }
  }, [accessToken, isLoading]);

  if (isLoading) {
    return <ProfilePage />;
  }

  return accessToken ? <ProfilePage /> : <LoginPage />;
}

export function renderRoute(path: string) {
  if (path === appRoutes.home) return <HomePage />;
  if (path === appRoutes.login) return <LoginPage />;
  if (path === appRoutes.register) return <RegisterPage />;
  if (path === appRoutes.profile) return <ProtectedProfilePage />;
  if (path === appRoutes.courses) return <CoursesPage />;
  if (path === appRoutes.baseCppCourse) return <BaseCppCoursePage />;
  if (path.startsWith(routePrefixes.baseCppSection)) {
    return <CoursePage courseId="base-cpp" slug={stripRoutePrefix(path, routePrefixes.baseCppSection)} />;
  }
  if (path === appRoutes.oopCppCourse) return <CourseIndexPage courseId="oop-cpp" />;
  if (path.startsWith(routePrefixes.oopCppSection)) {
    return <CoursePage courseId="oop-cpp" slug={stripRoutePrefix(path, routePrefixes.oopCppSection)} />;
  }
  if (path === appRoutes.oopCppCourseAlias) return <CourseIndexPage courseId="oop-cpp" />;
  if (path.startsWith(routePrefixes.oopCppSectionAlias)) {
    return <CoursePage courseId="oop-cpp" slug={stripRoutePrefix(path, routePrefixes.oopCppSectionAlias)} />;
  }
  if (path === appRoutes.tasks) return <TasksIndexPage />;
  if (path.startsWith(routePrefixes.taskDetails)) {
    return <TaskDetailsPage taskId={stripRoutePrefix(path, routePrefixes.taskDetails)} />;
  }
  if (path === appRoutes.guide) return <GuidePage />;
  if (path === appRoutes.commonErrors) return <CommonErrorsPage />;
  return <NotFoundPage />;
}
