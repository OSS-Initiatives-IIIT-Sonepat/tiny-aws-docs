import { CodeTabs } from "@/components/landing/ui/code-tabs";
import { InstallBox } from "@/components/landing/ui/install-box";
import { Accent, Section, SectionHeader } from "@/components/landing/ui/section-header";
import { SNIPPETS } from "./connect-snippets";

const code = "font-mono text-[0.9em] whitespace-nowrap text-orange-hover";

function Step({
  n,
  title,
  children,
  panel,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  panel: React.ReactNode;
}) {
  return (
    <li
      className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)] lg:gap-12"
      data-reveal
    >
      <div className="lg:pt-1">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="bx-kiln-panel inline-flex size-8 shrink-0 items-center justify-center font-mono text-[14px] text-white"
          >
            {n}
          </span>
          <h3 className="font-display text-[22px] leading-[1.15] tracking-[-0.02em] lg:text-[24px]">
            <span className="sr-only">Step {n}: </span>
            {title}
          </h3>
        </div>
        <p className="mt-4 text-[16px] leading-[1.6] text-fg-muted">{children}</p>
      </div>
      <div className="min-w-0">{panel}</div>
    </li>
  );
}

export function Connect() {
  return (
    <Section id="get-started" labelledBy="connect-title">
      <SectionHeader
        id="connect-title"
        title={
          <>
            Clone it, then <Accent>boot the stack</Accent>
          </>
        }
        lead="A Linux machine, a base rootfs, and the CLI. After that, an instance or a deploy is one command."
      />
      <ol className="mt-12 grid grid-cols-1 gap-14 lg:mt-16 lg:gap-20">
        <Step n={1} title="Start tiny-aws" panel={<InstallBox id="install" />}>
          You need Go, Rust, cmake, and debootstrap.{" "}
          <span className={code}>bootstrap-rootfs.sh</span> builds the base system once.{" "}
          <span className={code}>run-local.sh</span> compiles the agents and starts the registry, scheduler,
          controller, object store, and load balancer.
        </Step>
        <Step n={2} title="Launch, deploy, store" panel={<CodeTabs snippets={SNIPPETS} />}>
          <span className={code}>go install</span> puts <span className={code}>tinyaws</span> on your PATH. Launch an
          instance, deploy a directory as a service, or talk to storage and queues with the same CLI.
        </Step>
      </ol>
    </Section>
  );
}
