import { describe, expect, it, vi } from "vitest";
import { handleApi } from "./routes";
import { handleCmsMessage, handleCmsCallback } from "./telegram/cms";
import { handleTelegramWebhook } from "./telegram/webhook";
import { isTelegramAdmin, parseTelegramAdminIds } from "./telegram/adminIds";
import { publicContentFilter } from "../../lib/content/catalog";
import {
  createPhotoDraft,
  attachBlogText,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  listPublishedBlog,
  listBlogDrafts,
  saveBlogFromAdmin,
  createBlogDraft,
} from "./blog/service";
import { createApplication, listApplications, updateApplicationStatus } from "./applications/service";
import { notifyUser, listInAppNotifications, markNotificationRead, markAllNotificationsRead } from "./notifications/service";
import { menuActionForText } from "./telegram/cmsCopy";
import {
  saveContentDraft,
  publishContent,
  publishedContentMap,
} from "./content/service";
import { sha256Hex } from "./crypto";
import type { Env } from "./env";

vi.mock("./telegram/api", () => ({
  sendTelegramMessage: vi.fn(async () => ({ ok: true })),
  sendTelegramPhotoFile: vi.fn(async () => ({ ok: true })),
  answerTelegramCallbackQuery: vi.fn(async () => ({ ok: true })),
  telegramApi: vi.fn(async () => ({ ok: true })),
}));

type Row = Record<string, unknown>;

function now() {
  return new Date().toISOString();
}

function createMemoryEnv(): Env & { store: Record<string, Row[]> } {
  const store: Record<string, Row[]> = {
    admin_workflows: [],
    blog_articles: [],
    blog_translations: [],
    site_content: [],
    users: [],
    sessions: [],
    applications: [],
    admin_actions: [],
    partner_preferences: [],
    profiles: [],
    photos: [],
    matches: [],
    introductions: [],
    feedback: [],
    notifications: [],
  };
  const r2 = new Map<string, Uint8Array>();

  const db = {
    prepare(sql: string) {
      const compact = sql.replace(/\s+/g, " ").trim();
      const exec = (params: unknown[] = []) => runSql(store, compact, params);
      return {
        bind(...params: unknown[]) {
          return {
            first: async () => exec(params)[0] || null,
            all: async () => ({ results: exec(params) }),
            run: async () => {
              exec(params);
              return { success: true };
            },
          };
        },
        first: async () => exec()[0] || null,
        all: async () => ({ results: exec() }),
        run: async () => {
          exec();
          return { success: true };
        },
      };
    },
  };

  return {
    store,
    DB: db as unknown as D1Database,
    PHOTOS: {
      put: async (key: string, value: ArrayBuffer | string) => {
        r2.set(
          key,
          typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value)
        );
      },
      get: async (key: string) => {
        const value = r2.get(key);
        if (!value) return null;
        const copy = value.slice();
        return {
          arrayBuffer: async () => copy.buffer,
          httpMetadata: { contentType: "image/jpeg" },
          body: copy,
        };
      },
    } as unknown as R2Bucket,
    TELEGRAM_BOT_TOKEN: "test-token",
    TELEGRAM_ADMIN_IDS: "1881305255,1591345305",
    TELEGRAM_ADMIN_CHAT_ID: "-100123",
    TELEGRAM_WEBHOOK_SECRET: "expected-secret",
    GEMINI_API_KEY: "",
    APP_ORIGIN: "https://tango.bavariagloss.de",
  };
}

