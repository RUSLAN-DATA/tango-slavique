import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { adminCopy } from "./adminCopy";
import {
  applicantFromProfileRecord,
  applicantSections,
  applicationMetaSection,
  displayApplicantValue,
} from "./applicantProfileView";
import { ApplicantQuestionnaire } from "../../components/miniapp/ApplicantQuestionnaire";

const qaApplicant = {
  basic: {
    firstName: "QA Ruslan",
    lastName: "Admin Test",
    email: "qa.ruslan.admin.test.20260922@example.invalid",
    phone: "+34911000022",
    dateOfBirth: "1990-05-15",
    gender: "man",
    city: "Barcelona",
    country: "Spain",
    nationality: "Kazakhstan",
  },
  appearance: {
    height: 182,
    weight: 80,
    bodyType: "athletic",
    hairColor: "brown",
    eyeColor: "green",
  },
  personal: {
    maritalStatus: "single",
    religion: "none",
    education: "university",
    profession: "QA Engineer",
    annualIncome: "50000",
    languages: "Russian, German, English",
  },
  lifestyle: {
    smoking: "no",
    alcohol: "occasionally",
    children: "no",
    wantsChildren: "yes",
  },
  about: {
    aboutMe: "QA TEST ABOUT ME",
    hobbies: "QA TEST HOBBIES",
    lifeGoals: "QA TEST LIFE GOALS",
    relationshipExperience: "QA TEST RELATIONSHIP EXPERIENCE",
  },
  partner: {
    lookingFor: "woman",
    intent: "relationship",
    ageMin: 25,
    ageMax: 40,
    heightMin: 160,
    heightMax: 185,
    bodyType: "any",
    minimumEducation: "university",
    importantQualities: "QA TEST QUALITIES",
    dealBreakers: "QA TEST DEAL BREAKERS",
  },
  additional: {
    instagram: "qa_test_instagram",
    telegram: "qa_test_telegram",
    howHeard: "QA TEST SOURCE",
  },
  screening: {
    quizGoal: "QA TEST GOAL",
    quizGeography: "QA TEST GEOGRAPHY",
    interviewReady: true,
  },
};

describe("admin applicant profile view", () => {
  it("exposes questionnaire values without database keys", () => {
    const sections = applicantSections({
      basic: { firstName: "Ruslan", city: "Barcelona", gender: "man", lastName: "Shairakhmetov" },
      about: {
        hobbies: "sailing and cooking",
        lifeGoals: "Build a house by the sea",
        relationshipExperience: "Two long relationships",
      },
      partner: { ageMin: 28, ageMax: 42, dealBreakers: "smoking" },
    });
    const about = sections.find((item) => item.id === "about");
    expect(about?.fields.find((field) => field.key === "hobbies")?.value).toBe("sailing and cooking");
    expect(about?.fields.find((field) => field.key === "lifeGoals")?.value).toBe("Build a house by the sea");
    expect(about?.fields.find((field) => field.key === "relationshipExperience")?.value).toBe(
      "Two long relationships"
    );
    const partner = sections.find((item) => item.id === "partner");
    expect(partner?.fields.find((field) => field.key === "ageRange")?.value).toBe("28–42");
    expect(partner?.fields.map((field) => field.key)).toEqual([
      "lookingFor",
      "intent",
      "ageRange",
      "heightRange",
      "bodyType",
      "minimumEducation",
      "importantQualities",
      "dealBreakers",
    ]);
    expect(displayApplicantValue(null)).toBe("—");
  });

  it("keeps incomplete profiles renderable", () => {
    const sections = applicantSections(undefined);
    expect(sections).toHaveLength(8);
    expect(displayApplicantValue(sections[0].fields[0].value, { yes: "yes", no: "no", empty: "Не указано" })).toBe(
      "Не указано"
    );
    expect(displayApplicantValue({ secret: true }, { yes: "yes", no: "no", empty: "Не указано" })).toBe("Не указано");
    expect(displayApplicantValue("[object Object]", { yes: "yes", no: "no", empty: "Не указано" })).toBe("Не указано");
  });

  it("maps profiles.details JSON into human-readable sections", () => {
    const applicant = applicantFromProfileRecord({
      first_name: "QA Ruslan",
      last_name: "Admin Test",
      city: "Barcelona",
      country: "Spain",
      height: 182,
      occupation: "QA Engineer",
      hobbies: "QA TEST HOBBIES",
      about: "QA TEST ABOUT ME",
      details: {
        weightKg: 80,
        bodyType: "athletic",
        hairColor: "brown",
        eyeColor: "green",
        nationality: "Kazakhstan",
        lifeGoals: "QA TEST LIFE GOALS",
        relationshipExperience: "QA TEST RELATIONSHIP EXPERIENCE",
      },
    });
    const sections = applicantSections(applicant);
    expect(sections.find((item) => item.id === "appearance")?.fields).toEqual(
      expect.arrayContaining([
        { key: "height", value: 182 },
        { key: "weight", value: 80 },
        { key: "bodyType", value: "athletic" },
        { key: "hairColor", value: "brown" },
        { key: "eyeColor", value: "green" },
      ])
    );
    expect(sections.find((item) => item.id === "about")?.fields.find((field) => field.key === "lifeGoals")?.value).toBe(
      "QA TEST LIFE GOALS"
    );
  });
});

