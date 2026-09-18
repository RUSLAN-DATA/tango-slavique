import { describe, expect, it } from "vitest";
import { adminCopy, isAdminLocale, statusLabel } from "./adminCopy";

describe("admin panel i18n", () => {
  it("has English Spanish and Russian admin copy", () => {
    expect(isAdminLocale("en")).toBe(true);
    expect(isAdminLocale("es")).toBe(true);
    expect(isAdminLocale("ru")).toBe(true);
    expect(isAdminLocale("de")).toBe(false);
    expect(adminCopy.en.nav.dashboard).toBe("Dashboard");
    expect(adminCopy.es.nav.applications).toBe("Solicitudes");
    expect(adminCopy.ru.nav.photos).toBe("Фото");
    expect(adminCopy.ru.actions.approve).toBe("Одобрить");
  });

  it("does not translate user-generated values", () => {
    expect(statusLabel(adminCopy.en, "approved")).toBe("Approved");
    expect(statusLabel(adminCopy.ru, "Maria")).toBe("Maria");
  });
});
