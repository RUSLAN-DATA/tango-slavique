import type { Env } from "../env";
import { newId, nowIso } from "../crypto";
import { notifyUser } from "../notifications/service";
import { calculateMatchScore, type MatchPreferences, type MatchProfile } from "./score";

type ProfileJoin = {
  user_id: string;
  gender: string | null;
  birth_date: string | null;
  city: string | null;
  country: string | null;
  marital_status: string | null;
  children: string | null;
  languages: string | null;
  pref_gender: string | null;
  age_min: number | null;
  age_max: number | null;
  pref_city: string | null;
  pref_marital: string | null;
  pref_children: string | null;
  pref_languages: string | null;
  intent: string | null;
};

export async function runMatchingForUser(
  env: Env,
  userId: string
): Promise<number> {
  const people = await env.DB.prepare(
    `SELECT
        p.user_id,
        p.gender,
        p.birth_date,
        p.city,
        p.country,
        p.marital_status,
        p.children,
        p.languages,
        pr.gender as pref_gender,
        pr.age_min,
        pr.age_max,
        pr.city as pref_city,
        pr.marital_status as pref_marital,
        pr.children as pref_children,
        pr.languages as pref_languages,
        pr.intent
      FROM profiles p
      LEFT JOIN partner_preferences pr ON pr.user_id = p.user_id
      WHERE p.status = 'public'`
  ).all<ProfileJoin>();

  const rows = people.results || [];
  const self = rows.find((row) => row.user_id === userId);
  if (!self) {
    return 0;
  }

  const preferences: MatchPreferences = {
    gender: self.pref_gender,
    ageMin: self.age_min,
    ageMax: self.age_max,
    city: self.pref_city,
    maritalStatus: self.pref_marital,
    children: self.pref_children,
    languages: self.pref_languages,
    intent: self.intent,
  };

  let created = 0;
  const now = nowIso();
  for (const row of rows) {
    if (row.user_id === userId) {
      continue;
    }
    const candidate: MatchProfile = {
      userId: row.user_id,
      gender: row.gender,
      birthDate: row.birth_date,
      city: row.city,
      country: row.country,
      maritalStatus: row.marital_status,
      children: row.children,
      languages: row.languages,
    };
    const score = calculateMatchScore(candidate, preferences);
    if (score < 30) {
      continue;
    }
    try {
      await env.DB.prepare(
        `INSERT INTO matches (id, user_id, matched_user_id, status, score, created_at, updated_at)
         VALUES (?, ?, ?, 'proposed', ?, ?, ?)`
      )
        .bind(newId(), userId, row.user_id, score, now, now)
        .run();
      created += 1;
    } catch {
      // Unique pair already exists.
    }
  }
  return created;
}

export async function runMatchingForAll(
  env: Env
): Promise<{ created: number; users: number }> {
  const people = await env.DB.prepare(
    "SELECT user_id FROM profiles WHERE status = 'public'"
  ).all<{ user_id: string }>();
  const rows = people.results || [];
  let created = 0;
  for (const row of rows) {
    const createdForUser = await runMatchingForUser(env, row.user_id);
    if (createdForUser > 0) {
      await notifyUser(env, row.user_id, "match_new", { created: createdForUser });
    }
    created += createdForUser;
  }
  return { created, users: rows.length };
}
