export const leadgenCrmCsvHeaders = [
  'company_domain',
  'website',
  'contact_email',
  'contact_name',
  'contact_title',
  'lead_source',
  'lead_notes',
  'source_url',
] as const;

type LeadgenCrmContact = {
  email: string;
  name: string | null;
  title: string | null;
  sourceUrl: string | null;
  context: string | null;
};

type LeadgenCrmLead = {
  businessDomain: string;
  rationale: string;
  contacts: LeadgenCrmContact[];
};

export type LeadgenCrmExportRun = {
  leads: LeadgenCrmLead[];
};

type LeadgenCrmExportAvailability = {
  status: string;
};

type LeadgenCrmCsvRow = Record<(typeof leadgenCrmCsvHeaders)[number], string>;

const LEAD_SOURCE = 'Namefi Leadgen';
const CSV_ESCAPE_RE = /[",\r\n]/;

export function isLeadgenCrmCsvExportAvailable(
  run: LeadgenCrmExportAvailability,
) {
  return run.status === 'SUCCEEDED';
}

export function buildLeadgenCrmCsv(run: LeadgenCrmExportRun) {
  const rows = buildLeadgenCrmRows(run);

  return [
    leadgenCrmCsvHeaders.join(','),
    ...rows.map((row) =>
      leadgenCrmCsvHeaders
        .map((header) => escapeCsvCell(row[header]))
        .join(','),
    ),
  ].join('\r\n');
}

export function buildLeadgenCrmRows(run: LeadgenCrmExportRun) {
  return run.leads.flatMap((lead) => {
    if (lead.contacts.length === 0) {
      return [
        buildLeadgenCrmRow({
          lead,
          contact: null,
        }),
      ];
    }

    return lead.contacts.map((contact) =>
      buildLeadgenCrmRow({
        lead,
        contact,
      }),
    );
  });
}

function buildLeadgenCrmRow({
  lead,
  contact,
}: {
  lead: LeadgenCrmLead;
  contact: LeadgenCrmContact | null;
}): LeadgenCrmCsvRow {
  return {
    company_domain: lead.businessDomain,
    website: `https://${lead.businessDomain}`,
    contact_email: contact?.email ?? '',
    contact_name: contact?.name ?? '',
    contact_title: contact?.title ?? '',
    lead_source: LEAD_SOURCE,
    lead_notes: [lead.rationale, contact?.context].filter(Boolean).join('; '),
    source_url: contact?.sourceUrl ?? '',
  };
}

function escapeCsvCell(value: string) {
  if (!CSV_ESCAPE_RE.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}
