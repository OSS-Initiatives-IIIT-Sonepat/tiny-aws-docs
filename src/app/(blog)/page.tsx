import { redirect } from "next/navigation";
import { getDefaultPostPath } from "@/lib/blog-server";

export default function HomePage() {
  redirect(getDefaultPostPath());
}