function runSql(store: Record<string, Row[]>, sql: string, params: unknown[]): Row[] {
  const lower = sql.toLowerCase();

  if (lower.startsWith("insert into admin_workflows")) {
    const row = {
      admin_telegram_id: params[0],
      workflow: params[1],
      step: params[2],
      draft_id: params[3],
      extra: params[4],
      updated_at: params[5],
    };
    store.admin_workflows = store.admin_workflows.filter((item) => item.admin_telegram_id !== params[0]);
    store.admin_workflows.push(row);
    return [row];
  }
  if (lower.includes("from admin_workflows") && lower.includes("select")) {
    return store.admin_workflows.filter((item) => item.admin_telegram_id === params[0]);
  }
  if (lower.startsWith("delete from admin_workflows")) {
    store.admin_workflows = store.admin_workflows.filter((item) => item.admin_telegram_id !== params[0]);
    return [];
  }

  if (lower.startsWith("insert into blog_articles")) {
    const row: Row = {
      id: params[0],
      slug: params[1],
      status: "draft",
      category: "journal",
      tags: null,
      cover_r2_key: params[2],
      published_at: null,
      created_by: params[3],
      created_at: params[4],
      updated_at: params[5],
      original_text: params[6] ?? null,
      archived_at: null,
    };
    store.blog_articles.push(row);
    return [row];
  }
  if (lower.startsWith("insert into blog_translations")) {
    const row: Row = {
      id: params[0],
      article_id: params[1],
      locale: params[2],
      title: params[3],
      body: params[4],
      seo_title: params[5],
      seo_description: params[6],
      created_at: params[7],
      updated_at: params[8],
    };
    store.blog_translations.push(row);
    return [row];
  }
  if (lower.includes("from blog_articles") && lower.includes("id = ? or slug = ?")) {
    return store.blog_articles.filter((item) => item.id === params[0] || item.slug === params[1]);
  }
  if (lower.startsWith("update blog_articles set original_text = ?, updated_at")) {
    for (const row of store.blog_articles) {
      if (row.id === params[2]) {
        row.original_text = params[0];
        row.updated_at = params[1];
      }
    }
    return [];
  }
  if (lower.startsWith("update blog_articles set original_text")) {
    for (const row of store.blog_articles) {
      if (row.id === params[3]) {
        row.original_text = params[0];
        row.slug = params[1];
        row.updated_at = params[2];
      }
    }
    return [];
  }
  if (lower.startsWith("delete from blog_translations")) {
    store.blog_translations = store.blog_translations.filter((item) => item.article_id !== params[0]);
    return [];
  }
  if (lower.includes("from blog_translations") && lower.includes("article_id = ? and locale = ?")) {
    return store.blog_translations.filter(
      (item) => item.article_id === params[0] && item.locale === params[1]
    );
  }
  if (lower.startsWith("update blog_translations set title")) {
    for (const row of store.blog_translations) {
      if (row.article_id === params[5] && row.locale === params[6]) {
        row.title = params[0];
        row.body = params[1];
        row.seo_title = params[2];
        row.seo_description = params[3];
        row.updated_at = params[4];
      }
    }
    return [];
  }
  if (lower.startsWith("update blog_articles set updated_at")) {
    for (const row of store.blog_articles) {
      if (row.id === params[1]) row.updated_at = params[0];
    }
    return [];
  }
  if (lower.startsWith("update blog_articles set cover_r2_key")) {
    for (const row of store.blog_articles) {
      if (row.id === params[2]) {
        row.cover_r2_key = params[0];
        row.updated_at = params[1];
      }
    }
    return [];
  }
  if (lower.includes("from blog_articles a") && lower.includes("a.status = 'published'")) {
    return store.blog_articles
      .filter((article) => article.status === "published")
      .map((article) => {
        const translation = store.blog_translations.find(
          (item) => item.article_id === article.id && item.locale === params[0]
        );
        return translation
          ? { ...article, title: translation.title, body: translation.body, locale: translation.locale }
          : { ...article };
      })
      .filter(Boolean) as Row[];
  }
  if (lower.includes("from blog_articles a") && lower.includes("!= 'archived'")) {
    return store.blog_articles
      .filter((article) => article.status !== "archived")
      .map((article) => {
        const translation = store.blog_translations.find(
          (item) => item.article_id === article.id && item.locale === "en"
        );
        return { ...article, title: translation?.title || null, locale: translation?.locale || null };
      });
  }
  if (lower.includes("from blog_translations") && lower.includes("article_id = ?")) {
    return store.blog_translations.filter((item) => item.article_id === params[0]);
  }
  if (lower.startsWith("update blog_articles set status = 'published'")) {
    for (const row of store.blog_articles) {
      if (row.id === params[2]) {
        row.status = "published";
        row.published_at = params[0];
        row.updated_at = params[1];
      }
    }
    return [];
  }
  if (lower.startsWith("update blog_articles set status = 'unpublished'")) {
    for (const row of store.blog_articles) {
      if (row.id === params[1]) {
        row.status = "unpublished";
        row.updated_at = params[0];
      }
    }
    return [];
  }
  if (lower.startsWith("update blog_articles set status = 'archived'")) {
    for (const row of store.blog_articles) {
      if (row.id === params[2]) {
        row.status = "archived";
        row.archived_at = params[0];
        row.updated_at = params[1];
      }
    }
    return [];
  }

  if (lower.startsWith("insert into site_content")) {
    const row: Row = {
      id: params[0],
      page: params[1],
      section: params[2],
      field: params[3],
      locale: params[4],
      dict_path: params[5],
      published_value: null,
      draft_value: params[6],
      status: "draft",
      updated_at: params[7],
    };
    store.site_content.push(row);
    return [row];
  }
  if (lower.includes("from site_content where id = ?")) {
    return store.site_content.filter((item) => item.id === params[0]);
  }
  if (lower.includes("from site_content where locale = ?")) {
    return store.site_content.filter((item) => item.locale === params[0]);
  }
  if (lower.includes("from site_content where page = ?")) {
    return store.site_content.filter((item) => item.page === params[0]);
  }
  if (lower.includes("from site_content order by")) {
    return [...store.site_content];
  }
  if (lower.startsWith("update site_content set draft_value")) {
    for (const row of store.site_content) {
      if (row.id === params[2]) {
        row.draft_value = params[0];
        row.status = "draft";
        row.updated_at = params[1];
      }
    }
    return [];
  }
  if (lower.startsWith("update site_content set published_value")) {
    for (const row of store.site_content) {
      if (row.id === params[2]) {
        row.published_value = params[0];
        row.draft_value = null;
        row.status = "published";
        row.updated_at = params[1];
      }
    }
    return [];
  }
  if (lower.startsWith("update site_content set draft_value = null")) {
    for (const row of store.site_content) {
      if (row.id === params[1]) {
        row.draft_value = null;
        row.status = "published";
        row.updated_at = params[0];
      }
    }
    return [];
  }

  if (lower.includes("from users where telegram_user_id")) {
    return store.users.filter((item) => item.telegram_user_id === params[0]);
  }
  if (lower.includes("from sessions s") && lower.includes("token_hash")) {
    const session = store.sessions.find((item) => item.token_hash === params[0]);
    if (!session) return [];
    const user = store.users.find((item) => item.id === session.user_id);
    if (!user) return [];
    return [{ ...user, expires_at: session.expires_at }];
  }
  if (lower.startsWith("insert into sessions")) {
    store.sessions.push({
      id: params[0],
      user_id: params[1],
      token_hash: params[2],
      expires_at: params[3],
      created_at: params[4],
    });
    return [];
  }
  if (lower.startsWith("insert into applications")) {
    const row: Row = {
      id: params[0],
      user_id: params[1],
      name: params[2],
      email: params[3],
      phone: params[4],
      city: params[5],
      message: params[6],
      source: params[7],
      status: "new",
      created_at: params[8],
      updated_at: params[9],
    };
    store.applications.push(row);
    return [row];
  }
  if (lower.includes("from applications") && lower.includes("status in ('new', 'info_requested', 'approved')")) {
    const reusable = store.applications.filter(
      (item) => item.status === "new" || item.status === "info_requested" || item.status === "approved"
    );
    if (lower.includes("user_id = ?")) {
      return reusable.filter((item) => item.user_id === params[0]);
    }
    const email = String(params[0] || "").toLowerCase();
    const phone = String(params[2] || "").replace(/\D/g, "");
    return reusable.filter((item) => {
      const itemEmail = String(item.email || "").toLowerCase();
      const itemPhone = String(item.phone || "").replace(/\D/g, "");
      return (email && itemEmail === email) || (phone && itemPhone === phone);
    });
  }
  if (lower.includes("from applications where id = ?")) {
    return store.applications.filter((item) => item.id === params[0]);
  }
  if (lower.includes("from applications where status = ?")) {
    return store.applications.filter((item) => item.status === params[0]);
  }
  if (lower.includes("from applications where user_id = ?")) {
    return store.applications.filter((item) => item.user_id === params[0]);
  }
  if (lower.includes("from applications order by")) {
    return [...store.applications];
  }
  if (lower.startsWith("update applications set status")) {
    if (lower.includes("message")) {
      for (const row of store.applications) {
        if (row.id === params[2]) {
          row.status = "new";
          row.message = params[0];
          row.updated_at = params[1];
        }
      }
      return [];
    }
    for (const row of store.applications) {
      if (row.id === params[2] || row.user_id === params[1]) {
        if (lower.includes("where id = ?")) {
          if (row.id === params[2]) {
            row.status = params[0];
            row.updated_at = params[1];
          }
        } else {
          row.status = params[0];
          row.updated_at = params[1];
        }
      }
    }
    return [];
  }
  if (lower.startsWith("insert into admin_actions")) {
    store.admin_actions.push({
      id: params[0],
      admin_telegram_id: params[1],
      action: params[2],
      entity_type: "application",
      entity_id: params[3],
      created_at: params[4],
    });
    return [];
  }
  if (lower.startsWith("insert into notifications")) {
    if (lower.includes("'in_app'")) {
      store.notifications.push({
        id: params[0],
        user_id: params[1],
        channel: "in_app",
        type: params[2],
        payload: params[3],
        status: "unread",
        created_at: params[4],
      });
    } else {
      store.notifications.push({
        id: params[0],
        user_id: null,
        channel: "telegram",
        type: "application_new",
        payload: params[1],
        status: params[2],
        created_at: params[3],
      });
    }
    return [];
  }
  if (lower.includes("from notifications") && lower.includes("select")) {
    let rows = store.notifications.filter((item) => item.channel === "in_app");
    if (lower.includes("user_id = ?") && lower.includes("type = ?")) {
      return rows.filter(
        (item) =>
          item.user_id === params[0] &&
          item.type === params[1] &&
          item.status !== "archived" &&
          String(item.created_at) >= String(params[2])
      );
    }
    if (lower.includes("user_id = ?")) {
      rows = rows.filter((item) => item.user_id === params[0]);
    }
    if (lower.includes("and status = ?")) {
      const wanted = lower.includes("user_id = ?") ? params[1] : params[0];
      rows = rows.filter((item) => item.status === wanted);
    }
    if (lower.includes("status != 'archived'")) {
      rows = rows.filter((item) => item.status !== "archived");
    }
    return rows;
  }
  if (lower.startsWith("update notifications set status = 'read'")) {
    for (const row of store.notifications) {
      if (row.channel !== "in_app") continue;
      if (lower.includes("where id = ? and user_id = ?")) {
        if (row.id === params[0] && row.user_id === params[1]) row.status = "read";
      } else if (lower.includes("where id = ?")) {
        if (row.id === params[0]) row.status = "read";
      } else if (lower.includes("where user_id = ?")) {
        if (row.user_id === params[0] && row.status === "unread") row.status = "read";
      } else if (row.status === "unread") {
        row.status = "read";
      }
    }
    return [];
  }
  if (lower.includes("from users where id = ?")) {
    return store.users.filter((item) => item.id === params[0]);
  }
  if (lower.includes("from profiles where user_id")) {
    return store.profiles.filter((item) => item.user_id === params[0] || item.id === params[0]);
  }
  if (lower.startsWith("update profiles set status")) {
    for (const row of store.profiles) {
      if (row.user_id === params[1]) {
        row.status = "pending";
        row.updated_at = params[0];
      }
    }
    return [];
  }
  if (lower.includes("from photos where user_id")) {
    return store.photos.filter((item) => item.user_id === params[0]);
  }
  if (lower.startsWith("update applications set status = 'new', message")) {
    for (const row of store.applications) {
      if (row.id === params[2]) {
        row.status = "new";
        row.message = params[0];
        row.updated_at = params[1];
      }
    }
    return [];
  }
  if (lower.includes("from partner_preferences where user_id = ?")) {
    return store.partner_preferences.filter((item) => item.user_id === params[0]);
  }
  if (lower.startsWith("insert into partner_preferences")) {
    const row: Row = {
      id: params[0],
      user_id: params[1],
      gender: params[2],
      age_min: params[3],
      age_max: params[4],
      city: params[5],
      country: params[6],
      marital_status: params[7],
      children: params[8],
      languages: params[9],
      intent: params[10],
      notes: params[11],
      created_at: params[12],
      updated_at: params[13],
    };
    store.partner_preferences.push(row);
    return [row];
  }
  if (lower.startsWith("update partner_preferences set")) {
    for (const row of store.partner_preferences) {
      if (row.user_id === params[11]) {
        row.gender = params[0];
        row.age_min = params[1];
        row.age_max = params[2];
        row.city = params[3];
        row.country = params[4];
        row.marital_status = params[5];
        row.children = params[6];
        row.languages = params[7];
        row.intent = params[8];
        row.notes = params[9];
        row.updated_at = params[10];
      }
    }
    return [];
  }
  if (lower.startsWith("update users set admin_locale")) {
    for (const row of store.users) {
      if (row.id === params[2] || row.telegram_user_id === params[2]) {
        row.admin_locale = params[0];
        row.updated_at = params[1];
      }
    }
    return [];
  }
  if (lower.includes("select count(*)")) {
    if (lower.includes("blog_articles") && lower.includes("draft")) {
      return [{ n: store.blog_articles.filter((item) => item.status === "draft").length }];
    }
    return [{ n: 0 }];
  }

  return [];
}

