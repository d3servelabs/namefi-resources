// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { Button } from '@react-email/components';
import punycode from 'punycode';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { Card } from '../components/card';
import { GoToDashboard } from '../components/go-to-dashboard';
import { NamefiEmailLinks } from '../email-links';
import { buildTemplate } from '../components/build-template';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import * as styles from '../styles';

/**
 * Terminal-state notification kinds for the deferred-DS workflow. Mirrors
 * `DeferredDsOutcome` in `dnssec.activities.ts`. The template adapts copy
 * and Card variant per kind so all five outcomes share one layout.
 */
export type DnssecDeferredDsOutcomeKind =
  | 'success'
  | 'authoritative-timeout'
  | 'public-dns-timeout'
  | 'cancelled'
  | 'failed';

export type DnssecDeferredDsOutcomeProps = {
  recipientName: string;
  /**
   * The user's primary email. Required by the repo's email-template contract
   * (`apps/backend/src/mail/.claude-rules`) so downstream tracking and
   * unsubscribe hooks can resolve the recipient without going back through
   * the activity.
   */
  recipientEmail: string;
  /**
   * Powered-by-Namefi domain override. `null` for normal Namefi-branded
   * email; a 3LD parent domain when the user signed up through a PBN tenant.
   * Forwarded to `usePoweredByNamefiDomain` so all generated links carry the
   * right utm + tracking params.
   */
  poweredByNamefiDomain?: string | null;
  /** Punycode (LDH) domain name. Unicode form is auto-rendered alongside. */
  domain: string;
  outcome: DnssecDeferredDsOutcomeKind;
};

type OutcomeCopy = {
  /** Subject line + container title (with "[Namefi]" prefix). */
  title: string;
  /** Short opener under the greeting. One short sentence. */
  intro: string;
  /** Main body shown inside the Card. Plain language; no DNS jargon. */
  body: string;
  /** Card visual treatment. */
  variant: 'success' | 'warning' | 'info' | 'error';
  /** CTA button label (verb + noun per UX copywriting guidelines). */
  ctaLabel: string;
};

function copyForOutcome(
  outcome: DnssecDeferredDsOutcomeKind,
  displayName: string,
): OutcomeCopy {
  switch (outcome) {
    case 'success':
      return {
        title: `[Namefi] DNSSEC is now active for ${displayName}`,
        intro: 'Good news!',
        body: `We finished setting up DNSSEC for ${displayName}. The change should be reflected globally within a few hours.`,
        variant: 'success',
        ctaLabel: 'View DNS settings',
      };
    case 'authoritative-timeout':
      return {
        title: `[Namefi] DNSSEC setup didn't complete for ${displayName}`,
        intro: 'A quick update on your DNSSEC setup.',
        body: `We waited for your DNS provider to publish the DNSSEC key for ${displayName}, but it didn't appear in time. We didn't make any changes to your domain. Once you've enabled DNSSEC at your DNS provider, head back to your DNS settings to try again.`,
        variant: 'warning',
        ctaLabel: 'Open DNS settings',
      };
    case 'public-dns-timeout':
      return {
        title: `[Namefi] DNSSEC setup is still propagating for ${displayName}`,
        intro: 'A quick update on your DNSSEC setup.',
        body: `Your DNS provider has published the DNSSEC key for ${displayName}, but the change hasn't reached the rest of the world yet. Propagation can take a few hours to a couple of days. We didn't make any changes to your domain — head back to your DNS settings to try again once propagation completes.`,
        variant: 'warning',
        ctaLabel: 'Open DNS settings',
      };
    case 'cancelled':
      return {
        title: `[Namefi] DNSSEC setup cancelled for ${displayName}`,
        intro: 'Confirming your action.',
        body: `You cancelled the DNSSEC setup for ${displayName}. No changes were made. You can start again any time from your DNS settings.`,
        variant: 'info',
        ctaLabel: 'Open DNS settings',
      };
    case 'failed':
      return {
        title: `[Namefi] We couldn't finish DNSSEC setup for ${displayName}`,
        intro: 'Sorry about this.',
        body: `Something went wrong while we were setting up DNSSEC for ${displayName}. No changes were made to your domain. Please try again from your DNS settings — if it keeps happening, reach out to support@namefi.io and we'll help.`,
        variant: 'error',
        ctaLabel: 'Open DNS settings',
      };
  }
}

function toDisplayName(domain: string): string {
  const unicode = punycode.toUnicode(domain);
  return unicode === domain ? domain : `${domain} (${unicode})`;
}

/**
 * Default preview/sample props consumed by react-email's dev server. Held in
 * a named const so `buildTemplate` and the explicit `.PreviewProps` assignment
 * below stay in lockstep — `buildTemplate` already wires the `.PreviewProps`
 * attribute from its second argument, the explicit assignment satisfies the
 * documented `Component.PreviewProps = ...` rule in
 * `apps/backend/src/mail/.claude-rules`.
 */
const previewProps: DnssecDeferredDsOutcomeProps = {
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  poweredByNamefiDomain: null,
  domain: 'example.com',
  outcome: 'public-dns-timeout',
};

export const DnssecDeferredDsOutcome =
  buildTemplate<DnssecDeferredDsOutcomeProps>((props) => {
    const { recipientName, domain, outcome } = props;
    const poweredByNamefiDomain = usePoweredByNamefiDomain(
      props.poweredByNamefiDomain,
    );
    const displayName = toDisplayName(domain);
    const copy = copyForOutcome(outcome, displayName);

    return (
      <NamefiEmailContainer title={copy.title}>
        <div style={styles.paragraph}>Hi {recipientName || 'there'},</div>
        <div style={{ ...styles.paragraph, marginTop: '8px' }}>
          {copy.intro}
        </div>
        <Card variant={copy.variant} style={{ marginTop: '12px' }}>
          <div style={styles.panelText}>{copy.body}</div>
        </Card>
        <Button
          className="namefi-button-mobile"
          style={{ ...styles.button, marginTop: '12px' }}
          href={NamefiEmailLinks.domainSettings({
            domain,
            poweredByNamefiDomain,
          })}
        >
          {copy.ctaLabel}
        </Button>
        <div style={{ ...styles.paragraph, marginTop: '12px' }}>
          Questions? Reach out to support@namefi.io and we'll help.
        </div>
        <GoToDashboard />
      </NamefiEmailContainer>
    );
  }, previewProps);

DnssecDeferredDsOutcome.PreviewProps = previewProps;

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DnssecDeferredDsOutcome;
