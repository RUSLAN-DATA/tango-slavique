import type { Env } from "../env";
import { newId, nowIso } from "../crypto";
import {
  getApplication,
  listApplications,
  updateApplicationStatus,
  type ApplicationStatus,
} from "../applications/service";
import { runMatchingForUser } from "../matches/service";
import { listPhotos } from "../photos/service";
import { overridePhotoReview } from "../photos/review";
import {
  generateBlogLocale,
  listBlogDrafts,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  articleWithTranslations,
} from "../blog/service";
import { isTelegramAdmin, parseTelegramAdminIds } from "./adminIds";
import { answerTelegramCallbackQuery, sendTelegramMessage, sendTelegramPhotoFile } from "./api";
import { attachLatestInbox } from "./adminInbox";
import { sendProfileCard, setProfileVisibility } from "./profileCards";
import { applicationActionKeyboard, adminPanelButton, miniAppStartLink } from "./miniAppLinks";

async function approveUser(env: Env, userId: string, adminId: string) {
  await setProfileVisibility(env, userId, "public");
  const photos = await listPhotos(env, userId);
  for (const photo of photos) {
    const review = await env.DB.prepare(
      "SELECT review_status FROM photo_reviews WHERE photo_id = ?"
    )
      .bind(photo.id)
      .first<{ review_status: string }>();
    if (!review || review.review_status === "AI_OK") {
      await env.DB.prepare("UPDATE photos SET status = 'approved' WHERE id = ?")
        .bind(photo.id)
        .run();
    }
  }
  const application = await env.DB.prepare(
    "SELECT id FROM applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
  )
    .bind(userId)
    .first<{ id: string }>();
  if (application) {
    await updateApplicationStatus(env, application.id, "approved", adminId);
  }
  await runMatchingForUser(env, userId).catch(() => 0);
}

