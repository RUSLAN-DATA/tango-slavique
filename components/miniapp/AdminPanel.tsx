"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSessionToken, workerRequest, WORKER_URL } from "@/lib/miniapp/api";
import { parseMiniAppStartParam } from "@/lib/miniapp/startParam";
import {
  adminCopy,
  adminLocales,
  isAdminLocale,
  statusLabel,
  noticeLabel,
  type AdminLocale,
} from "@/lib/miniapp/adminCopy";
import {
  applicantSections,
  displayApplicantValue,
  type ApplicantProfileView,
} from "@/lib/miniapp/applicantProfileView";
import { contentPages, contentFields, defaultContentValue, type ContentField } from "@/lib/content/catalog";
import { parseArticleMarkdown } from "@/lib/blog/format";
import { ArticleBody } from "@/components/blog/ArticleBody";

type Section =
  | "dashboard"
  | "applications"
  | "profiles"
  | "photos"
  | "matches"
  | "blog"
  | "content"
  | "notifications"
  | "notes"
  | "settings"
  | "introductions"
  | "feedback"
  | "history"
  | "users";

type Props = {
  startParam?: string;
  onExit?: () => void;
  locale?: AdminLocale;
  onLocaleChange?: (next: AdminLocale) => void;
};

const STORAGE_KEY = "ts_admin_locale";

function readStoredLocale(): AdminLocale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isAdminLocale(stored) ? stored : "en";
}

const goldBtn =
  "min-h-12 bg-gold px-4 text-xs uppercase tracking-[0.12em] text-black disabled:opacity-50";
const ghostBtn =
  "min-h-12 border border-white/15 px-4 text-xs uppercase tracking-[0.12em] text-ivory disabled:opacity-50";
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

