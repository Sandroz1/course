(function () {
  var segments = window.location.pathname.split("/").filter(Boolean);
  var isGitHubPages = window.location.hostname.endsWith(".github.io");
  var base = isGitHubPages && segments.length > 0 ? "/" + segments[0] + "/" : "/";
  var route = isGitHubPages ? "/" + segments.slice(1).join("/") : window.location.pathname;

  if (route === "/") {
    route = "/";
  }

  window.sessionStorage.setItem("spa-redirect", route + window.location.search + window.location.hash);
  window.sessionStorage.setItem("spa-redirect-base", base);
  window.location.replace(base);
})();