export async function handleAdminCallback(
  env: Env,
  fromId: string,
  callbackId: string,
  data: string,
  replyChatId: number | string | null
): Promise<void> {
  const admins = parseTelegramAdminIds(env.TELEGRAM_ADMIN_IDS);
  if (!isTelegramAdmin(admins, fromId)) {
    await answerTelegramCallbackQuery(env, callbackId, "Not allowed.");
    return;
  }

  const chatId = replyChatId ?? fromId;
  const reply = async (text: string) => {
    await sendTelegramMessage(env, chatId, text);
  };

  const appLegacy = data.match(/^([oyni]):([a-f0-9]{8,32})$/i);
  if (appLegacy) {
    const action = appLegacy[1].toLowerCase();
    const application = await getApplication(env, appLegacy[2]);
    if (!application) {
      await answerTelegramCallbackQuery(env, callbackId, "Not found.");
      return;
    }
    if (action === "o") {
      await answerTelegramCallbackQuery(env, callbackId, "Opened");
      await sendTelegramMessage(
        env,
        chatId,
        [
          `👩 ${application.name || "Application"}`,
          `📍 ${application.city || "—"}`,
          application.message || "",
        ]
          .filter(Boolean)
          .join("\n"),
        { reply_markup: applicationActionKeyboard(env, application.id) }
      );
      return;
    }
    const status: ApplicationStatus =
      action === "y" ? "approved" : action === "n" ? "rejected" : "info_requested";
    await updateApplicationStatus(env, application.id, status, fromId);
    if (status === "approved" && application.user_id) {
      await approveUser(env, application.user_id, fromId);
    }
    await answerTelegramCallbackQuery(env, callbackId, "Saved");
    await reply(
      status === "approved"
        ? "Approved. The profile is now visible to the team."
        : status === "rejected"
          ? "Rejected. The profile stays private."
          : "Asked for a little more information."
    );
    return;
  }

  if (data === "m:apps") {
    const items = await listApplications(env);
    await answerTelegramCallbackQuery(env, callbackId);
    if (!items.length) {
      await reply("No applications yet.");
      return;
    }
    for (const item of items.slice(0, 8)) {
      await sendTelegramMessage(
        env,
        chatId,
        `👩 ${item.name || "Application"}\n📍 ${item.city || "—"}`,
        { reply_markup: applicationActionKeyboard(env, item.id) }
      );
    }
    return;
  }

  if (data === "m:prof") {
    await answerTelegramCallbackQuery(env, callbackId);
    const rows = await env.DB.prepare(
      "SELECT user_id, first_name, city, status FROM profiles ORDER BY updated_at DESC LIMIT 8"
    ).all<{ user_id: string; first_name: string | null; city: string | null; status: string }>();
    const items = rows.results || [];
    if (!items.length) {
      await reply("No profiles yet.");
      return;
    }
    for (const item of items) {
      await sendTelegramMessage(
        env,
        chatId,
        `${item.first_name || "Profile"}${item.city ? ` · ${item.city}` : ""}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "👁 Open", url: miniAppStartLink(env, `prof_${item.user_id}`) },
                { text: "👀 View", callback_data: `p:v:${item.user_id}` },
              ],
            ],
          },
        }
      );
    }
    return;
  }

  if (data === "m:blog") {
    await answerTelegramCallbackQuery(env, callbackId);
    const items = await listBlogDrafts(env);
    if (!items.length) {
      await reply("No blog drafts. Send a photo plus text to create one.");
      return;
    }
    const seen = new Set<string>();
    for (const item of items) {
      const row = item as Record<string, string>;
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      await sendTelegramMessage(
        env,
        chatId,
        `${row.status === "published" ? "🌐" : "📝"} ${row.title || "Draft"}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🌐 Publish", callback_data: `b:p:${row.id}` },
                { text: "👀 Preview", callback_data: `b:v:${row.id}` },
              ],
            ],
          },
        }
      );
    }
    return;
  }

  const profileAct = data.match(/^p:(v|y|n|i|h|ph):([a-f0-9]{8,32})$/i);
  if (profileAct) {
    const action = profileAct[1].toLowerCase();
    const userId = profileAct[2];
    if (action === "v") {
      await answerTelegramCallbackQuery(env, callbackId, "Opened");
      await sendProfileCard(env, chatId, userId);
      return;
    }
    if (action === "y") {
      await approveUser(env, userId, fromId);
      await answerTelegramCallbackQuery(env, callbackId, "Approved");
      await reply("Profile approved.");
      return;
    }
    if (action === "n") {
      await setProfileVisibility(env, userId, "hidden");
      await answerTelegramCallbackQuery(env, callbackId, "Rejected");
      await reply("Profile kept private.");
      return;
    }
    if (action === "h") {
      await setProfileVisibility(env, userId, "hidden");
      await answerTelegramCallbackQuery(env, callbackId, "Hidden");
      await reply("Profile hidden.");
      return;
    }
    if (action === "i") {
      await env.DB.prepare(
        "UPDATE applications SET status = 'info_requested', updated_at = ? WHERE user_id = ?"
      )
        .bind(nowIso(), userId)
        .run();
      await answerTelegramCallbackQuery(env, callbackId);
      await reply("Marked as needs a little more information.");
      return;
    }
    if (action === "ph") {
      await answerTelegramCallbackQuery(env, callbackId);
      const photos = await listPhotos(env, userId);
      if (!photos.length) {
        await reply("No photos yet.");
        return;
      }
      for (const photo of photos.slice(0, 6)) {
        const object = await env.PHOTOS.get(photo.r2_key);
        if (!object) continue;
        await sendTelegramPhotoFile(
          env,
          chatId,
          await object.arrayBuffer(),
          "photo.jpg",
          photo.mime_type,
          photo.sort_order === 0 ? "Main photo" : "Photo",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ Use", callback_data: `f:ok:${photo.id}` },
                  { text: "❌ Reject", callback_data: `f:no:${photo.id}` },
                ],
              ],
            },
          }
        ).catch(() => undefined);
      }
      return;
    }
  }

  const photoAct = data.match(/^f:(v|ok|rq|no):([a-f0-9]{8,32})$/i);
  if (photoAct) {
    const action = photoAct[1].toLowerCase();
    const photoId = photoAct[2];
    if (action === "v") {
      const photo = await env.DB.prepare("SELECT * FROM photos WHERE id = ?")
        .bind(photoId)
        .first<{ r2_key: string; mime_type: string }>();
      await answerTelegramCallbackQuery(env, callbackId);
      if (!photo) {
        await reply("Photo not found.");
        return;
      }
      const object = await env.PHOTOS.get(photo.r2_key);
      if (object) {
        await sendTelegramPhotoFile(
          env,
          chatId,
          await object.arrayBuffer(),
          "photo.jpg",
          photo.mime_type
        );
      }
      return;
    }
    const mapped =
      action === "ok" ? "approved" : action === "no" ? "rejected" : "info_requested";
    await overridePhotoReview(env, photoId, mapped, fromId);
    await answerTelegramCallbackQuery(env, callbackId, "Saved");
    await reply(
      mapped === "approved"
        ? "Photo approved."
        : mapped === "rejected"
          ? "Photo hidden."
          : "Asked for a new photo."
    );
    return;
  }

  const blogAct = data.match(/^(b|g):(p|v|en|es|c|e):([a-f0-9]{8,32})$/i);
  if (blogAct) {
    const kind = blogAct[1].toLowerCase();
    const action = blogAct[2].toLowerCase();
    const id = blogAct[3];
    if (action === "p" && kind === "b") {
      await publishArticle(env, id);
      await answerTelegramCallbackQuery(env, callbackId, "Published");
      await reply("Article published.");
      return;
    }
    if (action === "c" && kind === "b") {
      await deleteArticle(env, id);
      await answerTelegramCallbackQuery(env, callbackId, "Cancelled");
      await reply("Draft cancelled.");
      return;
    }
    if (action === "e" && kind === "b") {
      await answerTelegramCallbackQuery(env, callbackId);
      await reply("Send a new photo and text to create another draft, then cancel this one if you do not need it.");
      return;
    }
    if (action === "v") {
      const bundle = await articleWithTranslations(env, id);
      await answerTelegramCallbackQuery(env, callbackId);
      if (!bundle) {
        await reply("Draft not found.");
        return;
      }
      const en = bundle.translations.find((row) => row.locale === "en");
      const es = bundle.translations.find((row) => row.locale === "es");
      await reply(
        [
          en ? `🇬🇧 ${en.title}\n${(en.body || "").slice(0, 500)}` : "",
          es ? `🇪🇸 ${es.title}\n${(es.body || "").slice(0, 500)}` : "",
        ]
          .filter(Boolean)
          .join("\n\n") || "Draft not found."
      );
      return;
    }
    if (action === "en" || action === "es") {
      const ok = await generateBlogLocale(env, id, action);
      await answerTelegramCallbackQuery(env, callbackId, ok ? "Ready" : "Could not translate yet");
      await reply(ok ? `Saved ${action === "en" ? "English" : "Spanish"} version.` : "Translation is unavailable right now. Try again shortly.");
      return;
    }
  }

  const attach = data.match(/^x:([a-f0-9]{8,32})$/i);
  if (attach) {
    const ok = await attachLatestInbox(env, fromId, attach[1]);
    await answerTelegramCallbackQuery(env, callbackId, ok ? "Added" : "Nothing to add");
    await reply(ok ? "Photo added to the profile." : "I could not find that photo.");
    return;
  }

  await answerTelegramCallbackQuery(env, callbackId);
}

export async function sendAdminHome(
  env: Env,
  chatId: number | string
): Promise<void> {
  await sendTelegramMessage(
    env,
    chatId,
    "Tango Slavique admin. Choose something to review.",
    {
      reply_markup: {
        inline_keyboard: [
          [adminPanelButton(env, "web_app")],
          [
            { text: "👤 Applications", callback_data: "m:apps" },
            { text: "👩 Profiles", callback_data: "m:prof" },
          ],
          [{ text: "📚 Blog", callback_data: "m:blog" }],
        ],
      },
    }
  );
}

export { newId };
