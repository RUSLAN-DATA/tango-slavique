"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { WORKER_URL } from "@/lib/miniapp/api";

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  published_at: string | null;
  cover: string | null;
};

const fallback = [
  {
    date: "17 JUL 2026",
    title:
      "¿Qué busca un hombre exitoso en una mujer? Una conversación honesta sobre el amor cuando no tienes tiempo que perder",
    desc: "Hablamos con uno de nuestros clientes sobre qué es lo que realmente valora un hombre maduro y exitoso en una pareja, qué dificultades enfrenta al buscar compatibilidad.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    href: "",
  },
  {
    date: "13 JUL 2026",
    title:
      "Cómo encontrar una relación seria si trabajas mucho: una guía para personas ocupadas mayores de 30 años que viven en España",
    desc: "En este artículo veremos por qué encontrar pareja suele resultar más complicado después de los 30 y qué estrategias funcionan mejor cuando llevas un ritmo exigente.",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    href: "",
  },
  {
    date: "28 MAY 2026",
    title:
      "Matchmaking vs dating apps: why one actually works for serious relationships in Barcelona",
    desc: "Still on the apps after months of trying? The problem isn't your profile. It's the business model. Here's why personalized matchmaking produces different results.",
    image:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
    href: "",
  },
];

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

export function BlogIndex() {
  const { locale } = useLanguage();
  const [articles, setArticles] = useState<
    Array<{ date: string; title: string; desc: string; image: string; href: string }>
  >(fallback);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(
          `${WORKER_URL}/api/public/blog?locale=${locale === "es" ? "es" : "en"}`
        );
        const payload = (await response.json()) as {
          ok?: boolean;
          data?: { items?: Article[] };
        };
        const items = payload.data?.items || [];
        if (!items.length) {
          return;
        }
        setArticles(
          items.map((item) => ({
            date: formatDate(item.published_at),
            title: item.title,
            desc: item.excerpt,
            image: item.cover ? `${WORKER_URL}${item.cover}` : fallback[0].image,
            href: `/blog/${item.slug}`,
          }))
        );
      } catch {
        setArticles(fallback);
      }
    }
    void load();
  }, [locale]);

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pb-24 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => {
        const inner = (
          <>
            <div className="aspect-[16/10] overflow-hidden bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.image}
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
            <div className="space-y-3 bg-white p-6 text-zinc-900 sm:p-8">
              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                {article.date}
              </p>
              <h2 className="line-clamp-3 font-serif text-base font-normal leading-snug text-zinc-900 transition-colors group-hover:text-amber-800 sm:text-lg">
                {article.title}
              </h2>
              <p className="line-clamp-3 text-xs leading-relaxed text-zinc-600">
                {article.desc}
              </p>
            </div>
          </>
        );
        const className =
          "group cursor-pointer overflow-hidden rounded-none transition-all duration-700 hover:-translate-y-1.5";
        return article.href ? (
          <Link key={article.title} href={article.href} className={className}>
            {inner}
          </Link>
        ) : (
          <article key={article.title} className={className}>
            {inner}
          </article>
        );
      })}
    </div>
  );
}
