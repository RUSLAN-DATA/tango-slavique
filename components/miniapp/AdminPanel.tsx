"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSessionToken, workerRequest, WORKER_URL } from "@/lib/miniapp/api";
import { parseMiniAppStartParam } from "@/lib/miniapp/startParam";

type Section =
  | "dashboard"
  | "applications"
  | "profiles"
  | "photos"
  | "matches"
  | "introductions"
  | "feedback"
  | "notifications"
  | "history"
  | "blog"
  | "users";

type Props = {
  startParam?: string;
  onExit?: () => void;
};

const goldBtn =
  "min-h-11 bg-gold px-4 text-xs uppercase tracking-[0.12em] text-black disabled:opacity-50";
const ghostBtn =
  "min-h-11 border border-white/15 px-4 text-xs uppercase tracking-[0.12em] text-ivory disabled:opacity-50";
const field =
  "min-h-11 w-full border border-white/[0.08] bg-white/[0.03] px-3 text-base text-ivory outline-none";

function PhotoThumb({ id, large }: { id: string; large?: boolean }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let objectUrl = "";
    async function load() {
      const token = getSessionToken();
      const response = await fetch(`${WORKER_URL}/api/photos/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return;
      objectUrl = URL.createObjectURL(await response.blob());
      setSrc(objectUrl);
    }
    void load();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  if (!src) return <div className={large ? "h-40 bg-white/5" : "h-16 w-16 bg-white/5"} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={large ? "h-40 w-full object-cover" : "h-16 w-16 object-cover"} />
  );
}

const sections: { id: Section; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "applications", label: "Applications" },
  { id: "profiles", label: "Profiles" },
  { id: "photos", label: "Photos" },
  { id: "matches", label: "Matches" },
  { id: "introductions", label: "Introductions" },
  { id: "feedback", label: "Feedback" },
  { id: "notifications", label: "Alerts" },
  { id: "history", label: "History" },
  { id: "blog", label: "Blog" },
  { id: "users", label: "Users" },
];

export function AdminPanel({ startParam, onExit }: Props) {
  const parsed = parseMiniAppStartParam(startParam);
  const [section, setSection] = useState<Section>((parsed?.section as Section) || "dashboard");
  const [selectedId, setSelectedId] = useState(parsed?.id || "");
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dashboard, setDashboard] = useState<Record<string, number>>({});
  const [applications, setApplications] = useState<Array<Record<string, string>>>([]);
  const [application, setApplication] = useState<Record<string, string> | null>(null);
  const [profiles, setProfiles] = useState<Array<Record<string, string>>>([]);
  const [profileDetail, setProfileDetail] = useState<{
    profile: Record<string, string | number | null>;
    notes: Array<Record<string, string>>;
    photos: Array<{ id: string; photo_status?: string; status: string }>;
  } | null>(null);
  const [photos, setPhotos] = useState<
    Array<{
      id: string;
      user_id: string;
      photo_status?: string;
      review?: {
        status: string;
        issues?: Array<{ message?: string; type?: string }>;
        quality?: string | null;
        face_visible?: boolean;
        main_person_detected?: boolean;
        admin_override?: string | null;
      } | null;
    }>
  >([]);
  const [matches, setMatches] = useState<Array<Record<string, unknown>>>([]);
  const [matchDetail, setMatchDetail] = useState<Record<string, unknown> | null>(null);
  const [intros, setIntros] = useState<Array<Record<string, string>>>([]);
  const [feedback, setFeedback] = useState<Array<Record<string, string>>>([]);
  const [alerts, setAlerts] = useState<Array<Record<string, string>>>([]);
  const [history, setHistory] = useState<Array<Record<string, string>>>([]);
  const [blog, setBlog] = useState<Array<Record<string, string>>>([]);
  const [users, setUsers] = useState<Array<Record<string, string>>>([]);
  const [note, setNote] = useState("");
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAbout, setEditAbout] = useState("");

  async function load() {
    const dash = await workerRequest<Record<string, number>>("/api/admin/dashboard");
    if (dash.status === 403 || dash.status === 401) {
      setDenied(true);
      return;
    }
    if (!dash.ok) {
      setError(dash.error?.message || "Admin access required");
      if (dash.status === 403) setDenied(true);
      return;
    }
    setDenied(false);
    setDashboard(dash.data || {});
    const [apps, profs, photoRows, matchRows, introRows, feedRows, noteRows, actionRows, blogRows, userRows] =
      await Promise.all([
        workerRequest<{ items: Array<Record<string, string>> }>("/api/applications"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/profiles"),
        workerRequest<{ items: Array<Record<string, unknown>> }>("/api/admin/photos"),
        workerRequest<{ items: Array<Record<string, unknown>> }>("/api/admin/matches"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/introductions"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/feedback"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/notifications"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/actions"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/blog"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/users"),
      ]);
    if ([apps, profs, photoRows, matchRows].some((item) => item.status === 403)) {
      setDenied(true);
      return;
    }
    setApplications(apps.data?.items || []);
    setProfiles(profs.data?.items || []);
    setPhotos((photoRows.data?.items || []) as typeof photos);
    setMatches(matchRows.data?.items || []);
    setIntros(introRows.data?.items || []);
    setFeedback(feedRows.data?.items || []);
    setAlerts(noteRows.data?.items || []);
    setHistory(actionRows.data?.items || []);
    setBlog(blogRows.data?.items || []);
    setUsers(userRows.data?.items || []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    if (section === "applications") {
      void workerRequest<Record<string, string>>(`/api/applications/${selectedId}`).then((res) => {
        if (res.ok) setApplication(res.data || null);
      });
    }
    if (section === "profiles") {
      void workerRequest<{
        profile: Record<string, string | number | null>;
        notes: Array<Record<string, string>>;
        photos: Array<{ id: string; status: string }>;
      }>(`/api/admin/profiles/${selectedId}`).then((res) => {
        if (res.ok && res.data) {
          setProfileDetail(res.data);
          setEditName(String(res.data.profile.first_name || ""));
          setEditCity(String(res.data.profile.city || ""));
          setEditAbout(String(res.data.profile.about || ""));
        }
      });
    }
    if (section === "matches") {
      void workerRequest<{ match: Record<string, unknown>; responses: unknown[] }>(
        `/api/admin/matches/${selectedId}`
      ).then((res) => {
        if (res.ok) setMatchDetail(res.data || null);
      });
    }
  }, [section, selectedId]);

  async function act(path: string, init: RequestInit = {}) {
    setBusy(true);
    const result = await workerRequest(path, init);
    setBusy(false);
    if (!result.ok) {
      setError(result.status === 403 ? "Admin access required" : result.error?.message || "Could not save");
      if (result.status === 403) setDenied(true);
      return false;
    }
    setError("");
    await load();
    return true;
  }

  if (denied) {
    return (
      <div className="px-5 py-16 text-center text-ivory/70">
        <p>Admin access is only available to authorized administrators.</p>
        {onExit ? (
          <button className={`${ghostBtn} mt-6`} type="button" onClick={onExit}>
            Back
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Tango Slavique Admin</p>
        <h1 className="mt-1 font-display text-3xl text-ivory">Admin Panel</h1>
        {onExit ? (
          <button className="mt-2 text-xs uppercase tracking-[0.14em] text-ivory/50" type="button" onClick={onExit}>
            My profile
          </button>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      </header>
      <nav className="flex flex-wrap gap-2">
        {sections.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`min-h-10 px-3 text-[10px] uppercase tracking-[0.12em] ${
              section === item.id ? "bg-gold text-black" : "border border-white/10 text-ivory/70"
            }`}
            onClick={() => {
              setSection(item.id);
              if (item.id !== section) setSelectedId("");
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {section === "dashboard" ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Applications", dashboard.applications, "applications"],
            ["Needs review", dashboard.pendingApplications, "applications"],
            ["Profiles", dashboard.profiles, "profiles"],
            ["Pending photos", dashboard.pendingPhotos, "photos"],
            ["Matches", dashboard.matches, "matches"],
            ["Introductions", dashboard.introductions, "introductions"],
            ["Feedback", dashboard.feedback, "feedback"],
            ["Users", dashboard.users, "users"],
          ].map(([label, value, target]) => (
            <button
              key={String(label)}
              type="button"
              className="border border-white/10 px-4 py-5 text-left"
              onClick={() => setSection(target as Section)}
            >
              <p className="text-[10px] uppercase tracking-[0.14em] text-gold">{label}</p>
              <p className="mt-2 font-display text-3xl">{Number(value || 0)}</p>
            </button>
          ))}
        </div>
      ) : null}

      {section === "applications" && !selectedId ? (
        <div className="space-y-3">
          {applications.map((item) => (
            <article key={item.id} className="border border-white/10 p-4">
              <button type="button" className="w-full text-left" onClick={() => setSelectedId(item.id)}>
                <p className="font-display text-2xl">{item.name || item.id}</p>
                <p className="text-sm text-ivory/60">
                  {item.city} · {item.status}
                </p>
              </button>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button className={goldBtn} disabled={busy} type="button" onClick={() => void act(`/api/applications/${item.id}/approve`, { method: "POST" })}>
                  Approve
                </button>
                <button className={ghostBtn} disabled={busy} type="button" onClick={() => void act(`/api/applications/${item.id}/reject`, { method: "POST" })}>
                  Reject
                </button>
                <button className={ghostBtn} disabled={busy} type="button" onClick={() => void act(`/api/applications/${item.id}/request-info`, { method: "POST" })}>
                  Need info
                </button>
              </div>
            </article>
          ))}
          {!applications.length ? <p className="text-ivory/50">No applications yet.</p> : null}
        </div>
      ) : null}

      {section === "applications" && selectedId ? (
        <div className="space-y-4">
          <button className="text-xs uppercase text-ivory/50" type="button" onClick={() => setSelectedId("")}>
            Back
          </button>
          <p className="font-display text-3xl">{application?.name || selectedId}</p>
          <p className="text-ivory/60">{application?.city}</p>
          <p className="text-sm text-ivory/80">{application?.message}</p>
          <p className="text-xs uppercase text-gold">{application?.status}</p>
          <div className="grid grid-cols-3 gap-2">
            <button className={goldBtn} disabled={busy} type="button" onClick={() => void act(`/api/applications/${selectedId}/approve`, { method: "POST" })}>
              Approve
            </button>
            <button className={ghostBtn} disabled={busy} type="button" onClick={() => void act(`/api/applications/${selectedId}/reject`, { method: "POST" })}>
              Reject
            </button>
            <button className={ghostBtn} disabled={busy} type="button" onClick={() => void act(`/api/applications/${selectedId}/request-info`, { method: "POST" })}>
              Need info
            </button>
          </div>
        </div>
      ) : null}

      {section === "profiles" && !selectedId ? (
        <div className="space-y-3">
          {profiles.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full border border-white/10 p-4 text-left"
              onClick={() => setSelectedId(item.user_id || item.id)}
            >
              <p className="font-display text-2xl">{item.first_name || item.user_id}</p>
              <p className="text-sm text-ivory/60">
                {item.city} · {item.status}
              </p>
            </button>
          ))}
          {!profiles.length ? <p className="text-ivory/50">No profiles yet.</p> : null}
        </div>
      ) : null}

      {section === "profiles" && selectedId && profileDetail ? (
        <form
          className="space-y-4"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void act(`/api/admin/profiles/${selectedId}`, {
              method: "PATCH",
              body: JSON.stringify({ first_name: editName, city: editCity, about: editAbout }),
            });
          }}
        >
          <button className="text-xs uppercase text-ivory/50" type="button" onClick={() => setSelectedId("")}>
            Back
          </button>
          {profileDetail.photos[0] ? <PhotoThumb id={profileDetail.photos[0].id} large /> : null}
          <input className={field} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" />
          <input className={field} value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="City" />
          <textarea className={`${field} py-3`} rows={4} value={editAbout} onChange={(e) => setEditAbout(e.target.value)} placeholder="About" />
          <button className={goldBtn} disabled={busy}>
            Save profile
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button className={goldBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/profiles/${selectedId}`, { method: "PATCH", body: JSON.stringify({ status: "public" }) })}>
              Approve
            </button>
            <button className={ghostBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/profiles/${selectedId}`, { method: "PATCH", body: JSON.stringify({ status: "hidden" }) })}>
              Hide
            </button>
          </div>
          <div className="space-y-2">
            {profileDetail.photos.map((photo) => (
              <div key={photo.id} className="flex items-center gap-3 border border-white/10 p-2">
                <PhotoThumb id={photo.id} />
                <button className="text-xs uppercase text-gold" type="button" disabled={busy} onClick={() => void act(`/api/photos/${photo.id}/approve`, { method: "POST" })}>
                  Approve
                </button>
                <button className="text-xs uppercase text-ivory/50" type="button" disabled={busy} onClick={() => void act(`/api/photos/${photo.id}/reject`, { method: "POST" })}>
                  Reject
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-gold">Admin notes</p>
            {profileDetail.notes.map((item) => (
              <p key={item.id} className="text-sm text-ivory/70">
                {item.note}
              </p>
            ))}
            <textarea className={`${field} py-3`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private note" />
            <button
              className={ghostBtn}
              type="button"
              disabled={busy || !note.trim()}
              onClick={async () => {
                if (await act("/api/admin/notes", { method: "POST", body: JSON.stringify({ user_id: selectedId, note }) })) {
                  setNote("");
                }
              }}
            >
              Add note
            </button>
          </div>
        </form>
      ) : null}

      {section === "photos" ? (
        <div className="space-y-4">
          {photos.map((photo) => (
            <article key={photo.id} className="border border-white/10 p-3">
              <PhotoThumb id={photo.id} large />
              <p className="mt-2 text-xs uppercase text-gold">{photo.photo_status || photo.review?.status || "saved"}</p>
              {photo.review ? (
                <div className="mt-2 space-y-1 text-sm text-ivory/70">
                  <p>Face visible: {photo.review.face_visible ? "yes" : "no"}</p>
                  <p>Main person: {photo.review.main_person_detected ? "yes" : "no"}</p>
                  <p>Quality: {photo.review.quality || "—"}</p>
                  {(photo.review.issues || []).map((issue, index) => (
                    <p key={`${photo.id}-issue-${index}`}>• {issue.message || issue.type}</p>
                  ))}
                  {photo.review.admin_override ? <p>Admin decision: {photo.review.admin_override}</p> : null}
                </div>
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className={goldBtn} type="button" disabled={busy} onClick={() => void act(`/api/photos/${photo.id}/approve`, { method: "POST" })}>
                  Approve
                </button>
                <button className={ghostBtn} type="button" disabled={busy} onClick={() => void act(`/api/photos/${photo.id}/reject`, { method: "POST" })}>
                  Reject
                </button>
              </div>
            </article>
          ))}
          {!photos.length ? <p className="text-ivory/50">No photos yet.</p> : null}
        </div>
      ) : null}

      {section === "matches" && !selectedId ? (
        <div className="space-y-3">
          <button className={goldBtn} type="button" disabled={busy} onClick={() => void act("/api/admin/matches/run", { method: "POST", body: "{}" })}>
            Run matching
          </button>
          {matches.map((item) => (
            <button
              key={String(item.id)}
              type="button"
              className="w-full border border-white/10 p-4 text-left"
              onClick={() => setSelectedId(String(item.id))}
            >
              <p>
                {String(item.user_name || item.user_id)} → {String(item.matched_name || item.matched_user_id)}
              </p>
              <p className="text-sm text-ivory/60">
                {String(item.status)} · score {String(item.score || "—")}
              </p>
            </button>
          ))}
          {!matches.length ? <p className="text-ivory/50">No matches yet.</p> : null}
        </div>
      ) : null}

      {section === "matches" && selectedId ? (
        <div className="space-y-4">
          <button className="text-xs uppercase text-ivory/50" type="button" onClick={() => setSelectedId("")}>
            Back
          </button>
          <p className="font-display text-2xl">
            {String((matchDetail?.match as Record<string, unknown> | undefined)?.user_name || "")} →{" "}
            {String((matchDetail?.match as Record<string, unknown> | undefined)?.matched_name || "")}
          </p>
          <p className="text-ivory/60">{String((matchDetail?.match as Record<string, unknown> | undefined)?.status || "")}</p>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-gold">Responses</p>
            {((matchDetail?.responses as Array<Record<string, string>>) || []).map((item) => (
              <p key={item.id || item.user_id} className="text-sm text-ivory/70">
                {item.user_id}: {item.response}
              </p>
            ))}
          </div>
          <button
            className={ghostBtn}
            type="button"
            disabled={busy}
            onClick={() =>
              void act("/api/admin/matches/run", {
                method: "POST",
                body: JSON.stringify({
                  user_id: (matchDetail?.match as Record<string, unknown> | undefined)?.user_id,
                }),
              })
            }
          >
            Re-run matching
          </button>
        </div>
      ) : null}

      {section === "introductions" ? (
        <div className="space-y-3">
          {intros.map((item) => (
            <article key={item.id} className="border border-white/10 p-4">
              <p>
                {item.user_name || item.user_id} → {item.matched_name || item.matched_user_id}
              </p>
              <p className="text-sm text-ivory/60">{item.status}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button className={goldBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/introductions/${item.id}`, { method: "PATCH", body: JSON.stringify({ status: "scheduled" }) })}>
                  Schedule
                </button>
                <button className={ghostBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/introductions/${item.id}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) })}>
                  Complete
                </button>
              </div>
            </article>
          ))}
          {!intros.length ? <p className="text-ivory/50">No introductions yet.</p> : null}
        </div>
      ) : null}

      {section === "feedback" ? (
        <div className="space-y-3">
          {feedback.map((item) => (
            <article key={item.id} className="border border-white/10 p-4 text-sm">
              <p>
                {item.user_name || item.user_id} · {item.rating || "—"}
              </p>
              <p className="text-ivory/70">{item.message}</p>
            </article>
          ))}
          {!feedback.length ? <p className="text-ivory/50">No feedback yet.</p> : null}
        </div>
      ) : null}

      {section === "notifications" ? (
        <div className="space-y-3">
          {alerts.map((item) => (
            <article key={item.id} className="border border-white/10 p-3 text-sm text-ivory/70">
              {item.type} · {item.channel} · {item.status}
            </article>
          ))}
          {!alerts.length ? <p className="text-ivory/50">No notifications yet.</p> : null}
        </div>
      ) : null}

      {section === "history" ? (
        <div className="space-y-3">
          {history.map((item) => (
            <article key={item.id} className="border border-white/10 p-3 text-sm text-ivory/70">
              {item.action} · {item.entity_type} · {item.admin_telegram_id}
            </article>
          ))}
          {!history.length ? <p className="text-ivory/50">No admin actions yet.</p> : null}
        </div>
      ) : null}

      {section === "blog" ? (
        <div className="space-y-3">
          {blog.map((item) => (
            <article key={item.id} className="border border-white/10 p-4">
              <p>{item.title || item.slug}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button className={goldBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/blog/${item.id}/publish`, { method: "POST" })}>
                  Publish
                </button>
                <button className={ghostBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/blog/${item.id}/en`, { method: "POST" })}>
                  EN
                </button>
                <button className={ghostBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/blog/${item.id}/es`, { method: "POST" })}>
                  ES
                </button>
              </div>
            </article>
          ))}
          {!blog.length ? <p className="text-ivory/50">No blog drafts yet.</p> : null}
        </div>
      ) : null}

      {section === "users" ? (
        <div className="space-y-3">
          {users.map((item) => (
            <article key={item.id} className="border border-white/10 p-4 text-sm">
              <p>{item.first_name || item.id}</p>
              <p className="text-ivory/60">
                {item.role} · {item.status} · {item.city || "—"}
              </p>
            </article>
          ))}
          {!users.length ? <p className="text-ivory/50">No users yet.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
