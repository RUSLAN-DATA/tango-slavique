import type { Env } from "../env";
import { geminiGenerateJson, textPart } from "../ai/gemini";
import { newId, nowIso } from "../crypto";
import { detectLocale, type SiteLocale } from "./language";
import { sendAdminMessage } from "../telegram/notifications";
import { copyFor, type AdminLocale } from "../telegram/cmsCopy";

export type BlogArticle = {
  id: string;
  slug: string;
  status: string;
  category: string | null;
  tags: string | null;
  cover_r2_key: string | null;
  published_at: string | null;
  original_text: string | null;
  created_at: string;
  created_by?: string | null;
};

export type BlogTranslation = {
  locale: string;
  title: string;
  body: string;
  seo_title: string | null;
  seo_description: string | null;
};

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${base || "note"}-${newId().slice(0, 6)}`;
}

function blogKeyboard(id: string, locale: AdminLocale = "en") {
  const t = copyFor(locale);
  return {
    inline_keyboard: [
      [
        { text: `✏️ ${t.edit}`, callback_data: `b:e:${id}` },
        { text: `👁 ${t.preview}`, callback_data: `b:v:${id}` },
      ],
      [
        { text: `🚀 ${t.publish}`, callback_data: `b:p:${id}` },
        { text: `❌ ${t.cancel}`, callback_data: `b:c:${id}` },
      ],
    ],
  };
}

export function blogListKeyboard(id: string, status: string, locale: AdminLocale = "en") {
  const t = copyFor(locale);
  const second =
    status === "published"
      ? { text: `⏸ ${t.unpublish}`, callback_data: `b:u:${id}` }
      : { text: `🚀 ${t.publish}`, callback_data: `b:p:${id}` };
  return {
    inline_keyboard: [
      [
        { text: `✏️ ${t.edit}`, callback_data: `b:e:${id}` },
        { text: `👁 ${t.preview}`, callback_data: `b:v:${id}` },
      ],
      [second, { text: `🗑 ${t.delete}`, callback_data: `b:d:${id}` }],
    ],
  };
}

export function blogEditKeyboard(id: string, locale: AdminLocale = "en") {
  const t = copyFor(locale);
  return {
    inline_keyboard: [
      [
        { text: `🇬🇧 ${t.english}`, callback_data: `b:en:${id}` },
        { text: `🇪🇸 ${t.spanish}`, callback_data: `b:es:${id}` },
      ],
      [
        { text: `📝 ${t.original}`, callback_data: `b:or:${id}` },
        { text: `🖼 ${t.photo}`, callback_data: `b:ph:${id}` },
      ],
      [{ text: `↩️ ${t.back}`, callback_data: `b:v:${id}` }],
    ],
  };
}

export async function createPhotoDraft(
  env: Env,
  input: { coverKey: string; createdBy?: string | null }
): Promise<BlogArticle> {
  const now = nowIso();
  const id = newId();
  const slug = slugify("draft");
  await env.DB.prepare(
    `INSERT INTO blog_articles (id, slug, status, category, tags, cover_r2_key, published_at, created_by, created_at, updated_at, original_text)
     VALUES (?, ?, 'draft', 'journal', NULL, ?, NULL, ?, ?, ?, NULL)`
  )
    .bind(id, slug, input.coverKey, input.createdBy || null, now, now)
    .run();
  return (await getArticle(env, id))!;
}

export async function createBlogDraft(
  env: Env,
  input: {
    text: string;
    coverKey?: string | null;
    createdBy?: string | null;
    locale?: SiteLocale | "unknown";
    silent?: boolean;
    skipTranslate?: boolean;
  }
): Promise<BlogArticle> {
  const now = nowIso();
  const id = newId();
  const locale = input.locale && input.locale !== "unknown" ? input.locale : detectLocale(input.text);
  const resolved: SiteLocale = locale === "unknown" ? "en" : locale;
  const lines = input.text.trim().split(/\n+/);
  const title = (lines[0] || "Untitled").slice(0, 160);
  const body = (lines.length > 1 ? lines.slice(1).join("\n\n") : input.text).slice(0, 20000);
  const slug = slugify(title);

  await env.DB.prepare(
    `INSERT INTO blog_articles (id, slug, status, category, tags, cover_r2_key, published_at, created_by, created_at, updated_at, original_text)
     VALUES (?, ?, 'draft', 'journal', NULL, ?, NULL, ?, ?, ?, ?)`
  )
    .bind(id, slug, input.coverKey || null, input.createdBy || null, now, now, input.text.slice(0, 20000))
    .run();

  await env.DB.prepare(
    `INSERT INTO blog_translations (id, article_id, locale, title, body, seo_title, seo_description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      newId(),
      id,
      resolved,
      title,
      body,
      title.slice(0, 70),
      body.replace(/\s+/g, " ").slice(0, 160),
      now,
      now
    )
    .run();

  const article = (await getArticle(env, id))!;
  if (!input.skipTranslate) {
    await generateBlogLocale(env, id, "en").catch(() => undefined);
    await generateBlogLocale(env, id, "es").catch(() => undefined);
  }
  if (input.silent) {
    return article;
  }
  const bundle = await articleWithTranslations(env, id);
  const en = bundle?.translations.find((row) => row.locale === "en");
  const es = bundle?.translations.find((row) => row.locale === "es");
  await sendAdminMessage(
    env,
    [
      "📝 NEW BLOG DRAFT",
      `🇬🇧 ${en?.title || title}`,
      `🇪🇸 ${es?.title || title}`,
    ].join("\n"),
    { reply_markup: blogKeyboard(id) }
  ).catch(() => false);

  return article;
}

