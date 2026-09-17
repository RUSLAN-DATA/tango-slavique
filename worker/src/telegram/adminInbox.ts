import type { Env } from "../env";
import { newId, nowIso } from "../crypto";
import { detectImageType } from "../photos/validate";
import { createBlogDraft } from "../blog/service";
import { parseAdminCaption } from "./intent";
import {
  createNamedDraftProfile,
  findProfilesByName,
  sendProfileCard,
} from "./profileCards";
import { sendTelegramMessage } from "./api";
import { saveInboxPhotoToUser } from "./inboxSave";

export async function handleAdminMedia(
  env: Env,
  adminId: string,
  chatId: number | string,
  caption: string,
  file: { bytes: ArrayBuffer; mime: string } | null
): Promise<void> {
  const intent = parseAdminCaption(caption, Boolean(file));
  const text = caption.trim();

  if (intent.type === "blog" || (!file && /^\/blog\b/i.test(text))) {
    const body = intent.type === "blog" ? intent.text : text.replace(/^\/blog\s*/i, "");
    if (!body.trim()) {
      await sendTelegramMessage(env, chatId, "Send a photo plus the article text to create a draft.");
      return;
    }
    let coverKey: string | null = null;
    if (file) {
      const detected = detectImageType(file.bytes);
      const ext = detected?.ext || "jpg";
      coverKey = `blog/${newId()}.${ext}`;
      await env.PHOTOS.put(coverKey, file.bytes, {
        httpMetadata: { contentType: detected?.mime || file.mime },
      });
    }
    await createBlogDraft(env, {
      text: body,
      coverKey,
      createdBy: adminId,
    });
    await sendTelegramMessage(env, chatId, "Draft saved. Use the buttons to translate or publish.");
    return;
  }

  if (!file) {
    return;
  }

  if (intent.type === "new_profile") {
    const userId = await createNamedDraftProfile(env, intent.name);
    await saveInboxPhotoToUser(env, userId, file.bytes, file.mime);
    await sendTelegramMessage(env, chatId, `Created ${intent.name}. Photo added.`);
    await sendProfileCard(env, chatId, userId);
    return;
  }

  if (intent.type === "attach") {
    const matches = await findProfilesByName(env, intent.name);
    if (matches.length === 1) {
      await saveInboxPhotoToUser(env, matches[0].user_id, file.bytes, file.mime);
      await sendTelegramMessage(
        env,
        chatId,
        `Photo added to ${matches[0].first_name || "profile"}.`
      );
      return;
    }
    if (matches.length > 1) {
      await storeInbox(env, adminId, file, caption);
      await sendTelegramMessage(env, chatId, "Which profile should receive this photo?", {
        reply_markup: {
          inline_keyboard: matches.map((row) => [
            {
              text: `${row.first_name || "Profile"}${row.city ? ` · ${row.city}` : ""}`,
              callback_data: `x:${row.user_id}`,
            },
          ]),
        },
      });
      return;
    }
  }

  const recent = await env.DB.prepare(
    "SELECT user_id, first_name, city FROM profiles ORDER BY updated_at DESC LIMIT 6"
  ).all<{ user_id: string; first_name: string | null; city: string | null }>();
  await storeInbox(env, adminId, file, caption);
  const people = recent.results || [];
  if (!people.length) {
    await sendTelegramMessage(
      env,
      chatId,
      "I saved the photo. Create a profile in Mini App first, or send: New profile Maria"
    );
    return;
  }
  await sendTelegramMessage(env, chatId, "Which profile should receive this photo?", {
    reply_markup: {
      inline_keyboard: people.map((row) => [
        {
          text: row.first_name || row.user_id.slice(0, 6),
          callback_data: `x:${row.user_id}`,
        },
      ]),
    },
  });
}

async function storeInbox(
  env: Env,
  adminId: string,
  file: { bytes: ArrayBuffer; mime: string },
  caption: string
) {
  const detected = detectImageType(file.bytes);
  const key = `admin-inbox/${newId()}.${detected?.ext || "jpg"}`;
  await env.PHOTOS.put(key, file.bytes, {
    httpMetadata: { contentType: detected?.mime || file.mime },
  });
  await env.DB.prepare(
    `INSERT INTO admin_inbox (id, admin_telegram_id, kind, r2_key, mime_type, caption, created_at)
     VALUES (?, ?, 'photo_attach', ?, ?, ?, ?)`
  )
    .bind(newId(), adminId, key, detected?.mime || file.mime, caption.slice(0, 500), nowIso())
    .run();
}

export async function attachLatestInbox(
  env: Env,
  adminId: string,
  userId: string
): Promise<boolean> {
  const row = await env.DB.prepare(
    "SELECT * FROM admin_inbox WHERE admin_telegram_id = ? AND kind = 'photo_attach' ORDER BY created_at DESC LIMIT 1"
  )
    .bind(adminId)
    .first<{ id: string; r2_key: string; mime_type: string }>();
  if (!row) {
    return false;
  }
  const object = await env.PHOTOS.get(row.r2_key);
  if (!object) {
    return false;
  }
  await saveInboxPhotoToUser(env, userId, await object.arrayBuffer(), row.mime_type);
  await env.DB.prepare("DELETE FROM admin_inbox WHERE id = ?").bind(row.id).run();
  return true;
}
