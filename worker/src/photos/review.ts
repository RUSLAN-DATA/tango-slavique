import type { Env } from "../env";
import { geminiGenerateJson, imagePart, textPart } from "../ai/gemini";
import { newId, nowIso, sha256Bytes } from "../crypto";
import { sendAdminPhotoFile, sendAdminMessage } from "../telegram/notifications";
import { buildAnnotationPng } from "./annotate";
import { getPhoto, type PhotoRow } from "./service";

export type PhotoIssue = {
  type: string;
  confidence: number;
  message: string;
};

export type PhotoReviewResult = {
  status: "OK" | "WARNING" | "REVIEW_REQUIRED" | "AI_UNAVAILABLE";
  confidence: number;
  issues: PhotoIssue[];
  main_person_detected: boolean;
  face_visible: boolean;
  quality: string;
  annotation_needed: boolean;
  recommended_primary: boolean;
  boxes: Array<{ x: number; y: number; w: number; h: number; label?: string }>;
};

const PROMPT = `Analyse this dating-profile photo. Return JSON only:
{
  "status": "OK" | "WARNING" | "REVIEW_REQUIRED",
  "confidence": 0-1,
  "issues": [{"type":"multiple_people|small_face|blur|dark|overexposed|crop|obstruction|screenshot|unsafe|duplicate","confidence":0-1,"message":"short plain English"}],
  "main_person_detected": true,
  "face_visible": true,
  "quality": "good" | "fair" | "poor",
  "annotation_needed": false,
  "recommended_primary": true,
  "boxes": [{"x":0,"y":0,"w":10,"h":10,"label":"person"}]
}
Boxes are percentages of the image (0-100).
OK = one clear person, visible face, decent quality.
WARNING = possible issue, human should glance.
REVIEW_REQUIRED = multiple people, unsafe, or face not usable.
Do not reject people for style, beauty, age, race, or clothing.`;

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseResult(raw: Record<string, unknown> | null): PhotoReviewResult | null {
  if (!raw) {
    return null;
  }
  const status =
    raw.status === "WARNING" || raw.status === "REVIEW_REQUIRED" || raw.status === "OK"
      ? raw.status
      : "REVIEW_REQUIRED";
  const issues = Array.isArray(raw.issues)
    ? raw.issues
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          type: String(item.type || "other"),
          confidence: asNumber(item.confidence, 0),
          message: String(item.message || "Needs a closer look"),
        }))
    : [];
  const boxes = Array.isArray(raw.boxes)
    ? raw.boxes
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          x: asNumber(item.x),
          y: asNumber(item.y),
          w: asNumber(item.w, 10),
          h: asNumber(item.h, 10),
          label: typeof item.label === "string" ? item.label : undefined,
        }))
    : [];
  return {
    status,
    confidence: asNumber(raw.confidence, 0.5),
    issues,
    main_person_detected: Boolean(raw.main_person_detected),
    face_visible: Boolean(raw.face_visible),
    quality: String(raw.quality || "fair"),
    annotation_needed: Boolean(raw.annotation_needed) || boxes.length > 1,
    recommended_primary: Boolean(raw.recommended_primary),
    boxes,
  };
}

export async function existingReview(env: Env, photoId: string) {
  return env.DB.prepare("SELECT * FROM photo_reviews WHERE photo_id = ?")
    .bind(photoId)
    .first();
}

