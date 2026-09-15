import * as React from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

export function BlogArticle({ children }: { children: React.ReactNode }) {
  return (
    <article className="space-y-10 pb-24 text-neutral-900 dark:text-zinc-100">
      {children}
    </article>
  );
}

export function BlogHeader({
  title,
  description,
  meta,
  titleAside,
}: {
  title: string;
  description: string;
  meta?: React.ReactNode;
  titleAside?: React.ReactNode;
}) {
  return (
    <header className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-950 dark:text-white">
          {title}
        </h1>
        {titleAside ? <div className="sm:pt-1">{titleAside}</div> : null}
      </div>
      <p className="text-lg text-neutral-500 dark:text-zinc-400">
        {description}
      </p>
      {meta}
    </header>
  );
}

export function BlogCoverImage({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="w-full max-w-4xl overflow-hidden rounded-md border border-neutral-300 bg-background shadow-[0_18px_44px_rgba(15,15,18,0.12)] dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-[0_18px_44px_rgba(0,0,0,0.45)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="eager"
        className="block h-auto w-full object-cover"
      />
    </figure>
  );
}

export function BlogSection({
  title,
  children,
  id,
  className,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 space-y-4", className)}>
      <h2 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function BlogSubsection({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="scroll-mt-24 space-y-3">
      <h3 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-white">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function BlogParagraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-4xl text-base leading-7 text-neutral-700 dark:text-zinc-300">
      {children}
    </p>
  );
}

export function BlogQuote({
  children,
  cite,
}: {
  children: React.ReactNode;
  cite?: string;
}) {
  return (
    <blockquote className="max-w-4xl border-l-2 border-neutral-300 pl-4 text-base leading-7 text-neutral-600 italic dark:border-zinc-700 dark:text-zinc-400">
      <p>{children}</p>
      {cite ? (
        <footer className="mt-2 text-sm not-italic text-neutral-500 dark:text-zinc-500">
          — {cite}
        </footer>
      ) : null}
    </blockquote>
  );
}

export function BlogList({ items }: { items: string[] }) {
  return (
    <ul className="max-w-4xl list-disc space-y-2 pl-5 text-base leading-7 text-neutral-700 dark:text-zinc-300">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function BlogCodeBlock({
  code,
  title,
  className,
}: {
  code: string;
  title?: string;
  className?: string;
}) {
  const displayCode = code.trimEnd();
  const lines = displayCode.split("\n");

  return (
    <div className={cn("space-y-2", className)}>
      {title ? (
        <div className="font-mono text-sm font-medium text-neutral-700 dark:text-zinc-300">
          {title}
        </div>
      ) : null}
      <div className="group/code relative overflow-hidden rounded-md border border-zinc-800 bg-[#101116] shadow-[0_18px_44px_rgba(15,15,18,0.18)]">
        <CopyButton
          code={displayCode}
          className="absolute right-3 top-3 border-zinc-700 bg-zinc-900/80 opacity-0 backdrop-blur transition-opacity group-hover/code:opacity-100"
        />
        <pre className="overflow-x-auto p-5 pr-14 text-sm leading-6 text-zinc-100">
          <code className="table min-w-max font-mono">
            {lines.map((line, index) => (
              <span className="table-row" key={`${index}-${line}`}>
                <span className="table-cell w-8 select-none pr-5 text-right text-xs text-zinc-600">
                  {index + 1}
                </span>
                <span className="table-cell whitespace-pre text-zinc-100">
                  {line || " "}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
