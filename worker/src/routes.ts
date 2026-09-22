import type { Env } from "./env";
import { corsHeaders, apiError, apiOk } from "./http";
import { isAdminUser, requireAdmin, requireUser, createSession, upsertTelegramUser } from "./auth/session";
import { upsertWebUser } from "./auth/webRegister";
import { mergeDetails, parseDetails } from "./jsonDetails";
import { validateTelegramInitData } from "./auth/telegramInitData";
import { isTelegramAdmin, parseTelegramAdminIds } from "./telegram/adminIds";
import {
  createApplication,
  getApplication,
  listApplications,
  updateApplicationStatus,
} from "./applications/service";
import { assembleAdminApplication } from "./applications/adminView";
import { validateApplicationInput } from "./applications/validate";
import { runMatchingForAll, runMatchingForUser } from "./matches/service";
import {
  deletePhoto,
  getPhoto,
  listPhotos,
  publicPhotoView,
  saveUserPhoto,
  setPrimaryPhoto,
} from "./photos/service";
import { overridePhotoReview, reviewUserPhoto } from "./photos/review";
import { notifyUser, listInAppNotifications, markNotificationRead, markAllNotificationsRead } from "./notifications/service";
import { newId, nowIso } from "./crypto";
import { sendAdminMessage } from "./telegram/notifications";
import { notifyNewProfile } from "./telegram/profileCards";
import { ageFromBirthDate, birthDateFromAge } from "./profile/age";
import {
  articleWithTranslations,
  createBlogDraft,
  deleteArticle,
  generateBlogLocale,
  listBlogDrafts,
  listPublishedBlog,
  publishArticle,
  publicBlogView,
  replaceBlogCover,
  saveBlogFromAdmin,
  unpublishArticle,
} from "./blog/service";
import {
  cancelContentDraft,
  contentFields,
  listContent,
  publishContent,
  publishedContentMap,
  saveContentDraft,
} from "./content/service";
import { detectImageType, MAX_PHOTO_BYTES, validatePhoto } from "./photos/validate";
import { contentFieldById } from "../../lib/content/catalog";

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
    current_step: row.current_step ?? 1,
    privacy_accepted_at: row.privacy_accepted_at ?? null,
    terms_accepted_at: row.terms_accepted_at ?? null,
  };
  if (admin) {
    return { ...base, details: parseDetails(row.details) };
  }
  return base;
}

const PROFILE_STRING_LIMITS: Record<string, number> = {
  first_name: 500,
  last_name: 500,
  birth_date: 32,
  gender: 40,
  city: 80,
  country: 80,
  about: 4000,
  occupation: 500,
  education: 500,
  languages: 200,
  children: 80,
  marital_status: 80,
  hobbies: 2000,
};

function asConsentTimestamp(value: unknown, existing: unknown): string | undefined {
  if (value === true) {
    return typeof existing === "string" && existing.trim() ? existing : nowIso();
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 40);
  }
  return undefined;
}

function withParsedDetails(row: Record<string, unknown> | null) {
  if (!row) {
    return {};
  }
  return { ...row, details: parseDetails(row.details) };
}

