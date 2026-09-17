import type { Env } from "../env";
import { newId, nowIso } from "../crypto";
import { detectImageType, validatePhoto } from "./validate";

export type PhotoRow = {
  id: string;
  user_id: string;
  r2_key: string;
  original_name: string | null;
  mime_type: string;
  size: number;
  sort_order: number;
  status: string;
  created_at: string;
  is_primary?: number;
};

export async function saveUserPhoto(
  env: Env,
  userId: string,
  file: File
): Promise<PhotoRow> {
  const check = validatePhoto({ type: file.type, size: file.size });
  if (!check.ok) {
    throw new Error(`VALIDATION_ERROR:${check.message}`);
  }

  const bytes = await file.arrayBuffer();
  const detected = detectImageType(bytes);
  if (!detected) {
    throw new Error(
      "VALIDATION_ERROR:Only JPEG, PNG and WEBP images are allowed."
    );
  }

  const id = newId();
  const ext = detected.ext;
  const r2Key = `users/${userId}/${id}.${ext}`;
  await env.PHOTOS.put(r2Key, bytes, {
    httpMetadata: { contentType: detected.mime },
  });

  const originalName = (file.name || "photo").slice(0, 120);
  const now = nowIso();
  const sort = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM photos WHERE user_id = ?"
  )
    .bind(userId)
    .first<{ count: number }>();

  await env.DB.prepare(
    `INSERT INTO photos (id, user_id, r2_key, original_name, mime_type, size, sort_order, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  )
    .bind(
      id,
      userId,
      r2Key,
      originalName,
      detected.mime,
      file.size,
      sort?.count || 0,
      now
    )
    .run();

  if (!sort?.count) {
    await env.DB.prepare("UPDATE photos SET is_primary = 1 WHERE id = ?")
      .bind(id)
      .run()
      .catch(() => undefined);
  }

  return (await env.DB.prepare("SELECT * FROM photos WHERE id = ?")
    .bind(id)
    .first<PhotoRow>())!;
}

export async function listPhotos(
  env: Env,
  userId: string
): Promise<PhotoRow[]> {
  const result = await env.DB.prepare(
    "SELECT * FROM photos WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC"
  )
    .bind(userId)
    .all<PhotoRow>();
  return result.results || [];
}

export async function getPhoto(
  env: Env,
  id: string
): Promise<PhotoRow | null> {
  return env.DB.prepare("SELECT * FROM photos WHERE id = ?")
    .bind(id)
    .first<PhotoRow>();
}

export async function deletePhoto(
  env: Env,
  photo: PhotoRow
): Promise<void> {
  const review = await env.DB.prepare(
    "SELECT annotation_key FROM photo_reviews WHERE photo_id = ?"
  )
    .bind(photo.id)
    .first<{ annotation_key: string | null }>();
  if (review?.annotation_key) {
    await env.PHOTOS.delete(review.annotation_key).catch(() => undefined);
  }
  await env.DB.prepare("DELETE FROM photo_reviews WHERE photo_id = ?")
    .bind(photo.id)
    .run()
    .catch(() => undefined);
  await env.PHOTOS.delete(photo.r2_key);
  await env.DB.prepare("DELETE FROM photos WHERE id = ?").bind(photo.id).run();
}

export async function setPhotoStatus(
  env: Env,
  id: string,
  status: "approved" | "rejected"
): Promise<PhotoRow | null> {
  await env.DB.prepare("UPDATE photos SET status = ? WHERE id = ?")
    .bind(status, id)
    .run();
  return getPhoto(env, id);
}

export async function setPrimaryPhoto(env: Env, userId: string, photoId: string) {
  await env.DB.prepare("UPDATE photos SET is_primary = 0 WHERE user_id = ?")
    .bind(userId)
    .run();
  await env.DB.prepare(
    "UPDATE photos SET is_primary = 1, sort_order = 0 WHERE id = ? AND user_id = ?"
  )
    .bind(photoId, userId)
    .run();
}

export function publicPhotoView(photo: PhotoRow) {
  return {
    id: photo.id,
    user_id: photo.user_id,
    status: photo.status === "rejected" ? "needs_new" : photo.status === "approved" ? "ready" : "saved",
    mime_type: photo.mime_type,
    size: photo.size,
    sort_order: photo.sort_order,
    is_primary: Boolean(photo.is_primary) || photo.sort_order === 0,
    created_at: photo.created_at,
  };
}
