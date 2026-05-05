import { useEffect, useMemo, useState } from "react";
import type { HighlighterCore } from "shiki/core";

type CodeBlockProps = {
  code: string;
  language?: string;
};

type SupportedLanguage =
  | "cpp"
  | "ts"
  | "tsx"
  | "js"
  | "md"
  | "bash"
  | "powershell"
  | "cmake"
  | "xml"
  | "html"
  | "json";

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
      import("@shikijs/langs/cpp"),
      import("@shikijs/langs/typescript"),
      import("@shikijs/langs/tsx"),
      import("@shikijs/langs/javascript"),
      import("@shikijs/langs/markdown"),
      import("@shikijs/langs/bash"),
      import("@shikijs/langs/powershell"),
      import("@shikijs/langs/cmake"),
      import("@shikijs/langs/xml"),
      import("@shikijs/langs/html"),
      import("@shikijs/langs/json"),
      import("@shikijs/themes/dark-plus"),
    ]).then(
      ([
        { createHighlighterCore },
        { createJavaScriptRegexEngine },
        cpp,
        ts,
        tsx,
        js,
        md,
        bash,
        powershell,
        cmake,
        xml,
        html,
        json,
        darkPlus,
      ]) =>
        createHighlighterCore({
          themes: [darkPlus.default],
          langs: [
            cpp.default,
            ts.default,
            tsx.default,
            js.default,
            md.default,
            bash.default,
            powershell.default,
            cmake.default,
            xml.default,
            html.default,
            json.default,
          ],
          engine: createJavaScriptRegexEngine(),
        }),
    );
  }

  return highlighterPromise;
}

const languageMap: Record<string, SupportedLanguage> = {
  "c++": "cpp",
  cpp: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  cc: "cpp",
  ts: "ts",
  tsx: "tsx",
  typescript: "ts",
  javascript: "js",
  js: "js",
  markdown: "md",
  md: "md",
  bash: "bash",
  shell: "bash",
  powershell: "powershell",
  ps1: "powershell",
  cmake: "cmake",
  xml: "xml",
  html: "html",
  json: "json",
  text: "md",
  txt: "md",
};

const languageLabels: Record<string, string> = {
  "c++": "C++",
  cpp: "C++",
  cxx: "C++",
  hpp: "C++",
  ts: "TypeScript",
  tsx: "TSX",
  typescript: "TypeScript",
  javascript: "JavaScript",
  js: "JavaScript",
  markdown: "Markdown",
  md: "Markdown",
  bash: "Bash",
  shell: "Bash",
  powershell: "PowerShell",
  ps1: "PowerShell",
  cmake: "CMake",
  xml: "XML",
  html: "HTML",
  json: "JSON",
  text: "Text",
  txt: "Text",
};

function normalizeLanguage(language: string): SupportedLanguage {
  return languageMap[language.toLowerCase()] ?? "md";
}

function getLanguageLabel(language: string) {
  return languageLabels[language.toLowerCase()] ?? language.toUpperCase();
}

export function CodeBlock({ code, language = "cpp" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const normalizedLanguage = useMemo(() => normalizeLanguage(language), [language]);
  const languageLabel = useMemo(() => getLanguageLabel(language), [language]);

  useEffect(() => {
    let isMounted = true;

    getHighlighter()
      .then((highlighter) =>
        highlighter.codeToHtml(code, {
          lang: normalizedLanguage,
          theme: "dark-plus",
        }),
      )
      .then((html) => {
        if (isMounted) setHighlightedHtml(html);
      })
      .catch(() => {
        if (isMounted) setHighlightedHtml("");
      });

    return () => {
      isMounted = false;
    };
  }, [code, normalizedLanguage]);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span className="code-block__language">{languageLabel}</span>
        <button type="button" onClick={copyCode}>
          {copied ? "Скопировано" : "Скопировать"}
        </button>
      </div>
      {highlightedHtml ? (
        <div className="code-block__highlight" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      ) : (
        <pre className="code-block__pre code-block__pre--fallback">
          <code className="code-block__code">{code}</code>
        </pre>
      )}
    </div>
  );
}
