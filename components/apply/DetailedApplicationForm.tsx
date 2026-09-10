"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fieldClass, goldButtonClass, labelClass } from "@/components/ui/formStyles";
import { writeScreening, readScreening } from "@/lib/screening";

type ApplyTrack = "WOMAN" | "MAN";

type Draft = Record<string, string | number | boolean | null>;

function asString(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value);
}

export function DetailedApplicationForm({ track }: { track: ApplyTrack }) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const copy = t.platform.application;
  const [step, setStep] = useState(1);
  const [form, setSet] = useState<Draft>({ track, language: locale });
  const [photos, setPhotos] = useState<string[]>([]);
  const [status, setStatus] = useState("DRAFT");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");

  function setField(name: string, value: string | number | boolean | null) {
    setSet((current) => ({ ...current, [name]: value }));
  }

  useEffect(() => {
    const screening = readScreening();
    fetch("/api/account/application")
      .then(async (response) => {
        if (response.status === 403) {
          router.replace("/verify-email");
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (!data?.application) {
          return;
        }
        const application = data.application as Record<string, unknown>;
        const preferences = (data.preferences || {}) as Record<string, unknown>;
        setEmail(data.email || "");
        setStatus(String(application.status || "DRAFT"));
        setStep(Number(application.currentStep) || 1);
        setPhotos(
          Array.isArray(application.photos)
            ? application.photos.map((photo: { id: string }) => photo.id)
            : []
        );
        setSet({
          track,
          language: locale,
          firstName: asString(application.firstName) || screening?.name?.split(" ")[0] || "",
          lastName: asString(application.lastName) || screening?.name?.split(" ").slice(1).join(" ") || "",
          phone: asString(application.phone) || screening?.phone || "",
          dateOfBirth: asString(application.dateOfBirth).slice(0, 10),
          city: asString(application.city) || screening?.city || "",
          country: asString(application.country),
          quizGoal: asString(application.quizGoal) || screening?.goal || "",
          quizGeography: asString(application.quizGeography) || screening?.geography || "",
          quizInterviewReady: Boolean(application.quizInterviewReady || screening?.interviewReady),
          lookingFor: asString(application.lookingFor) || screening?.lookingFor || "",
          heightCm: application.heightCm as number | null,
          weightKg: application.weightKg as number | null,
          bodyType: asString(application.bodyType),
          hairColor: asString(application.hairColor),
          eyeColor: asString(application.eyeColor),
          nationality: asString(application.nationality),
          maritalStatus: asString(application.maritalStatus),
          religion: asString(application.religion),
          education: asString(application.education),
          profession: asString(application.profession),
          annualIncome: asString(application.annualIncome),
          languages: asString(application.languages),
          smoking: asString(application.smoking),
          alcohol: asString(application.alcohol),
          children: asString(application.children),
          wantsChildren: asString(application.wantsChildren),
          aboutMe: asString(application.aboutMe),
          hobbies: asString(application.hobbies),
          lifeGoals: asString(application.lifeGoals),
          relationshipExperience: asString(application.relationshipExperience),
          instagram: asString(application.instagram),
          telegramHandle: asString(application.telegramHandle),
          howHeard: asString(application.howHeard),
          preferredAgeMin: preferences.preferredAgeMin as number | null,
          preferredAgeMax: preferences.preferredAgeMax as number | null,
          preferredHeightMin: preferences.preferredHeightMin as number | null,
          preferredHeightMax: preferences.preferredHeightMax as number | null,
          preferredBodyType: asString(preferences.preferredBodyType),
          minimumEducation: asString(preferences.minimumEducation),
          importantQualities: asString(preferences.importantQualities),
          dealBreakers: asString(preferences.dealBreakers),
          privacyAccepted: Boolean(application.privacyAcceptedAt),
          termsAccepted: Boolean(application.termsAcceptedAt),
        });
      })
      .catch(() => undefined);
  }, [locale, router, track]);

  const locked = status !== "DRAFT" && status !== "NEEDS_MORE_INFO";

  const payload = useMemo(
    () => ({
      ...form,
      track,
      language: locale,
      currentStep: step,
      heightCm: form.heightCm ? Number(form.heightCm) : null,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      preferredAgeMin: form.preferredAgeMin ? Number(form.preferredAgeMin) : null,
      preferredAgeMax: form.preferredAgeMax ? Number(form.preferredAgeMax) : null,
      preferredHeightMin: form.preferredHeightMin ? Number(form.preferredHeightMin) : null,
      preferredHeightMax: form.preferredHeightMax ? Number(form.preferredHeightMax) : null,
    }),
    [form, locale, step, track]
  );

  async function save(nextStep = step) {
    if (locked) {
      return;
    }
    setSaving(true);
    setMessage("");
    await fetch("/api/account/application", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, currentStep: nextStep }),
    });
    setSaving(false);
    setMessage(copy.saved);
  }

  async function go(nextStep: number) {
    await save(nextStep);
    setStep(nextStep);
    writeScreening({ track });
  }

  async function uploadPhoto(file: File) {
    const data = new FormData();
    data.append("file", file);
    const response = await fetch("/api/account/photos", { method: "POST", body: data });
    const json = (await response.json()) as { id?: string };
    if (json.id) {
      setPhotos((current) => [...current, json.id!]);
    }
  }

  async function submit() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/account/application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, privacyAccepted: true, termsAccepted: true }),
    });
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setMessage(data.error === "PHOTO_REQUIRED" ? copy.needPhoto : t.form.submitError);
      return;
    }
    router.push("/account/application");
  }

  function Field({
    name,
    label,
    type = "text",
    textarea = false,
  }: {
    name: string;
    label: string;
    type?: string;
    textarea?: boolean;
  }) {
    return (
      <label className="block">
        <span className={labelClass}>{label}</span>
        {textarea ? (
          <textarea
            disabled={locked}
            rows={5}
            value={asString(form[name])}
            onChange={(event) => setField(name, event.target.value)}
            className={fieldClass}
          />
        ) : (
          <input
            disabled={locked}
            type={type}
            value={asString(form[name])}
            onChange={(event) => setField(name, event.target.value)}
            className={fieldClass}
          />
        )}
      </label>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <p className="font-display text-2xl text-gold/70">
          {copy.step} {step} {copy.of} 7
        </p>
        <p className="text-[11px] uppercase tracking-[0.16em] text-ivory/45">
          {copy.steps[step - 1]}
        </p>
      </div>
      <div className="relative mb-10 h-px overflow-hidden bg-white/[0.06]">
        <div className="absolute inset-y-0 left-0 bg-gold" style={{ width: `${(step / 7) * 100}%` }} />
      </div>

      <div className="space-y-5">
        {step === 1 ? (
          <>
            <Field name="firstName" label={copy.firstName} />
            <Field name="lastName" label={copy.lastName} />
            <label className="block">
              <span className={labelClass}>{copy.email}</span>
              <input disabled value={email} className={fieldClass} />
            </label>
            <Field name="phone" label={copy.phone} type="tel" />
            <Field name="dateOfBirth" label={copy.dob} type="date" />
            <Field name="city" label={copy.city} />
            <Field name="country" label={copy.country} />
            <div>
              <span className={labelClass}>{copy.photo}</span>
              <p className="mb-3 text-sm font-light text-ivory-muted">{t.platform.account.photoPrivate}</p>
              <input
                disabled={locked}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadPhoto(file);
                  }
                }}
                className="text-sm text-ivory/70"
              />
              <p className="mt-2 text-xs text-gold">{photos.length} {copy.photo.toLowerCase()}</p>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Field name="heightCm" label={copy.height} type="number" />
            <Field name="weightKg" label={copy.weight} type="number" />
            <Field name="bodyType" label={copy.bodyType} />
            <Field name="hairColor" label={copy.hair} />
            <Field name="eyeColor" label={copy.eyes} />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Field name="nationality" label={copy.nationality} />
            <Field name="maritalStatus" label={copy.marital} />
            <Field name="religion" label={copy.religion} />
            <Field name="education" label={copy.education} />
            <Field name="profession" label={copy.profession} />
            <Field name="annualIncome" label={copy.income} />
            <Field name="languages" label={copy.languages} />
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Field name="smoking" label={copy.smoking} />
            <Field name="alcohol" label={copy.alcohol} />
            <Field name="children" label={copy.children} />
            <Field name="wantsChildren" label={copy.wantsChildren} />
          </>
        ) : null}

        {step === 5 ? (
          <>
            <Field name="aboutMe" label={copy.about} textarea />
            <Field name="hobbies" label={copy.hobbies} textarea />
            <Field name="lifeGoals" label={copy.goals} textarea />
            <Field name="relationshipExperience" label={copy.experience} textarea />
          </>
        ) : null}

        {step === 6 ? (
          <>
            <Field name="preferredAgeMin" label={copy.ageMin} type="number" />
            <Field name="preferredAgeMax" label={copy.ageMax} type="number" />
            <Field name="preferredHeightMin" label={copy.heightMin} type="number" />
            <Field name="preferredHeightMax" label={copy.heightMax} type="number" />
            <Field name="preferredBodyType" label={copy.prefBody} />
            <Field name="minimumEducation" label={copy.minEducation} />
            <Field name="importantQualities" label={copy.qualities} textarea />
            <Field name="dealBreakers" label={copy.dealBreakers} textarea />
          </>
        ) : null}

        {step === 7 ? (
          <>
            <Field name="instagram" label={copy.instagram} />
            <Field name="telegramHandle" label={copy.telegram} />
            <Field name="howHeard" label={copy.heard} />
            <label className="flex items-start gap-3 text-sm font-light text-ivory-muted">
              <input
                type="checkbox"
                disabled={locked}
                checked={Boolean(form.privacyAccepted)}
                onChange={(event) => setField("privacyAccepted", event.target.checked)}
                className="mt-1 accent-amber-500"
              />
              {copy.privacy}
            </label>
            <label className="flex items-start gap-3 text-sm font-light text-ivory-muted">
              <input
                type="checkbox"
                disabled={locked}
                checked={Boolean(form.termsAccepted)}
                onChange={(event) => setField("termsAccepted", event.target.checked)}
                className="mt-1 accent-amber-500"
              />
              {copy.terms}
            </label>
          </>
        ) : null}
      </div>

      {message ? <p className="mt-6 text-sm text-gold">{message}</p> : null}

      <div className="mt-10 flex flex-wrap gap-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => void go(step - 1)}
            className="text-[11px] uppercase tracking-[0.16em] text-ivory/45 hover:text-gold"
          >
            {copy.back}
          </button>
        ) : null}
        <button
          type="button"
          disabled={saving || locked}
          onClick={() => void save(step)}
          className="text-[11px] uppercase tracking-[0.16em] text-gold"
        >
          {copy.save}
        </button>
        {step < 7 ? (
          <button
            type="button"
            disabled={saving || locked}
            onClick={() => void go(step + 1)}
            className={goldButtonClass}
          >
            {copy.next}
          </button>
        ) : (
          <button
            type="button"
            disabled={saving || locked || !form.privacyAccepted || !form.termsAccepted}
            onClick={() => void submit()}
            className={goldButtonClass}
          >
            {copy.submit}
          </button>
        )}
      </div>
      <a href="/account" className="mt-6 inline-block text-[11px] uppercase tracking-[0.16em] text-ivory/40">
        {copy.continueLater}
      </a>
    </div>
  );
}
