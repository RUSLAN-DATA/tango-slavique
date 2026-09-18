import type { Env } from "../env";

export type AdminLocale = "en" | "es" | "ru";

export function isAdminLocale(value: string | null | undefined): value is AdminLocale {
  return value === "en" || value === "es" || value === "ru";
}

export async function localeForAdmin(env: Env, telegramUserId: string): Promise<AdminLocale> {
  const row = await env.DB.prepare(
    "SELECT admin_locale FROM users WHERE telegram_user_id = ?"
  )
    .bind(telegramUserId)
    .first<{ admin_locale: string | null }>();
  return isAdminLocale(row?.admin_locale) ? row.admin_locale : "en";
}

type BotCopy = {
  cancelled: string;
  notAllowed: string;
  blogCreate: string;
  sendPhoto: string;
  photoReceived: string;
  sendText: string;
  previewTitle: string;
  published: string;
  unpublished: string;
  deleted: string;
  editWhat: string;
  english: string;
  spanish: string;
  original: string;
  photo: string;
  back: string;
  sendEnglish: string;
  sendSpanish: string;
  sendOriginal: string;
  sendNewPhoto: string;
  listTitle: string;
  emptyBlog: string;
  newBlog: string;
  contentTitle: string;
  contentPick: string;
  sendNewValue: string;
  previewOld: string;
  previewNew: string;
  savedDraft: string;
  needPhoto: string;
  edit: string;
  preview: string;
  publish: string;
  cancel: string;
  unpublish: string;
  delete: string;
  next: string;
  public: string;
  languages: string;
  chooseReview: string;
  btnAdmin: string;
  btnApplications: string;
  btnProfiles: string;
  btnBlog: string;
  btnContent: string;
  btnNotifications: string;
  btnSettings: string;
  btnLanguage: string;
  languageSaved: string;
  needInfoAsk: string;
  needInfoSaved: string;
  noApplications: string;
  pending: string;
  approved: string;
  rejected: string;
  needsInfo: string;
  welcomeAdmin: string;
  openPanel: string;
};

const en: BotCopy = {
  cancelled: "Cancelled.",
  notAllowed: "Not allowed.",
  blogCreate: "Create Blog Post",
  sendPhoto: "Please send the photo. To keep the original image, send it as a file.",
  photoReceived: "Photo received.\nNow send the blog text.",
  sendText: "Now send the blog text.",
  previewTitle: "Blog Preview",
  published: "Blog published successfully.",
  unpublished: "Post is no longer public.",
  deleted: "Post moved to archive.",
  editWhat: "What do you want to edit?",
  english: "English",
  spanish: "Spanish",
  original: "Original text",
  photo: "Photo",
  back: "Back",
  sendEnglish: "Send the new English text.",
  sendSpanish: "Send the new Spanish text.",
  sendOriginal: "Send the new original text.",
  sendNewPhoto: "Send the new photo.",
  listTitle: "Blog",
  emptyBlog: "No posts yet.",
  newBlog: "New Blog",
  contentTitle: "Website Content",
  contentPick: "Choose a section.",
  sendNewValue: "Send the new text.",
  previewOld: "OLD",
  previewNew: "NEW",
  savedDraft: "Draft saved. Publish to show it on the website.",
  needPhoto: "Please send a JPEG, PNG or WEBP photo.",
  edit: "Edit",
  preview: "Preview",
  publish: "Publish",
  cancel: "Cancel",
  unpublish: "Unpublish",
  delete: "Delete",
  next: "Next",
  public: "Public",
  languages: "Languages",
  chooseReview: "Choose a section",
  btnAdmin: "🛠 Admin Panel",
  btnApplications: "📋 Applications",
  btnProfiles: "👤 Profiles",
  btnBlog: "📝 Blog",
  btnContent: "🌐 Website Content",
  btnNotifications: "🔔 Notifications",
  btnSettings: "⚙️ Settings",
  btnLanguage: "Language",
  languageSaved: "Language saved.",
  needInfoAsk: "Send the message to ask the applicant for more information.",
  needInfoSaved: "Asked for more information.",
  noApplications: "No applications in this list.",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  needsInfo: "Need information",
  welcomeAdmin: "Open the Admin Panel, or use the menu below.",
  openPanel: "Open Admin Panel",
};