describe("admin applicant questionnaire UI", () => {
  it("renders every section and distinctive QA values", () => {
    const html = renderToStaticMarkup(
      createElement(ApplicantQuestionnaire, {
        t: adminCopy.ru,
        applicant: qaApplicant,
        photos: [
          {
            id: "48a954bbbbee4f74",
            photo_status: "pending",
            review: {
              status: "REVIEW_REQUIRED",
              quality: "poor",
              face_visible: false,
              main_person_detected: false,
              issues: [{ message: "No face visible" }],
            },
          },
        ],
        application: {
          status: "new",
          source: "website",
          created_at: "2026-09-22T20:46:00.037Z",
          updated_at: "2026-09-22T20:46:00.037Z",
        },
        statusOf: (value) => value || adminCopy.ru.applicant.empty,
        renderPhoto: () => "PHOTO",
      })
    );
    expect(html).toContain("Профиль");
    expect(html).toContain("Внешность");
    expect(html).toContain("Личное");
    expect(html).toContain("Образ жизни");
    expect(html).toContain("О себе");
    expect(html).toContain("Предпочтения в партнёре");
    expect(html).toContain("Дополнительно");
    expect(html).toContain("Анкета");
    expect(html).toContain("Фотографии");
    expect(html).toContain("Проверка фото ИИ");
    expect(html).toContain("Заявка");
    expect(html).toContain("QA TEST ABOUT ME");
    expect(html).toContain("QA TEST HOBBIES");
    expect(html).toContain("QA TEST LIFE GOALS");
    expect(html).toContain("QA TEST RELATIONSHIP EXPERIENCE");
    expect(html).toContain("QA TEST QUALITIES");
    expect(html).toContain("QA TEST DEAL BREAKERS");
    expect(html).toContain("182");
    expect(html).toContain("80");
    expect(html).toContain("athletic");
    expect(html).toContain("brown");
    expect(html).toContain("green");
    expect(html).toContain("Kazakhstan");
    expect(html).toContain("QA Engineer");
    expect(html).toContain("25–40");
    expect(html).toContain("160–185");
    expect(html).toContain("university");
    expect(html).toContain("woman");
    expect(html).toContain("website");
    expect(html).toContain("PHOTO");
    expect(html).toContain("REVIEW_REQUIRED");
    expect(html).not.toContain("[object Object]");
    expect(html).not.toContain("undefined");
  });

  it("renders empty values without breaking incomplete applications", () => {
    const html = renderToStaticMarkup(
      createElement(ApplicantQuestionnaire, {
        t: adminCopy.ru,
        applicant: applicantFromProfileRecord({ first_name: "Legacy" }),
        photos: [],
        application: { status: "new", source: "miniapp" },
        statusOf: (value) => value || adminCopy.ru.applicant.empty,
        renderPhoto: () => null,
      })
    );
    expect(html).toContain("Legacy");
    expect(html).toContain("Не указано");
    expect(html).toContain(adminCopy.ru.applicant.noPhotos);
    expect(html).not.toContain("null");
    expect(html).not.toContain("[object Object]");
  });

  it("keeps application meta fields", () => {
    const section = applicationMetaSection({ status: "new", source: "website", created_at: "2026-09-22", updated_at: "2026-09-22" });
    expect(section.id).toBe("application");
    expect(section.fields.map((field) => field.key)).toEqual(["status", "source", "createdAt", "updatedAt"]);
  });
});
