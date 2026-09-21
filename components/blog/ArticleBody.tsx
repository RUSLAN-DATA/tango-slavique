import type { BlogBlock, InlineSpan } from "@/lib/blog/format";

function Spans({ spans }: { spans: InlineSpan[] }) {
  return (
    <>
      {spans.map((span, index) =>
        span.bold ? <strong key={index}>{span.text}</strong> : <span key={index}>{span.text}</span>
      )}
    </>
  );
}

export function ArticleBody({
  title,
  subtitle,
  blocks,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  blocks: BlogBlock[];
  className?: string;
}) {
  return (
    <div className={className}>
      {title ? <h1 className="font-serif text-3xl text-white sm:text-4xl">{title}</h1> : null}
      {subtitle ? <p className="mt-4 text-lg font-light text-ivory/70">{subtitle}</p> : null}
      <div className="mt-8 space-y-5 text-sm leading-relaxed text-ivory/75">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h2 key={index} className="pt-4 font-serif text-2xl text-ivory">
                {block.text}
              </h2>
            );
          }
          if (block.type === "subheading") {
            return (
              <h3 key={index} className="pt-2 font-serif text-xl text-ivory/90">
                {block.text}
              </h3>
            );
          }
          if (block.type === "list") {
            return (
              <ul key={index} className="list-disc space-y-2 pl-5">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Spans spans={item} />
                  </li>
                ))}
              </ul>
            );
          }
          if (block.type === "quote") {
            return (
              <blockquote key={index} className="border-l border-gold/50 pl-4 italic text-ivory/80">
                <Spans spans={block.spans} />
              </blockquote>
            );
          }
          return (
            <p key={index}>
              <Spans spans={block.spans} />
            </p>
          );
        })}
      </div>
    </div>
  );
}
