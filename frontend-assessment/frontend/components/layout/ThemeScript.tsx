import { THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeScript() {
  const script = `
(function () {
  try {
    var storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    var stored = localStorage.getItem(storageKey);
    var theme =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();
`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
