"use client";

import React, { useState, useCallback, memo, startTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlogCategory } from "@/lib/blog-types";
import { BookOpen, Compass, Layers, CircuitBoard } from "lucide-react";

type SidebarLinkItem = {
  name: string;
  href: string;
  isNew?: boolean;
  external?: boolean;
};

const SidebarItem = memo(function SidebarItem({
  item,
  isActive,
  isHovered,
  onHover,
}: {
  item: SidebarLinkItem;
  isActive: boolean;
  isHovered: boolean;
  onHover: (href: string) => void;
}) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (item.external) return;
      e.preventDefault();
      startTransition(() => {
        router.push(item.href);
      });
    },
    [item.external, router, item.href],
  );

  return (
    <div onMouseEnter={() => onHover(item.href)} className="relative">
      {isActive && (
        <div className="absolute inset-0 z-0 rounded-md bg-neutral-100 dark:bg-zinc-800/80" />
      )}
      {isHovered && (
        <motion.div
          layoutId="sidebar-hover-bg"
          className="absolute inset-0 z-0 rounded-md bg-neutral-100 dark:bg-zinc-800/40"
          transition={{ type: "spring", stiffness: 600, damping: 35 }}
        />
      )}
      <Link
        href={item.href}
        onClick={item.external ? undefined : handleClick}
        prefetch={item.external ? false : true}
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noopener noreferrer" : undefined}
        className={cn(
          "relative z-10 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
          isActive
            ? "font-medium text-neutral-900 dark:text-white"
            : "text-neutral-500 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-200",
        )}
      >
        <span className="truncate">{item.name}</span>
        {item.isNew && (
          <span className="ml-2 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-emerald-500 dark:text-emerald-400">
            New
          </span>
        )}
      </Link>
    </div>
  );
});

function SidebarSection({
  id,
  name,
  iconSrc,
  icon: Icon,
  items,
  hoveredPath,
  pathname,
  onHover,
  isCollapsed,
  onToggle,
}: {
  id: string;
  name: string;
  iconSrc: string;
  icon: LucideIcon;
  items: SidebarLinkItem[];
  hoveredPath: string | null;
  pathname: string;
  onHover: (href: string) => void;
  isCollapsed: boolean;
  onToggle: (sectionId: string) => void;
}) {
  const [iconFailed, setIconFailed] = useState(false);
  const isSectionActive = items.some((item) => {
    if (item.external) return false;
    return pathname === item.href;
  });
  const isExpanded = !isCollapsed;

  return (
    <div
      className={cn(
        "flex flex-col transition-[margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isExpanded ? "mb-4" : "mb-1.5",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm font-medium transition-colors",
          isSectionActive
            ? "bg-neutral-100 text-neutral-900 dark:bg-zinc-800/80 dark:text-zinc-100"
            : "text-neutral-600 hover:bg-neutral-100 dark:text-zinc-300 dark:hover:bg-zinc-800/40",
        )}
      >
        {iconFailed ? (
          <Icon className="h-5 w-5" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconSrc}
            alt={`${name} icon`}
            className="h-5 w-5 object-contain [filter:brightness(0)] dark:[filter:brightness(0)_invert(1)]"
            onError={() => setIconFailed(true)}
          />
        )}
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <ChevronUp
          className={cn(
            "h-3.5 w-3.5 text-neutral-400 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:text-zinc-500",
            isExpanded ? "rotate-0" : "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "mt-1 grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="ml-4 overflow-hidden border-l border-neutral-200 pl-2 dark:border-[#222]/80">
          <div className="flex flex-col space-y-0.5">
            {items.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                isActive={!item.external && pathname === item.href}
                isHovered={hoveredPath === item.href}
                onHover={onHover}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ categories }: { categories: BlogCategory[] }) {
  const pathname = usePathname();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(),
  );

  const handleHover = useCallback((href: string) => {
    setHoveredPath(href);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredPath(null);
  }, []);

  const handleToggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  return (
    <div className="w-full pb-8" onMouseLeave={handleMouseLeave}>
      {categories.map((category, index) => (
        <SidebarSection
          id={category.slug}
          key={category.slug}
          name={category.name}
          iconSrc={`/${category.slug}/${category.slug}.svg`}
          icon={[Compass, BookOpen, Layers, CircuitBoard][index % 4]}
          items={category.items.map((post) => ({
            name: post.title,
            href: post.href,
            isNew: post.isNew,
          }))}
          hoveredPath={hoveredPath}
          pathname={pathname}
          onHover={handleHover}
          isCollapsed={collapsedSections.has(category.slug)}
          onToggle={handleToggleSection}
        />
      ))}
      {categories.length === 0 ? (
        <p className="px-2 text-sm text-neutral-500 dark:text-zinc-400">
          No blog files found in content/blog.
        </p>
      ) : null}
    </div>
  );
}
