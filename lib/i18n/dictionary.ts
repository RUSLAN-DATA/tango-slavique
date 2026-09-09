export type Locale = "en" | "es";

export const dictionaries = {
  en: {
    meta: {
      title: "Tango Slavique — private matchmaking in Spain and Europe",
      description:
        "A closed introduction club in Barcelona and Europe: hand-selected matches, rigorous verification, and complete discretion for accomplished men and women.",
    },
    header: {
      nav: {
        club: "The Club",
        how: "How it works",
        advantages: "Advantages",
        privacy: "Discretion",
        blog: "Blog",
        contact: "Contact",
      },
      apply: "APPLY NOW",
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
    hero: {
      badge: "Private matchmaking in Spain & Europe",
      title: "Tango Slavique — where stature meets reciprocity",
      lead: "Bespoke introductions, made by hand. Rigorous verification of every candidate. Complete discretion: no public profiles, no open catalogues, no chance swipes.",
      cta: "Request a private interview",
      secondary: "Discover the process",
    },
    club: {
      eyebrow: "The Club",
      title: "A closed circle, not another application",
      description:
        "Tango Slavique is a private matchmaking house in Barcelona and across Europe. We introduce accomplished men and women for whom taste, maturity, and a genuine intention to build a life together are non-negotiable.",
      pillars: [
        {
          title: "Hand selection",
          text: "Every application is reviewed in person. We do not sell access to a feed — we search for correspondence.",
        },
        {
          title: "Verification",
          text: "Intentions, standing, and values are examined before a first meeting is ever arranged.",
        },
        {
          title: "Reciprocity",
          text: "A club for established people seeking a partner of equal calibre — without performance or accident.",
        },
      ],
    },
    philosophy: {
      eyebrow: "Philosophy",
      title: "Not dating. The search for a life companion",
      description:
        "Applications are built for endless choice. We exist for a precise introduction: when both people are ready for a serious union, and equal in standing.",
      appsLabel: "Conventional apps",
      appsTitle: "The mass market",
      clubLabel: "Tango Slavique",
      clubTitle: "A private club",
      apps: [
        {
          title: "Mass market",
          text: "An endless reel of strangers, where stature and taste dissolve into an algorithm.",
        },
        {
          title: "Swipes and bots",
          text: "Surface gestures, fabricated profiles, and conversations that lead nowhere.",
        },
        {
          title: "Lost time",
          text: "Hours in an application instead of a living meeting with someone who truly corresponds.",
        },
        {
          title: "No verification",
          text: "No one is accountable for the intentions, biography, or authenticity of the person opposite you.",
        },
      ],
      advantages: [
        {
          title: "A closed club",
          text: "A limited circle. Admission is by application, and only after a personal introduction to the team.",
        },
        {
          title: "Integrity",
          text: "We verify identity, intentions, and correspondence with the life that has been declared.",
        },
        {
          title: "Values and standing",
          text: "We match by way of life, culture, maturity, and purpose — not by a photograph.",
        },
        {
          title: "A personal curator",
          text: "One person accompanies you from interview to the arrangement of a meeting — without publicity.",
        },
      ],
    },
    how: {
      eyebrow: "OUR PROCESS",
      title: "How It Works",
      steps: [
        {
          number: "01",
          title: "Complete the Application",
          text: "Complete the application and pay the registration fee. For men: a €1,000 enrollment fee and the first €400 monthly payment.",
        },
        {
          number: "02",
          title: "Verification",
          text: "Our team reviews your application and contacts you",
        },
        {
          number: "03",
          title: "Personalized Selection",
          text: "We identify compatible candidates within our private network",
        },
        {
          number: "04",
          title: "Introduction",
          text: "We arrange the meeting and support you at every step",
        },
      ],
      metrics: [
        { value: "500+", label: "Profiles in Network" },
        { value: "12", label: "Countries" },
        { value: "87%", label: "Satisfied Clients" },
      ],
    },
    gender: {
      eyebrow: "THE APPLICATION",
      title: "Begin with intention",
      womenTitle: "Women's Application",
      womenCta: "I'M A WOMAN",
      menTitle: "Men's Application",
      menCta: "I'M A MAN",
    },
    privacy: {
      eyebrow: "Discretion and security",
      title: "Your details and photographs never appear in public",
      description:
        "Tango Slavique operates as a closed club, not a showcase. We work under strict non-disclosure and never publish member profiles on the site or on social media.",
      points: [
        {
          title: "No open catalogue",
          text: "Your photograph, name, and standing do not appear in a feed and are not indexed by search.",
        },
        {
          title: "Non-disclosure",
          text: "The team and members work under a strict duty of confidentiality.",
        },
        {
          title: "Only what is necessary",
          text: "We request what is required for a considered introduction, and we do not share information with third parties.",
        },
      ],
    },
    quiz: {
      eyebrow: "Club compatibility",
      title: "Three questions about your format",
      description:
        "A brief selection to see whether your intention aligns with Tango Slavique’s closed matchmaking.",
      profile: "Interest profile",
      fit: "You are a fit",
      transferred:
        "Your answers are already in the application below. It remains only to leave your name and WhatsApp.",
      goalLabel: "Purpose",
      geographyLabel: "Geography",
      interviewLabel: "Interview",
      stepGoal: "Your principal purpose",
      stepGeography: "Geography of your search",
      stepInterview: "Are you prepared for a private verification interview?",
      interviewHint:
        "A confidential conversation with a curator — without a published profile and without an open catalogue.",
      back: "Back",
      goalHints: {
        family: "I am seeking a partner for marriage and a shared family life.",
        longterm:
          "I am ready for a profound relationship with a horizon of years ahead.",
      },
      geographyHints: {
        spain: "Barcelona, Madrid, Valencia, Marbella, and other cities.",
        europe: "I am open to meetings in European capitals.",
        international: "The search is not confined to a single country.",
      },
      goals: {
        family: "Building a family and marriage",
        longterm: "A serious long-term partnership",
      },
      geography: {
        spain: "Spain",
        europe: "All of Europe",
        international: "International search",
      },
      interviewReady: "Yes, I am ready for a confidential conversation",
    },
    form: {
      eyebrow: "Private consultation",
      title: "Leave an application",
      description:
        "Tell us a little about yourself. We will contact you personally — no mailing lists, no published profile.",
      fromQuiz: "From the compatibility quiz",
      name: "Name",
      namePlaceholder: "How shall we address you",
      phone: "Phone / WhatsApp",
      city: "City of residence",
      cityPlaceholder: "Select a city",
      lookingFor: "Whom you seek",
      woman: "A woman",
      man: "A man",
      privacyPrefix: "I accept the ",
      privacyLink: "Privacy Policy",
      privacySuffix:
        " and consent to the confidential processing of my details.",
      submit: "Send application",
      submitError:
        "The application could not be sent. Please try again or write to us on WhatsApp.",
      successTitle: "APPLICATION RECEIVED",
      successText:
        "Discretion is our mutual pledge. Our membership committee reviews each inquiry individually. If accepted, our concierge will reach out privately via WhatsApp.",
      successReturn: "RETURN TO SITE",
      cities: {
        barcelona: "Barcelona",
        madrid: "Madrid",
        valencia: "Valencia",
        marbella: "Marbella",
        other: "Another country",
      },
    },
    apply: {
      back: "Back to Home",
      age: "Age",
      agePlaceholder: "Your age",
      cityText: "City",
      cityPlaceholder: "Barcelona, Madrid…",
      men: {
        title: "Tango Slavique Man",
        subtitle:
          "Private matchmaking, tailored introductions, complete discretion",
        termsLabel: "Membership",
        terms: "€1,000 enrollment fee + €400 monthly payment.",
        valuesTitle: "What You Get",
        values: [
          "A personal curator from first conversation to introduction.",
          "Hand screening of candidates — never a catalogue, never an algorithm.",
          "Meetings arranged in Barcelona and across Europe.",
        ],
      },
      women: {
        title: "Apply as a Tango Slavique Woman",
        status: "Complimentary Membership by Selection",
        subtitle:
          "Closed, invitation-based admission — without a fee and without a public profile.",
        valuesTitle: "What You Get",
        values: [
          "Complete anonymity: no open catalogues, no public profiles.",
          "Personal matching among verified gentlemen of the club.",
        ],
      },
    },
    footer: {
      tagline: "Exclusive matchmaking for hearts with intention",
      privacy: "Privacy",
      legal: "Legal notice",
      rights: "All rights reserved.",
      copyright: "© 2026 TangoSlavique. All rights reserved.",
      nav: {
        about: "About",
        how: "How It Works",
        stories: "Stories",
        blog: "Blog",
        faq: "FAQ",
      },
      legalLinks: {
        terms: "Terms & Conditions",
        acceptable: "Acceptable Use",
        privacy: "Privacy",
        refunds: "Refunds",
        support: "Support",
        law: "Law Enforcement",
      },
    },
    pages: {
      stories: {
        eyebrow: "Stories",
        title: "Quiet introductions, lasting unions",
        body: "Member stories are shared privately with the club. This page will present selected accounts once they have been released with consent.",
      },
      blog: {
        eyebrow: "Journal",
        title: "Notes from the house",
        body: "Essays on discretion, correspondence, and the art of a considered introduction will appear here. Until then, you are welcome to apply for a private interview.",
      },
      faq: {
        eyebrow: "FAQ",
        title: "Questions of admission",
        body: "Tango Slavique is a closed club. Admission is by application, followed by verification and a personal conversation with the team. For further questions, please write through the contact form.",
      },
      terms: {
        eyebrow: "Legal",
        title: "Terms & Conditions",
        body: "Membership is by application and is subject to verification, discretion, and the house rules of Tango Slavique. A complete agreement is provided during the private interview.",
      },
      acceptable: {
        eyebrow: "Legal",
        title: "Acceptable Use",
        body: "The club exists for sincere introductions. Misrepresentation, harassment, or any use contrary to discretion and respect is not permitted and may result in immediate exclusion.",
      },
      refunds: {
        eyebrow: "Legal",
        title: "Refunds",
        body: "Enrollment and monthly fees are confirmed during the private interview. Refund conditions, where they apply, are set out in the membership agreement provided to each resident.",
      },
      support: {
        eyebrow: "Support",
        title: "A personal reply",
        body: "For membership questions, write through the application form on the homepage. The club team replies in person — without mailing lists and without a public catalogue.",
      },
      law: {
        eyebrow: "Legal",
        title: "Law Enforcement",
        body: "Lawful requests from competent authorities may be directed through the contact form marked for legal enquiry. Tango Slavique cooperates where the law expressly requires it, while protecting the privacy of members to the fullest extent permitted.",
      },
    },
    legal: {
      privacyTitle: "Privacy policy",
      privacyP1:
        "Tango Slavique processes personal data solely to review an application, conduct verification, and arrange private meetings. We do not publish profiles, photographs, or contact details in public.",
      privacyP2:
        "Information is not shared with third parties without your consent, except where the law expressly requires it. Further details may be requested from the club team.",
      legalTitle: "Legal notice",
      legalP1: "Tango Slavique",
      legalP2: "A private matchmaking club. Barcelona / Europe.",
      legalP3:
        "Applications and legal enquiries may be addressed through the form on the homepage.",
      home: "Back to the homepage",
    },
    chat: {
      welcome:
        "Good evening. I am the personal concierge of Tango Slavique. How may I assist you with membership of the club?",
      name: "Concierge",
      dialog: "Tango Slavique concierge",
      close: "Close chat",
      open: "Open the concierge",
      closeFab: "Close the concierge",
      input: "Message to the concierge",
      placeholder: "Write a question…",
      send: "Send",
      apply: "Leave an application",
      unavailable:
        "The concierge is unavailable at the moment. Please leave an application on the page.",
      disconnected:
        "The connection was interrupted. Leave an application on the page — the club team will reply in person.",
      prompts: [
        "How is confidentiality ensured?",
        "Who may become a resident of the club?",
        "What is the format of a first meeting?",
      ],
    },
  },
  es: {
    meta: {
      title: "Tango Slavique — matchmaking privado en España y Europa",
      description:
        "Un club cerrado de presentaciones en Barcelona y Europa: selección manual, verificación rigurosa y discreción absoluta para hombres y mujeres de alto nivel.",
    },
    header: {
      nav: {
        club: "El club",
        how: "Cómo funciona",
        advantages: "Ventajas",
        privacy: "Discreción",
        blog: "Blog",
        contact: "Contacto",
      },
      apply: "SOLICITAR AHORA",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
    },
    hero: {
      badge: "Matchmaking privado en España y Europa",
      title: "Tango Slavique — donde el estatus encuentra la correspondencia",
      lead: "Presentaciones individuales, hechas a mano. Verificación rigurosa de cada candidato. Discreción absoluta: sin perfiles públicos, sin catálogos abiertos, sin deslizamientos al azar.",
      cta: "Solicitar una entrevista privada",
      secondary: "Conocer el formato",
    },
    club: {
      eyebrow: "El club",
      title: "Un círculo cerrado, no otra aplicación",
      description:
        "Tango Slavique es una casa de matchmaking privado en Barcelona y en toda Europa. Presentamos a hombres y mujeres de alto nivel para quienes el gusto, la madurez y la intención genuina de construir una vida en común son innegociables.",
      pillars: [
        {
          title: "Selección manual",
          text: "Cada solicitud se revisa en persona. No vendemos acceso a un feed: buscamos correspondencia.",
        },
        {
          title: "Verificación",
          text: "Las intenciones, el nivel y los valores se examinan antes de concertar un primer encuentro.",
        },
        {
          title: "Reciprocidad",
          text: "Un club para personas establecidas que buscan un compañero de igual calibre, sin espectáculo ni azar.",
        },
      ],
    },
    philosophy: {
      eyebrow: "Filosofía",
      title: "No es citas. La búsqueda de un compañero de vida",
      description:
        "Las aplicaciones existen para una elección infinita. Nosotros existimos para una presentación precisa: cuando ambas personas están listas para una unión seria y son iguales en nivel.",
      appsLabel: "Aplicaciones convencionales",
      appsTitle: "El mercado de masas",
      clubLabel: "Tango Slavique",
      clubTitle: "Un club privado",
      apps: [
        {
          title: "Mercado masivo",
          text: "Un reel interminable de desconocidos, donde el estatus y el gusto se disuelven en un algoritmo.",
        },
        {
          title: "Deslizamientos y bots",
          text: "Gestos superficiales, perfiles fabricados y conversaciones que no conducen a nada.",
        },
        {
          title: "Tiempo perdido",
          text: "Horas en una aplicación en lugar de un encuentro vivo con alguien que realmente corresponde.",
        },
        {
          title: "Sin verificación",
          text: "Nadie responde de las intenciones, la biografía o la autenticidad de quien tiene enfrente.",
        },
      ],
      advantages: [
        {
          title: "Un club cerrado",
          text: "Un círculo limitado. El ingreso es por solicitud, y solo después de una presentación personal con el equipo.",
        },
        {
          title: "Integridad",
          text: "Verificamos identidad, intenciones y correspondencia con el nivel de vida declarado.",
        },
        {
          title: "Valores y estatus",
          text: "Seleccionamos por modo de vida, cultura, madurez y propósito, no por una fotografía.",
        },
        {
          title: "Un curador personal",
          text: "Una sola persona le acompaña de la entrevista a la organización del encuentro, sin publicidad.",
        },
      ],
    },
    how: {
      eyebrow: "NUESTRO PROCESO",
      title: "Cómo funciona",
      steps: [
        {
          number: "01",
          title: "Completa la solicitud",
          text: "Completa la solicitud y abona la cuota de registro. Para hombres: 1.000 € de cuota de inscripción y el primer pago mensual de 400 €.",
        },
        {
          number: "02",
          title: "Verificación",
          text: "Nuestro equipo revisa tu solicitud y se pone en contacto contigo",
        },
        {
          number: "03",
          title: "Selección Personalizada",
          text: "Identificamos candidatos compatibles dentro de nuestra red privada",
        },
        {
          number: "04",
          title: "Presentación",
          text: "Organizamos el encuentro y te acompañamos en cada paso",
        },
      ],
      metrics: [
        { value: "500+", label: "Perfiles en la red" },
        { value: "12", label: "Países" },
        { value: "87%", label: "Clientes satisfechos" },
      ],
    },
    gender: {
      eyebrow: "LA SOLICITUD",
      title: "Empieza con intención",
      womenTitle: "Solicitud para Mujeres",
      womenCta: "SOY MUJER",
      menTitle: "Solicitud para Hombres",
      menCta: "SOY HOMBRE",
    },
    privacy: {
      eyebrow: "Discreción y seguridad",
      title: "Sus datos y fotografías nunca aparecen en público",
      description:
        "Tango Slavique opera como un club cerrado, no como un escaparate. Trabajamos bajo un acuerdo estricto de confidencialidad y nunca publicamos perfiles de miembros en el sitio ni en redes sociales.",
      points: [
        {
          title: "Sin catálogo abierto",
          text: "Su fotografía, nombre y estatus no aparecen en un feed y no se indexan en buscadores.",
        },
        {
          title: "Confidencialidad",
          text: "El equipo y los miembros trabajan bajo un deber estricto de reserva.",
        },
        {
          title: "Solo lo necesario",
          text: "Solicitamos lo que hace falta para una presentación considerada y no compartimos información con terceros.",
        },
      ],
    },
    quiz: {
      eyebrow: "Compatibilidad con el club",
      title: "Tres preguntas sobre su formato",
      description:
        "Una breve selección para ver si su intención coincide con el matchmaking cerrado de Tango Slavique.",
      profile: "Perfil de interés",
      fit: "Encaja con nosotros",
      transferred:
        "Sus respuestas ya están en la solicitud de abajo. Solo falta indicar su nombre y WhatsApp.",
      goalLabel: "Propósito",
      geographyLabel: "Geografía",
      interviewLabel: "Entrevista",
      stepGoal: "Su propósito principal",
      stepGeography: "Geografía de la búsqueda",
      stepInterview:
        "¿Está dispuesto a una entrevista personal de verificación?",
      interviewHint:
        "Una conversación confidencial con un curador: sin perfil publicado y sin catálogo abierto.",
      back: "Atrás",
      goalHints: {
        family: "Busco un compañero para el matrimonio y una vida familiar común.",
        longterm:
          "Estoy listo para una relación profunda con un horizonte de años por delante.",
      },
      geographyHints: {
        spain: "Barcelona, Madrid, Valencia, Marbella y otras ciudades.",
        europe: "Estoy abierto a encuentros en capitales europeas.",
        international: "La búsqueda no se limita a un solo país.",
      },
      goals: {
        family: "Formar una familia y contraer matrimonio",
        longterm: "Una relación seria a largo plazo",
      },
      geography: {
        spain: "España",
        europe: "Toda Europa",
        international: "Búsqueda internacional",
      },
      interviewReady: "Sí, acepto una conversación confidencial",
    },
    form: {
      eyebrow: "Consulta privada",
      title: "Dejar una solicitud",
      description:
        "Cuéntenos un poco de usted. Nos pondremos en contacto de forma personal: sin listas de correo ni perfil publicado.",
      fromQuiz: "Del cuestionario de compatibilidad",
      name: "Nombre",
      namePlaceholder: "Cómo debemos dirigirnos a usted",
      phone: "Teléfono / WhatsApp",
      city: "Ciudad de residencia",
      cityPlaceholder: "Seleccione una ciudad",
      lookingFor: "A quién busca",
      woman: "Una mujer",
      man: "Un hombre",
      privacyPrefix: "Acepto la ",
      privacyLink: "Política de Privacidad",
      privacySuffix: " y el tratamiento confidencial de mis datos.",
      submit: "Enviar solicitud",
      submitError:
        "No se pudo enviar la solicitud. Inténtelo de nuevo o escríbanos por WhatsApp.",
      successTitle: "APPLICATION RECEIVED",
      successText:
        "La discreción es nuestro pacto mutuo. El comité de admisión revisa cada solicitud de forma individual. Si es aceptada, nuestro conserje se pondrá en contacto de forma privada por WhatsApp.",
      successReturn: "RETURN TO SITE",
      cities: {
        barcelona: "Barcelona",
        madrid: "Madrid",
        valencia: "Valencia",
        marbella: "Marbella",
        other: "Otro país",
      },
    },
    apply: {
      back: "Volver al inicio",
      age: "Edad",
      agePlaceholder: "Su edad",
      cityText: "Ciudad",
      cityPlaceholder: "Barcelona, Madrid…",
      men: {
        title: "Tango Slavique Man",
        subtitle:
          "Matchmaking privado, presentaciones a medida, discreción absoluta",
        termsLabel: "Membresía",
        terms: "Tasa de inscripción de 1.000 € + 400 € mensuales.",
        valuesTitle: "What You Get",
        values: [
          "Un curador personal desde la primera conversación hasta la presentación.",
          "Selección manual de candidatas: nunca un catálogo, nunca un algoritmo.",
          "Encuentros organizados en Barcelona y en Europa.",
        ],
      },
      women: {
        title: "Apply as a Tango Slavique Woman",
        status: "Complimentary Membership by Selection",
        subtitle:
          "Admisión cerrada, por invitación: sin cuota y sin perfil público.",
        valuesTitle: "What You Get",
        values: [
          "Anonimato completo: sin catálogos abiertos ni perfiles públicos.",
          "Selección personal entre caballeros verificados del club.",
        ],
      },
    },
    footer: {
      tagline: "Matchmaking exclusivo para corazones con propósito",
      privacy: "Privacidad",
      legal: "Aviso legal",
      rights: "Todos los derechos reservados.",
      copyright: "© 2026 TangoSlavique. Todos los derechos reservados.",
      nav: {
        about: "Acerca de",
        how: "Cómo funciona",
        stories: "Historias",
        blog: "Blog",
        faq: "FAQ",
      },
      legalLinks: {
        terms: "Términos y condiciones",
        acceptable: "Uso aceptable",
        privacy: "Privacidad",
        refunds: "Reembolsos",
        support: "Soporte",
        law: "Fuerzas del orden",
      },
    },
    pages: {
      stories: {
        eyebrow: "Historias",
        title: "Presentaciones serenas, uniones duraderas",
        body: "Las historias de los miembros se comparten en privado. Esta página presentará relatos seleccionados cuando hayan sido autorizados.",
      },
      blog: {
        eyebrow: "Diario",
        title: "Notas de la casa",
        body: "Aquí aparecerán ensayos sobre la discreción, la correspondencia y el arte de una presentación considerada. Mientras tanto, puede solicitar una entrevista privada.",
      },
      faq: {
        eyebrow: "FAQ",
        title: "Preguntas de admisión",
        body: "Tango Slavique es un club cerrado. El ingreso es por solicitud, seguida de verificación y una conversación personal con el equipo. Para más preguntas, escriba a través del formulario de contacto.",
      },
      terms: {
        eyebrow: "Legal",
        title: "Términos y condiciones",
        body: "La pertenencia es por solicitud y está sujeta a verificación, discreción y las normas de Tango Slavique. El acuerdo completo se entrega durante la entrevista privada.",
      },
      acceptable: {
        eyebrow: "Legal",
        title: "Uso aceptable",
        body: "El club existe para presentaciones sinceras. La falsedad, el acoso o cualquier uso contrario a la discreción y el respeto no están permitidos y pueden suponer la exclusión inmediata.",
      },
      refunds: {
        eyebrow: "Legal",
        title: "Reembolsos",
        body: "Las cuotas de inscripción y mensuales se confirman en la entrevista privada. Las condiciones de reembolso, cuando procedan, constan en el acuerdo de pertenencia.",
      },
      support: {
        eyebrow: "Soporte",
        title: "Una respuesta personal",
        body: "Para preguntas de pertenencia, escriba a través del formulario de la página principal. El equipo del club responde en persona, sin listas de correo ni catálogo público.",
      },
      law: {
        eyebrow: "Legal",
        title: "Fuerzas del orden",
        body: "Las solicitudes lícitas de autoridades competentes pueden dirigirse a través del formulario de contacto, señaladas como consulta jurídica. Tango Slavique coopera cuando la ley lo exige, protegiendo la privacidad de los miembros en la medida permitida.",
      },
    },
    legal: {
      privacyTitle: "Política de privacidad",
      privacyP1:
        "Tango Slavique trata datos personales únicamente para revisar una solicitud, realizar la verificación y organizar encuentros privados. No publicamos perfiles, fotografías ni datos de contacto en abierto.",
      privacyP2:
        "La información no se comparte con terceros sin su consentimiento, salvo cuando la ley lo exija de forma expresa. Puede solicitar más información al equipo del club.",
      legalTitle: "Aviso legal",
      legalP1: "Tango Slavique",
      legalP2: "Un club privado de matchmaking. Barcelona / Europa.",
      legalP3:
        "Las solicitudes y las consultas jurídicas pueden dirigirse a través del formulario de la página principal.",
      home: "Volver a la página principal",
    },
    chat: {
      welcome:
        "Buenas tardes. Soy el conserje personal de Tango Slavique. ¿En qué puedo ayudarle respecto a la pertenencia al club?",
      name: "Conserje",
      dialog: "Conserje de Tango Slavique",
      close: "Cerrar el chat",
      open: "Abrir el conserje",
      closeFab: "Cerrar el conserje",
      input: "Mensaje al conserje",
      placeholder: "Escriba una pregunta…",
      send: "Enviar",
      apply: "Dejar una solicitud",
      unavailable:
        "El conserje no está disponible en este momento. Por favor, deje una solicitud en la página.",
      disconnected:
        "Se interrumpió la conexión. Deje una solicitud en la página: el equipo del club le responderá en persona.",
      prompts: [
        "¿Cómo se garantiza la confidencialidad?",
        "¿Quién puede convertirse en residente del club?",
        "¿Cuál es el formato del primer encuentro?",
      ],
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)["en"];
