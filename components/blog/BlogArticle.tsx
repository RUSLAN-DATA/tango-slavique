"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { WORKER_URL } from "@/lib/miniapp/api";

export function BlogArticle({ slug }: { slug: string }) {
  const { locale } = useLanguage();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cover, setCover] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(
          `${WORKER_URL}/api/public/blog/${slug}?locale=${locale === "es" ? "es" : "en"}`
        );
        const payload = (await response.json()) as {
          ok?: boolean;
          data?: { title?: string; body?: string; cover?: string | null };
        };
        if (!payload.ok || !payload.data?.title) {
          setMissing(true);
          return;
        }
        setTitle(payload.data.title);
        setBody(payload.data.body || "");
        setCover(payload.data.cover ? `${WORKER_URL}${payload.data.cover}` : "");
      } catch {
        setMissing(true);
      }
    }
    void load();
  }, [slug, locale]);

  if (missing) {
    return (
      <main className="min-h-screen px-4 pt-28">
        <Link href="/blog" className="text-xs text-zinc-400">
          ← Back
        </Link>
        <p className="mt-12 text-ivory/70">This article is not available.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 pb-24 pt-28">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-xs text-zinc-400 transition-colors hover:text-amber-300">
          ← Back
        </Link>
        {cover ? (
          <div className="mt-10 bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="mx-auto max-h-[70vh] w-full object-contain" />
          </div>
        ) : null}
        <h1 className="mt-10 font-serif text-3xl text-white sm:text-4xl">{title || "…"}</h1>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-ivory/75">
          {body.split(/\n{2,}/).map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </div>
    </main>
  );
}
