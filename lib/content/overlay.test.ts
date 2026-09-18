import { describe, expect, it } from "vitest";
import { applyContentOverrides, getByPath } from "./overlay";
import { publicContentFilter, contentFields, defaultContentValue } from "./catalog";

describe("public content overlay", () => {
  it("replaces existing dictionary fields only", () => {
    const source = {
      hero: { title: "Old", lead: "Keep" },
      how: { steps: [{ title: "One", text: "A" }] },
    };
    const next = applyContentOverrides(source, {
      "hero.title": "New title",
      "how.steps.0.title": "Step",
      "missing.path": "ignored-create-ok",
    });
    expect(next.hero.title).toBe("New title");
    expect(next.hero.lead).toBe("Keep");
    expect(next.how.steps[0].title).toBe("Step");
    expect(getByPath(next, "hero.title")).toBe("New title");
  });

  it("never exposes draft rows on the public map", () => {
    const overrides = publicContentFilter([
      { dict_path: "hero.title", published_value: "Live", status: "published" },
      { dict_path: "hero.lead", published_value: "Secret", status: "draft" },
      { dict_path: "club.title", published_value: null, status: "published" },
    ]);
    expect(overrides["hero.title"]).toBe("Live");
    expect(overrides["hero.lead"]).toBeUndefined();
    expect(overrides["club.title"]).toBeUndefined();
  });

  it("covers real website fields", () => {
    expect(contentFields.some((field) => field.dictPath === "hero.title")).toBe(true);
    expect(defaultContentValue("hero.title", "en")).toContain("Tango Slavique");
    expect(defaultContentValue("form.submit", "es")).toBe("Enviar solicitud");
  });
});