export async function reviewUserPhoto(
  env: Env,
  photo: PhotoRow,
  bytes: ArrayBuffer,
  force = false
): Promise<void> {
  if (!force) {
    const prior = await existingReview(env, photo.id);
    if (prior) {
      return;
    }
  }

  const hash = await sha256Bytes(bytes);
  await env.DB.prepare("UPDATE photos SET file_hash = ? WHERE id = ?")
    .bind(hash, photo.id)
    .run();

  const duplicate = await env.DB.prepare(
    "SELECT id FROM photos WHERE user_id = ? AND file_hash = ? AND id != ? LIMIT 1"
  )
    .bind(photo.user_id, hash, photo.id)
    .first<{ id: string }>();

  let parsed = parseResult(
    await geminiGenerateJson(
      env,
      [
        imagePart(photo.mime_type, bytes),
        textPart(PROMPT),
      ],
      "You review profile photographs for a private matchmaking house. Be conservative: uncertain issues are WARNING, not rejection."
    )
  );

  if (!parsed) {
    parsed = {
      status: "AI_UNAVAILABLE",
      confidence: 0,
      issues: [],
      main_person_detected: false,
      face_visible: false,
      quality: "unknown",
      annotation_needed: false,
      recommended_primary: false,
      boxes: [],
    };
  }

  if (duplicate) {
    parsed.issues.push({
      type: "duplicate",
      confidence: 1,
      message: "This looks like a photo already on the profile",
    });
    if (parsed.status === "OK") {
      parsed.status = "WARNING";
    }
  }

  let annotationKey: string | null = null;
  if (parsed.annotation_needed && parsed.boxes.length) {
    try {
      const png = await buildAnnotationPng(parsed.boxes);
      annotationKey = `ai-review/${photo.id}.png`;
      await env.PHOTOS.put(annotationKey, png, {
        httpMetadata: { contentType: "image/png" },
      });
    } catch {
      annotationKey = null;
    }
  }

  const now = nowIso();
  const reviewStatus =
    parsed.status === "OK"
      ? "AI_OK"
      : parsed.status === "AI_UNAVAILABLE"
        ? "AI_UNAVAILABLE"
        : parsed.status === "REVIEW_REQUIRED"
          ? "REVIEW_REQUIRED"
          : "AI_WARNING";

  await env.DB.prepare("DELETE FROM photo_reviews WHERE photo_id = ?")
    .bind(photo.id)
    .run();
  await env.DB.prepare(
    `INSERT INTO photo_reviews (
      id, photo_id, review_status, reviewed_at, ai_provider, ai_model, confidence,
      issues, main_person_detected, face_visible, quality, annotation_key,
      recommended_primary, admin_override, admin_override_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`
  )
    .bind(
      newId(),
      photo.id,
      reviewStatus,
      now,
      parsed.status === "AI_UNAVAILABLE" ? null : "gemini",
      parsed.status === "AI_UNAVAILABLE" ? null : "gemini-3.5-flash",
      parsed.confidence,
      JSON.stringify(parsed.issues),
      parsed.main_person_detected ? 1 : 0,
      parsed.face_visible ? 1 : 0,
      parsed.quality,
      annotationKey,
      parsed.recommended_primary ? 1 : 0,
      now
    )
    .run();

  if (reviewStatus === "AI_OK" || reviewStatus === "AI_UNAVAILABLE") {
    return;
  }

  const profile = await env.DB.prepare(
    "SELECT first_name, birth_date, city FROM profiles WHERE user_id = ?"
  )
    .bind(photo.user_id)
    .first<{ first_name: string | null; birth_date: string | null; city: string | null }>();
  const name = profile?.first_name || "Member";
  const issueLines = parsed.issues.slice(0, 4).map((issue) => `• ${issue.message}`);
  const caption = [
    "⚠️ PHOTO NEEDS REVIEW",
    `👩 ${name}`,
    issueLines.join("\n") || "• Needs a closer look",
    parsed.recommended_primary ? "⭐ Suggested as main photo" : "⚠️ Not ideal as main photo",
  ]
    .filter(Boolean)
    .join("\n");

  const keyboard = {
    inline_keyboard: [
      [
        { text: "👀 View", callback_data: `f:v:${photo.id}` },
        { text: "✅ Use anyway", callback_data: `f:ok:${photo.id}` },
      ],
      [
        { text: "📸 Request new", callback_data: `f:rq:${photo.id}` },
        { text: "❌ Reject", callback_data: `f:no:${photo.id}` },
      ],
    ],
  };

  await sendAdminPhotoFile(env, bytes, `photo.${photo.mime_type.includes("png") ? "png" : "jpg"}`, photo.mime_type, caption, keyboard).catch(
    () => sendAdminMessage(env, caption, { reply_markup: keyboard })
  );

  if (annotationKey) {
    const overlay = await env.PHOTOS.get(annotationKey);
    if (overlay) {
      const overlayBytes = await overlay.arrayBuffer();
      await sendAdminPhotoFile(
        env,
        overlayBytes,
        "review.png",
        "image/png",
        "Marked areas for review (admin only)."
      ).catch(() => undefined);
    }
  }
}

export async function getReviewForPhoto(env: Env, photoId: string) {
  return env.DB.prepare("SELECT * FROM photo_reviews WHERE photo_id = ?")
    .bind(photoId)
    .first();
}

export async function overridePhotoReview(
  env: Env,
  photoId: string,
  action: "approved" | "rejected" | "info_requested",
  adminId: string
) {
  await env.DB.prepare(
    "UPDATE photos SET status = ? WHERE id = ?"
  )
    .bind(action === "approved" ? "approved" : action === "rejected" ? "rejected" : "pending", photoId)
    .run();
  await env.DB.prepare(
    "UPDATE photo_reviews SET admin_override = ?, admin_override_at = ? WHERE photo_id = ?"
  )
    .bind(action, nowIso(), photoId)
    .run();
  await env.DB.prepare(
    `INSERT INTO admin_actions (id, admin_telegram_id, action, entity_type, entity_id, created_at)
     VALUES (?, ?, ?, 'photo', ?, ?)`
  )
    .bind(newId(), adminId, action, photoId, nowIso())
    .run();
  return getPhoto(env, photoId);
}
