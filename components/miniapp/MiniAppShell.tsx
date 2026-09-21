"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getSessionToken,
  setSessionToken,
  workerRequest,
  WORKER_URL,
} from "@/lib/miniapp/api";
import { miniCopy } from "@/components/miniapp/copy";
import { AdminPanel } from "@/components/miniapp/AdminPanel";
import { readClientStartContext, wantsAdminMode } from "@/lib/miniapp/startParam";
import { adminLocales, isAdminLocale, type AdminLocale } from "@/lib/miniapp/adminCopy";

type MiniCopy = (typeof miniCopy)[keyof typeof miniCopy];
type Tab = "profile" | "photos" | "matches" | "preferences" | "alerts" | "settings" | "admin";
type Me = { id: string; role: "user" | "admin"; status: string; adminLocale?: string };
type Photo = { id: string; status: string; is_primary?: boolean };

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initData: string;
        initDataUnsafe?: {
          start_param?: string;
          chat_type?: string;
          chat?: { id?: number; type?: string };
        };
      };
    };
  }
}

const goldBtn =
  "min-h-12 w-full bg-gold px-4 text-sm uppercase tracking-[0.14em] text-black disabled:opacity-50";
const ghostBtn =
  "min-h-12 w-full border border-white/15 px-4 text-sm uppercase tracking-[0.14em] text-ivory";
const field =
  "min-h-12 w-full border border-white/[0.08] bg-white/[0.03] px-4 text-base text-ivory outline-none";
const cardBtn =
  "min-h-14 w-full border border-white/10 px-4 py-3 text-left text-base text-ivory";

function friendly(message?: string, fallback?: string) {
  if (!message) return fallback || "";
  if (/validation|sql|d1|internal|unauthorized/i.test(message) && message.includes(":")) {
    return fallback || message;
  }
  return message;
}

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
  if (!src) return <div className={large ? "h-40 bg-white/5" : "h-20 w-20 bg-white/5"} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={large ? "h-40 w-full object-cover" : "h-20 w-20 object-cover"} />
  );
}

