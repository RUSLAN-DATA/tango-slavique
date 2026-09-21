export type InlineSpan = { text: string; bold?: boolean };

export type BlogBlock =
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; spans: InlineSpan[] }
  | { type: "list"; items: InlineSpan[][] }
  | { type: "quote"; spans: InlineSpan[] };

export type ParsedArticle = {
  title: string;
  subtitle: string;
  blocks: BlogBlock[];
};

export const BLOG_SYNTAX_HELP = [
  "# Heading",
  "## Subheading",
  "Normal paragraph.",
  "**Bold phrase**",
  "- List item",
  "> Quote",
].join("\n");

export const BLOG_IMAGE_GUIDE = {
  ratio: "16:9 or 3:2 landscape, or portrait — shown in full, not cropped",
  min: "800px on the long side",
  formats: "JPEG, PNG or WEBP",
  max: "10 MB",
  telegram: "Send as a file to keep the original. Telegram photos are compressed by Telegram.",
};

type TelegramEntity = {
  type?: string;
  offset?: number;
  length?: number;
  url?: string;
};

function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  const pattern = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      spans.push({ text: text.slice(last, match.index) });
    }
    spans.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    spans.push({ text: text.slice(last) });
  }
  return spans.filter((span) => span.text);
}

export function splitTitleBody(source: string): { title: string; body: string } {
  const lines = source.replace(/\r\n/g, "\n").trim().split("\n");
  const title = (lines[0] || "Untitled").replace(/^#\s+/, "").trim().slice(0, 160);
  const body = lines.slice(1).join("\n").trim();
  return { title, body };
}

export function parseArticleMarkdown(source: string): ParsedArticle {
  const normalized = source.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return { title: "", subtitle: "", blocks: [] };
  }
  const { title, body } = splitTitleBody(normalized);
  const lines = body.split("\n");
  let subtitle = "";
  let start = 0;
  if (lines[0]?.startsWith("## ")) {
    subtitle = lines[0].replace(/^##\s+/, "").trim();
    start = 1;
    while (lines[start] === "") start += 1;
  }

  const blocks: BlogBlock[] = [];
  let listItems: InlineSpan[][] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };

  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      flushList();
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      blocks.push({ type: "heading", text: line.replace(/^#\s+/, "").trim() });
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push({ type: "subheading", text: line.replace(/^##\s+/, "").trim() });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      listItems.push(parseInline(line.replace(/^[-*]\s+/, "")));
      continue;
    }
    flushList();
    if (line.startsWith("> ")) {
      blocks.push({ type: "quote", spans: parseInline(line.replace(/^>\s+/, "")) });
      continue;
    }
    blocks.push({ type: "paragraph", spans: parseInline(line) });
  }
  flushList();
  return { title, subtitle, blocks };
}

export function telegramEntitiesToMarkdown(
  text: string,
  entities: TelegramEntity[] | null | undefined
): string {
  if (!text) {
    return "";
  }
  if (!entities?.length) {
    return text;
  }
  const marks: Array<{ index: number; token: string; order: number }> = [];
  entities.forEach((entity, order) => {
    const start = typeof entity.offset === "number" ? entity.offset : -1;
    const length = typeof entity.length === "number" ? entity.length : 0;
    if (start < 0 || length <= 0) {
      return;
    }
    const end = start + length;
    if (entity.type === "bold" || entity.type === "strong") {
      marks.push({ index: start, token: "**", order });
      marks.push({ index: end, token: "**", order });
    } else if (entity.type === "italic" || entity.type === "emphasis") {
      marks.push({ index: start, token: "*", order });
      marks.push({ index: end, token: "*", order });
    } else if (entity.type === "blockquote") {
      marks.push({ index: start, token: "> ", order });
    }
  });
  marks.sort((a, b) => b.index - a.index || b.order - a.order);
  let result = text;
  for (const mark of marks) {
    result = result.slice(0, mark.index) + mark.token + result.slice(mark.index);
  }
  return result;
}
