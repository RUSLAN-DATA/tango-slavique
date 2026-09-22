import { NextRequest, NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readWorkerSessionToken, workerBff } from "@/lib/worker/bff";
import {
  mapWizardToPreferencesPatch,
  mapWizardToProfilePatch,
  photoRequiredFromWorker,
  reconstructWizardState,
  type WizardDraftInput,
} from "@/lib/applications/wizardDraft";

function unauthorized() {
  return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
}

async function persistDraft(token: string, input: WizardDraftInput) {
  const profilePatch = mapWizardToProfilePatch(input);
  const preferencesPatch = mapWizardToPreferencesPatch(input);
  const profile = await workerBff("/api/profile", token, {
    method: "PATCH",
    body: JSON.stringify(profilePatch),
  });
  if (!profile.ok) {
    return { error: profile.error?.message || "Unable to save", status: profile.status || 400 };
  }
  if (preferencesPatch) {
    const preferences = await workerBff("/api/preferences", token, {
      method: "PATCH",
      body: JSON.stringify(preferencesPatch),
    });
    if (!preferences.ok) {
      return {
        error: preferences.error?.message || "Unable to save preferences",
        status: preferences.status || 400,
      };
    }
  }
  return { ok: true as const };
}

async function loadWizard(token: string) {
  const [me, profile, preferences, photos] = await Promise.all([
    workerBff<Record<string, unknown>>("/api/me", token),
    workerBff<Record<string, unknown>>("/api/profile", token),
    workerBff<Record<string, unknown>>("/api/preferences", token),
    workerBff<{ items?: Array<{ id: string }> }>("/api/photos", token),
  ]);
  if (!me.ok) {
    return { status: me.status || 401, error: me.error?.message || "UNAUTHENTICATED" };
  }
  return {
    ok: true as const,
    ...reconstructWizardState({
      me: me.data || null,
      profile: profile.data || null,
      preferences: preferences.data || null,
      photos: photos.data?.items || [],
    }),
  };
}

export async function GET() {
  const token = readWorkerSessionToken();
  if (!token) {
    return unauthorized();
  }
  try {
    const loaded = await loadWizard(token);
    if (!("ok" in loaded) || !loaded.ok) {
      return NextResponse.json(
        { error: loaded.error || "UNAUTHENTICATED" },
        { status: loaded.status || 401 }
      );
    }
    return NextResponse.json({
      application: loaded.application,
      preferences: loaded.preferences,
      email: loaded.email,
    });
  } catch {
    return NextResponse.json({ error: "UNABLE_TO_LOAD" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const token = readWorkerSessionToken();
  if (!token) {
    return unauthorized();
  }
  try {
    const input = (await request.json()) as WizardDraftInput;
    const saved = await persistDraft(token, input);
    if (!("ok" in saved)) {
      return NextResponse.json({ error: saved.error }, { status: saved.status });
    }
    const loaded = await loadWizard(token);
    if (!("ok" in loaded) || !loaded.ok) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: true, application: loaded.application });
  } catch {
    return NextResponse.json({ error: "Unable to save" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientKey(request, "submit-app"), 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const token = readWorkerSessionToken();
  if (!token) {
    return unauthorized();
  }

  try {
    const input = (await request.json()) as WizardDraftInput;
    if (!input.privacyAccepted || !input.termsAccepted) {
      return NextResponse.json({ error: "CONSENT_REQUIRED" }, { status: 400 });
    }

    const saved = await persistDraft(token, {
      ...input,
      privacyAccepted: true,
      termsAccepted: true,
    });
    if (!("ok" in saved)) {
      return NextResponse.json({ error: saved.error }, { status: saved.status });
    }

    const submitted = await workerBff<{ submitted?: boolean }>("/api/profile/submit", token, {
      method: "POST",
      body: "{}",
    });
    if (!submitted.ok) {
      if (photoRequiredFromWorker(submitted.error)) {
        return NextResponse.json({ error: "PHOTO_REQUIRED" }, { status: 400 });
      }
      return NextResponse.json(
        { error: submitted.error?.message || "Unable to submit" },
        { status: submitted.status || 400 }
      );
    }

    const loaded = await loadWizard(token);
    return NextResponse.json({
      success: true,
      application:
        "ok" in loaded && loaded.ok
          ? { ...loaded.application, status: "SUBMITTED" }
          : { status: "SUBMITTED" },
    });
  } catch {
    return NextResponse.json({ error: "Unable to submit" }, { status: 400 });
  }
}
