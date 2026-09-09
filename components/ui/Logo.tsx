type LogoProps = {
  className?: string;
  variant?: "default" | "gold";
};

export function Logo({ className = "", variant = "default" }: LogoProps) {
  const tangoClass = variant === "gold" ? "text-gold" : "text-ivory";

  return (
    <span
      className={`font-display text-[13px] font-medium tracking-[0.18em] sm:text-[15px] lg:text-base ${className}`}
    >
      <span className={tangoClass}>TANGO</span>{" "}
      <span className="text-gold">SLAVIQUE</span>
    </span>
  );
}