const es: BotCopy = {
  ...en,
  cancelled: "Cancelado.",
  notAllowed: "No permitido.",
  blogCreate: "Crear una nueva publicación",
  sendPhoto: "Envíe la fotografía. Para conservar la imagen original, envíela como archivo.",
  photoReceived: "Foto recibida.\nAhora envíe el texto.",
  sendText: "Ahora envíe el texto.",
  previewTitle: "Vista previa",
  published: "Artículo publicado.",
  unpublished: "El artículo ya no es público.",
  deleted: "Artículo archivado.",
  editWhat: "¿Qué desea editar?",
  english: "Inglés",
  spanish: "Español",
  original: "Texto original",
  photo: "Foto",
  back: "Atrás",
  sendEnglish: "Envíe el nuevo texto en inglés.",
  sendSpanish: "Envíe el nuevo texto en español.",
  sendOriginal: "Envíe el nuevo texto original.",
  sendNewPhoto: "Envíe la nueva foto.",
  listTitle: "Blog",
  emptyBlog: "Aún no hay artículos.",
  newBlog: "Nuevo blog",
  contentTitle: "Contenido del sitio",
  contentPick: "Elija una sección.",
  sendNewValue: "Envíe el nuevo texto.",
  previewOld: "ANTES",
  previewNew: "NUEVO",
  savedDraft: "Borrador guardado. Publíquelo para mostrarlo en el sitio.",
  needPhoto: "Envíe una foto JPEG, PNG o WEBP.",
  edit: "Editar",
  preview: "Vista previa",
  publish: "Publicar",
  cancel: "Cancelar",
  unpublish: "Ocultar",
  delete: "Eliminar",
  next: "Siguiente",
  public: "Público",
  languages: "Idiomas",
  chooseReview: "Elija una sección",
  btnAdmin: "🛠 Panel de administración",
  btnApplications: "📋 Solicitudes",
  btnProfiles: "👤 Perfiles",
  btnBlog: "📝 Blog",
  btnContent: "🌐 Contenido del sitio",
  btnNotifications: "🔔 Avisos",
  btnSettings: "⚙️ Ajustes",
  btnLanguage: "Idioma",
  languageSaved: "Idioma guardado.",
  needInfoAsk: "Envíe el mensaje para pedir más información al solicitante.",
  needInfoSaved: "Se pidió más información.",
  noApplications: "No hay solicitudes en esta lista.",
  pending: "Pendientes",
  approved: "Aprobadas",
  rejected: "Rechazadas",
  needsInfo: "Falta información",
  welcomeAdmin: "Abra el panel de administración o use el menú.",
  openPanel: "Abrir panel",
};

const ru: BotCopy = {
  ...en,
  cancelled: "Отменено.",
  notAllowed: "Нет доступа.",
  blogCreate: "Создание нового блога",
  sendPhoto: "Отправьте фотографию. Чтобы сохранить исходное изображение, отправьте его как файл.",
  photoReceived: "Фото получено.\nТеперь отправьте текст.",
  sendText: "Теперь отправьте текст.",
  previewTitle: "Предпросмотр",
  published: "Блог опубликован.",
  unpublished: "Запись больше не на сайте.",
  deleted: "Запись в архиве.",
  editWhat: "Что изменить?",
  english: "Английский",
  spanish: "Испанский",
  original: "Исходный текст",
  photo: "Фото",
  back: "Назад",
  sendEnglish: "Отправьте новый английский текст.",
  sendSpanish: "Отправьте новый испанский текст.",
  sendOriginal: "Отправьте новый исходный текст.",
  sendNewPhoto: "Отправьте новое фото.",
  listTitle: "Блог",
  emptyBlog: "Записей пока нет.",
  newBlog: "Новый блог",
  contentTitle: "Контент сайта",
  contentPick: "Выберите раздел.",
  sendNewValue: "Отправьте новый текст.",
  previewOld: "БЫЛО",
  previewNew: "СТАНЕТ",
  savedDraft: "Черновик сохранён. Опубликуйте, чтобы показать на сайте.",
  needPhoto: "Отправьте фото JPEG, PNG или WEBP.",
  edit: "Редактировать",
  preview: "Предпросмотр",
  publish: "Опубликовать",
  cancel: "Отмена",
  unpublish: "Снять с публикации",
  delete: "Удалить",
  next: "Далее",
  public: "На сайте",
  languages: "Языки",
  chooseReview: "Выберите раздел",
  btnAdmin: "🛠 Админ-панель",
  btnApplications: "📋 Заявки",
  btnProfiles: "👤 Профили",
  btnBlog: "📝 Блог",
  btnContent: "🌐 Контент сайта",
  btnNotifications: "🔔 Уведомления",
  btnSettings: "⚙️ Настройки",
  btnLanguage: "Язык",
  languageSaved: "Язык сохранён.",
  needInfoAsk: "Отправьте сообщение с тем, что нужно уточнить у заявителя.",
  needInfoSaved: "Запрошена дополнительная информация.",
  noApplications: "В этом списке нет заявок.",
  pending: "Ожидают",
  approved: "Одобрены",
  rejected: "Отклонены",
  needsInfo: "Нужна информация",
  welcomeAdmin: "Откройте админ-панель или воспользуйтесь меню.",
  openPanel: "Открыть админ-панель",
};

export const botCopy = { en, es, ru };

export function copyFor(locale: AdminLocale): BotCopy {
  return botCopy[locale];
}

export type MenuAction =
  | "admin"
  | "applications"
  | "profiles"
  | "blog"
  | "content"
  | "notifications"
  | "settings";

export function menuActionForText(text: string): MenuAction | null {
  const value = text.trim();
  for (const locale of ["en", "es", "ru"] as AdminLocale[]) {
    const t = botCopy[locale];
    if (value === t.btnAdmin) return "admin";
    if (value === t.btnApplications) return "applications";
    if (value === t.btnProfiles) return "profiles";
    if (value === t.btnBlog) return "blog";
    if (value === t.btnContent) return "content";
    if (value === t.btnNotifications) return "notifications";
    if (value === t.btnSettings) return "settings";
  }
  return null;
}
