"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";

type MermaidDiagramProps = {
  chart: string;
};

function sanitizeSvg(svg: string) {
  return svg
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chartId = useId().replace(/:/g, "");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          securityLevel: "loose",
          startOnLoad: false,
          theme: "base",
          darkMode: isDark,
          themeVariables: {
            background: isDark ? "#09090b" : "#ffffff",
            primaryColor: isDark ? "#111827" : "#f8fafc",
            primaryTextColor: isDark ? "#e5e7eb" : "#111827",
            primaryBorderColor: isDark ? "#4b5563" : "#374151",
            lineColor: isDark ? "#9ca3af" : "#1f2937",
            tertiaryColor: isDark ? "#0f172a" : "#f3f4f6",
          },
        });

        const result = await mermaid.render(`mermaid-${chartId}`, chart);

        if (!cancelled) {
          setSvg(sanitizeSvg(result.svg));
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setSvg(null);
          setError("Could not render mermaid diagram.");
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [chart, chartId, isDark]);

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="rounded-md border border-neutral-200 px-4 py-3 text-sm text-neutral-500 dark:border-zinc-800 dark:text-zinc-400">
        Rendering diagram...
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-md border border-neutral-300 bg-white p-4 shadow-[0_18px_44px_rgba(15,15,18,0.12)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_18px_44px_rgba(0,0,0,0.45)]"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