function jpegBytes() {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 1, 2, 3]).buffer;
}

async function adminRequest(env: Env, path: string, init: RequestInit, telegramId: string) {
  const user = (env as unknown as { store: Record<string, Row[]> }).store.users.find(
    (item) => item.telegram_user_id === telegramId
  ) || envHasUser(env, telegramId);
  const token = "token-" + telegramId;
  const hash = await sha256Hex(token);
  (env as unknown as { store: Record<string, Row[]> }).store.sessions.push({
    id: "s" + telegramId,
    user_id: user.id,
    token_hash: hash,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: now(),
  });
  return handleApi(
    new Request("https://example.com" + path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    }),
    env,
    path
  );
}

function envHasUser(env: Env, telegramId: string) {
  const store = (env as unknown as { store: Record<string, Row[]> }).store;
  let user = store.users.find((item) => item.telegram_user_id === telegramId);
  if (!user) {
    user = {
      id: "u" + telegramId,
      telegram_user_id: telegramId,
      email: null,
      phone: null,
      role: "user",
      status: "active",
      admin_locale: "en",
    };
    store.users.push(user);
  }
  return user;
}

describe("cms authorization", () => {
  it("grants the same CMS access to every configured administrator", () => {
    const ids = parseTelegramAdminIds("1881305255,1591345305");
    expect(isTelegramAdmin(ids, "1881305255")).toBe(true);
    expect(isTelegramAdmin(ids, "1591345305")).toBe(true);
    expect(isTelegramAdmin(ids, "42")).toBe(false);
  });

  it("ignores /blog from non-admins", async () => {
    const env = createMemoryEnv();
    const response = await handleTelegramWebhook(
      new Request("https://example.com/api/telegram/webhook", {
        method: "POST",
        headers: { "X-Telegram-Bot-Api-Secret-Token": "expected-secret" },
        body: JSON.stringify({
          update_id: 9,
          message: {
            text: "/blog",
            from: { id: 42 },
            chat: { id: 42, type: "private" },
          },
        }),
      }),
      env
    );
    expect(response.status).toBe(200);
    expect(env.store.admin_workflows).toHaveLength(0);
  });
});

