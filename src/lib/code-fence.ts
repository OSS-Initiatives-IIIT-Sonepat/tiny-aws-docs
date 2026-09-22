export function parseCodeFence(className?: string): {
  language?: string;
  filePath?: string;
} {
  if (!className?.startsWith("language-")) {
    return {};
  }

  const raw = className.replace("language-", "").trim();
  if (!raw) {
    return {};
  }

  if (raw.includes("|")) {
    const [language, filePath] = raw.split("|", 2);
    return {
      language: language || undefined,
      filePath: filePath || undefined,
    };
  }

  if (raw.includes("/") || /\.[a-z0-9]+$/i.test(raw)) {
    return { filePath: raw };
  }

  return { language: raw };
}