export async function handleApi(
  request: Request,
  env: Env,
  path: string,
  ctx?: ExecutionContext
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
        const friendly = message.slice("VALIDATION_ERROR:".length);
        return withCors(
          apiError(
            "VALIDATION_ERROR",
            friendly.includes("JPEG")
              ? "Please choose a JPEG, PNG or WEBP photo under 10 MB."
              : friendly,
            400
          )
        );
      }
      console.error("API error", path, method);
      return withCors(
        apiError("INTERNAL_ERROR", "Something went wrong. Please try again.", 500)
      );
    }
  };

  if (path === "/api/public/blog" && method === "GET") {
    const locale = url.searchParams.get("locale") === "es" ? "es" : "en";
    const items = await listPublishedBlog(env, locale);
    return withCors(apiOk({ items: items.map((row) => publicBlogView(row as Record<string, unknown>)) }));
  }

  const publicBlog = path.match(/^\/api\/public\/blog\/([a-z0-9-]+)(?:\/(cover))?$/i);
  if (publicBlog && method === "GET") {
    const bundle = await articleWithTranslations(env, publicBlog[1]);
    if (!bundle || bundle.article.status !== "published") {
      return withCors(apiError("NOT_FOUND", "Article not found", 404));
    }
    if (publicBlog[2] === "cover") {
      if (!bundle.article.cover_r2_key) {
        return withCors(apiError("NOT_FOUND", "No image", 404));
      }
      const object = await env.PHOTOS.get(bundle.article.cover_r2_key);
      if (!object) {
        return withCors(apiError("NOT_FOUND", "No image", 404));
      }
      return new Response(object.body, {
        headers: {
          "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
          "Cache-Control": "public, max-age=3600",
          ...cors,
        },
      });
    }
    const locale = url.searchParams.get("locale") === "es" ? "es" : "en";
    const translation =
      bundle.translations.find((row) => row.locale === locale) || bundle.translations[0];
    return withCors(
      apiOk({
        ...publicBlogView({ ...bundle.article, ...translation } as unknown as Record<string, unknown>),
        body: translation?.body || "",
      })
    );
  }

  if (path === "/api/public/content" && method === "GET") {
    const locale = url.searchParams.get("locale") === "es" ? "es" : "en";
    const overrides = await publishedContentMap(env, locale);
    return withCors(apiOk({ locale, overrides }));
  }

  const publicContentPage = path.match(
    /^\/api\/public\/content\/(home|about|how|contact|footer)$/
  );
  if (publicContentPage && method === "GET") {
    const locale = url.searchParams.get("locale") === "es" ? "es" : "en";
    const all = await publishedContentMap(env, locale);
    const fields = contentFields.filter((field) => field.page === publicContentPage[1]);
    const overrides: Record<string, string> = {};
    for (const field of fields) {
      if (all[field.dictPath]) {
        overrides[field.dictPath] = all[field.dictPath];
      }
    }
    return withCors(apiOk({ locale, page: publicContentPage[1], overrides }));
  }

  if (path === "/api/auth/web/register" && method === "POST") {
    return wrap(async () => {
      const body = await readJson(request);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 80) : "";
      const lastName = typeof body.lastName === "string" ? body.lastName.trim().slice(0, 80) : "";
      const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
      const trackRaw = typeof body.track === "string" ? body.track.toUpperCase() : "";
      const track = trackRaw === "MAN" || trackRaw === "WOMAN" ? trackRaw : "";
      if (!email.includes("@") || !firstName || !lastName) {
        return apiError("VALIDATION_ERROR", "Provide a name and a valid email.", 400);
      }
      const user = await upsertWebUser(env, {
        email,
        firstName,
        lastName,
        track,
        phone,
      });
      const token = await createSession(env, user.id);
      return apiOk({
        token,
        userId: user.id,
        track: track || null,
      });
    });
  }

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
          role: isAdminUser(env, user) ? "admin" : "user",
          status: user.status,
        },
        startParam: parsed.startParam,
        chatType: parsed.chatType,
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
        adminLocale: user.admin_locale || "en",
        email: user.email,
        phone: user.phone,
        telegramUserId: user.telegram_user_id,
      });
    });
  }

  if (path === "/api/me" && method === "PATCH") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const body = await readJson(request);
      const locale = typeof body.adminLocale === "string" ? body.adminLocale : "";
      if (locale !== "en" && locale !== "es" && locale !== "ru") {
        return apiError("VALIDATION_ERROR", "adminLocale must be en, es or ru", 400);
      }
      await env.DB.prepare("UPDATE users SET admin_locale = ?, updated_at = ? WHERE id = ?")
        .bind(locale, nowIso(), user.id)
        .run();
      return apiOk({ adminLocale: locale });
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
      let result;
      try {
        result = await createApplication(env, { ...input, userId });
      } catch {
        return apiError("INTERNAL_ERROR", "The application could not be saved.", 500);
      }
      return apiOk({
        id: result.application.id,
        status: result.application.status,
        notified: result.notified,
        reused: result.reused,
      });
    });
  }

  if (path === "/api/applications" && method === "GET") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      if (isAdminUser(env, user)) {
        const statusParam = url.searchParams.get("status");
        let status: string | undefined;
        if (!statusParam || statusParam === "pending") {
          status = "new";
        } else if (statusParam === "all") {
          status = undefined;
        } else if (statusParam === "needs_information" || statusParam === "info") {
          status = "info_requested";
        } else {
          status = statusParam;
        }
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
      let infoMessage = "";
      try {
        const body = await readJson(request);
        if (typeof body.message === "string") infoMessage = body.message.trim().slice(0, 1000);
      } catch {
        infoMessage = "";
      }
      const updated = await updateApplicationStatus(
        env,
        id,
        status,
        user.telegram_user_id || user.id,
        infoMessage || undefined
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
        const created = await runMatchingForUser(env, updated.user_id);
        if (created > 0) {
          await notifyUser(env, updated.user_id, "match_new", { created });
        }
      }
      await sendAdminMessage(
        env,
        status === "approved"
          ? "Application approved."
          : status === "rejected"
            ? "Application rejected."
            : "Asked for a little more information."
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
      if (isAdminUser(env, user)) {
        return apiOk(await assembleAdminApplication(env, row));
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
        .first<Record<string, unknown>>();
      return apiOk({
        ...withParsedDetails(profile),
        age: ageFromBirthDate(
          typeof profile?.birth_date === "string" ? profile.birth_date : null
        ),
      });
    });
  }

  if (path === "/api/profile" && method === "PATCH") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const body = await readJson(request);
      const existing = await env.DB.prepare(
        "SELECT * FROM profiles WHERE user_id = ?"
      )
        .bind(user.id)
        .first<Record<string, unknown>>();
      const values: Array<string | number | null> = [];
      const sets: string[] = [];
      for (const field of Object.keys(PROFILE_STRING_LIMITS)) {
        if (field in body) {
          const value = body[field];
          if (typeof value !== "string" || !value.trim()) {
            continue;
          }
          sets.push(`${field} = ?`);
          const max = PROFILE_STRING_LIMITS[field];
          values.push(value.slice(0, max));
        }
      }
      const heightValue =
        typeof body.height === "number"
          ? body.height
          : typeof body.height === "string" && body.height.trim()
            ? Number(body.height)
            : NaN;
      if (Number.isFinite(heightValue)) {
        sets.push("height = ?");
        values.push(Math.trunc(heightValue));
      }
      if (typeof body.age === "number") {
        sets.push("birth_date = ?");
        values.push(birthDateFromAge(body.age));
      }
      if (typeof body.current_step === "number" && body.current_step >= 1 && body.current_step <= 7) {
        sets.push("current_step = ?");
        values.push(Math.trunc(body.current_step));
      }
      const privacyAt = asConsentTimestamp(
        body.privacy_accepted ?? body.privacy_accepted_at,
        existing?.privacy_accepted_at
      );
      if (privacyAt) {
        sets.push("privacy_accepted_at = ?");
        values.push(privacyAt);
      }
      const termsAt = asConsentTimestamp(
        body.terms_accepted ?? body.terms_accepted_at,
        existing?.terms_accepted_at
      );
      if (termsAt) {
        sets.push("terms_accepted_at = ?");
        values.push(termsAt);
      }
      if ("details" in body) {
        sets.push("details = ?");
        values.push(mergeDetails(existing?.details, body.details));
      }
      if (typeof body.phone === "string") {
        await env.DB.prepare("UPDATE users SET phone = ?, updated_at = ? WHERE id = ?")
          .bind(body.phone.trim().slice(0, 40) || null, nowIso(), user.id)
          .run();
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
        .first<Record<string, unknown>>();
      return apiOk({
        ...withParsedDetails(profile),
        age: ageFromBirthDate(
          typeof profile?.birth_date === "string" ? profile.birth_date : null
        ),
      });
    });
  }

  if (path === "/api/profile/submit" && method === "POST") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const isWeb = !user.telegram_user_id;
      const profile = await env.DB.prepare(
        "SELECT * FROM profiles WHERE user_id = ?"
      )
        .bind(user.id)
        .first<{
          first_name: string | null;
          city: string | null;
          about: string | null;
          birth_date: string | null;
          privacy_accepted_at: string | null;
          terms_accepted_at: string | null;
        }>();
      if (!profile?.first_name) {
        return apiError("VALIDATION_ERROR", "Please add your name.", 400);
      }
      if (isWeb && (!profile.privacy_accepted_at || !profile.terms_accepted_at)) {
        return apiError("VALIDATION_ERROR", "Please accept privacy and terms.", 400);
      }
      const photos = await listPhotos(env, user.id);
      if (!photos.length) {
        return apiError(
          isWeb ? "PHOTO_REQUIRED" : "VALIDATION_ERROR",
          "Please add at least one photo.",
          400
        );
      }
      await env.DB.prepare(
        "UPDATE profiles SET status = 'pending', updated_at = ? WHERE user_id = ?"
      )
        .bind(nowIso(), user.id)
        .run();
      const source = isWeb ? "website" : "miniapp";
      const open = await env.DB.prepare(
        "SELECT id, status FROM applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
      )
        .bind(user.id)
        .first<{ id: string; status: string }>();
      if (open && (open.status === "info_requested" || open.status === "new")) {
        await env.DB.prepare(
          "UPDATE applications SET status = 'new', message = ?, updated_at = ? WHERE id = ?"
        )
          .bind(profile.about || "", nowIso(), open.id)
          .run();
      } else {
        await createApplication(env, {
          name: profile.first_name,
          email: user.email || "",
          phone: user.phone || "",
          city: profile.city || "",
          message: profile.about || "",
          source,
          userId: user.id,
          silent: true,
          reuse: false,
        });
      }
      await notifyNewProfile(env, user.id).catch(() => false);
      await notifyUser(env, user.id, "application_submitted", { source });
      return apiOk({ submitted: true });
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
          .first<Record<string, unknown>>();
        return apiOk(withParsedDetails(row));
      }
      const body = await readJson(request);
      const now = nowIso();
      const existing = await env.DB.prepare(
        "SELECT * FROM partner_preferences WHERE user_id = ?"
      )
        .bind(user.id)
        .first<Record<string, unknown>>();
      const asString = (value: unknown, max: number) => {
        if (typeof value !== "string") {
          return undefined;
        }
        const text = value.trim().slice(0, max);
        return text ? text : undefined;
      };
      const asNumber = (value: unknown) => {
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
        if (typeof value === "string" && value.trim()) {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
      };
      const preferenceDetailKeys = [
        "preferredHeightMin",
        "preferredHeightMax",
        "preferredBodyType",
        "minimumEducation",
        "importantQualities",
        "dealBreakers",
      ] as const;
      const incomingDetails: Record<string, unknown> = { ...parseDetails(body.details) };
      for (const key of preferenceDetailKeys) {
        if (key in body && body[key] !== "" && body[key] !== null) {
          incomingDetails[key] = body[key];
        }
      }
      const nextDetails =
        Object.keys(incomingDetails).length > 0
          ? mergeDetails(existing?.details, incomingDetails)
          : typeof existing?.details === "string"
            ? existing.details
            : existing?.details
              ? JSON.stringify(existing.details)
              : null;
      const next = {
        gender: asString(body.gender, 40) ?? (existing?.gender as string | null) ?? null,
        age_min: asNumber(body.age_min) ?? (existing?.age_min as number | null) ?? null,
        age_max: asNumber(body.age_max) ?? (existing?.age_max as number | null) ?? null,
        city: asString(body.city, 80) ?? (existing?.city as string | null) ?? null,
        country: asString(body.country, 80) ?? (existing?.country as string | null) ?? null,
        marital_status:
          asString(body.marital_status, 40) ?? (existing?.marital_status as string | null) ?? null,
        children: asString(body.children, 40) ?? (existing?.children as string | null) ?? null,
        languages: asString(body.languages, 200) ?? (existing?.languages as string | null) ?? null,
        intent: asString(body.intent, 80) ?? (existing?.intent as string | null) ?? null,
        notes: asString(body.notes, 500) ?? (existing?.notes as string | null) ?? null,
        details: nextDetails,
      };
      if (existing) {
        await env.DB.prepare(
          `UPDATE partner_preferences SET gender=?, age_min=?, age_max=?, city=?, country=?, marital_status=?, children=?, languages=?, intent=?, notes=?, details=?, updated_at=? WHERE user_id=?`
        )
          .bind(
            next.gender,
            next.age_min,
            next.age_max,
            next.city,
            next.country,
            next.marital_status,
            next.children,
            next.languages,
            next.intent,
            next.notes,
            next.details,
            now,
            user.id
          )
          .run();
      } else {
        await env.DB.prepare(
          `INSERT INTO partner_preferences (id, user_id, gender, age_min, age_max, city, country, marital_status, children, languages, intent, notes, details, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            newId(),
            user.id,
            next.gender,
            next.age_min,
            next.age_max,
            next.city,
            next.country,
            next.marital_status,
            next.children,
            next.languages,
            next.intent,
            next.notes,
            next.details,
            now,
            now
          )
          .run();
      }
      const row = await env.DB.prepare(
        "SELECT * FROM partner_preferences WHERE user_id = ?"
      )
        .bind(user.id)
        .first<Record<string, unknown>>();
      return apiOk(withParsedDetails(row));
    });
  }

  if (path === "/api/photos" && method === "POST") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return apiError("VALIDATION_ERROR", "Please add at least one photo.", 400);
      }
      const photo = await saveUserPhoto(env, user.id, file);
      ctx?.waitUntil(
        (async () => {
          const object = await env.PHOTOS.get(photo.r2_key);
          if (object) {
            await reviewUserPhoto(env, photo, await object.arrayBuffer());
          }
        })().catch(() => undefined)
      );
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

  const photoId = path.match(/^\/api\/photos\/([a-f0-9]+)(?:\/(approve|reject|primary|request-info))?$/);
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

  if (photoId && photoId[2] === "primary" && method === "POST") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const photo = await getPhoto(env, photoId[1]);
      if (!photo) {
        return apiError("NOT_FOUND", "Photo not found", 404);
      }
      if (photo.user_id !== user.id && !isAdminUser(env, user)) {
        return apiError("FORBIDDEN", "Admin access required", 403);
      }
      await setPrimaryPhoto(env, photo.user_id, photo.id);
      return apiOk({ id: photo.id, is_primary: true });
    });
  }

  if (photoId && photoId[2] && photoId[2] !== "primary" && method === "POST") {
    return wrap(async () => {
      const admin = await requireAdmin(env, request);
      const action =
        photoId[2] === "approve"
          ? "approved"
          : photoId[2] === "reject"
            ? "rejected"
            : "info_requested";
      const updated = await overridePhotoReview(
        env,
        photoId[1],
        action,
        admin.telegram_user_id || admin.id
      );
      if (!updated) {
        return apiError("NOT_FOUND", "Photo not found", 404);
      }
      return apiOk(publicPhotoView(updated));
    });
  }

  if (path === "/api/matches" && method === "GET") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      const rows = await env.DB.prepare(
        `SELECT m.id, m.status, m.user_id, m.matched_user_id, m.created_at,
                p.first_name, p.city, p.about, p.birth_date
         FROM matches m
         JOIN profiles p ON p.user_id = CASE WHEN m.user_id = ? THEN m.matched_user_id ELSE m.user_id END
         WHERE m.user_id = ? OR m.matched_user_id = ?
         ORDER BY m.created_at DESC LIMIT 50`
      )
        .bind(user.id, user.id, user.id)
        .all();
      return apiOk({
        items: (rows.results || []).map((row) => {
          const item = row as {
            id: string;
            status: string;
            first_name?: string;
            city?: string;
            about?: string;
            birth_date?: string;
          };
          return {
            id: item.id,
            status: item.status,
            first_name: item.first_name || "",
            city: item.city || "",
            about: item.about || "",
            age: ageFromBirthDate(item.birth_date || null),
          };
        }),
      });
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
        if (created > 0) {
          await notifyUser(env, targetUserId, "match_new", { created });
        }
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
        `SELECT p.id, p.user_id, p.r2_key, p.original_name, p.mime_type, p.size, p.sort_order,
                p.status, p.created_at, p.is_primary,
                r.review_status, r.confidence, r.issues, r.main_person_detected, r.face_visible,
                r.quality, r.recommended_primary, r.admin_override, r.annotation_key
         FROM photos p
         LEFT JOIN photo_reviews r ON r.photo_id = p.id
         ORDER BY p.created_at DESC LIMIT 100`
      ).all();
      const items = (rows.results || []).map((row) => {
        const photo = row as {
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
          review_status: string | null;
          confidence: number | null;
          issues: string | null;
          main_person_detected: number | null;
          face_visible: number | null;
          quality: string | null;
          recommended_primary: number | null;
          admin_override: string | null;
          annotation_key: string | null;
        };
        let issues: unknown[] = [];
        if (photo.issues) {
          try {
            const parsed = JSON.parse(photo.issues);
            issues = Array.isArray(parsed) ? parsed : [];
          } catch {
            issues = [];
          }
        }
        return {
          ...publicPhotoView(photo),
          photo_status: photo.status,
          review: photo.review_status
            ? {
                status: photo.review_status,
                confidence: photo.confidence,
                issues,
                main_person_detected: Boolean(photo.main_person_detected),
                face_visible: Boolean(photo.face_visible),
                quality: photo.quality,
                recommended_primary: Boolean(photo.recommended_primary),
                admin_override: photo.admin_override,
                has_annotation: Boolean(photo.annotation_key),
              }
            : null,
        };
      });
      return apiOk({ items });
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
      const status = url.searchParams.get("status") || undefined;
      const items = isAdminUser(env, user)
        ? await listInAppNotifications(env, null, status)
        : await listInAppNotifications(env, user.id, status);
      return apiOk({ items });
    });
  }

  if (path === "/api/notifications/read-all" && method === "POST") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      await markAllNotificationsRead(env, isAdminUser(env, user) ? null : user.id);
      return apiOk({ ok: true });
    });
  }

  const notificationRead = path.match(/^\/api\/notifications\/([a-f0-9]+)\/read$/);
  if (notificationRead && method === "POST") {
    return wrap(async () => {
      const user = await requireUser(env, request);
      await markNotificationRead(env, notificationRead[1], isAdminUser(env, user) ? null : user.id);
      return apiOk({ ok: true });
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

  if (adminProfile && method === "PATCH") {
    return wrap(async () => {
      const admin = await requireAdmin(env, request);
      const body = await readJson(request);
      const profile = await env.DB.prepare(
        "SELECT user_id FROM profiles WHERE user_id = ? OR id = ?"
      )
        .bind(adminProfile[1], adminProfile[1])
        .first<{ user_id: string }>();
      if (!profile) {
        return apiError("NOT_FOUND", "Profile not found", 404);
      }
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
        "status",
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
      if (typeof body.age === "number") {
        sets.push("birth_date = ?");
        values.push(birthDateFromAge(body.age));
      }
      if (!sets.length) {
        return apiError("VALIDATION_ERROR", "No profile fields to update", 400);
      }
      sets.push("updated_at = ?");
      values.push(nowIso(), profile.user_id);
      await env.DB.prepare(
        `UPDATE profiles SET ${sets.join(", ")} WHERE user_id = ?`
      )
        .bind(...values)
        .run();
      await env.DB.prepare(
        `INSERT INTO admin_actions (id, admin_telegram_id, action, entity_type, entity_id, created_at)
         VALUES (?, ?, 'edit', 'profile', ?, ?)`
      )
        .bind(newId(), admin.telegram_user_id || admin.id, profile.user_id, nowIso())
        .run();
      const updated = await env.DB.prepare("SELECT * FROM profiles WHERE user_id = ?")
        .bind(profile.user_id)
        .first();
      return apiOk(sanitizeProfile((updated || {}) as Record<string, unknown>, true));
    });
  }

  if (path === "/api/admin/notes" && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const rows = await env.DB.prepare(
        `SELECT n.id, n.user_id, n.note, n.created_at, n.admin_telegram_id, p.first_name
         FROM admin_notes n
         LEFT JOIN profiles p ON p.user_id = n.user_id
         ORDER BY n.created_at DESC LIMIT 100`
      ).all();
      return apiOk({ items: rows.results || [] });
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

  if (path === "/api/admin/blog" && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      return apiOk({ items: await listBlogDrafts(env) });
    });
  }

  if (path === "/api/admin/blog" && method === "POST") {
    return wrap(async () => {
      const admin = await requireAdmin(env, request);
      const body = await readJson(request);
      const originalText = typeof body.originalText === "string" ? body.originalText.trim() : "";
      const en = typeof body.en === "string" ? body.en : "";
      const es = typeof body.es === "string" ? body.es : "";
      if (!originalText && !en && !es) {
        return apiError("VALIDATION_ERROR", "Please add the blog text.", 400);
      }
      const article = await createBlogDraft(env, {
        text: originalText || en || es,
        createdBy: admin.telegram_user_id || admin.id,
        silent: true,
        skipTranslate: Boolean(en || es),
      });
      await saveBlogFromAdmin(env, article.id, { originalText, en, es });
      if (body.publish === true) {
        const published = await publishArticle(env, article.id);
        return apiOk(published);
      }
      return apiOk(article);
    });
  }

  const adminBlogItem = path.match(/^\/api\/admin\/blog\/([a-f0-9]+)$/);
  if (adminBlogItem && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const bundle = await articleWithTranslations(env, adminBlogItem[1]);
      if (!bundle || bundle.article.status === "archived") {
        return apiError("NOT_FOUND", "Article not found", 404);
      }
      return apiOk(bundle);
    });
  }

  if (adminBlogItem && method === "PATCH") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const body = await readJson(request);
      const updated = await saveBlogFromAdmin(env, adminBlogItem[1], {
        originalText: typeof body.originalText === "string" ? body.originalText : undefined,
        en: typeof body.en === "string" ? body.en : undefined,
        es: typeof body.es === "string" ? body.es : undefined,
      });
      if (!updated) {
        return apiError("NOT_FOUND", "Article not found", 404);
      }
      return apiOk(updated);
    });
  }

  const adminBlogCover = path.match(/^\/api\/admin\/blog\/([a-f0-9]+)\/cover$/);
  if (adminBlogCover && method === "POST") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return apiError("VALIDATION_ERROR", "Please add a photo.", 400);
      }
      const checked = validatePhoto({ type: file.type, size: file.size });
      if (!checked.ok) {
        return apiError("VALIDATION_ERROR", checked.message, 400);
      }
      const bytes = await file.arrayBuffer();
      if (bytes.byteLength > MAX_PHOTO_BYTES) {
        return apiError("VALIDATION_ERROR", "Image must be between 1 byte and 10 MB.", 400);
      }
      const detected = detectImageType(bytes);
      if (!detected) {
        return apiError("VALIDATION_ERROR", "Only JPEG, PNG and WEBP images are allowed.", 400);
      }
      const key = `blog/${adminBlogCover[1]}/${newId()}.${detected.ext}`;
      await env.PHOTOS.put(key, bytes, {
        httpMetadata: { contentType: detected.mime },
      });
      await replaceBlogCover(env, adminBlogCover[1], key);
      return apiOk({ cover: `/api/public/blog/${adminBlogCover[1]}/cover` });
    });
  }

  const adminBlog = path.match(/^\/api\/admin\/blog\/([a-f0-9]+)\/(publish|en|es|unpublish|delete)$/);
  if (adminBlog && method === "POST") {
    return wrap(async () => {
      await requireAdmin(env, request);
      if (adminBlog[2] === "publish") {
        const article = await publishArticle(env, adminBlog[1]);
        if (!article) {
          return apiError("NOT_FOUND", "Article not found", 404);
        }
        return apiOk(article);
      }
      if (adminBlog[2] === "unpublish") {
        const article = await unpublishArticle(env, adminBlog[1]);
        if (!article) {
          return apiError("NOT_FOUND", "Article not found", 404);
        }
        return apiOk(article);
      }
      if (adminBlog[2] === "delete") {
        const ok = await deleteArticle(env, adminBlog[1]);
        if (!ok) {
          return apiError("NOT_FOUND", "Article not found", 404);
        }
        return apiOk({ deleted: true });
      }
      const ok = await generateBlogLocale(
        env,
        adminBlog[1],
        adminBlog[2] as "en" | "es",
        true
      );
      return apiOk({ translated: ok });
    });
  }

  if (path === "/api/admin/content" && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const page = url.searchParams.get("page") || undefined;
      return apiOk({
        catalog: contentFields.filter((field) => !page || field.page === page),
        items: await listContent(env, page),
      });
    });
  }

  if (path === "/api/admin/content" && method === "PATCH") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const body = await readJson(request);
      const fieldId = typeof body.fieldId === "string" ? body.fieldId : "";
      const locale = body.locale === "es" ? "es" : "en";
      if (!contentFieldById(fieldId)) {
        return apiError("VALIDATION_ERROR", "Unknown content field", 400);
      }
      const action = typeof body.action === "string" ? body.action : "save";
      if (action === "cancel") {
        await cancelContentDraft(env, fieldId, locale);
        return apiOk({ cancelled: true });
      }
      if (typeof body.draftValue === "string") {
        await saveContentDraft(env, fieldId, locale, body.draftValue);
      }
      if (action === "publish") {
        const published = await publishContent(env, fieldId, locale);
        return apiOk(published);
      }
      return apiOk(await saveContentDraft(env, fieldId, locale, String(body.draftValue || "")));
    });
  }

  if (path === "/api/admin/dashboard" && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const count = async (sql: string) => {
        const row = await env.DB.prepare(sql).first<{ n: number }>();
        return Number(row?.n || 0);
      };
      const [
        applications,
        pendingApplications,
        profiles,
        pendingPhotos,
        matches,
        introductions,
        feedback,
        users,
        notifications,
        pendingProfiles,
        blogDrafts,
      ] = await Promise.all([
        count("SELECT COUNT(*) as n FROM applications"),
        count("SELECT COUNT(*) as n FROM applications WHERE status IN ('new','info_requested')"),
        count("SELECT COUNT(*) as n FROM profiles"),
        count("SELECT COUNT(*) as n FROM photos WHERE status = 'pending'"),
        count("SELECT COUNT(*) as n FROM matches"),
        count("SELECT COUNT(*) as n FROM introductions"),
        count("SELECT COUNT(*) as n FROM feedback"),
        count("SELECT COUNT(*) as n FROM users"),
        count("SELECT COUNT(*) as n FROM notifications"),
        count("SELECT COUNT(*) as n FROM profiles WHERE status IN ('pending','draft')"),
        count("SELECT COUNT(*) as n FROM blog_articles WHERE status = 'draft'"),
      ]);
      return apiOk({
        applications,
        pendingApplications,
        profiles,
        pendingPhotos,
        pendingProfiles,
        matches,
        introductions,
        feedback,
        users,
        notifications,
        blogDrafts,
      });
    });
  }

  const adminPhotoAnnotation = path.match(/^\/api\/admin\/photos\/([a-f0-9]+)\/annotation$/);
  if (adminPhotoAnnotation && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const review = await env.DB.prepare(
        "SELECT annotation_key FROM photo_reviews WHERE photo_id = ?"
      )
        .bind(adminPhotoAnnotation[1])
        .first<{ annotation_key: string | null }>();
      if (!review?.annotation_key) {
        return apiError("NOT_FOUND", "No annotation", 404);
      }
      const object = await env.PHOTOS.get(review.annotation_key);
      if (!object) {
        return apiError("NOT_FOUND", "No annotation", 404);
      }
      return new Response(object.body, {
        headers: {
          "Content-Type": object.httpMetadata?.contentType || "image/png",
          "Cache-Control": "private, max-age=60",
          ...cors,
        },
      });
    });
  }

  if (path === "/api/admin/matches" && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const rows = await env.DB.prepare(
        `SELECT m.id, m.user_id, m.matched_user_id, m.status, m.score, m.created_at, m.updated_at,
                a.first_name as user_name, b.first_name as matched_name
         FROM matches m
         LEFT JOIN profiles a ON a.user_id = m.user_id
         LEFT JOIN profiles b ON b.user_id = m.matched_user_id
         ORDER BY m.created_at DESC LIMIT 100`
      ).all();
      const responses = await env.DB.prepare(
        "SELECT match_id, user_id, response, created_at FROM match_responses ORDER BY created_at DESC LIMIT 400"
      ).all<{ match_id: string; user_id: string; response: string; created_at: string }>();
      const byMatch = new Map<string, Array<Record<string, string>>>();
      for (const row of responses.results || []) {
        const list = byMatch.get(row.match_id) || [];
        list.push(row);
        byMatch.set(row.match_id, list);
      }
      return apiOk({
        items: (rows.results || []).map((row) => {
          const item = row as { id: string };
          return { ...item, responses: byMatch.get(item.id) || [] };
        }),
      });
    });
  }

  const adminMatch = path.match(/^\/api\/admin\/matches\/([a-f0-9]+)$/);
  if (adminMatch && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const match = await env.DB.prepare(
        `SELECT m.*, a.first_name as user_name, b.first_name as matched_name
         FROM matches m
         LEFT JOIN profiles a ON a.user_id = m.user_id
         LEFT JOIN profiles b ON b.user_id = m.matched_user_id
         WHERE m.id = ?`
      )
        .bind(adminMatch[1])
        .first();
      if (!match) {
        return apiError("NOT_FOUND", "Match not found", 404);
      }
      const responses = await env.DB.prepare(
        "SELECT id, user_id, response, created_at FROM match_responses WHERE match_id = ?"
      )
        .bind(adminMatch[1])
        .all();
      return apiOk({ match, responses: responses.results || [] });
    });
  }

  if (path === "/api/admin/introductions" && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const rows = await env.DB.prepare(
        `SELECT i.id, i.user_id, i.matched_user_id, i.status, i.created_at, i.updated_at,
                a.first_name as user_name, b.first_name as matched_name
         FROM introductions i
         LEFT JOIN profiles a ON a.user_id = i.user_id
         LEFT JOIN profiles b ON b.user_id = i.matched_user_id
         ORDER BY i.created_at DESC LIMIT 100`
      ).all();
      return apiOk({ items: rows.results || [] });
    });
  }

  const adminIntro = path.match(/^\/api\/admin\/introductions\/([a-f0-9]+)$/);
  if (adminIntro && method === "PATCH") {
    return wrap(async () => {
      const admin = await requireAdmin(env, request);
      const body = await readJson(request);
      const status = typeof body.status === "string" ? body.status.slice(0, 40) : "";
      if (!status) {
        return apiError("VALIDATION_ERROR", "status is required", 400);
      }
      await env.DB.prepare(
        "UPDATE introductions SET status = ?, updated_at = ? WHERE id = ?"
      )
        .bind(status, nowIso(), adminIntro[1])
        .run();
      await env.DB.prepare(
        `INSERT INTO admin_actions (id, admin_telegram_id, action, entity_type, entity_id, created_at)
         VALUES (?, ?, ?, 'introduction', ?, ?)`
      )
        .bind(newId(), admin.telegram_user_id || admin.id, status, adminIntro[1], nowIso())
        .run();
      const row = await env.DB.prepare("SELECT * FROM introductions WHERE id = ?")
        .bind(adminIntro[1])
        .first<{ user_id: string; matched_user_id: string; status: string }>();
      if (row && (status === "scheduled" || status === "completed" || status === "active")) {
        await notifyUser(env, row.user_id, "introduction_new", { id: adminIntro[1] });
        await notifyUser(env, row.matched_user_id, "introduction_new", { id: adminIntro[1] });
      }
      return apiOk(row || { id: adminIntro[1], status });
    });
  }

  if (path === "/api/admin/feedback" && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const rows = await env.DB.prepare(
        `SELECT f.id, f.user_id, f.target_user_id, f.rating, f.message, f.created_at,
                a.first_name as user_name, b.first_name as target_name
         FROM feedback f
         LEFT JOIN profiles a ON a.user_id = f.user_id
         LEFT JOIN profiles b ON b.user_id = f.target_user_id
         ORDER BY f.created_at DESC LIMIT 100`
      ).all();
      return apiOk({ items: rows.results || [] });
    });
  }

  if (path === "/api/admin/users" && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const rows = await env.DB.prepare(
        `SELECT u.id, u.telegram_user_id, u.email, u.phone, u.status, u.created_at,
                p.first_name, p.city
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         ORDER BY u.created_at DESC LIMIT 100`
      ).all();
      const adminIds = parseTelegramAdminIds(env.TELEGRAM_ADMIN_IDS);
      return apiOk({
        items: (rows.results || []).map((row) => {
          const item = row as {
            id: string;
            telegram_user_id: string | null;
            email: string | null;
            phone: string | null;
            status: string;
            created_at: string;
            first_name: string | null;
            city: string | null;
          };
          return {
            ...item,
            role: isTelegramAdmin(adminIds, item.telegram_user_id) ? "admin" : "user",
          };
        }),
      });
    });
  }

  if (path === "/api/admin/actions" && method === "GET") {
    return wrap(async () => {
      await requireAdmin(env, request);
      const rows = await env.DB.prepare(
        "SELECT id, admin_telegram_id, action, entity_type, entity_id, created_at FROM admin_actions ORDER BY created_at DESC LIMIT 100"
      ).all();
      return apiOk({ items: rows.results || [] });
    });
  }

  return null;
}
