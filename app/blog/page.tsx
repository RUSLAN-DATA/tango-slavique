import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Blog — Tango Slavique",
  description:
    "Private perspectives from Tango Slavique: matchmaking, serious relationships, and life in Spain.",
};

const articles = [
  {
    date: "17 JUL 2026",
    title:
      "¿Qué busca un hombre exitoso en una mujer? Una conversación honesta sobre el amor cuando no tienes tiempo que perder",
    desc: "Hablamos con uno de nuestros clientes sobre qué es lo que realmente valora un hombre maduro y exitoso en una pareja, qué dificultades enfrenta al buscar compatibilidad.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  },
  {
    date: "13 JUL 2026",
    title:
      "Cómo encontrar una relación seria si trabajas mucho: una guía para personas ocupadas mayores de 30 años que viven en España",
    desc: "En este artículo veremos por qué encontrar pareja suele resultar más complicado después de los 30 y qué estrategias funcionan mejor cuando llevas un ritmo exigente.",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
  },
  {
    date: "28 MAY 2026",
    title:
      "Matchmaking vs dating apps: why one actually works for serious relationships in Barcelona",
    desc: "Still on the apps after months of trying? The problem isn't your profile. It's the business model. Here's why personalized matchmaking produces different results.",
    image:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
  },
];

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

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pb-24 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <article
            key={article.title}
            className="group cursor-pointer overflow-hidden rounded-none transition-all duration-700 hover:-translate-y-1.5"
          >
            <div className="aspect-[16/10] overflow-hidden">
              <img
                src={article.image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
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
          </article>
        ))}
      </div>
    </main>
  );
}
