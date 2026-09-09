import { NextRequest, NextResponse } from "next/server";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function firstValue(...values: unknown[]) {
  for (const value of values) {
    const text = asString(value);
    if (text) {
      return text;
    }
  }
  return "";
}

function makeApplicationId() {
  return `#TS-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    const applicationId =
      firstValue(body.applicationId) || makeApplicationId();
    const language = (firstValue(body.language) || "EN").toUpperCase();
    const applicant = firstValue(body.applicant, body.track);
    const purpose = firstValue(body.purpose, body.goal);
    const name = firstValue(body.contact, body.name);
    const phone = firstValue(body.phone, body.whatsapp);
    const age = firstValue(body.age);
    const details = firstValue(
      body.details,
      [age, body.city, body.lookingFor, body.geography, body.interviewReady]
        .map((item) => asString(item))
        .filter(Boolean)
        .join(" · ")
    );

    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

    if (!token || !chatId) {
      console.error("[Telegram Lead] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing");
      return NextResponse.json(
        { success: false, error: "Telegram is not configured" },
        { status: 500 }
      );
    }

    const textMessage = [
      `<b>🏆 НОВАЯ ЗАЯВКА TANGO SLAVIQUE [${escapeHtml(applicationId)}]</b>`,
      "━━━━━━━━━━━━━━━━━━━━",
      `🌐 <b>Язык сайта:</b> ${escapeHtml(language)}`,
      `🎩 <b>Анкета:</b> ${escapeHtml(applicant || "Не указано")}`,
      `🎯 <b>Цель / Purpose:</b> ${escapeHtml(purpose || "Не указано")}`,
      `👤 <b>Имя / Контакт:</b> ${escapeHtml(name || "Не указано")}`,
      `📱 <b>Телефон / WhatsApp:</b> ${escapeHtml(phone || "Не указано")}`,
      `📍 <b>Возраст / Город / Детали:</b> ${escapeHtml(details || "Не указано")}`,
      "━━━━━━━━━━━━━━━━━━━━",
    ].join("\n");

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: textMessage,
          parse_mode: "HTML",
        }),
      }
    );

    console.log("[Telegram Lead Sent]:", telegramResponse.status);

    if (!telegramResponse.ok) {
      const errorBody = await telegramResponse.text();
      console.error("[Telegram Lead Failed]:", errorBody);
      return NextResponse.json(
        { success: false, error: "Telegram delivery failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, id: applicationId });
  } catch (error: unknown) {
    console.error("[Application Route Exception]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
