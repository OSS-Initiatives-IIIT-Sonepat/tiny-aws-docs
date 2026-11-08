import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-fg", className)}>
      {/* The landing surface is always dark, so this is the light mark. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tiny-aws-dark.png"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 object-contain"
      />
      <span className="font-display text-[20px] leading-none font-medium tracking-[-0.02em]">
        tiny-aws
      </span>
    </span>
  );
}
