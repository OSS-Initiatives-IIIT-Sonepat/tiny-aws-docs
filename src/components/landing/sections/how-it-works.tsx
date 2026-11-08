import { AsciiDiagram } from "@/components/landing/ui/ascii-diagram";
import { BoxFrame } from "@/components/landing/ui/box-frame";
import { Accent, Section, SectionHeader } from "@/components/landing/ui/section-header";
import { ARCH } from "./diagram";

const STEPS = [
  {
    title: "Launch",
    body: "tinyaws instance launch asks the scheduler for a machine. An agent on that box starts the instance.",
  },
  {
    title: "Isolate",
    body: "The instance gets its own rootfs. overlayfs and pivot_root hide the host. cgroups cap CPU and memory.",
  },
  {
    title: "Serve",
    body: "Deploy a directory as a service. The load balancer on :8088 routes to it. Storage, queues, and IAM sit beside it.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" labelledBy="how-title">
      <SectionHeader
        id="how-title"
        title={
          <>
            One Linux box, <Accent>a whole cloud</Accent>
          </>
        }
        lead="The CLI talks to a control plane. The control plane picks a machine. That machine starts an instance with its own filesystem and network."
      />
      <div className="mt-12 grid grid-cols-1 items-center gap-10 lg:mt-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
        <div data-reveal>
          <BoxFrame
            caption="architecture · your linux box"
            command="tinyaws instance list"
            status={{ label: "up", tone: "running" }}
          >
            <div className="px-4 py-6 sm:px-6 sm:py-8">
              <AsciiDiagram lines={ARCH} scale={1.12} className="mx-auto" />
            </div>
            <p className="sr-only">
              The tinyaws CLI calls the registry, scheduler, and controller over HTTP. The scheduler assigns work to an
              agent, which starts instances i-1, i-2, and i-3. A load balancer sits in front of them. Object storage,
              a queue, and IAM run on the same box.
            </p>
          </BoxFrame>
        </div>
        <ol className="grid border-t border-line" data-reveal>
          {STEPS.map((s, i) => (
            <li key={s.title} className="group flex gap-5 border-b border-line py-6 transition-colors hover:bg-orange-tint/40 sm:px-2">
              <span className="font-display text-[40px] leading-none tracking-[-0.03em] text-orange">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="pt-1">
                <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.015em]">{s.title}</h3>
                <p className="mt-1.5 max-w-[360px] text-[16px] leading-[1.55] text-fg-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
