import { describe, expect, it } from "vitest";
import { whatsappMeUrl } from "./whatsapp";

describe("whatsappMeUrl", () => {
  it("builds a wa.me link from a European number", () => {
    expect(whatsappMeUrl("+34 911 000 022", "Please add two more photos.")).toBe(
      "https://wa.me/34911000022?text=Please%20add%20two%20more%20photos."
    );
  });

  it("returns null without a usable number", () => {
    expect(whatsappMeUrl("")).toBeNull();
    expect(whatsappMeUrl("12")).toBeNull();
  });
});
