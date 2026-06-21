import { lazy, useEffect } from "react";

import { useAuth } from "../context/AuthContext";
import { navigateTo } from "../utils/navigation";
import { appRoutes, routePrefixes, stripRoutePrefix } from "./routes";

const BaseCppCoursePage = lazy(() =>
  import("../pages/BaseCppCoursePage").then(({ BaseCppCoursePage }) => ({ default: BaseCppCoursePage })),
);
const CommonErrorsPage = lazy(() =>
  import("../pages/CommonErrorsPage").then(({ CommonErrorsPage }) => ({ default: CommonErrorsPage })),
);
const CoursePage = lazy(() => import("../pages/CoursePage").then(({ CoursePage }) => ({ default: CoursePage })));
const CourseIndexPage = lazy(() =>
  import("../pages/CourseIndexPage").then(({ CourseIndexPage }) => ({ default: CourseIndexPage })),
);
const CoursesPage = lazy(() => import("../pages/CoursesPage").then(({ CoursesPage }) => ({ default: CoursesPage })));
const GuidePage = lazy(() => import("../pages/GuidePage").then(({ GuidePage }) => ({ default: GuidePage })));
const HomePage = lazy(() => import("../pages/HomePage").then(({ HomePage }) => ({ default: HomePage })));
const LoginPage = lazy(() => import("../pages/LoginPage").then(({ LoginPage }) => ({ default: LoginPage })));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage").then(({ NotFoundPage }) => ({ default: NotFoundPage })));
const ProfilePage = lazy(() => import("../pages/ProfilePage").then(({ ProfilePage }) => ({ default: ProfilePage })));
const RegisterPage = lazy(() => import("../pages/RegisterPage").then(({ RegisterPage }) => ({ default: RegisterPage })));
const TaskDetailsPage = lazy(() =>
  import("../pages/TaskDetailsPage").then(({ TaskDetailsPage }) => ({ default: TaskDetailsPage })),
);
const TasksIndexPage = lazy(() =>
  import("../pages/TasksIndexPage").then(({ TasksIndexPage }) => ({ default: TasksIndexPage })),
);

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
