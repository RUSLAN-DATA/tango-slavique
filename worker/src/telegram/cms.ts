import type { Env } from "../env";
import { newId } from "../crypto";
import { detectImageType, MAX_PHOTO_BYTES } from "../photos/validate";
import {
  attachBlogText,
  blogEditKeyboard,
  blogListKeyboard,
  createPhotoDraft,
  deleteArticle,
  listBlogDrafts,
  publishArticle,
  replaceBlogCover,
  unpublishArticle,
  updateBlogTranslation,
  articleWithTranslations,
} from "../blog/service";
import { clearWorkflow, getWorkflow, setWorkflow, workflowExtra } from "../workflows/service";
import {
  cancelContentDraft,
  contentFieldById,
  contentFieldsForPage,
  getContentRow,
  publishContent,
  saveContentDraft,
  displayContentValue,
} from "../content/service";
import { contentPages } from "../../../lib/content/catalog";
import { updateApplicationStatus } from "../applications/service";
import { sendTelegramMessage, sendTelegramPhotoFile } from "./api";
import type { SiteLocale } from "../blog/language";
import { copyFor, localeForAdmin } from "./cmsCopy";

async function reply(env: Env, chatId: number | string, text: string, extra: Record<string, unknown> = {}) {
  await sendTelegramMessage(env, chatId, text, extra);
}

export async function sendBlogPreview(
  env: Env,
  chatId: number | string,
  articleId: string,
  adminId?: string
) {
  const locale = adminId ? await localeForAdmin(env, adminId) : "en";
  const t = copyFor(locale);
  const bundle = await articleWithTranslations(env, articleId);
  if (!bundle) {
    await reply(env, chatId, t.draftNotFound);
    return;
  }
  const en = bundle.translations.find((row) => row.locale === "en");
  const es = bundle.translations.find((row) => row.locale === "es");
  const text = [
    `📰 ${t.previewTitle}`,
    `EN: ${(en?.title || "—").slice(0, 120)}`,
    (en?.body || "").slice(0, 400),
    "",
    `ES: ${(es?.title || "—").slice(0, 120)}`,
    (es?.body || "").slice(0, 400),
  ].join("\n");
  const keyboard = {
    reply_markup:
      bundle.article.status === "published"
        ? blogListKeyboard(articleId, bundle.article.status, locale)
        : {
            inline_keyboard: [
              [
                { text: `✏️ ${t.edit}`, callback_data: `b:e:${articleId}` },
                { text: `👁 ${t.preview}`, callback_data: `b:v:${articleId}` },
              ],
              [
                { text: `🚀 ${t.publish}`, callback_data: `b:p:${articleId}` },
                { text: `❌ ${t.cancel}`, callback_data: `b:c:${articleId}` },
              ],
            ],
          },
  };
  if (bundle.article.cover_r2_key) {
    const object = await env.PHOTOS.get(bundle.article.cover_r2_key);
    if (object) {
      await sendTelegramPhotoFile(
        env,
        chatId,
        await object.arrayBuffer(),
        "cover.jpg",
        object.httpMetadata?.contentType || "image/jpeg",
        text.slice(0, 1000),
        keyboard
      ).catch(() => reply(env, chatId, text, keyboard));
      return;
    }
  }
  await reply(env, chatId, text, keyboard);
}

export async function startBlogCreate(env: Env, adminId: string, chatId: number | string) {
  const t = copyFor(await localeForAdmin(env, adminId));
  await setWorkflow(env, adminId, {
    workflow: "BLOG_CREATE",
    step: "BLOG_WAITING_FOR_PHOTO",
  });
  await reply(env, chatId, `📰 ${t.blogCreate}\n${t.sendPhoto}`);
}

export async function listBlogsCommand(
  env: Env,
  adminId: string,
  chatId: number | string,
  offset = 0
) {
  const locale = await localeForAdmin(env, adminId);
  const t = copyFor(locale);
  const items = await listBlogDrafts(env);
  if (!items.length) {
    await reply(env, chatId, `${t.listTitle}\n${t.emptyBlog}`, {
      reply_markup: {
        inline_keyboard: [[{ text: `➕ ${t.newBlog}`, callback_data: "b:n" }]],
      },
    });
    return;
  }
  const pageSize = 20;
  const page = items.slice(offset, offset + pageSize);
  const lines = page.map((item, index) => {
    const row = item as { id: string; title?: string; status: string };
    const label =
      row.status === "published"
        ? t.public
        : row.status === "unpublished"
          ? t.unpublish
          : t.pending;
    return `${offset + index + 1}. ${row.title || t.untitled} — ${label}`;
  });
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [
    [{ text: `➕ ${t.newBlog}`, callback_data: "b:n" }],
  ];
  if (offset + pageSize < items.length) {
    buttons.push([{ text: `➡️ ${t.next}`, callback_data: `b:ls:${offset + pageSize}` }]);
  }
  await reply(env, chatId, `📰 ${t.listTitle}\n${lines.join("\n")}`, {
    reply_markup: { inline_keyboard: buttons },
  });
  for (const item of page) {
    const row = item as { id: string; title?: string; status: string };
    await reply(env, chatId, `${row.title || t.untitled}`, {
      reply_markup: blogListKeyboard(row.id, row.status, locale),
    });
  }
}

