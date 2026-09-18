import type { Env } from "../env";
import { newId, nowIso } from "../crypto";
import {
  contentFieldById,
  contentFields,
  contentFieldsForPage,
  defaultContentValue,
  publicContentFilter,
  type ContentPage,
  type SiteLocale,
} from "../../../lib/content/catalog";

export type ContentRow = {
  id: string;
  page: string;
  section: string;
  field: string;
  locale: string;
  dict_path: string;
  published_value: string | null;
  draft_value: string | null;
  status: string;
  updated_at: string;
};

function rowId(fieldId: string, locale: SiteLocale) {
  return `${fieldId}:${locale}`;
}

export async function listContent(
  env: Env,
  page?: string
): Promise<ContentRow[]> {
  if (page) {
    const rows = await env.DB.prepare(
      "SELECT * FROM site_content WHERE page = ? ORDER BY field, locale"
    )
      .bind(page)
      .all<ContentRow>();
    return rows.results || [];
  }
  const rows = await env.DB.prepare(
    "SELECT * FROM site_content ORDER BY page, field, locale"
  ).all<ContentRow>();
  return rows.results || [];
}

export async function publishedContentMap(
  env: Env,
  locale: SiteLocale
): Promise<Record<string, string>> {
  const rows = await env.DB.prepare(
    "SELECT dict_path, published_value, status FROM site_content WHERE locale = ?"
  )
    .bind(locale)
    .all<{ dict_path: string; published_value: string | null; status: string }>();
  return publicContentFilter(rows.results || []);
}

export async function getContentRow(
  env: Env,
  fieldId: string,
  locale: SiteLocale
): Promise<ContentRow | null> {
  return env.DB.prepare(
    "SELECT * FROM site_content WHERE id = ?"
  )
    .bind(rowId(fieldId, locale))
    .first<ContentRow>();
}

export async function saveContentDraft(
  env: Env,
  fieldId: string,
  locale: SiteLocale,
  draftValue: string
): Promise<ContentRow | null> {
  const field = contentFieldById(fieldId);
  if (!field) {
    return null;
  }
  const id = rowId(fieldId, locale);
  const now = nowIso();
  const existing = await getContentRow(env, fieldId, locale);
  if (existing) {
    await env.DB.prepare(
      "UPDATE site_content SET draft_value = ?, status = 'draft', updated_at = ? WHERE id = ?"
    )
      .bind(draftValue.slice(0, 4000), now, id)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO site_content
        (id, page, section, field, locale, dict_path, published_value, draft_value, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 'draft', ?)`
    )
      .bind(
        id,
        field.page,
        field.section,
        field.field,
        locale,
        field.dictPath,
        draftValue.slice(0, 4000),
        now
      )
      .run();
  }
  return getContentRow(env, fieldId, locale);
}

export async function publishContent(
  env: Env,
  fieldId: string,
  locale: SiteLocale
): Promise<ContentRow | null> {
  const row = await getContentRow(env, fieldId, locale);
  if (!row) {
    return null;
  }
  const value = row.draft_value ?? row.published_value;
  if (!value) {
    return row;
  }
  await env.DB.prepare(
    "UPDATE site_content SET published_value = ?, draft_value = NULL, status = 'published', updated_at = ? WHERE id = ?"
  )
    .bind(value, nowIso(), row.id)
    .run();
  return getContentRow(env, fieldId, locale);
}

export async function cancelContentDraft(
  env: Env,
  fieldId: string,
  locale: SiteLocale
): Promise<void> {
  const row = await getContentRow(env, fieldId, locale);
  if (!row) {
    return;
  }
  await env.DB.prepare(
    "UPDATE site_content SET draft_value = NULL, status = 'published', updated_at = ? WHERE id = ?"
  )
    .bind(nowIso(), row.id)
    .run();
}

export function displayContentValue(
  row: ContentRow | null,
  field: { dictPath: string },
  locale: SiteLocale,
  preferDraft = false
): string {
  if (preferDraft && row?.draft_value) {
    return row.draft_value;
  }
  if (row?.published_value) {
    return row.published_value;
  }
  if (preferDraft && row?.draft_value) {
    return row.draft_value;
  }
  return defaultContentValue(field.dictPath, locale);
}

export { contentFields, contentFieldsForPage, contentFieldById, defaultContentValue };
export type { ContentPage, SiteLocale };
