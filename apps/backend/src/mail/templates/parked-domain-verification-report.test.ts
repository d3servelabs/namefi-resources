import { render } from '@react-email/render';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import {
  ParkedDomainVerificationReport,
  type ParkedDomainVerificationReportProps,
} from './parked-domain-verification-report';

/** react-email inserts `<!-- -->` between adjacent expressions; strip for asserts. */
const stripComments = (html: string) => html.replace(/<!--.*?-->/g, '');

const baseProps: ParkedDomainVerificationReportProps = {
  title: 'Weekly Parked-Domain Verification — 2026-06-22',
  generatedAt: '2026-06-22T08:00:00.000Z',
  totalParked: 1229,
  totalChecked: 1229,
  truncatedDomains: 0,
  counts: { pass: 1204, warn: 11, fail: 7, skipped: 7 },
  problems: [],
  problemsTruncated: false,
  adminUrl: 'https://astra.namefi.io/admin/parked-domains',
};

describe('ParkedDomainVerificationReport', () => {
  it('renders the healthy summary when there are no problems', async () => {
    const html = stripComments(
      await render(createElement(ParkedDomainVerificationReport, baseProps), {
        pretty: false,
      }),
    );
    expect(html).toContain('Weekly Parked-Domain Verification');
    expect(html).toContain('1204 pass');
    expect(html).toContain('All verified parked domains are healthy');
    expect(html).toContain('astra.namefi.io/admin/parked-domains');
  });

  it('renders a problems table with per-check statuses', async () => {
    const html = await render(
      createElement(ParkedDomainVerificationReport, {
        ...baseProps,
        counts: { pass: 1200, warn: 0, fail: 2, skipped: 7 },
        problems: [
          {
            domain: 'expired.com',
            mode: 'park',
            overall: 'fail',
            dns: 'pass',
            ssl: 'fail',
            serving: 'fail',
            redirect: 'pass',
            issues: ['SSL: Certificate expired.', 'Serving: unreachable.'],
          },
          {
            domain: 'badforward.com',
            mode: 'forward',
            overall: 'fail',
            dns: 'pass',
            ssl: 'pass',
            serving: 'skipped',
            redirect: 'fail',
            issues: ['Redirect: wrong target.'],
          },
        ],
      }),
      { pretty: false },
    );
    expect(html).toContain('domain(s) need attention');
    expect(html).toContain('expired.com');
    expect(html).toContain('badforward.com');
    expect(html).toContain('FAIL');
    expect(html).toContain('Certificate expired.');
  });

  it('notes truncation when the discovery cap was hit', async () => {
    const html = await render(
      createElement(ParkedDomainVerificationReport, {
        ...baseProps,
        totalParked: 12000,
        totalChecked: 10000,
        truncatedDomains: 2000,
      }),
      { pretty: false },
    );
    expect(html).toContain('2000 not checked');
  });
});
