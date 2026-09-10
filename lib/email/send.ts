export type EmailEvent =
  | "verification"
  | "welcome"
  | "application_submitted"
  | "application_under_review"
  | "application_approved"
  | "application_rejected"
  | "more_information_requested"
  | "match_proposal"
  | "match_accepted"
  | "introduction_scheduled"
  | "feedback_request"
  | "password_reset";

export type EmailPayload = {
  to: string;
  event: EmailEvent;
  locale?: "en" | "es";
  data?: Record<string, string>;
};

const copy: Record<
  "en" | "es",
  Record<EmailEvent, { subject: string; body: string }>
> = {
  en: {
    verification: {
      subject: "Confirm your Tango Slavique email",
      body: "Please confirm your email to continue your private application: {{link}}",
    },
    welcome: {
      subject: "Welcome to Tango Slavique",
      body: "Your email is confirmed. You may now complete your confidential application.",
    },
    application_submitted: {
      subject: "Application received",
      body: "We have received your application {{code}}. The house will review it privately.",
    },
    application_under_review: {
      subject: "Your application is under review",
      body: "Your file {{code}} is now being reviewed by the matchmaking team.",
    },
    application_approved: {
      subject: "Your application has been approved",
      body: "You have been admitted as a private member. The house will be in touch regarding introductions.",
    },
    application_rejected: {
      subject: "Application decision",
      body: "After review, we are unable to proceed with membership at this time.",
    },
    more_information_requested: {
      subject: "Further information requested",
      body: "The house needs additional information on your application. Please sign in to complete it.",
    },
    match_proposal: {
      subject: "A private introduction has been proposed",
      body: "You have a confidential matchmaking proposal. Sign in to respond.",
    },
    match_accepted: {
      subject: "Mutual consent received",
      body: "Both parties have accepted. The house will arrange an introduction.",
    },
    introduction_scheduled: {
      subject: "Your introduction has been scheduled",
      body: "Details of your private introduction are available in your account.",
    },
    feedback_request: {
      subject: "Private feedback requested",
      body: "Please share confidential feedback on your introduction.",
    },
    password_reset: {
      subject: "Reset your Tango Slavique password",
      body: "Use this link to choose a new password: {{link}}",
    },
  },
  es: {
    verification: {
      subject: "Confirme su correo de Tango Slavique",
      body: "Confirme su correo para continuar su solicitud privada: {{link}}",
    },
    welcome: {
      subject: "Bienvenida a Tango Slavique",
      body: "Su correo está confirmado. Ya puede completar su solicitud confidencial.",
    },
    application_submitted: {
      subject: "Solicitud recibida",
      body: "Hemos recibido su solicitud {{code}}. La casa la revisará en privado.",
    },
    application_under_review: {
      subject: "Su solicitud está en revisión",
      body: "Su expediente {{code}} está siendo revisado por el equipo.",
    },
    application_approved: {
      subject: "Su solicitud ha sido aprobada",
      body: "Ha sido admitido como miembro privado. La casa se pondrá en contacto.",
    },
    application_rejected: {
      subject: "Decisión sobre la solicitud",
      body: "Tras la revisión, no podemos continuar con la membresía en este momento.",
    },
    more_information_requested: {
      subject: "Se solicita más información",
      body: "La casa necesita información adicional. Inicie sesión para completarla.",
    },
    match_proposal: {
      subject: "Se ha propuesto una presentación privada",
      body: "Tiene una propuesta confidencial. Inicie sesión para responder.",
    },
    match_accepted: {
      subject: "Consentimiento mutuo recibido",
      body: "Ambas partes han aceptado. La casa organizará una presentación.",
    },
    introduction_scheduled: {
      subject: "Su presentación ha sido programada",
      body: "Los detalles de su presentación privada están en su cuenta.",
    },
    feedback_request: {
      subject: "Se solicita su opinión privada",
      body: "Comparta su valoración confidencial sobre la presentación.",
    },
    password_reset: {
      subject: "Restablezca su contraseña",
      body: "Use este enlace para elegir una nueva contraseña: {{link}}",
    },
  },
};

function interpolate(template: string, data?: Record<string, string>) {
  if (!data) {
    return template;
  }
  return Object.entries(data).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    template
  );
}

export async function sendEmail(payload: EmailPayload) {
  const locale = payload.locale === "es" ? "es" : "en";
  const template = copy[locale][payload.event];
  const subject = interpolate(template.subject, payload.data);
  const text = interpolate(template.body, payload.data);
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "Tango Slavique <noreply@tangoslavique.com>";

  if (!apiKey) {
    console.info("[email:dev]", { to: payload.to, event: payload.event, subject, text });
    return { delivered: false, mode: "log" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    console.error("[email:failed]", response.status);
    return { delivered: false, mode: "resend" as const };
  }

  return { delivered: true, mode: "resend" as const };
}
