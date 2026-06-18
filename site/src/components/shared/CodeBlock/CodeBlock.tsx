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

const safeHighlightTags = new Set(["PRE", "CODE", "SPAN"]);
const safeClassNamePattern = /^[a-z0-9_:\-\s]+$/i;
const safeColorPattern = /^(#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\)|hsla?\([0-9.,%\s]+\)|[a-z]+)$/i;
const safeStyleProperties = new Set([
  "background-color",
  "color",
  "font-style",
  "font-weight",
  "text-decoration",
]);

function isSafeStyleValue(property: string, value: string) {
  if (!value || /url\s*\(|expression\s*\(|javascript:/i.test(value)) return false;
  if (property === "background-color" || property === "color") return safeColorPattern.test(value);
  if (property === "font-style") return /^(normal|italic|oblique)$/i.test(value);
  if (property === "font-weight") return /^(normal|bold|[1-9]00)$/i.test(value);
  if (property === "text-decoration") return /^[a-z\s-]+$/i.test(value);

  return false;
}

function sanitizeStyleAttribute(style: string | null) {
  if (!style) return "";

  const probe = document.createElement("span");
  probe.setAttribute("style", style);

  return Array.from(safeStyleProperties)
    .map((property) => {
      const value = probe.style.getPropertyValue(property).trim();
      return isSafeStyleValue(property, value) ? `${property}: ${value}` : "";
    })
    .filter(Boolean)
    .join("; ");
}

function sanitizeHighlightedNode(node: Node): Node {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent ?? "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return document.createTextNode("");
  }

  const element = node as HTMLElement;

  if (!safeHighlightTags.has(element.tagName)) {
    const fragment = document.createDocumentFragment();
    Array.from(element.childNodes).forEach((child) => {
      fragment.appendChild(sanitizeHighlightedNode(child));
    });
    return fragment;
  }

  const safeElement = document.createElement(element.tagName.toLowerCase());
  const className = element.getAttribute("class");
  const style = sanitizeStyleAttribute(element.getAttribute("style"));

  if (className && safeClassNamePattern.test(className)) {
    safeElement.setAttribute("class", className);
  }

  if (style) {
    safeElement.setAttribute("style", style);
  }

  if (element.tagName === "PRE") {
    const tabIndex = element.getAttribute("tabindex");
    if (tabIndex === "0" || tabIndex === "-1") {
      safeElement.setAttribute("tabindex", tabIndex);
    }
  }

  Array.from(element.childNodes).forEach((child) => {
    safeElement.appendChild(sanitizeHighlightedNode(child));
  });

  return safeElement;
}

function sanitizeHighlightedHtml(html: string) {
  if (typeof DOMParser === "undefined") return "";

  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, "text/html");
  const container = document.createElement("div");

  Array.from(parsed.body.childNodes).forEach((child) => {
    container.appendChild(sanitizeHighlightedNode(child));
  });

  return container.innerHTML;
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
        if (isMounted) setHighlightedHtml(sanitizeHighlightedHtml(html));
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
        ? "Ошибка"
        : "Скопировать";

  return (
    <div className={clsx(styles.root, compact && styles.compact)}>
      <div className={styles.bar}>
        <span className={styles.language}>{languageLabel}</span>
        <div className={styles.actions}>
          <button
            className={styles.copyButton}
            type="button"
            onClick={copyCode}
            aria-live="polite"
          >
            {copyButtonText}
          </button>
        </div>
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
