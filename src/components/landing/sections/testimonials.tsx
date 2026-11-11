"use client";

import { useState } from "react";
import { XIcon } from "@/components/landing/ui/brand-icons";
import { Accent, Section, SectionHeader } from "@/components/landing/ui/section-header";

const THREAD = "https://x.com/shubhamm069/status/2118534657033830532";

type Reply = {
  name: string;
  handle: string;
  avatar: string;
  verified?: boolean;
  text: string;
  translation?: string;
  date: string;
  likes: number;
  url: string;
};

const REPLIES: Reply[] = [
  {
    name: "isagi",
    handle: "encrypt_ap",
    avatar: "https://pbs.twimg.com/profile_images/1981668440671662080/tmnzIm4F_400x400.jpg",
    text: "Every cloud service is somehow wrapper over Linux and other things providing something extra.\n\nHaving root understanding of it gives more clarity of others",
    date: "Nov 6",
    likes: 20,
    url: "https://x.com/encrypt_ap/status/2118604941493486008",
  },
  {
    name: "Protein Paglu",
    handle: "protein_paglu",
    avatar: "https://pbs.twimg.com/profile_images/1978706792994799616/sEtA-oQ8_400x400.jpg",
    text: "System programming changes your whole perspective towards computer science. I have been building kernel drivers and EDR sensors for the past 2 years and damn, there is so much to learn.",
    date: "Nov 6",
    likes: 22,
    url: "https://x.com/protein_paglu/status/2118596749917073488",
  },
  {
    name: "Nishchay Kumar",
    handle: "kumar_nish98725",
    avatar: "https://pbs.twimg.com/profile_images/2112776623598829568/oVb2Gf_W_400x400.jpg",
    text: "Docker is already built on namespaces and cgroups, so going directly to these primitives gives more control over isolation and resource limits.",
    date: "Nov 6",
    likes: 5,
    url: "https://x.com/kumar_nish98725/status/2118552233319264533",
  },
  {
    name: "jimerrors",
    handle: "JMkernt",
    avatar: "https://pbs.twimg.com/profile_images/2008436069428043776/V-w99gLN_400x400.jpg",
    verified: true,
    text: "10k lines of Go and Rust, just a CLI, no React — that's a proper tiny AWS.",
    date: "Nov 6",
    likes: 2,
    url: "https://x.com/JMkernt/status/2118632774156341301",
  },
  {
    name: "John Rood",
    handle: "johnroodepic",
    avatar: "https://pbs.twimg.com/profile_images/2107625455813861376/4nNHd8o2_400x400.jpg",
    verified: true,
    text: "this matters more post-ai than it did before: generation got cheap and verification didn't. you can't tell whether 10k lines of go and rust are right unless you've built the tcp stack once. whoever reviews is the ceiling on what the fleet can ship.",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/johnroodepic/status/2118551400359801295",
  },
  {
    name: "MANI SINGH",
    handle: "mx4nisingh",
    avatar: "https://pbs.twimg.com/profile_images/1903049766474485762/RZWpvzcx_400x400.png",
    text: "These is one of the best advice in this AI era for developers",
    date: "Nov 6",
    likes: 2,
    url: "https://x.com/mx4nisingh/status/2118562828953215128",
  },
  {
    name: "Bhurva",
    handle: "Bhurva3",
    avatar: "https://pbs.twimg.com/profile_images/2100154849530986496/Qgq1ntZ3_400x400.jpg",
    text: "building tiny aws is the fastest way to understand why big aws charges like that",
    date: "Nov 7",
    likes: 1,
    url: "https://x.com/Bhurva3/status/2118950726265401616",
  },
  {
    name: "Aman Agrahari",
    handle: "aman8cse",
    avatar: "https://pbs.twimg.com/profile_images/2107379717687095296/1ZfD3C3S_400x400.jpg",
    text: "Now that sounds some engineering rather than just learning syntax for another framework",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/aman8cse/status/2118628743161979096",
  },
  {
    name: "Pascal",
    handle: "paschals_robert",
    avatar: "https://pbs.twimg.com/profile_images/2090181647320727552/PfHJXS1K_400x400.jpg",
    verified: true,
    text: "Ten thousand lines with no framework is a solid way to learn what the abstractions hide.",
    date: "Nov 7",
    likes: 1,
    url: "https://x.com/paschals_robert/status/2118885739668845029",
  },
  {
    name: "EnoTZ",
    handle: "EnoTZ2009",
    avatar: "https://pbs.twimg.com/profile_images/2086401635018805248/i3Cg7YrY_400x400.jpg",
    verified: true,
    text: "一万行就能搭个迷你云，不靠Docker这点有意思，拿来学原理挺合适",
    translation:
      "Ten thousand lines is enough to build a mini cloud. Not relying on Docker is the interesting part. A good way to learn the principles.",
    date: "Nov 7",
    likes: 1,
    url: "https://x.com/EnoTZ2009/status/2118952142555799901",
  },
  {
    name: "AI Simplified",
    handle: "lykuan2000",
    avatar: "https://pbs.twimg.com/profile_images/1770514912823115776/Lbo__b6g_400x400.jpg",
    verified: true,
    text: "文档有bug，图没显示出来",
    translation: "The docs have a bug. The diagrams aren't showing.",
    date: "Nov 7",
    likes: 1,
    url: "https://x.com/lykuan2000/status/2119025037508477148",
  },
];

