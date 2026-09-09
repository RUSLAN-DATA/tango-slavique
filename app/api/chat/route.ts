import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Используем подтвержденные модели из актуального белого списка API
const CANDIDATE_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];

const SYSTEM_PROMPT = `You are the personal digital concierge for "Tango Slavique", an ultra-exclusive matchmaking club based in Barcelona.
Tone: Calm, discreet, elegant, concise, high-end European concierge.
Answers should be brief (1-3 sentences max).
Always complete your thoughts within 2-3 sentences. Never stop mid-sentence or leave trailing punctuation.
For men: membership is €1,000 enrollment + €400/month.
For women: application and selection are complimentary.
WhatsApp: +34 671 732 883. Direct candidates to fill out the application form.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    console.log("Gemini Key present:", !!apiKey);

    if (!apiKey) {
      console.error("[Chat API] GEMINI_API_KEY is missing in env!");
      return NextResponse.json(
        { reply: "Key error: GEMINI_API_KEY missing" },
        { status: 500 }
      );
    }

    const { message, history } = await req.json();
    const ai = new GoogleGenAI({ apiKey });

    const contents: Array<{
      role: "user" | "model";
      parts: Array<{ text: string }>;
    }> = [];

    if (Array.isArray(history)) {
      history.slice(-4).forEach(
        (h: { role?: string; text?: string; content?: string }) => {
          contents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text || h.content || "" }],
          });
        }
      );
    }

    contents.push({ role: "user", parts: [{ text: message }] });

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        });

        if (response.text) {
          return NextResponse.json({ reply: response.text.trim() });
        }
      } catch (err: unknown) {
        const messageText =
          err instanceof Error ? err.message : String(err);
        console.warn(`[Gemini Warn on ${model}]:`, messageText);
      }
    }

    return NextResponse.json({
      reply:
        "The concierge is momentarily engaged with another member. Please write to us privately on WhatsApp: +34 671 732 883 — we shall reply in person.",
    });
  } catch (error: unknown) {
    console.error("[Route Exception]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