function AnnotationThumb({ id }: { id: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let objectUrl = "";
    async function load() {
      const token = getSessionToken();
      const response = await fetch(`${WORKER_URL}/api/admin/photos/${id}/annotation`, {
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
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="mt-2 h-32 w-full object-contain bg-white/5" />
  );
}

const primaryNav: Section[] = [
  "dashboard",
  "applications",
  "profiles",
  "photos",
  "matches",
  "blog",
  "content",
  "notifications",
  "notes",
  "settings",
];

export function AdminPanel({ startParam, onExit, locale: localeProp, onLocaleChange }: Props) {
  const parsed = parseMiniAppStartParam(startParam);
  const [locale, setLocale] = useState<AdminLocale>(localeProp || readStoredLocale());
  const t = adminCopy[locale];
  const [section, setSection] = useState<Section>((parsed?.section as Section) || "dashboard");
  const [selectedId, setSelectedId] = useState(parsed?.id || "");
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dashboard, setDashboard] = useState<Record<string, number>>({});
  const [applications, setApplications] = useState<Array<Record<string, string>>>([]);
  const [application, setApplication] = useState<{
    id?: string;
    name?: string;
    city?: string;
    message?: string;
    status?: string;
    source?: string;
    applicant?: ApplicantProfileView;
    photos?: Array<{
      id: string;
      photo_status?: string;
      review?: {
        status: string;
        issues?: Array<{ message?: string; type?: string }>;
        quality?: string | null;
        face_visible?: boolean;
        main_person_detected?: boolean;
        admin_override?: string | null;
        has_annotation?: boolean;
      } | null;
    }>;
  } | null>(null);
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
        has_annotation?: boolean;
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
  const [blogForm, setBlogForm] = useState(false);
  const [blogEditId, setBlogEditId] = useState("");
  const [blogOriginal, setBlogOriginal] = useState("");
  const [blogEn, setBlogEn] = useState("");
  const [blogEs, setBlogEs] = useState("");
  const [blogFile, setBlogFile] = useState<File | null>(null);
  const [blogPreview, setBlogPreview] = useState(false);
  const [contentRows, setContentRows] = useState<Array<Record<string, string>>>([]);
  const [contentPage, setContentPage] = useState<(typeof contentPages)[number]["id"] | "">("");
  const [contentFieldId, setContentFieldId] = useState("");
  const [contentLocale, setContentLocale] = useState<"en" | "es">("en");
  const [contentDraft, setContentDraft] = useState("");
  const [contentPreview, setContentPreview] = useState(false);
  const [users, setUsers] = useState<Array<Record<string, string>>>([]);
  const [adminNotes, setAdminNotes] = useState<Array<Record<string, string>>>([]);
  const [note, setNote] = useState("");
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [appFilter, setAppFilter] = useState<"new" | "info_requested" | "approved" | "rejected">("new");
  const [infoDraft, setInfoDraft] = useState("");
  const [noteFilter, setNoteFilter] = useState<"unread" | "read" | "">("");

  async function load() {
    const dash = await workerRequest<Record<string, number>>("/api/admin/dashboard");
    if (dash.status === 403 || dash.status === 401) {
      setDenied(true);
      return;
    }
    if (!dash.ok) {
      setError(dash.error?.message || t.accessRequired);
      if (dash.status === 403) setDenied(true);
      return;
    }
    setDenied(false);
    setDashboard(dash.data || {});
    const [apps, profs, photoRows, matchRows, introRows, feedRows, noteRows, actionRows, blogRows, userRows, notesList, contentData] =
      await Promise.all([
        workerRequest<{ items: Array<Record<string, string>> }>(`/api/applications?status=${appFilter}`),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/profiles"),
        workerRequest<{ items: Array<Record<string, unknown>> }>("/api/admin/photos"),
        workerRequest<{ items: Array<Record<string, unknown>> }>("/api/admin/matches"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/introductions"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/feedback"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/notifications"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/actions"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/blog"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/users"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/notes"),
        workerRequest<{ items: Array<Record<string, string>> }>("/api/admin/content"),
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
    setAdminNotes(notesList.data?.items || []);
    setContentRows(contentData.data?.items || []);
  }

  useEffect(() => {
    const stored = readStoredLocale();
    setLocale(stored);
    void workerRequest<{ adminLocale?: string }>("/api/me").then((res) => {
      if (res.ok && isAdminLocale(res.data?.adminLocale)) {
        setLocale(res.data.adminLocale);
        window.localStorage.setItem(STORAGE_KEY, res.data.adminLocale);
      }
    });
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void workerRequest<{ items: Array<Record<string, string>> }>(`/api/applications?status=${appFilter}`).then(
      (res) => {
        if (res.ok) setApplications(res.data?.items || []);
      }
    );
  }, [appFilter]);

  useEffect(() => {
    if (!selectedId) return;
    if (section === "applications") {
      void workerRequest<{
        id?: string;
        name?: string;
        city?: string;
        message?: string;
        status?: string;
        source?: string;
        applicant?: ApplicantProfileView;
        photos?: Array<{ id: string; photo_status?: string; review?: { status: string } | null }>;
      }>(`/api/applications/${selectedId}`).then((res) => {
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
      setError(result.status === 403 ? t.accessRequired : result.error?.message || t.error);
      if (result.status === 403) setDenied(true);
      return false;
    }
    setError("");
    await load();
    return true;
  }

  useEffect(() => {
    if (localeProp && localeProp !== locale) {
      setLocale(localeProp);
    }
  }, [localeProp, locale]);

  async function saveLocale(next: AdminLocale) {
    setLocale(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    onLocaleChange?.(next);
    await workerRequest("/api/me", {
      method: "PATCH",
      body: JSON.stringify({ adminLocale: next }),
    });
  }

  function navLabel(id: Section) {
    if (id in t.nav) return t.nav[id as keyof typeof t.nav];
    if (id in t.extra) return t.extra[id as keyof typeof t.extra];
    return id;
  }

  if (denied) {
    return (
      <div className="px-5 py-16 text-center text-ivory/70">
        <p>{t.denied}</p>
        {onExit ? (
          <button className={`${ghostBtn} mt-6`} type="button" onClick={onExit}>
            {t.back}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold">{t.house}</p>
        <h1 className="mt-1 font-display text-3xl text-ivory">{t.title}</h1>
        {onExit ? (
          <button className="mt-2 min-h-11 text-xs uppercase tracking-[0.14em] text-ivory/50" type="button" onClick={onExit}>
            {t.myProfile}
          </button>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      </header>
      <nav className="flex flex-wrap gap-2">
        {primaryNav.map((item) => (
          <button
            key={item}
            type="button"
            className={`min-h-11 px-3 text-[10px] uppercase tracking-[0.12em] ${
              section === item ? "bg-gold text-black" : "border border-white/10 text-ivory/70"
            }`}
            onClick={() => {
              setSection(item);
              if (item !== section) setSelectedId("");
            }}
          >
            {navLabel(item)}
          </button>
        ))}
      </nav>

      {section === "dashboard" ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            [t.dash.newApplications, dashboard.pendingApplications, "applications"],
            [t.dash.profiles, dashboard.pendingProfiles || dashboard.profiles, "profiles"],
            [t.dash.photosWaiting, dashboard.pendingPhotos, "photos"],
            [t.dash.blogDrafts, dashboard.blogDrafts, "blog"],
            [t.dash.notifications, dashboard.notifications, "notifications"],
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
          <div className="grid grid-cols-2 gap-2">
            {([
              ["new", t.filters.pending],
              ["info_requested", t.filters.needInfo],
              ["approved", t.filters.approved],
              ["rejected", t.filters.rejected],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={appFilter === id ? goldBtn : ghostBtn}
                onClick={() => setAppFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-ivory/60">{t.infoHint}</p>
          <textarea
            className={`${field} py-3`}
            rows={3}
            value={infoDraft}
            onChange={(e) => setInfoDraft(e.target.value)}
            placeholder={t.infoPlaceholder}
          />
          {applications.map((item) => (
            <article key={item.id} className="border border-white/10 p-4">
              <button type="button" className="w-full text-left" onClick={() => setSelectedId(item.id)}>
                <p className="font-display text-2xl">{item.name || item.id}</p>
                <p className="text-sm text-ivory/60">
                  {item.city} · {statusLabel(t, item.status)}
                </p>
              </button>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button className={goldBtn} disabled={busy} type="button" onClick={() => void act(`/api/applications/${item.id}/approve`, { method: "POST" })}>
                  {t.actions.approve}
                </button>
                <button className={ghostBtn} disabled={busy} type="button" onClick={() => void act(`/api/applications/${item.id}/reject`, { method: "POST" })}>
                  {t.actions.reject}
                </button>
                <button
                  className={ghostBtn}
                  disabled={busy}
                  type="button"
                  onClick={() =>
                    void act(`/api/applications/${item.id}/request-info`, {
                      method: "POST",
                      body: JSON.stringify({ message: infoDraft.trim() }),
                    }).then((ok) => {
                      if (ok) setInfoDraft("");
                    })
                  }
                >
                  {t.actions.needInfo}
                </button>
              </div>
            </article>
          ))}
          {!applications.length ? <p className="text-ivory/50">{t.empty.applications}</p> : null}
        </div>
      ) : null}

      {section === "applications" && selectedId ? (
        <div className="space-y-4">
          <button className="min-h-11 text-xs uppercase text-ivory/50" type="button" onClick={() => setSelectedId("")}>
            {t.back}
          </button>
          <p className="font-display text-3xl">{application?.applicant?.basic?.firstName || application?.name || selectedId}</p>
          <p className="text-ivory/60">
            {[application?.applicant?.basic?.city || application?.city, application?.source].filter(Boolean).join(" · ")}
          </p>
          <p className="text-xs uppercase text-gold">{statusLabel(t, application?.status)}</p>
          {applicantSections(application?.applicant).map((sectionItem) => (
            <section key={sectionItem.id} className="space-y-2 border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.applicant[sectionItem.id]}</p>
              {sectionItem.fields.map((field) => (
                <div key={field.key} className="text-sm">
                  <p className="text-ivory/50">{t.applicant[field.key as keyof typeof t.applicant]}</p>
                  <p className="whitespace-pre-wrap text-ivory/90">
                    {displayApplicantValue(field.value, {
                      yes: t.photo.yes,
                      no: t.photo.no,
                      empty: t.applicant.empty,
                    })}
                  </p>
                </div>
              ))}
            </section>
          ))}
          <section className="space-y-3 border border-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.applicant.photos}</p>
            {application?.photos?.length ? (
              application.photos.map((photo) => (
                <article key={photo.id} className="border border-white/10 p-3">
                  <PhotoThumb id={photo.id} large />
                  {photo.review?.has_annotation ? <AnnotationThumb id={photo.id} /> : null}
                  <p className="mt-2 text-xs uppercase text-gold">
                    {statusLabel(t, photo.review?.status || photo.photo_status)}
                  </p>
                  {photo.review?.status === "AI_UNAVAILABLE" ? (
                    <p className="mt-2 text-sm text-ivory/70">{t.photo.unavailable}</p>
                  ) : null}
                  {photo.review ? (
                    <div className="mt-2 space-y-1 text-sm text-ivory/70">
                      <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.applicant.photoReview}</p>
                      <p>
                        {t.photo.face}: {photo.review.face_visible ? t.photo.yes : t.photo.no}
                      </p>
                      <p>
                        {t.photo.person}: {photo.review.main_person_detected ? t.photo.yes : t.photo.no}
                      </p>
                      <p>
                        {t.photo.quality}: {photo.review.quality || t.applicant.empty}
                      </p>
                      {photo.review.admin_override ? (
                        <p>
                          {t.photo.decision}: {statusLabel(t, photo.review.admin_override)}
                        </p>
                      ) : null}
                      {photo.review.issues?.map((issue, index) => (
                        <p key={`${photo.id}-issue-${index}`}>{issue.message || issue.type}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-ivory/60">{t.photo.waiting}</p>
                  )}
                </article>
              ))
            ) : (
              <p className="text-sm text-ivory/50">{t.applicant.noPhotos}</p>
            )}
          </section>
          <p className="text-sm text-ivory/60">{t.infoHint}</p>
          <textarea
            className={`${field} py-3`}
            rows={3}
            value={infoDraft}
            onChange={(e) => setInfoDraft(e.target.value)}
            placeholder={t.infoPlaceholder}
          />
          <div className="grid grid-cols-3 gap-2">
            <button className={goldBtn} disabled={busy} type="button" onClick={() => void act(`/api/applications/${selectedId}/approve`, { method: "POST" })}>
              {t.actions.approve}
            </button>
            <button className={ghostBtn} disabled={busy} type="button" onClick={() => void act(`/api/applications/${selectedId}/reject`, { method: "POST" })}>
              {t.actions.reject}
            </button>
            <button
              className={ghostBtn}
              disabled={busy}
              type="button"
              onClick={() =>
                void act(`/api/applications/${selectedId}/request-info`, {
                  method: "POST",
                  body: JSON.stringify({ message: infoDraft.trim() }),
                }).then((ok) => {
                  if (ok) setInfoDraft("");
                })
              }
            >
              {t.actions.sendInfo}
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
                {item.city} · {statusLabel(t, item.status)}
              </p>
            </button>
          ))}
          {!profiles.length ? <p className="text-ivory/50">{t.empty.profiles}</p> : null}
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
          <button className="min-h-11 text-xs uppercase text-ivory/50" type="button" onClick={() => setSelectedId("")}>
            {t.back}
          </button>
          {profileDetail.photos[0] ? <PhotoThumb id={profileDetail.photos[0].id} large /> : null}
          <input className={field} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={t.fields.name} />
          <input className={field} value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder={t.fields.city} />
          <textarea className={`${field} py-3`} rows={4} value={editAbout} onChange={(e) => setEditAbout(e.target.value)} placeholder={t.fields.about} />
          <button className={goldBtn} disabled={busy}>
            {t.actions.saveProfile}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button className={goldBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/profiles/${selectedId}`, { method: "PATCH", body: JSON.stringify({ status: "public" }) })}>
              {t.actions.approve}
            </button>
            <button className={ghostBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/profiles/${selectedId}`, { method: "PATCH", body: JSON.stringify({ status: "hidden" }) })}>
              {t.actions.hide}
            </button>
          </div>
          <div className="space-y-2">
            {profileDetail.photos.map((photo) => (
              <div key={photo.id} className="flex items-center gap-3 border border-white/10 p-2">
                <PhotoThumb id={photo.id} />
                <button className="min-h-11 text-xs uppercase text-gold" type="button" disabled={busy} onClick={() => void act(`/api/photos/${photo.id}/approve`, { method: "POST" })}>
                  {t.actions.useAnyway}
                </button>
                <button className="min-h-11 text-xs uppercase text-ivory/50" type="button" disabled={busy} onClick={() => void act(`/api/photos/${photo.id}/reject`, { method: "POST" })}>
                  {t.actions.reject}
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.nav.notes}</p>
            {profileDetail.notes.map((item) => (
              <p key={item.id} className="text-sm text-ivory/70">
                {item.note}
              </p>
            ))}
            <textarea className={`${field} py-3`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.fields.note} />
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
              {t.actions.addNote}
            </button>
          </div>
        </form>
      ) : null}

      {section === "photos" ? (
        <div className="space-y-4">
          {photos.map((photo) => (
            <article key={photo.id} className="border border-white/10 p-3">
              <PhotoThumb id={photo.id} large />
              {photo.review?.has_annotation ? <AnnotationThumb id={photo.id} /> : null}
              <p className="mt-2 text-xs uppercase text-gold">{statusLabel(t, photo.review?.status || photo.photo_status)}</p>
              {photo.review?.status === "AI_UNAVAILABLE" ? (
                <p className="mt-2 text-sm text-ivory/70">{t.photo.unavailable}</p>
              ) : null}
              {photo.review ? (
                <div className="mt-2 space-y-1 text-sm text-ivory/70">
                  <p>{t.photo.face}: {photo.review.face_visible ? t.photo.yes : t.photo.no}</p>
                  <p>{t.photo.person}: {photo.review.main_person_detected ? t.photo.yes : t.photo.no}</p>
                  <p>{t.photo.quality}: {photo.review.quality || "—"}</p>
                  {(photo.review.issues || []).map((issue, index) => (
                    <p key={`${photo.id}-issue-${index}`}>• {issue.message || issue.type}</p>
                  ))}
                  {photo.review.admin_override ? <p>{t.photo.decision}: {statusLabel(t, photo.review.admin_override)}</p> : null}
                </div>
              ) : null}
              <div className="mt-3 grid grid-cols-1 gap-2">
                <button className={goldBtn} type="button" disabled={busy} onClick={() => void act(`/api/photos/${photo.id}/approve`, { method: "POST" })}>
                  {t.actions.useAnyway}
                </button>
                <button className={ghostBtn} type="button" disabled={busy} onClick={() => void act(`/api/photos/${photo.id}/request-info`, { method: "POST" })}>
                  {t.actions.requestNew}
                </button>
                <button className={ghostBtn} type="button" disabled={busy} onClick={() => void act(`/api/photos/${photo.id}/reject`, { method: "POST" })}>
                  {t.actions.reject}
                </button>
              </div>
            </article>
          ))}
          {!photos.length ? <p className="text-ivory/50">{t.empty.photos}</p> : null}
        </div>
      ) : null}

      {section === "matches" && !selectedId ? (
        <div className="space-y-3">
          <button className={goldBtn} type="button" disabled={busy} onClick={() => void act("/api/admin/matches/run", { method: "POST", body: "{}" })}>
            {t.actions.runMatching}
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
                {statusLabel(t, String(item.status))} · {String(item.score || "—")}
              </p>
            </button>
          ))}
          {!matches.length ? <p className="text-ivory/50">{t.empty.matches}</p> : null}
        </div>
      ) : null}

      {section === "matches" && selectedId ? (
        <div className="space-y-4">
          <button className="min-h-11 text-xs uppercase text-ivory/50" type="button" onClick={() => setSelectedId("")}>
            {t.back}
          </button>
          <p className="font-display text-2xl">
            {String((matchDetail?.match as Record<string, unknown> | undefined)?.user_name || "")} →{" "}
            {String((matchDetail?.match as Record<string, unknown> | undefined)?.matched_name || "")}
          </p>
          <p className="text-ivory/60">{statusLabel(t, String((matchDetail?.match as Record<string, unknown> | undefined)?.status || ""))}</p>
          <div>
            {((matchDetail?.responses as Array<Record<string, string>>) || []).map((item) => (
              <p key={item.id || item.user_id} className="text-sm text-ivory/70">
                {item.response}
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
            {t.actions.rerun}
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
              <p className="text-sm text-ivory/60">{statusLabel(t, item.status)}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button className={goldBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/introductions/${item.id}`, { method: "PATCH", body: JSON.stringify({ status: "scheduled" }) })}>
                  {t.actions.schedule}
                </button>
                <button className={ghostBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/introductions/${item.id}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) })}>
                  {t.actions.complete}
                </button>
              </div>
            </article>
          ))}
          {!intros.length ? <p className="text-ivory/50">{t.empty.introductions}</p> : null}
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
          {!feedback.length ? <p className="text-ivory/50">{t.empty.feedback}</p> : null}
        </div>
      ) : null}

      {section === "notifications" ? (
        <div className="space-y-3">
          <p className="text-sm text-ivory/70">{t.notices.explain}</p>
          <div className="grid grid-cols-2 gap-2">
            <button className={`${!noteFilter ? goldBtn : ghostBtn}`} type="button" onClick={() => setNoteFilter("")}>
              {t.notices.unread} / {t.notices.read}
            </button>
            <button className={ghostBtn} type="button" disabled={busy} onClick={() => void act("/api/notifications/read-all", { method: "POST" })}>
              {t.notices.markAll}
            </button>
            <button className={`${noteFilter === "unread" ? goldBtn : ghostBtn}`} type="button" onClick={() => setNoteFilter("unread")}>
              {t.notices.unread}
            </button>
            <button className={`${noteFilter === "read" ? goldBtn : ghostBtn}`} type="button" onClick={() => setNoteFilter("read")}>
              {t.notices.read}
            </button>
          </div>
          {alerts
            .filter((item) => !noteFilter || item.status === noteFilter)
            .map((item) => (
              <article key={item.id} className="border border-white/10 p-3 text-sm">
                <p className={item.status === "unread" ? "text-ivory" : "text-ivory/60"}>{noticeLabel(t, item.type)}</p>
                <p className="mt-1 text-xs uppercase text-gold">{item.status === "read" ? t.notices.read : t.notices.unread}</p>
                {item.status !== "read" ? (
                  <button
                    className={`${ghostBtn} mt-2`}
                    type="button"
                    disabled={busy}
                    onClick={() => void act(`/api/notifications/${item.id}/read`, { method: "POST" })}
                  >
                    {t.notices.markRead}
                  </button>
                ) : null}
              </article>
            ))}
          {!alerts.filter((item) => !noteFilter || item.status === noteFilter).length ? (
            <p className="text-ivory/50">{t.empty.notifications}</p>
          ) : null}
        </div>
      ) : null}

      {section === "notes" ? (
        <div className="space-y-3">
          {adminNotes.map((item) => (
            <article key={item.id} className="border border-white/10 p-4 text-sm">
              <p className="text-gold">{item.first_name || item.user_id}</p>
              <p className="mt-2 text-ivory/80">{item.note}</p>
            </article>
          ))}
          {!adminNotes.length ? <p className="text-ivory/50">{t.empty.notes}</p> : null}
        </div>
      ) : null}

      {section === "history" ? (
        <div className="space-y-3">
          {history.map((item) => (
            <article key={item.id} className="border border-white/10 p-3 text-sm text-ivory/70">
              {item.action} · {item.entity_type}
            </article>
          ))}
          {!history.length ? <p className="text-ivory/50">{t.empty.history}</p> : null}
        </div>
      ) : null}

      {section === "blog" ? (
        <div className="space-y-4">
          {!blogForm ? (
            <>
              <button
                className={goldBtn}
                type="button"
                onClick={() => {
                  setBlogForm(true);
                  setBlogEditId("");
                  setBlogOriginal("");
                  setBlogEn("");
                  setBlogEs("");
                  setBlogFile(null);
                  setBlogPreview(false);
                }}
              >
                + {t.blog.new}
              </button>
              {blog.map((item) => (
                <article key={item.id} className="border border-white/10 p-4">
                  <p>{item.title || item.slug}</p>
                  <p className="text-xs uppercase text-gold">{statusLabel(t, item.status)}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      className={ghostBtn}
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        const detail = await workerRequest<{
                          article: Record<string, string>;
                          translations: Array<{ locale: string; title: string; body: string }>;
                        }>(`/api/admin/blog/${item.id}`);
                        setBlogEditId(item.id);
                        setBlogOriginal(detail.data?.article.original_text || "");
                        const en = detail.data?.translations.find((row) => row.locale === "en");
                        const es = detail.data?.translations.find((row) => row.locale === "es");
                        setBlogEn(en ? `${en.title}\n${en.body}` : "");
                        setBlogEs(es ? `${es.title}\n${es.body}` : "");
                        setBlogFile(null);
                        setBlogPreview(false);
                        setBlogForm(true);
                      }}
                    >
                      {t.blog.edit}
                    </button>
                    <button className={ghostBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/blog/${item.id}/publish`, { method: "POST" })}>
                      {t.blog.publish}
                    </button>
                    <button className={ghostBtn} type="button" disabled={busy} onClick={() => void act(`/api/admin/blog/${item.id}/unpublish`, { method: "POST" })}>
                      {t.blog.unpublish}
                    </button>
                    <button
                      className={ghostBtn}
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(t.confirm.deletePost)) {
                          void act(`/api/admin/blog/${item.id}/delete`, { method: "POST" });
                        }
                      }}
                    >
                      {t.blog.delete}
                    </button>
                  </div>
                </article>
              ))}
              {!blog.length ? <p className="text-ivory/50">{t.blog.empty}</p> : null}
            </>
          ) : (
            <div className="space-y-4">
              <button className="min-h-11 text-xs uppercase text-ivory/50" type="button" onClick={() => setBlogForm(false)}>
                {t.back}
              </button>
              {blogPreview ? (
                <div className="space-y-6 border border-white/10 p-4">
                  <p className="text-xs uppercase text-gold">{t.blog.preview}</p>
                  {blogFile ? <p className="text-sm text-ivory/70">{blogFile.name}</p> : null}
                  {(() => {
                    const en = parseArticleMarkdown(blogEn || blogOriginal);
                    const es = parseArticleMarkdown(blogEs);
                    return (
                      <>
                        <ArticleBody title={en.title} subtitle={en.subtitle} blocks={en.blocks} />
                        {blogEs.trim() ? (
                          <ArticleBody className="border-t border-white/10 pt-6" title={es.title} subtitle={es.subtitle} blocks={es.blocks} />
                        ) : null}
                      </>
                    );
                  })()}
                </div>
              ) : null}
              <label className="block text-xs uppercase tracking-[0.14em] text-gold">{t.blog.photo}</label>
              <p className="text-xs leading-relaxed text-ivory/60">{t.blog.imageGuide}</p>
              <input
                className="text-sm"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setBlogFile(event.target.files?.[0] || null)}
              />
              <label className="block text-xs uppercase tracking-[0.14em] text-gold">{t.blog.original}</label>
              <p className="whitespace-pre-wrap text-xs text-ivory/50">{t.blog.syntax}</p>
              <textarea className={`${field} py-3`} rows={5} value={blogOriginal} onChange={(e) => setBlogOriginal(e.target.value)} placeholder={t.blog.placeholderOriginal} />
              <label className="block text-xs uppercase tracking-[0.14em] text-gold">{t.blog.english}</label>
              <textarea className={`${field} py-3`} rows={5} value={blogEn} onChange={(e) => setBlogEn(e.target.value)} placeholder={t.blog.placeholderEn} />
              <label className="block text-xs uppercase tracking-[0.14em] text-gold">{t.blog.spanish}</label>
              <textarea className={`${field} py-3`} rows={5} value={blogEs} onChange={(e) => setBlogEs(e.target.value)} placeholder={t.blog.placeholderEs} />
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={ghostBtn}
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (!blogOriginal.trim() && !blogEn.trim()) {
                      setError(t.blog.needText);
                      return;
                    }
                    setBusy(true);
                    let id = blogEditId;
                    if (!id) {
                      const created = await workerRequest<{ id: string }>("/api/admin/blog", {
                        method: "POST",
                        body: JSON.stringify({ originalText: blogOriginal, en: blogEn, es: blogEs }),
                      });
                      if (!created.ok || !created.data?.id) {
                        setBusy(false);
                        setError(created.error?.message || t.error);
                        return;
                      }
                      id = created.data.id;
                      setBlogEditId(id);
                    } else {
                      await workerRequest(`/api/admin/blog/${id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ originalText: blogOriginal, en: blogEn, es: blogEs }),
                      });
                    }
                    if (blogFile) {
                      const form = new FormData();
                      form.append("file", blogFile);
                      await workerRequest(`/api/admin/blog/${id}/cover`, { method: "POST", body: form });
                    }
                    setBusy(false);
                    await load();
                    setError("");
                  }}
                >
                  {t.blog.saveDraft}
                </button>
                <button className={ghostBtn} type="button" onClick={() => setBlogPreview((value) => !value)}>
                  {t.blog.preview}
                </button>
                <button
                  className={goldBtn}
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (!blogOriginal.trim() && !blogEn.trim()) {
                      setError(t.blog.needText);
                      return;
                    }
                    setBusy(true);
                    let id = blogEditId;
                    if (!id) {
                      const created = await workerRequest<{ id: string }>("/api/admin/blog", {
                        method: "POST",
                        body: JSON.stringify({ originalText: blogOriginal, en: blogEn, es: blogEs, publish: false }),
                      });
                      if (!created.ok || !created.data?.id) {
                        setBusy(false);
                        setError(created.error?.message || t.error);
                        return;
                      }
                      id = created.data.id;
                    } else {
                      await workerRequest(`/api/admin/blog/${id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ originalText: blogOriginal, en: blogEn, es: blogEs }),
                      });
                    }
                    if (blogFile) {
                      const form = new FormData();
                      form.append("file", blogFile);
                      await workerRequest(`/api/admin/blog/${id}/cover`, { method: "POST", body: form });
                    }
                    await workerRequest(`/api/admin/blog/${id}/publish`, { method: "POST" });
                    setBusy(false);
                    setBlogForm(false);
                    await load();
                  }}
                >
                  {t.blog.publish}
                </button>
                <button className={ghostBtn} type="button" onClick={() => setBlogForm(false)}>
                  {t.blog.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {section === "content" ? (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.content.title}</p>
          <div className="grid grid-cols-1 gap-2">
            {contentPages.map((page) => (
              <button
                key={page.id}
                type="button"
                className={`${contentPage === page.id ? goldBtn : ghostBtn}`}
                onClick={() => {
                  setContentPage(page.id);
                  setContentFieldId("");
                  setContentPreview(false);
                }}
              >
                {page.label[locale]}
              </button>
            ))}
          </div>
          {contentPage ? (
            <div className="space-y-3">
              {contentFields
                .filter((field) => field.page === contentPage)
                .map((field) => {
                  const row = contentRows.find(
                    (item) => item.field === field.field && item.page === field.page && item.locale === contentLocale && item.section === field.section
                  );
                  const published = row?.published_value || defaultContentValue(field.dictPath, contentLocale);
                  const draft = row?.draft_value || "";
                  return (
                    <article key={field.id} className="border border-white/10 p-4">
                      <p className="text-sm">{field.label[locale]}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-gold">{t.content.current}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ivory/80">{published}</p>
                      {draft && draft !== published ? (
                        <>
                          <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-gold">{t.content.draft}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-ivory/60">{draft}</p>
                        </>
                      ) : null}
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          className={ghostBtn}
                          type="button"
                          onClick={() => {
                            setContentFieldId(field.id);
                            setContentDraft(row?.draft_value || published);
                            setContentPreview(true);
                          }}
                        >
                          {t.content.edit}
                        </button>
                        <button
                          className={goldBtn}
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(t.confirm.publishContent)) {
                              void act("/api/admin/content", {
                                method: "PATCH",
                                body: JSON.stringify({
                                  fieldId: field.id,
                                  locale: contentLocale,
                                  draftValue: row?.draft_value || published,
                                  action: "publish",
                                }),
                              });
                            }
                          }}
                        >
                          {t.content.publish}
                        </button>
                      </div>
                    </article>
                  );
                })}
              <div className="grid grid-cols-2 gap-2">
                <button className={`${contentLocale === "en" ? goldBtn : ghostBtn}`} type="button" onClick={() => setContentLocale("en")}>
                  {t.content.english}
                </button>
                <button className={`${contentLocale === "es" ? goldBtn : ghostBtn}`} type="button" onClick={() => setContentLocale("es")}>
                  {t.content.spanish}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-ivory/50">{t.content.pickPage}</p>
          )}
          {contentFieldId ? (
            <div className="space-y-3 border border-white/10 p-4">
              {(() => {
                const selected = contentFields.find((item) => item.id === contentFieldId) as ContentField | undefined;
                const row = contentRows.find(
                  (item) =>
                    selected &&
                    item.field === selected.field &&
                    item.page === selected.page &&
                    item.locale === contentLocale &&
                    item.section === selected.section
                );
                const oldValue = row?.published_value || defaultContentValue(selected?.dictPath || "", contentLocale);
                return (
                  <>
                    <p className="text-sm">{selected?.label[locale]}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-gold">{t.content.current}</p>
                    <p className="whitespace-pre-wrap text-sm text-ivory/70">{oldValue}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-gold">{t.content.next}</p>
                    <textarea
                      className={`${field} py-3`}
                      rows={6}
                      value={contentDraft}
                      onChange={(e) => setContentDraft(e.target.value)}
                      placeholder={t.content.placeholder}
                    />
                    {contentPreview ? (
                    <div className="space-y-2 border border-white/10 p-3 text-sm">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-gold">{t.content.livePreview}</p>
                      <p className="whitespace-pre-wrap text-ivory">{contentDraft || oldValue}</p>
                    </div>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={ghostBtn}
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void act("/api/admin/content", {
                            method: "PATCH",
                            body: JSON.stringify({
                              fieldId: contentFieldId,
                              locale: contentLocale,
                              draftValue: contentDraft,
                              action: "save",
                            }),
                          })
                        }
                      >
                        {t.content.save}
                      </button>
                      <button className={ghostBtn} type="button" onClick={() => setContentPreview((value) => !value)}>
                        {t.content.preview}
                      </button>
                      <button
                        className={goldBtn}
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(t.confirm.publishContent)) {
                            void act("/api/admin/content", {
                              method: "PATCH",
                              body: JSON.stringify({
                                fieldId: contentFieldId,
                                locale: contentLocale,
                                draftValue: contentDraft,
                                action: "publish",
                              }),
                            });
                          }
                        }}
                      >
                        {t.content.publish}
                      </button>
                      <button className={ghostBtn} type="button" onClick={() => setContentFieldId("")}>
                        {t.content.cancel}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : null}
        </div>
      ) : null}

      {section === "users" ? (
        <div className="space-y-3">
          {users.map((item) => (
            <article key={item.id} className="border border-white/10 p-4 text-sm">
              <p>{item.first_name || item.id}</p>
              <p className="text-ivory/60">
                {item.role} · {statusLabel(t, item.status)} · {item.city || "—"}
              </p>
            </article>
          ))}
          {!users.length ? <p className="text-ivory/50">{t.empty.users}</p> : null}
        </div>
      ) : null}

      {section === "settings" ? (
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.language}</p>
            <p className="mt-2 text-sm text-ivory/70">{t.settingsHint}</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {adminLocales.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${locale === item.id ? goldBtn : ghostBtn}`}
                  onClick={() => void saveLocale(item.id)}
                >
                  {item.flag} {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["introductions", "feedback", "history", "users"] as Section[]).map((item) => (
              <button key={item} type="button" className={ghostBtn} onClick={() => setSection(item)}>
                {navLabel(item)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
