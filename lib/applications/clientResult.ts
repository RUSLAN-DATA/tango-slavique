export type ApplicationClientResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function readApplicationResult(
  response: Response
): Promise<ApplicationClientResult> {
  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; id?: string; error?: string }
    | null;
  const error = typeof payload?.error === "string" ? payload.error.trim() : "";
  if (!response.ok || !payload?.success) {
    return { ok: false, error };
  }
  return { ok: true, id: payload.id || "" };
}
