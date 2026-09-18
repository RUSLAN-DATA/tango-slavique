export type ContentPage = "home" | "about" | "how" | "contact" | "footer";
export type SiteLocale = "en" | "es";

export type ContentField = {
  id: string;
  page: ContentPage;
  section: string;
  field: string;
  dictPath: string;
  label: { en: string; es: string; ru: string };
};

export const contentPages: {
  id: ContentPage;
  label: { en: string; es: string; ru: string };
}[] = [
  { id: "home", label: { en: "Home", es: "Inicio", ru: "Главная" } },
  { id: "about", label: { en: "About", es: "Sobre el club", ru: "О клубе" } },
  { id: "how", label: { en: "How it works", es: "Cómo funciona", ru: "Как это работает" } },
  { id: "contact", label: { en: "Contact", es: "Contacto", ru: "Контакт" } },
  { id: "footer", label: { en: "Footer", es: "Pie de página", ru: "Подвал" } },
];

export const contentFields: ContentField[] = [
  { id: "home.hero.badge", page: "home", section: "hero", field: "badge", dictPath: "hero.badge", label: { en: "Badge", es: "Etiqueta", ru: "Плашка" } },
  { id: "home.hero.title", page: "home", section: "hero", field: "title", dictPath: "hero.title", label: { en: "Title", es: "Título", ru: "Заголовок" } },
  { id: "home.hero.lead", page: "home", section: "hero", field: "lead", dictPath: "hero.lead", label: { en: "Subtitle", es: "Subtítulo", ru: "Подзаголовок" } },
  { id: "home.hero.secondary", page: "home", section: "hero", field: "secondary", dictPath: "hero.secondary", label: { en: "Secondary button", es: "Botón secundario", ru: "Вторая кнопка" } },
  { id: "home.gender.womenCta", page: "home", section: "hero", field: "womenCta", dictPath: "gender.womenCta", label: { en: "Women button", es: "Botón mujeres", ru: "Кнопка для женщин" } },
  { id: "home.gender.menCta", page: "home", section: "hero", field: "menCta", dictPath: "gender.menCta", label: { en: "Men button", es: "Botón hombres", ru: "Кнопка для мужчин" } },
  { id: "about.club.eyebrow", page: "about", section: "club", field: "eyebrow", dictPath: "club.eyebrow", label: { en: "Eyebrow", es: "Encabezado corto", ru: "Надзаголовок" } },
  { id: "about.club.title", page: "about", section: "club", field: "title", dictPath: "club.title", label: { en: "Title", es: "Título", ru: "Заголовок" } },
  { id: "about.club.description", page: "about", section: "club", field: "description", dictPath: "club.description", label: { en: "Paragraph", es: "Párrafo", ru: "Текст" } },
  { id: "how.how.eyebrow", page: "how", section: "how", field: "eyebrow", dictPath: "how.eyebrow", label: { en: "Eyebrow", es: "Encabezado corto", ru: "Надзаголовок" } },
  { id: "how.how.title", page: "how", section: "how", field: "title", dictPath: "how.title", label: { en: "Title", es: "Título", ru: "Заголовок" } },
  { id: "how.how.step1title", page: "how", section: "how", field: "step1title", dictPath: "how.steps.0.title", label: { en: "Step 1 title", es: "Paso 1 título", ru: "Шаг 1 — заголовок" } },
  { id: "how.how.step1text", page: "how", section: "how", field: "step1text", dictPath: "how.steps.0.text", label: { en: "Step 1 text", es: "Paso 1 texto", ru: "Шаг 1 — текст" } },
  { id: "how.how.step2title", page: "how", section: "how", field: "step2title", dictPath: "how.steps.1.title", label: { en: "Step 2 title", es: "Paso 2 título", ru: "Шаг 2 — заголовок" } },
  { id: "how.how.step2text", page: "how", section: "how", field: "step2text", dictPath: "how.steps.1.text", label: { en: "Step 2 text", es: "Paso 2 texto", ru: "Шаг 2 — текст" } },
  { id: "how.how.step3title", page: "how", section: "how", field: "step3title", dictPath: "how.steps.2.title", label: { en: "Step 3 title", es: "Paso 3 título", ru: "Шаг 3 — заголовок" } },
  { id: "how.how.step3text", page: "how", section: "how", field: "step3text", dictPath: "how.steps.2.text", label: { en: "Step 3 text", es: "Paso 3 texto", ru: "Шаг 3 — текст" } },
  { id: "how.how.step4title", page: "how", section: "how", field: "step4title", dictPath: "how.steps.3.title", label: { en: "Step 4 title", es: "Paso 4 título", ru: "Шаг 4 — заголовок" } },
  { id: "how.how.step4text", page: "how", section: "how", field: "step4text", dictPath: "how.steps.3.text", label: { en: "Step 4 text", es: "Paso 4 texto", ru: "Шаг 4 — текст" } },
  { id: "contact.form.eyebrow", page: "contact", section: "form", field: "eyebrow", dictPath: "form.eyebrow", label: { en: "Eyebrow", es: "Encabezado corto", ru: "Надзаголовок" } },
  { id: "contact.form.title", page: "contact", section: "form", field: "title", dictPath: "form.title", label: { en: "Title", es: "Título", ru: "Заголовок" } },
  { id: "contact.form.description", page: "contact", section: "form", field: "description", dictPath: "form.description", label: { en: "Paragraph", es: "Párrafo", ru: "Текст" } },
  { id: "contact.form.submit", page: "contact", section: "form", field: "submit", dictPath: "form.submit", label: { en: "Button", es: "Botón", ru: "Кнопка" } },
  { id: "footer.footer.tagline", page: "footer", section: "footer", field: "tagline", dictPath: "footer.tagline", label: { en: "Tagline", es: "Lema", ru: "Слоган" } },
  { id: "footer.footer.copyright", page: "footer", section: "footer", field: "copyright", dictPath: "footer.copyright", label: { en: "Copyright", es: "Copyright", ru: "Копирайт" } },
];

