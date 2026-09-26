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
  needInfoWhatsappMissing: string;
  noApplications: string;
  pending: string;
  approved: string;
  rejected: string;
  needsInfo: string;
  welcomeAdmin: string;
  openPanel: string;
  syntaxHelp: string;
  profileNotFound: string;
  profileApproved: string;
  profilePrivate: string;
  profileHidden: string;
  needInfoMarked: string;
  noPhotos: string;
  noProfiles: string;
  photoNotFound: string;
  photoAdded: string;
  photoAsk: string;
  photoSavedNew: string;
  createdNamed: string;
  lookingFor: string;
  newProfile: string;
  btnOpen: string;
  btnApprove: string;
  btnReject: string;
  btnNeedInfo: string;
  btnHide: string;
  btnPhotos: string;
  btnAsk: string;
  btnUse: string;
  btnRejectPhoto: string;
  articlePublished: string;
  draftCancelled: string;
  draftNotFound: string;
  translateReady: string;
  translateFail: string;
  photoAddedProfile: string;
  inboxNothing: string;
  sendPhotoPlusText: string;
  notFound: string;
  opened: string;
  applicationLabel: string;
  mainPhoto: string;
  ready: string;
  added: string;
  nothingToAdd: string;
  userWelcome: string;
  openMiniApp: string;
  untitled: string;
};

const en: BotCopy = {
  cancelled: "Cancelled.",
  notAllowed: "Not allowed.",
  blogCreate: "Create Blog Post",
  sendPhoto: "Please send the photo as a FILE (not a compressed Telegram image).\nSize: 16:9 or 3:2 landscape, or portrait shown in full. Minimum 800px on the long side. JPEG, PNG or WEBP, up to 10 MB.",
  photoReceived: "Photo received.\nNow send the blog text.",
  sendText: "Now send the blog text. You may use:\n# Heading\n## Subheading\nNormal paragraph.\n**Bold phrase**\n- List item\n> Quote",
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
  sendOriginal: "Send the new original text. You may use:\n# Heading\n## Subheading\n**Bold phrase**\n- List\n> Quote",
  sendNewPhoto: "Send the new photo as a FILE.\nSize: 16:9 or 3:2 landscape, or portrait. Minimum 800px on the long side. JPEG, PNG or WEBP, up to 10 MB.",
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
  needInfoSaved: "Asked for more information. For website applicants send this on WhatsApp, not Telegram.",
  needInfoWhatsappMissing: "No WhatsApp number on this application. Use email or phone.",
  noApplications: "No applications in this list.",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  needsInfo: "Need information",
  welcomeAdmin: "Open the Admin Panel, or use the menu below.",
  openPanel: "Open Admin Panel",
  syntaxHelp: "# Heading\n## Subheading\nNormal paragraph.\n**Bold phrase**\n- List item\n> Quote",
  profileNotFound: "Profile not found.",
  profileApproved: "Profile approved.",
  profilePrivate: "Profile kept private.",
  profileHidden: "Profile hidden.",
  needInfoMarked: "Marked as needs a little more information.",
  noPhotos: "No photos yet.",
  noProfiles: "No profiles yet.",
  photoNotFound: "Photo not found.",
  photoAdded: "Photo added.",
  photoAsk: "Which profile should receive this photo?",
  photoSavedNew: "I saved the photo. Create a profile in Mini App first, or send: New profile Maria",
  createdNamed: "Created. Photo added.",
  lookingFor: "Looking for",
  newProfile: "NEW PROFILE",
  btnOpen: "👁 Open",
  btnApprove: "✅ Approve",
  btnReject: "❌ Reject",
  btnNeedInfo: "ℹ️ Need info",
  btnHide: "🙈 Hide",
  btnPhotos: "📸 Photos",
  btnAsk: "💬 Ask question",
  btnUse: "✅ Use",
  btnRejectPhoto: "❌ Reject",
  articlePublished: "Article published.",
  draftCancelled: "Draft cancelled.",
  draftNotFound: "Draft not found.",
  translateReady: "Translation saved.",
  translateFail: "Translation is unavailable right now. Try again shortly.",
  photoAddedProfile: "Photo added to the profile.",
  inboxNothing: "I could not find that photo.",
  sendPhotoPlusText: "Send a photo plus the article text to create a draft.",
  notFound: "Not found.",
  opened: "Opened",
  applicationLabel: "Application",
  mainPhoto: "Main photo",
  ready: "Ready",
  added: "Added",
  nothingToAdd: "Nothing to add",
  userWelcome: "Welcome to Tango Slavique. Open Mini App to create your profile.",
  openMiniApp: "Open Mini App",
  untitled: "Untitled",
};