describe("blog workflow", () => {
  it("creates a photo draft, attaches text, publishes, unpublishes and archives", async () => {
    const env = createMemoryEnv();
    const draft = await createPhotoDraft(env, { coverKey: "blog/a/b.jpg", createdBy: "1881305255" });
    expect(draft.status).toBe("draft");
    await attachBlogText(env, draft.id, "A discreet evening in Barcelona\nThe house opened its doors.");
    const published = await publishArticle(env, draft.id);
    expect(published?.status).toBe("published");
    const live = await listPublishedBlog(env, "en");
    expect(live.length).toBe(1);
    await unpublishArticle(env, draft.id);
    const hidden = await listPublishedBlog(env, "en");
    expect(hidden.length).toBe(0);
    const stillThere = env.store.blog_articles.find((item) => item.id === draft.id);
    expect(stillThere?.status).toBe("unpublished");
    await deleteArticle(env, draft.id);
    expect(env.store.blog_articles.find((item) => item.id === draft.id)?.status).toBe("archived");
    expect((await listBlogDrafts(env)).length).toBe(0);
  });

  it("does not return drafts from the public blog list", async () => {
    const env = createMemoryEnv();
    const draft = await createPhotoDraft(env, { coverKey: "blog/a/b.jpg", createdBy: "1" });
    await saveBlogFromAdmin(env, draft.id, {
      originalText: "Draft only",
      en: "Draft only\nHidden",
    });
    const live = await listPublishedBlog(env, "en");
    expect(live.length).toBe(0);
  });

  it("runs the telegram /blog conversation for an authorized admin", async () => {
    const env = createMemoryEnv();
    envHasUser(env, "1591345305");
    const started = await handleCmsMessage(env, "1591345305", 1591345305, "/blog", null);
    expect(started).toBe(true);
    expect(env.store.admin_workflows[0]?.step).toBe("BLOG_WAITING_FOR_PHOTO");
    const photo = await handleCmsMessage(env, "1591345305", 1591345305, "", {
      bytes: jpegBytes(),
      mime: "image/jpeg",
    });
    expect(photo).toBe(true);
    expect(env.store.blog_articles).toHaveLength(1);
    const text = await handleCmsMessage(
      env,
      "1591345305",
      1591345305,
      "Evening notes\nA private dinner in the city.",
      null
    );
    expect(text).toBe(true);
    const articleId = String(env.store.blog_articles[0].id);
    await handleCmsCallback(env, "1591345305", 1591345305, `b:p:${articleId}`);
    expect(env.store.blog_articles[0].status).toBe("published");
    await handleCmsMessage(env, "1591345305", 1591345305, "/cancel", null);
    expect(env.store.admin_workflows).toHaveLength(0);
  });
});

