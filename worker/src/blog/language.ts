export type SiteLocale = "en" | "es";

const SPANISH_HINTS =
  /\b(el|la|los|las|un|una|y|de|que|para|con|por|como|más|está|esta|este|hoy|amor|mujer|hombre|relación)\b/i;
const ENGLISH_HINTS =
  /\b(the|and|for|with|this|that|from|your|about|love|woman|man|relationship|today)\b/i;

export function detectLocale(text: string): SiteLocale | "unknown" {
  const value = text.trim();
  if (!value) {
    return "unknown";
  }
  const hasSpanishChars = /[áéíóúñü¿¡]/i.test(value);
  const es = (value.match(SPANISH_HINTS) || []).length + (hasSpanishChars ? 2 : 0);
  const en = (value.match(ENGLISH_HINTS) || []).length;
  if (es >= en + 1 && es > 0) {
    return "es";
  }
  if (en >= es + 1 && en > 0) {
    return "en";
  }
  if (hasSpanishChars) {
    return "es";
  }
  if (/^[a-z0-9\s.,!?'"“”:-]+$/i.test(value) && en + es === 0) {
    return "en";
  }
  return "unknown";
}

export function otherLocale(locale: SiteLocale): SiteLocale {
  return locale === "en" ? "es" : "en";
}
