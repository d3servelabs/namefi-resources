import { describe, expect, it } from 'vitest';

import {
  buildLeadgenCrmCsv,
  buildLeadgenCrmRows,
  isLeadgenCrmCsvExportAvailable,
} from './leadgen-export';

describe('buildLeadgenCrmRows', () => {
  it('exports one row per contact', () => {
    const rows = buildLeadgenCrmRows({
      leads: [
        {
          businessDomain: 'example.com',
          rationale: 'Strong category fit.',
          contacts: [
            {
              email: 'buyer@example.com',
              name: 'Jane Buyer',
              title: 'Founder',
              sourceUrl: 'https://example.com/team',
              context: 'Owns acquisition.',
            },
            {
              email: 'ops@example.com',
              name: null,
              title: null,
              sourceUrl: null,
              context: null,
            },
          ],
        },
      ],
    });

    expect(rows).toEqual([
      {
        company_domain: 'example.com',
        website: 'https://example.com',
        contact_email: 'buyer@example.com',
        contact_name: 'Jane Buyer',
        contact_title: 'Founder',
        lead_source: 'Namefi Outbound',
        lead_notes: 'Strong category fit.; Owns acquisition.',
        source_url: 'https://example.com/team',
      },
      {
        company_domain: 'example.com',
        website: 'https://example.com',
        contact_email: 'ops@example.com',
        contact_name: '',
        contact_title: '',
        lead_source: 'Namefi Outbound',
        lead_notes: 'Strong category fit.',
        source_url: '',
      },
    ]);
  });

  it('keeps lead-only rows when no contacts exist', () => {
    const rows = buildLeadgenCrmRows({
      leads: [
        {
          businessDomain: 'nocontact.com',
          rationale: 'Likely buyer, no public contact yet.',
          contacts: [],
        },
      ],
    });

    expect(rows).toEqual([
      {
        company_domain: 'nocontact.com',
        website: 'https://nocontact.com',
        contact_email: '',
        contact_name: '',
        contact_title: '',
        lead_source: 'Namefi Outbound',
        lead_notes: 'Likely buyer, no public contact yet.',
        source_url: '',
      },
    ]);
  });
});

describe('buildLeadgenCrmCsv', () => {
  it('escapes commas, quotes, and newlines', () => {
    const csv = buildLeadgenCrmCsv({
      leads: [
        {
          businessDomain: 'quoted.com',
          rationale: 'Fits "premium", category\nneeds.',
          contacts: [
            {
              email: 'lead@quoted.com',
              name: 'Sam, Buyer',
              title: 'Head of "Growth"',
              sourceUrl: 'https://quoted.com/about',
              context: 'Mentioned on "About" page.',
            },
          ],
        },
      ],
    });

    expect(csv).toBe(
      [
        'company_domain,website,contact_email,contact_name,contact_title,lead_source,lead_notes,source_url',
        'quoted.com,https://quoted.com,lead@quoted.com,"Sam, Buyer","Head of ""Growth""",Namefi Outbound,"Fits ""premium"", category\nneeds.; Mentioned on ""About"" page.",https://quoted.com/about',
      ].join('\r\n'),
    );
  });

  it('escapes CSV formula prefixes', () => {
    const csv = buildLeadgenCrmCsv({
      leads: [
        {
          businessDomain: 'formula.com',
          rationale: '=2+2',
          contacts: [
            {
              email: '+sales@example.com',
              name: null,
              title: '@admin',
              sourceUrl: null,
              context: '-10',
            },
          ],
        },
      ],
    });

    expect(csv).toBe(
      [
        'company_domain,website,contact_email,contact_name,contact_title,lead_source,lead_notes,source_url',
        "formula.com,https://formula.com,'+sales@example.com,,'@admin,Namefi Outbound,'=2+2; -10,",
      ].join('\r\n'),
    );
  });
});

describe('isLeadgenCrmCsvExportAvailable', () => {
  it('only allows successful runs', () => {
    expect(isLeadgenCrmCsvExportAvailable({ status: 'SUCCEEDED' })).toBe(true);
    expect(isLeadgenCrmCsvExportAvailable({ status: 'FAILED' })).toBe(false);
    expect(isLeadgenCrmCsvExportAvailable({ status: 'CANCELED' })).toBe(false);
    expect(isLeadgenCrmCsvExportAvailable({ status: 'RUNNING' })).toBe(false);
  });
});