const es: BotCopy = {
  ...en,
  cancelled: "Cancelado.",
  notAllowed: "No permitido.",
  blogCreate: "Crear una nueva publicación",
  sendPhoto: "Envíe la foto como ARCHIVO (no como imagen comprimida de Telegram).\nTamaño: 16:9 o 3:2 horizontal, o retrato completo. Mínimo 800 px en el lado largo. JPEG, PNG o WEBP, hasta 10 MB.",
  photoReceived: "Foto recibida.\nAhora envíe el texto.",
  sendText: "Ahora envíe el texto. Puede usar:\n# Título\n## Subtítulo\nPárrafo.\n**Negrita**\n- Lista\n> Cita",
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
  sendOriginal: "Envíe el nuevo texto original. Puede usar:\n# Título\n## Subtítulo\n**Negrita**\n- Lista\n> Cita",
  sendNewPhoto: "Envíe la nueva foto como ARCHIVO.\nTamaño: 16:9 o 3:2 horizontal, o retrato. Mínimo 800 px. JPEG, PNG o WEBP, hasta 10 MB.",
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
  needInfoSaved: "Se pidió más información. Para solicitudes web envíelo por WhatsApp, no por Telegram.",
  needInfoWhatsappMissing: "No hay número de WhatsApp en esta solicitud. Use el correo o el teléfono.",
  noApplications: "No hay solicitudes en esta lista.",
  pending: "Pendientes",
  approved: "Aprobadas",
  rejected: "Rechazadas",
  needsInfo: "Falta información",
  welcomeAdmin: "Abra el panel de administración o use el menú.",
  openPanel: "Abrir panel",
  syntaxHelp: "# Título\n## Subtítulo\nPárrafo.\n**Negrita**\n- Lista\n> Cita",
  profileNotFound: "Perfil no encontrado.",
  profileApproved: "Perfil aprobado.",
  profilePrivate: "El perfil permanece privado.",
  profileHidden: "Perfil oculto.",
  needInfoMarked: "Marcado como falta de información.",
  noPhotos: "Aún no hay fotos.",
  noProfiles: "Aún no hay perfiles.",
  photoNotFound: "Foto no encontrada.",
  photoAdded: "Foto añadida.",
  photoAsk: "¿A qué perfil debe ir esta foto?",
  photoSavedNew: "Guardé la foto. Cree un perfil en Mini App o envíe: New profile Maria",
  createdNamed: "Creado. Foto añadida.",
  lookingFor: "Busca",
  newProfile: "NUEVO PERFIL",
  btnOpen: "👁 Abrir",
  btnApprove: "✅ Aprobar",
  btnReject: "❌ Rechazar",
  btnNeedInfo: "ℹ️ Pedir info",
  btnHide: "🙈 Ocultar",
  btnPhotos: "📸 Fotos",
  btnAsk: "💬 Preguntar",
  btnUse: "✅ Usar",
  btnRejectPhoto: "❌ Rechazar",
  articlePublished: "Artículo publicado.",
  draftCancelled: "Borrador cancelado.",
  draftNotFound: "Borrador no encontrado.",
  translateReady: "Traducción guardada.",
  translateFail: "La traducción no está disponible ahora. Inténtelo de nuevo.",
  photoAddedProfile: "Foto añadida al perfil.",
  inboxNothing: "No encontré esa foto.",
  sendPhotoPlusText: "Envíe una foto y el texto para crear un borrador.",
  notFound: "No encontrado.",
  opened: "Abierto",
  applicationLabel: "Solicitud",
  mainPhoto: "Foto principal",
  ready: "Listo",
  added: "Añadido",
  nothingToAdd: "Nada que añadir",
  userWelcome: "Bienvenido a Tango Slavique. Abra Mini App para crear su perfil.",
  openMiniApp: "Abrir Mini App",
  untitled: "Sin título",
};