describe("content cms", () => {
  it("keeps drafts off the public content api", async () => {
    const env = createMemoryEnv();
    await saveContentDraft(env, "home.hero.title", "en", "Secret draft title");
    const publicMap = await publishedContentMap(env, "en");
    expect(publicMap["hero.title"]).toBeUndefined();
    await publishContent(env, "home.hero.title", "en");
    const live = await publishedContentMap(env, "en");
    expect(live["hero.title"]).toBe("Secret draft title");
    expect(
      publicContentFilter([
        { dict_path: "hero.title", published_value: "Secret draft title", status: "published" },
        { dict_path: "hero.lead", published_value: "nope", status: "draft" },
      ])["hero.lead"]
    ).toBeUndefined();
  });

  it("requires admin authentication for content and blog writes", async () => {
    const env = createMemoryEnv();
    const anon = await handleApi(
      new Request("https://example.com/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId: "home.hero.title", locale: "en", draftValue: "x" }),
      }),
      env,
      "/api/admin/content"
    );
    expect(anon?.status).toBe(401);

    envHasUser(env, "42");
    const outsider = await adminRequest(
      env,
      "/api/admin/content",
      {
        method: "PATCH",
        body: JSON.stringify({ fieldId: "home.hero.title", locale: "en", draftValue: "x", action: "save" }),
      },
      "42"
    );
    expect(outsider?.status).toBe(403);

    const firstAdmin = await adminRequest(
      env,
      "/api/admin/content",
      {
        method: "PATCH",
        body: JSON.stringify({
          fieldId: "home.hero.title",
          locale: "en",
          draftValue: "Live title",
          action: "publish",
        }),
      },
      "1881305255"
    );
    expect(firstAdmin?.status).toBe(200);

    const secondAdmin = await adminRequest(
      env,
      "/api/admin/blog",
      {
        method: "POST",
        body: JSON.stringify({ originalText: "Second admin note\nBody", en: "Second admin note\nBody" }),
      },
      "1591345305"
    );
    expect(secondAdmin?.status).toBe(200);

    const publicContent = await handleApi(
      new Request("https://example.com/api/public/content?locale=en"),
      env,
      "/api/public/content"
    );
    const body = (await publicContent?.json()) as { data?: { overrides?: Record<string, string> } };
    expect(body.data?.overrides?.["hero.title"]).toBe("Live title");
  });
});

