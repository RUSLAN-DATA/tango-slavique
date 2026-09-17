import type { Env } from "./env";
import { corsHeaders, apiError, apiOk } from "./http";
import { isAdminUser, requireAdmin, requireUser, createSession, upsertTelegramUser } from "./auth/session";
import { validateTelegramInitData } from "./auth/telegramInitData";
import {
  createApplication,
  getApplication,
  listApplications,
  updateApplicationStatus,
} from "./applications/service";
import { validateApplicationInput } from "./applications/validate";
import { runMatchingForAll, runMatchingForUser } from "./matches/service";
import {
  deletePhoto,
  getPhoto,
  listPhotos,
  publicPhotoView,
  saveUserPhoto,
  setPhotoStatus,
} from "./photos/service";
import { newId, nowIso } from "./crypto";
import { sendAdminMessage } from "./telegram/notifications";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json();
  if (!isRecord(body)) {
    throw new Error("INVALID_JSON");
  }
  return body;
}

function sanitizeProfile(row: Record<string, unknown>, admin: boolean) {
  const base = {
    id: row.id,
    user_id: row.user_id,
    first_name: row.first_name,
    last_name: row.last_name,
    birth_date: row.birth_date,
    gender: row.gender,
    city: row.city,
    country: row.country,
    about: row.about,
    occupation: row.occupation,
    education: row.education,
    languages: row.languages,
    children: row.children,
    marital_status: row.marital_status,
    height: row.height,
    hobbies: row.hobbies,
    status: row.status,
  };
  if (admin) {
    return base;
  }
  return base;
}

