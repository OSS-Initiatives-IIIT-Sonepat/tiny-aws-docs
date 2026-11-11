import { Suspense } from "react";
import Link from "next/link";
import { GitHubIcon, StarIcon } from "@/components/landing/ui/brand-icons";
import { Logo } from "@/components/landing/ui/logo";
import { formatStars, getStarCount } from "@/lib/landing/github";
import { site } from "@/lib/landing/site";
import { HeaderShell } from "./header-shell";
import { SectionMenu, SectionNav } from "./section-nav";

function StarButton({ stars }: { stars: number | null }) {
  return (
    <a
      href={site.repo.url}
      aria-label={stars === null ? "Star tiny-aws on GitHub" : `Star tiny-aws on GitHub, ${stars} stars`}
      className="group inline-flex h-9 items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.06] px-3 text-[14px] font-medium text-fg transition-colors duration-150 hover:border-white/15 hover:bg-white/[0.1]"
    >
      <GitHubIcon className="size-[18px]" />
      <span>Star</span>
      <StarIcon className="size-4 fill-transparent transition-[fill,scale] duration-200 ease-(--bx-ease-out) group-hover:scale-110 group-hover:fill-current" />
      <span className="border-l border-white/15 pl-2 tabular-nums">
        {stars === null ? "…" : formatStars(stars)}
      </span>
    </a>
  );
}

async function LiveStarButton() {
  return <StarButton stars={await getStarCount()} />;
}

export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="tiny-aws home" className="-m-1 shrink-0 rounded-[6px] p-1">
          <Logo />
        </Link>
        <SectionNav />
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <SectionMenu />
          <Link
            href="/docs"
            className="inline-flex h-9 items-center rounded-[10px] px-3 text-[14px] font-medium text-fg-muted transition-colors duration-150 hover:text-fg"
          >
            Docs
          </Link>
          <Suspense fallback={<StarButton stars={null} />}>
            <LiveStarButton />
          </Suspense>
        </div>
      </div>
    </HeaderShell>
  );
}