function VerifiedMark() {
  return (
    <svg viewBox="0 0 22 22" aria-label="Verified" className="size-[16px] shrink-0">
      <path
        fill="#1d9bf0"
        d="M20.4 11.2 18.7 9.3l.2-2.4-2.3-.8-1.3-2.1-2.4.4L11 3.1 9.1 4.4l-2.4-.4-1.3 2.1-2.3.8.2 2.4L1.6 11.2l1.7 1.9-.2 2.4 2.3.8 1.3 2.1 2.4-.4L11 19.3l1.9-1.3 2.4.4 1.3-2.1 2.3-.8-.2-2.4 1.7-1.9z"
      />
      <path
        fill="#fff"
        d="M9.6 14.4 6.9 11.7l1.1-1.1 1.6 1.6 3.9-3.9 1.1 1.1-5 5z"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px]" fill="currentColor">
      <path d="M16.7 3.8c-1.7 0-3.2.8-4.2 2.1-1-1.3-2.5-2.1-4.2-2.1C5.3 3.8 3 6.1 3 9.1c0 4.6 5.4 8.4 8.5 10.8 3.1-2.4 8.5-6.2 8.5-10.8 0-3-2.3-5.3-5.3-5.3z" />
    </svg>
  );
}

function ReplyCard({ reply }: { reply: Reply }) {
  const [open, setOpen] = useState(false);
  const profile = `https://x.com/${reply.handle}`;

  return (
    <article className="flex h-full flex-col rounded-[16px] border border-line bg-panel px-4 py-4">
      <header className="flex items-start gap-3">
        <a href={profile} className="shrink-0 rounded-full">
          <img
            src={reply.avatar}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
          />
        </a>
        <div className="min-w-0 flex-1">
          <a href={profile} className="flex min-w-0 items-center gap-1 hover:underline">
            <span className="truncate text-[15px] font-semibold leading-5 tracking-[-0.01em]">{reply.name}</span>
            {reply.verified && <VerifiedMark />}
          </a>
          <a href={profile} className="block truncate text-[14px] leading-5 text-fg-muted hover:underline">
            @{reply.handle}
          </a>
        </div>
        <a
          href={reply.url}
          aria-label={`View @${reply.handle} on X`}
          className="mt-0.5 text-fg-muted transition-colors hover:text-fg"
        >
          <XIcon className="size-[18px]" />
        </a>
      </header>

      <p className="mt-3 text-[15px] leading-[1.45] whitespace-pre-wrap text-fg">{reply.text}</p>

      {reply.translation && (
        <div className="mt-3">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="font-mono text-[12.5px] tracking-[0.04em] text-orange hover:text-orange-hover"
          >
            {open ? "Hide translation" : "See translation"}
          </button>
          {open && (
            <p className="mt-2 border-l border-orange/40 pl-3 text-[14.5px] leading-[1.45] text-fg-muted">
              {reply.translation}
            </p>
          )}
        </div>
      )}

      <footer className="mt-auto flex items-center justify-between pt-4 text-[13px] text-fg-dim">
        <a href={reply.url} className="hover:underline">
          {reply.date}
        </a>
        <span className="inline-flex items-center gap-1.5 text-fg-muted">
          <HeartIcon />
          <span className="tabular-nums">{reply.likes}</span>
        </span>
      </footer>
    </article>
  );
}

export function Testimonials() {
  return (
    <Section id="replies" labelledBy="replies-title">
      <SectionHeader
        id="replies-title"
        title={
          <>
            From the <Accent>thread</Accent>
          </>
        }
        lead={
          <>
            Replies on the{" "}
            <a href={THREAD} className="text-orange underline decoration-orange/40 underline-offset-2">
              systems programming post
            </a>
            . Chinese replies keep the original text, with a translation under it.
          </>
        }
      />
      <div className="mt-12 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3" data-reveal>
        {REPLIES.map((reply) => (
          <ReplyCard key={reply.url} reply={reply} />
        ))}
      </div>
    </Section>
  );
}