export async function handleApi(
  request: Request,
  env: Env,
  path: string
): Promise<Response | null> {
  const cors = corsHeaders(request, env);
  const method = request.method;
  const url = new URL(request.url);

  const withCors = (response: Response) => {
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(cors)) {
      headers.set(key, String(value));
    }
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  };

  const wrap = async (fn: () => Promise<Response>): Promise<Response> => {
    try {
      return withCors(await fn());
    } catch (error) {
      const message = error instanceof Error ? error.message : "ERROR";
      if (message === "UNAUTHORIZED") {
        return withCors(apiError("UNAUTHORIZED", "Authentication required", 401));
      }
      if (message === "EXPIRED_INIT_DATA") {
        return withCors(apiError("EXPIRED_INIT_DATA", "Telegram session expired", 401));
      }
      if (message === "FORBIDDEN") {
        return withCors(apiError("FORBIDDEN", "Admin access required", 403));
      }
      if (message === "INVALID_JSON") {
        return withCors(apiError("VALIDATION_ERROR", "Invalid JSON", 400));
      }
      if (message.startsWith("VALIDATION_ERROR:")) {
        return withCors(
          apiError("VALIDATION_ERROR", message.slice("VALIDATION_ERROR:".length), 400)
        );
      }
      console.error("API error");
      return withCors(apiError("INTERNAL_ERROR", "Request failed", 500));
    }
  };

  if (path === "/api/auth/telegram" && method === "POST") {
    return wrap(async () => {
      const body = await readJson(request);
      const initData = typeof body.initData === "string" ? body.initData : "";
      let parsed;
      try {
        parsed = await validateTelegramInitData(env.TELEGRAM_BOT_TOKEN, initData);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "INVALID_INIT_DATA";
        throw new Error(reason === "EXPIRED_INIT_DATA" ? "EXPIRED_INIT_DATA" : "UNAUTHORIZED");
      }
      const user = await upsertTelegramUser(
        env,
        String(parsed.user.id),
        parsed.user.first_name,
        parsed.user.last_name
      );
      const token = await createSession(env, user.id);
      return apiOk({
        token,
        user: {
          id: user.id,
          role: user.role,
          status: user.status,
        },
      });
    });
  }

  if (path === "/api/me" && method === "GET") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      return apiOk({
        id: user.id,
        role: isAdminUser(env, user) ? "admin" : "user",
        status: user.status,
      });
    });
  }

  if (path === "/api/applications" && method === "POST") {
    return wrap(async () => {
      const body = await readJson(request);
      const input = validateApplicationInput(body);
      if ("error" in input) {
        return apiError("VALIDATION_ERROR", input.error, 400);
      }
      let userId: string | undefined;
      try {
        userId = (await requireUser(env, request)).id;
      } catch {
        userId = undefined;
      }
      const result = await createApplication(env, { ...input, userId });
      return apiOk({
        id: result.application.id,
        status: result.application.status,
        notified: result.notified,
      });
    });
  }

  if (path === "/api/applications" && method === "GET") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      if (isAdminUser(env, user)) {
        const status = url.searchParams.get("status") || undefined;
        return apiOk({ items: await listApplications(env, status) });
      }
      const own = await env.DB.prepare(
        "SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20"
      )
        .bind(user.id)
        .all();
      return apiOk({ items: own.results || [] });
    });
  }

  const applicationAction = path.match(
    /^\/api\/applications\/([a-f0-9]+)\/(approve|reject|request-info)$/
  );
  if (applicationAction && method === "POST") {
    return wrap(async () => {
      const user = await requireAdmin(env, request);
      const id = applicationAction[1];
      const action = applicationAction[2];
      const status =
        action === "approve"
          ? "approved"
          : action === "reject"
            ? "rejected"
            : "info_requested";
      const updated = await updateApplicationStatus(
        env,
        id,
        status,
        user.telegram_user_id || user.id
      );
      if (!updated) {
        return apiError("NOT_FOUND", "Application not found", 404);
      }
      if (status === "approved" && updated.user_id) {
        await env.DB.prepare(
          "UPDATE profiles SET status = 'public', updated_at = ? WHERE user_id = ?"
        )
          .bind(nowIso(), updated.user_id)
          .run();
        await runMatchingForUser(env, updated.user_id);
      }
      await sendAdminMessage(
        env,
        `Заявка ${updated.id}: ${updated.status.toUpperCase()}`
      ).catch(() => undefined);
      return apiOk(updated);
    });
  }

  const applicationGet = path.match(/^\/api\/applications\/([a-f0-9]+)$/);
  if (applicationGet && method === "GET") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const row = await getApplication(env, applicationGet[1]);
      if (!row) {
        return apiError("NOT_FOUND", "Application not found", 404);
      }
      if (!isAdminUser(env, user) && row.user_id !== user.id) {
        return apiError("FORBIDDEN", "Admin access required", 403);
      }
      return apiOk(row);
    });
  }

  if (path === "/api/profile" && method === "GET") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const profile = await env.DB.prepare(
        "SELECT * FROM profiles WHERE user_id = ?"
      )
        .bind(user.id)
        .first();
      return apiOk(profile || {});
    });
  }

  if (path === "/api/profile" && method === "PATCH") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const body = await readJson(request);
      const fields = [
        "first_name",
        "last_name",
        "birth_date",
        "gender",
        "city",
        "country",
        "about",
        "occupation",
        "education",
        "languages",
        "children",
        "marital_status",
        "hobbies",
      ] as const;
      const values: Array<string | number | null> = [];
      const sets: string[] = [];
      for (const field of fields) {
        if (field in body) {
          sets.push(`${field} = ?`);
          const value = body[field];
          values.push(typeof value === "string" ? value.slice(0, 500) : null);
        }
      }
      if (typeof body.height === "number") {
        sets.push("height = ?");
        values.push(Math.trunc(body.height));
      }
      if (!sets.length) {
        return apiError("VALIDATION_ERROR", "No profile fields to update", 400);
      }
      sets.push("updated_at = ?");
      values.push(nowIso(), user.id);
      await env.DB.prepare(
        `UPDATE profiles SET ${sets.join(", ")} WHERE user_id = ?`
      )
        .bind(...values)
        .run();
      const profile = await env.DB.prepare(
        "SELECT * FROM profiles WHERE user_id = ?"
      )
        .bind(user.id)
        .first();
      return apiOk(profile || {});
    });
  }

  if ((path === "/api/preferences" && method === "GET") || (path === "/api/preferences" && method === "PATCH")) {
    return wrap(async () => {
      const user = await requireUser(env, request);
      if (method === "GET") {
        const row = await env.DB.prepare(
          "SELECT * FROM partner_preferences WHERE user_id = ?"
        )
          .bind(user.id)
          .first();
        return apiOk(row || {});
      }
      const body = await readJson(request);
      const now = nowIso();
      const existing = await env.DB.prepare(
        "SELECT id FROM partner_preferences WHERE user_id = ?"
      )
        .bind(user.id)
        .first<{ id: string }>();
      const payload = {
        gender: typeof body.gender === "string" ? body.gender.slice(0, 40) : null,
        age_min: typeof body.age_min === "number" ? body.age_min : null,
        age_max: typeof body.age_max === "number" ? body.age_max : null,
        city: typeof body.city === "string" ? body.city.slice(0, 80) : null,
        country: typeof body.country === "string" ? body.country.slice(0, 80) : null,
        marital_status:
          typeof body.marital_status === "string"
            ? body.marital_status.slice(0, 40)
            : null,
        children:
          typeof body.children === "string" ? body.children.slice(0, 40) : null,
        languages:
          typeof body.languages === "string" ? body.languages.slice(0, 200) : null,
        intent: typeof body.intent === "string" ? body.intent.slice(0, 80) : null,
        notes: typeof body.notes === "string" ? body.notes.slice(0, 500) : null,
      };
      if (existing) {
        await env.DB.prepare(
          `UPDATE partner_preferences SET gender=?, age_min=?, age_max=?, city=?, country=?, marital_status=?, children=?, languages=?, intent=?, notes=?, updated_at=? WHERE user_id=?`
        )
          .bind(
            payload.gender,
            payload.age_min,
            payload.age_max,
            payload.city,
            payload.country,
            payload.marital_status,
            payload.children,
            payload.languages,
            payload.intent,
            payload.notes,
            now,
            user.id
          )
          .run();
      } else {
        await env.DB.prepare(
          `INSERT INTO partner_preferences (id, user_id, gender, age_min, age_max, city, country, marital_status, children, languages, intent, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            newId(),
            user.id,
            payload.gender,
            payload.age_min,
            payload.age_max,
            payload.city,
            payload.country,
            payload.marital_status,
            payload.children,
            payload.languages,
            payload.intent,
            payload.notes,
            now,
            now
          )
          .run();
      }
      const row = await env.DB.prepare(
        "SELECT * FROM partner_preferences WHERE user_id = ?"
      )
        .bind(user.id)
        .first();
      return apiOk(row || {});
    });
  }

  if (path === "/api/photos" && method === "POST") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return apiError("VALIDATION_ERROR", "file is required", 400);
      }
      const photo = await saveUserPhoto(env, user.id, file);
      return apiOk(publicPhotoView(photo));
    });
  }

  if (path === "/api/photos" && method === "GET") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const userId = url.searchParams.get("user_id");
      if (userId && userId !== user.id && !isAdminUser(env, user)) {
        return apiError("FORBIDDEN", "Admin access required", 403);
      }
      const photos = await listPhotos(env, userId || user.id);
      const visible = isAdminUser(env, user)
        ? photos
        : photos.filter(
            (photo) => photo.user_id === user.id || photo.status === "approved"
          );
      return apiOk({ items: visible.map(publicPhotoView) });
    });
  }

  const photoId = path.match(/^\/api\/photos\/([a-f0-9]+)(?:\/(approve|reject))?$/);
  if (photoId && method === "GET" && !photoId[2]) {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const photo = await getPhoto(env, photoId[1]);
      if (!photo) {
        return apiError("NOT_FOUND", "Photo not found", 404);
      }
      const allowed =
        photo.user_id === user.id ||
        isAdminUser(env, user) ||
        photo.status === "approved";
      if (!allowed) {
        return apiError("FORBIDDEN", "Photo is not available", 403);
      }
      const object = await env.PHOTOS.get(photo.r2_key);
      if (!object) {
        return apiError("NOT_FOUND", "Photo object not found", 404);
      }
      return new Response(object.body, {
        headers: {
          "Content-Type": photo.mime_type,
          "Cache-Control": "private, max-age=60",
          ...cors,
        },
      });
    });
  }

  if (photoId && method === "DELETE" && !photoId[2]) {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const photo = await getPhoto(env, photoId[1]);
      if (!photo) {
        return apiError("NOT_FOUND", "Photo not found", 404);
      }
      if (photo.user_id !== user.id && !isAdminUser(env, user)) {
        return apiError("FORBIDDEN", "Admin access required", 403);
      }
      await deletePhoto(env, photo);
      return apiOk({ deleted: true });
    });
  }

  if (photoId && photoId[2] && method === "POST") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const status = photoId[2] === "approve" ? "approved" : "rejected";
      const updated = await setPhotoStatus(env, photoId[1], status);
      if (!updated) {
        return apiError("NOT_FOUND", "Photo not found", 404);
      }
      return apiOk(publicPhotoView(updated));
    });
  }

  if (path === "/api/matches" && method === "GET") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      if (isAdminUser(env, user)) {
        const rows = await env.DB.prepare(
          "SELECT * FROM matches ORDER BY created_at DESC LIMIT 100"
        ).all();
        return apiOk({ items: rows.results || [] });
      }
      const rows = await env.DB.prepare(
        "SELECT * FROM matches WHERE user_id = ? OR matched_user_id = ? ORDER BY created_at DESC LIMIT 50"
      )
        .bind(user.id, user.id)
        .all();
      return apiOk({ items: rows.results || [] });
    });
  }

  if (path === "/api/admin/matches/run" && method === "POST") {
    return wrap(async () => {
      await requireAdmin(env, request);
      let body: Record<string, unknown> = {};
      try {
        body = await readJson(request);
      } catch {
        body = {};
      }
      const targetUserId =
        typeof body.user_id === "string" && /^[a-f0-9]+$/i.test(body.user_id)
          ? body.user_id
          : "";
      if (targetUserId) {
        const created = await runMatchingForUser(env, targetUserId);
        return apiOk({ created, user_id: targetUserId });
      }
      const result = await runMatchingForAll(env);
      return apiOk(result);
    });
  }

  if (path === "/api/admin/photos" && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const rows = await env.DB.prepare(
        "SELECT * FROM photos ORDER BY created_at DESC LIMIT 100"
      ).all();
      const items = (rows.results || []) as Array<{
        id: string;
        user_id: string;
        r2_key: string;
        original_name: string | null;
        mime_type: string;
        size: number;
        sort_order: number;
        status: string;
        created_at: string;
      }>;
      return apiOk({ items: items.map(publicPhotoView) });
    });
  }

  const matchRespond = path.match(/^\/api\/matches\/([a-f0-9]+)\/respond$/);
  if (matchRespond && method === "POST") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const body = await readJson(request);
      const response = body.response === "accept" ? "accept" : "decline";
      const match = await env.DB.prepare("SELECT * FROM matches WHERE id = ?")
        .bind(matchRespond[1])
        .first<{ id: string; user_id: string; matched_user_id: string }>();
      if (!match || (match.user_id !== user.id && match.matched_user_id !== user.id && !isAdminUser(env, user))) {
        return apiError("NOT_FOUND", "Match not found", 404);
      }
      const existing = await env.DB.prepare(
        "SELECT id FROM match_responses WHERE match_id = ? AND user_id = ?"
      )
        .bind(match.id, user.id)
        .first<{ id: string }>();
      if (existing) {
        await env.DB.prepare(
          "UPDATE match_responses SET response = ? WHERE id = ?"
        )
          .bind(response, existing.id)
          .run();
      } else {
        await env.DB.prepare(
          "INSERT INTO match_responses (id, match_id, user_id, response, created_at) VALUES (?, ?, ?, ?, ?)"
        )
          .bind(newId(), match.id, user.id, response, nowIso())
          .run();
      }
      return apiOk({ match_id: match.id, response });
    });
  }

  if (path === "/api/notifications" && method === "GET") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const rows = isAdminUser(env, user)
        ? await env.DB.prepare(
            "SELECT id, channel, type, status, created_at FROM notifications ORDER BY created_at DESC LIMIT 50"
          ).all()
        : await env.DB.prepare(
            "SELECT id, channel, type, status, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
          )
            .bind(user.id)
            .all();
      return apiOk({ items: rows.results || [] });
    });
  }

  if (path === "/api/admin/profiles" && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const rows = await env.DB.prepare(
        "SELECT id, user_id, first_name, last_name, city, gender, status, created_at FROM profiles ORDER BY updated_at DESC LIMIT 100"
      ).all();
      return apiOk({ items: rows.results || [] });
    });
  }

  const adminProfile = path.match(/^\/api\/admin\/profiles\/([a-f0-9]+)$/);
  if (adminProfile && method === "GET") {
    return wrap(async () => {
      const admin = await requireAdmin(env, request);
      const profile = await env.DB.prepare(
        "SELECT * FROM profiles WHERE user_id = ? OR id = ?"
      )
        .bind(adminProfile[1], adminProfile[1])
        .first();
      if (!profile) {
        return apiError("NOT_FOUND", "Profile not found", 404);
      }
      const notes = await env.DB.prepare(
        "SELECT id, note, created_at, updated_at FROM admin_notes WHERE user_id = ? ORDER BY created_at DESC"
      )
        .bind((profile as { user_id: string }).user_id)
        .all();
      const photos = await listPhotos(env, (profile as { user_id: string }).user_id);
      return apiOk({
        profile: sanitizeProfile(profile as Record<string, unknown>, true),
        notes: notes.results || [],
        photos: photos.map(publicPhotoView),
        viewer: admin.id,
      });
    });
  }

  if (path === "/api/admin/notes" && method === "POST") {
    return wrap(async () => {
      const admin = await requireAdmin(env, request);
      const body = await readJson(request);
      const userId = typeof body.user_id === "string" ? body.user_id : "";
      const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : "";
      if (!userId || !note) {
        return apiError("VALIDATION_ERROR", "user_id and note are required", 400);
      }
      const id = newId();
      const now = nowIso();
      await env.DB.prepare(
        `INSERT INTO admin_notes (id, user_id, admin_telegram_id, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(id, userId, admin.telegram_user_id || admin.id, note, now, now)
        .run();
      return apiOk({ id, note });
    });
  }

  const notePatch = path.match(/^\/api\/admin\/notes\/([a-f0-9]+)$/);
  if (notePatch && method === "PATCH") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const body = await readJson(request);
      const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : "";
      if (!note) {
        return apiError("VALIDATION_ERROR", "note is required", 400);
      }
      await env.DB.prepare(
        "UPDATE admin_notes SET note = ?, updated_at = ? WHERE id = ?"
      )
        .bind(note, nowIso(), notePatch[1])
        .run();
      return apiOk({ id: notePatch[1], note });
    });
  }

  return null;
}
