import { describe, expect, it } from "vitest";
import { adminCopy, isAdminLocale, statusLabel } from "./adminCopy";
import { miniCopy } from "../../components/miniapp/copy";

describe("admin panel i18n", () => {
  it("has English Spanish and Russian admin copy", () => {
    expect(isAdminLocale("en")).toBe(true);
    expect(isAdminLocale("es")).toBe(true);
    expect(isAdminLocale("ru")).toBe(true);
    expect(isAdminLocale("de")).toBe(false);
    expect(adminCopy.en.nav.dashboard).toBe("Dashboard");
    expect(adminCopy.es.nav.applications).toBe("Solicitudes");
    expect(adminCopy.ru.nav.photos).toBe("Фотографии");
    expect(adminCopy.ru.nav.dashboard).toBe("Панель управления");
    expect(adminCopy.ru.nav.content).toBe("Контент сайта");
    expect(adminCopy.ru.actions.approve).toBe("Одобрить");
    expect(adminCopy.ru.applicant.profile).toBe("Профиль");
    expect(adminCopy.ru.applicant.lifeGoals).toBe("Цели в жизни");
    expect(adminCopy.en.applicant.hobbies).toBe("Hobbies");
    expect(adminCopy.ru.blog.new).toBe("Новый блог");
    expect(adminCopy.es.blog.unpublish).toBe("Ocultar");
    expect(adminCopy.ru.status.draft).toBe("Черновик");
    expect(adminCopy.en.filters.pending).toBe("Pending");
    expect(adminCopy.ru.filters.needInfo).toBe("Нужна информация");
    expect(adminCopy.ru.notices.markAll).toBe("Отметить все прочитанными");
    expect(adminCopy.es.blog.imageGuide).toContain("JPEG");
    expect(miniCopy.ru.noAlerts).toBe("Пока нет уведомлений.");
    expect(miniCopy.es.markRead).toBe("Marcar como leído");
  });

  it("does not translate user-generated values", () => {
    expect(statusLabel(adminCopy.en, "approved")).toBe("Approved");
    expect(statusLabel(adminCopy.ru, "Maria")).toBe("Maria");
  });

  it("translates the Mini App navigation for English Spanish and Russian", () => {
    expect(miniCopy.en.profile).toBe("My Profile");
    expect(miniCopy.ru.profile).toBe("Мой профиль");
    expect(miniCopy.ru.photos).toBe("Фотографии");
    expect(miniCopy.ru.matches).toBe("Пары");
    expect(miniCopy.ru.settings).toBe("Настройки");
    expect(miniCopy.ru.admin).toBe("Админ");
    expect(miniCopy.es.admin).toBe("Administración");
    expect(miniCopy.ru.marriage).toBe("Брак");
    expect(miniCopy.es.relationship).toBe("Una relación");
  });
});
