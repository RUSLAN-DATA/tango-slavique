function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstValue(...values: unknown[]) {
  for (const value of values) {
    const text = asString(value);
    if (text) {
      return text;
    }
  }
  return "";
}

export type MappedPublicApplication = {
  name: string;
  email: string;
  phone: string;
  city: string;
  message: string;
  source: string;
  language: string;
  applicant: string;
  purpose: string;
};

export function mapPublicApplicationBody(
  body: Record<string, unknown>
): MappedPublicApplication | { error: string } {
  const name = firstValue(
    body.contact,
    body.name,
    [asString(body.firstName), asString(body.lastName)].filter(Boolean).join(" ")
  );
  const email = firstValue(body.email).toLowerCase();
  const phone = firstValue(body.phone, body.whatsapp);
  const city = firstValue(body.city);
  const applicant = firstValue(body.applicant, body.track, body.applyTrack, body.role);
  const purpose = firstValue(body.purpose, body.goal);
  const details = firstValue(
    body.details,
    [body.age, city, body.lookingFor, body.geography, body.interviewReady]
      .map((item) => asString(item))
      .filter(Boolean)
      .join(" · ")
  );
  const message = [applicant, purpose, details].filter(Boolean).join(" · ");
  const source = firstValue(body.source) || "website";
  const language = firstValue(body.language);

  if (!name || (!phone && !email)) {
    return { error: "Provide a name and at least one contact method." };
  }
  if (email && !email.includes("@")) {
    return { error: "Provide a valid email or a phone number." };
  }

  return {
    name,
    email,
    phone,
    city,
    message,
    source,
    language,
    applicant,
    purpose,
  };
}
