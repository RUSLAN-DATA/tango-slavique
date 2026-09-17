"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  getSessionToken,
  setSessionToken,
  workerRequest,
  WORKER_URL,
} from "@/lib/miniapp/api";
import { miniCopy } from "@/components/miniapp/copy";
import { AdminPanel } from "@/components/miniapp/AdminPanel";
import { readClientStartContext, wantsAdminMode } from "@/lib/miniapp/startParam";

type MiniCopy = (typeof miniCopy)[keyof typeof miniCopy];
type Tab = "profile" | "photos" | "matches" | "preferences" | "alerts" | "settings" | "admin";
type Me = { id: string; role: "user" | "admin"; status: string };
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
  if (!message) return fallback || "Something went wrong. Please try again.";
  if (/validation|sql|d1|internal|unauthorized/i.test(message) && message.includes(":")) {
    return fallback || "Something went wrong. Please try again.";
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
  const { locale } = useLanguage();
  const t = miniCopy[locale] || miniCopy.en;
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

  async function uploadPhoto(file: File) {
    const body = new FormData();
    body.set("file", file);
    setBusy(true);
    const result = await workerRequest("/api/photos", { method: "POST", body });
    setBusy(false);
    if (!result.ok) {
      setError(friendly(result.error?.message, t.needPhoto));
      return;
    }
    setError("");
    await refresh();
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
          <AdminPanel startParam={startParam} onExit={() => { setAdminMode(false); setTab("profile"); }} />
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-28">
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
            onSave={save}
            onPrefs={savePrefs}
            onUpload={uploadPhoto}
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
              {t.addPhoto}
              <input className="hidden" type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPhoto(file);
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
              <button key={key} type="button" className={`${cardBtn} ${preferences.intent === key ? "border-gold text-gold" : ""}`} onClick={() => void savePrefs({ ...preferences, intent: key })}>
                {t[key]}
              </button>
            ))}
          </div>
        ) : null}

        {tab === "alerts" ? (
          alerts.length ? alerts.map((item) => (
            <article key={item.id} className="border border-white/10 p-3 text-sm text-ivory/70">{item.type === "application_new" ? t.submitted : item.type}</article>
          )) : <p className="text-ivory/60">{t.submitted}</p>
        ) : null}

        {tab === "settings" ? (
          <div className="space-y-4 text-ivory/70">
            <p>{String(profile.first_name || me.id.slice(0, 6))}</p>
            <button className={ghostBtn} type="button" onClick={() => { setSessionToken(null); setMe(null); setAdminMode(false); }}>{t.signOut}</button>
          </div>
        ) : null}
      </main>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-3 gap-1 border-t border-white/10 bg-[#070709] px-2 py-2 md:grid-cols-6">
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
  onSave: (patch: Record<string, unknown>) => Promise<boolean>;
  onPrefs: (patch: Record<string, unknown>) => Promise<boolean>;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSubmit: () => Promise<void>;
}) {
  const titles = [t.stepName, t.stepAge, t.stepPlace, t.stepAbout, t.stepLooking, t.stepPhotos, t.stepReview];
  return (
    <section className="space-y-5">
      <p className="text-xs uppercase tracking-[0.16em] text-ivory/40">{step} / 7</p>
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
          <label className={`${ghostBtn} block cursor-pointer text-center leading-[3rem]`}>
            {t.addPhoto}
            <input className="hidden" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void onUpload(file); }} />
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
        <button key={key} type="button" className={`${cardBtn} ${intent === key ? "border-gold text-gold" : ""}`} onClick={() => setIntent(key)}>{t[key]}</button>
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
