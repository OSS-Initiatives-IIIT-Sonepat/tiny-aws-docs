import { Accent, Section, SectionHeader } from "@/components/landing/ui/section-header";

const PIECES: { name: string; body: string }[] = [
  {
    name: "EC2",
    body: "An instance is a systemd-nspawn container with its own filesystem and network.",
  },
  {
    name: "Lambda",
    body: "Upload a function and invoke it. The scheduler finds a machine and runs it.",
  },
  {
    name: "S3",
    body: "An object store: a C++ block engine behind a Rust HTTP API.",
  },
  {
    name: "ELB",
    body: "A round-robin load balancer. Deploy a service and reach it on port 8088.",
  },
  {
    name: "SQS",
    body: "A queue backed by SQLite, with visibility timeouts.",
  },
  {
    name: "SNS",
    body: "Pub/sub. One event, fanned out to subscribers over HTTP.",
  },
  {
    name: "IAM",
    body: "Bearer tokens with a role and an expiry. Admin or readonly.",
  },
  {
    name: "VPC",
    body: "Subnets and security groups as metadata, enforced with iptables on the machine.",
  },
];

export function WhatItIs() {
  return (
    <Section id="what-it-is" labelledBy="what-title">
      <SectionHeader
        id="what-title"
        title={
          <>
            What <Accent>tiny-aws</Accent> is
          </>
        }
        lead="A self-hosted mini-AWS for one Linux machine, or a small cluster. It keeps the features people actually use, and leaves the rest out. This is not AWS's code. It is an educational project you can run, then open and read."
      />
      <p className="mt-8 max-w-[640px] text-[16px] leading-[1.6] text-fg-muted">
        You get EC2-like compute and Lambda-like functions on hardware you already have. A{" "}
        <span className="font-mono text-[0.9em] text-orange-hover">tinyaws.build</span> file
        describes the box in a few lines. No Docker image, no registry. The agent builds a rootfs,
        hides the host, and starts your process.
      </p>
      <ul className="mt-12 border-t border-line" data-reveal>
        {PIECES.map((piece) => (
          <li
            key={piece.name}
            className="grid grid-cols-1 gap-1 border-b border-line py-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-baseline sm:gap-8"
          >
            <span className="font-mono text-[13px] tracking-[0.14em] text-orange uppercase">
              {piece.name}
            </span>
            <span className="text-[16px] leading-[1.55] text-fg">{piece.body}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
