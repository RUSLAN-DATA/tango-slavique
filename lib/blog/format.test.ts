import { describe, expect, it } from "vitest";
import { parseArticleMarkdown, telegramEntitiesToMarkdown } from "./format";

describe("blog structured text", () => {
  it("parses headings, bold, lists and quotes", () => {
    const parsed = parseArticleMarkdown(
      [
        "How to choose a house",
        "## A considered introduction",
        "# Why discretion matters",
        "A **private** circle, not an application.",
        "- Verified profiles",
        "- Personal interviews",
        "> Taste over volume",
      ].join("\n")
    );
    expect(parsed.title).toBe("How to choose a house");
    expect(parsed.subtitle).toBe("A considered introduction");
    expect(parsed.blocks[0]).toEqual({ type: "heading", text: "Why discretion matters" });
    expect(parsed.blocks.some((block) => block.type === "list")).toBe(true);
    expect(parsed.blocks.some((block) => block.type === "quote")).toBe(true);
    const paragraph = parsed.blocks.find((block) => block.type === "paragraph");
    expect(paragraph?.type === "paragraph" && paragraph.spans.some((span) => span.bold)).toBe(true);
  });

  it("converts Telegram bold entities into markdown", () => {
    expect(
      telegramEntitiesToMarkdown("Private matchmaking", [
        { type: "bold", offset: 0, length: 7 },
      ])
    ).toBe("**Private** matchmaking");
  });

  it("turns a fully bold Telegram line into a heading", () => {
    expect(
      telegramEntitiesToMarkdown("Why discretion matters", [{ type: "bold", offset: 0, length: 22 }])
    ).toBe("# Why discretion matters");
    const parsed = parseArticleMarkdown("A title\n**Why discretion matters**\nA **private** circle.");
    expect(parsed.blocks[0]).toEqual({ type: "heading", text: "Why discretion matters" });
  });
});
