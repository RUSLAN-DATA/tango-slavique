import { describe, expect, it } from "vitest";
import { mapPublicApplicationBody } from "./mapPublicApplication";

describe("mapPublicApplicationBody", () => {
  it("maps website apply fields", () => {
    const mapped = mapPublicApplicationBody({
      name: "Elena",
      phone: "+34600000000",
      city: "madrid",
      lookingFor: "man",
      source: "website",
    });
    expect(mapped).toMatchObject({
      name: "Elena",
      phone: "+34600000000",
      city: "madrid",
      source: "website",
    });
    if ("error" in mapped) {
      throw new Error(mapped.error);
    }
    expect(mapped.message).toContain("man");
  });

  it("maps account registration first/last name and email", () => {
    const mapped = mapPublicApplicationBody({
      firstName: "Regtest",
      lastName: "Cursor",
      email: "Reg.Test@example.invalid",
      password: "should-not-be-required",
      applyTrack: "WOMAN",
      source: "website",
    });
    expect(mapped).toEqual({
      name: "Regtest Cursor",
      email: "reg.test@example.invalid",
      phone: "",
      city: "",
      message: "WOMAN",
      source: "website",
      language: "",
      applicant: "WOMAN",
      purpose: "",
    });
  });

  it("rejects a name without contact details", () => {
    expect(mapPublicApplicationBody({ name: "Elena" })).toEqual({
      error: "Provide a name and at least one contact method.",
    });
  });
});
