export type AdminIntent =
  | { type: "blog"; text: string }
  | { type: "attach"; name: string }
  | { type: "new_profile"; name: string }
  | { type: "unknown" };

export function parseAdminCaption(caption: string, hasPhoto: boolean): AdminIntent {
  const text = caption.trim();
  if (!text) {
    return { type: "unknown" };
  }

  if (/^\/blog\b/i.test(text) || /^blog[:\s]/i.test(text)) {
    return { type: "blog", text: text.replace(/^\/?blog[:\s]*/i, "").trim() || text };
  }

  const newProfile = text.match(/^(?:new profile|nuevo perfil)\s+([a-zA-ZÀ-ÿ' -]{2,40})$/i);
  if (newProfile) {
    return { type: "new_profile", name: newProfile[1].trim() };
  }

  if (hasPhoto && text.length >= 80) {
    return { type: "blog", text };
  }

  const attach = text.match(
    /^(?:profile photo|foto(?:\s+de)?|photo(?:\s+of)?)\s+([a-zA-ZÀ-ÿ' -]{2,40})$/i
  );
  if (attach) {
    return { type: "attach", name: attach[1].trim() };
  }

  const namedPhoto = text.match(/^([a-zA-ZÀ-ÿ' -]{2,40})\s+(?:profile(?:\s+photo)?|foto)$/i);
  if (namedPhoto) {
    return { type: "attach", name: namedPhoto[1].trim() };
  }

  if (hasPhoto && text.split(/\s+/).length <= 3 && text.length <= 40) {
    return { type: "attach", name: text };
  }

  return { type: "unknown" };
}
