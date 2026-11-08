import { site } from "@/lib/landing/site";

export async function getStarCount(): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${site.repo.owner}/${site.repo.name}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "tiny-aws-docs",
        },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: unknown };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

export function formatStars(n: number) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
}
