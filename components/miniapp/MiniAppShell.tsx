"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getSessionToken,
  setSessionToken,
  workerRequest,
} from "@/lib/miniapp/api";

type Tab =
  | "profile"
  | "application"
  | "photos"
  | "matches"
  | "preferences"
  | "notifications"
  | "settings"
  | "admin";

type Me = { id: string; role: "user" | "admin"; status: string };

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initData: string;
        colorScheme?: string;
      };
    };
  }
}

const userTabs: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "application", label: "Application" },
  { id: "photos", label: "Photos" },
  { id: "matches", label: "Matches" },
  { id: "preferences", label: "Preferences" },
  { id: "notifications", label: "Alerts" },
  { id: "settings", label: "Settings" },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] uppercase tracking-[0.16em] text-ivory/55">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-ivory outline-none";

export function MiniAppShell() {
  const [tab, setTab] = useState<Tab>("profile");
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [applications, setApplications] = useState<Array<Record<string, string>>>([]);
  const [photos, setPhotos] = useState<Array<{ id: string; status: string }>>([]);
  const [matches, setMatches] = useState<Array<Record<string, unknown>>>([]);
  const [notifications, setNotifications] = useState<Array<Record<string, string>>>([]);
  const [adminApps, setAdminApps] = useState<Array<Record<string, string>>>([]);
  const [adminProfiles, setAdminProfiles] = useState<Array<Record<string, string>>>([]);
  const [note, setNote] = useState("");
  const [noteUserId, setNoteUserId] = useState("");
  const [busy, setBusy] = useState(false);

  const isAdmin = me?.role === "admin";
  const tabs = useMemo(
    () => (isAdmin ? [...userTabs, { id: "admin" as Tab, label: "Admin" }] : userTabs),
    [isAdmin]
  );

  async function refresh(token = getSessionToken()) {
    if (!token) {
      setLoading(false);
      return;
    }
    const [meRes, profileRes, prefRes, appsRes, photosRes, matchesRes, notesRes] =
      await Promise.all([
        workerRequest<Me>("/api/me"),
        workerRequest<Record<string, string>>("/api/profile"),
        workerRequest<Record<string, string>>("/api/preferences"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/applications"),
        workerRequest<{ items: Array<{ id: string; status: string }> }>("/api/photos"),
        workerRequest<{ items: Array<Record<string, unknown>> }>("/api/matches"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/notifications"),
      ]);
    if (!meRes.ok || !meRes.data) {
      setSessionToken(null);
      setMe(null);
      setLoading(false);
      return;
    }
    setMe(meRes.data);
    setProfile(profileRes.data || {});
    setPreferences(prefRes.data || {});
    setApplications(appsRes.data?.items || []);
    setPhotos(photosRes.data?.items || []);
    setMatches(matchesRes.data?.items || []);
    setNotifications(notesRes.data?.items || []);
    if (meRes.data.role === "admin") {
      const [list, profiles] = await Promise.all([
        workerRequest<{ items: Array<Record<string, string>> }>("/api/applications"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/profiles"),
      ]);
      setAdminApps(list.data?.items || []);
      setAdminProfiles(profiles.data?.items || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    webApp?.ready();
    webApp?.expand();
    const initData = webApp?.initData || "";
    async function boot() {
      setError("");
      if (initData) {
        const auth = await workerRequest<{ token: string; user: Me }>(
          "/api/auth/telegram",
          {
            method: "POST",
            body: JSON.stringify({ initData }),
          }
        );
        if (auth.ok && auth.data?.token) {
          setSessionToken(auth.data.token);
        } else {
          setError(auth.error?.message || "Telegram authorization failed.");
        }
      }
      await refresh();
    }
    void boot();
  }, []);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await workerRequest("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(profile),
    });
    setBusy(false);
    setError(result.ok ? "" : result.error?.message || "Save failed");
  }

  async function savePreferences(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await workerRequest("/api/preferences", {
      method: "PATCH",
      body: JSON.stringify({
        ...preferences,
        age_min: preferences.age_min ? Number(preferences.age_min) : null,
        age_max: preferences.age_max ? Number(preferences.age_max) : null,
      }),
    });
    setBusy(false);
    setError(result.ok ? "" : result.error?.message || "Save failed");
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const result = await workerRequest("/api/applications", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        city: form.get("city"),
        message: form.get("message"),
        source: "miniapp",
      }),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error?.message || "Application failed");
      return;
    }
    await refresh();
  }

  async function uploadPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("file");
    if (!(file instanceof File)) {
      return;
    }
    const body = new FormData();
    body.set("file", file);
    setBusy(true);
    const result = await workerRequest("/api/photos", { method: "POST", body });
    setBusy(false);
    if (!result.ok) {
      setError(result.error?.message || "Upload failed");
      return;
    }
    await refresh();
  }

  async function adminAction(id: string, action: "approve" | "reject" | "request-info") {
    setBusy(true);
    await workerRequest(`/api/applications/${id}/${action}`, { method: "POST" });
    setBusy(false);
    await refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ivory/70">
        Loading…
      </div>
    );
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <p className="font-display text-2xl text-ivory">Tango Slavique</p>
        <p className="mt-4 text-sm text-ivory/70">
          {error || "Open this page from Telegram Mini App to sign in."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-24">
      <header className="border-b border-white/10 px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
          Tango Slavique
        </p>
        <h1 className="font-display text-2xl text-ivory">Mini App</h1>
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      </header>

      <main className="space-y-5 px-4 py-5">
        {tab === "profile" ? (
          <form onSubmit={saveProfile} className="space-y-3">
            <Field label="First name">
              <input className={inputClass} value={profile.first_name || ""} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
            </Field>
            <Field label="City">
              <input className={inputClass} value={profile.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
            </Field>
            <Field label="Gender">
              <input className={inputClass} value={profile.gender || ""} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} />
            </Field>
            <Field label="About">
              <textarea className={inputClass} rows={4} value={profile.about || ""} onChange={(e) => setProfile({ ...profile, about: e.target.value })} />
            </Field>
            <button disabled={busy} className="w-full bg-gold px-4 py-3 text-xs uppercase tracking-[0.16em] text-black">
              Save profile
            </button>
          </form>
        ) : null}

        {tab === "application" ? (
          <div className="space-y-4">
            {applications.length ? (
              applications.map((item) => (
                <article key={item.id} className="border border-white/10 p-4">
                  <p className="text-sm text-ivory">{item.name || "Application"}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-gold">{item.status}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-ivory/60">No application yet.</p>
            )}
            <form onSubmit={submitApplication} className="space-y-3">
              <Field label="Name"><input name="name" required className={inputClass} /></Field>
              <Field label="Email"><input name="email" type="email" className={inputClass} /></Field>
              <Field label="Phone"><input name="phone" className={inputClass} /></Field>
              <Field label="City"><input name="city" className={inputClass} /></Field>
              <Field label="Message"><textarea name="message" className={inputClass} rows={3} /></Field>
              <button disabled={busy} className="w-full bg-gold px-4 py-3 text-xs uppercase tracking-[0.16em] text-black">
                Submit application
              </button>
            </form>
          </div>
        ) : null}

        {tab === "photos" ? (
          <div className="space-y-4">
            {photos.length ? (
              photos.map((photo) => (
                <div key={photo.id} className="flex items-center justify-between border border-white/10 px-3 py-2 text-sm">
                  <span className="text-ivory/80">{photo.id.slice(0, 8)}</span>
                  <span className="uppercase tracking-[0.14em] text-gold">{photo.status}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ivory/60">No photos uploaded.</p>
            )}
            <form onSubmit={uploadPhoto} className="space-y-3">
              <input name="file" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
              <button disabled={busy} className="w-full border border-gold px-4 py-3 text-xs uppercase tracking-[0.16em] text-gold">
                Upload
              </button>
            </form>
          </div>
        ) : null}

        {tab === "matches" ? (
          matches.length ? (
            <div className="space-y-3">
              {matches.map((match) => (
                <article key={String(match.id)} className="border border-white/10 p-4 text-sm">
                  <p>Score: {String(match.score ?? "—")}</p>
                  <p className="uppercase tracking-[0.14em] text-gold">{String(match.status)}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ivory/60">No matches yet.</p>
          )
        ) : null}

        {tab === "preferences" ? (
          <form onSubmit={savePreferences} className="space-y-3">
            <Field label="Preferred gender"><input className={inputClass} value={preferences.gender || ""} onChange={(e) => setPreferences({ ...preferences, gender: e.target.value })} /></Field>
            <Field label="City"><input className={inputClass} value={preferences.city || ""} onChange={(e) => setPreferences({ ...preferences, city: e.target.value })} /></Field>
            <Field label="Age min"><input className={inputClass} value={preferences.age_min || ""} onChange={(e) => setPreferences({ ...preferences, age_min: e.target.value })} /></Field>
            <Field label="Age max"><input className={inputClass} value={preferences.age_max || ""} onChange={(e) => setPreferences({ ...preferences, age_max: e.target.value })} /></Field>
            <button disabled={busy} className="w-full bg-gold px-4 py-3 text-xs uppercase tracking-[0.16em] text-black">Save preferences</button>
          </form>
        ) : null}

        {tab === "notifications" ? (
          notifications.length ? (
            notifications.map((item) => (
              <article key={item.id} className="border border-white/10 p-3 text-sm">
                <p>{item.type}</p>
                <p className="text-ivory/50">{item.status}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-ivory/60">No notifications.</p>
          )
        ) : null}

        {tab === "settings" ? (
          <div className="space-y-2 text-sm text-ivory/70">
            <p>Role: {me.role}</p>
            <p>Status: {me.status}</p>
          </div>
        ) : null}

        {tab === "admin" && isAdmin ? (
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 font-display text-xl">Applications</h2>
              {adminApps.map((item) => (
                <article key={item.id} className="mb-3 border border-white/10 p-3 text-sm">
                  <p>{item.name || item.id}</p>
                  <p className="text-gold">{item.status}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => adminAction(item.id, "approve")} className="border border-gold px-2 py-1 text-[10px] uppercase text-gold">Approve</button>
                    <button onClick={() => adminAction(item.id, "reject")} className="border border-white/20 px-2 py-1 text-[10px] uppercase">Reject</button>
                    <button onClick={() => adminAction(item.id, "request-info")} className="border border-white/20 px-2 py-1 text-[10px] uppercase">Need info</button>
                  </div>
                </article>
              ))}
            </section>
            <section>
              <h2 className="mb-3 font-display text-xl">Profiles</h2>
              {adminProfiles.map((item) => (
                <article key={item.id} className="mb-2 border border-white/10 p-3 text-sm">
                  <p>{item.first_name || item.user_id}</p>
                  <p className="text-ivory/50">{item.city} · {item.status}</p>
                </article>
              ))}
            </section>
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                await workerRequest("/api/admin/notes", {
                  method: "POST",
                  body: JSON.stringify({ user_id: noteUserId, note }),
                });
                setBusy(false);
                setNote("");
              }}
            >
              <h2 className="font-display text-xl">Admin note</h2>
              <input className={inputClass} placeholder="User ID" value={noteUserId} onChange={(e) => setNoteUserId(e.target.value)} />
              <textarea className={inputClass} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              <button disabled={busy} className="w-full bg-gold px-4 py-3 text-xs uppercase tracking-[0.16em] text-black">Add note</button>
            </form>
          </div>
        ) : null}
      </main>

      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-4 gap-1 border-t border-white/10 bg-[#070709] px-2 py-2 md:grid-cols-8">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`px-1 py-2 text-[10px] uppercase tracking-[0.08em] ${tab === item.id ? "text-gold" : "text-ivory/50"}`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
