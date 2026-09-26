export function whatsappMeUrl(phone: string | null | undefined, text = ""): string | null {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 8) {
    return null;
  }
  const base = `https://wa.me/${digits}`;
  const message = text.trim();
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