export function contentFieldById(id: string): ContentField | undefined {
  return contentFields.find((item) => item.id === id);
}

export function contentFieldsForPage(page: string): ContentField[] {
  return contentFields.filter((item) => item.page === page);
}

export function publicContentFilter(
  rows: Array<{ dict_path: string; published_value: string | null; status: string }>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    if (row.status === "published" && row.published_value) {
      out[row.dict_path] = row.published_value;
    }
  }
  return out;
}

/** Current public copy for editable fields, used when D1 has no published value yet. */
export const contentDefaults: Record<string, { en: string; es: string }> = {
  "hero.badge": {
    en: "Private matchmaking in Spain & Europe",
    es: "Matchmaking privado en España y Europa",
  },
  "hero.title": {
    en: "Tango Slavique — where stature meets reciprocity",
    es: "Tango Slavique — donde el estatus encuentra la correspondencia",
  },
  "hero.lead": {
    en: "Bespoke introductions, made by hand. Rigorous verification of every candidate. Complete discretion: no public profiles, no open catalogues, no chance swipes.",
    es: "Presentaciones individuales, hechas a mano. Verificación rigurosa de cada candidato. Discreción absoluta: sin perfiles públicos, sin catálogos abiertos, sin deslizamientos al azar.",
  },
  "hero.secondary": {
    en: "Discover the process",
    es: "Conocer el formato",
  },
  "gender.womenCta": { en: "I'M A WOMAN", es: "SOY MUJER" },
  "gender.menCta": { en: "I'M A MAN", es: "SOY HOMBRE" },
  "club.eyebrow": { en: "The Club", es: "El club" },
  "club.title": {
    en: "A closed circle, not another application",
    es: "Un círculo cerrado, no otra aplicación",
  },
  "club.description": {
    en: "Tango Slavique is a private matchmaking house in Barcelona and across Europe. We introduce accomplished men and women for whom taste, maturity, and a genuine intention to build a life together are non-negotiable.",
    es: "Tango Slavique es una casa de matchmaking privado en Barcelona y en toda Europa. Presentamos a hombres y mujeres de alto nivel para quienes el gusto, la madurez y la intención genuina de construir una vida en común son innegociables.",
  },
  "how.eyebrow": { en: "OUR PROCESS", es: "NUESTRO PROCESO" },
  "how.title": { en: "How It Works", es: "Cómo funciona" },
  "how.steps.0.title": { en: "Complete the Application", es: "Completa la solicitud" },
  "how.steps.0.text": {
    en: "Complete the application and pay the registration fee. For men: a €1,000 enrollment fee and the first €400 monthly payment.",
    es: "Completa la solicitud y abona la cuota de registro. Para hombres: 1.000 € de cuota de inscripción y el primer pago mensual de 400 €.",
  },
  "how.steps.1.title": { en: "Verification", es: "Verificación" },
  "how.steps.1.text": {
    en: "Our team reviews your application and contacts you",
    es: "Nuestro equipo revisa tu solicitud y se pone en contacto contigo",
  },
  "how.steps.2.title": { en: "Personalized Selection", es: "Selección Personalizada" },
  "how.steps.2.text": {
    en: "We identify compatible candidates within our private network",
    es: "Identificamos candidatos compatibles dentro de nuestra red privada",
  },
  "how.steps.3.title": { en: "Introduction", es: "Presentación" },
  "how.steps.3.text": {
    en: "We arrange the meeting and support you at every step",
    es: "Organizamos el encuentro y te acompañamos en cada paso",
  },
  "form.eyebrow": { en: "Private consultation", es: "Consulta privada" },
  "form.title": { en: "Leave an application", es: "Dejar una solicitud" },
  "form.description": {
    en: "Tell us a little about yourself. We will contact you personally — no mailing lists, no published profile.",
    es: "Cuéntenos un poco de usted. Nos pondremos en contacto de forma personal: sin listas de correo ni perfil publicado.",
  },
  "form.submit": { en: "Send application", es: "Enviar solicitud" },
  "footer.tagline": {
    en: "Exclusive matchmaking for hearts with intention",
    es: "Matchmaking exclusivo para corazones con propósito",
  },
  "footer.copyright": {
    en: "© 2026 TangoSlavique. All rights reserved.",
    es: "© 2026 TangoSlavique. Todos los derechos reservados.",
  },
};

export function defaultContentValue(dictPath: string, locale: SiteLocale): string {
  return contentDefaults[dictPath]?.[locale] || "";
}