export function MiniAppShell() {
  const [uiLocale, setUiLocale] = useState<AdminLocale>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem("ts_admin_locale");
    return isAdminLocale(stored) ? stored : "en";
  });
  const t = miniCopy[uiLocale] || miniCopy.en;
  const [tab, setTab] = useState<Tab>("profile");
  const [step, setStep] = useState(1);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<Record<string, string | number | null>>({});
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [matches, setMatches] = useState<Array<Record<string, unknown>>>([]);
  const [alerts, setAlerts] = useState<Array<Record<string, string>>>([]);
  const [adminMode, setAdminMode] = useState(false);
  const [startParam, setStartParam] = useState("");
  const [editing, setEditing] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("");
  const submitted = String(profile.status || "") !== "draft" && Boolean(profile.first_name);

  const tabs = useMemo(() => {
    const base: { id: Tab; label: string }[] = [
      { id: "profile", label: t.profile },
      { id: "photos", label: t.photos },
      { id: "matches", label: t.matches },
      { id: "preferences", label: t.preferences },
      { id: "alerts", label: t.alerts },
      { id: "settings", label: t.settings },
    ];
    return me?.role === "admin" ? [...base, { id: "admin" as Tab, label: t.admin }] : base;
  }, [me?.role, t]);

  async function refresh() {
    const token = getSessionToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const [meRes, profileRes, prefRes, photosRes, matchesRes, notesRes] = await Promise.all([
      workerRequest<Me>("/api/me"),
      workerRequest<Record<string, string | number | null>>("/api/profile"),
      workerRequest<Record<string, string>>("/api/preferences"),
      workerRequest<{ items: Photo[] }>("/api/photos"),
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
    if (isAdminLocale(meRes.data.adminLocale)) {
      setUiLocale(meRes.data.adminLocale);
      window.localStorage.setItem("ts_admin_locale", meRes.data.adminLocale);
    }
    setProfile(profileRes.data || {});
    setPreferences(prefRes.data || {});
    setPhotos(photosRes.data?.items || []);
    setMatches(matchesRes.data?.items || []);
    setAlerts(notesRes.data?.items || []);
    if (meRes.data.role !== "admin") {
      setAdminMode(false);
    } else {
      const client = readClientStartContext();
      if (
        wantsAdminMode({
          role: meRes.data.role,
          startParam: startParam || client.startParam,
          chatType: client.chatType,
        })
      ) {
        setAdminMode(true);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    webApp?.ready();
    webApp?.expand();
    const initData = webApp?.initData || "";
    async function boot() {
      const client = readClientStartContext();
      let nextStart = client.startParam;
      let nextChat = client.chatType;
      if (initData) {
        const auth = await workerRequest<{
          token: string;
          user: Me;
          startParam?: string;
          chatType?: string;
        }>("/api/auth/telegram", {
          method: "POST",
          body: JSON.stringify({ initData }),
        });
        if (auth.ok && auth.data?.token) {
          setSessionToken(auth.data.token);
          nextStart = auth.data.startParam || nextStart;
          nextChat = auth.data.chatType || nextChat;
          setStartParam(nextStart);
          setAdminMode(
            wantsAdminMode({
              role: auth.data.user?.role,
              startParam: nextStart,
              chatType: nextChat,
            })
          );
        } else setError(friendly(auth.error?.message, t.openFromTelegram));
      }
      setStartParam(nextStart);
      await refresh();
    }
    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(patch: Record<string, unknown>) {
    setBusy(true);
    const result = await workerRequest("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setBusy(false);
    if (!result.ok) {
      setError(friendly(result.error?.message, t.network));
      return false;
    }
    setError("");
    await refresh();
    return true;
  }

  async function savePrefs(patch: Record<string, unknown>) {
    setBusy(true);
    const result = await workerRequest("/api/preferences", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setBusy(false);
    if (!result.ok) setError(friendly(result.error?.message, t.network));
    else {
      setError("");
      await refresh();
    }
    return result.ok;
  }

  async function uploadPhotos(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    for (let i = 0; i < files.length; i += 1) {
      setUploadLabel(`${t.uploading} ${i + 1}/${files.length}`);
      const body = new FormData();
      body.set("file", files[i]);
      const result = await workerRequest("/api/photos", { method: "POST", body });
      if (!result.ok) {
        setBusy(false);
        setUploadLabel("");
        setError(friendly(result.error?.message, t.needPhoto));
        return;
      }
    }
    setUploadLabel("");
    setBusy(false);
    setError("");
    await refresh();
  }

  async function uploadPhoto(file: File) {
    await uploadPhotos([file]);
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ivory/70">{t.loading}</div>;
  }
  if (!me) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="font-display text-3xl text-ivory">Tango Slavique</p>
        <p className="mt-4 text-base text-ivory/70">{error || t.openFromTelegram}</p>
      </div>
    );
  }

  const wizard = tab === "profile" && (!submitted || editing);

  if (adminMode && me.role === "admin") {
    return (
      <div className="mx-auto min-h-screen max-w-lg pb-10">
        <header className="px-5 pb-2 pt-6">
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </header>
        <main className="px-5 py-4">
          <AdminPanel
            startParam={startParam}
            locale={uiLocale}
            onLocaleChange={(next) => {
              setUiLocale(next);
              window.localStorage.setItem("ts_admin_locale", next);
            }}
            onExit={() => { setAdminMode(false); setTab("profile"); }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-[calc(9.5rem+var(--tg-safe-area-inset-bottom,env(safe-area-inset-bottom,0px)))]">
      <header className="px-5 pb-2 pt-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Tango Slavique</p>
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      </header>
      <main className="space-y-5 px-5 py-4">
        {wizard ? (
          <Wizard
            t={t}
            step={step}
            setStep={setStep}
            profile={profile}
            preferences={preferences}
            photos={photos}
            busy={busy}
            uploadLabel={uploadLabel}
            onSave={save}
            onPrefs={savePrefs}
            onUpload={uploadPhotos}
            onDelete={async (id) => {
              setBusy(true);
              await workerRequest(`/api/photos/${id}`, { method: "DELETE" });
              setBusy(false);
              await refresh();
            }}
            onSubmit={async () => {
              setBusy(true);
              const result = await workerRequest("/api/profile/submit", { method: "POST" });
              setBusy(false);
              if (!result.ok) {
                setError(friendly(result.error?.message, t.network));
                return;
              }
              setError("");
              setEditing(false);
              await refresh();
            }}
          />
        ) : null}

        {tab === "profile" && submitted && !editing ? (
          <section className="space-y-4">
            {photos[0] ? <PhotoThumb id={photos.find((p) => p.is_primary)?.id || photos[0].id} large /> : null}
            <h1 className="font-display text-3xl text-ivory">
              {String(profile.first_name || "")}
              {profile.age ? `, ${profile.age}` : ""}
            </h1>
            <p className="text-ivory/70">{String(profile.city || "")}</p>
            <p className="text-base leading-relaxed text-ivory/80">{String(profile.about || "")}</p>
            <p className="text-sm text-gold">{t.lookingFor}: {intentLabel(t, preferences.intent)}</p>
            <button className={ghostBtn} onClick={() => { setEditing(true); setStep(1); }} type="button">
              {t.edit}
            </button>
          </section>
        ) : null}

        {tab === "photos" ? (
          <section className="space-y-4">
            {photos.length ? (
              photos.map((photo) => (
                <div key={photo.id} className="flex items-center gap-3 border border-white/10 p-3">
                  <PhotoThumb id={photo.id} />
                  <div className="flex-1">
                    {photo.is_primary ? <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.mainPhoto}</p> : (
                      <button className="text-xs uppercase tracking-[0.14em] text-ivory/60" type="button" disabled={busy} onClick={async () => {
                        setBusy(true);
                        await workerRequest(`/api/photos/${photo.id}/primary`, { method: "POST" });
                        setBusy(false);
                        await refresh();
                      }}>{t.makeMain}</button>
                    )}
                  </div>
                  <button className="text-xs uppercase text-ivory/50" type="button" onClick={async () => {
                    setBusy(true);
                    await workerRequest(`/api/photos/${photo.id}`, { method: "DELETE" });
                    setBusy(false);
                    await refresh();
                  }}>{t.remove}</button>
                </div>
              ))
            ) : <p className="text-ivory/60">{t.noPhotos}</p>}
            <label className={`${ghostBtn} block cursor-pointer text-center leading-[3rem]`}>
              {uploadLabel || t.choosePhotos}
              <input className="hidden" type="file" accept="image/*" multiple onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length) void uploadPhotos(files);
                e.target.value = "";
              }} />
            </label>
            {uploadLabel ? (
              <div className="h-1.5 w-full bg-white/10">
                <div className="h-full w-2/3 animate-pulse bg-gold" />
              </div>
            ) : null}
            <label className={`${ghostBtn} block cursor-pointer text-center leading-[3rem]`}>
              {t.takePhoto}
              <input className="hidden" type="file" accept="image/*" capture="environment" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPhoto(file);
                e.target.value = "";
              }} />
            </label>
          </section>
        ) : null}

        {tab === "matches" ? (
          matches.length ? (
            <div className="space-y-4">
              {matches.map((match) => (
                <article key={String(match.id)} className="border border-white/10 p-4">
                  <p className="font-display text-2xl text-ivory">{String(match.first_name || "")}{match.age ? `, ${match.age}` : ""}</p>
                  <p className="text-ivory/60">{String(match.city || "")}</p>
                  <p className="mt-2 text-sm text-ivory/70">{String(match.about || "").slice(0, 180)}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button className={goldBtn} type="button" disabled={busy} onClick={async () => {
                      setBusy(true);
                      await workerRequest(`/api/matches/${String(match.id)}/respond`, { method: "POST", body: JSON.stringify({ response: "accept" }) });
                      setBusy(false);
                      await refresh();
                    }}>{t.interested}</button>
                    <button className={ghostBtn} type="button" disabled={busy} onClick={async () => {
                      setBusy(true);
                      await workerRequest(`/api/matches/${String(match.id)}/respond`, { method: "POST", body: JSON.stringify({ response: "decline" }) });
                      setBusy(false);
                      await refresh();
                    }}>{t.notForMe}</button>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="text-ivory/60">{t.noMatches}</p>
        ) : null}

        {tab === "preferences" ? (
          <div className="space-y-3">
            {(["relationship", "friendship", "marriage", "notSure"] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`${cardBtn} relative z-10 ${preferences.intent === key ? "border-gold text-gold" : ""}`}
                onClick={() => {
                  setPreferences((current) => ({ ...current, intent: key }));
                  void savePrefs({ intent: key });
                }}
              >
                {t[key]}
              </button>
            ))}
            <button
              className={goldBtn}
              type="button"
              disabled={busy}
              onClick={() => void savePrefs({ intent: preferences.intent })}
            >
              {t.savePrefs}
            </button>
          </div>
        ) : null}

        {tab === "alerts" ? (
          <div className="space-y-3">
            {alerts.length ? (
              <>
                <button
                  className={ghostBtn}
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await workerRequest("/api/notifications/read-all", { method: "POST" });
                    await refresh();
                    setBusy(false);
                  }}
                >
                  {t.markAll}
                </button>
                {alerts.map((item) => (
                  <article key={item.id} className="border border-white/10 p-3 text-sm text-ivory/70">
                    <p>
                      {item.type === "application_approved" || item.type === "profile_approved"
                        ? t.alertApproved
                        : item.type === "application_rejected"
                          ? t.alertRejected
                          : item.type === "application_info_requested"
                            ? t.alertInfo
                            : item.type === "match_new" || item.type === "introduction_new"
                              ? t.alertMatch
                              : item.type.startsWith("photo_")
                                ? t.alertPhoto
                                : item.type === "application_new" || item.type === "application_submitted"
                                  ? t.submitted
                                  : item.type}
                    </p>
                    <p className="mt-1 text-[10px] uppercase text-gold">{item.status === "read" ? t.read : t.unread}</p>
                    {item.status !== "read" ? (
                      <button
                        className={`${ghostBtn} mt-2`}
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          await workerRequest(`/api/notifications/${item.id}/read`, { method: "POST" });
                          await refresh();
                          setBusy(false);
                        }}
                      >
                        {t.markRead}
                      </button>
                    ) : null}
                  </article>
                ))}
              </>
            ) : (
              <p className="text-ivory/60">{t.noAlerts}</p>
            )}
          </div>
        ) : null}

        {tab === "settings" ? (
          <div className="space-y-4 text-ivory/70">
            <p>{String(profile.first_name || me.id.slice(0, 6))}</p>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.language}</p>
              <p className="mt-2 text-sm text-ivory/60">{t.languageHint}</p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {adminLocales.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={uiLocale === item.id ? goldBtn : ghostBtn}
                    onClick={async () => {
                      setUiLocale(item.id);
                      window.localStorage.setItem("ts_admin_locale", item.id);
                      await workerRequest("/api/me", {
                        method: "PATCH",
                        body: JSON.stringify({ adminLocale: item.id }),
                      });
                    }}
                  >
                    {item.flag} {item.label}
                  </button>
                ))}
              </div>
            </div>
            <button className={ghostBtn} type="button" onClick={() => { setSessionToken(null); setMe(null); setAdminMode(false); }}>{t.signOut}</button>
          </div>
        ) : null}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-1 border-t border-white/10 bg-[#070709] px-2 pt-2 pb-[max(0.5rem,var(--tg-safe-area-inset-bottom,env(safe-area-inset-bottom,0px)))] md:grid-cols-6">
        {tabs.map((item) => (
          <button key={item.id} type="button" onClick={() => {
            if (item.id === "admin") {
              setAdminMode(true);
              return;
            }
            setTab(item.id);
          }} className={`min-h-11 px-1 text-[10px] uppercase tracking-[0.08em] ${tab === item.id ? "text-gold" : "text-ivory/50"}`}>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function intentLabel(t: MiniCopy, intent?: string) {
  if (intent === "relationship") return t.relationship;
  if (intent === "friendship") return t.friendship;
  if (intent === "marriage") return t.marriage;
  if (intent === "notSure") return t.notSure;
  return intent || "—";
}

function Wizard({
  t,
  step,
  setStep,
  profile,
  preferences,
  photos,
  busy,
  uploadLabel,
  onSave,
  onPrefs,
  onUpload,
  onDelete,
  onSubmit,
}: {
  t: MiniCopy;
  step: number;
  setStep: (n: number) => void;
  profile: Record<string, string | number | null>;
  preferences: Record<string, string>;
  photos: Photo[];
  busy: boolean;
  uploadLabel: string;
  onSave: (patch: Record<string, unknown>) => Promise<boolean>;
  onPrefs: (patch: Record<string, unknown>) => Promise<boolean>;
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSubmit: () => Promise<void>;
}) {
  const titles = [t.stepName, t.stepAge, t.stepPlace, t.stepAbout, t.stepLooking, t.stepPhotos, t.stepReview];
  return (
    <section className="space-y-5">
      <p className="text-xs uppercase tracking-[0.16em] text-ivory/40">{t.stepOf} {step} {t.of} 7</p>
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
          <span key={item} className={`h-1.5 flex-1 ${item <= step ? "bg-gold" : "bg-white/10"}`} />
        ))}
      </div>
      <h1 className="font-display text-3xl text-ivory">{titles[step - 1]}</h1>
      {step === 1 ? (
        <NameStep value={String(profile.first_name || "")} onContinue={async (name) => { if (await onSave({ first_name: name })) setStep(2); }} busy={busy} t={t} />
      ) : null}
      {step === 2 ? (
        <AgeStep value={Number(profile.age || 0)} onContinue={async (age) => { if (await onSave({ age })) setStep(3); }} onBack={() => setStep(1)} busy={busy} t={t} />
      ) : null}
      {step === 3 ? (
        <PlaceStep city={String(profile.city || "")} country={String(profile.country || "")} onContinue={async (city, country) => { if (await onSave({ city, country })) setStep(4); }} onBack={() => setStep(2)} busy={busy} t={t} />
      ) : null}
      {step === 4 ? (
        <AboutStep value={String(profile.about || "")} onContinue={async (about) => { if (await onSave({ about })) setStep(5); }} onBack={() => setStep(3)} busy={busy} t={t} />
      ) : null}
      {step === 5 ? (
        <LookingStep t={t} busy={busy} current={preferences} onBack={() => setStep(4)} onContinue={async (intent, gender) => { if (await onPrefs({ ...preferences, intent, gender })) setStep(6); }} />
      ) : null}
      {step === 6 ? (
        <div className="space-y-4">
          <p className="text-ivory/60">{t.photosHint}</p>
          {photos.map((photo) => (
            <div key={photo.id} className="flex items-center justify-between gap-3">
              <PhotoThumb id={photo.id} />
              <button type="button" className="text-xs uppercase text-ivory/50" onClick={() => onDelete(photo.id)}>{t.remove}</button>
            </div>
          ))}
          {uploadLabel ? (
            <>
              <p className="text-sm text-gold">{uploadLabel}</p>
              <div className="h-1.5 w-full bg-white/10">
                <div className="h-full w-2/3 animate-pulse bg-gold" />
              </div>
            </>
          ) : null}
          <label className={`${ghostBtn} block cursor-pointer text-center leading-[3rem]`}>
            {t.choosePhotos}
            <input className="hidden" type="file" accept="image/*" multiple onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) void onUpload(files);
              e.target.value = "";
            }} />
          </label>
          <label className={`${ghostBtn} block cursor-pointer text-center leading-[3rem]`}>
            {t.takePhoto}
            <input className="hidden" type="file" accept="image/*" capture="environment" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload([file]);
              e.target.value = "";
            }} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={ghostBtn} onClick={() => setStep(5)}>{t.back}</button>
            <button type="button" className={goldBtn} disabled={busy || !photos.length} onClick={() => setStep(7)}>{t.continue}</button>
          </div>
          {!photos.length ? <p className="text-sm text-ivory/50">{t.needPhoto}</p> : null}
        </div>
      ) : null}
      {step === 7 ? (
        <div className="space-y-4">
          <p className="font-display text-2xl">{String(profile.first_name)}{profile.age ? `, ${profile.age}` : ""}</p>
          <p>{String(profile.city || "")}</p>
          <p className="text-ivory/70">{String(profile.about || "")}</p>
          <p className="text-gold">{t.lookingFor}: {intentLabel(t, preferences.intent)}</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={ghostBtn} onClick={() => setStep(6)}>{t.back}</button>
            <button type="button" className={goldBtn} disabled={busy} onClick={() => void onSubmit()}>{t.submit}</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function NameStep({ value, onContinue, busy, t }: { value: string; onContinue: (v: string) => void; busy: boolean; t: MiniCopy }) {
  const [name, setName] = useState(value);
  return (
    <form className="space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault(); if (name.trim()) onContinue(name.trim()); }}>
      <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.name} autoComplete="given-name" />
      <button className={goldBtn} disabled={busy || !name.trim()}>{t.continue}</button>
    </form>
  );
}

function AgeStep({ value, onContinue, onBack, busy, t }: { value: number; onContinue: (v: number) => void; onBack: () => void; busy: boolean; t: MiniCopy }) {
  const [age, setAge] = useState(value ? String(value) : "");
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const n = Number(age); if (n >= 18 && n <= 99) onContinue(n); }}>
      <input className={field} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, "").slice(0, 2))} placeholder={t.age} />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={ghostBtn} onClick={onBack}>{t.back}</button>
        <button className={goldBtn} disabled={busy || Number(age) < 18}>{t.continue}</button>
      </div>
    </form>
  );
}

