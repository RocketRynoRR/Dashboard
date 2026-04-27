(function () {
  const storedTheme = window.localStorage.getItem("dashboard-theme");
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const theme = storedTheme || (prefersDark ? "dark" : "light");

  document.documentElement.dataset.theme = theme;
})();
