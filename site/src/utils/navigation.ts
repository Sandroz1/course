import { toPath } from "./slug";

export function navigateTo(path: string, replace = false) {
  const nextPath = toPath(path);

  if (replace) {
    window.history.replaceState({}, "", nextPath);
  } else {
    window.history.pushState({}, "", nextPath);
  }

  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