export async function getArticle(env: Env, idOrSlug: string): Promise<BlogArticle | null> {
  return env.DB.prepare(
    "SELECT * FROM blog_articles WHERE id = ? OR slug = ?"
  )
    .bind(idOrSlug, idOrSlug)
    .first<BlogArticle>();
}

export async function attachBlogText(
  env: Env,
  articleId: string,
  text: string
): Promise<BlogArticle | null> {
  const article = await getArticle(env, articleId);
  if (!article) {
    return null;
  }
  const now = nowIso();
  const lines = text.trim().split(/\n+/);
  const title = (lines[0] || "Untitled").slice(0, 160);
  const body = (lines.length > 1 ? lines.slice(1).join("\n\n") : text).slice(0, 20000);
  const locale = detectLocale(text);
  const resolved: SiteLocale = locale === "unknown" ? "en" : locale;
  await env.DB.prepare(
    "UPDATE blog_articles SET original_text = ?, slug = ?, updated_at = ? WHERE id = ?"
  )
    .bind(text.slice(0, 20000), slugify(title), now, articleId)
    .run();
  await env.DB.prepare("DELETE FROM blog_translations WHERE article_id = ?")
    .bind(articleId)
    .run();
  await env.DB.prepare(
    `INSERT INTO blog_translations (id, article_id, locale, title, body, seo_title, seo_description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(newId(), articleId, resolved, title, body, title.slice(0, 70), body.replace(/\s+/g, " ").slice(0, 160), now, now)
    .run();
  await generateBlogLocale(env, articleId, "en").catch(() => undefined);
  await generateBlogLocale(env, articleId, "es").catch(() => undefined);
  return getArticle(env, articleId);
}

export async function updateBlogTranslation(
  env: Env,
  articleId: string,
  locale: SiteLocale,
  text: string
): Promise<boolean> {
  const lines = text.trim().split(/\n+/);
  const title = (lines[0] || "Untitled").slice(0, 160);
  const body = (lines.length > 1 ? lines.slice(1).join("\n\n") : text).slice(0, 20000);
  const now = nowIso();
  const existing = await env.DB.prepare(
    "SELECT id FROM blog_translations WHERE article_id = ? AND locale = ?"
  )
    .bind(articleId, locale)
    .first();
  if (existing) {
    await env.DB.prepare(
      "UPDATE blog_translations SET title=?, body=?, seo_title=?, seo_description=?, updated_at=? WHERE article_id=? AND locale=?"
    )
      .bind(title, body, title.slice(0, 70), body.replace(/\s+/g, " ").slice(0, 160), now, articleId, locale)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO blog_translations (id, article_id, locale, title, body, seo_title, seo_description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(newId(), articleId, locale, title, body, title.slice(0, 70), body.replace(/\s+/g, " ").slice(0, 160), now, now)
      .run();
  }
  await env.DB.prepare("UPDATE blog_articles SET updated_at = ? WHERE id = ?")
    .bind(now, articleId)
    .run();
  return true;
}

export async function replaceBlogCover(env: Env, articleId: string, coverKey: string): Promise<void> {
  await env.DB.prepare("UPDATE blog_articles SET cover_r2_key = ?, updated_at = ? WHERE id = ?")
    .bind(coverKey, nowIso(), articleId)
    .run();
}

export async function listPublishedBlog(env: Env, locale: SiteLocale) {
  const rows = await env.DB.prepare(
    `SELECT a.id, a.slug, a.status, a.category, a.cover_r2_key, a.published_at, a.created_at,
            t.title, t.body, t.seo_title, t.seo_description, t.locale
     FROM blog_articles a
     JOIN blog_translations t ON t.article_id = a.id AND t.locale = ?
     WHERE a.status = 'published'
     ORDER BY a.published_at DESC
     LIMIT 50`
  )
    .bind(locale)
    .all();
  return rows.results || [];
}

export async function listBlogDrafts(env: Env) {
  const rows = await env.DB.prepare(
    `SELECT a.id, a.slug, a.status, a.category, a.cover_r2_key, a.published_at, a.created_at, a.updated_at, a.original_text,
            COALESCE(
              (SELECT t.title FROM blog_translations t WHERE t.article_id = a.id AND t.locale = 'en' LIMIT 1),
              (SELECT t.title FROM blog_translations t WHERE t.article_id = a.id LIMIT 1)
            ) as title
     FROM blog_articles a
     WHERE IFNULL(a.status, 'draft') != 'archived'
     ORDER BY a.updated_at DESC
     LIMIT 100`
  ).all();
  return rows.results || [];
}

export async function articleWithTranslations(env: Env, idOrSlug: string) {
  const article = await getArticle(env, idOrSlug);
  if (!article) {
    return null;
  }
  const translations = await env.DB.prepare(
    "SELECT locale, title, body, seo_title, seo_description FROM blog_translations WHERE article_id = ?"
  )
    .bind(article.id)
    .all<BlogTranslation>();
  return { article, translations: translations.results || [] };
}

export async function generateBlogLocale(
  env: Env,
  articleId: string,
  target: SiteLocale,
  force = false
): Promise<boolean> {
  const bundle = await articleWithTranslations(env, articleId);
  if (!bundle) {
    return false;
  }
  const source = bundle.translations.find((row) => row.locale !== target) || bundle.translations[0];
  if (!source) {
    return false;
  }
  const existing = bundle.translations.find((row) => row.locale === target);
  if (!force && existing?.title && existing.body && existing.body.length > 40) {
    return true;
  }

  const language = target === "es" ? "Spanish" : "English";
  const json = await geminiGenerateJson(
    env,
    [
      textPart(
        `Translate this private matchmaking journal post into ${language}.
Keep an elegant, discreet tone.
Preserve markdown structure exactly: # headings, ## subheadings, **bold**, lines starting with - for lists, and > for quotes.
Return JSON {"title","body","seo_title","seo_description"} where body keeps that markdown.

Title: ${source.title}

${source.body}`
      ),
    ],
    "You translate journal essays for Tango Slavique. English and Spanish only. Preserve markdown headings, bold, lists and quotes."
  );
  if (!json) {
    return false;
  }
  const now = nowIso();
  const title = String(json.title || source.title).slice(0, 160);
  const body = String(json.body || source.body).slice(0, 20000);
  const seoTitle = String(json.seo_title || title).slice(0, 70);
  const seoDescription = String(json.seo_description || body).slice(0, 160);

  if (existing) {
    await env.DB.prepare(
      `UPDATE blog_translations SET title=?, body=?, seo_title=?, seo_description=?, updated_at=?
       WHERE article_id=? AND locale=?`
    )
      .bind(title, body, seoTitle, seoDescription, now, articleId, target)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO blog_translations (id, article_id, locale, title, body, seo_title, seo_description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(newId(), articleId, target, title, body, seoTitle, seoDescription, now, now)
      .run();
  }
  await env.DB.prepare("UPDATE blog_articles SET updated_at = ? WHERE id = ?")
    .bind(now, articleId)
    .run();
  return true;
}

export async function publishArticle(env: Env, id: string): Promise<BlogArticle | null> {
  const bundle = await articleWithTranslations(env, id);
  if (!bundle) {
    return null;
  }
  const locales = new Set(bundle.translations.map((row) => row.locale));
  if (!locales.has("en")) {
    await generateBlogLocale(env, id, "en");
  }
  if (!locales.has("es")) {
    await generateBlogLocale(env, id, "es");
  }
  const now = nowIso();
  await env.DB.prepare(
    "UPDATE blog_articles SET status = 'published', published_at = ?, updated_at = ? WHERE id = ?"
  )
    .bind(now, now, id)
    .run();
  const published = await getArticle(env, id);
  const title =
    bundle.translations.find((row) => row.locale === "en")?.title ||
    bundle.translations[0]?.title ||
    "Blog";
  await sendAdminMessage(
    env,
    ["🌐 Blog published", title, published?.published_at || now, "EN + ES · public"].join("\n")
  ).catch(() => false);
  return published;
}

export async function unpublishArticle(env: Env, id: string): Promise<BlogArticle | null> {
  const now = nowIso();
  await env.DB.prepare(
    "UPDATE blog_articles SET status = 'unpublished', updated_at = ? WHERE id = ?"
  )
    .bind(now, id)
    .run();
  return getArticle(env, id);
}

export async function deleteArticle(env: Env, id: string): Promise<boolean> {
  const article = await getArticle(env, id);
  if (!article) {
    return false;
  }
  await env.DB.prepare(
    "UPDATE blog_articles SET status = 'archived', archived_at = ?, updated_at = ? WHERE id = ?"
  )
    .bind(nowIso(), nowIso(), id)
    .run();
  return true;
}

export async function saveBlogFromAdmin(
  env: Env,
  articleId: string,
  input: {
    originalText?: string;
    en?: string;
    es?: string;
  }
): Promise<BlogArticle | null> {
  const article = await getArticle(env, articleId);
  if (!article) {
    return null;
  }
  if (input.originalText && input.originalText.trim()) {
    if (input.en || input.es) {
      await env.DB.prepare(
        "UPDATE blog_articles SET original_text = ?, updated_at = ? WHERE id = ?"
      )
        .bind(input.originalText.slice(0, 20000), nowIso(), articleId)
        .run();
    } else {
      await attachBlogText(env, articleId, input.originalText);
    }
  }
  if (input.en && input.en.trim()) {
    await updateBlogTranslation(env, articleId, "en", input.en);
  }
  if (input.es && input.es.trim()) {
    await updateBlogTranslation(env, articleId, "es", input.es);
  }
  return getArticle(env, articleId);
}

export function publicBlogView(
  row: Record<string, unknown>
) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: String(row.body || "").replace(/\s+/g, " ").slice(0, 180),
    body: row.body,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    category: row.category,
    published_at: row.published_at,
    cover: row.cover_r2_key ? `/api/public/blog/${row.id}/cover` : null,
  };
}