describe("blog article preservation", () => {
  it("keeps article A when article B is created", async () => {
    const env = createMemoryEnv();
    const first = await createBlogDraft(env, {
      text: "Article A\nThe house opened in silence.",
      skipTranslate: true,
      silent: true,
    });
    const second = await createBlogDraft(env, {
      text: "Article B\nA second evening in Madrid.",
      skipTranslate: true,
      silent: true,
    });
    expect(first.id).not.toBe(second.id);
    expect(env.store.blog_articles).toHaveLength(2);
    const listed = await listBlogDrafts(env);
    const ids = listed.map((item) => String((item as { id: string }).id));
    expect(ids).toContain(first.id);
    expect(ids).toContain(second.id);
    expect(env.store.blog_articles.find((item) => item.id === first.id)?.status).not.toBe("archived");
  });
});

describe("application statuses", () => {
  it("approves, rejects and requests information without deleting records", async () => {
    const env = createMemoryEnv();
    const pending = await createApplication(env, {
      name: "Maria",
      email: "",
      phone: "",
      city: "Madrid",
      message: "Hello",
      source: "test",
      silent: true,
    });
    expect(pending.application.status).toBe("new");
    expect((await listApplications(env, "new")).map((item) => item.id)).toContain(pending.application.id);

    await updateApplicationStatus(env, pending.application.id, "approved", "1881305255");
    expect((await listApplications(env, "new")).map((item) => item.id)).not.toContain(pending.application.id);
    expect((await listApplications(env, "approved")).map((item) => item.id)).toContain(pending.application.id);
    expect(env.store.applications.find((item) => item.id === pending.application.id)?.status).toBe("approved");

    await updateApplicationStatus(env, pending.application.id, "rejected", "1881305255");
    expect(env.store.applications.find((item) => item.id === pending.application.id)?.status).toBe("rejected");
    expect((await listApplications(env, "rejected")).map((item) => item.id)).toContain(pending.application.id);

    await updateApplicationStatus(
      env,
      pending.application.id,
      "info_requested",
      "1881305255",
      "Please add your city."
    );
    expect(env.store.applications.find((item) => item.id === pending.application.id)?.status).toBe(
      "info_requested"
    );
    expect((await listApplications(env, "info_requested")).map((item) => item.id)).toContain(
      pending.application.id
    );
  });
});

