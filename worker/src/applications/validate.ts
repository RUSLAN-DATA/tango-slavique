export type PublicApplicationInput = {
  name: string;
  email: string;
  phone: string;
  city: string;
  message: string;
  source: string;
};

const MAX_TEXT = 500;

function asText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, max);
}

export function validateApplicationInput(
  body: Record<string, unknown>
): PublicApplicationInput | { error: string } {
  const name = asText(
    body.name ||
      body.contact ||
      [body.firstName, body.lastName]
        .filter((item) => typeof item === "string" && item.trim())
        .join(" "),
    120
  );
  const email = asText(body.email, 160);
  const phone = asText(body.phone || body.whatsapp, 40);
  const city = asText(body.city, 80);
  const message = asText(
    body.message ||
      body.details ||
      [body.applicant, body.purpose, body.goal, body.age, body.lookingFor]
        .filter((item) => typeof item === "string" && item.trim())
        .join(" · "),
    1000
  );
  const source = asText(body.source, 40) || "website";

  if (!name || (!phone && !email)) {
    return { error: "Provide a name and at least one contact method." };
  }

  return { name, email, phone, city, message, source };
}
