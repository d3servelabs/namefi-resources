import { toUnicodeDomainName } from '@namefi-astra/registrars/data/validations';
import { cn } from '@namefi-astra/ui/lib/cn';

/** Punycode → Unicode for display, falling back to the raw name on failure. */
export function toUnicodeDomainSafe(domain: string): string {
  try {
    return toUnicodeDomainName(domain);
  } catch {
    return domain;
  }
}

/** Whether a domain is internationalized (its Unicode form differs from ASCII). */
export function isInternationalizedDomain(domain: string): boolean {
  return toUnicodeDomainSafe(domain) !== domain;
}

/**
 * Canonical way to render a domain name for display.
 *
 * - English/ASCII domains render as the plain name.
 * - Internationalized (IDN) domains render their human-readable Unicode form,
 *   with the canonical punycode (`xn--…`) shown small beneath it so the two
 *   stay referenced together — no information is lost, and the friendly name
 *   leads.
 *
 * Always a `flex` column with `min-w-0` so both lines truncate inside
 * constrained rows. Pass visual classes (font, size, color) via `className`;
 * `items-center` centers it.
 */
export function DomainName({
  domain,
  className,
  punycodeClassName,
}: {
  domain: string;
  className?: string;
  punycodeClassName?: string;
}) {
  const unicode = toUnicodeDomainSafe(domain);
  const isIdn = unicode !== domain;

  return (
    <span
      className={cn('flex min-w-0 flex-col', className)}
      title={isIdn ? domain : undefined}
    >
      <span className="truncate">{unicode}</span>
      {isIdn ? (
        <span
          className={cn(
            'truncate font-normal text-muted-foreground text-xs',
            punycodeClassName,
          )}
        >
          {domain}
        </span>
      ) : null}
    </span>
  );
}
