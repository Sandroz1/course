export const appRoutes = {
  home: "/",
  login: "/login",
  register: "/register",
  profile: "/profile",
  courses: "/courses",
  baseCppCourse: "/courses/base-cpp",
  oopCppCourse: "/courses/oop-cpp",
  oopCppCourseAlias: "/course",
  tasks: "/tasks",
  guide: "/guide",
  commonErrors: "/common-errors",
} as const;

export const routePrefixes = {
  baseCppSection: `${appRoutes.baseCppCourse}/`,
  oopCppSection: `${appRoutes.oopCppCourse}/`,
  oopCppSectionAlias: `${appRoutes.oopCppCourseAlias}/`,
  taskDetails: `${appRoutes.tasks}/`,
} as const;

export function stripRoutePrefix(path: string, prefix: string) {
  return path.slice(prefix.length);
}
