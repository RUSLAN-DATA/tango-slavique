import { mapPublicApplicationBody } from "@/lib/applications/mapPublicApplication";

const WORKER_URL =
  process.env.WORKER_URL ||
  process.env.NEXT_PUBLIC_WORKER_URL ||
  "https://tango-slavique-api.4507208.workers.dev";

type WorkerPayload = {
  ok?: boolean;
  data?: { id?: string; status?: string; notified?: boolean; reused?: boolean };
  error?: { code?: string; message?: string };
};

export type PublicApplicationResult =
  | {
      ok: true;
      id: string;
      status: string;
      notified: boolean;
      reused: boolean;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export async function submitPublicApplicationToWorker(
  body: Record<string, unknown>
): Promise<PublicApplicationResult> {
  const mapped = mapPublicApplicationBody(body);
  if ("error" in mapped) {
    return { ok: false, status: 400, error: mapped.error };
  }

  const workerResponse = await fetch(`${WORKER_URL}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: mapped.name,
      email: mapped.email,
      phone: mapped.phone,
      city: mapped.city,
      message: mapped.message,
      source: mapped.source,
      language: mapped.language,
      applicant: mapped.applicant,
      purpose: mapped.purpose,
    }),
  });

  const payload = (await workerResponse.json().catch(() => null)) as WorkerPayload | null;
  if (!workerResponse.ok || !payload?.ok) {
    return {
      ok: false,
      status: workerResponse.status || 502,
      error: payload?.error?.message || "Application could not be saved",
    };
  }

  return {
    ok: true,
    id: payload.data?.id || "",
    status: payload.data?.status || "new",
    notified: Boolean(payload.data?.notified),
    reused: Boolean(payload.data?.reused),
  };
}
