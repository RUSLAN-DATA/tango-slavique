import { describe, expect, it } from "vitest";
import { applicantSections, displayApplicantValue } from "./applicantProfileView";

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
    expect(displayApplicantValue(null)).toBe("—");
  });

  it("keeps incomplete profiles renderable", () => {
    const sections = applicantSections(undefined);
    expect(sections).toHaveLength(8);
    expect(displayApplicantValue(sections[0].fields[0].value)).toBe("—");
  });
});