describe("preferences persistence", () => {
  it("saves relationship goals and keeps previous fields on a later intent-only save", async () => {
    const env = createMemoryEnv();
    envHasUser(env, "1591345305");
    const first = await adminRequest(
      env,
      "/api/preferences",
      { method: "PATCH", body: JSON.stringify({ intent: "marriage", city: "Madrid" }) },
      "1591345305"
    );
    expect(first?.status).toBe(200);
    const marriage = (await first?.json()) as { data?: { intent?: string; city?: string } };
    expect(marriage.data?.intent).toBe("marriage");

    const second = await adminRequest(
      env,
      "/api/preferences",
      { method: "PATCH", body: JSON.stringify({ intent: "friendship" }) },
      "1591345305"
    );
    expect(second?.status).toBe(200);
    const friendship = (await second?.json()) as { data?: { intent?: string; city?: string } };
    expect(friendship.data?.intent).toBe("friendship");
    expect(friendship.data?.city).toBe("Madrid");

    const third = await adminRequest(
      env,
      "/api/preferences",
      { method: "PATCH", body: JSON.stringify({ intent: "relationship" }) },
      "1591345305"
    );
    const relationship = (await third?.json()) as { data?: { intent?: string; city?: string } };
    expect(relationship.data?.intent).toBe("relationship");
    expect(relationship.data?.city).toBe("Madrid");

    const loaded = await adminRequest(env, "/api/preferences", { method: "GET" }, "1591345305");
    const body = (await loaded?.json()) as { data?: { intent?: string; city?: string } };
    expect(body.data?.intent).toBe("relationship");
    expect(body.data?.city).toBe("Madrid");
  });
});

describe("admin locale", () => {
  it("persists Mini App UI language without touching blog content", async () => {
    const env = createMemoryEnv();
    await createBlogDraft(env, { text: "Kept English title\nBody", skipTranslate: true, silent: true });
    const patch = await adminRequest(
      env,
      "/api/me",
      { method: "PATCH", body: JSON.stringify({ adminLocale: "ru" }) },
      "1881305255"
    );
    expect(patch?.status).toBe(200);
    const me = await adminRequest(env, "/api/me", { method: "GET" }, "1881305255");
    const body = (await me?.json()) as { data?: { adminLocale?: string } };
    expect(body.data?.adminLocale).toBe("ru");
    expect(env.store.blog_translations[0]?.title).toBe("Kept English title");
    expect(menuActionForText("🛠 Админ-панель")).toBe("admin");
    expect(menuActionForText("📋 Applications")).toBe("applications");
  });
});

describe("blog cover bytes", () => {
  it("stores the uploaded photo bytes without replacing the original", async () => {
    const env = createMemoryEnv();
    envHasUser(env, "1591345305");
    await handleCmsMessage(env, "1591345305", 1591345305, "/blog", null);
    const bytes = jpegBytes();
    await handleCmsMessage(env, "1591345305", 1591345305, "", { bytes, mime: "image/jpeg" });
    const key = String(env.store.blog_articles[0]?.cover_r2_key || "");
    const stored = await env.PHOTOS.get(key);
    expect(stored).toBeTruthy();
    const storedBytes = new Uint8Array((await stored!.arrayBuffer()) as ArrayBuffer);
    expect(Array.from(storedBytes)).toEqual(Array.from(new Uint8Array(bytes)));
  });
});

