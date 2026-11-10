import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/landing/ui/accordion";
import { Section, SectionHeader } from "@/components/landing/ui/section-header";

const code = "font-mono text-[0.9em] text-orange-hover";

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is tiny-aws?",
    a: "A small cloud you run yourself. Launch instances, deploy a directory, put objects in a bucket, and send queue messages. It is a way to see what a cloud is doing, built as a college project and left open so you can read it.",
  },
  {
    q: "What do I need to run it?",
    a: (
      <>
        A Linux machine. Arch, Debian, or Ubuntu. Go and Rust to build it, plus debootstrap so each instance has a real
        root filesystem. The{" "}
        <a href="/docs" className="text-orange underline decoration-orange/40 underline-offset-2">
          docs
        </a>{" "}
        start from a fresh box and walk through the first deploy.
      </>
    ),
  },
  {
    q: "Is this a replacement for AWS?",
    a: "No. It has the same shape in a few places: instances, a scheduler, a load balancer, object storage, queues, pub/sub, Lambda-style functions, and IAM tokens. It is not a second AWS, and it is not trying to be one.",
  },
  {
    q: "Does it use Docker?",
    a: (
      <>
        No. A <span className={code}>tinyaws.build</span> file names the base, the packages, the build commands, and
        the start command. The agent builds a rootfs, mounts overlayfs, and <span className={code}>pivot_root</span>{" "}
        into it. The host filesystem stays hidden.
      </>
    ),
  },
  {
    q: "Where do I learn how it works?",
    a: (
      <>
        Start at{" "}
        <a href="/docs" className="text-orange underline decoration-orange/40 underline-offset-2">
          the docs
        </a>
        . They go from Linux primitives, through networking, and then through the
        registry, the scheduler, the agent, and a deploy, in the order the system actually runs.
      </>
    ),
  },
];

export function Faq() {
  return (
    <Section id="faq" labelledBy="faq-title">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
        <SectionHeader id="faq-title" title="FAQs" />
        <div data-reveal>
          <Accordion type="single" collapsible defaultValue="q0">
            {FAQ.map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Section>
  );
}
