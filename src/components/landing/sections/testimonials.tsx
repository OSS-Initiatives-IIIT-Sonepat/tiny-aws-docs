"use client";

import { useState } from "react";
import { XIcon } from "@/components/landing/ui/brand-icons";
import { Accent, Section, SectionHeader } from "@/components/landing/ui/section-header";

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
  {
    name: "AI Simplified",
    handle: "lykuan2000",
    avatar: "https://pbs.twimg.com/profile_images/1770514912823115776/Lbo__b6g_400x400.jpg",
    verified: true,
    text: "好的谢谢，这个项目很棒感谢你的工作🫡",
    translation: "Okay, thanks. This project is great. Thank you for the work.",
    date: "Nov 7",
    likes: 1,
    url: "https://x.com/lykuan2000/status/2119027356149199190",
  },
  {
    name: "Rick",
    handle: "rick4aiiii",
    avatar: "https://pbs.twimg.com/profile_images/2114218725385920512/7ZK3hQ05_400x400.jpg",
    text: "As someone fascinated by AI hardware, I couldn’t agree more. Whether you’re building an AI agent or an embedded device, understanding what’s happening beneath the abstractions makes all the difference. The closer you get to the machine, the more fundamentals matter.",
    date: "Nov 9",
    likes: 1,
    url: "https://x.com/rick4aiiii/status/2119649927227953572",
  },
  {
    name: "CF Mitrah",
    handle: "cfmitrah",
    avatar: "https://pbs.twimg.com/profile_images/742254501969563648/ia_vGf2f_400x400.jpg",
    text: "Respect for keeping it CLI and skipping the React tax. The constraint of no Docker/VMs forces you to learn the real seams — scheduling, isolation, networking — that frameworks usually hide.",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/cfmitrah/status/2118552230651412951",
  },
  {
    name: "Shan_Bhat",
    handle: "ShanBhat3",
    avatar: "https://pbs.twimg.com/profile_images/2007445432755269632/mwif0ZG2_400x400.jpg",
    text: "you literally became one of the true programmers now. Figuring out to do something and then telling how to is the best thing. VERY WELL BROTHER",
    date: "Nov 7",
    likes: 1,
    url: "https://x.com/ShanBhat3/status/2119104727845880244",
  },
  {
    name: "anish",
    handle: "justmetolife",
    avatar: "https://pbs.twimg.com/profile_images/2088892092403920896/3w-OGUqu_400x400.jpg",
    text: "tiny aws in 10k lines with no docker is soo coool, which part was the hardest to get working, networking?",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/justmetolife/status/2118630904281337906",
  },
  {
    name: "离岸工具包🎒",
    handle: "Stanllll6o",
    avatar: "https://pbs.twimg.com/profile_images/2108433329322373120/EmdsFz3S_400x400.jpg",
    text: "Sick of bloated tech stacks? Me too. @shubhamm069 nails it. Simplicity rocks, especially when it's a homebrewed AWS.\n\nBuilding a CLI cloud from scratch? Now that's spirit!",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/Stanllll6o/status/2118644666862289052",
  },
  {
    name: "𝙸𝚜𝚑",
    handle: "IshTheCoder",
    avatar: "https://pbs.twimg.com/profile_images/1993024004165120000/VfTRM986_400x400.jpg",
    verified: true,
    text: "i’m writing an http server for this reason. after this is I want to do a mini shell and then a database of some form",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/IshTheCoder/status/2118701382521725343",
  },
  {
    name: "dm",
    handle: "devdjm",
    avatar: "https://pbs.twimg.com/profile_images/1932135223795363840/EjHltUUc_400x400.jpg",
    verified: true,
    text: "Good work! One thing I wanted to point out (which I didn't see explicitly mentioned) is that containers use cgroups and namespaces for isolation. However, in cloud environments, this is kernel-based isolation, which has security and multi-tenancy implications.",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/devdjm/status/2118590344103334048",
  },
  {
    name: "Kidiatoliny Gonçalves",
    handle: "kidiatoliny",
    avatar: "https://pbs.twimg.com/profile_images/2094749066294935553/2A6DIjs4_400x400.jpg",
    text: "Agree on the why. Even a small Go tool that spawns and watches local processes teaches you more about signals and exit codes than another framework. But nobody should need a TCP stack before shipping their first app.",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/kidiatoliny/status/2118770016380428350",
  },
  {
    name: "x0@",
    handle: "Lurkergsx",
    avatar: "https://pbs.twimg.com/profile_images/2084079618093441024/K1Tl-kjc_400x400.jpg",
    text: "absolutely insane, if you don't mind me asking how did you make your diagrams? (It's extremely helpful)",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/Lurkergsx/status/2118577101267959971",
  },
  {
    name: "Durgvijay Chauhan",
    handle: "mr_durgvijay",
    avatar: "https://pbs.twimg.com/profile_images/2055209446037725184/9ZjTHkgF_400x400.jpg",
    text: "Hey! Really impressed by your work and your vision. Could you share your learning journey, the skills you developed, and the roadmap you followed? Also, how do you add subtitles to your videos? I'm planning to create videos and would love some guidance on where to start. Thanks!",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/mr_durgvijay/status/2118580896672694555",
  },
  {
    name: "Ashu Sharma",
    handle: "ashusharma1841",
    avatar: "https://pbs.twimg.com/profile_images/2113930191806533632/FedVtU_k_400x400.jpg",
    text: "Tiny AWS is cool, but the real test is whether the bill is also tiny or still a mystery at month end",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/ashusharma1841/status/2118593144149447101",
  },
  {
    name: "satvik upadhyaya",
    handle: "idontcompile",
    avatar: "https://pbs.twimg.com/profile_images/2090895145046802433/4Bv2wC_D_400x400.jpg",
    text: "The best explanation",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/idontcompile/status/2118537266268418378",
  },
  {
    name: "Sam",
    handle: "ItWasYou_SAM",
    avatar: "https://pbs.twimg.com/profile_images/2104624702832701440/6ivhNaQD_400x400.jpg",
    text: "The best advice",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/ItWasYou_SAM/status/2118539555280445482",
  },
  {
    name: "Anish Aniket Mahanta",
    handle: "anishmahanta",
    avatar: "https://pbs.twimg.com/profile_images/1829912981104111616/WI-WFmfz_400x400.jpg",
    text: "You deserve millions of follows mate.",
    date: "Nov 7",
    likes: 1,
    url: "https://x.com/anishmahanta/status/2118896415128875402",
  },
  {
    name: "Aru_sharma",
    handle: "Aru__09",
    avatar: "https://pbs.twimg.com/profile_images/2056643163994181632/2BEP2INy_400x400.jpg",
    verified: true,
    text: "Very based take",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/Aru__09/status/2118583292630880754",
  },
  {
    name: "Vaibhav Sharma",
    handle: "Hlo_Vaibhav",
    avatar: "https://pbs.twimg.com/profile_images/2026723042760732672/CIjeHUX3_400x400.png",
    text: "I do System Programming and I Love that.",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/Hlo_Vaibhav/status/2118758244177113541",
  },
  {
    name: "Piyush Kanojiya",
    handle: "PK6655665577",
    avatar: "https://pbs.twimg.com/profile_images/2051395645446242304/GKNsjAlF_400x400.jpg",
    text: "Taking inspirations bro !",
    date: "Nov 7",
    likes: 1,
    url: "https://x.com/PK6655665577/status/2119073270872076799",
  },
  {
    name: "+447708961556",
    handle: "hayhay85492",
    avatar: "https://pbs.twimg.com/profile_images/626589714188009472/lov0hjvX_400x400.jpg",
    text: "that sounds like an incredible journey into the depths of programming! Building your own \"tiny AWS\" from scratch is truly inspiring",
    date: "Nov 9",
    likes: 1,
    url: "https://x.com/hayhay85492/status/2119704606737670483",
  },
  {
    name: "Abhishek",
    handle: "ImTheRealShek",
    avatar: "https://pbs.twimg.com/profile_images/2112769276826574848/QjxRBmWI_400x400.jpg",
    text: "good work 🔥🔥🔥. keep it up",
    date: "Nov 6",
    likes: 1,
    url: "https://x.com/ImTheRealShek/status/2118569311317156270",
  },
  {
    name: "Erwin",
    handle: "nosir_1",
    avatar: "https://pbs.twimg.com/profile_images/1939725769661718533/qzwwkgDh_400x400.jpg",
    text: "respect man.. You seem to be a genuinely good person.",
    date: "Nov 8",
    likes: 1,
    url: "https://x.com/nosir_1/status/2119345694297493532",
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
        lead="What people think about Tiny AWS."
      />
      <div className="mt-12 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3" data-reveal>
        {REPLIES.map((reply) => (
          <ReplyCard key={reply.url} reply={reply} />
        ))}
      </div>
    </Section>
  );
}
