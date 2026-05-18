(function () {
  try {
    var themePreference = window.localStorage.getItem("cppLearnTheme") || "system";
    var resolvedTheme = themePreference;

    if (themePreference === "system") {
      resolvedTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }

    if (["light", "dark", "deep-dark", "blue"].indexOf(resolvedTheme) === -1) {
      resolvedTheme = "dark";
      themePreference = "system";
    }

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.themePreference = themePreference;
    document.documentElement.style.colorScheme = resolvedTheme === "light" ? "light" : "dark";
  } catch (error) {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.dataset.themePreference = "system";
  }

  var redirect = window.sessionStorage.getItem("spa-redirect");

  if (redirect) {
    window.sessionStorage.removeItem("spa-redirect");
    var redirectBase = window.sessionStorage.getItem("spa-redirect-base") || "/";
    window.sessionStorage.removeItem("spa-redirect-base");
    var normalizedBase = redirectBase.endsWith("/") ? redirectBase : redirectBase + "/";
    var cleanPath = redirect === "/" ? normalizedBase : normalizedBase + redirect.replace(/^\//, "");
    window.history.replaceState(null, "", cleanPath);
    return;
  }

  if (window.location.hash.startsWith("#/")) {
    var route = window.location.hash.slice(1);
    var basePath = window.location.pathname.endsWith("/")
      ? window.location.pathname
      : window.location.pathname + "/";
    var nextPath = route === "/" ? basePath : basePath + route.replace(/^\//, "");
    window.history.replaceState(null, "", nextPath + window.location.search);
  }
})();
