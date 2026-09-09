type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const alignment =
    align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      <p className="mb-4 text-[11px] font-medium uppercase tracking-brand text-gold">
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl font-normal leading-tight text-ivory sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base font-light leading-relaxed text-ivory-muted md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