describe("registration applications", () => {
  it("accepts a public website registration into D1", async () => {
    const env = createMemoryEnv();
    const response = await handleApi(
      new Request("https://example.com/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Elena",
          phone: "+34600000000",
          city: "Madrid",
          lookingFor: "man",
          source: "website",
        }),
      }),
      env,
      "/api/applications"
    );
    expect(response?.status).toBe(200);
    const body = (await response?.json()) as { data?: { id?: string; status?: string } };
    expect(body.data?.status).toBe("new");
    expect(env.store.applications).toHaveLength(1);
    expect(env.store.applications[0]?.name).toBe("Elena");
  });

  it("reuses a pending website application with the same email", async () => {
    const env = createMemoryEnv();
    const first = await handleApi(
      new Request("https://example.com/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Regtest",
          lastName: "Cursor",
          email: "regtest.reuse@example.invalid",
          source: "website",
        }),
      }),
      env,
      "/api/applications"
    );
    const second = await handleApi(
      new Request("https://example.com/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Regtest",
          lastName: "Cursor",
          email: "regtest.reuse@example.invalid",
          source: "website",
        }),
      }),
      env,
      "/api/applications"
    );
    const firstBody = (await first?.json()) as { data?: { id?: string; reused?: boolean } };
    const secondBody = (await second?.json()) as { data?: { id?: string; reused?: boolean } };
    expect(first?.status).toBe(200);
    expect(second?.status).toBe(200);
    expect(secondBody.data?.id).toBe(firstBody.data?.id);
    expect(secondBody.data?.reused).toBe(true);
    expect(env.store.applications).toHaveLength(1);
  });

  it("keeps a rejected application and creates a new one", async () => {
    const env = createMemoryEnv();
    const created = await createApplication(env, {
      name: "Rejected Applicant",
      email: "rejected.reuse@example.invalid",
      phone: "",
      city: "Madrid",
      message: "Hello",
      source: "website",
      silent: true,
    });
    await updateApplicationStatus(env, created.application.id, "rejected", "1881305255");
    const again = await handleApi(
      new Request("https://example.com/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Rejected Applicant",
          email: "rejected.reuse@example.invalid",
          source: "website",
        }),
      }),
      env,
      "/api/applications"
    );
    const body = (await again?.json()) as { data?: { id?: string; reused?: boolean } };
    expect(again?.status).toBe(200);
    expect(body.data?.id).not.toBe(created.application.id);
    expect(body.data?.reused).toBeFalsy();
    expect(env.store.applications).toHaveLength(2);
    expect(env.store.applications.find((item) => item.id === created.application.id)?.status).toBe(
      "rejected"
    );
  });

  it("returns an existing needs-information application to pending on resubmit", async () => {
    const env = createMemoryEnv();
    const user = envHasUser(env, "42");
    env.store.profiles.push({
      id: "p42",
      user_id: user.id,
      first_name: "Maria",
      city: "Madrid",
      about: "Updated city and photos",
      status: "pending",
    });
    env.store.photos.push({
      id: "ph42",
      user_id: user.id,
      r2_key: "photos/a.jpg",
      mime_type: "image/jpeg",
      sort_order: 0,
    });
    const created = await createApplication(env, {
      name: "Maria",
      email: "",
      phone: "",
      city: "Madrid",
      message: "Hello",
      source: "miniapp",
      userId: String(user.id),
      silent: true,
    });
    await updateApplicationStatus(env, created.application.id, "info_requested", "1881305255", "Please add a city.");
    const resubmit = await adminRequest(env, "/api/profile/submit", { method: "POST", body: "{}" }, "42");
    expect(resubmit?.status).toBe(200);
    expect(env.store.applications).toHaveLength(1);
    expect(env.store.applications[0]?.status).toBe("new");
    expect(env.store.applications[0]?.id).toBe(created.application.id);
  });
});

describe("in-app notifications", () => {
  it("marks one and all as read and skips duplicate events", async () => {
    const env = createMemoryEnv();
    const user = envHasUser(env, "42");
    await notifyUser(env, String(user.id), "application_submitted");
    await notifyUser(env, String(user.id), "application_submitted");
    const unread = await listInAppNotifications(env, String(user.id), "unread");
    expect(unread).toHaveLength(1);
    await markNotificationRead(env, String(unread[0]?.id), String(user.id));
    expect(await listInAppNotifications(env, String(user.id), "unread")).toHaveLength(0);
    expect(await listInAppNotifications(env, String(user.id), "read")).toHaveLength(1);
    await notifyUser(env, String(user.id), "application_approved");
    await markAllNotificationsRead(env, String(user.id));
    expect(await listInAppNotifications(env, String(user.id), "unread")).toHaveLength(0);
    const listed = await listInAppNotifications(env, String(user.id));
    expect(listed.every((item) => item.status === "read")).toBe(true);
    expect(listed.every((item) => item.channel === "in_app")).toBe(true);
  });
});

describe("blog structured formatting", () => {
  it("keeps markdown structure on create, draft, publish and unpublish", async () => {
    const env = createMemoryEnv();
    const markdown = [
      "A considered house",
      "## Why discretion",
      "# The interview",
      "A **private** introduction.",
      "- Verified profiles",
      "> Taste over volume",
    ].join("\n");
    const first = await createBlogDraft(env, { text: markdown, skipTranslate: true, silent: true });
    const second = await createBlogDraft(env, { text: "Second evening\nAnother night.", skipTranslate: true, silent: true });
    expect(env.store.blog_articles).toHaveLength(2);
    expect(String(env.store.blog_articles.find((item) => item.id === first.id)?.original_text)).toContain("**private**");
    expect(env.store.blog_translations.find((item) => item.article_id === first.id)?.body).toContain("# The interview");
    expect((await listPublishedBlog(env, "en")).length).toBe(0);
    await publishArticle(env, first.id);
    const live = await listPublishedBlog(env, "en");
    expect(live.some((item) => String((item as { id: string }).id) === first.id)).toBe(true);
    expect(live.some((item) => String((item as { id: string }).id) === second.id)).toBe(false);
    await unpublishArticle(env, first.id);
    expect((await listPublishedBlog(env, "en")).length).toBe(0);
    expect(env.store.blog_articles.find((item) => item.id === first.id)?.status).toBe("unpublished");
    expect(env.store.blog_articles.find((item) => item.id === second.id)?.status).toBe("draft");
  });
});
