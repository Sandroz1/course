export function toPath(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${normalized}`;
}

export function currentPath(): string {
  const base = import.meta.env.BASE_URL;
  let path = window.location.pathname;

  if (base !== "/" && path.startsWith(base)) {
    path = `/${path.slice(base.length)}`;
  }

  return path === "" ? "/" : path;
}
