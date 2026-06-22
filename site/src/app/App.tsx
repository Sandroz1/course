import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { currentPath } from "../utils/slug";
import { appRoutes } from "./routes";
import { renderRoute } from "./router";

export default function App() {
  const [path, setPath] = useState(currentPath());

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const link = target?.closest("a");
      if (!link) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;

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

  if (path === appRoutes.home) {
    return renderRoute(path);
  }

  return <AppLayout>{renderRoute(path)}</AppLayout>;
}
