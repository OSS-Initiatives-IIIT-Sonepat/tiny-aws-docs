import { Accent, Section, SectionHeader } from "@/components/landing/ui/section-header";
import { StatRow } from "@/components/landing/ui/stat-row";

export function Speed() {
  return (
    <Section id="speed" labelledBy="speed-title">
      <SectionHeader
        id="speed-title"
        title={
          <>
            Small enough to <Accent>read the whole thing</Accent>
          </>
        }
        lead="Same ideas as a cloud provider. A codebase you can open on a Tuesday and actually finish."
      />
      <StatRow
        className="mt-12 lg:mt-16"
        stats={[
          { label: "Codebase", value: "10,000", note: "Rust and Golang" },
          { label: "Instance types", value: "5", note: "nano through large" },
          { label: "Where it runs", value: "1 box", note: "or a small cluster" },
          { label: "Docker", value: "None", note: "debootstrap rootfs" },
          { label: "Cloud bill", value: "$0", note: "your hardware" },
        ]}
      />
      <p className="mt-4 font-mono text-[12px] leading-[1.5] text-fg-dim">
        A teaching cloud. Not a second AWS, and not trying to be one.
      </p>
    </Section>
  );
}
