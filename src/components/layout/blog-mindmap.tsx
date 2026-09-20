"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Expand, X } from "lucide-react";
import { useTheme } from "next-themes";
import type { ForceGraphMethods } from "react-force-graph-2d";
import { Button } from "@/components/ui/button";
import { useIsMounted } from "@/hooks/use-is-mounted";
import type { BlogLink } from "@/lib/blog-types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

type MindMapNode = {
  id: string;
  label: string;
  kind: "root" | "category" | "post";
  slug?: string;
};

type MindMapLink = {
  source: string;
  target: string;
};

type GraphNode = MindMapNode & {
  fx?: number;
  fy?: number;
  x?: number;
  y?: number;
};

export function BlogMindmap({
  currentSlug,
  links,
}: {
  currentSlug: string;
  links: BlogLink[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const mounted = useIsMounted();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const data = useMemo(() => {
    const nodes: MindMapNode[] = [{ id: "root", label: "Blogs", kind: "root" }];
    const edges: MindMapLink[] = [];
    const seenCategories = new Set<string>();

    for (const post of links) {
      const categoryId = `category:${post.category}`;
      if (!seenCategories.has(categoryId)) {
        seenCategories.add(categoryId);
        nodes.push({ id: categoryId, label: post.category, kind: "category" });
        edges.push({ source: "root", target: categoryId });
      }

      const postSlug = post.href.replace(/^\//, "");
      const postId = `post:${postSlug}`;
      nodes.push({
        id: postId,
        label: post.title,
        kind: "post",
        slug: postSlug,
      });
      edges.push({ source: categoryId, target: postId });
    }

    return { links: edges, nodes };
  }, [links]);

  const onNodeClick = useCallback(
    (node: object) => {
      const typed = node as MindMapNode;
      if (!typed.slug) return;
      setExpanded(false);
      router.push(`/${typed.slug}`);
    },
    [router],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
          Blog web
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-neutral-500 hover:text-neutral-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          aria-label="Expand blog web"
          onClick={() => setExpanded(true)}
        >
          <Expand className="size-4" />
        </Button>
      </div>
      <MindMapCanvas
        className="h-72"
        currentSlug={currentSlug}
        data={data}
        isDark={isDark}
        onNodeClick={onNodeClick}
      />

      {mounted && expanded
        ? createPortal(
            <div
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 p-4 backdrop-blur-md"
              onClick={() => setExpanded(false)}
            >
              <div
                className="relative h-[80vh] w-[min(1200px,96vw)] rounded-xl border border-neutral-300 bg-white p-3 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
                onClick={(event) => event.stopPropagation()}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-3 z-10 size-8 text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  aria-label="Close expanded blog web"
                  onClick={() => setExpanded(false)}
                >
                  <X className="size-4" />
                </Button>
                <MindMapCanvas
                  className="h-full"
                  currentSlug={currentSlug}
                  data={data}
                  isDark={isDark}
                  onNodeClick={onNodeClick}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function MindMapCanvas({
  className,
  currentSlug,
  data,
  isDark,
  onNodeClick,
}: {
  className: string;
  currentSlug: string;
  data: { nodes: MindMapNode[]; links: MindMapLink[] };
  isDark: boolean;
  onNodeClick: (node: object) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [size, setSize] = useState({ height: 0, width: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zoomK, setZoomK] = useState(1);

  const getNodeRadius = useCallback(
    (node: GraphNode) => {
      if (node.kind === "root") return 5.6;
      if (node.kind === "category") return 4.8;
      if (node.slug === currentSlug) return 4.1;
      return 3.3;
    },
    [currentSlug],
  );

  const getLabelFontSize = useCallback((node: GraphNode, scale: number) => {
    const baseSize =
      node.kind === "root" ? 14 : node.kind === "category" ? 12 : 11;
    return Math.max(3, baseSize / Math.pow(scale, 0.92));
  }, []);

  const setCursor = useCallback((cursor: string) => {
    if (!containerRef.current) return;
    containerRef.current.style.cursor = cursor;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      setSize({
        width: Math.max(0, Math.floor(rect?.width ?? 0)),
        height: Math.max(0, Math.floor(rect?.height ?? 0)),
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    const linkForce = graph?.d3Force?.("link");
    if (!linkForce) return;

    const zoomFactor = Math.min(1.9, Math.max(0.75, Math.pow(zoomK, 0.45)));
    linkForce.distance((link: { source: { id?: string } }) => {
      const sourceId = link.source?.id;
      if (sourceId === "root") return 95 * zoomFactor;
      return 72 * zoomFactor;
    });
    graph?.d3ReheatSimulation();
  }, [zoomK]);

  return (
    <div
      ref={containerRef}
      className={`${className} w-full overflow-hidden rounded-md border border-neutral-200/70 bg-neutral-50/40 dark:border-zinc-800 dark:bg-zinc-900/20 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
    >
      {size.width > 0 && size.height > 0 ? (
        <ForceGraph2D
          ref={graphRef}
          width={size.width}
          height={size.height}
          graphData={data}
          cooldownTicks={90}
          d3AlphaDecay={0.03}
          autoPauseRedraw={false}
          enableNodeDrag
          enablePanInteraction
          showPointerCursor={(object) => Boolean(object)}
          nodeRelSize={5}
          onZoom={({ k }) => setZoomK(k)}
          nodeColor={(node) => {
            const typed = node as MindMapNode;
            if (typed.kind === "root") return isDark ? "#ffffff" : "#111827";
            if (typed.slug === currentSlug)
              return isDark ? "#ffffff" : "#0b1220";
            if (typed.kind === "category")
              return isDark ? "#9ca3af" : "#1f2937";
            return isDark ? "#737b89" : "#111827";
          }}
          linkColor={() =>
            isDark ? "rgba(120,126,139,0.45)" : "rgba(31,41,55,0.38)"
          }
          linkWidth={(link) =>
            (link as { source: { id?: string } }).source?.id === "root"
              ? 1.15
              : 0.95
          }
          onNodeHover={(node) => {
            if (isDragging) return;
            setCursor(node ? "grab" : "default");
          }}
          nodePointerAreaPaint={(node, color, ctx, scale) => {
            const typed = node as GraphNode;
            const x = typed.x ?? 0;
            const y = typed.y ?? 0;
            const radius = getNodeRadius(typed) + 6 / Math.max(1, scale);
            ctx.fillStyle = color;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
            ctx.fill();

            const fontSize = getLabelFontSize(typed, scale);
            ctx.font = `${fontSize}px var(--font-geist-sans), system-ui, sans-serif`;
            const textWidth = ctx.measureText(typed.label).width;
            const boxHeight = fontSize + 6;
            const boxX = x + radius + 1;
            const boxY = y - boxHeight / 2;

            ctx.fillRect(boxX, boxY, textWidth + 6, boxHeight);
          }}
          onNodeDrag={(node) => {
            setIsDragging(true);
            setCursor("grabbing");
            const typed = node as GraphNode;
            typed.fx = typed.x;
            typed.fy = typed.y;
          }}
          onNodeDragEnd={(node) => {
            setIsDragging(false);
            setCursor("grab");
            const typed = node as GraphNode;
            typed.fx = undefined;
            typed.fy = undefined;
          }}
          onNodeClick={onNodeClick}
          nodeCanvasObject={(node, ctx, scale) => {
            const typed = node as GraphNode;
            const x = typed.x ?? 0;
            const y = typed.y ?? 0;
            const radius = getNodeRadius(typed);
            const fontSize = getLabelFontSize(typed, scale);
            const isActive = typed.slug === currentSlug;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle =
              typed.kind === "root" || isActive
                ? isDark
                  ? "#ffffff"
                  : "#0f172a"
                : isDark
                  ? "rgba(146,154,170,0.9)"
                  : "rgba(31,41,55,0.94)";
            ctx.fill();

            if (typed.kind === "root") {
              ctx.beginPath();
              ctx.arc(x, y, radius + 3.2, 0, 2 * Math.PI, false);
              ctx.strokeStyle = isDark
                ? "rgba(255,255,255,0.45)"
                : "rgba(17,24,39,0.32)";
              ctx.lineWidth = 1.2;
              ctx.stroke();
            }

            ctx.font = `${fontSize}px var(--font-geist-sans), system-ui, sans-serif`;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = isActive
              ? isDark
                ? "#ffffff"
                : "#111827"
              : isDark
                ? "rgba(148,153,165,0.95)"
                : "rgba(31,41,55,0.95)";
            if (typed.kind === "category") {
              ctx.fillStyle = isDark
                ? "rgba(217,223,231,0.95)"
                : "rgba(17,24,39,0.92)";
            }
            if (typed.kind === "root") {
              ctx.fillStyle = isDark
                ? "rgba(255,255,255,0.95)"
                : "rgba(17,24,39,0.95)";
            }

            ctx.fillText(typed.label, x + radius + 4, y);
          }}
        />
      ) : null}
    </div>
  );
}
