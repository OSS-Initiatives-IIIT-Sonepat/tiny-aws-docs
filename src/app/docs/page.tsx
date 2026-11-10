import { redirect } from "next/navigation";
import { getDefaultPostPath } from "@/lib/blog-server";

export default function DocsIndexPage() {
  const path = getDefaultPostPath();
  redirect(path === "/docs" ? "/" : path);
}
