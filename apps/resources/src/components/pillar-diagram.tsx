// A compact "structural visual" for a topic pillar: an ordered, responsive flow
// of labeled steps connected by arrows. Pure layout (no raster asset) so it is
// crisp at any size, dark-theme native, tiny, accessible, and localized — the
// step labels come pre-localized from the cluster's taxonomy `diagram`.
export function PillarDiagram({
  steps,
  label,
}: {
  steps: string[];
  label: string;
}) {
  if (steps.length === 0) return null;

  return (
    <figure aria-label={label} className="m-0">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {steps.map((step, index) => (
          <li key={`${index}-${step}`} className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-3.5 py-2 text-sm font-medium text-foreground">
              <span
                aria-hidden="true"
                className="text-xs font-semibold text-brand-primary"
              >
                {index + 1}
              </span>
              {step}
            </span>
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className="text-muted-foreground rtl:-scale-x-100"
              >
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </figure>
  );
}
