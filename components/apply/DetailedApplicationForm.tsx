"use client";

import { useEffect, useRef, useState } from "react";
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

function WizardField({
  label,
  value,
  locked,
  type = "text",
  textarea = false,
  onChange,
}: {
  label: string;
  value: string;
  locked: boolean;
  type?: string;
  textarea?: boolean;
  onChange: (value: string) => void;
}) {
  const inputType = type === "number" ? "text" : type;
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {textarea ? (
        <textarea
          disabled={locked}
          rows={5}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={fieldClass}
        />
      ) : (
        <input
          disabled={locked}
          type={inputType}
          inputMode={type === "number" ? "numeric" : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={fieldClass}
        />
      )}
    </label>
  );
}

function WizardSelect({
  label,
  value,
  locked,
  placeholder,
  choices,
  onChange,
}: {
  label: string;
  value: string;
  locked: boolean;
  placeholder: string;
  choices: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select
        disabled={locked}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass} appearance-none`}
      >
        <option value="">{placeholder}</option>
        {choices.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
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
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);
  const formRef = useRef(form);
  formRef.current = form;

  function setField(name: string, value: string | number | boolean | null) {
    setSet((current) => ({ ...current, [name]: value }));
  }

  useEffect(() => {
    const screening = readScreening();
    fetch("/api/account/application")
      .then(async (response) => {
        if (response.status === 401) {
          router.replace(track === "MAN" ? "/register?role=MAN" : "/register?role=WOMAN");
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (!data?.application || hydrated.current) {
          if (!hydrated.current) {
            setReady(true);
          }
          return;
        }
        hydrated.current = true;
        const application = data.application as Record<string, unknown>;
        const preferences = (data.preferences || {}) as Record<string, unknown>;
        setEmail(data.email || "");
        setStatus(String(application.status || "DRAFT"));
        if (String(application.status || "") === "SUBMITTED" || String(application.status || "") === "APPROVED") {
          setSubmitted(true);
        }
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
        setReady(true);
      })
      .catch(() => {
        setReady(true);
      });
  }, [locale, router, track]);

  const locked = status !== "DRAFT" && status !== "NEEDS_MORE_INFO";
  const options = copy as typeof copy & {
    incomplete?: string;
    choose?: string;
    bodyOptions?: Array<{ value: string; label: string }>;
    hairOptions?: Array<{ value: string; label: string }>;
    eyeOptions?: Array<{ value: string; label: string }>;
    maritalOptions?: Array<{ value: string; label: string }>;
    religionOptions?: Array<{ value: string; label: string }>;
    educationOptions?: Array<{ value: string; label: string }>;
    smokingOptions?: Array<{ value: string; label: string }>;
    alcoholOptions?: Array<{ value: string; label: string }>;
    childrenOptions?: Array<{ value: string; label: string }>;
    wantsChildrenOptions?: Array<{ value: string; label: string }>;
    prefBodyOptions?: Array<{ value: string; label: string }>;
  };

  function filled(name: string) {
    const value = formRef.current[name];
    if (typeof value === "boolean") {
      return value;
    }
    return asString(value).trim().length > 0;
  }

  function stepComplete(currentStep: number) {
    const required: Record<number, string[]> = {
      1: ["firstName", "lastName", "phone", "dateOfBirth", "city", "country"],
      2: ["heightCm", "weightKg", "bodyType", "hairColor", "eyeColor"],
      3: ["nationality", "maritalStatus", "education", "profession", "languages"],
      4: ["smoking", "alcohol", "children", "wantsChildren"],
      5: ["aboutMe", "hobbies", "lifeGoals", "relationshipExperience"],
      6: ["preferredAgeMin", "preferredAgeMax", "preferredHeightMin", "preferredHeightMax", "preferredBodyType", "minimumEducation"],
      7: ["privacyAccepted", "termsAccepted"],
    };
    if ((required[currentStep] || []).some((name) => !filled(name))) {
      return false;
    }
    if (currentStep === 1 && photos.length < 1) {
      return false;
    }
    return true;
  }

  function draftPayload(nextStep = step) {
    const current = formRef.current;
    return {
      ...current,
      track,
      language: locale,
      currentStep: nextStep,
      heightCm: current.heightCm ? Number(current.heightCm) : null,
      weightKg: current.weightKg ? Number(current.weightKg) : null,
      preferredAgeMin: current.preferredAgeMin ? Number(current.preferredAgeMin) : null,
      preferredAgeMax: current.preferredAgeMax ? Number(current.preferredAgeMax) : null,
      preferredHeightMin: current.preferredHeightMin ? Number(current.preferredHeightMin) : null,
      preferredHeightMax: current.preferredHeightMax ? Number(current.preferredHeightMax) : null,
      intent: current.intent || current.quizGoal || undefined,
    };
  }

  async function save(nextStep = step) {
    if (locked) {
      return false;
    }
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/account/application", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftPayload(nextStep)),
    });
    setSaving(false);
    if (!response.ok) {
      setMessage(t.form.submitError);
      return false;
    }
    setMessage(copy.saved);
    return true;
  }

  async function go(nextStep: number) {
    if (nextStep > step && !stepComplete(step)) {
      setMessage(options.incomplete || t.form.submitError);
      return;
    }
    const saved = await save(nextStep);
    if (!saved) {
      return;
    }
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
    if ([1, 2, 3, 4, 5, 6, 7].some((item) => !stepComplete(item))) {
      setMessage(photos.length < 1 ? copy.needPhoto : options.incomplete || t.form.submitError);
      return;
    }
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/account/application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draftPayload(step), privacyAccepted: true, termsAccepted: true }),
    });
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setMessage(data.error === "PHOTO_REQUIRED" ? copy.needPhoto : t.form.submitError);
      return;
    }
    setSubmitted(true);
    setStatus("SUBMITTED");
  }

  function setText(name: string, type: string | undefined, next: string) {
    setField(name, type === "number" && next !== "" ? Number(next) : next);
  }

  function textField(name: string, label: string, type?: string, textarea = false) {
    return (
      <WizardField
        label={label}
        value={asString(form[name])}
        locked={locked}
        type={type}
        textarea={textarea}
        onChange={(next) => setText(name, type, next)}
      />
    );
  }

  function selectField(name: string, label: string, choices?: Array<{ value: string; label: string }>) {
    return (
      <WizardSelect
        label={label}
        value={asString(form[name])}
        locked={locked}
        placeholder={options.choose || "—"}
        choices={choices || []}
        onChange={(next) => setField(name, next)}
      />
    );
  }

  return submitted || (locked && status !== "NEEDS_MORE_INFO") ? (
    <div className="mx-auto max-w-2xl space-y-5 text-center">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{copy.submitted}</p>
    </div>
  ) : !ready ? (
    <div className="mx-auto max-w-2xl">
      <p className="font-display text-2xl text-gold/70">
        {copy.step} 1 {copy.of} 7
      </p>
    </div>
  ) : (
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
            {textField("firstName", copy.firstName)}
            {textField("lastName", copy.lastName)}
            <label className="block">
              <span className={labelClass}>{copy.email}</span>
              <input disabled value={email} className={fieldClass} />
            </label>
            {textField("phone", copy.phone, "tel")}
            {textField("dateOfBirth", copy.dob, "date")}
            {textField("city", copy.city)}
            {textField("country", copy.country)}
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
            {textField("heightCm", copy.height, "number")}
            {textField("weightKg", copy.weight, "number")}
            {selectField("bodyType", copy.bodyType, options.bodyOptions)}
            {selectField("hairColor", copy.hair, options.hairOptions)}
            {selectField("eyeColor", copy.eyes, options.eyeOptions)}
          </>
        ) : null}

        {step === 3 ? (
          <>
            {textField("nationality", copy.nationality)}
            {selectField("maritalStatus", copy.marital, options.maritalOptions)}
            {selectField("religion", copy.religion, options.religionOptions)}
            {selectField("education", copy.education, options.educationOptions)}
            {textField("profession", copy.profession)}
            {textField("annualIncome", copy.income)}
            {textField("languages", copy.languages)}
          </>
        ) : null}

        {step === 4 ? (
          <>
            {selectField("smoking", copy.smoking, options.smokingOptions)}
            {selectField("alcohol", copy.alcohol, options.alcoholOptions)}
            {selectField("children", copy.children, options.childrenOptions)}
            {selectField("wantsChildren", copy.wantsChildren, options.wantsChildrenOptions)}
          </>
        ) : null}

        {step === 5 ? (
          <>
            {textField("aboutMe", copy.about, undefined, true)}
            {textField("hobbies", copy.hobbies, undefined, true)}
            {textField("lifeGoals", copy.goals, undefined, true)}
            {textField("relationshipExperience", copy.experience, undefined, true)}
          </>
        ) : null}

        {step === 6 ? (
          <>
            {textField("preferredAgeMin", copy.ageMin, "number")}
            {textField("preferredAgeMax", copy.ageMax, "number")}
            {textField("preferredHeightMin", copy.heightMin, "number")}
            {textField("preferredHeightMax", copy.heightMax, "number")}
            {selectField("preferredBodyType", copy.prefBody, options.prefBodyOptions)}
            {selectField("minimumEducation", copy.minEducation, options.educationOptions)}
            {textField("importantQualities", copy.qualities, undefined, true)}
            {textField("dealBreakers", copy.dealBreakers, undefined, true)}
          </>
        ) : null}

        {step === 7 ? (
          <>
            {textField("instagram", copy.instagram)}
            {textField("telegramHandle", copy.telegram)}
            {textField("howHeard", copy.heard)}
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
      <a
        href={track === "WOMAN" ? "/apply/women/form" : "/apply/men/form"}
        className="mt-6 inline-block text-[11px] uppercase tracking-[0.16em] text-ivory/40"
      >
        {copy.continueLater}
      </a>
    </div>
  );
}
