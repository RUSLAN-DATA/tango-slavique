import { describe, expect, it } from "vitest";
import { applicantFromRecords } from "./adminView";
import type { ApplicationRow } from "./service";

const application: ApplicationRow = {
  id: "e16d895220494a0c",
  user_id: "ab1b6ee1a38140cf",
  name: "Ruslan",
  email: "4507208@gmail.com",
  phone: "+4917641577090",
  city: "Barcelona",
  message: "",
  source: "website",
  status: "new",
  created_at: "2026-09-22T12:39:54.637Z",
  updated_at: "2026-09-22T12:39:54.637Z",
};

describe("admin application view", () => {
  it("decodes profiles.details and partner_preferences.details", () => {
    const applicant = applicantFromRecords({
      application,
      user: { email: "4507208@gmail.com", phone: "+4917641577090" },
      profile: {
        first_name: "Ruslan",
        last_name: "Shairakhmetov",
        gender: "man",
        city: "Barcelona",
        country: "Spain",
        height: 182,
        hobbies: "sailing",
        about: "I host long dinners",
        marital_status: "single",
        education: "master",
        occupation: "founder",
        languages: "EN, RU",
        children: "none",
        details: JSON.stringify({
          weightKg: 78,
          bodyType: "athletic",
          hairColor: "dark",
          eyeColor: "brown",
          nationality: "KZ",
          religion: "none",
          annualIncome: "120k",
          smoking: "no",
          alcohol: "occasionally",
          wantsChildren: "yes",
          lifeGoals: "Build a house by the sea",
          relationshipExperience: "Two long relationships",
          instagram: "@ruslan",
          telegramHandle: "@ruslan_ts",
          howHeard: "friend",
          quizGoal: "marriage",
          quizGeography: "Europe",
          quizInterviewReady: true,
          lookingFor: "woman",
        }),
      },
      preferences: {
        gender: "woman",
        age_min: 28,
        age_max: 42,
        intent: "marriage",
        details: {
          preferredHeightMin: 160,
          preferredHeightMax: 175,
          preferredBodyType: "slim",
          minimumEducation: "bachelor",
          importantQualities: "kindness",
          dealBreakers: "smoking",
        },
      },
    });

    expect(applicant.basic).toMatchObject({
      firstName: "Ruslan",
      lastName: "Shairakhmetov",
      email: "4507208@gmail.com",
      phone: "+4917641577090",
      gender: "man",
      city: "Barcelona",
      country: "Spain",
      nationality: "KZ",
    });
    expect(applicant.appearance).toMatchObject({
      height: 182,
      weight: 78,
      bodyType: "athletic",
      hairColor: "dark",
      eyeColor: "brown",
    });
    expect(applicant.about.lifeGoals).toBe("Build a house by the sea");
    expect(applicant.about.relationshipExperience).toBe("Two long relationships");
    expect(applicant.partner).toMatchObject({
      lookingFor: "woman",
      ageMin: 28,
      ageMax: 42,
      heightMin: 160,
      dealBreakers: "smoking",
      intent: "marriage",
    });
    expect(applicant.additional.instagram).toBe("@ruslan");
    expect(applicant.screening.interviewReady).toBe(true);
  });

  it("does not crash on incomplete or invalid details JSON", () => {
    const applicant = applicantFromRecords({
      application: { ...application, user_id: null, message: "Hello" },
      profile: { first_name: "Maria", details: "{" },
      preferences: null,
    });
    expect(applicant.basic.firstName).toBe("Maria");
    expect(applicant.about.aboutMe).toBe("Hello");
    expect(applicant.appearance.bodyType).toBeNull();
    expect(applicant.partner.dealBreakers).toBeNull();
    expect(applicant.screening.interviewReady).toBeNull();
  });
});
