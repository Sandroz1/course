import { useEffect, useMemo, useState } from "react";
import type { HighlighterCore, LanguageInput } from "shiki/core";

import clsx from "clsx";
import styles from "./CodeBlock.module.scss";

type CodeBlockProps = {
  code: string;
  language?: string;
  compact?: boolean;
};

type CopyState = "idle" | "copied" | "failed";

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
const languageLoadPromises = new Map<SupportedLanguage, Promise<void>>();

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
      import("@shikijs/themes/dark-plus"),
    ]).then(
      ([
        { createHighlighterCore },
        { createJavaScriptRegexEngine },
        darkPlus,
      ]) =>
        createHighlighterCore({
          themes: [darkPlus.default],
          langs: [],
          engine: createJavaScriptRegexEngine(),
        }),
    );
  }

  return highlighterPromise;
}

const languageLoaders: Record<SupportedLanguage, LanguageInput> = {
  cpp: () => import("@shikijs/langs/cpp"),
  ts: () => import("@shikijs/langs/typescript"),
  tsx: () => import("@shikijs/langs/tsx"),
  js: () => import("@shikijs/langs/javascript"),
  md: () => import("@shikijs/langs/markdown"),
  bash: () => import("@shikijs/langs/bash"),
  powershell: () => import("@shikijs/langs/powershell"),
  cmake: () => import("@shikijs/langs/cmake"),
  xml: () => import("@shikijs/langs/xml"),
  html: () => import("@shikijs/langs/html"),
  json: () => import("@shikijs/langs/json"),
};

async function getHighlighterForLanguage(language: SupportedLanguage) {
  const highlighter = await getHighlighter();
  const loadedLanguages = highlighter.getLoadedLanguages();

  if (loadedLanguages.includes(language)) {
    return highlighter;
  }

  if (!languageLoadPromises.has(language)) {
    languageLoadPromises.set(
      language,
      highlighter.loadLanguage(languageLoaders[language]).catch((error: unknown) => {
        languageLoadPromises.delete(language);
        throw error;
      }),
    );
  }

  await languageLoadPromises.get(language);

  return highlighter;
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

export function CodeBlock({ code, language = "cpp", compact = false }: CodeBlockProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const normalizedLanguage = useMemo(() => normalizeLanguage(language), [language]);
  const languageLabel = useMemo(() => getLanguageLabel(language), [language]);

  useEffect(() => {
    let isMounted = true;

    getHighlighterForLanguage(normalizedLanguage)
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
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    window.setTimeout(() => setCopyState("idle"), 1200);
  }

  const copyButtonText =
    copyState === "copied"
      ? "Скопировано"
      : copyState === "failed"
        ? "Не удалось скопировать"
        : "Скопировать";

  return (
    <div className={clsx(styles.root, compact && styles.compact)}>
      <div className={styles.bar}>
        <span className={styles.language}>{languageLabel}</span>
        <button
          className={styles.copyButton}
          type="button"
          onClick={copyCode}
          aria-live="polite"
        >
          {copyButtonText}
        </button>
      </div>
      {highlightedHtml ? (
        <div className={styles.highlight} dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      ) : (
        <pre className={clsx(styles.pre, styles.preFallback)}>
          <code className={styles.code}>{code}</code>
        </pre>
      )}
    </div>
  );
}
