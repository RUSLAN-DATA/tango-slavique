import { describe, expect, it } from "vitest";
import { bearerHeaders } from "@/lib/auth/workerSession";
import {
  mapWizardToPreferencesPatch,
  mapWizardToProfilePatch,
  photoRequiredFromWorker,
  reconstructWizardState,
  wizardStatusFromProfile,
  workerPatchSendsBearer,
} from "./wizardDraft";

describe("website wizard mapping", () => {
  it("maps profile PATCH fields including details merge keys", () => {
    const patch = mapWizardToProfilePatch({
      firstName: "Elena",
      lastName: "R",
      phone: "+34600000000",
      dateOfBirth: "1994-02-02",
      city: "Madrid",
      country: "Spain",
      track: "WOMAN",
      heightCm: 170,
      weightKg: 58,
      bodyType: "slim",
      aboutMe: "A".repeat(4000),
      currentStep: 5,
      privacyAccepted: true,
      termsAccepted: true,
      smoking: "no",
      quizGoal: "marriage",
    });
    expect(patch.first_name).toBe("Elena");
    expect(patch.gender).toBe("woman");
    expect(patch.height).toBe(170);
    expect(patch.about).toHaveLength(4000);
    expect(patch.current_step).toBe(5);
    expect(patch.privacy_accepted).toBe(true);
    expect(patch.details).toMatchObject({ weightKg: 58, smoking: "no", quizGoal: "marriage" });
  });

  it("maps preferences PATCH including Mini App-compatible fields", () => {
    const patch = mapWizardToPreferencesPatch({
      preferredAgeMin: 28,
      preferredAgeMax: 45,
      lookingFor: "man",
      intent: "marriage",
      preferredHeightMin: 175,
      dealBreakers: "smoking",
    });
    expect(patch).toMatchObject({
      age_min: 28,
      age_max: 45,
      gender: "man",
      intent: "marriage",
      details: {
        preferredHeightMin: 175,
        dealBreakers: "smoking",
      },
    });
  });

  it("reconstructs wizard state from Worker payloads", () => {
    const state = reconstructWizardState({
      me: { email: "elena@example.com", phone: "+34600" },
      profile: {
        first_name: "Elena",
        gender: "woman",
        city: "Madrid",
        about: "Hello",
        current_step: 3,
        status: "draft",
        details: { nationality: "ES", smoking: "no" },
        privacy_accepted_at: "2026-09-22T00:00:00.000Z",
      },
      preferences: {
        gender: "man",
        age_min: 30,
        intent: "marriage",
        details: { dealBreakers: "smoking" },
      },
      photos: [{ id: "photo1" }],
    });
    expect(state.email).toBe("elena@example.com");
    expect(state.application).toMatchObject({
      firstName: "Elena",
      city: "Madrid",
      nationality: "ES",
      smoking: "no",
      currentStep: 3,
      status: "DRAFT",
      track: "WOMAN",
      lookingFor: "man",
    });
    expect(state.application.photos).toEqual([{ id: "photo1" }]);
    expect(state.preferences.dealBreakers).toBe("smoking");
    expect(state.preferences.intent).toBe("marriage");
  });

  it("preserves PHOTO_REQUIRED", () => {
    expect(photoRequiredFromWorker({ code: "PHOTO_REQUIRED", message: "x" })).toBe(true);
    expect(photoRequiredFromWorker({ code: "VALIDATION_ERROR", message: "Please add at least one photo." })).toBe(true);
    expect(wizardStatusFromProfile("pending")).toBe("SUBMITTED");
  });

  it("profile and preferences proxies send Bearer", () => {
    expect(workerPatchSendsBearer(bearerHeaders("abc"))).toBe(true);
    expect(workerPatchSendsBearer(new Headers())).toBe(false);
  });
});
