export function SectionSeams() {
  return (
    <>
      <div
        aria-hidden
        className="bg-seam-top pointer-events-none absolute inset-0 z-[1]"
      />
      <div
        aria-hidden
        className="bg-seam-bottom pointer-events-none absolute inset-0 z-[1]"
      />
    </>
  );
}
