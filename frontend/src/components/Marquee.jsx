const ITEMS = ["VENDE", "TROCA", "COMPRA", "FINANCIA", "MG CAR", "JOÃO PESSOA - PB"];

export default function Marquee() {
  const row = (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((item, i) => (
        <span key={item} className="flex items-center">
          <span className={`font-display text-2xl font-extrabold uppercase tracking-wide sm:text-3xl ${i % 2 ? "text-outline" : "text-brand-text"}`}>
            {item}
          </span>
          <span className="mx-6 h-2 w-2 rotate-45 bg-brand-lime sm:mx-8" aria-hidden="true" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden border-y border-brand-border bg-brand-card py-5" data-testid="editorial-marquee" aria-hidden="true">
      <div className="animate-marquee flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
}