function PlaceStep({ city, country, onContinue, onBack, busy, t }: { city: string; country: string; onContinue: (city: string, country: string) => void; onBack: () => void; busy: boolean; t: MiniCopy }) {
  const [c, setC] = useState(city);
  const [co, setCo] = useState(country || "Spain");
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (c.trim()) onContinue(c.trim(), co.trim()); }}>
      <input className={field} value={c} onChange={(e) => setC(e.target.value)} placeholder={t.city} />
      <input className={field} value={co} onChange={(e) => setCo(e.target.value)} placeholder={t.country} />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={ghostBtn} onClick={onBack}>{t.back}</button>
        <button className={goldBtn} disabled={busy || !c.trim()}>{t.continue}</button>
      </div>
    </form>
  );
}

function AboutStep({ value, onContinue, onBack, busy, t }: { value: string; onContinue: (v: string) => void; onBack: () => void; busy: boolean; t: MiniCopy }) {
  const [about, setAbout] = useState(value);
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onContinue(about.trim()); }}>
      <textarea className={`${field} py-3`} rows={5} value={about} onChange={(e) => setAbout(e.target.value)} placeholder={t.about} />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={ghostBtn} onClick={onBack}>{t.back}</button>
        <button className={goldBtn} disabled={busy}>{t.continue}</button>
      </div>
    </form>
  );
}