const ru: BotCopy = {
  ...en,
  cancelled: "Отменено.",
  notAllowed: "Нет доступа.",
  blogCreate: "Создание нового блога",
  sendPhoto: "Отправьте фотографию ФАЙЛОМ (не сжатым изображением Telegram).\nРазмер: 16:9 или 3:2 альбом, или портрет целиком. Минимум 800 px по длинной стороне. JPEG, PNG или WEBP, до 10 МБ.",
  photoReceived: "Фото получено.\nТеперь отправьте текст.",
  sendText: "Теперь отправьте текст. Можно так:\n# Заголовок\n## Подзаголовок\nАбзац.\n**Жирный**\n- Список\n> Цитата",
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
  sendOriginal: "Отправьте новый исходный текст. Можно так:\n# Заголовок\n## Подзаголовок\n**Жирный**\n- Список\n> Цитата",
  sendNewPhoto: "Отправьте новое фото ФАЙЛОМ.\nРазмер: 16:9 или 3:2 альбом, или портрет. Минимум 800 px. JPEG, PNG или WEBP, до 10 МБ.",
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
  needInfoSaved: "Запрошена дополнительная информация. Для заявок с сайта отправьте это в WhatsApp, не в Telegram.",
  needInfoWhatsappMissing: "В заявке нет номера WhatsApp. Используйте email или телефон.",
  noApplications: "В этом списке нет заявок.",
  pending: "Ожидают",
  approved: "Одобрены",
  rejected: "Отклонены",
  needsInfo: "Нужна информация",
  welcomeAdmin: "Откройте админ-панель или воспользуйтесь меню.",
  openPanel: "Открыть админ-панель",
  syntaxHelp: "# Заголовок\n## Подзаголовок\nАбзац.\n**Жирный**\n- Список\n> Цитата",
  profileNotFound: "Профиль не найден.",
  profileApproved: "Профиль одобрен.",
  profilePrivate: "Профиль остаётся закрытым.",
  profileHidden: "Профиль скрыт.",
  needInfoMarked: "Отмечено: нужна информация.",
  noPhotos: "Фотографий пока нет.",
  noProfiles: "Профилей пока нет.",
  photoNotFound: "Фото не найдено.",
  photoAdded: "Фото добавлено.",
  photoAsk: "Какому профилю отправить это фото?",
  photoSavedNew: "Фото сохранено. Создайте профиль в Mini App или напишите: New profile Maria",
  createdNamed: "Создано. Фото добавлено.",
  lookingFor: "Ищет",
  newProfile: "НОВЫЙ ПРОФИЛЬ",
  btnOpen: "👁 Открыть",
  btnApprove: "✅ Одобрить",
  btnReject: "❌ Отклонить",
  btnNeedInfo: "ℹ️ Нужна информация",
  btnHide: "🙈 Скрыть",
  btnPhotos: "📸 Фото",
  btnAsk: "💬 Спросить",
  btnUse: "✅ Оставить",
  btnRejectPhoto: "❌ Отклонить",
  articlePublished: "Статья опубликована.",
  draftCancelled: "Черновик отменён.",
  draftNotFound: "Черновик не найден.",
  translateReady: "Перевод сохранён.",
  translateFail: "Перевод сейчас недоступен. Попробуйте позже.",
  photoAddedProfile: "Фото добавлено в профиль.",
  inboxNothing: "Это фото не найдено.",
  sendPhotoPlusText: "Отправьте фото и текст, чтобы создать черновик.",
  notFound: "Не найдено.",
  opened: "Открыто",
  applicationLabel: "Заявка",
  mainPhoto: "Главное фото",
  ready: "Готово",
  added: "Добавлено",
  nothingToAdd: "Нечего добавить",
  userWelcome: "Добро пожаловать в Tango Slavique. Откройте Mini App, чтобы создать профиль.",
  openMiniApp: "Открыть Mini App",
  untitled: "Без названия",
};

export function localeFromTelegram(code?: string | null): AdminLocale {
  const value = (code || "").toLowerCase();
  if (value.startsWith("es")) return "es";
  if (value.startsWith("ru")) return "ru";
  return "en";
}

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