export async function startContent(env: Env, adminId: string, chatId: number | string) {
  const locale = await localeForAdmin(env, adminId);
  const t = copyFor(locale);
  await setWorkflow(env, adminId, { workflow: "CONTENT_EDIT", step: "CONTENT_SELECT_PAGE" });
  await reply(env, chatId, `🌐 ${t.contentTitle}\n${t.contentPick}`, {
    reply_markup: {
      inline_keyboard: contentPages.map((page) => [
        { text: page.label[locale], callback_data: `c:pg:${page.id}` },
      ]),
    },
  });
}

async function saveBlogPhoto(
  env: Env,
  bytes: ArrayBuffer,
  mime: string
): Promise<string | null> {
  const detected = detectImageType(bytes);
  if (!detected || bytes.byteLength > MAX_PHOTO_BYTES) {
    return null;
  }
  const key = `blog/${newId()}/${newId()}.${detected.ext}`;
  await env.PHOTOS.put(key, bytes, {
    httpMetadata: { contentType: detected.mime || mime },
  });
  return key;
}

export async function handleCmsMessage(
  env: Env,
  adminId: string,
  chatId: number | string,
  text: string,
  file: { bytes: ArrayBuffer; mime: string } | null
): Promise<boolean> {
  const t = copyFor(await localeForAdmin(env, adminId));
  if (/^\/cancel(?:@\w+)?$/i.test(text.trim())) {
    await clearWorkflow(env, adminId);
    await reply(env, chatId, t.cancelled);
    return true;
  }
  if (/^\/blog(?:@\w+)?$/i.test(text.trim())) {
    await startBlogCreate(env, adminId, chatId);
    return true;
  }
  if (/^\/blogs(?:@\w+)?$/i.test(text.trim())) {
    await listBlogsCommand(env, adminId, chatId);
    return true;
  }
  if (/^\/content(?:@\w+)?$/i.test(text.trim())) {
    await startContent(env, adminId, chatId);
    return true;
  }

  const flow = await getWorkflow(env, adminId);
  if (flow?.workflow === "NEED_INFO" && flow.step === "WAITING_TEXT") {
    const extra = workflowExtra(flow);
    if (!text.trim() || !extra.applicationId) {
      await reply(env, chatId, t.needInfoAsk);
      return true;
    }
    await updateApplicationStatus(env, extra.applicationId, "info_requested", adminId, text.trim());
    await clearWorkflow(env, adminId);
    await reply(env, chatId, t.needInfoSaved);
    return true;
  }
  if (!flow) {
    return false;
  }

  if (flow.workflow === "BLOG_CREATE" && flow.step === "BLOG_WAITING_FOR_PHOTO") {
    if (!file) {
      await reply(env, chatId, t.needPhoto);
      return true;
    }
    const key = await saveBlogPhoto(env, file.bytes, file.mime);
    if (!key) {
      await reply(env, chatId, t.needPhoto);
      return true;
    }
    const draft = await createPhotoDraft(env, { coverKey: key, createdBy: adminId });
    await setWorkflow(env, adminId, {
      workflow: "BLOG_CREATE",
      step: "BLOG_WAITING_FOR_TEXT",
      draftId: draft.id,
    });
    await reply(env, chatId, `✅ ${t.photoReceived}`);
    return true;
  }

  if (flow.workflow === "BLOG_CREATE" && flow.step === "BLOG_WAITING_FOR_TEXT") {
    if (!text.trim()) {
      await reply(env, chatId, t.sendText);
      return true;
    }
    if (!flow.draft_id) {
      await clearWorkflow(env, adminId);
      return true;
    }
    await attachBlogText(env, flow.draft_id, text);
    await setWorkflow(env, adminId, {
      workflow: "BLOG_CREATE",
      step: "BLOG_PREVIEW",
      draftId: flow.draft_id,
    });
    await sendBlogPreview(env, chatId, flow.draft_id, adminId);
    return true;
  }

  if (flow.workflow === "BLOG_EDIT" && flow.draft_id) {
    const extra = workflowExtra(flow);
    if (flow.step === "BLOG_EDIT_PHOTO") {
      if (!file) {
        await reply(env, chatId, t.sendNewPhoto);
        return true;
      }
      const key = await saveBlogPhoto(env, file.bytes, file.mime);
      if (!key) {
        await reply(env, chatId, t.needPhoto);
        return true;
      }
      await replaceBlogCover(env, flow.draft_id, key);
      await setWorkflow(env, adminId, {
        workflow: "BLOG_CREATE",
        step: "BLOG_PREVIEW",
        draftId: flow.draft_id,
      });
      await sendBlogPreview(env, chatId, flow.draft_id, adminId);
      return true;
    }
    if (!text.trim()) {
      return true;
    }
    if (flow.step === "BLOG_EDIT_ORIGINAL") {
      await attachBlogText(env, flow.draft_id, text);
    } else if (flow.step === "BLOG_EDIT_EN" || extra.locale === "en") {
      await updateBlogTranslation(env, flow.draft_id, "en", text);
    } else if (flow.step === "BLOG_EDIT_ES" || extra.locale === "es") {
      await updateBlogTranslation(env, flow.draft_id, "es", text);
    }
    await setWorkflow(env, adminId, {
      workflow: "BLOG_CREATE",
      step: "BLOG_PREVIEW",
      draftId: flow.draft_id,
    });
    await sendBlogPreview(env, chatId, flow.draft_id, adminId);
    return true;
  }

  if (flow.workflow === "CONTENT_EDIT" && flow.step === "CONTENT_WAITING_TEXT") {
    const extra = workflowExtra(flow);
    const fieldId = extra.fieldId;
    const locale = (extra.locale === "es" ? "es" : "en") as SiteLocale;
    if (!fieldId || !text.trim()) {
      await reply(env, chatId, t.sendNewValue);
      return true;
    }
    const field = contentFieldById(fieldId);
    const current = await getContentRow(env, fieldId, locale);
    await saveContentDraft(env, fieldId, locale, text);
    await setWorkflow(env, adminId, {
      workflow: "CONTENT_EDIT",
      step: "CONTENT_PREVIEW",
      extra: { fieldId, locale },
    });
    const oldValue = displayContentValue(current, field || { dictPath: fieldId }, locale);
    await reply(
      env,
      chatId,
      `👁 ${t.previewTitle}\n${t.previewOld}:\n${oldValue}\n\n${t.previewNew}:\n${text}\n\n${field?.label.en || fieldId}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: `💾 ${t.publish}`, callback_data: `c:pb:${fieldId}:${locale}` },
              { text: `❌ ${t.cancel}`, callback_data: `c:x:${fieldId}:${locale}` },
            ],
          ],
        },
      }
    );
    return true;
  }

  return false;
}

export async function handleCmsCallback(
  env: Env,
  adminId: string,
  chatId: number | string,
  data: string
): Promise<boolean> {
  const locale = await localeForAdmin(env, adminId);
  const t = copyFor(locale);
  if (data === "b:n") {
    await startBlogCreate(env, adminId, chatId);
    return true;
  }
  const listPage = data.match(/^b:ls:(\d+)$/);
  if (listPage) {
    await listBlogsCommand(env, adminId, chatId, Number(listPage[1]));
    return true;
  }

  const blog = data.match(/^b:(p|v|c|e|u|d|en|es|or|ph):([a-f0-9]{8,32})$/i);
  if (blog) {
    const action = blog[1].toLowerCase();
    const id = blog[2];
    if (action === "p") {
      const article = await publishArticle(env, id);
      await clearWorkflow(env, adminId);
      const bundle = await articleWithTranslations(env, id);
      const date = article?.published_at || "";
      const title = bundle?.translations.find((row) => row.locale === "en")?.title || "";
      await reply(
        env,
        chatId,
        [
          `✅ ${t.published}`,
          title,
          date,
          `${t.languages}: EN, ES`,
          `${t.public}`,
        ].join("\n")
      );
      return true;
    }
    if (action === "v") {
      await sendBlogPreview(env, chatId, id, adminId);
      return true;
    }
    if (action === "c" || action === "d") {
      await deleteArticle(env, id);
      await clearWorkflow(env, adminId);
      await reply(env, chatId, t.deleted);
      return true;
    }
    if (action === "u") {
      await unpublishArticle(env, id);
      await reply(env, chatId, t.unpublished);
      return true;
    }
    if (action === "e") {
      await setWorkflow(env, adminId, { workflow: "BLOG_EDIT", step: "BLOG_EDIT_MENU", draftId: id });
      await reply(env, chatId, `✏️ ${t.editWhat}`, { reply_markup: blogEditKeyboard(id, locale) });
      return true;
    }
    if (action === "en") {
      await setWorkflow(env, adminId, {
        workflow: "BLOG_EDIT",
        step: "BLOG_EDIT_EN",
        draftId: id,
        extra: { locale: "en" },
      });
      await reply(env, chatId, t.sendEnglish);
      return true;
    }
    if (action === "es") {
      await setWorkflow(env, adminId, {
        workflow: "BLOG_EDIT",
        step: "BLOG_EDIT_ES",
        draftId: id,
        extra: { locale: "es" },
      });
      await reply(env, chatId, t.sendSpanish);
      return true;
    }
    if (action === "or") {
      await setWorkflow(env, adminId, { workflow: "BLOG_EDIT", step: "BLOG_EDIT_ORIGINAL", draftId: id });
      await reply(env, chatId, t.sendOriginal);
      return true;
    }
    if (action === "ph") {
      await setWorkflow(env, adminId, { workflow: "BLOG_EDIT", step: "BLOG_EDIT_PHOTO", draftId: id });
      await reply(env, chatId, t.sendNewPhoto);
      return true;
    }
  }

  const pagePick = data.match(/^c:pg:(home|about|how|contact|footer)$/);
  if (pagePick) {
    const locale = await localeForAdmin(env, adminId);
    const page = pagePick[1];
    await setWorkflow(env, adminId, {
      workflow: "CONTENT_EDIT",
      step: "CONTENT_SELECT_FIELD",
      extra: { page },
    });
    const fields = contentFieldsForPage(page);
    await reply(env, chatId, t.contentPick, {
      reply_markup: {
        inline_keyboard: [
          ...fields.map((field) => [
            { text: field.label[locale], callback_data: `c:fd:${field.id}` },
          ]),
          [{ text: `↩️ ${t.back}`, callback_data: "c:home" }],
        ],
      },
    });
    return true;
  }

  if (data === "c:home") {
    await startContent(env, adminId, chatId);
    return true;
  }

  const fieldPick = data.match(/^c:fd:(.+)$/);
  if (fieldPick) {
    const locale = await localeForAdmin(env, adminId);
    const fieldId = fieldPick[1];
    const field = contentFieldById(fieldId);
    if (!field) {
      return true;
    }
    const en = await getContentRow(env, fieldId, "en");
    const es = await getContentRow(env, fieldId, "es");
    await setWorkflow(env, adminId, {
      workflow: "CONTENT_EDIT",
      step: "CONTENT_SELECT_LOCALE",
      extra: { fieldId },
    });
    await reply(
      env,
      chatId,
      [
        field.label[locale],
        `EN:\n${displayContentValue(en, field, "en") || "—"}`,
        "",
        `ES:\n${displayContentValue(es, field, "es") || "—"}`,
      ].join("\n"),
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: `🇬🇧 ${t.english}`, callback_data: `c:ed:${fieldId}:en` },
              { text: `🇪🇸 ${t.spanish}`, callback_data: `c:ed:${fieldId}:es` },
            ],
            [{ text: `↩️ ${t.back}`, callback_data: `c:pg:${field.page}` }],
          ],
        },
      }
    );
    return true;
  }

  const editField = data.match(/^c:ed:(.+):(en|es)$/);
  if (editField) {
    const fieldId = editField[1];
    const siteLocale = editField[2] as SiteLocale;
    const field = contentFieldById(fieldId);
    if (!field) {
      return true;
    }
    const row = await getContentRow(env, fieldId, siteLocale);
    await setWorkflow(env, adminId, {
      workflow: "CONTENT_EDIT",
      step: "CONTENT_WAITING_TEXT",
      extra: { fieldId, locale: siteLocale },
    });
    await reply(
      env,
      chatId,
      `${field.label.en}\n${displayContentValue(row, field, siteLocale) || "—"}\n\n${t.sendNewValue}`
    );
    return true;
  }

  const publish = data.match(/^c:pb:(.+):(en|es)$/);
  if (publish) {
    await publishContent(env, publish[1], publish[2] as SiteLocale);
    await clearWorkflow(env, adminId);
    await reply(env, chatId, t.published);
    return true;
  }
  const cancel = data.match(/^c:x:(.+):(en|es)$/);
  if (cancel) {
    await cancelContentDraft(env, cancel[1], cancel[2] as SiteLocale);
    await clearWorkflow(env, adminId);
    await reply(env, chatId, t.cancelled);
    return true;
  }

  return false;
}