function LookingStep({ t, busy, current, onBack, onContinue }: { t: MiniCopy; busy: boolean; current: Record<string, string>; onBack: () => void; onContinue: (intent: string, gender: string) => void }) {
  const [intent, setIntent] = useState(current.intent || "relationship");
  const [gender, setGender] = useState(current.gender || "man");
  return (
    <div className="space-y-3">
      <p className="text-sm text-ivory/50">{t.stepLooking}</p>
      {(["relationship", "friendship", "marriage", "notSure"] as const).map((key) => (
        <button key={key} type="button" className={`${cardBtn} relative z-10 ${intent === key ? "border-gold text-gold" : ""}`} onClick={() => setIntent(key)}>{t[key]}</button>
      ))}
      <p className="pt-2 text-sm text-ivory/50">{t.stepWho}</p>
      <button type="button" className={`${cardBtn} ${gender === "man" ? "border-gold text-gold" : ""}`} onClick={() => setGender("man")}>{t.aMan}</button>
      <button type="button" className={`${cardBtn} ${gender === "woman" ? "border-gold text-gold" : ""}`} onClick={() => setGender("woman")}>{t.aWoman}</button>
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button type="button" className={ghostBtn} onClick={onBack}>{t.back}</button>
        <button type="button" className={goldBtn} disabled={busy} onClick={() => onContinue(intent, gender)}>{t.continue}</button>
      </div>
    </div>
  );
}
