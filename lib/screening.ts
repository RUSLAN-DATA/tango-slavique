export const SCREENING_STORAGE_KEY = "tango-slavique-screening";

export type ScreeningPayload = {
  goal?: string;
  geography?: string;
  interviewReady?: boolean;
  name?: string;
  phone?: string;
  city?: string;
  lookingFor?: string;
  track?: "WOMAN" | "MAN";
};

export function readScreening(): ScreeningPayload | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(SCREENING_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScreeningPayload) : null;
  } catch {
    return null;
  }
}

export function writeScreening(payload: ScreeningPayload) {
  if (typeof window === "undefined") {
    return;
  }
  const current = readScreening() || {};
  window.sessionStorage.setItem(
    SCREENING_STORAGE_KEY,
    JSON.stringify({ ...current, ...payload })
  );
}
