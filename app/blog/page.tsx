import type { Metadata } from "next";
import Link from "next/link";
import { BlogIndex } from "@/components/blog/BlogIndex";

export const metadata: Metadata = {
  title: "Our Blog — Tango Slavique",
  description:
    "Private perspectives from Tango Slavique: matchmaking, serious relationships, and life in Spain.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <div className="px-4 pt-28">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="inline-block text-xs text-zinc-400 transition-colors hover:text-amber-300"
          >
            ← Back to Home
          </Link>
        </div>
        <p className="mb-3 mt-12 text-center text-xs uppercase tracking-[0.25em] text-amber-400">
          OUR BLOG
        </p>
        <h1 className="mb-16 text-center font-serif text-3xl text-white sm:text-4xl">
          Private Perspectives
        </h1>
      </div>
      <BlogIndex />
    </main>
  );
}
