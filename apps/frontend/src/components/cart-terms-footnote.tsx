import { cn } from '@namefi-astra/ui/lib/cn';

interface CartTermsFootnoteProps {
  className?: string;
}

/**
 * Footnote shown beneath the cart submit button: completing a purchase implies
 * agreement to Namefi's terms & conditions.
 */
export function CartTermsFootnote({ className }: CartTermsFootnoteProps) {
  return (
    <p
      className={cn('text-center text-[11px] text-muted-foreground', className)}
    >
      By purchasing domains, you agree to Namefi's{' '}
      <a
        href="https://namefi.io/tos"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-foreground"
      >
        terms of service
      </a>
      .
    </p>
  );
}
