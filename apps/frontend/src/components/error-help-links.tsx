const DOCS_URL = 'https://docs.namefi.io';
const LLMS_TXT_URL = 'https://namefi.io/llms.txt';

/**
 * A subtle, crawlable help line for error pages. Kept understated for human
 * eyes ("docs", "llms.txt") while exposing real <a> links so search crawlers
 * and AI agents that hit an error page can still discover our documentation
 * and machine-readable guide instead of dead-ending on the 404/error screen.
 */
export function ErrorHelpLinks({ className = 'mt-8' }: { className?: string }) {
  return (
    <p
      className={`text-xs text-muted-foreground/60 ${className}`.trim()}
      data-testid="error-help-links"
    >
      For developers &amp; AI agents:{' '}
      <a
        href={DOCS_URL}
        className="underline underline-offset-2 hover:text-muted-foreground"
      >
        docs
      </a>
      {' · '}
      <a
        href={LLMS_TXT_URL}
        className="underline underline-offset-2 hover:text-muted-foreground"
      >
        llms.txt
      </a>
    </p>
  );
}
