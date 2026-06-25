import type { ParkFaqItem } from '@/lib/structured-data';

interface ParkFaqSectionProps {
  items: readonly ParkFaqItem[];
}

export function ParkFaqSection({ items }: ParkFaqSectionProps) {
  if (!items.length) return null;

  return (
    <section id="faq" className="scroll-mt-28 px-6 pb-16">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2 text-center lg:text-left">
          <h2 className="text-2xl font-semibold">
            Questions about this domain
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.question}
              className="rounded-lg border border-border/60 bg-background/80 p-5"
            >
              <h3 className="text-base font-semibold leading-snug text-foreground">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
